import core from './worker.js';

const MODEL='@cf/black-forest-labs/flux-2-klein-9b';
const MAX_BYTES=2_500_000;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
const DIRECTIONS=new Set(['+10','-5','-10','-15','-20','-25']);
const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
let photoSchemaReady=false;

export async function shiftVisualiseRoutes(request,env,ctx){
  const url=new URL(request.url);
  const path=url.pathname;
  if(!path.startsWith('/v1/shift/visualise')&&!path.startsWith('/v1/shift/progress-photo')) return null;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders(request)});

  const a=await auth(request,env,ctx);
  if(a.response) return withCors(a.response,request);

  if(path==='/v1/shift/visualise'){
    if(request.method!=='POST') return json({ok:false,error:'method_not_allowed'},405,request);
    return generateVisualisation(request,env,a.user);
  }
  if(path==='/v1/shift/progress-photo'){
    if(request.method==='POST') return saveProgressPhoto(request,env,a.user);
    if(request.method==='GET') return listProgressPhotos(request,env,a.user);
    return json({ok:false,error:'method_not_allowed'},405,request);
  }
  const imageMatch=path.match(/^\/v1\/shift\/progress-photo\/(\d+)\/image$/);
  if(imageMatch&&request.method==='GET') return getProgressPhotoImage(request,env,a.user,Number(imageMatch[1]));
  const deleteMatch=path.match(/^\/v1\/shift\/progress-photo\/(\d+)$/);
  if(deleteMatch&&request.method==='DELETE') return deleteProgressPhoto(request,env,a.user,Number(deleteMatch[1]));
  return json({ok:false,error:'not_found'},404,request);
}

async function generateVisualisation(request,env,user){
  if(!env.AI?.run) return json({ok:false,error:'ai_unavailable'},503,request);
  let form;
  try{form=await request.formData();}catch{return json({ok:false,error:'invalid_multipart'},400,request);}
  const image=form.get('image');
  const direction=String(form.get('direction')||'').trim();
  const consent=String(form.get('consent')||'')==='true';
  if(!consent) return json({ok:false,error:'consent_required'},400,request);
  if(!DIRECTIONS.has(direction)) return json({ok:false,error:'invalid_direction',allowed:[...DIRECTIONS]},400,request);
  const checked=validateImage(image);
  if(checked) return json(checked.body,checked.status,request);

  const pct=Number(direction);
  const lower=pct<0;
  const amount=Math.abs(pct);
  const prompt=lower
    ? `Edit the supplied photograph of the same adult person. Preserve identity, face, hair, age, pose, clothing, background, lighting and camera angle. Create a realistic, proportionate illustration of the same person at approximately ${amount} percent lower body weight. The change should be natural and consistent across the body, becoming more noticeable as the percentage increases while remaining plausible. Do not make them muscular, younger, glamorous or medically transformed. Keep it photorealistic and recognisably the same person.`
    : `Edit the supplied photograph of the same adult person. Preserve identity, face, hair, age, pose, clothing, background, lighting and camera angle. Create a realistic, proportionate illustration of the same person at approximately ${amount} percent higher body weight. Do not exaggerate, stigmatise or caricature. Keep it photorealistic and recognisably the same person.`;

  const modelForm=new FormData();
  modelForm.append('prompt',prompt);
  modelForm.append('input_image_0',new File([await image.arrayBuffer()],'member-image',{type:image.type}));
  modelForm.append('width','512');
  modelForm.append('height','512');
  modelForm.append('guidance','3.5');
  const modelRequest=new Request('https://shift.invalid/visualise',{method:'POST',body:modelForm});
  const contentType=modelRequest.headers.get('content-type');
  const result=await env.AI.run(MODEL,{multipart:{body:modelRequest.body,contentType}});
  const b64=result?.image;
  if(!b64) return json({ok:false,error:'generation_failed'},502,request);

  try{
    await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_visualise_generated',?,?)`)
      .bind(`user:${user.id}`,JSON.stringify({direction,model:MODEL,stored:false})).run();
  }catch{}
  return json({ok:true,visualisation:{direction,mime:'image/png',imageBase64:b64,stored:false},disclaimer:'Illustrative AI visualisation only. This is not a prediction of exactly how you will look and is not a clinical assessment.'},200,request);
}

async function saveProgressPhoto(request,env,user){
  await ensurePhotoSchema(env.DB);
  let form;
  try{form=await request.formData();}catch{return json({ok:false,error:'invalid_multipart'},400,request);}
  const image=form.get('image');
  const consent=String(form.get('consent')||'')==='true';
  if(!consent) return json({ok:false,error:'consent_required'},400,request);
  const checked=validateImage(image);
  if(checked) return json(checked.body,checked.status,request);
  const weightKg=numberOrNull(form.get('weightKg'));
  const waistCm=numberOrNull(form.get('waistCm'));
  const capturedAt=String(form.get('capturedAt')||'').trim()||new Date().toISOString();
  const source=String(form.get('source')||'upload').trim().slice(0,30)||'upload';
  const bytes=await image.arrayBuffer();
  await env.DB.prepare(`INSERT INTO shift_progress_photos(user_id,mime_type,image_data,weight_kg,waist_cm,captured_at,source,is_original,created_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(user.id,image.type,bytes,weightKg,waistCm,capturedAt,source,1).run();
  const row=await env.DB.prepare(`SELECT id,captured_at,weight_kg,waist_cm,source,created_at FROM shift_progress_photos WHERE user_id=? ORDER BY id DESC LIMIT 1`).bind(user.id).first();
  try{await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_progress_photo_saved',?,?)`).bind(`user:${user.id}`,JSON.stringify({photoId:row?.id||null,mime:image.type,size:image.size})).run();}catch{}
  return json({ok:true,photo:row,stored:true,generated:false},201,request);
}

async function listProgressPhotos(request,env,user){
  await ensurePhotoSchema(env.DB);
  const {results=[]}=await env.DB.prepare(`SELECT id,captured_at,weight_kg,waist_cm,source,created_at FROM shift_progress_photos WHERE user_id=? AND deleted_at IS NULL ORDER BY captured_at DESC,id DESC LIMIT 24`).bind(user.id).all();
  return json({ok:true,photos:results.map(r=>({...r,imageUrl:`/v1/shift/progress-photo/${r.id}/image`}))},200,request);
}

async function getProgressPhotoImage(request,env,user,id){
  await ensurePhotoSchema(env.DB);
  const row=await env.DB.prepare(`SELECT mime_type,image_data FROM shift_progress_photos WHERE id=? AND user_id=? AND deleted_at IS NULL`).bind(id,user.id).first();
  if(!row) return json({ok:false,error:'not_found'},404,request);
  const headers={'Content-Type':row.mime_type||'image/jpeg','Cache-Control':'private, no-store',...corsHeaders(request)};
  return new Response(row.image_data,{status:200,headers});
}

async function deleteProgressPhoto(request,env,user,id){
  await ensurePhotoSchema(env.DB);
  await env.DB.prepare(`UPDATE shift_progress_photos SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND deleted_at IS NULL`).bind(id,user.id).run();
  return json({ok:true,deleted:true,id},200,request);
}

function validateImage(image){
  if(!(image instanceof File)) return {status:400,body:{ok:false,error:'image_required'}};
  if(!ALLOWED.has(image.type)) return {status:415,body:{ok:false,error:'unsupported_image_type'}};
  if(image.size<=0||image.size>MAX_BYTES) return {status:413,body:{ok:false,error:'image_too_large',maxBytes:MAX_BYTES}};
  return null;
}
function numberOrNull(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
async function ensurePhotoSchema(db){
  if(photoSchemaReady) return;
  await db.exec(`CREATE TABLE IF NOT EXISTS shift_progress_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    image_data BLOB NOT NULL,
    weight_kg REAL,
    waist_cm REAL,
    captured_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'upload',
    is_original INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_shift_progress_photos_user ON shift_progress_photos(user_id,captured_at,id);`);
  photoSchemaReady=true;
}
async function auth(request,env,ctx){
  const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!r.ok) return {response:r};
  return {user:(await r.json()).user};
}
function corsHeaders(request){
  const origin=request.headers.get('Origin')||'';
  const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
  if(ALLOWED_ORIGINS.has(origin)) h['Access-Control-Allow-Origin']=origin;
  return h;
}
function withCors(response,request){
  const headers=new Headers(response.headers);
  for(const [k,v] of Object.entries(corsHeaders(request))) headers.set(k,v);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
function json(data,status=200,request){
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...corsHeaders(request)};
  return new Response(JSON.stringify(data),{status,headers});
}
