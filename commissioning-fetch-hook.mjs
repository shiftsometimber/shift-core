import fs from 'node:fs';
const original=globalThis.fetch.bind(globalThis);
const token=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const timingFile=String(process.env.SHIFT_G5_012_TIMING_FILE||'g5-012-auth-timings.ndjson').trim();
const append=row=>{try{fs.appendFileSync(timingFile,JSON.stringify({...row,at:new Date().toISOString()})+'\n')}catch(e){console.warn('g5_012_timing_write_failed',e?.message)}};
globalThis.fetch=async(input,init={})=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input?.url;
  let u=null;try{u=new URL(url)}catch{}
  const isShiftApi=u?.hostname==='api.shiftsometimber.co.uk';
  const isRegister=isShiftApi&&u.pathname==='/v1/auth/register';
  const isLogin=isShiftApi&&u.pathname==='/v1/auth/login';
  let nextInit=init;
  if(token&&isRegister){const headers=new Headers(init.headers||(input instanceof Request?input.headers:undefined));headers.set('X-Shift-Commissioning-OIDC',token);nextInit={...init,headers}}
  const started=performance.now();
  const response=await original(input,nextInit);
  if(token&&(isRegister||isLogin)){
    const wrapperMs=Math.round(performance.now()-started);
    append({kind:isRegister?'register_wrapper':'login',status:response.status,ms:wrapperMs});
    if(isRegister){
      const coreMs=Number(response.headers.get('x-shift-core-register-ms'));
      const oidcMs=Number(response.headers.get('x-shift-commissioning-oidc-ms'));
      const postMs=Number(response.headers.get('x-shift-commissioning-postverify-ms'));
      if(Number.isFinite(coreMs))append({kind:'register_core',status:response.status,ms:coreMs});
      if(Number.isFinite(oidcMs))append({kind:'commissioning_oidc',status:response.status,ms:oidcMs});
      if(Number.isFinite(postMs))append({kind:'commissioning_postverify',status:response.status,ms:postMs});
    }
  }
  return response;
};
