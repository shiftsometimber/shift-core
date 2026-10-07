import {ORGANIC_LINK_EDITS} from './public-seo-organic-link-data.mjs';
export {ORGANIC_LINK_EDITS};
const ORIGIN='https://shiftsometimber.co.uk';
export const ORGANIC_SITEMAP_ALIAS='/treatments/compare';
export function repairOrganicLinks(path,html){
 for(const [before,after,count] of ORGANIC_LINK_EDITS[path]||[]){
  if(html.split(before).length-1===count&&!html.includes(after))html=html.split(before).join(after);
 }
 return html;
}
export function preserveOrganicLinks(path,input){
 let html=input.toString('utf8');
 for(const [before,after,count] of ORGANIC_LINK_EDITS[path]||[]){
  if(html.split(after).length-1===count&&!html.includes(before))html=html.split(after).join(before);
 }
 return input instanceof Uint8Array?input.constructor.from(new TextEncoder().encode(html)):html;
}
export function repairOrganicSitemap(xml){
 return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi,node=>node.match(/<loc>([^<]+)<\/loc>/i)?.[1]===ORIGIN+ORGANIC_SITEMAP_ALIAS?'':node);
}
export async function withOrganicLinkRepairs(response,request){
 const u=new URL(request.url),sitemap=u.pathname==='/sitemap.xml',type=response.headers.get('Content-Type')||'';
 if(u.origin!==ORIGIN||request.method!=='GET'||response.status!==200||!(sitemap?type.includes('xml'):type.includes('text/html'))||(!sitemap&&!ORGANIC_LINK_EDITS[u.pathname]))return response;
 const before=await response.text(),after=sitemap?repairOrganicSitemap(before):repairOrganicLinks(u.pathname,before);
 const headers=new Headers(response.headers);
 if(after!==before){for(const name of ['Content-Length','ETag','Content-MD5','Digest'])headers.delete(name);headers.set('X-Shift-Organic-Links','2026-10-07');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
