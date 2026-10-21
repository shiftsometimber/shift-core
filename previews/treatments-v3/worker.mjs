import {main,style} from './content.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url),preview=['/','/treatment-centre','/treatment-centre/'].includes(url.pathname);
 if(!['GET','HEAD'].includes(request.method))return new Response('Preview is read-only',{status:405,headers:{'Allow':'GET, HEAD'}});
 const target=new URL('https://shiftsometimber.co.uk'+(preview?'/treatment-centre':url.pathname)+url.search);
 const upstream=await env.CORE.fetch(new Request(target,request));
 const headers=new Headers(upstream.headers);headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','private, no-store');
 if(!preview||!upstream.ok||!(headers.get('Content-Type')||'').includes('text/html'))return new Response(upstream.body,{status:upstream.status,headers});
 for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 headers.set('X-Shift-Treatments-Preview','20261021-fuller-v3');
 const response=new Response(upstream.body,{status:upstream.status,headers});
 return new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','tv');e.setAttribute('data-treatments-preview','20261021-fuller-v3');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','shift-treatments')}}).on('head',{element(e){e.append('<style data-treatments-preview-style>'+style+'</style>',{html:true})}}).transform(response);
}};
