import style from './style.mjs';
export const version='20261022-tools-presentation-v1';
export const releaseVersion='20261022-tools-live-v1';
const client=`(()=>{const root=document.querySelector('main.tpp .tool-content'),grid=root?.querySelector('.toolgrid')?.closest('section');if(!root||!grid)return;let observer;function place(){const bridge=root.querySelector('.sst-service-bridge');if(!bridge)return false;observer?.disconnect();grid.after(bridge);bridge.dataset.toolsBridgeMoved='1';return true;}if(!place()){observer=new MutationObserver(place);observer.observe(root,{childList:true,subtree:true});}})();`;
const guard='<script data-tools-preview-guard>document.addEventListener("submit",function(event){event.preventDefault();event.stopImmediatePropagation();},true);</script>';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),index=['/tools','/tools/','/tools.html'].includes(url.pathname);
 if(preview&&!read)return new Response('Unavailable in this design preview',{status:405});
 if(preview&&(url.pathname.startsWith('/v1/')||/sw\.js$|register-sw/.test(url.pathname)))return new Response('Unavailable in this design preview',{status:403});
 if(!index||!read){
  if(!preview)return env.CORE.fetch(request);
  if(!url.pathname.includes('..')&&/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,{method:request.method}));
  return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);
 }
 const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/tools'+url.search,{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;
 const html=await upstream.text(),headers=new Headers(upstream.headers);
 for(const key of['Content-Length','Content-Encoding','Set-Cookie','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','private,no-store');headers.set('X-Shift-Tools-Version',preview?version:releaseVersion);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 let rewrite=new HTMLRewriter().on('head',{element(e){e.append('<style data-tools-presentation-style>'+style+'</style>'+(preview?guard:''),{html:true});}}).on('main',{element(e){e.setAttribute('class','page-template template-calculator-tool-result tpp');e.setAttribute(preview?'data-tools-preview':'data-tools-release',preview?version:releaseVersion);if(preview)e.before('<p class="tpp-preview-notice" role="note">Design preview · Calculator links open the current live tools.</p>',{html:true});}}).on('main .pagehero>.wrap',{element(e){e.append('<a data-tools-jump href="#calculators">Choose a calculator ↓</a>',{html:true});}}).on('main .toolgrid',{element(e){e.setAttribute('id','calculators');}}).on('body',{element(e){e.append('<script data-tools-presentation-client>'+client+'</script>',{html:true});}});
 if(preview)rewrite=rewrite.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}});
 return rewrite.transform(new Response(request.method==='HEAD'?null:html,{headers,status:200}));
}};
