import style from './style.mjs';
export const version='20261022-contact-presentation-v1';
export const releaseVersion='20261022-contact-live-v1';
const guard='<script data-contact-preview-guard>document.addEventListener("submit",function(event){event.preventDefault();event.stopImmediatePropagation();},true);</script>';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),contact=['/contact','/contact/','/contact.html'].includes(url.pathname);
 if(preview&&!read)return new Response('Messages cannot be sent from this design preview',{status:405});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw/.test(url.pathname)))return new Response('Unavailable in the public design preview',{status:403});
 if(!contact||!read){
  if(!preview)return env.CORE.fetch(request);
  if(!url.pathname.includes('..')&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));
  return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);
 }
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/contact'+url.search,{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;
 const html=await upstream.text(),headers=new Headers(upstream.headers);
 for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Contact-Version',preview?version:releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('head',{element(e){e.append('<style data-contact-presentation-style>'+style+'</style>'+(preview?guard:''),{html:true});}}).on('main',{element(e){e.setAttribute('class','contact-shift ctp');e.setAttribute(preview?'data-contact-preview':'data-contact-release',preview?version:releaseVersion);if(preview)e.before('<p class="ctp-preview-notice" role="note">Design preview · Sending is disabled on this page.</p>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('#shiftContactForm button[type="submit"]',{element(e){e.setAttribute('disabled','');}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
