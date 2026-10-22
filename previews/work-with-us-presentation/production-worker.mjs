import style from './style.mjs';import{mainFor}from'./page.mjs';import{version}from'./worker.mjs';
export const releaseVersion='20261022-work-with-us-live-v1';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method);
 if(preview&&!read)return new Response('Read-only verification',{status:405});
 if(preview&&url.pathname.startsWith('/v1/'))return new Response('Unavailable in public preview',{status:403});
 if(!['/work-with-us','/work-with-us/','/work-with-us.html'].includes(url.pathname)||!read){const target=preview?new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}):request;return env.CORE.fetch(target);}
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/work-with-us',{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;
 const html=await upstream.text(),published=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/assets/work-with-shift-v2.js?v=2'));
 if(!published.ok)return new Response(html,{headers:upstream.headers,status:upstream.status});
 let main;try{main=mainFor(await published.text());}catch{return new Response(html,{headers:upstream.headers,status:upstream.status});}
 const headers=new Headers(upstream.headers);for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Work-Version',releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('main',{element(element){element.setAttribute('class','work-with-shift wwp');element.setAttribute('data-work-preview',version);element.setAttribute('data-work-release',releaseVersion);element.setInnerContent(main,{html:true});}}).on('head',{element(element){element.append('<style data-work-style>'+style+'</style>',{html:true});}}).on('script',{element(element){if(/work-with-shift-v2/.test(element.getAttribute('src')||''))element.remove();}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(element){element.setAttribute('content','noindex,nofollow');}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
