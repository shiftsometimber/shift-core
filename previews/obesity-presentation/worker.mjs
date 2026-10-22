import style from './style.mjs';
export const version='20261022-obesity-presentation-v3';
export const releaseVersion='20261022-obesity-live-v1';
export function present(html){
 const match=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);if(!match)throw Error('Missing guide');
 const body=match[1],hero=body.match(/^\s*<p class="eyebrow">[\s\S]*?<\/p>\s*<h1>[\s\S]*?<\/h1>\s*<p class="lead">[\s\S]*?<\/p>/)?.[0],actions=body.match(/<p><a class="button" href="#first-step">[\s\S]*?<\/p>/)?.[0],nav=body.match(/<nav aria-label="On this page">[\s\S]*?<\/nav>/)?.[0];
 if(!hero||!actions||!nav)throw Error('Guide structure changed');
 const rest=body.replace(hero,'').replace(actions,'').replace(nav,'');
 const opening=match[0].slice(0,match[0].indexOf('>')+1);
 return html.replace(match[0],opening+'<div class="mop-hero"><div class="mop-wrap">'+hero+'<div class="mop-actions">'+actions+'</div></div></div><div class="mop-contents"><div class="mop-wrap">'+nav.replace(/ · /g,'<span class="mop-nav-separator" aria-hidden="true"> · </span>')+'</div></div><div class="mop-reading">'+rest+'</div></main>');
}
const guard='<script data-obesity-preview-guard>window.SST_ANALYTICS_SUPPRESSED=true;document.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();},true);</script>';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),index=['/male-obesity','/male-obesity/','/male-obesity.html'].includes(url.pathname);
 if(preview&&!read)return new Response('Unavailable in this design preview',{status:405});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw|analytics|shift-product-events|public-feedback/.test(url.pathname)))return new Response('Unavailable in this design preview',{status:403});
 if(!index||!read){if(!preview)return env.CORE.fetch(request);if(!url.pathname.includes('..')&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);}
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/male-obesity'+url.search,{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;
 const html=present(await upstream.text()),headers=new Headers(upstream.headers);for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Obesity-Version',preview?version:releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('head',{element(e){e.append('<style data-obesity-presentation-style>'+style+'</style>'+(preview?guard:''),{html:true});}}).on('main',{element(e){e.setAttribute('class',(e.getAttribute('class')||'')+' mop');e.setAttribute(preview?'data-obesity-preview':'data-obesity-release',preview?version:releaseVersion);if(preview)e.before('<p class="mop-preview-notice" role="note">Design preview · Existing guidance and sources retained.</p>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('script[src]',{element(e){if(/analytics|shift-product-events|register-sw|public-feedback/.test(e.getAttribute('src')||''))e.remove();}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
