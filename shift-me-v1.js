import core from './worker.js';

const MODEL='@cf/black-forest-labs/flux-2-klein-9b';
const MAX_BYTES=3_000_000;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
let schemaReady=false;

export async function shiftMeRoutes(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/v1/shift-me'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(request)});
  const a=await auth(request,env,ctx);if(a.response)return withCors(a.response,request);
  try{
    await ensureSchema(env.DB);
    if(path==='/v1/shift-me/render'&&request.method==='POST')return await renderShiftMe(request,env,a.user);
    if(path==='/v1/shift-me'&&request.method==='GET')return await getShiftMe(request,env,a.user);
    if(path==='/v1/shift-me/image'&&request.method==='GET')return await getShiftMeImage(request,env,a.user);
    if(path==='/v1/shift-me'&&request.method==='DELETE')return await deleteShiftMe(request,env,a.user);
    return json({ok:false,error:'not_found'},404,request);
  }catch(e){
    console.error('shift_me_route_failed',path,e?.message,e?.stack);
    return json({ok:false,error:'shift_me_service_error',message:'Shift Me could not complete that request.'},500,request);
  }
}

async function renderShiftMe(request,env,user){
  if(!env.AI?.run)return json({ok:false,error:'ai_unavailable'},503,request);
  let form;try{form=await request.formData();}catch{return json({ok:false,error:'invalid_multipart'},400,request);}
  const image=form.get('image'),consent=String(form.get('consent')||'')==='true';
  if(!consent)return json({ok:false,error:'consent_required'},400,request);
  const checked=validateImage(image);if(checked)return json(checked.body,checked.status,request);
  const appearance=safeAppearance(form.get('appearance'));
  const prompt=`Create a photorealistic Shift Me portrait from the supplied photograph of the same adult man. Preserve his recognisable identity, face shape, hairline, hair colour, facial hair, apparent age, skin tone and ordinary body proportions. He should look like a normal bloke, not a fashion model or fitness influencer. Natural relaxed posture, neutral dark studio background, plain black crew-neck T-shirt with no logos or text. Do not make him younger, more muscular, leaner, taller, more glamorous or more symmetrical than the source. Do not change ethnicity or invent tattoos. Keep the result realistic, friendly and recognisably the same person. Framing: head to upper thighs, straight-on camera, realistic lighting. ${appearance.prompt}`;
  const negative='bodybuilder, six pack, fashion model, fitness model, superhero physique, glamour retouching, younger face, plastic skin, distorted hands, extra fingers, text, watermark, logo, brand mark, cartoon, anime';
  const modelForm=new FormData();
  modelForm.append('prompt',prompt);
  modelForm.append('negative_prompt',negative);
  modelForm.append('input_image_0',new File([await image.arrayBuffer()],'shift-me-source',{type:image.type}));
  modelForm.append('width','768');modelForm.append('height','1024');modelForm.append('guidance','3.5');
  const modelRequest=new Request('https://shift.invalid/shift-me',{method:'POST',body:modelForm});
  const result=await env.AI.run(MODEL,{multipart:{body:modelRequest.body,contentType:modelRequest.headers.get('content-type')}});
  const b64=result?.image;if(!b64)return json({ok:false,error:'generation_failed'},502,request);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO shift_me_v1(id,user_id,mime_type,image_base64,appearance_json,model,created_at,updated_at,deleted_at) VALUES(?,?,?,?,?,?,?, ?,NULL) ON CONFLICT(user_id) DO UPDATE SET id=excluded.id,mime_type=excluded.mime_type,image_base64=excluded.image_base64,appearance_json=excluded.appearance_json,model=excluded.model,updated_at=excluded.updated_at,deleted_at=NULL`).bind(id,user.id,'image/png',b64,JSON.stringify(appearance.data),MODEL,now,now).run();
  try{await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_me_generated',?,?)`).bind(`user:${user.id}`,JSON.stringify({shiftMeId:id,model:MODEL,sourceStored:false,generatedStored:true})).run();}catch{}
  return json({ok:true,shiftMe:{id,imageUrl:'/v1/shift-me/image',appearance:appearance.data,updatedAt:now},sourcePhotoStored:false,disclaimer:'Shift Me is an AI-generated visual likeness for Shift experiences. It is not identity verification, a body scan, a health assessment, a fit guarantee or a prediction of future appearance.'},201,request);
}

async function getShiftMe(request,env,user){
  const row=await env.DB.prepare(`SELECT id,appearance_json,model,created_at,updated_at FROM shift_me_v1 WHERE user_id=? AND deleted_at IS NULL LIMIT 1`).bind(user.id).first();
  if(!row)return json({ok:true,shiftMe:null},200,request);
  return json({ok:true,shiftMe:{id:row.id,imageUrl:'/v1/shift-me/image',appearance:parseJson(row.appearance_json),model:row.model,createdAt:row.created_at,updatedAt:row.updated_at}},200,request);
}

async function getShiftMeImage(request,env,user){
  const row=await env.DB.prepare(`SELECT mime_type,image_base64 FROM shift_me_v1 WHERE user_id=? AND deleted_at IS NULL LIMIT 1`).bind(user.id).first();
  if(!row)return json({ok:false,error:'not_found'},404,request);
  return new Response(base64ToBytes(row.image_base64),{status:200,headers:{'Content-Type':row.mime_type||'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...corsHeaders(request)}});
}

async function deleteShiftMe(request,env,user){
  await env.DB.prepare(`UPDATE shift_me_v1 SET deleted_at=CURRENT_TIMESTAMP,image_base64='' WHERE user_id=? AND deleted_at IS NULL`).bind(user.id).run();
  try{await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_me_deleted',?,?)`).bind(`user:${user.id}`,JSON.stringify({sourcePhotoStored:false})).run();}catch{}
  return json({ok:true,deleted:true},200,request);
}

function safeAppearance(raw){
  let data={};try{data=raw?JSON.parse(String(raw)):{};}catch{}
  const allowed={build:['Slim','Average','Stocky','Bigger bloke','Broad','Tall','Shorter'],hair:['Short','Shaved','Receding','Buzz cut','Curly','Longer','Bald'],facial:['Clean shaven','Stubble','Short beard','Full beard','Moustache','Goatee'],top:['Black tee','Olive tee','White tee','Black hoodie','Olive hoodie','Polo']};
  const clean={};for(const[k,values]of Object.entries(allowed)){if(values.includes(data[k]))clean[k]=data[k];}
  const prompt=Object.entries(clean).map(([k,v])=>`${k}: ${v}`).join(', ');
  return{data:clean,prompt:prompt?`Member-selected appearance cues: ${prompt}. Preserve these only where they do not conflict with the source photograph.`:''};
}
function validateImage(image){if(!(image instanceof File))return{status:400,body:{ok:false,error:'image_required'}};if(!ALLOWED.has(image.type))return{status:415,body:{ok:false,error:'unsupported_image_type'}};if(image.size<=0||image.size>MAX_BYTES)return{status:413,body:{ok:false,error:'image_too_large',maxBytes:MAX_BYTES}};return null;}
function base64ToBytes(s){const bin=atob(String(s||'')),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
function parseJson(s){try{return JSON.parse(s||'{}')}catch{return{}}}
async function ensureSchema(db){if(schemaReady)return;await db.exec(`CREATE TABLE IF NOT EXISTS shift_me_v1 (id TEXT PRIMARY KEY,user_id INTEGER NOT NULL UNIQUE,mime_type TEXT NOT NULL,image_base64 TEXT NOT NULL,appearance_json TEXT NOT NULL DEFAULT '{}',model TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,deleted_at TEXT);CREATE INDEX IF NOT EXISTS idx_shift_me_v1_user ON shift_me_v1(user_id,deleted_at);`);schemaReady=true;}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
function corsHeaders(request){const allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(allowed.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const headers=new Headers(response.headers);for(const[k,v]of Object.entries(corsHeaders(request)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...corsHeaders(request)}});}
