import {continuityPublicRoute,withPublicContinuity} from '../../public-continuity.mjs';
import {withPublicTicker} from '../../public-navigation-policy.mjs';
const production='https://shiftsometimber.co.uk';
export default {async fetch(request){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405});
 if(url.pathname==='/__qa'){
  const width=Number(url.searchParams.get('width')),path=url.searchParams.get('path')||'/life-back';
  if(![360,390,768,1024,1440].includes(width)||!/^\/[a-z0-9\/-]*$/.test(path))return new Response('Invalid preview',{status:400});
  return new Response(`<html><head><meta name="robots" content="noindex"></head><body style="margin:0;background:#050505"><iframe title="Responsive public-page preview" src="${path}" style="display:block;width:${width}px;height:1000px;border:0"></iframe></body></html>`,{headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex, nofollow'}});
 }
 if(url.pathname.startsWith('/v1/')&&url.pathname!=='/v1/radar/ticker')return new Response('Read-only public preview',{status:404});
 const upstream=()=>fetch(production+url.pathname+url.search,{method:request.method,headers:{Accept:request.headers.get('Accept')||'*/*'},redirect:'manual'});
 const page=await continuityPublicRoute(request,()=>fetch(production+'/programme'));
 const response=await withPublicTicker(request,await withPublicContinuity(request,page||await upstream()));
 const headers=new Headers(response.headers);headers.delete('Set-Cookie');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','no-store');
 const location=headers.get('Location');if(location&&location.startsWith(production+'/'))headers.set('Location',url.origin+location.slice(production.length));
 return new Response(response.body,{status:response.status,headers});
}};
