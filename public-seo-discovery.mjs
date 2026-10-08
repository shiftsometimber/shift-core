// Public ownership token for IndexNow's root text-file verification.
export const INDEXNOW_KEY='sst-20261006-8b91dc65ee8f490dafce058913ceb62f';
export const INDEXNOW_PATH='/'+INDEXNOW_KEY+'.txt';
const ORIGIN='https://shiftsometimber.co.uk';
export function discoveryRoute(request){
 const u=new URL(request.url);if(u.origin!==ORIGIN||u.pathname!==INDEXNOW_PATH||!['GET','HEAD'].includes(request.method))return null;
 return new Response(request.method==='HEAD'?null:INDEXNOW_KEY,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Length':String(INDEXNOW_KEY.length),'Cache-Control':'public, max-age=3600','X-Robots-Tag':'noindex','X-Shift-Discovery-SEO':'2026-10-06'}});
}
export const SUPPORT_DISCOVERY_BLOCK='## My Timber support and continuity\n- https://shiftsometimber.co.uk/weight-loss-support-for-men\n- https://shiftsometimber.co.uk/articles/stopping-glp1\n- https://shiftsometimber.co.uk/articles/food-noise-after-stopping-glp1\n- https://shiftsometimber.co.uk/husband-help\n- https://shiftsometimber.co.uk/my-timber-for-providers';
export function repairDiscoveryTxt(text){
 const cleaned=text.replace(/^- https:\/\/shiftsometimber\.co\.uk\/treatment-order\r?\n/gm,'');
 if(cleaned.includes('https://shiftsometimber.co.uk/weight-loss-support-for-men'))return cleaned;
 const base=cleaned.trimEnd();return (base?base+'\n\n':'')+SUPPORT_DISCOVERY_BLOCK+'\n';
}
export const PUBLICATION_UPDATES=['/comparisons/medications/wegovy-vs-orlistat','/guides/cagrisema-uk-guide'];
export function repairDiscoverySitemap(xml){
 return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi,node=>{
  const loc=node.match(/<loc>([^<]+)<\/loc>/i)?.[1];
  if(!PUBLICATION_UPDATES.some(path=>loc===ORIGIN+path))return node;
  return /<lastmod>[\s\S]*?<\/lastmod>/i.test(node)?node.replace(/<lastmod>[\s\S]*?<\/lastmod>/i,'<lastmod>2026-10-06</lastmod>'):node.replace(/<\/url>/i,'<lastmod>2026-10-06</lastmod></url>');
 });
}
export async function withDiscoverySeo(response,request){
 const u=new URL(request.url);
 const sitemap=u.pathname==='/sitemap.xml',type=response.headers.get('Content-Type')||'';
 if(u.origin!==ORIGIN||(!sitemap&&u.pathname!=='/llms.txt')||request.method!=='GET'||response.status!==200||!(sitemap?type.includes('xml'):type.includes('text/plain')))return response;
 const before=await response.text(),after=sitemap?repairDiscoverySitemap(before):repairDiscoveryTxt(before),headers=new Headers(response.headers);
 if(after!==before){for(const name of ['Content-Length','ETag','Content-MD5','Digest'])headers.delete(name);headers.set('X-Shift-Discovery-SEO','2026-10-07');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
