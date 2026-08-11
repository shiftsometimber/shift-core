import core from './worker.js';

const MODEL='@cf/black-forest-labs/flux-2-klein-9b';
const MAX_BYTES=2_500_000;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);

export async function shiftVisualiseRoutes(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname!=='/v1/shift/visualise') return null;
  if(request.method!=='POST') return json({ok:false,error:'method_not_allowed'},405);

  const a=await auth(request,env,ctx);
  if(a.response) return a.response;
  if(!env.AI?.run) return json({ok:false,error:'ai_unavailable'},503);

  let form;
  try{ form=await request.formData(); }
  catch{ return json({ok:false,error:'invalid_multipart'},400); }

  const image=form.get('image');
  const direction=String(form.get('direction')||'').trim();
  const consent=String(form.get('consent')||'')==='true';
  if(!consent) return json({ok:false,error:'consent_required'},400);
  if(direction!=='-10'&&direction!=='+10') return json({ok:false,error:'invalid_direction'},400);
  if(!(image instanceof File)) return json({ok:false,error:'image_required'},400);
  if(!ALLOWED.has(image.type)) return json({ok:false,error:'unsupported_image_type'},415);
  if(image.size<=0||image.size>MAX_BYTES) return json({ok:false,error:'image_too_large',maxBytes:MAX_BYTES},413);

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
  if(!b64) return json({ok:false,error:'generation_failed'},502);

  try{
    await env.DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(NULL,'shift_visualise_generated',?,?)`)
      .bind(`user:${a.user.id}`,JSON.stringify({direction,model:MODEL,stored:false})).run();
  }catch{}

  return json({
    ok:true,
    visualisation:{direction,mime:'image/png',imageBase64:b64,stored:false},
    disclaimer:'Illustrative AI visualisation only. This is not a prediction of exactly how you will look and is not a clinical assessment.'
  });
}

async function auth(request,env,ctx){
  const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!r.ok) return {response:r};
  return {user:(await r.json()).user};
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
