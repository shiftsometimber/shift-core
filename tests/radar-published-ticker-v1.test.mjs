import test from 'node:test';
import assert from 'node:assert/strict';
import {NEWSROOM_PUBLICATION_RELEASE as release} from '../newsroom-publication-release-v1.mjs';
import {publishedEditionItems,PUBLISHED_TICKER_EDITION} from '../radar-published-ticker-v1.js';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {readRadarFreshness} from '../radar-freshness-v2.js';
const rows=()=>release.articles.map(a=>({id:a.event_id,status:'published',source_evidence_json:a.snapshot.source_evidence_json,content_package_json:JSON.stringify({...a.contentPackage,release_provenance:{release_sha256:release.release_sha256}})}));
test('dated edition links only the exact five published articles without rewriting dates or claiming current wire',async()=>{
 const input=rows(),before=structuredClone(input),items=await publishedEditionItems(input);
 assert.equal(items.length,5);assert.deepEqual(items.map(i=>i.id),PUBLISHED_TICKER_EDITION.items.map(i=>i.event_id));assert.deepEqual(input,before);
 for(const item of items){assert.equal(item.published_at,'2026-09-16');assert.match(item.url,/^\/medicine-news\//)}
});
test('withdrawal, pending source change, article edits, headline edits and provenance mismatch exclude the article',async()=>{
 for(const mutate of [row=>row.status='hold',row=>{const p=JSON.parse(row.content_package_json);p.article_markdown+=' changed';row.content_package_json=JSON.stringify(p)},row=>{const p=JSON.parse(row.content_package_json);p.headline='New claim';row.content_package_json=JSON.stringify(p)},row=>{const p=JSON.parse(row.content_package_json);p.release_provenance={};row.content_package_json=JSON.stringify(p)},row=>{const p=JSON.parse(row.content_package_json);p.seo.canonical='https://other.test/story';row.content_package_json=JSON.stringify(p)},row=>row.source_evidence_json='[]']){
  const input=rows();mutate(input.find(r=>r.id===276));assert.equal((await publishedEditionItems(input)).some(i=>i.id===276),false);
 }
 assert.equal((await publishedEditionItems(rows(),new Map([[276,{}]]))).some(i=>i.id===276),false);
});
test('new unrelated publication or review cannot refresh the age of an old ticker story',async()=>{
 const DB=memoryDB();await DB.exec('CREATE TABLE radar_events(id INTEGER,status TEXT,content_package_json TEXT,reviewed_at TEXT,updated_at TEXT); CREATE TABLE radar_audit(id INTEGER,event_id INTEGER,action TEXT,detail_json TEXT,created_at TEXT); CREATE TABLE radar_publication_jobs(status TEXT,error_text TEXT,completed_at TEXT,created_at TEXT)');
 const now=new Date().toISOString(),old=new Date(Date.now()-8*86400000).toISOString();
 await DB.prepare('INSERT INTO radar_events VALUES(1,?,?,?,?)').bind('published',JSON.stringify({destinations:['ticker_knowledge'],seo:{datePublished:old}}),now,now).run();
 await DB.prepare('INSERT INTO radar_events VALUES(2,?,?,?,?)').bind('published',JSON.stringify({destinations:['medicine_news'],seo:{datePublished:now}}),now,now).run();
 await DB.prepare("INSERT INTO radar_audit VALUES(1,NULL,'scan',?,?)").bind(JSON.stringify({coverage:{complete:true},tier_one_healthy:true}),now).run();
 await DB.prepare("INSERT INTO radar_publication_jobs VALUES('complete',NULL,?,?)").bind(now,now).run();
 const freshness=await readRadarFreshness(DB);assert.equal(freshness.current,false);assert.ok(freshness.ages.ticker>191);assert.ok(freshness.reasons.some(r=>r.code==='ticker_stale'));
});
