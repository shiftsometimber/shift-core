// Keep Shift Me's production proof inside the deliberately narrow existing
// structured commissioning alias family without widening production auth.
// The proof itself remains unchanged; only its synthetic registration email is
// normalised before the existing commissioning fetch hook/OIDC path sees it.
const previousFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
  let url='';
  try{url=typeof input==='string'?input:input instanceof URL?input.href:input?.url||''}catch{}
  let nextInit=init;
  if(url.includes('/v1/auth/register')&&typeof init?.body==='string'){
    try{
      const body=JSON.parse(init.body);
      const email=String(body?.email||'');
      if(email.startsWith('shiftsometimber+finish-shiftme-')){
        body.email=email.replace('shiftsometimber+finish-shiftme-','shiftsometimber+structured-finish-shiftme-');
        nextInit={...init,body:JSON.stringify(body)};
      }
    }catch{}
  }
  return previousFetch(input,nextInit);
};
try{
  await import('./shift-me-production-proof.mjs');
}finally{
  globalThis.fetch=previousFetch;
}
