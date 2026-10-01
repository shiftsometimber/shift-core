import {withSharedFooter} from '../../shared-footer.mjs';
// Read-only display preview. No cookies, authorisation, account writes or production bindings.
export default {async fetch(request){
 const u=new URL(request.url);if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Read-only preview',{status:405});
 if(/^\/(?:v1|api|hq|admin)(?:\/|$)/.test(u.pathname))return new Response('Account operations disabled in preview',{status:403});
 const target=new URL(u.pathname+u.search,'https://shiftsometimber.co.uk');
 const r=await fetch(target,{method:request.method,redirect:'follow'}),headers=new Headers(r.headers);headers.delete('Set-Cookie');headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');
 return withSharedFooter(request,new Response(r.body,{status:r.status,statusText:r.statusText,headers}));
}};

