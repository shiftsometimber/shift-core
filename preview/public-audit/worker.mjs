import {renderShiftHealthDocument,healthSlugs} from '../../shift-health-public.mjs';
export default {async fetch(request,env){
  if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405});
  const url=new URL(request.url),slug=url.pathname==='/shift-health'?'':url.pathname.split('/')[2];
  if(url.pathname==='/__qa'){
    const width=Number(url.searchParams.get('width')),path=url.searchParams.get('path')||'/shift-health';
    if(![360,390,768,1024,1440].includes(width)||!['/shift-health',...healthSlugs.map(s=>'/shift-health/'+s)].includes(path))return new Response('Invalid preview',{status:400});
    return new Response(`<html><head><meta name="robots" content="noindex"></head><body style="margin:0;background:#333"><iframe title="Responsive Health preview" src="${path}" style="display:block;width:${width}px;height:1000px;border:0"></iframe></body></html>`,{headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex, nofollow'}});
  }
  if(url.pathname==='/shift-health'||(url.pathname.startsWith('/shift-health/')&&healthSlugs.includes(slug))){
    const shell=await fetch('https://projectshift.pages.dev/programme',{headers:{Accept:'text/html'}});
    if(!shell.ok)return new Response('Public shell unavailable',{status:502});
    return new Response(request.method==='HEAD'?null:renderShiftHealthDocument(await shell.text(),slug),{headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}});
  }
  if(url.pathname.startsWith('/assets/shift-health/'))return env.PREVIEW_ASSETS.fetch(request);
  if(/\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)){
    const response=await fetch('https://shiftsometimber.co.uk'+url.pathname+url.search);
    return new Response(response.body,{status:response.status,headers:{'Content-Type':response.headers.get('Content-Type')||'application/octet-stream','X-Robots-Tag':'noindex, nofollow'}});
  }
  return new Response('Read-only scoped preview',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow'}});
}};
