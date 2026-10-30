import original from './original.mjs';
export * from './original.mjs';
import {release,assetBase,transformHTML} from './layout.mjs';
import css from './styles.mjs';
import hero from './assets/hero.webp';
import support from './assets/support.webp';
import weight from './assets/weight.webp';
import blood from './assets/blood.webp';
const assets={'hero.webp':hero,'support.webp':support,'weight.webp':weight,'blood.webp':blood};
export default {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/',read=['GET','HEAD'].includes(request.method),key=u.pathname.startsWith(assetBase)?u.pathname.slice(assetBase.length):'';
 if(read&&assets[key]&&u.pathname===assetBase+key)return new Response(request.method==='HEAD'?null:assets[key],{headers:{'Content-Type':'image/webp','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
 const response=await original.fetch(request,env,ctx);if(!read||p!=='/start-here'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 if(request.method==='HEAD'){const headers=new Headers(response.headers);headers.set('X-Shift-Start-Here-Design',release);return new Response(null,{status:response.status,headers});}
 const input=await response.clone().text();if(!input.includes('id="sw-welcome"'))return response;
 const html=transformHTML(input,css),headers=new Headers(response.headers);headers.set('X-Shift-Start-Here-Design',release);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified','Content-MD5','Digest'])headers.delete(k);headers.set('Cache-Control','no-store');return new Response(html,{status:response.status,statusText:response.statusText,headers});
}};
