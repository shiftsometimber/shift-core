import assert from 'node:assert/strict';
import {ORGANIC_LINK_EDITS,ORGANIC_SITEMAP_ALIAS} from '../public-seo-organic-links.mjs';
import {APPROVED_LINK_EDITS} from '../public-seo-link-repairs.mjs';
const ORIGIN='https://shiftsometimber.co.uk';
export async function verifyOrganicDelivery(fetcher=fetch){
 const evidence=[];
 for(const [path,pairs] of [...Object.entries(ORGANIC_LINK_EDITS),['/mens-mental-health',[APPROVED_LINK_EDITS['/mens-mental-health']]]]){
  const response=await fetcher(ORIGIN+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,'Approved public destination must serve 200: '+path);
  const html=await response.text();
  for(const [before,after,count=1] of pairs){assert(!html.includes(before),'Retired anchor remains live: '+path);assert.equal(html.split(after).length-1,count,'Approved anchor not delivered exactly: '+path);}
  evidence.push({path,status:response.status,approvedAnchors:pairs.length});
 }
 const response=await fetcher(ORIGIN+'/sitemap.xml',{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,'Live sitemap must serve 200');
 const xml=await response.text(),locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert(locs.length,'Live sitemap must contain URLs');assert(!locs.includes(ORIGIN+ORGANIC_SITEMAP_ALIAS),'Redirect alias remains in live sitemap');
 assert(locs.includes(ORIGIN+'/compare-weight-loss-treatments'),'Canonical comparison owner missing from sitemap');
 return {at:new Date().toISOString(),scope:'nine approved aliases plus the existing urgent-support repair and live sitemap',pages:evidence,sitemapCount:locs.length};
}
