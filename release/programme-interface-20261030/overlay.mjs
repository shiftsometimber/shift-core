import original from './original.mjs';
export * from './original.mjs';
import {release,assetBase,transformHTML} from './layout.mjs';
import css from './styles.mjs';
import {runtime} from './runtime.mjs';
import {runtime as runtimeV1} from './runtime-v1.mjs';
import today from './assets/today.jpg';
export default {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method),p=u.pathname.replace(/\/+$/,'')||'/';
 if(read&&u.pathname===assetBase+'today.jpg')return new Response(request.method==='HEAD'?null:today,{headers:{'Content-Type':'image/jpeg','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
 if(read&&u.pathname===assetBase+'runtime.js')return new Response(request.method==='HEAD'?null:runtimeV1,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
 if(read&&u.pathname===assetBase+'runtime-v2.js')return new Response(request.method==='HEAD'?null:runtime,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
 const response=await original.fetch(request,env,ctx);if(!read||p!=='/programme'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const headers=new Headers(response.headers);headers.set('X-Shift-Programme-Interface',release);if(request.method==='HEAD')return new Response(null,{status:response.status,headers});const html=transformHTML(await response.text(),css);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified','Content-MD5','Digest'])headers.delete(k);headers.set('Cache-Control','no-store');return new Response(html,{status:response.status,statusText:response.statusText,headers});
}};
