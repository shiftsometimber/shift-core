import style from './style.mjs';
export const version='20261022-support-presentation-v1';
export const releaseVersion='20261022-support-live-v1';
export function present(html){
 const match=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);if(!match)throw Error('Missing support page');
 const body=match[1],hero=body.match(/^\s*<p class="continuity-kicker">[\s\S]*?<p class="continuity-meta">[\s\S]*?<\/p>/)?.[0],features=body.match(/<section><h2>What you actually get<\/h2>[\s\S]*?<\/section>/)?.[0];if(!hero||!features)throw Error('Support page structure changed');
 const opening=match[0].slice(0,match[0].indexOf('>')+1),rest=body.replace(hero,'').replace(features,'');
 return html.replace(match[0],opening+'<div class="spp-hero"><div class="spp-wrap">'+hero+'</div></div><div class="spp-features"><div class="spp-wrap">'+features+'</div></div><div class="spp-reading">'+rest+'</div></main>');
}
const guard='<script data-support-preview-guard>window.SST_ANALYTICS_SUPPRESSED=true;document.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();},true);</script>';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),index=['/weight-loss-support-for-men','/weight-loss-support-for-men/','/weight-loss-support-for-men.html'].includes(url.pathname);
 if(preview&&!read)return new Response('Unavailable in this design preview',{status:405});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw|analytics|shift-product-events|public-feedback/.test(url.pathname)))return new Response('Unavailable in this design preview',{status:403});
 if(!index||!read){if(!preview)return env.CORE.fetch(request);if(!url.pathname.includes('..')&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);}
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/weight-loss-support-for-men'+url.search,{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;
 const html=present(await upstream.text()),headers=new Headers(upstream.headers);for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Support-Version',preview?version:releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('head',{element(e){e.append('<style data-support-presentation-style>'+style+'</style>'+(preview?guard:''),{html:true});}}).on('main',{element(e){e.setAttribute('class',(e.getAttribute('class')||'')+' spp');e.setAttribute(preview?'data-support-preview':'data-support-release',preview?version:releaseVersion);if(preview)e.before('<p class="spp-preview-notice" role="note">Design preview · Account links open the current live My Timber.</p>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('script[src]',{element(e){if(/analytics|shift-product-events|register-sw|public-feedback/.test(e.getAttribute('src')||''))e.remove();}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
