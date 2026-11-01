import {ASSETS} from './assets.mjs';
import {PAGE_INFO,VERSION,renderPage,addDiscovery} from './pages.mjs';
const hosts=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
const publicHeaders={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
const unavailable=()=>new Response('This page is temporarily unavailable. Please use the SHIFT contact page.',{status:503,headers:{...publicHeaders,'Content-Type':'text/plain; charset=utf-8'}});
function changedHeaders(response,path){const h=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(key);for(const [k,v] of Object.entries(publicHeaders))h.set(k,v);h.set('X-Shift-Referral-Programme',VERSION);if(PAGE_INFO[path])h.set('X-Robots-Tag',path==='/programme/sample'?'noindex, follow':'index, follow');return h;}
export function wrapReferralProgramme(original){return {...original,async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname;
 if(!hosts.has(url.hostname))return original.fetch(request,env,ctx);
 const asset=ASSETS[path],info=PAGE_INFO[path],discovery=['/programme','/partner-with-us'].includes(path);
 if(!asset&&!info&&!discovery)return original.fetch(request,env,ctx);
 if(!['GET','HEAD'].includes(request.method))return asset||info?new Response('Method not allowed',{status:405,headers:{...publicHeaders,Allow:'GET, HEAD'}}):original.fetch(request,env,ctx);
 if(asset!==undefined)return new Response(request.method==='HEAD'?null:asset,{headers:{...publicHeaders,'Content-Type':path.endsWith('.css')?'text/css; charset=utf-8':path.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8'}});
 if(info){
  const parent=new URL(url);parent.pathname=info.parent;parent.search='';
  const headers=new Headers(request.headers);for(const name of ['Cookie','Authorization','If-None-Match','If-Modified-Since'])headers.delete(name);
  const response=await original.fetch(new Request(parent,{method:'GET',headers}),env,ctx);
  if(response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return unavailable();
  try{return new Response(request.method==='HEAD'?null:renderPage(await response.text(),path),{status:200,headers:changedHeaders(response,path)});}catch{return unavailable();}
 }
 const response=await original.fetch(request,env,ctx);
 if(request.method==='HEAD'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const source=await response.clone().text(),body=addDiscovery(source,path);
 return body===source?response:new Response(body,{status:response.status,headers:changedHeaders(response,path)});
}};}
