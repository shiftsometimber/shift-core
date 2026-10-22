import {main,style,client,images} from './content.mjs';
export const pagePaths=new Set(['/start-here','/start-here/','/start-here.html']);
export {main,style,client};
const version='20261021-welcome-v1';
export default {async fetch(request,env){
 const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 if(read&&url.pathname==='/start-here/client.js')return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 const imageName=url.pathname.startsWith('/start-here/assets/')?url.pathname.slice('/start-here/assets/'.length):'';
 if(read&&Object.hasOwn(images,imageName))return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(images[imageName]),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
 const target=url.hostname.endsWith('.workers.dev')?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 const upstream=await env.CORE.fetch(target);
 if(!read||!pagePaths.has(url.pathname)||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 const headers=new Headers(upstream.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Shift-Start-Version',version);
 for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 return new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','sw');e.setAttribute('data-start-welcome-version',version);e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','start-here-welcome');e.append('<script src="/start-here/client.js" defer></script>',{html:true})}}).on('head',{element(e){e.append('<style data-start-welcome-style>'+style+'</style>',{html:true})}}).on('title',{element(e){e.setInnerContent('Start Here | SHIFT Some Timber')}}).on('meta[name="description"]',{element(e){e.setAttribute('content','Choose your starting point: free My Timber support, weight-loss guidance, SHIFT Health and blood-test information.')}}).on('script[src]',{element(e){const path=e.getAttribute('src')?.split('?')[0];if(['/assets/start-here-support-v1.js','/start-here-v72.js','/assets/member-experience/passport.js'].includes(path))e.remove()}}).on('#shift-public-news',{element(e){e.remove()}}).on('.product-status-v42h',{element(e){e.remove()}}).transform(new Response(upstream.body,{status:upstream.status,headers}));
}};
