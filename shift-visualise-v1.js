import {authenticateMember} from './member-state-fast-v1.js';
import {trackingConsent} from './member-experience/health-routes.mjs';
import core from './worker.js';

const MODEL='@cf/black-forest-labs/flux-2-klein-9b';
const MAX_BYTES=2_500_000;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
const DIRECTIONS=new Set(['+10','-5','-10','-15','-20','-25']);
const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const photoSchemas=new WeakMap();

export async function shiftVisualiseRoutes(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/v1/shift/visualise')&&!path.startsWith('/v1/shift/progress-photo'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(request)});
  if(path.startsWith('/v1/shift/progress-photo')&&['POST','DELETE'].includes(request.method)&&!ALLOWED_ORIGINS.has(request.headers.get('Origin')||''))return json({error:'origin_not_allowed'},403,request);
  const a=path.startsWith('/v1/shift/progress-photo')?await authenticateMember(request,env):await auth(request,env,ctx);if(a.response)return withCors(a.response,request);
  if(path.startsWith('/v1/shift/progress-photo')&&request.method!=='DELETE'&&!await photoTrackingAllowed(env.DB,a.user.id))return json({error:'health_consent_required',message:'Review optional health tracking before using your private photos.'},409,request);
  try{
    if(path==='/v1/shift/visualise'){
      if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405,request);
      return await generateVisualisation(request,env,a.user);
    }
    if(path==='/v1/shift/progress-photo'){
      if(request.method==='POST')return await saveProgressPhoto(request,env,a.user);
      if(request.method==='GET')return await listProgressPhotos(request,env,a.user);
      return json({ok:false,error:'method_not_allowed'},405,request);
    }
    const imageMatch=path.match(/^\/v1\/shift\/progress-photo\/(\d+)\/image$/);
    if(imageMatch&&request.method==='GET')return await getProgressPhotoImage(request,env,a.user,Number(imageMatch[1]));
    const deleteMatch=path.match(/^\/v1\/shift\/progress-photo\/(\d+)$/);
    if(deleteMatch&&request.method==='DELETE')return await deleteProgressPhoto(request,env,a.user,Number(deleteMatch[1]));
    return json({ok:false,error:'not_found'},404,request);
  }catch(e){
    console.error('shift_visualise_route_failed',path,e?.message,e?.stack);
    return json({ok:false,error:'progress_photo_service_error',message:'Shift could not complete that photo request. Please try again.'},500,request);
  }
}

async function generateVisualisation(request,env,user){
  if(!env.AI?.run)return json({ok:false,error:'ai_unavailable'},503,request);
  let form;try{form=await request.formData();}catch{return json({ok:false,error:'invalid_multipart'},400,request);}
  const image=form.get('image'),direction=String(form.get('direction')||'').trim(),consent=String(form.get('consent')||'')==='true';
  if(!consent)return json({ok:false,error:'consent_required'},400,request);
  if(!DIRECTIONS.has(direction))return json({ok:false,error:'invalid_direction',allowed:[...DIRECTIONS]},400,request);
  const checked=validateImage(image);if(checked)return json(checked.body,checked.status,request);
  const pct=Number(direction),amount=Math.abs(pct);
  const prompt=pct<0
    ?`Edit the supplied photograph of the same adult person. Preserve identity, face, hair, age, pose, clothing, background, lighting and camera angle. Create a realistic, proportionate illustration of the same person at approximately ${amount} percent lower body weight. The change should be natural and plausible. Do not make them muscular, younger, glamorous or medically transformed. Keep it photorealistic and recognisably the same person.`
    :`Edit the supplied photograph of the same adult person. Preserve identity, face, hair, age, pose, clothing, background, lighting and camera angle. Create a realistic, proportionate illustration of the same person at approximately ${amount} percent higher body weight. Do not exaggerate, stigmatise or caricature. Keep it photorealistic and recognisably the same person.`;
  const modelForm=new FormData();modelForm.append('prompt',prompt);modelForm.append('input_image_0',new File([await image.arrayBuffer()],'member-image',{type:image.type}));modelForm.append('width','512');modelForm.append('height','512');modelForm.append('guidance','3.5');
  const modelRequest=new Request('https://shift.invalid/visualise',{method:'POST',body:modelForm}),contentType=modelRequest.headers.get('content-type');
  const result=await env.AI.run(MODEL,{multipart:{body:modelRequest.body,contentType}}),b64=result?.image;
  if(!b64)return json({ok:false,error:'generation_failed'},502,request);
  try{await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_visualise_generated',?,?)`).bind(`user:${user.id}`,JSON.stringify({direction,model:MODEL,stored:false})).run();}catch{}
  return json({ok:true,visualisation:{direction,mime:'image/png',imageBase64:b64,stored:false},disclaimer:'Illustrative AI visualisation only. This is not a prediction of exactly how you will look and is not a clinical assessment.'},200,request);
}

async function saveProgressPhoto(request,env,user){
  await ensurePhotoSchema(env.DB);
  let form;try{const reader=request.body?.getReader();if(!reader)return json({error:'image_required'},400,request);let size=0;const chunks=[];while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>650000){await reader.cancel();return json({error:'photo_too_large'},413,request);}chunks.push(part.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('Content-Type')||''}}).formData();}catch{return json({ok:false,error:'invalid_multipart'},400,request);}
  const image=form.get('image'),consent=String(form.get('consent')||'')==='true';
  if(!consent)return json({ok:false,error:'consent_required'},400,request);
  const checked=validateImage(image);if(checked)return json(checked.body,checked.status,request);
  const weightKg=numberOrNull(form.get('weightKg')),waistCm=numberOrNull(form.get('waistCm')),capturedAt=String(form.get('capturedAt')||'').trim()||new Date().toISOString(),source=String(form.get('source')||'upload').trim().slice(0,30)||'upload',note=String(form.get('note')||'').trim(),operationId=String(form.get('operationId')||'').trim()||null;
  if(!Number.isFinite(Date.parse(capturedAt))||Date.parse(capturedAt)>Date.now()+60000||note.length>500||operationId!==null&&!/^[a-zA-Z0-9-]{8,100}$/.test(operationId)||form.get('weightKg')!==null&&(weightKg===null||weightKg<20||weightKg>400)||form.get('waistCm')!==null&&(waistCm===null||waistCm<30||waistCm>300))return json({error:'invalid_photo_details',message:'Check the date and optional measurements or note.'},400,request);
  if(image.size>512000)return json({error:'photo_too_large',message:'Choose a smaller photo (maximum 500 KB after resizing).'},413,request);
  const bytes=new Uint8Array(await image.arrayBuffer());
  if(!imageSignature(bytes,image.type))return json({error:'invalid_image'},415,request);
  const imageBase64=bytesToBase64(bytes);
  if(operationId){const old=await env.DB.prepare('SELECT * FROM shift_progress_photos_v2 WHERE user_id=? AND operation_id=?').bind(user.id,operationId).first();if(old){if(old.deleted_at)return json({error:'photo_deleted'},409,request);if(old.mime_type!==image.type||old.image_base64!==imageBase64||old.captured_at!==capturedAt||old.note!==note||old.weight_kg!==weightKg||old.waist_cm!==waistCm||old.source!==source)return json({error:'operation_conflict'},409,request);return json({ok:true,stored:true,generated:false,id:old.id},200,request);}}
  if(!await photoTrackingAllowed(env.DB,user.id))return json({error:'health_consent_required'},409,request);
  const row=await env.DB.prepare(`INSERT INTO shift_progress_photos_v2(user_id,mime_type,image_base64,weight_kg,waist_cm,captured_at,source,note,operation_id,is_original,created_at) SELECT ?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP WHERE (SELECT COUNT(*) FROM shift_progress_photos_v2 WHERE user_id=? AND deleted_at IS NULL)<60 RETURNING id,captured_at,weight_kg,waist_cm,source,note,created_at`).bind(user.id,image.type,imageBase64,weightKg,waistCm,capturedAt,source,note,operationId,user.id).first();
  if(!row)return json({error:'photo_limit',message:'You have 60 private photos. Delete one before adding another.'},409,request);
  try{await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_progress_photo_saved',?,?)`).bind(`user:${user.id}`,JSON.stringify({photoId:row?.id||null,mime:image.type,size:image.size,storage:'d1-text-v2'})).run();}catch{}
  return json({ok:true,photo:row,stored:true,generated:false},201,request);
}

async function listProgressPhotos(request,env,user){await ensurePhotoSchema(env.DB);const{results=[]}=await env.DB.prepare(`SELECT id,captured_at,weight_kg,waist_cm,source,note,created_at FROM shift_progress_photos_v2 WHERE user_id=? AND deleted_at IS NULL ORDER BY captured_at DESC,id DESC LIMIT 60`).bind(user.id).all();if(!await photoTrackingAllowed(env.DB,user.id))return json({error:'health_consent_required'},409,request);return json({ok:true,photos:results.map(r=>({...r,imageUrl:`/v1/shift/progress-photo/${r.id}/image`}))},200,request);}
async function getProgressPhotoImage(request,env,user,id){await ensurePhotoSchema(env.DB);const row=await env.DB.prepare(`SELECT mime_type,image_base64 FROM shift_progress_photos_v2 WHERE id=? AND user_id=? AND deleted_at IS NULL`).bind(id,user.id).first();if(!row)return json({ok:false,error:'not_found'},404,request);if(!await photoTrackingAllowed(env.DB,user.id))return json({error:'health_consent_required'},409,request);const bytes=base64ToBytes(row.image_base64);return new Response(bytes,{status:200,headers:{'Content-Type':row.mime_type||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...corsHeaders(request)}});}
async function deleteProgressPhoto(request,env,user,id){await ensurePhotoSchema(env.DB);const result=await env.DB.prepare('DELETE FROM shift_progress_photos_v2 WHERE id=? AND user_id=?').bind(id,user.id).run();if(!result.meta.changes)return json({error:'not_found'},404,request);return json({ok:true,deleted:true,id},200,request);}
async function photoTrackingAllowed(DB,id){if(!await trackingConsent(DB,id))return false;const state=await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(id).first();try{return JSON.parse(state?.preferences||'{}').myJourney?.setup?.paused!==true;}catch{return false;}}

function bytesToBase64(bytes){let out='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(out);}
function base64ToBytes(s){const bin=atob(String(s||'')),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
function validateImage(image){if(!(image instanceof File))return{status:400,body:{ok:false,error:'image_required'}};if(!ALLOWED.has(image.type))return{status:415,body:{ok:false,error:'unsupported_image_type'}};if(image.size<=0||image.size>MAX_BYTES)return{status:413,body:{ok:false,error:'image_too_large',maxBytes:MAX_BYTES}};return null;}
function imageSignature(b,type){return type==='image/jpeg'?b.length>3&&b[0]===255&&b[1]===216&&b[2]===255:type==='image/png'?b.length>8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n):type==='image/webp'?b.length>12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP':false;}
function numberOrNull(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
async function ensurePhotoSchema(db){
 if(photoSchemas.has(db))return photoSchemas.get(db);
 const work=(async()=>{await db.exec(`CREATE TABLE IF NOT EXISTS shift_progress_photos_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,mime_type TEXT NOT NULL,image_base64 TEXT NOT NULL,weight_kg REAL,waist_cm REAL,captured_at TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'upload',is_original INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,deleted_at TEXT,note TEXT NOT NULL DEFAULT '',operation_id TEXT);CREATE INDEX IF NOT EXISTS idx_shift_progress_photos_v2_user ON shift_progress_photos_v2(user_id,captured_at,id);`);
 const cols=(await db.prepare('PRAGMA table_info(shift_progress_photos_v2)').all()).results||[];
 if(!cols.some(c=>c.name==='note'))await db.exec("ALTER TABLE shift_progress_photos_v2 ADD COLUMN note TEXT NOT NULL DEFAULT ''");
 if(!cols.some(c=>c.name==='operation_id'))await db.exec('ALTER TABLE shift_progress_photos_v2 ADD COLUMN operation_id TEXT');
 await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_photo_operation ON shift_progress_photos_v2(user_id,operation_id)');})();
 photoSchemas.set(db,work);try{await work;}catch(e){photoSchemas.delete(db);throw e;}
}

async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
function corsHeaders(request){const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ALLOWED_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const headers=new Headers(response.headers);for(const[k,v]of Object.entries(corsHeaders(request)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...corsHeaders(request)}});}
