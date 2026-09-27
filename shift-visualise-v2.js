import {shiftVisualiseRoutes as v1} from './shift-visualise-v1.js';

const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);

export async function shiftVisualiseV2Routes(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path!=='/v1/shift/visualise')return v1(request,env,ctx);
  if(request.method!=='POST')return v1(request,env,ctx);
  const inspect=request.clone();let form;try{form=await inspect.formData();}catch{return v1(request,env,ctx);}
  const direction=String(form.get('direction')||'').trim().toLowerCase();
  const image=form.get('image');
  const saveOriginal=String(form.get('saveOriginal')||'').toLowerCase()==='true';
  let savedOriginal=null;
  if(saveOriginal&&image instanceof File){
    const saveForm=new FormData();saveForm.append('image',image);saveForm.append('consent',String(form.get('consent')||''));
    for(const key of ['weightKg','waistCm','capturedAt','source']){const value=form.get(key);if(value!==null&&String(value)!=='')saveForm.append(key,String(value));}
    const saveReq=new Request(new URL('/v1/shift/progress-photo',request.url),{method:'POST',headers:{Cookie:request.headers.get('Cookie')||'',Origin:request.headers.get('Origin')||''},body:saveForm});
    const saved=await v1(saveReq,env,ctx);savedOriginal=await saved.clone().json().catch(()=>null);
    if(!saved.ok)return saved;
  }
  if(!['same','0'].includes(direction))return v1(request,env,ctx);
  if(!(image instanceof File))return json({ok:false,error:'image_required'},400,request);
  if(String(form.get('consent')||'')!=='true')return json({ok:false,error:'consent_required'},400,request);
  const bytes=new Uint8Array(await image.arrayBuffer());
  return json({ok:true,visualisation:{direction:'same',mime:image.type||'image/jpeg',imageBase64:bytesToBase64(bytes),stored:false},original:savedOriginal?.photo||null,disclaimer:'Illustrative comparison only. “Same” shows the supplied image without a weight-change transformation and is not a clinical assessment.'},200,request);
}
function bytesToBase64(bytes){let out='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(out);}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ALLOWED_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...cors(request)}});}
