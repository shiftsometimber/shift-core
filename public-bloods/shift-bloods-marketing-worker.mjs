import {withArticleResponsePolicy} from './public-response-policy.mjs';
import {isPublicBloodsRequest,addBloodsEntry,addApprovedHomeTestFaq,BLOODS_ENTRY_STYLE,INDEXABLE_BLOODS_PATHS,retirePublicShedNavigation} from './shift-bloods-public.mjs';
const HEALTH_PATHS=new Set(['/shift-health','/shift-health/','/shift-health.html']);
const APPROVED_PAGES_ORIGINS=new Set(['https://projectshift.pages.dev','https://88265868.projectshift.pages.dev']);
export async function marketingResponse(request,env={},fetcher=fetch){
 const url=new URL(request.url),health=HEALTH_PATHS.has(url.pathname);
 if(!health&&!isPublicBloodsRequest(request))return new Response('SHIFT Bloods page not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 if(!['GET','HEAD'].includes(request.method))return new Response('Ordering is not open',{status:405,headers:{Allow:'GET, HEAD','Cache-Control':'no-store'}});
 if(health&&url.pathname!=='/shift-health')return Response.redirect(new URL('/shift-health',url).href,301);
 const origin=env.PAGES_ORIGIN||'https://projectshift.pages.dev';
 if(!APPROVED_PAGES_ORIGINS.has(origin))return new Response('Public information temporarily unavailable',{status:503});
 // Only public HTML is requested. Cookies, authorisation and query strings are not forwarded.
 const upstream=health?'https://api.shiftsometimber.co.uk/shift-health':origin+url.pathname.replace(/\/$/,'');
 const response=await fetcher(upstream,{method:'GET',headers:{Accept:'text/html'},redirect:'manual'});
 const headers=new Headers(response.headers);headers.delete('Set-Cookie');headers.delete('Content-Length');headers.delete('Content-Encoding');headers.delete('ETag');
 headers.set('X-Shift-Bloods-Public','coming-soon-20261018');
 if(!response.ok)return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers});
 let html=await response.text();
 if(url.pathname.replace(/\/$/,'')==='/shift-health/blood-tests')html=addApprovedHomeTestFaq(html);
 if(url.pathname.replace(/\/$/,'')==='/shift-health/blood-tests'&&!/<script\b[^>]*src=["'][^"']*\/consent-v4a\.js(?:[?"'])/i.test(html))html=html.replace(/<\/body>/i,'<script src="/consent-v4a.js" defer></script></body>');
 if(!health&&INDEXABLE_BLOODS_PATHS.includes(url.pathname.replace(/\/$/,''))&&!/<meta\b[^>]*(?:name|property)\s*=\s*["']twitter:card["']/i.test(html)){
  html=html.replace(/<\/head>/i,'<meta name="twitter:card" content="summary_large_image">\n</head>');
 }
 if(health&&!html.includes('id="health-bloods-heading"')){
  if(!html.includes('<section class="wrap intro"'))return new Response(request.method==='HEAD'?null:html,{status:response.status,headers});
  html=addBloodsEntry(html).replace('</head>','<style data-shift-bloods-entry>'+BLOODS_ENTRY_STYLE+'</style></head>');
 }
 html=retirePublicShedNavigation(html);
 headers.set('X-Shift-Navigation-Policy','approved-20261031');
 headers.set('Content-Type','text/html; charset=utf-8');
 return new Response(request.method==='HEAD'?null:html,{status:200,headers});
}
export default {fetch(request,env){return marketingResponse(request,env).then(withArticleResponsePolicy);}};

