import style from './style.mjs';
import {mainFor} from './page.mjs';
export const version='20261022-work-with-us-preview-v1';
const pagePath='/work-with-us';
export default{async fetch(request,env){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405});
 if(!url.hostname.endsWith('.workers.dev'))return new Response('Preview only',{status:404});
 if(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw/.test(url.pathname))return new Response('Unavailable in preview',{status:403});
 if(![pagePath,pagePath+'/'].includes(url.pathname)){
  if(/^\/(?:[a-zA-Z0-9_/-]+\.)?(?:[a-zA-Z0-9_.-]+)\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname)&&!url.pathname.includes('..'))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));
  return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);
 }
 const response=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+pagePath,{headers:{Accept:'text/html'}}));
 if(!response.ok)return new Response('Could not load the shared page',{status:502});
 const html=await response.text(),headers=new Headers(response.headers);
 const published=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/assets/work-with-shift-v2.js?v=2'));
 if(!published.ok)return new Response('Could not read the existing partnership content',{status:502});
 let main;try{main=mainFor(await published.text());}catch{return new Response('Partnership source needs review',{status:502});}
 for(const key of ['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Shift-Work-Preview',version);
 return new HTMLRewriter()
 .on('main',{element(element){element.setAttribute('class','work-with-shift wwp');element.setAttribute('data-work-preview',version);element.setInnerContent(main,{html:true});}})
 .on('main [data-shift-contrast-guard]',{element(element){element.removeAttribute('style');element.removeAttribute('data-shift-contrast-guard');}})
 .on('head',{element(element){element.append('<style data-work-preview-style>'+style+'</style>',{html:true});}})
 .on('meta[name="robots"]',{element(element){element.setAttribute('content','noindex,nofollow');}})
 .on('script',{element(element){if(/work-with-shift-v2|shift-service-bridge|register-sw/.test(element.getAttribute('src')||''))element.remove();}})
 .transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
