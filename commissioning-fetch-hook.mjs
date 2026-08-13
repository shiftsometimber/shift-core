import fs from 'node:fs';
const original=globalThis.fetch.bind(globalThis);
const token=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const timingFile=String(process.env.SHIFT_G5_012_TIMING_FILE||'g5-012-auth-timings.ndjson').trim();
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
    try{fs.appendFileSync(timingFile,JSON.stringify({kind:isRegister?'register':'login',status:response.status,ms:Math.round(performance.now()-started),at:new Date().toISOString()})+'\n')}catch(e){console.warn('g5_012_timing_write_failed',e?.message)}
  }
  return response;
};
