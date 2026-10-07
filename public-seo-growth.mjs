import assert from 'node:assert/strict';
import {RANKING_GROWTH_PAGES} from './public-seo-growth-data.mjs';
export const RANKING_GROWTH_DATE='2026-10-07';
export const RANKING_GROWTH_PATHS=Object.freeze(Object.keys(RANKING_GROWTH_PAGES));
const ORIGIN='https://shiftsometimber.co.uk';
function pairs(path,html){const page=RANKING_GROWTH_PAGES[path];return page?(/<html\b/i.test(html)?page.replacements:page.replacements.filter(x=>x.kind==='body')):[];}
export function repairRankingGrowth(path,html){
 const changes=pairs(path,html);if(!changes.length)return html;
 if(changes.every(x=>html.split(x.after).length===2))return html;
 // A changed or ambiguous upstream document is never partially rewritten.
 if(!changes.every(x=>html.split(x.before).length===2&&!html.includes(x.after)))return html;
 for(const x of changes)html=html.replace(x.before,x.after);return html;
}
export function preserveRankingGrowth(path,input,{required=false}={}){
 const html=input.toString('utf8'),changes=pairs(path,html);if(!changes.length)return input;
 const present=changes.some(x=>html.includes(x.after));if(!present){assert(!required,'Approved growth copy absent: '+path);return input;}
 let restored=html;for(const x of [...changes].reverse()){assert.equal(restored.split(x.after).length,2,'Missing or duplicate approved growth change: '+path+' '+x.kind);restored=restored.replace(x.after,x.before);}
 return typeof input==='string'?restored:Buffer.from(restored);
}
export function repairRankingGrowthSitemap(xml){return xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/gi,node=>{const loc=node.match(/<loc>([^<]+)<\/loc>/i)?.[1];if(!RANKING_GROWTH_PATHS.some(p=>loc===ORIGIN+p))return node;return /<lastmod>[\s\S]*?<\/lastmod>/i.test(node)?node.replace(/<lastmod>[\s\S]*?<\/lastmod>/i,'<lastmod>'+RANKING_GROWTH_DATE+'</lastmod>'):node.replace(/<\/url>/i,'<lastmod>'+RANKING_GROWTH_DATE+'</lastmod></url>');});}
export async function withRankingGrowth(response,request){
 const u=new URL(request.url),sitemap=u.pathname==='/sitemap.xml',type=response.headers.get('Content-Type')||'';
 if(u.origin!==ORIGIN||request.method!=='GET'||response.status!==200||!(sitemap?type.includes('xml'):type.includes('text/html'))||(!sitemap&&!RANKING_GROWTH_PAGES[u.pathname]))return response;
 const before=await response.text(),after=sitemap?repairRankingGrowthSitemap(before):repairRankingGrowth(u.pathname,before),headers=new Headers(response.headers);
 if(after!==before){for(const name of ['Content-Length','ETag','Content-MD5','Digest','Last-Modified'])headers.delete(name);headers.set('X-Shift-Ranking-Growth',RANKING_GROWTH_DATE);}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
