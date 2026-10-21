import {healthVisionMain,healthVisionStyle} from './shift-health-vision-content.mjs';
export const MARKER='20261021';
export function presentHealth(html){
 if(html.includes('data-health-vision="'+MARKER+'"'))return html;
 const mains=[...html.matchAll(/<main\b[\s\S]*?<\/main>/gi)];
 if(mains.length!==1||!html.includes('</head>'))return html;
 const main='<main id="main-content" data-shift-health class="shv" data-health-vision="'+MARKER+'">'+healthVisionMain+'</main>';
 return html.replace(mains[0][0],()=>main).replace(/<body\b([^>]*)>/i,(_,attrs)=>'<body'+attrs.replace(/\sdata-template=(["'])[^"']*\1/i,'')+' data-template="shift-health">').replace('</head>',()=>'<style data-health-presentation="'+MARKER+'">'+healthVisionStyle+'\n[data-shift-health]{--b:#050505;--c:#e7e3da;--g:#707762;--l:#a7af94;display:block;min-width:0}[data-shift-health] img{max-width:100%}</style></head>');
}
export default {async fetch(request,env){
 const incoming=new URL(request.url);
 const preview=incoming.hostname.endsWith('.workers.dev');
 const coreRequest=preview?new Request('https://shiftsometimber.co.uk'+incoming.pathname+incoming.search,request):request;
 const response=await env.CORE.fetch(coreRequest);
 if(!['GET','HEAD'].includes(request.method)||!['/shift-health','/shift-health/'].includes(incoming.pathname)||!response.ok||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const html=await response.clone().text(),updated=presentHealth(html);
 if(updated===html)return response;
 const headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('X-Shift-Health-Presentation',MARKER);
 return new Response(request.method==='HEAD'?null:updated,{status:response.status,statusText:response.statusText,headers});
}};
