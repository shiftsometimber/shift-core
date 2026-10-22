import {mainFor,catalogueProducts,version,path} from './production-page.mjs';
import style from './style.mjs';
import client from './client.mjs';
import {ticker} from './production-ticker.mjs';
export const releaseVersion='20261022-options-live-v1';
const names=new Set(['Mounjaro','Wegovy injection','Wegovy tablets','Orlistat','Foundayo','Liraglutide']);
export function liveProducts(data){
 if(!Array.isArray(data?.products))throw Error('Live catalogue missing');
 const products=data.products.filter(p=>names.has(p.name));
 if(products.length!==6||new Set(products.map(p=>p.name)).size!==6)throw Error('Live medicine catalogue changed');
 const ids=new Set();
 for(const p of products){if(!Array.isArray(p.variants)||!p.variants.length)throw Error('No live variants');for(const v of p.variants){if(!Number.isSafeInteger(v.id)||v.id<=0||ids.has(v.id)||!Number.isSafeInteger(v.pricePence)||v.pricePence<0||typeof v.strengthLabel!=='string'||typeof v.status!=='string')throw Error('Invalid live variant');ids.add(v.id);}}
 return catalogueProducts({products});
}
export function isBrowse(url){
 if([path,path+'/',path+'.html'].includes(url.pathname))return true;
 if(!['/treatment-order','/treatment-order/','/treatment-order.html'].includes(url.pathname))return false;
 return [...url.searchParams.keys()].every(k=>['medicine','format'].includes(k));
}
export async function readLiveProducts(env){
 const r=await env.CORE.fetch(new Request('https://api.shiftsometimber.co.uk/v1/catalogue/medicines',{headers:{Accept:'application/json','Cache-Control':'no-cache'}}));
 if(!r.ok)throw Error('Live catalogue unavailable');return liveProducts(await r.json());
}
export default {async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev'),read=['GET','HEAD'].includes(request.method);
 if(preview&&!read)return new Response('Read-only release verification.',{status:405,headers:{Allow:'GET, HEAD'}});
 if(read&&url.pathname===path+'/client.js')return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 const target=preview?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 if(!read||!isBrowse(url))return env.CORE.fetch(target);
 const shellUrl=new URL('/treatment-order'+url.search,'https://shiftsometimber.co.uk');
 const upstream=await env.CORE.fetch(new Request(shellUrl,{method:'GET',headers:request.headers}));
 if(!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 let products;try{products=await readLiveProducts(env);}catch{return upstream;}
 const {main,product}=mainFor(url,products),headers=new Headers(upstream.headers);
 for(const h of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(h);
 headers.set('Cache-Control','private, no-store');headers.set('X-Shift-Treatment-Options-Version',releaseVersion);headers.set('X-Shift-Treatment-Options-Design',version);headers.set('X-Shift-Catalogue-Source','live');
 if(preview){headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Shift-Treatment-Options-Preview',version);}
 let hadTicker=false;
 return new HTMLRewriter().on('#shift-public-news',{element(){hadTicker=true}}).on('main',{element(e){if(!hadTicker)e.before(ticker,{html:true});e.setAttribute('id','main-content');e.setAttribute('class','to');e.setAttribute('data-treatment-options-preview',version);e.setAttribute('data-treatment-options-release',releaseVersion);e.setInnerContent(main,{html:true});}}).on('head',{element(e){e.append('<style data-treatment-options-style>'+style+'</style>',{html:true});}}).on('title',{element(e){e.setInnerContent((product?product.name+' options':'Explore treatment options')+' | SHIFT Some Timber');}}).on('script',{element(e){const src=e.getAttribute('src')||'';if(/^\/(?:treatment-medication-catalogue-v1|treatment-order-prototype-v1|medicine-front-door-integrated-v1)\.js(?:\?|$)/.test(src))e.remove();}}).on('body',{element(e){e.setAttribute('data-template','treatment-options');e.append('<script src="'+path+'/client.js" type="module"></script><script defer src="/assets/public-news-ticker-v1.js?v=public-news-20260917-r4"></script>',{html:true});}}).transform(new Response(request.method==='HEAD'?null:upstream.body,{status:200,headers}));
}};
