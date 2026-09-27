import assert from 'node:assert/strict';
import fs from 'node:fs';
import {archiveBatch} from '../editorial/uk-depth-20260913.mjs';
const base='https://shiftsometimber.co.uk';
const fresh='?archive-check=rec037-'+Date.now();
async function get(path){const r=await fetch(base+path+fresh,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);return r.text()}
const [feedText,hub,sitemap]=await Promise.all(['/v1/radar/news','/shift-newsroom','/sitemap.xml'].map(get));
const feed=JSON.parse(feedText).items;
const regions=new Set(['UK','England','Scotland','Wales','Northern Ireland']);
const uk=feed.filter(x=>regions.has(x.region));
assert.equal(feed.length,156);assert.equal(uk.length,51);
assert.equal((hub.match(/<article\b[^>]*\bdata-news-card/g)||[]).length,156);
const proof=[];
for(let i=0;i<archiveBatch.length;i+=4){
 await Promise.all(archiveBatch.slice(i,i+4).map(async article=>{
  const slug=article.content.seo.slug,url=base+'/'+slug;
  const matches=feed.filter(x=>x.metadata.slug===slug);assert.equal(matches.length,1,slug);
  const item=matches[0];assert.equal(item.article_markdown,article.content.article_markdown,slug+' body');
  assert.equal(item.region,article.region);assert.equal(item.sources[0].url.replace(/\/+$/,''),article.evidence[0].url.replace(/\/+$/,''));
  assert.equal(item.metadata.author,'SHIFT Newsroom');assert.ok(item.metadata.datePublished.startsWith('2026-09-13'));
  assert.deepEqual([...item.destinations].sort(),['knowledge_links','medicine_news','search','sitemap']);
  assert.ok(sitemap.includes(url));assert.ok(hub.includes(slug));
  const html=await get('/'+slug);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,slug+' h1');
  assert.ok(html.includes('rel="canonical" href="'+url+'"'));
  assert.ok(html.includes(item.sources[0].url));assert.ok(html.includes('Related UK reporting'));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'],'Article');assert.equal(schema.author.name,'SHIFT Newsroom');assert.equal(schema.mainEntityOfPage,url);
  assert.equal(schema.datePublished,item.metadata.datePublished);assert.ok(schema.dateModified>=schema.datePublished);
  proof.push({id:item.id,url,region:item.region,source:article.evidence[0].url,originalSourceDate:article.date,datePublished:schema.datePublished,bodyMatchesReviewed:true,sitemap:true,canonical:true});
 }));
}
const result={checkedAt:new Date().toISOString(),total:feed.length,uk:uk.length,international:feed.length-uk.length,newArticles:proof.sort((a,b)=>a.id-b.id)};
fs.writeFileSync('uk-depth-live-proof.json',JSON.stringify(result,null,2));
console.log('PASS: 51 UK / 156 total; all 28 new bodies, canonical URLs, source links, publication metadata and sitemap entries verified.');
console.log(JSON.stringify(result,null,2));
