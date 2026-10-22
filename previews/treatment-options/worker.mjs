import {mainFor,version,path} from './page.mjs';
import style from './style.mjs';
import client from './client.mjs';
export const ticker='<section id="shift-public-news" data-shift-news-ticker="public-news-20260917-r4" data-shift-ai-full-wire="public-news-20260917-r4" class="medicine-ticker-v138" aria-label="SHIFT Newsroom"><a class="shift-news-label" href="https://shiftsometimber.co.uk/shift-newsroom">SHIFT Newsroom</a><div class="shift-news-window"><div class="shift-news-track"><span class="shift-news-copy"><a href="https://shiftsometimber.co.uk/shift-newsroom">Read the latest published stories</a><span aria-hidden="true"> · </span><a href="https://shiftsometimber.co.uk/shift-newsroom">Medicine news and evidence</a></span></div></div></section>';
export function allowedAsset(pathname){return !pathname.includes('..')&&!/sw\.js$|service.worker|register-sw|consent|analytics/.test(pathname)&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(pathname)&&/^\/(?:assets\/|app\.js|styles[^/]*\.css|one-shift[^/]*\.css|member-product[^/]*\.css|public-[^/]*\.css|brand[^/]*\.css)/.test(pathname);}
export default {async fetch(request,env){
 const url=new URL(request.url);if(!['GET','HEAD'].includes(request.method))return new Response('This review preview accepts read-only requests.',{status:405,headers:{Allow:'GET, HEAD'}});
 if(!url.hostname.endsWith('.workers.dev'))return new Response('Preview host required.',{status:404});
 if(url.pathname===path+'/client.js')return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(url.pathname!==path&&url.pathname!==path+'/'){
  if(allowedAsset(url.pathname)){const r=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));return r;}
  if(url.pathname.startsWith('/v1/')||/\.js$/.test(url.pathname))return new Response('Unavailable in this review preview.',{status:403});
  return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);
 }
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/treatment-order',{method:'GET',headers:{Accept:'text/html'}}));
 if(!upstream.ok)return new Response('Could not load the shared website layout.',{status:502});
 const {main,product}=mainFor(url),headers=new Headers(upstream.headers);for(const h of ['Content-Length','Content-Encoding','ETag','Last-Modified','Set-Cookie'])headers.delete(h);
 headers.set('Cache-Control','private, no-store');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Shift-Treatment-Options-Preview',version);
 let hadTicker=false;
 return new HTMLRewriter().on('#shift-public-news',{element(){hadTicker=true}}).on('main',{element(e){if(!hadTicker)e.before(ticker,{html:true});e.setAttribute('id','main-content');e.setAttribute('class','to');e.setAttribute('data-treatment-options-preview',version);e.setInnerContent(main,{html:true});}}).on('head',{element(e){e.append('<style data-treatment-options-style>'+style+'</style>',{html:true});}}).on('title',{element(e){e.setInnerContent((product?product.name+' options':'Explore treatment options')+' | SHIFT Some Timber');}}).on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}}).on('script',{element(e){const src=e.getAttribute('src')||'',type=e.getAttribute('type')||'';if(src&&!/^\/(app\.js|assets\/(v42\.js|public-news-ticker-v1\.js))/.test(src))e.remove();else if(!src&&type!=='application/ld+json'&&e.getAttribute('data-shift-shared-footer')===null&&e.getAttribute('data-shift-contrast-guard')===null)e.remove();}}).on('body',{element(e){e.setAttribute('data-template','treatment-options-review');e.append('<script src="'+path+'/client.js" type="module"></script><script defer src="/assets/public-news-ticker-v1.js?v=public-news-20260917-r4"></script>',{html:true});}}).transform(new Response(request.method==='HEAD'?null:upstream.body,{status:200,headers}));
}};
