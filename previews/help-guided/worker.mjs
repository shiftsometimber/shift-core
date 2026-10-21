import {main,style,client} from './content.mjs';
const origin='https://shiftsometimber.co.uk';
const finish=r=>{const h=new Headers(r.headers);h.set('X-Robots-Tag','noindex, nofollow');h.set('Cache-Control','private, no-store');return new Response(r.body,{status:r.status,headers:h});};
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return finish(new Response('Help preview is read-only',{status:405,headers:{Allow:'GET, HEAD'}}));
 if(u.pathname==='/help-preview/client.js')return finish(new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8'}}));
 const page=['/','/help','/help/'].includes(u.pathname),target=origin+(page?'/help':u.pathname)+u.search;
 const upstream=await env.CORE.fetch(new Request(target,{method:request.method}));
 if(!page||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return finish(upstream);
 const h=new Headers(upstream.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(k);h.set('X-Shift-Help-Preview','20261021-guided-v1');
 return finish(new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','hg');e.setAttribute('data-help-guided-preview','20261021');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','help-guided');e.append('<script src="/help-preview/client.js" defer></script>',{html:true})}}).on('head',{element(e){e.append('<style data-help-guided-style>'+style+'</style>',{html:true})}}).on('a[href]',{element(e){const link=e.getAttribute('href');if(link?.startsWith('/')&&!link.startsWith('//'))e.setAttribute('href',origin+link)}}).on('script[src]',{element(e){if(['/analytics-bootstrap-v1.js','/analytics-v3a.js','/analytics-events-v31b.js','/register-sw-v3a.js'].includes(e.getAttribute('src')?.split('?')[0]))e.remove();}}).on('.product-status-v42h',{element(e){e.remove()}}).transform(new Response(upstream.body,{status:upstream.status,headers:h})));
}};
