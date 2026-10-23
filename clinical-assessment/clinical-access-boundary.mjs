// Clinician credentials grant case access only, not general HQ/CRM access.
export async function clinicalAccessBoundary(request,env,authenticate){
 const p=new URL(request.url).pathname.replace(/\/+$/,'');
 if(request.method==='OPTIONS'||!/^\/v1\/(hq|crm|admin)(\/|$)/.test(p)||p==='/v1/hq/me'||p.startsWith('/v1/hq/auth/')||p==='/v1/hq/mfa/setup'||p==='/v1/hq/mfa/enable'||p==='/v1/hq/clinical'||p.startsWith('/v1/hq/clinical/'))return null;
 const a=await authenticate(request,env);if((a.user||a.actor)?.role!=='clinical')return null;
 return new Response(JSON.stringify({error:'clinician_portal_only'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store, private','Access-Control-Allow-Origin':'https://hq.shiftsometimber.co.uk','Access-Control-Allow-Credentials':'true','Vary':'Origin'}});
}
