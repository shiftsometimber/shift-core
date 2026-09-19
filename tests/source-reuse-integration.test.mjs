import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {ensureRadarSchema,reviewRadarActionCore,prepareVerifiedRadarQueue} from '../radar-integration-v1.js';
import {loadRadarSources,runAuthoritativeRadarScan} from '../radar-authoritative-scan-v1.js';
import {GPHC_RSS} from '../radar-source-policy-v1.js';
async function seed(DB,id,authority,url,status='verified'){
 const evidence=[{source_tier:1,authority,url,title:'Weight management update',summary:'Source wording. '.repeat(30),source_date:'2026-09-18',retrieved_at:new Date().toISOString()}];
 await DB.prepare('INSERT INTO radar_events(id,event_key,status,headline,regulator,region,urgency_score,source_evidence_json,verification_json) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,'policy-'+id,status,'Weight management update '+id,authority,'UK',100-id,JSON.stringify(evidence),'{"verified":true}').run();
}
test('source policy blocks process, approval and publication before any AI call or row change',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);let ai=0;const env={DB,AI:{run:async()=>{ai++;throw Error('AI must not be called')}}};
 for(const [id,authority,url] of [[1,'GPhC','https://www.pharmacyregulation.org/news/test'],[2,'NICE','https://www.nice.org.uk/guidance/ng246']]){
  await seed(DB,id,authority,url);const before=await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(id).first();
  for(const action of ['process','approve','publish']){const r=await reviewRadarActionCore(env,id,action,{},'owner');assert.equal(r.status,409);assert.equal((await r.json()).error,'source_reuse_review_required')}
  assert.deepEqual(await DB.prepare('SELECT * FROM radar_events WHERE id=?').bind(id).first(),before);
 }assert.equal(ai,0);assert.equal((await DB.prepare('SELECT COUNT(*) c FROM radar_publication_jobs').first()).c,0);
});
test('a permission-held source does not consume the next eligible preparation slot',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await seed(DB,1,'GPhC','https://www.pharmacyregulation.org/news/test');await seed(DB,2,'MHRA','https://www.gov.uk/news/test');
 const r=await prepareVerifiedRadarQueue({DB},{limit:1});assert.equal(r.prepared.length,1);assert.equal(r.prepared[0].id,2);assert.equal(r.prepared[0].status,'workers_ai_not_bound');
});
test('live source configuration migrates only GPhC, and 403 remains failed during the hourly pause',async()=>{
 const DB=memoryDB();await ensureRadarSchema(DB);await loadRadarSources(DB);await DB.prepare("UPDATE radar_sources SET active=0 WHERE id!='gphc-news'").run();
 let calls=0;const original=globalThis.fetch;globalThis.fetch=async url=>{calls++;assert.equal(String(url),GPHC_RSS);return new Response('Forbidden',{status:403})};
 try{const one=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});const two=await runAuthoritativeRadarScan({DB,RADAR_SUPPRESS_NOTIFICATIONS:true});assert.equal(calls,1);assert.equal(one.sources[0].error,'http_403');assert.equal(two.sources[0].error,'http_403');assert.equal(two.sources[0].skipped,true);assert.equal(two.sources[0].ok,false);assert.equal((await DB.prepare('SELECT COUNT(*) c FROM radar_events').first()).c,0)}finally{globalThis.fetch=original}
});
