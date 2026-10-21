import {main,style,client} from '../../previews/help-guided/content.mjs';
export {main,style,client};
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/help/client.js'&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 const target=url.hostname.endsWith('.workers.dev')?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 const upstream=await env.CORE.fetch(target);
 if(!['GET','HEAD'].includes(request.method)||!['/help','/help/'].includes(url.pathname)||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 const headers=new Headers(upstream.headers);headers.set('Cache-Control','private, no-store');
 for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 headers.set('X-Shift-Help-Version','20261021-guided-v1');
 return new HTMLRewriter().on('.product-status-v42h',{element(e){e.remove()}}).on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','hg');e.setAttribute('data-help-version','20261021-guided-v1');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','help-guided');e.append('<script src="/help/client.js" defer></script>',{html:true})}}).on('head',{element(e){e.append('<style data-help-guided-style>'+style+'</style>',{html:true})}}).transform(new Response(upstream.body,{status:upstream.status,headers}));
}};
