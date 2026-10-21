import {main,style as previewStyle} from '../../previews/treatments-v3/content.mjs';
const previewOnly='html body .cookie-banner-v3a,html body #sstCookieSettings,html body #askTimberLaunch,html body .ask-timber-launch{display:none!important}';
if(!previewStyle.includes(previewOnly))throw Error('Preview style boundary changed');
export const style=previewStyle.replace(previewOnly,'');
export {main};
export default {async fetch(request,env){
 const url=new URL(request.url);
 const upstream=await env.CORE.fetch(request);
 if(!['GET','HEAD'].includes(request.method)||!['/treatment-centre','/treatment-centre/'].includes(url.pathname)||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return upstream;
 const headers=new Headers(upstream.headers);headers.set('Cache-Control','private, no-store');
 for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 headers.set('X-Shift-Treatments-Version','20261021-fuller-v3');
 const response=new Response(upstream.body,{status:upstream.status,headers});
 return new HTMLRewriter().on('.product-status-v42h',{element(e){e.remove()}}).on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','tv');e.setAttribute('data-treatments-version','20261021-fuller-v3');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','shift-treatments')}}).on('head',{element(e){e.append('<style data-treatments-version-style>'+style+'</style>',{html:true})}}).transform(response);
}};
