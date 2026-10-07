import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {repairRankingGrowth,preserveRankingGrowth,repairRankingGrowthSitemap,withRankingGrowth,RANKING_GROWTH_PATHS} from '../public-seo-growth.mjs';
import {withContextSeo} from '../public-seo-context.mjs';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/seo-growth-20261007.json',import.meta.url)));
const main=h=>h.match(/<main\b[\s\S]*?<\/main>/i)[0];
test('complete current responses gain precisely the owner-reviewed title, description and article changes',()=>{
 assert.equal(RANKING_GROWTH_PATHS.length,3);assert.deepEqual(RANKING_GROWTH_PATHS,Object.keys(fixtures));
 for(const [path,f] of Object.entries(fixtures)){
  const after=repairRankingGrowth(path,f.before);assert.equal(main(after),f.expectedMain);assert(after.includes('<title>'+f.title+'</title>'));assert(after.includes('<meta name="description" content="'+f.description+'">'));
  assert.equal(preserveRankingGrowth(path,after,{required:true}),f.before);assert.equal(repairRankingGrowth(path,after),after);assert.equal(preserveRankingGrowth(path,f.before),f.before);
  assert.equal(after.match(/<h1>[\s\S]*?<\/h1>/)[0],f.before.match(/<h1>[\s\S]*?<\/h1>/)[0]);assert.equal((after.match(/<h1>/g)||[]).length,1);assert(after.includes('not independent clinical review'));assert(after.includes('19 September 2026'));
  assert.equal(preserveRankingGrowth(path,Buffer.from(after),{required:true}).toString(),f.before);assert.equal(preserveRankingGrowth(path,main(after),{required:true}),main(f.before));
  const extra=after.replace('</main>','<p>Unknown extra publication remains in the comparison.</p></main>');assert.notEqual(preserveRankingGrowth(path,extra),f.before);assert.throws(()=>preserveRankingGrowth(path,f.before,{required:true}));
  assert.throws(()=>preserveRankingGrowth(path,after.replace(main(after),main(after)+main(after))));
  const drift=f.before.replace(f.bodyBefore,'<p>Upstream source changed.</p>');assert.equal(repairRankingGrowth(path,drift),drift);
 }
});
test('sitemap dates change on only the three reviewed canonical URLs',()=>{
 const paths=[...RANKING_GROWTH_PATHS,'/','/start-here','/articles/wegovy-side-effects-timeline'];const xml='<urlset>'+paths.map(p=>'<url><loc>https://shiftsometimber.co.uk'+p+'</loc><lastmod>2026-09-19</lastmod></url>').join('')+'</urlset>';
 const after=repairRankingGrowthSitemap(xml);assert.equal((after.match(/2026-10-07/g)||[]).length,3);assert.deepEqual(after.match(/<loc>[^<]+<\/loc>/g),xml.match(/<loc>[^<]+<\/loc>/g));assert.equal(repairRankingGrowthSitemap(after),after);assert(after.includes('<loc>https://shiftsometimber.co.uk/</loc><lastmod>2026-09-19</lastmod>'));
});
test('production wrapper composition preserves protected routes and enforces origin, method, type and status',async()=>{
 for(const path of ['/','/start-here','/member/dashboard','/treatment-order','/articles/wegovy-side-effects-timeline']){const r=new Response('untouched',{headers:{'Content-Type':'text/html'}});assert.equal(await withRankingGrowth(r,new Request('https://shiftsometimber.co.uk'+path)),r);}
 for(const [path,f] of Object.entries(fixtures)){
  for(const [origin,method,status,type] of [['https://other.test','GET',200,'text/html'],['https://shiftsometimber.co.uk','POST',200,'text/html'],['https://shiftsometimber.co.uk','HEAD',200,'text/html'],['https://shiftsometimber.co.uk','GET',404,'text/html'],['https://shiftsometimber.co.uk','GET',200,'application/json']]){const r=new Response(f.before,{status,headers:{'Content-Type':type}});assert.equal(await withRankingGrowth(r,new Request(origin+path,{method})),r);}
  const r=await withContextSeo(new Response(f.before,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'123','Last-Modified':'old'}}),new Request('https://shiftsometimber.co.uk'+path));const h=await r.text();assert.equal(main(h),f.expectedMain);assert.equal(r.headers.get('X-Shift-Ranking-Growth'),'2026-10-07');for(const key of ['ETag','Content-Length','Last-Modified'])assert.equal(r.headers.get(key),null);
 }
});
