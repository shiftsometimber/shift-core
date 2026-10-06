import test from 'node:test';import assert from 'node:assert/strict';
import {CONTEXT_LINK_PAIRS} from '../public-seo-context-data.mjs';
import {repairContextLinks,preserveContextLinks,repairContextSitemap,withContextSeo} from '../public-seo-context.mjs';
test('only five exact public locations gain relevant links; reverse preserves every previous byte',()=>{
 assert.equal(Object.keys(CONTEXT_LINK_PAIRS).length,5);
 for(const [path,[before,after]] of Object.entries(CONTEXT_LINK_PAIRS)){
  const original='<main>'+before+'<p>Clinical wording, dates and author remain unchanged.</p></main>';
  const patched=repairContextLinks(path,original);assert.equal(patched,original.replace(before,after));assert.equal(repairContextLinks(path,patched),patched);
  assert.equal(preserveContextLinks(path,patched),original);assert.deepEqual(preserveContextLinks(path,Buffer.from(patched)),Buffer.from(original));
  assert.equal(preserveContextLinks(path,patched+'unknown edit'),original+'unknown edit');
  assert.equal(repairContextLinks(path,before+before),before+before);assert.equal(repairContextLinks(path,'unrecognised markup'),'unrecognised markup');
 }
 for(const path of ['/','/start-here','/member/dashboard','/api/private'])assert.equal(repairContextLinks(path,'untouched'),'untouched');
});
test('destinations are the three existing canonical guides and no new medical assertions appear',()=>{
 const targets=new Set();
 for(const [,after] of Object.values(CONTEXT_LINK_PAIRS)){
  for(const m of after.matchAll(/href="([^"]+)"/g))if(!m[1].includes('compare-weight-loss-treatments'))targets.add(m[1]);
  assert(!/sponsored|nofollow|target="_blank"/.test(after));
 }
 assert.deepEqual([...targets].sort(),['/comparisons/medications/mounjaro-vs-orlistat','/comparisons/medications/mounjaro-vs-saxenda','/mental-health/mental-health-and-weight'].sort());
});
test('sitemap dates change only on the five significantly updated link sources',()=>{
 const paths=[...Object.keys(CONTEXT_LINK_PAIRS),'/','/start-here','/mental-health/mental-health-and-weight'];
 const xml='<urlset>'+paths.map(p=>'<url><loc>https://shiftsometimber.co.uk'+p+'</loc><lastmod>2026-09-19</lastmod></url>').join('')+'</urlset>';
 const updated=repairContextSitemap(xml);assert.equal((updated.match(/2026-10-06/g)||[]).length,5);assert.equal(repairContextSitemap(updated),updated);
 assert.deepEqual(updated.match(/<loc>[^<]+<\/loc>/g),xml.match(/<loc>[^<]+<\/loc>/g));assert(updated.includes('<loc>https://shiftsometimber.co.uk/start-here</loc><lastmod>2026-09-19</lastmod>'));
 assert.equal(repairContextSitemap('<url><loc>https://elsewhere.test/orlistat-definitive-uk-guide</loc></url>'),'<url><loc>https://elsewhere.test/orlistat-definitive-uk-guide</loc></url>');
});
test('private methods, other origins, error statuses and unsuitable content remain untouched',async()=>{
 const path=Object.keys(CONTEXT_LINK_PAIRS)[0],body=CONTEXT_LINK_PAIRS[path][0];
 for(const [url,method,status,type] of [['https://shiftsometimber.co.uk'+path,'POST',200,'text/html'],['https://other.test'+path,'GET',200,'text/html'],['https://shiftsometimber.co.uk'+path,'GET',404,'text/html'],['https://shiftsometimber.co.uk'+path,'GET',200,'application/json'],['https://shiftsometimber.co.uk/','GET',200,'text/html']]){
  const response=new Response(body,{status,headers:{'Content-Type':type}});assert.equal(await withContextSeo(response,new Request(url,{method})),response);
 }
 const r=await withContextSeo(new Response(body,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'10'}}),new Request('https://shiftsometimber.co.uk'+path));assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Length'),null);assert.equal(r.headers.get('X-Shift-Context-SEO'),'2026-10-06');
});
