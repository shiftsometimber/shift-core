import core from './worker.js';

const MODEL='@cf/black-forest-labs/flux-2-klein-9b';
const FALLBACK_MODEL='@cf/black-forest-labs/flux-2-klein-4b';
const MAX_BYTES=3_000_000;
// FLUX.2 reference images must be smaller than 512x512. Keeping persisted output
// below that ceiling means the saved character can be used for the next edit.
const OUTPUT_SIZE=448;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
let schemaReady=false;

export async function shiftMeRoutes(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/v1/shift-me'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(request)});
  const a=await auth(request,env,ctx);if(a.response)return withCors(a.response,request);
  try{
    await ensureSchema(env.DB);
    if(path==='/v1/shift-me/create'&&request.method==='POST')return await createShiftMe(request,env,a.user);
    if(path==='/v1/shift-me/render'&&request.method==='POST')return await renderShiftMe(request,env,a.user);
    if(path==='/v1/shift-me/rerender'&&request.method==='POST')return await rerenderShiftMe(request,env,a.user);
    if(path==='/v1/shift-me'&&request.method==='GET')return await getShiftMe(request,env,a.user);
    if(path==='/v1/shift-me/image'&&request.method==='GET')return await getShiftMeImage(request,env,a.user);
    if(path==='/v1/shift-me'&&request.method==='DELETE')return await deleteShiftMe(request,env,a.user);
    return json({ok:false,error:'not_found'},404,request);
  }catch(e){console.error('shift_me_route_failed',path,e?.message,e?.stack);return json({ok:false,error:'shift_me_service_error',message:'Shift Me could not complete that request.'},500,request);}
}

async function createShiftMe(request,env,user){
  if(!env.AI?.run)return json({ok:false,error:'ai_unavailable'},503,request);
  let body;try{body=await request.json();}catch{return json({ok:false,error:'invalid_json'},400,request);}
  const appearance=safeAppearance(JSON.stringify(body?.appearance||{}),true);
  return await generateAndPersist(request,env,user,null,null,appearance,'creator-default');
}

async function renderShiftMe(request,env,user){
  if(!env.AI?.run)return json({ok:false,error:'ai_unavailable'},503,request);
  let form;try{form=await request.formData();}catch{return json({ok:false,error:'invalid_multipart'},400,request);}
  const image=form.get('image'),consent=String(form.get('consent')||'')==='true';
  if(!consent)return json({ok:false,error:'consent_required'},400,request);
  const checked=validateImage(image);if(checked)return json(checked.body,checked.status,request);
  const appearance=safeAppearance(form.get('appearance'),true);
  return await generateAndPersist(request,env,user,new Uint8Array(await image.arrayBuffer()),image.type,appearance,'source-photo');
}

async function rerenderShiftMe(request,env,user){
  if(!env.AI?.run)return json({ok:false,error:'ai_unavailable'},503,request);
  let body;try{body=await request.json();}catch{return json({ok:false,error:'invalid_json'},400,request);}
  const appearance=safeAppearance(JSON.stringify(body?.appearance||{}),true);
  const row=await env.DB.prepare(`SELECT mime_type,image_base64,appearance_json FROM shift_me_v1 WHERE user_id=? AND deleted_at IS NULL LIMIT 1`).bind(user.id).first();
  if(!row||!row.image_base64)return json({ok:false,error:'shift_me_required',message:'Create your Shift Me first.'},409,request);
  const inputBytes=base64ToBytes(row.image_base64);
  const dimensions=imageDimensions(inputBytes);
  if(dimensions&&(dimensions.width>=512||dimensions.height>=512))return json({ok:false,error:'shift_me_recreate_required',message:'This saved Shift Me uses the earlier image format. Delete it and create a fresh version once; future changes will then work normally.'},409,request);
  return await generateAndPersist(request,env,user,inputBytes,row.mime_type||'image/png',appearance,'existing-shift-me',parseJson(row.appearance_json));
}

async function generateAndPersist(request,env,user,inputBytes,inputType,appearance,sourceKind,previousAppearance={}){
  const identityPrompt=sourceKind==='creator-default'
    ? `Create one premium rounded 3D Shift Me character: a friendly ordinary ADULT UK bloke aged 35 to 55, with believable adult facial character and ordinary adult body proportions. He is a persistent member character with the polish of a high-end animated-film character or collectible figure, but he is original and must not resemble LEGO, Funko, a child, a baby, a foetus, a mannequin or a video-game default avatar. Establish a clear adult identity that can remain stable in later image-to-image rerenders.`
    : `Create the SAME premium rounded 3D Shift Me adult character from the supplied image. Identity lock is the highest priority: preserve recognisable adult facial identity, apparent age, ethnicity, eye identity and distinguishing facial proportions while translating him into the approved polished Shift character style.`;
  const explicitControls=renderDirectives(appearance.data),changes=changedDirectives(appearance.data,previousAppearance);
  const prompt=`EDIT PRIORITY — MEMBER CHANGES: ${changes} These changes are mandatory and must be immediately obvious in the returned image. ${identityPrompt} He must remain an ordinary adult bloke, not a fashion model or fitness model. Apply every member-selected appearance control visibly and literally while keeping him recognisably the same character on subsequent rerenders. ${appearance.prompt} EXACT VISUAL SPECIFICATION: ${explicitControls} The supplied image is identity reference only: it must never override a newly selected hair, facial-hair, face-shape, eye-colour, skin-tone, clothing, accessory, build or camera-view instruction. Use ordinary adult proportions, substantial formed limbs, clean healthy skin material and a relaxed upright stance. Do not beautify, slim, muscularise, de-age or alter height unless that specific member control requests it. Premium deep forest Shift studio with muted gold rim light and a subtle round display plinth. Full body must remain visible from hair to trainers with generous clear space around him. Camera angle MUST match the selected view exactly: Front = straight-on; Left side = exact left profile; Back = exact rear view; Right side = exact right profile. Clothing must match the selected garment and use only a subtle left-chest circular Shift S badge equivalent to 28–30mm on apparel; the badge must not appear in a back view. Do not invent tattoos or jewellery. The selected controls MUST cause obvious visual differences between renders without changing identity. Exclude identity drift, foetal or ultrasound appearance, incomplete or translucent skin, child/baby proportions, oversized head, bodybuilder or six-pack physique, superhero styling, glamour retouching, distorted hands, extra fingers, text, watermark, unrelated brands, LEGO bricks or minifigure anatomy, Funko proportions, mannequin or faceless-avatar styling.`;
  const result=await runImageModel(env,prompt,inputBytes,inputType);
  const modelUsed=result?._model||MODEL;
  const b64=result?.image;if(!b64)return json({ok:false,error:'generation_failed'},502,request);
  const outputMime=detectImageMime(base64ToBytes(b64));
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO shift_me_v1(id,user_id,mime_type,image_base64,appearance_json,model,created_at,updated_at,deleted_at) VALUES(?,?,?,?,?,?,?, ?,NULL) ON CONFLICT(user_id) DO UPDATE SET id=excluded.id,mime_type=excluded.mime_type,image_base64=excluded.image_base64,appearance_json=excluded.appearance_json,model=excluded.model,updated_at=excluded.updated_at,deleted_at=NULL`).bind(id,user.id,outputMime,b64,JSON.stringify(appearance.data),modelUsed,now,now).run();
  try{await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_me_generated',?,?)`).bind(`user:${user.id}`,JSON.stringify({shiftMeId:id,model:modelUsed,sourceStored:false,generatedStored:true,sourceKind,appearance:appearance.data})).run();}catch{}
  return json({ok:true,shiftMe:{id,imageUrl:'/v1/shift-me/image',appearance:appearance.data,updatedAt:now},sourcePhotoStored:false,sourceKind,disclaimer:'Shift Me is an AI-generated visual likeness or character for Shift experiences. It is not identity verification, a body scan, a health assessment, a fit guarantee or a prediction of future appearance.'},201,request);
}

async function runImageModel(env,prompt,inputBytes,inputType){
  let lastError=null;
  for(const model of [MODEL,FALLBACK_MODEL]){
    for(let attempt=0;attempt<2;attempt++){
      try{
        const modelForm=new FormData();
        modelForm.append('prompt',prompt);
        if(inputBytes?.length)modelForm.append('input_image_0',new File([inputBytes],'shift-me-input',{type:inputType||'image/png'}));
        modelForm.append('width',String(OUTPUT_SIZE));modelForm.append('height',String(OUTPUT_SIZE));modelForm.append('guidance','4.5');
        const formResponse=new Response(modelForm);
        const result=await env.AI.run(model,{multipart:{body:formResponse.body,contentType:formResponse.headers.get('content-type')}});
        if(result?.image)return{...result,_model:model};
        lastError=new Error(`Shift Me model ${model} returned no image.`);
      }catch(error){lastError=error}
      if(attempt===0)await new Promise(resolve=>setTimeout(resolve,300));
    }
  }
  throw lastError||new Error('Shift Me models failed.');
}

async function getShiftMe(request,env,user){const row=await env.DB.prepare(`SELECT id,appearance_json,model,created_at,updated_at FROM shift_me_v1 WHERE user_id=? AND deleted_at IS NULL LIMIT 1`).bind(user.id).first();if(!row)return json({ok:true,shiftMe:null},200,request);return json({ok:true,shiftMe:{id:row.id,imageUrl:'/v1/shift-me/image',appearance:parseJson(row.appearance_json),model:row.model,createdAt:row.created_at,updatedAt:row.updated_at}},200,request);}
async function getShiftMeImage(request,env,user){const row=await env.DB.prepare(`SELECT mime_type,image_base64 FROM shift_me_v1 WHERE user_id=? AND deleted_at IS NULL LIMIT 1`).bind(user.id).first();if(!row)return json({ok:false,error:'not_found'},404,request);return new Response(base64ToBytes(row.image_base64),{status:200,headers:{'Content-Type':row.mime_type||'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...corsHeaders(request)}});}
async function deleteShiftMe(request,env,user){await env.DB.prepare(`UPDATE shift_me_v1 SET deleted_at=CURRENT_TIMESTAMP,image_base64='' WHERE user_id=? AND deleted_at IS NULL`).bind(user.id).run();try{await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_me_deleted',?,?)`).bind(`user:${user.id}`,JSON.stringify({sourcePhotoStored:false})).run();}catch{}return json({ok:true,deleted:true},200,request);}

function changedDirectives(next,previous={}){
  const changed=Object.entries(next).filter(([key,value])=>previous[key]!==value);
  if(!changed.length)return'Apply the complete selected specification again; do not simply reproduce the input image.';
  return changed.map(([key,value])=>`CHANGE ${key.toUpperCase()} from ${previous[key]||'unset'} to ${value}`).join('. ')+'. Preserve every trait not listed as changed.';
}
function renderDirectives(data){
  const maps={
    build:{Slim:'noticeably slim ordinary build',Average:'average ordinary build',Stocky:'noticeably stocky build','Bigger bloke':'clearly bigger heavyset build',Broad:'broad solid build',Tall:'visibly tall long-limbed proportions',Shorter:'visibly shorter compact proportions'},
    face:{Round:'clearly round face and jawline',Oval:'clearly oval face',Square:'clearly square jaw and face','Longer':'clearly longer face','Fuller':'clearly fuller cheeks and face',Angular:'clearly angular cheekbones and jaw'},
    hair:{Short:'short neat adult haircut',Shaved:'fully shaved close-cropped head','Receding':'visibly receding short hair','Buzz cut':'uniform very short buzz cut',Curly:'clearly curly hair','Longer':'clearly longer adult hair',Bald:'completely bald scalp with no head hair'},
    hairline:{Full:'full low hairline',Mature:'natural mature hairline',Receding:'clearly receding hairline',High:'clearly high hairline',Shaved:'shaved hairline',Bald:'no hairline; bald scalp'},
    facial:{'Clean shaven':'completely clean-shaven face with no beard or moustache',Stubble:'obvious short even stubble','Short beard':'distinct short beard and moustache','Full beard':'distinct full thick beard and moustache',Moustache:'moustache only; clean-shaven chin and cheeks',Goatee:'goatee only around mouth and chin'},
    skin:{Light:'light skin tone','Light-medium':'light-medium skin tone',Medium:'medium skin tone',Olive:'olive skin tone',Brown:'brown skin tone',Deep:'deep dark skin tone'},
    eyes:{Brown:'clearly brown irises',Blue:'clearly blue irises',Green:'clearly green irises',Hazel:'clearly hazel irises',Grey:'clearly grey irises'},
    glasses:{'Keep source glasses':'retain the source glasses','No glasses':'no glasses or eyewear','Black rectangular':'black rectangular glasses','Black round':'black round glasses','Thin metal':'thin metal-frame glasses'},
    top:{'Black tee':'plain black short-sleeve crew-neck tee','Olive tee':'plain olive short-sleeve crew-neck tee','White tee':'plain white short-sleeve crew-neck tee','Grey marl vest':'grey marl sleeveless vest','Black polo':'black short-sleeve polo shirt','Black hoodie':'black pullover hoodie','Olive hoodie':'olive pullover hoodie','Black quarter zip':'black long-sleeve quarter-zip top'},
    bottom:{'Black shorts':'black above-knee training shorts','Olive joggers':'olive full-length joggers','Black joggers':'black full-length joggers'},
    accessory:{None:'no hat and no accessory','Black cap':'plain black baseball cap'},
    view:{Front:'exact straight-on front view','Left side':'exact 90-degree left profile view',Back:'exact straight-on rear view','Right side':'exact 90-degree right profile view'}
  };
  return Object.entries(data).map(([key,value])=>`${key}: ${maps[key]?.[value]||value}`).join('; ')+'.';
}

function safeAppearance(raw,withDefaults=false){
  let data={};try{data=raw?JSON.parse(String(raw)):{};}catch{}
  const allowed={
    build:['Slim','Average','Stocky','Bigger bloke','Broad','Tall','Shorter'],
    bodyShape:['Straight','Round middle','Broad shoulders','Narrow shoulders','Long torso','Short torso'],
    face:['Round','Oval','Square','Longer','Fuller','Angular'],
    hair:['Short','Shaved','Receding','Buzz cut','Curly','Longer','Bald'],
    hairline:['Full','Mature','Receding','High','Shaved','Bald'],
    facial:['Clean shaven','Stubble','Short beard','Full beard','Moustache','Goatee'],
    skin:['Light','Light-medium','Medium','Olive','Brown','Deep'],
    eyes:['Brown','Blue','Green','Hazel','Grey'],
    glasses:['Keep source glasses','No glasses','Black rectangular','Black round','Thin metal'],
    top:['Black tee','Olive tee','White tee','Grey marl vest','Black polo','Black hoodie','Olive hoodie','Black quarter zip'],
    bottom:['Black shorts','Olive joggers','Black joggers'],
    accessory:['None','Black cap'],
    view:['Front','Left side','Back','Right side']
  };
  const defaults={build:'Average',bodyShape:'Straight',face:'Oval',hair:'Short',hairline:'Mature',facial:'Clean shaven',skin:'Medium',eyes:'Brown',glasses:'No glasses',top:'Black tee',bottom:'Black shorts',accessory:'None',view:'Front'};
  const clean={};for(const[k,values]of Object.entries(allowed)){const value=data[k]??(withDefaults?defaults[k]:undefined);if(values.includes(value))clean[k]=value;}
  const labels={build:'body build',bodyShape:'body shape',face:'face shape',hair:'hair style',hairline:'hairline',facial:'facial hair',skin:'skin tone',eyes:'eye colour',glasses:'glasses',top:'top',bottom:'bottoms',accessory:'accessory',view:'camera view'};
  const prompt=Object.entries(clean).map(([k,v])=>`${labels[k]||k} = ${v}`).join('; ');
  return{data:clean,prompt:prompt?`MEMBER CONTROLS (apply visibly): ${prompt}. Where a deliberate member control conflicts with a supplied image, change ONLY that selected trait and preserve all other identity traits.`:''};
}
function validateImage(image){if(!(image instanceof File))return{status:400,body:{ok:false,error:'image_required'}};if(!ALLOWED.has(image.type))return{status:415,body:{ok:false,error:'unsupported_image_type'}};if(image.size<=0||image.size>MAX_BYTES)return{status:413,body:{ok:false,error:'image_too_large',maxBytes:MAX_BYTES}};return null;}
function base64ToBytes(s){const bin=atob(String(s||'')),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
function detectImageMime(bytes){
  if(bytes?.[0]===0xff&&bytes?.[1]===0xd8&&bytes?.[2]===0xff)return'image/jpeg';
  if(bytes?.[0]===0x89&&bytes?.[1]===0x50&&bytes?.[2]===0x4e&&bytes?.[3]===0x47)return'image/png';
  if(bytes?.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return'image/webp';
  return'application/octet-stream';
}
function imageDimensions(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length<24)return null;
  const signature=[137,80,78,71,13,10,26,10];
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(signature.every((value,index)=>bytes[index]===value))return{width:view.getUint32(16),height:view.getUint32(20)};
  if(bytes[0]!==0xff||bytes[1]!==0xd8)return null;
  const startOfFrame=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  let offset=2;
  while(offset+8<bytes.length){
    if(bytes[offset++]!==0xff)continue;
    while(bytes[offset]===0xff)offset++;
    const marker=bytes[offset++];
    if(marker===0xd8||marker===0xd9)continue;
    if(offset+1>=bytes.length)return null;
    const length=view.getUint16(offset);
    if(length<2||offset+length>bytes.length)return null;
    if(startOfFrame.has(marker)&&length>=7)return{width:view.getUint16(offset+5),height:view.getUint16(offset+3)};
    offset+=length;
  }
  return null;
}
function parseJson(s){try{return JSON.parse(s||'{}')}catch{return{}}}
async function ensureSchema(db){if(schemaReady)return;await db.exec(`CREATE TABLE IF NOT EXISTS shift_me_v1 (id TEXT PRIMARY KEY,user_id INTEGER NOT NULL UNIQUE,mime_type TEXT NOT NULL,image_base64 TEXT NOT NULL,appearance_json TEXT NOT NULL DEFAULT '{}',model TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,deleted_at TEXT);CREATE INDEX IF NOT EXISTS idx_shift_me_v1_user ON shift_me_v1(user_id,deleted_at);`);schemaReady=true;}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
function corsHeaders(request){const allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(allowed.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const headers=new Headers(response.headers);for(const[k,v]of Object.entries(corsHeaders(request)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...corsHeaders(request)}});}
