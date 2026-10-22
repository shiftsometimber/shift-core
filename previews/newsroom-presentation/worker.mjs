import {version,path,mainFor}from'./page.mjs';import{compareNews}from'../../radar-newsroom-sort-v1.js';import style from'./style.mjs';import client from'./client.mjs';
export const compareSource='export const compareNews='+compareNews.toString()+';';
export function allowedAsset(p){return !p.includes('..')&&!p.startsWith('/v1/')&&!/sw\.js$|service.worker|register-sw/.test(p)&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(p);}
export default{async fetch(request,env){
 const url=new URL(request.url);if(!['GET','HEAD'].includes(request.method))return new Response('Read-only design preview.',{status:405,headers:{Allow:'GET, HEAD'}});
 if(!url.hostname.endsWith('.workers.dev'))return new Response('Preview host required.',{status:404});
 if([path+'/client.js',path+'/compare.js'].includes(url.pathname))return new Response(request.method==='HEAD'?null:url.pathname.endsWith('/compare.js')?compareSource:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 if(![path,path+'/'].includes(url.pathname)){
  if(url.pathname.startsWith('/v1/')||/sw\.js$|service.worker|register-sw/.test(url.pathname))return new Response('Unavailable in the design preview.',{status:403});
  if(allowedAsset(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));
  return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);
 }
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+path,{headers:{Accept:'text/html'}}));if(!upstream.ok)return new Response('Could not load the published Newsroom.',{status:502});
 const html=await upstream.text();let main;try{main=mainFor(html,url).main;}catch{return new Response('The published Newsroom structure could not be read.',{status:502});}
 const headers=new Headers(upstream.headers);for(const key of['Content-Length','Content-Encoding','ETag','Last-Modified','Set-Cookie'])headers.delete(key);headers.set('Cache-Control','private, no-store');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Shift-Newsroom-Preview',version);
 return new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','nr');e.setAttribute('data-newsroom-presentation',version);e.setInnerContent(main,{html:true});}}).on('head',{element(e){e.append('<style data-newsroom-presentation-style>'+style+'</style>',{html:true});}}).on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('body',{element(e){e.append('<script src="'+path+'/client.js" type="module"></script>',{html:true});}}).transform(new Response(request.method==='HEAD'?null:html,{status:200,headers}));
}};
