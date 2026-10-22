import style from './style.mjs';
import article from './source.mjs';
export const version='20261022-stopping-presentation-v3';
export const releaseVersion='20261022-stopping-live-v1';
export function present(html){
 const match=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);if(!match)throw Error('Missing guide');
 const body=match[1],takeaways=body.match(/<section class="cluster-takeaways">[\s\S]*?<\/section>/)?.[0];if(!takeaways)throw Error('Missing original takeaways');
 const hero=body.match(/^<section class="cluster-hero">[\s\S]*?<\/section>/)?.[0];if(!hero)throw Error('Missing original hero');
 return html.replace(match[0],match[0].replace(body,hero+'<div class="sgp-takeaway-wrap">'+takeaways+'</div>'+body.replace(hero,'').replace(takeaways,'')));
}
const relocate='<script data-stopping-presentation-flow>(()=>{const move=()=>{const main=document.querySelector("main.sgp"),panel=main?.querySelector(".sst-service-bridge"),anchor=main?.querySelector(".cluster-safety");if(panel&&anchor&&panel.nextElementSibling!==anchor)anchor.before(panel);};new MutationObserver(move).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener("DOMContentLoaded",move,{once:true});})();</script>';
const guard='<script data-stopping-preview-guard>window.SST_ANALYTICS_SUPPRESSED=true;document.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();},true);</script>';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),index=['/articles/stopping-glp1','/articles/stopping-glp1/','/articles/stopping-glp1.html'].includes(url.pathname);
 if(preview&&!read)return new Response('Unavailable in this design preview',{status:405});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw|analytics|shift-product-events|public-feedback/.test(url.pathname)))return new Response('Unavailable in this design preview',{status:403});
 if(!index||!read){if(!preview)return env.CORE.fetch(request);if(!url.pathname.includes('..')&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);}
 if(!preview)return new Response('This article presentation is preview only',{status:503});
 const upstream=new Response(article,{headers:{'Content-Type':'text/html; charset=utf-8'}});
 const html=present(await upstream.text()),headers=new Headers(upstream.headers);for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Stopping-Version',preview?version:releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('head',{element(e){e.append('<style data-stopping-presentation-style>'+style+'</style>'+relocate+(preview?guard:''),{html:true});}}).on('main',{element(e){e.setAttribute('class',(e.getAttribute('class')||'')+' sgp');e.setAttribute(preview?'data-stopping-preview':'data-stopping-release',preview?version:releaseVersion);if(preview)e.before('<p class="sgp-preview-notice" role="note">Design preview · Original article wording and sources retained.</p>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('script[src]',{element(e){if(/analytics|shift-product-events|register-sw|public-feedback/.test(e.getAttribute('src')||''))e.remove();}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
