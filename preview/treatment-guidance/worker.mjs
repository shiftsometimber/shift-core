import {repairPromiseResponse} from '../../public-promise-accuracy-v1.mjs';
const production='https://shiftsometimber.co.uk';
export default {async fetch(request){
 const u=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only display preview',{status:405});
 if(/^\/(?:api|hq|admin|member)(?:\/|$)/.test(u.pathname)||u.pathname.startsWith('/treatment-assessment')||(u.pathname.startsWith('/v1/')&&u.pathname!=='/v1/catalogue/medicines'))return new Response('Account operations disabled in preview',{status:403});
 if(u.pathname==='/__qa'){
  const width=Number(u.searchParams.get('width')),path=u.searchParams.get('path')||'/treatment-order';
  if(![390,1440].includes(width)||!['/treatment-order','/treatment-centre','/articles/glp1-side-effects'].includes(path))return new Response('Invalid preview',{status:400});
  return new Response('<!doctype html><html><body style="margin:0;background:#050505"><iframe title="Responsive display preview" src="'+path+'" style="width:'+width+'px;height:1400px;border:0;display:block"></iframe></body></html>',{headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex, nofollow'}});
 }
 const original=await fetch(production+u.pathname+u.search,{method:request.method,headers:{Accept:request.headers.get('Accept')||'*/*'},redirect:'manual'});
 const repaired=await repairPromiseResponse(original,request),headers=new Headers(repaired.headers);
 for(const k of ['Set-Cookie','Content-Length','ETag','Last-Modified'])headers.delete(k);
 headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');
 const location=headers.get('Location');if(location?.startsWith(production+'/'))headers.set('Location',u.origin+location.slice(production.length));
 headers.set('Content-Security-Policy',"default-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self'; form-action 'self'; object-src 'none'; base-uri 'self'");
 return new Response(request.method==='HEAD'?null:repaired.body,{status:repaired.status,headers});
}};
