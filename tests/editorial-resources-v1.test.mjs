import test from 'node:test';import assert from 'node:assert/strict';
import {evidenceDate,articleTrust,sourceDateLabel,newsSitemapDates,setSitemapDate} from '../radar-editorial-trust-v1.js';
import {withEditorialResources,STATS_PATH,statisticsMain,reviseStandards} from '../editorial-resources-v1.js';
import {CSV,CHART,DATA} from '../editorial/statistics/assets.js';
import {radarNewsPageRoutes} from '../radar-news-pages-v1.js';
const base='https://shiftsometimber.co.uk';
test('dates preserve source precision and reject invalid dates',()=>{assert.equal(evidenceDate('2025-03'),'March 2025');assert.equal(evidenceDate('2026-09-13T12:00:00Z'),'13 September 2026');assert.equal(evidenceDate('2026-02-30'),'');assert.equal(evidenceDate('2026-13'),'');assert.match(sourceDateLabel({}),/not recorded/)});
test('article visible date matches structured publication and never invents clinical review',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('<html><head></head><body><header>Locked</header><main>old</main></body></html>');
 try{const row={headline:'Archive story',region:'England',reviewed_at:'2026-09-13',content_package_json:JSON.stringify({article_markdown:'Original source-reviewed body.',destinations:['medicine_news'],seo:{slug:'medicine-news/test-story',datePublished:'2026-09-10',dateModified:'2026-09-12',reviewer:'SHIFT Newsroom editorial review'}}),source_evidence_json:JSON.stringify([{url:'https://nhs.uk/',authority:'NHS',source_date:'2025-03'}])};
 const response=await radarNewsPageRoutes(new Request(base+'/medicine-news/test-story'),{DB:{prepare:()=>({all:async()=>({results:[row]})})}});const html=await response.text();
 assert.match(html,/By SHIFT Newsroom/);assert.match(html,/Published 10 September 2026/);assert.match(html,/Updated 12 September 2026/);assert.match(html,/Source date: March 2025/);assert.match(html,/Original source-reviewed body\./);assert.match(html,/"datePublished":"2026-09-10"/);assert.doesNotMatch(html,/clinically reviewed|Evidence level|Published 13 September/);assert.match(html,/<header>Locked<\/header>/);
 }finally{globalThis.fetch=original}
});
test('sitemap uses recorded dates, omits unknown dates, preserves unrelated entries',()=>{
 const rows=[['one-story','2026-09-13'],['undated-story',null]].map(([slug,date])=>({content_package_json:JSON.stringify({destinations:['medicine_news'],seo:{slug:'medicine-news/'+slug,datePublished:date}})}));
 const dates=newsSitemapDates(rows);assert.equal(dates.get('/medicine-news/one-story'),'2026-09-13');assert.equal(dates.get('/medicine-news/undated-story'),null);
 const xml='<urlset><url><loc>'+base+'/medicine-news/one-story</loc><lastmod>2026-09-03</lastmod></url><url><loc>'+base+'/start-here</loc><lastmod>2026-08-01</lastmod></url></urlset>';
 const fixed=setSitemapDate(xml,'/medicine-news/one-story',dates.get('/medicine-news/one-story'));assert.match(fixed,/one-story<\/loc><lastmod>2026-09-13/);assert.match(fixed,/start-here<\/loc><lastmod>2026-08-01/);
});
test('statistics downloads and table share nine checked England estimates',async()=>{
 assert.equal(DATA.rows.length,9);assert.equal(CSV.trim().split('\n').length,10);assert.match(CHART,/<svg /);assert.match(statisticsMain(),/England/);assert.match(statisticsMain(),/not a combined UK estimate/);
 for(const row of DATA.rows){assert.ok(statisticsMain().includes('<td>'+row.value));assert.ok(CSV.includes(row.indicator+','+row.sex+','+row.value+','))}
 for(const [suffix,type,body] of [['/data.csv','text/csv',CSV],['/chart.svg','image/svg+xml',CHART]])for(const method of ['GET','HEAD']){const response=await withEditorialResources(new Response('upstream not found',{status:404}),new Request(base+STATS_PATH+suffix,{method}));assert.equal(response.status,200);assert.ok(response.headers.get('content-type').startsWith(type));assert.equal(await response.text(),method==='HEAD'?'':body)}
});
test('resource transform preserves shell, canonical and unrelated pages',async()=>{
 const shell='<html><head><title>UK</title><link rel="canonical" href="'+base+STATS_PATH+'"></head><body><header>Approved header</header><main>Old</main><footer>Approved footer</footer></body></html>';
 const response=await withEditorialResources(new Response(shell,{headers:{'Content-Type':'text/html','ETag':'old'}}),new Request(base+STATS_PATH));const html=await response.text();assert.match(html,/<header>Approved header<\/header>/);assert.match(html,/<footer>Approved footer<\/footer>/);assert.ok(html.includes('href="'+base+STATS_PATH+'"'));assert.match(html,/data-statistics-evidence/);assert.equal(response.headers.get('etag'),null);
 const untouched=new Response(shell);assert.equal(await withEditorialResources(untouched,new Request(base+'/start-here')),untouched);
 const standards=reviseStandards('<h2>Sources</h2><h2>Corrections</h2><p>Material factual or safety errors are corrected promptly and the affected content is rechecked rather than left stale.</p>');assert.match(standards,/AI-assisted/);assert.match(standards,/not independent clinical review/);assert.match(standards,/id="corrections"/);assert.match(standards,/mailto:hello@/);
});
