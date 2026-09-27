import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {STATS_PATH} from '../editorial-resources-v1.js';import {CSV,CHART} from '../editorial/statistics/assets.js';
const phase=process.argv[2]||'before',base='https://shiftsometimber.co.uk',hash=x=>createHash('sha256').update(x).digest('hex');
const get=async path=>{const r=await fetch(base+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});const text=await r.text();assert.equal(r.status,200,path);return {r,text}};
const feed=JSON.parse((await get('/v1/radar/news')).text).items;const uk=feed.filter(x=>['UK','England','Scotland','Wales','Northern Ireland'].includes(x.region));assert.equal(uk.length,51);assert.equal(feed.length,156);
const sitemap=(await get('/sitemap.xml')).text,robots=(await get('/robots.txt')).text;
assert.match(robots,/Sitemap:\s*https:\/\/shiftsometimber.co.uk\/sitemap.xml/i);
const hub=(await get('/shift-newsroom')).text;
const cards=[...hub.matchAll(/<article\b[^>]*data-news-card[^>]*data-region="uk"[\s\S]*?<\/article>/g)];assert.equal(cards.length,51);
const paths=cards.map(m=>m[0].match(/href="([^"]+)"/)[1]);
const articles=[];
for(let i=0;i<paths.length;i+=5){const chunk=await Promise.all(paths.slice(i,i+5).map(async path=>{
 const {r,text}=await get(path);assert.doesNotMatch(text,/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i,path);assert.ok(!(r.headers.get('x-robots-tag')||'').includes('noindex'));assert.ok([...text.matchAll(/<link\b[^>]*>/g)].some(m=>/rel=["']canonical["']/.test(m[0])&&m[0].includes('href="'+base+path+'"')),path);assert.ok(sitemap.includes('<loc>'+base+path+'</loc>'),path);
 const schema=[...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).flatMap(x=>x['@graph']||[x]).find(x=>['Article','MedicalWebPage'].includes(x['@type']));assert.ok(schema,path);
 const start=text.indexOf('data-editorial-trust');if(phase==='after'&&path.startsWith('/medicine-news/')){assert.ok(start>=0,path);assert.ok(text.includes('href="/editorial-standards#corrections"'));const entry=[...sitemap.matchAll(/<url\b[^>]*>[\s\S]*?<\/url>/g)].find(m=>m[0].includes('<loc>'+base+path+'</loc>'))?.[0];const date=String(schema.dateModified||schema.datePublished||'').slice(0,10);if(date)assert.ok(entry.includes('<lastmod>'+date+'</lastmod>'),path+' sitemap date');}
 return {path,status:r.status,canonical:true,noindex:false,inSitemap:true,datePublished:schema.datePublished,editorialTrust:start>=0,template:path.startsWith('/medicine-news/')?'newsroom':'existing attributed guide'};
 }));articles.push(...chunk)}
const pages={};for(const path of ['/explore-knowledge','/shift-health'])pages[path]=hash((await get(path)).text);
const stats=(await get(STATS_PATH)).text,standards=(await get('/editorial-standards')).text;
if(phase==='after'){
 const before=JSON.parse(fs.readFileSync('editorial-before.json'));assert.deepEqual(pages,before.preservedPages);assert.match(stats,/data-statistics-evidence/);assert.match(stats,/not a combined UK estimate/);assert.match(standards,/data-newsroom-standards/);assert.match(standards,/id="corrections"/);assert.equal((await get(STATS_PATH+'/data.csv')).text,CSV);assert.equal((await get(STATS_PATH+'/chart.svg')).text,CHART);
 for(const row of articles)assert.equal(row.datePublished,before.articles.find(x=>x.path===row.path).datePublished,row.path+' first publication changed');
}
const proof={checkedAt:new Date().toISOString(),phase,uk:uk.length,total:feed.length,publicIndexabilityOnly:true,searchConsoleStatus:'Unavailable: expired GSC Wizard subscription; no Google/Bing index or performance claim.',articles,preservedPages:pages,statisticsUpdated:phase==='after',editorialStandardsUpdated:phase==='after',downloadsVerified:phase==='after'};
fs.writeFileSync(phase==='after'?'editorial-live-proof.json':'editorial-before.json',JSON.stringify(proof,null,2));console.log(JSON.stringify({phase,uk:uk.length,total:feed.length,checked:articles.length,passed:true}));
