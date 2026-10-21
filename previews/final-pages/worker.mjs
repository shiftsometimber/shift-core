import {pages,style,ticker} from './content.mjs';
export {pages,style,ticker};
export function findPage(pathname){return Object.entries(pages).find(([,page])=>[page.path,page.path+'/',page.path+'.html'].includes(pathname));}
export default {async fetch(request,env){
 const url=new URL(request.url),read=['GET','HEAD'].includes(request.method),preview=url.hostname.endsWith('.workers.dev');
 if(preview&&!read)return new Response('Preview requests are read-only.',{status:405,headers:{Allow:'GET, HEAD'}});
 if(read)for(const page of Object.values(pages)){
  if(url.pathname===page.path+'/client.js')return new Response(request.method==='HEAD'?null:page.client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  const prefix=page.path+'/assets/',name=url.pathname.startsWith(prefix)?url.pathname.slice(prefix.length):'';
  if(Object.hasOwn(page.images,name))return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(page.images[name]),x=>x.charCodeAt(0)),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
 }
 const target=preview?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 const upstream=await env.CORE.fetch(target),matched=findPage(url.pathname);
 if(!read||!matched||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 const [key,page]=matched,headers=new Headers(upstream.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Shift-Final-Pages-Version',page.version);
 if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
 for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 let hasTicker=false;return new HTMLRewriter().on('#shift-public-news',{element(){hasTicker=true}}).on('main',{element(e){if(!hasTicker)e.before(ticker,{html:true});e.setAttribute('id','main-content');e.setAttribute('class','fn f'+key);e.setAttribute('data-final-page',key);e.setAttribute('data-final-pages-version',page.version);if(key==='talk')e.setAttribute('data-good-to-talk-version',page.version);e.setInnerContent(page.main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template',page.template);e.append('<script src="'+page.path+'/client.js" type="module"></script>',{html:true})}}).on('head',{element(e){e.append('<style data-final-pages-style>'+style+'</style>',{html:true})}}).on('title',{element(e){e.setInnerContent(page.title)}}).on('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]',{element(e){e.setAttribute('content',page.description)}}).on('meta[property="og:title"],meta[name="twitter:title"]',{element(e){e.setAttribute('content',page.title)}}).on('script[src="/assets/shift-for-work-v1.js"],link[href="/assets/shift-for-work-v1.css"],.product-status-v42h',{element(e){e.remove()}}).transform(new Response(upstream.body,{status:upstream.status,headers}));
}};
