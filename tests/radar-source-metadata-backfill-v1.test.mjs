import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {metadataAdditions,backfillLegacySourceMetadata} from '../radar-source-metadata-backfill-v1.js';
import {sourceFingerprint,pendingSourceChange,sourceReviewEvent,sourceReviewGuardSql,sourceReviewGuardBindings,recordSourceChange} from '../radar-source-review-v1.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
async function fixture(status='published') {
 const DB=memoryDB();
 await DB.exec(`CREATE TABLE radar_events(id INTEGER PRIMARY KEY,status TEXT,headline TEXT,source_evidence_json TEXT,content_package_json TEXT,medicine_patch_json TEXT,verification_json TEXT,reviewed_at TEXT,reviewed_by TEXT,updated_at TEXT);
 CREATE TABLE radar_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER,action TEXT,actor TEXT,detail_json TEXT,created_at TEXT DEFAULT '2026-09-16T11:45:00Z');
 CREATE TABLE radar_publication_jobs(id INTEGER PRIMARY KEY,event_id INTEGER,status TEXT,error_text TEXT);
 CREATE TABLE radar_social_approvals(id INTEGER PRIMARY KEY,event_id INTEGER,status TEXT,updated_at TEXT);
 CREATE TABLE shift_knowledge_nodes(id TEXT,node_type TEXT,status TEXT,data_json TEXT);
 CREATE TABLE ai_knowledge_documents(id INTEGER,source_uri TEXT,status TEXT);`);
 const prior=[{url:'https://example.test/source',title:'Original source',source_date:'2026-09-01T00:00:00Z',authority:'Authority',source_tier:1,retrieved_at:'2026-09-14T00:00:00Z'}];
 const evidence=[{...prior[0],summary:'Newly captured summary.',source_updated_at:'2026-09-01T00:00:00Z',retrieved_at:'2026-09-16T11:45:00Z'}];
 await DB.prepare(`INSERT INTO radar_events VALUES(1,?,'Original source',?,'{"article_markdown":"Retained article"}','{}','{"verified":true}','2026-09-14T10:00:00Z','original-reviewer','2026-09-14T10:00:00Z')`).bind(status,JSON.stringify(prior)).run();
 const before=await sourceReviewEvent(DB,1),observation={headline:before.headline,evidence};
 await recordSourceChange(DB,before,{fingerprint:sourceFingerprint(before.headline,evidence),source:'fixture',observation});
 await DB.exec(`INSERT INTO radar_publication_jobs VALUES(1,1,'cancelled','source_changed_review_required');INSERT INTO radar_social_approvals VALUES(1,1,'invalidated','2026-09-16');INSERT INTO shift_knowledge_nodes VALUES('radar:1','radar_event','review_required','{}');`);
 const change=await pendingSourceChange(DB,1),manifest=[{event:1,observation:change.id,prior:hash(sourceFingerprint(before.headline,prior)),observed:hash(change.fingerprint)}];
 return {DB,before,change,manifest};
}
test('pinned metadata additions resolve the technical flag without renewing publication or review',async()=>{
 const {DB,before,manifest}=await fixture();
 assert.deepEqual(await backfillLegacySourceMetadata(DB,manifest),{repaired:1,skipped:0});
 const after=await sourceReviewEvent(DB,1);
 for(const key of Object.keys(before).filter(k=>!['source_evidence_json','source_review_generation'].includes(k)))assert.equal(after[key],before[key],key);
 assert.equal(JSON.parse(after.source_evidence_json)[0].retrieved_at,'2026-09-14T00:00:00Z');
 assert.equal(await pendingSourceChange(DB,1),null);
 assert.equal((await DB.prepare('SELECT status FROM radar_publication_jobs').first()).status,'cancelled');
 assert.equal((await DB.prepare('SELECT status FROM radar_social_approvals').first()).status,'invalidated');
 assert.equal((await DB.prepare('SELECT status FROM shift_knowledge_nodes').first()).status,'review_required');
 assert.equal((await DB.prepare("SELECT actor FROM radar_audit WHERE action='source_metadata_backfilled'").first()).actor,'radar_metadata_migration');
 assert.deepEqual(await backfillLegacySourceMetadata(DB,manifest),{repaired:0,skipped:0});
 assert.equal((await DB.prepare(`SELECT id FROM radar_events WHERE id=1 AND ${sourceReviewGuardSql()}`).bind(...sourceReviewGuardBindings(before)).first()),null);
});
test('held drafts remain held and are not returned to an approval queue',async()=>{
 const {DB,manifest}=await fixture('ready_for_review');
 assert.equal((await DB.prepare('SELECT status FROM radar_events').first()).status,'hold');
 await backfillLegacySourceMetadata(DB,manifest);
 assert.equal((await DB.prepare('SELECT status FROM radar_events').first()).status,'hold');
});
test('unlisted records, changed digests and newer observations stay pending',async()=>{
 for(const kind of ['unlisted','digest','newer']){
  const {DB,manifest,before,change}=await fixture();
  if(kind==='unlisted')manifest[0].observation++;
  if(kind==='digest')manifest[0].observed='0'.repeat(64);
  if(kind==='newer')await recordSourceChange(DB,before,{fingerprint:'newer-source',observation:change.observation});
  assert.deepEqual(await backfillLegacySourceMetadata(DB,manifest),{repaired:0,skipped:1});
  assert.ok(await pendingSourceChange(DB,1));
 }
});
test('changed known fields, existing summaries, packages and reviews cannot be backfilled',async()=>{
 const {before,change}=await fixture();
 for(const key of ['url','title','source_date','authority','source_tier']){
  const changed=structuredClone(change);changed.observation.evidence[0][key]='different';
  assert.equal(metadataAdditions(before,changed),null,key);
 }
 for(const key of ['content_package_json','medicine_patch_json','verification_json','reviewed_at','reviewed_by'])assert.equal(metadataAdditions({...before,[key]:'changed'},change),null,key);
 const old=structuredClone(before),altered=structuredClone(change),evidence=JSON.parse(old.source_evidence_json);evidence[0].summary='Existing summary';old.source_evidence_json=JSON.stringify(evidence);altered.reviewed_snapshot.source_evidence_json=old.source_evidence_json;
 assert.equal(metadataAdditions(old,altered),null);
});
test('a source correction arriving during repair prevents both the update and its resolution audit',async()=>{
 const {DB,manifest,before,change}=await fixture();const original=DB.batch;let raced=false;
 DB.batch=async statements=>{if(!raced){raced=true;await DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(1,'source_changed_review_required','scanner',?)").bind(JSON.stringify({...change,fingerprint:'newer'})).run();}return original(statements);};
 assert.deepEqual(await backfillLegacySourceMetadata(DB,manifest),{repaired:0,skipped:1});
 assert.equal((await sourceReviewEvent(DB,1)).source_evidence_json,before.source_evidence_json);
 assert.equal(await DB.prepare("SELECT id FROM radar_audit WHERE action='source_metadata_backfilled'").first(),null);
});
test('a real summary change after backfill still blocks the reviewed publication',async()=>{
 const {DB,manifest}=await fixture();await backfillLegacySourceMetadata(DB,manifest);
 const row=await sourceReviewEvent(DB,1),evidence=JSON.parse(row.source_evidence_json);evidence[0].summary='Genuinely changed source text';
 await recordSourceChange(DB,row,{fingerprint:sourceFingerprint(row.headline,evidence),observation:{headline:row.headline,evidence}});
 assert.ok(await pendingSourceChange(DB,1));assert.equal((await backfillLegacySourceMetadata(DB,manifest)).skipped,1);
});
