import {main,style,client,images,tickerMarkup,tickerStyle,tickerScript} from './content.mjs';
export {main,style,client};
const pages=new Set(['/mens-mental-health','/mens-mental-health/','/mens-mental-health.html']);
export default {async fetch(request,env){
 const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 if(read&&url.pathname==='/mens-mental-health/client.js')return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 const imageName=url.pathname.startsWith('/mens-mental-health/assets/')?url.pathname.slice('/mens-mental-health/assets/'.length):'';
 if(read&&Object.hasOwn(images,imageName))return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(images[imageName]),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
 const target=url.hostname.endsWith('.workers.dev')?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 const upstream=await env.CORE.fetch(target);
 if(!read||!pages.has(url.pathname)||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 const headers=new Headers(upstream.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Shift-GoodToTalk-Version','20261021-gtt-v1');for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 const source=await upstream.text(),needsTicker=!/id=["']shift-public-news["']/.test(source);
 return new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','gt');e.setAttribute('data-good-to-talk-version','20261021-gtt-v1');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','good-to-talk');if(needsTicker&&!source.includes('/assets/public-news-ticker-v1.js'))e.append(tickerScript,{html:true});e.append('<script src="/mens-mental-health/client.js" defer></script>',{html:true})}}).on('head',{element(e){if(needsTicker)e.append('<style data-shift-public-news>'+tickerStyle+'</style>',{html:true});e.append('<style data-good-to-talk-style>'+style+'</style>',{html:true})}}).on('header.site-header',{element(e){if(needsTicker)e.after(tickerMarkup,{html:true})}}).on('.product-status-v42h',{element(e){e.remove()}}).transform(new Response(source,{status:upstream.status,headers}));
}};
