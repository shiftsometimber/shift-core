import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTICLES,PATHS,UPDATED,STATS,VERSION,rewriteArticle,articleMain,updateArticleSitemap} from '../editorial/five-articles/render.mjs';
import {withEditorialResources} from '../editorial-resources-v1.js';
import {CSV,CHART,DATA} from '../editorial/statistics/assets.js';
import {setSitemapDate} from '../radar-editorial-trust-v1.js';
const origin='https://shiftsometimber.co.uk';
const shell=(path)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Old</title><meta content="old" name="description"><meta name='DESCRIPTION' content='duplicate'><meta content="wrong" property="og:title"><link href="/old" rel="canonical"><LINK REL=canonical HREF='/also-old'><script data-old type="application/ld+json">{"@type":"Article","datePublished":"2026-08-03","headline":"Wrong generic headline"}</script><script type='application/ld+json'>{"@type":"FAQPage"}</script><script src="/retained-site-script.js"></script></head><body><header>Retained header</header><main id="main-content"><h1>Old body</h1></main><footer>Retained footer</footer></body></html>`;
const count=(s,re)=>[...s.matchAll(re)].length;
test('exactly the five owner-approved canonical routes are in scope',()=>{
 assert.deepEqual(PATHS.sort(),['/comparisons/medications/mounjaro-vs-orlistat','/comparisons/medications/mounjaro-vs-saxenda','/guides/nhs-weight-loss-medication-pathways','/mental-health/mental-health-and-weight',STATS].sort());
});
for(const path of PATHS){
 test(path+' has one truthful main, H1, canonical, description and article schema',()=>{
  const html=rewriteArticle(shell(path),path);
  assert.equal(count(html,/<main\b/g),1);assert.equal(count(html,/<h1\b/g),1);
  assert.equal(count(html,/<link rel="canonical"/g),1);assert.ok(html.includes('href="'+origin+path+'"'));
  assert.equal(count(html,/<meta name="description"/g),1);assert.equal(count(html,/<meta property="og:title"/g),1);
  const schemas=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  assert.equal(schemas.length,1);const article=schemas[0]['@graph'].find(x=>x['@type']==='Article');
  assert.equal(article.headline,ARTICLES[path].title);assert.equal(article.dateModified,UPDATED);assert.equal(article.datePublished,'2026-08-03');assert.equal(article.url,origin+path);
  assert.equal(article.reviewedBy,undefined);assert.equal(article.aggregateRating,undefined);assert.ok(html.includes('not independent clinical review'));
  assert.match(html,/<header>Retained header<\/header>/);assert.match(html,/<footer>Retained footer<\/footer>/);assert.ok(html.includes('<script src="/retained-site-script.js"></script>'));
  assert.doesNotMatch(html,/FAQPage|Wrong generic headline|being built|10\/10|5\/10|3\/10|reviewedBy/);
 });
 test(path+' has usable anchors, source-specific citations and a visible change record',()=>{
  const html=articleMain(path),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
  for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),'Missing anchor '+m[1]);
  assert.ok(ARTICLES[path].sources.length>=4);assert.ok(ARTICLES[path].sections.length>=5);assert.ok(html.includes('What changed on 19 September 2026'));
  for(let n=1;n<=ARTICLES[path].sources.length;n++)assert.ok(html.includes('href="#source-'+n+'"'),'Uncited source '+n);
  for(const source of ARTICLES[path].sources){const u=new URL(source.url);assert.equal(u.protocol,'https:');assert.ok(!u.hostname.endsWith('nice.org.uk')&&!u.hostname.endsWith('pharmacyregulation.org'),'Pending publisher adaptation scope must not be bypassed');}
 });
 test(path+' rewriting is idempotent and keeps missing publication dates missing',()=>{
  const one=rewriteArticle(shell(path),path);assert.equal(rewriteArticle(one,path),one);
  const noDate=rewriteArticle(shell(path).replace('"datePublished":"2026-08-03",',''),path);assert.doesNotMatch(noDate,/datePublished|Originally published/);
 });
}
test('unrelated article, member, homepage and commerce documents are unchanged',async()=>{
 for(const path of ['/','/start-here','/programme','/member/dashboard','/member-login','/treatment-order','/treatment-centre','/articles/stopping-glp1','/mental-health/what-will-gp-ask']){
  const html=shell(path);assert.equal(rewriteArticle(html,path),html);const response=new Response(html,{headers:{'Content-Type':'text/html'}});assert.equal(await withEditorialResources(response,new Request(origin+path)),response);
 }
});
test('only successful public HTML responses are transformed; redirects, failures and APIs are not',async()=>{
 const path=PATHS[0];for(const [status,type,host,method] of [[404,'text/html',origin,'GET'],[302,'text/html',origin,'GET'],[200,'application/json',origin,'GET'],[200,'text/html','https://api.shiftsometimber.co.uk','GET'],[200,'text/html',origin,'POST']]){const r=new Response(shell(path),{status,headers:{'Content-Type':type}});assert.equal(await withEditorialResources(r,new Request(host+path,{method})),r)}
 const r=await withEditorialResources(new Response(shell(path),{headers:{'Content-Type':'text/html','etag':'stale','Content-Encoding':'br'}}),new Request(origin+path));assert.equal(r.headers.get('x-shift-article-revision'),VERSION);assert.equal(r.headers.get('etag'),null);assert.equal(r.headers.get('content-encoding'),null);assert.match(r.headers.get('cache-control'),/no-store/);
});
test('unsafe source shape fails closed rather than appending content outside the article',()=>{assert.throws(()=>rewriteArticle('<html><head></head><body>No main</body></html>',PATHS[0]),/one complete main/)});
test('retired NHS finder is removed without deleting ordinary scripts',()=>{
 const path='/guides/nhs-weight-loss-medication-pathways',html=shell(path).replace('</body>','<script>function runNHSFinder(){return "not a clinical decision"}</script><script>window.keepMe=true;</script></body>');
 const fixed=rewriteArticle(html,path);assert.doesNotMatch(fixed,/function runNHSFinder/);assert.match(fixed,/window.keepMe=true/);for(const id of ['finder','questions','print','mounjaro','primary','wegovy','saxenda','orlistat','nice','rollout','icb','referral','bloods'])assert.ok(fixed.includes('id="'+id+'"'));
});
test('clinical comparison claims retain comparator, duration, unit and review limitations',()=>{
 const sax=articleMain('/comparisons/medications/mounjaro-vs-saxenda'),orl=articleMain('/comparisons/medications/mounjaro-vs-orlistat');
 assert.match(sax,/not a head-to-head comparison/);assert.match(sax,/12 weeks at 3\.0 mg a day/);assert.match(sax,/56 weeks/);assert.match(sax,/72 weeks/);assert.match(sax,/2,539/);assert.match(sax,/3,731/);
 assert.match(orl,/additional kilogram difference versus placebo/);assert.match(orl,/3\.2 kg/);assert.match(orl,/5% of initial body weight/);for(const text of [sax,orl]){assert.match(text,/severe, persistent abdominal pain/);assert.match(text,/prescrib/i)}
});
test('NHS guide separates current and future cohorts, settings and nations',()=>{
 const html=articleMain('/guides/nhs-weight-loss-medication-pathways');for(const text of ['23 June 2026','1 April 2027','not yet the current phase','four of the five','35–39.9','2.5','specialist','cardiovascular','Scotland','Wales','Northern Ireland'])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/<form\b|onclick=|<select\b/);
});
test('mental-health support is not weight conditional and includes urgent escalation',()=>{
 const html=articleMain('/mental-health/mental-health-and-weight');for(const text of ['999','111','116 123','not independent clinical review','Do not abruptly stop','different body weights','not monitored as a crisis service'])assert.ok(html.includes(text),text);
});
test('all nine statistics, CSV and SVG remain from the existing data authority',async()=>{
 const html=articleMain(STATS);assert.equal(DATA.rows.length,9);for(const row of DATA.rows)assert.ok(html.includes('<td>'+row.value));assert.match(html,/eight percentage points/);assert.match(html,/not a combined UK estimate/);assert.match(html,/not evidence of treatment results/);
 for(const [suffix,text] of [['/data.csv',CSV],['/chart.svg',CHART]]){const r=await withEditorialResources(new Response('upstream404',{status:404}),new Request(origin+STATS+suffix));assert.equal(await r.text(),text)}
});
test('sitemap changes only dates on the same five canonical URLs without duplicates',()=>{
 const old='<urlset>'+[...PATHS,'/programme','/editorial-standards'].map(p=>'<url><loc>'+origin+p+'</loc><lastmod>2026-09-13</lastmod></url>').join('')+'</urlset>';
 const fixed=updateArticleSitemap(old);assert.equal(count(fixed,/<url>/g),7);assert.equal(count(fixed,/<lastmod>2026-09-19<\/lastmod>/g),5);assert.ok(fixed.includes('/editorial-standards</loc><lastmod>2026-09-13'));
 assert.equal(updateArticleSitemap(fixed),fixed);assert.equal(setSitemapDate(fixed,STATS,'2026-09-13'),fixed);
});
