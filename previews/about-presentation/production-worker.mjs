import{version,mainFor}from'./page.mjs';import style from'./style.mjs';import{ticker}from'./ticker.mjs';
export const releaseVersion='20261022-about-live-v1';
export default{async fetch(request,env){const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method),about=['/about','/about/','/about.html'].includes(url.pathname);
if(preview&&!read)return new Response('Read-only verification',{status:405});
if(preview&&url.pathname.startsWith('/v1/'))return new Response('Unavailable',{status:403});
const target=preview?new Request('https://shiftsometimber.co.uk'+url.pathname+url.search,request):request;
if(!about||!read)return env.CORE.fetch(target);
const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/about',{headers:{Accept:'text/html'}}));if(!upstream.ok)return upstream;const html=await upstream.text();let main;try{main=mainFor(html);}catch{return new Response(html,{headers:upstream.headers,status:upstream.status});}
const headers=new Headers(upstream.headers);for(const k of['Content-Length','Content-Encoding','ETag','Last-Modified','Set-Cookie'])headers.delete(k);headers.set('Cache-Control','private, no-store');headers.set('X-Shift-About-Version',releaseVersion);headers.set('X-Shift-About-Preview',version);if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
let hadTicker=false;let rw=new HTMLRewriter().on('#shift-public-news',{element(){hadTicker=true;}}).on('main',{element(e){if(!hadTicker)e.before(ticker,{html:true});e.setAttribute('id','main-content');e.setAttribute('class','ab');e.setAttribute('data-about-presentation',version);e.setAttribute('data-about-release',releaseVersion);e.setInnerContent(main,{html:true});}}).on('head',{element(e){e.append('<style data-about-style>'+style+'</style>',{html:true});}}).on('body',{element(e){e.append('<script defer src="/assets/public-news-ticker-v1.js?v=public-news-20260917-r4"></script>',{html:true});}});
if(preview)rw=rw.on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow');}});return rw.transform(new Response(request.method==='HEAD'?null:html,{status:200,headers}));}};
