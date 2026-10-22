import style from './style.mjs';
export const version='20261022-provider-presentation-v1';
export const releaseVersion='20261022-provider-live-v1';
export function present(html){
 const match=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);if(!match)throw Error('Missing continuity page');
 const body=match[1],hero=body.match(/^\s*<p class="continuity-kicker">[\s\S]*?<div class="continuity-actions">[\s\S]*?<\/div>/)?.[0],needs=body.match(/<section><h2>Three different situations<\/h2>[\s\S]*?<\/section>/)?.[0];if(!hero||!needs)throw Error('Continuity structure changed');
 const opening=match[0].slice(0,match[0].indexOf('>')+1),rest=body.replace(hero,'').replace(needs,'');
 return html.replace(match[0],opening+'<div class="psp-hero"><div class="psp-wrap">'+hero+'</div></div><div class="psp-needs"><div class="psp-wrap">'+needs+'</div></div><div class="psp-reading">'+rest+'</div></main>');
}
const guard='<script data-provider-preview-guard>window.SST_ANALYTICS_SUPPRESSED=true;document.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();},true);</script>';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),index=['/provider-switch','/provider-switch/','/provider-switch.html'].includes(url.pathname);
 if(preview&&!read)return new Response('Unavailable in this design preview',{status:405});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw|analytics|shift-product-events|public-feedback/.test(url.pathname)))return new Response('Unavailable in this design preview',{status:403});
 if(!index||!read){if(!preview)return env.CORE.fetch(request);if(!url.pathname.includes('..')&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);}
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/provider-switch'+url.search,{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;
 const html=present(await upstream.text()),headers=new Headers(upstream.headers);for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Provider-Version',preview?version:releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('head',{element(e){e.append('<style data-provider-presentation-style>'+style+'</style>'+(preview?guard:''),{html:true});}}).on('main',{element(e){e.setAttribute('class',(e.getAttribute('class')||'')+' psp');e.setAttribute(preview?'data-provider-preview':'data-provider-release',preview?version:releaseVersion);if(preview)e.before('<p class="psp-preview-notice" role="note">Design preview · Account links open the current live My Timber.</p>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('script[src]',{element(e){if(/analytics|shift-product-events|register-sw|public-feedback/.test(e.getAttribute('src')||''))e.remove();}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
