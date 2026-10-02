import {renderWatchDocument,withMedicinesWatchEntry,WATCH_PATH} from '../../medicines-watch/page.mjs';
import {addCreamNavigation} from '../../cream-navigation.mjs';
const production='https://shiftsometimber.co.uk';
export default {async fetch(request){
 const u=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405});
 if(/^\/(?:v1|api|hq|admin|member|treatment-assessment)(?:\/|$)/.test(u.pathname))return new Response('Account operations disabled in preview',{status:403});
 if(u.pathname==='/__qa'){
  const width=Number(u.searchParams.get('width')),path=u.searchParams.get('path')||'/';
  if(![390,1440].includes(width)||!['/','/treatment-centre',WATCH_PATH].includes(path))return new Response('Invalid preview',{status:400});
  return new Response('<!doctype html><html><body style="margin:0;background:#050505"><iframe title="Responsive display preview" src="'+path+'" style="width:'+width+'px;height:1300px;border:0;display:block"></iframe></body></html>',{headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex, nofollow'}});
 }
 const isWatch=u.pathname===WATCH_PATH;
 const r=await fetch(production+(isWatch?'/treatment-centre':u.pathname)+u.search,{method:request.method,headers:{Accept:request.headers.get('Accept')||'*/*'},redirect:'manual'});
 const headers=new Headers(r.headers);for(const k of ['Set-Cookie','Content-Length','ETag','Last-Modified'])headers.delete(k);
 headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');
 const loc=headers.get('Location');if(loc?.startsWith(production+'/'))headers.set('Location',u.origin+loc.slice(production.length));
 if(!r.ok||!headers.get('Content-Type')?.includes('text/html'))return new Response(r.body,{status:r.status,headers});
 let html=await r.text();
 if(isWatch){let health={available:false};try{const h=await fetch(production+'/v1/medicines-watch/health');if(h.ok)health=await h.json()}catch{}html=renderWatchDocument(html,health,u.searchParams);}
 else if(u.pathname==='/treatment-centre'){const e=await withMedicinesWatchEntry(new Response(html,{headers:{'Content-Type':'text/html'}}),request);html=await e.text();}
 html=addCreamNavigation(html);
 headers.set('Content-Security-Policy',"default-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self'; form-action 'self'; object-src 'none'; base-uri 'self'");
 return new Response(request.method==='HEAD'?null:html,{status:r.status,headers});
}};
