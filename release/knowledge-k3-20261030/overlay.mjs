import original from './original.mjs';
export * from './original.mjs';
import {release,assetBase,transformHTML} from './layout.mjs';
import css from './styles.mjs';
import hero from './assets/hero.webp';
import bloods from './assets/bloods.webp';
import results from './assets/results.webp';
import sleep from './assets/sleep.webp';
const photos={hero,bloods,results,sleep};
export default {...original,async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/',read=['GET','HEAD'].includes(request.method);
 if(read&&path==='/explore-knowledge'){const target=new URL(url);target.pathname='/knowledge';return new Response(null,{status:308,headers:{Location:target.pathname+target.search,'Cache-Control':'no-store','X-Shift-Knowledge-Design':release}});}
 const key=url.pathname.startsWith(assetBase)?url.pathname.slice(assetBase.length).replace(/\.webp$/,''):null;
 if(read&&key&&photos[key]&&url.pathname===assetBase+key+'.webp')return new Response(request.method==='HEAD'?null:photos[key],{headers:{'Content-Type':'image/webp','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
 const response=await original.fetch(request,env,ctx);
 if(path!=='/knowledge'||!read||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 if(request.method==='HEAD'){const headers=new Headers(response.headers);headers.set('X-Shift-Knowledge-Design',release);return new Response(null,{status:response.status,headers});}
 const html=transformHTML(await response.text(),css),headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified','Content-MD5','Digest'])headers.delete(name);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Knowledge-Design',release);
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}};
