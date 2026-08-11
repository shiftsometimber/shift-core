import core from './worker.js';

const MODEL='@cf/black-forest-labs/flux-2-klein-9b';
const MAX_BYTES=2_500_000;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);

export async function shiftVisualiseRoutes(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname!=='/v1/shift/visualise') return null;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders(request)});
  if(request.method!=='POST') return json({ok:false,error:'method_not_allowed'},405,request);

  const a=await auth(request,env,ctx);
  if(a.response) return withCors(a.response,request);
  if(!env.AI?.run) return json({ok:false,error:'ai_unavailable'},503,request);

  let form;
  try{ form=await request.formData(); }
  catch{ return json({ok:false,error:'invalid_multipart'},400,request); }

  const image=form.get('image');
  const direction=String(form.get('direction')||'').trim();
  const consent=String(form.get('consent')||'')==='true';
  if(!consent) return json({ok:false,error:'consent_required'},400,request);
  if(direction!=='-10'&&direction!=='+10') return json({ok:false,error:'invalid_direction'},400,request);
  if(!(image instanceof File)) return json({ok:false,error:'image_required'},400,request);
  if(!ALLOWED.has(image.type)) return json({ok:false,error:'unsupported_image_type'},415,request);
  if(image.size<=0||image.size>MAX_BYTES) return json({ok:false,error:'image_too_large',maxBytes:MAX_BYTES},413,request);

  const prompt=direction==='-10'
    ? 'Edit the supplied photograph of the same adult person. Preserve identity, face, hair, age, pose, clothing, background, lighting and camera angle. Create a realistic, subtle illustration of the same person at approximately ten percent lower body weight, with proportionate natural body changes only. Do not make them muscular, younger, glamorous or medically transformed. Keep it photorealistic and recognisably the same person.'
    : 'Edit the supplied photograph of the same adult person. Preserve identity, face, hair, age, pose, clothing, background, lighting and camera angle. Create a realistic, subtle illustration of the same person at approximately ten percent higher body weight, with proportionate natural body changes only. Do not exaggerate, stigmatise or caricature. Keep it photorealistic and recognisably the same person.';

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
      .bind(`user:${a.user.id}`,JSON.stringify({direction,model:MODEL,stored:false})).run();
  }catch{}

  return json({
    ok:true,
    visualisation:{direction,mime:'image/png',imageBase64:b64,stored:false},
    disclaimer:'Illustrative AI visualisation only. This is not a prediction of exactly how you will look and is not a clinical assessment.'
  },200,request);
}

async function auth(request,env,ctx){
  const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!r.ok) return {response:r};
  return {user:(await r.json()).user};
}
function corsHeaders(request){
  const origin=request.headers.get('Origin')||'';
  const h={
    'Access-Control-Allow-Credentials':'true',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Vary':'Origin'
  };
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
