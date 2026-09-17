import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {NEWS_DISCOVERY_SOURCES} from '../radar-discovery-sources-v1.js';
import {SNAPSHOT_SCHEMA,SNAPSHOT_MAX_AGE_MS,snapshotSha,validateSourceSnapshot,readSourceSnapshot,snapshotSource} from '../radar-source-snapshots-v1.js';
import {ensureRadarSchema} from '../radar-integration-v1.js';
import {runAuthoritativeRadarScan,loadRadarSources} from '../radar-authoritative-scan-v1.js';
const source=NEWS_DISCOVERY_SOURCES.find(s=>s.id==='uk-weight-news-search');
async function fixture(now=Date.now()){
 const items_json=JSON.stringify([{title:'UK weight loss research update',url:'https://news.google.com/rss/articles/test',source_date:'2026-09-16T09:00:00Z',source_updated_at:null,summary:'Research lead for verification',source:source.id,regulator:source.authority,region:source.region,event_type:'news_discovery'}]);
 return{source_id:source.id,source_url:source.url,fetched_at:new Date(now).toISOString(),items_json,items_sha256:await snapshotSha(items_json),document_sha256:'b'.repeat(64),workflow_sha:'a'.repeat(40)};
}
async function insert(DB,row){await DB.exec(SNAPSHOT_SCHEMA);await DB.prepare('INSERT INTO radar_source_snapshots VALUES(?,?,?,?,?,?,?)').bind(...Object.values(row)).run()}
test('snapshots are bound to exact discovery sources, content, clock and workflow',async()=>{
 const now=Date.now(),row=await fixture(now);assert.equal((await validateSourceSnapshot(source,row,now)).items.length,1);
 for(const change of [{source_url:source.url+'&extra=1'},{source_id:'nice-published-guidance'},{workflow_sha:''},{document_sha256:''},{items_json:'[]'},{fetched_at:new Date(now-SNAPSHOT_MAX_AGE_MS-1).toISOString()},{fetched_at:new Date(now+60001).toISOString()}])assert.equal(await validateSourceSnapshot(source,{...row,...change},now),null);
 assert.equal(await validateSourceSnapshot({...source,tier:1},row,now),null);
 assert.equal(await validateSourceSnapshot({...source,url:'https://other.test'},row,now),null);
 assert.equal(snapshotSource(NEWS_DISCOVERY_SOURCES.find(s=>s.id==='gphc-news')),false);
 const wrong=JSON.stringify([{...JSON.parse(row.items_json)[0],event_type:'uk_regulatory_approval'}]);
 assert.equal(await validateSourceSnapshot(source,{...row,items_json:wrong,items_sha256:await snapshotSha(wrong)},now),null);
});
test('missing or invalid snapshot storage safely falls back to direct retrieval',async()=>{
 const DB=memoryDB();assert.equal(await readSourceSnapshot(DB,source),null);
 await insert(DB,await fixture(Date.now()-SNAPSHOT_MAX_AGE_MS-1));assert.equal(await readSourceSnapshot(DB,source),null);
});
test('scanner consumes a recent snapshot as an unverified lead with transport evidence',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);await DB.prepare('UPDATE radar_sources SET active=0 WHERE id!=?').bind(source.id).run();await insert(DB,await fixture());
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('direct feed unavailable')};
 try{
  const result=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});assert.equal(calls,0);assert.equal(result.sources[0].ok,true);assert.equal(result.sources[0].transport,'scheduled_collector');assert.equal(result.sources[0].newEvents,1);
  const row=await DB.prepare('SELECT * FROM radar_events').first();assert.equal(row.status,'needs_more_evidence');assert.equal(JSON.parse(row.verification_json).verified,false);assert.equal(JSON.parse(row.source_evidence_json)[0].source_date,'2026-09-16T09:00:00Z');
  assert.equal((await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true})).newEvents,0);
  assert.equal((await DB.prepare("SELECT COUNT(*) c FROM radar_audit WHERE action='notification_sent'").first()).c,0);
  await DB.prepare("UPDATE radar_source_snapshots SET fetched_at='2000-01-01T00:00:00Z'").run();
  const stale=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});assert.equal(stale.sources[0].ok,false);assert.equal(calls,1);
 }finally{globalThis.fetch=original}
});
