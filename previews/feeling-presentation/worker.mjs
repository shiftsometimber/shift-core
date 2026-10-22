import style from './style.mjs';
export const version='20261022-feeling-presentation-v1';
export const releaseVersion='20261022-feeling-live-v1';
const guard='<script data-feeling-preview-guard>document.addEventListener("submit",function(event){event.preventDefault();if(event.target.id!=="feelForm")event.stopImmediatePropagation();},true);document.addEventListener("DOMContentLoaded",function(){var form=document.getElementById("feelForm");if(form&&typeof form.onsubmit==="function"){var button=form.querySelector(":scope > .btn");if(button)button.disabled=false;form.dataset.feelingPreviewLocal="1";}},{once:true});</script>';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),index=['/how-are-you-feeling','/how-are-you-feeling/','/how-are-you-feeling.html'].includes(url.pathname);
 if(preview&&!read)return new Response('Saving is unavailable in this design preview',{status:405});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw|analytics|shift-product-events|public-feedback/.test(url.pathname)))return new Response('Unavailable in this design preview',{status:403});
 if(!index||!read){
  if(!preview)return env.CORE.fetch(request);
  if(!url.pathname.includes('..')&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));
  return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);
 }
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/how-are-you-feeling'+url.search,{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;
 const html=await upstream.text(),headers=new Headers(upstream.headers);
 for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Feeling-Version',preview?version:releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('head',{element(e){e.append('<style data-feeling-presentation-style>'+style+'</style>'+(preview?guard:''),{html:true});}}).on('main',{element(e){e.setAttribute('class',(e.getAttribute('class')||'')+' fpp');e.setAttribute(preview?'data-feeling-preview':'data-feeling-release',preview?version:releaseVersion);if(preview)e.before('<p class="fpp-preview-notice" role="note">Design preview · Results are not saved to My Timber.</p>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('#feelForm>.btn',{element(e){e.setAttribute('disabled','');}}).on('script[src]',{element(e){if(/analytics|shift-product-events|register-sw|public-feedback/.test(e.getAttribute('src')||''))e.remove();}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
