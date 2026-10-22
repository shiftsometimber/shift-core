import {version,path,mainFor}from'./page.mjs';
import {compareNews}from'../../radar-newsroom-sort-v1.js';
import style from'./style.mjs';import client from'./client.mjs';
export const releaseVersion='20261022-newsroom-live-v1';
export const isIndex=url=>[path,path+'/',path+'.html'].includes(url.pathname);
const compareSource='export const compareNews='+compareNews.toString()+';';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method);
 if(preview&&!read)return new Response('Read-only release verification.',{status:405,headers:{Allow:'GET, HEAD'}});
 if(read&&[path+'/client.js',path+'/compare.js'].includes(url.pathname))return new Response(request.method==='HEAD'?null:url.pathname.endsWith('/compare.js')?compareSource:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|service.worker|register-sw/.test(url.pathname)))return new Response('Unavailable in release verification.',{status:403});
 const target=preview?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 if(preview&&!isIndex(url)&&(!/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname)||url.pathname.includes('..')))return Response.redirect(target.url,302);
 if(!read||!isIndex(url))return env.CORE.fetch(target);
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+path,{headers:{Accept:'text/html'}}));
 if(!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 const html=await upstream.text();let main;try{main=mainFor(html,url).main;}catch{return new Response(request.method==='HEAD'?null:html,{status:upstream.status,headers:upstream.headers});}
 const headers=new Headers(upstream.headers);for(const key of['Content-Length','Content-Encoding','ETag','Last-Modified','Set-Cookie'])headers.delete(key);
 headers.set('Cache-Control','private, no-store');headers.set('X-Shift-Newsroom-Version',releaseVersion);headers.set('X-Shift-Newsroom-Design',version);
 if(preview){headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Shift-Newsroom-Preview',version);}
 let rewrite=new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','nr');e.setAttribute('data-newsroom-presentation',version);e.setAttribute('data-newsroom-release',releaseVersion);e.setInnerContent(main,{html:true});}}).on('head',{element(e){e.append('<style data-newsroom-presentation-style>'+style+'</style>',{html:true});}}).on('body',{element(e){e.append('<script src="'+path+'/client.js" type="module"></script>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{status:200,headers}));
}};
