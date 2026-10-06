import {ARTICLE_IDENTITY_REPAIRS,NOINDEX_SITEMAP_PATHS,LOGO_ARTICLE_PATHS} from './public-seo-technical-data.mjs';
const ORIGIN='https://shiftsometimber.co.uk';
const excluded=new Set(NOINDEX_SITEMAP_PATHS);
const articleTypes=new Set(['Article','BlogPosting','NewsArticle']);
const logoPaths=new Set(LOGO_ARTICLE_PATHS);
function repairNode(node,path){
 if(Array.isArray(node))return node.map(item=>repairNode(item,path));
 if(!node||typeof node!=='object')return node;
 const result={...node};
 if(articleTypes.has(result['@type'])){
  const identity=ARTICLE_IDENTITY_REPAIRS[path];
  if(identity&&result.mainEntityOfPage===ORIGIN+'/knowledge'){
   result.headline=identity.headline;result.description=identity.description;result.mainEntityOfPage=identity.canonical;
  }
  // A publisher logo stays under publisher.logo; it is not an article photograph.
  if(typeof result.image==='string'&&result.image===ORIGIN+'/assets/shift-wordmark.png')delete result.image;
 }
 for(const key of Object.keys(result))if(result[key]&&typeof result[key]==='object')result[key]=repairNode(result[key],path);
 return result;
}
export function repairTechnicalHtml(html,path){
 return html.replace(/(<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script\s*>)/gi,(whole,open,json,close)=>{
  try{const original=JSON.parse(json),repaired=repairNode(original,path);return JSON.stringify(original)===JSON.stringify(repaired)?whole:open+JSON.stringify(repaired).replace(/</g,'\\u003c')+close;}catch{return whole;}
 });
}
export function repairTechnicalSitemap(xml){
 return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url\s*>/gi,node=>{
  const loc=node.match(/<loc>([^<]+)<\/loc>/i)?.[1];
  try{const u=new URL(loc);return u.origin===ORIGIN&&excluded.has(u.pathname)?'':node;}catch{return node;}
 });
}
export async function withTechnicalSeo(response,request){
 const url=new URL(request.url),path=url.pathname;
 if(request.method!=='GET'||response.status!==200||url.origin!==ORIGIN||path==='/'||path==='/start-here')return response;
 const sitemap=path==='/sitemap.xml';
 const html=response.headers.get('Content-Type')?.includes('text/html');
 if(!sitemap&&(!html||!(logoPaths.has(path)||ARTICLE_IDENTITY_REPAIRS[path])))return response;
 if(!sitemap&&/^\/(?:member|v1|api|hq|work|auth|checkout|treatment-order)(?:\/|$|-)/.test(path))return response;
 const original=await response.text(),updated=sitemap?repairTechnicalSitemap(original):repairTechnicalHtml(original,path);
 const headers=new Headers(response.headers);
 if(updated!==original){
  for(const h of ['Content-Length','ETag','Content-MD5','Digest'])headers.delete(h);
  headers.set('X-Shift-Technical-SEO','2026-10-06');
  if(sitemap)headers.set('X-Shift-Sitemap-Authority','indexable-canonical-estate-v2');
 }
 return new Response(updated,{status:response.status,statusText:response.statusText,headers});
}
