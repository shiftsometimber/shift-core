const original=globalThis.fetch.bind(globalThis);
const token=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
globalThis.fetch=(input,init={})=>{
  if(!token)return original(input,init);
  const url=typeof input==='string'?input:input instanceof URL?input.href:input?.url;
  try{
    const u=new URL(url);
    if(u.hostname==='api.shiftsometimber.co.uk'&&u.pathname==='/v1/auth/register'){
      const headers=new Headers(init.headers||(input instanceof Request?input.headers:undefined));
      headers.set('X-Shift-Commissioning-OIDC',token);
      return original(input,{...init,headers});
    }
  }catch{}
  return original(input,init);
};
