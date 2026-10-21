import {main,style,client,images} from './content.mjs';
export {main,style,client};
const pages=new Set(['/shift-for-work','/shift-for-work/','/shift-for-work.html']);
const description='Practical support for working life. Explore free My Timber, food, movement and wellbeing guides, or start an employer enquiry with SHIFT for Work.';
export default {async fetch(request,env){
 const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 if(read&&url.pathname==='/shift-for-work/client.js')return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 const imageName=url.pathname.startsWith('/shift-for-work/assets/')?url.pathname.slice('/shift-for-work/assets/'.length):'';
 if(read&&Object.hasOwn(images,imageName))return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(images[imageName]),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
 const target=url.hostname.endsWith('.workers.dev')?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 const upstream=await env.CORE.fetch(target);
 if(!read||!pages.has(url.pathname)||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 const headers=new Headers(upstream.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Shift-Work-Version','20261021-work-v1');for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 return new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','sw');e.setAttribute('data-shift-work-version','20261021-work-v1');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','shift-for-work');e.append('<script src="/shift-for-work/client.js" type="module"></script>',{html:true})}}).on('head',{element(e){e.append('<style data-shift-work-style>'+style+'</style>',{html:true})}}).on('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]',{element(e){e.setAttribute('content',description)}}).on('script[src="/assets/shift-for-work-v1.js"],link[href="/assets/shift-for-work-v1.css"],.product-status-v42h',{element(e){e.remove()}}).transform(new Response(upstream.body,{status:upstream.status,headers}));
}};
