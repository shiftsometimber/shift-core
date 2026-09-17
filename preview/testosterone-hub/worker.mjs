import content from './content.html';
import css from './style.css';
import {render,addRelated,path,related} from './render.mjs';
const production='https://shiftsometimber.co.uk';
export default {async fetch(request){
 const u=new URL(request.url);
 const headers={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'};
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405,headers});
 if(u.pathname==='/__qa'){
  const width=Number(u.searchParams.get('width'));if(![360,390,768,1440].includes(width))return new Response('Invalid width',{status:400,headers});
  return new Response(`<html><meta name="robots" content="noindex"><body style="margin:0;background:#050505"><iframe title="Mobile preview" src="${path}" style="width:${width}px;height:1100px;border:0"></iframe></body></html>`,{headers:{...headers,'Content-Type':'text/html'}});
 }
 if(u.pathname===path||related.includes(u.pathname)){
  const r=await fetch(production+u.pathname);if(!r.ok)return new Response('Public shell unavailable',{status:502,headers});
  let html=await r.text();html=u.pathname===path?render(html,content,css):addRelated(html,u.pathname);
  // Keep only this hub and the requested incoming-link previews on the preview host.
  html=html.replace(/href="(\/[^"#?]*)([^" ]*)"/g,(all,p,suffix)=>p===path||related.includes(p)?all:`href="${production}${p}${suffix}"`);
  return new Response(request.method==='HEAD'?null:html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
 }
 if(/\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(u.pathname)){
  const r=await fetch(production+u.pathname+u.search);return new Response(request.method==='HEAD'?null:r.body,{status:r.status,headers:{...headers,'Content-Type':r.headers.get('Content-Type')||'application/octet-stream'}});
 }
 return new Response('Read-only scoped preview',{status:404,headers});
}};
