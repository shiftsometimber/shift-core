import {withRankingGrowth} from './public-seo-growth.mjs';
import {CONTEXT_LINK_PAIRS} from './public-seo-context-data.mjs';
const ORIGIN='https://shiftsometimber.co.uk';
export const CONTEXT_UPDATED_PATHS=Object.keys(CONTEXT_LINK_PAIRS);
export function repairContextLinks(path,html){
 const pair=CONTEXT_LINK_PAIRS[path];if(!pair||html.includes(pair[1])||html.split(pair[0]).length!==2)return html;
 return html.replace(pair[0],pair[1]);
}
export function preserveContextLinks(path,input){
 const pair=CONTEXT_LINK_PAIRS[path];if(!pair)return input;
 const html=input.toString('utf8'),restored=html.split(pair[1]).length===2?html.replace(pair[1],pair[0]):html;
 return input instanceof Uint8Array?input.constructor.from(new TextEncoder().encode(restored)):restored;
}
export function repairContextSitemap(xml){
 return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi,node=>{
  const loc=node.match(/<loc>([^<]+)<\/loc>/i)?.[1];if(!CONTEXT_UPDATED_PATHS.some(path=>loc===ORIGIN+path))return node;
  return /<lastmod>[\s\S]*?<\/lastmod>/i.test(node)?node.replace(/<lastmod>[\s\S]*?<\/lastmod>/i,'<lastmod>2026-10-06</lastmod>'):node.replace(/<\/url>/i,'<lastmod>2026-10-06</lastmod></url>');
 });
}
export async function withContextSeo(response,request){
 response=await withRankingGrowth(response,request);
 const u=new URL(request.url),sitemap=u.pathname==='/sitemap.xml',type=response.headers.get('Content-Type')||'';
 if(u.origin!==ORIGIN||request.method!=='GET'||response.status!==200||!(sitemap?type.includes('xml'):type.includes('text/html'))||(!sitemap&&!CONTEXT_LINK_PAIRS[u.pathname]))return response;
 const before=await response.text(),after=sitemap?repairContextSitemap(before):repairContextLinks(u.pathname,before),headers=new Headers(response.headers);
 if(after!==before){for(const name of ['Content-Length','ETag','Content-MD5','Digest'])headers.delete(name);headers.set('X-Shift-Context-SEO','2026-10-06');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
