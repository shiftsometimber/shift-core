import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {NEWSROOM_READING} from '../radar-newsroom-discovery-v1.js';
const phase=process.argv[2], base='https://shiftsometimber.co.uk';
const strip=html=>html.replace(/<style data-newsroom-reading-style>[\s\S]*?<\/style>/,'').replace(/<section class="sst-news-reading"[\s\S]*?<\/section>/,'');
const hash=html=>createHash('sha256').update(html).digest('hex');
const results=[];
for(const [path,rows] of Object.entries(NEWSROOM_READING)){
 const response=await fetch(base+path,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});
 assert.equal(response.status,200,path);const html=await response.text();
 if(phase==='before') assert.ok(!html.includes('data-newsroom-reading'),path+' already changed');
 else{
  assert.equal((html.match(/<section class="sst-news-reading"/g)||[]).length,1,path);
  assert.equal(response.headers.get('X-Shift-Newsroom-Reading'),'v1');
  for(const row of rows){assert.ok(html.includes('href="/medicine-news/uk-archive-'+row[2]+'"'));assert.ok(html.includes('href="/shift-newsroom#region=uk&amp;topic='+row[3]+'"'));}
  assert.ok(html.includes('href="/shift-newsroom#region=uk"'));
 }
 results.push({path,existingPageSha256:hash(strip(html)),readingSection:phase!=='before'});
}
if(phase==='before')fs.writeFileSync('newsroom-discovery-before.json',JSON.stringify(results,null,2));
else{
 const before=JSON.parse(fs.readFileSync('newsroom-discovery-before.json'));
 for(const row of results)assert.equal(row.existingPageSha256,before.find(x=>x.path===row.path).existingPageSha256,row.path+' existing page changed');
 const feedResponse=await fetch(base+'/v1/radar/news',{signal:AbortSignal.timeout(30000)});assert.equal(feedResponse.status,200);
 const feed=(await feedResponse.json()).items;
 const uk=feed.filter(x=>['UK','England','Scotland','Wales','Northern Ireland'].includes(x.region));
 assert.equal(uk.length,51);assert.equal(feed.length,156);
 for(const slug of new Set(Object.values(NEWSROOM_READING).flat().map(row=>row[2]))){
  const response=await fetch(base+'/medicine-news/uk-archive-'+slug,{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,slug);assert.ok(!(await response.text()).includes('<h1>Update not found</h1>'));
 }
 const proof={checkedAt:new Date().toISOString(),pages:results,total:feed.length,uk:uk.length,publishedDestinations:5,existingContentPreserved:true};
 fs.writeFileSync('newsroom-discovery-live-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
}
console.log('PASS newsroom discovery '+phase);
