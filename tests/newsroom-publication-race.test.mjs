import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {ensureRadarSchema,reviewRadarActionCore,saveRadarDraftCore,ensureRadarPublicationJobCore,verifyEvidence} from '../radar-integration-v1.js';
import {pendingSourceChange,recordSourceChange,sourceFingerprint,sourceReviewEvent} from '../radar-source-review-v1.js';

const ID=276;
const ACTOR='github-actions:shiftsometimber/shift-core@'+'a'.repeat(40);
const DESTINATIONS=['medicine_news','knowledge_links','search','sitemap'];
const NOTE='Fictional local race fixture; no real editorial or clinical approval.';

async function fixture(status='ready_for_review') {
  const DB=memoryDB();
  await ensureRadarSchema(DB);
  const evidence=[{source_tier:1,authority:'Fictional fixture',title:'Fictional primary source',url:'https://example.test/fictional-primary-source',source_date:'2026-09-15'}];
  const pkg={
    headline:'Fictional newsroom publication race fixture',
    standfirst:'This fictional article exists solely to test preservation of exact reviewed content during concurrent changes in a local database.',
    article_markdown:'Fictional source-bound content used solely for a local publication race test. '.repeat(4),
    known_facts:[{claim:'This is a fictional local test.',source_url:evidence[0].url}],
    destinations:DESTINATIONS,
    seo:{title:'Fictional newsroom publication race fixture',description:'This fictional article exists solely to test preservation of exact reviewed content during concurrent changes in a local database.',slug:'medicine-news/fictional-race-fixture',source_url:evidence[0].url,author:'SHIFT AI Newsroom',datePublished:'2026-09-16T10:00:00.000Z'}
  };
  await DB.prepare('INSERT INTO radar_events(id,event_key,status,headline,region,regulator,source_evidence_json,verification_json,content_package_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(ID,'fictional-race',status,pkg.headline,'UK','Fictional fixture',JSON.stringify(evidence),JSON.stringify(verifyEvidence(evidence)),JSON.stringify(pkg),'2026-09-16T10:00:00.000Z','2026-09-16T10:00:00.000Z').run();
  return {DB,pkg,evidence};
}

async function expectedState(DB) {
  return {row:await sourceReviewEvent(DB,ID),pending_source_change_id:(await pendingSourceChange(DB,ID))?.id??null};
}

async function observe(DB,version) {
  const row=await sourceReviewEvent(DB,ID);
  const evidence=[{source_tier:1,authority:'Fictional fixture',title:'Fictional source revision '+version,url:'https://example.test/fictional-primary-source',source_date:'2026-09-15',source_updated_at:`2026-09-16T1${version}:00:00.000Z`}];
  const headline='Fictional source revision '+version;
  await recordSourceChange(DB,row,{source:'fictional-test',url:evidence[0].url,fingerprint:sourceFingerprint(headline,evidence),observation:{headline,evidence,verification:verifyEvidence(evidence),confidence:97,scores:{relevance:70,urgency:60},region:'UK'}});
  return pendingSourceChange(DB,ID);
}

async function auditCount(DB,action) {
  return Number((await DB.prepare('SELECT COUNT(*) n FROM radar_audit WHERE event_id=? AND action=?').bind(ID,action).first()).n);
}

async function mutatePackage(DB,label='A concurrent editor changed this package.') {
  const row=await sourceReviewEvent(DB,ID),pkg=JSON.parse(row.content_package_json);
  pkg.article_markdown+=label;
  // Deliberately retain the timestamp: equality must bind the actual content,
  // even when two writes share a timestamp or another writer does not update it.
  await DB.prepare('UPDATE radar_events SET content_package_json=? WHERE id=?').bind(JSON.stringify(pkg),ID).run();
  return sourceReviewEvent(DB,ID);
}

function interceptWrite(base,predicate,mutate) {
  let triggered=false;
  const DB={...base,prepare(sql){
    const statement=base.prepare(sql);
    const wrapped={
      bind(...values){statement.bind(...values);return wrapped},
      first:()=>statement.first(),
      all:()=>statement.all(),
      async run(){if(!triggered&&predicate(sql)){triggered=true;await mutate()}return statement.run()}
    };
    return wrapped;
  }};
  return {DB,wasTriggered:()=>triggered};
}

async function assertRejected(response) {
  const body=await response.json();
  assert.equal(response.status,409,JSON.stringify(body));
  assert.equal(body.ok,false);
}

async function prepareApproved(DB) {
  const response=await reviewRadarActionCore({DB},ID,'approve',{note:NOTE,destinations:DESTINATIONS},ACTOR,await expectedState(DB));
  assert.equal(response.status,200,JSON.stringify(await response.json()));
  return expectedState(DB);
}

test('correction rejects a newer source observation arriving after release preflight',async()=>{
  const {DB}=await fixture('hold');
  await observe(DB,1);
  const expected=await expectedState(DB);
  const latest=await observe(DB,2),before=await sourceReviewEvent(DB,ID);
  await assertRejected(await reviewRadarActionCore({DB},ID,'correct',{note:NOTE},ACTOR,expected));
  assert.deepEqual(await sourceReviewEvent(DB,ID),before);
  assert.equal((await pendingSourceChange(DB,ID)).id,latest.id);
  assert.equal(await auditCount(DB,'source_change_review_started'),0);
});

test('correction SQL rejects a new observation arriving after its own row read',async()=>{
  const {DB:base}=await fixture('hold');
  await observe(base,1);
  const expected=await expectedState(base);
  let triggered=false,latest;
  const DB={...base,async batch(statements){
    if(!triggered){triggered=true;latest=await observe(base,2)}
    return base.batch(statements);
  }};
  await assertRejected(await reviewRadarActionCore({DB},ID,'correct',{note:NOTE},ACTOR,expected));
  assert.equal(triggered,true);
  const current=await sourceReviewEvent(base,ID);
  assert.equal(current.source_evidence_json,expected.row.source_evidence_json);
  assert.equal(current.content_package_json,expected.row.content_package_json);
  assert.equal(current.source_review_generation,expected.row.source_review_generation);
  assert.equal((await pendingSourceChange(base,ID)).id,latest.id);
  assert.equal(await auditCount(base,'source_change_review_started'),0);
});

test('draft save rejects a package changed after the exact release snapshot',async()=>{
  const {DB,pkg}=await fixture();
  const expected=await expectedState(DB),changed=await mutatePackage(DB);
  await assertRejected(await saveRadarDraftCore({DB},ID,{medicinePatch:{},contentPackage:pkg,destinations:DESTINATIONS,note:NOTE},ACTOR,expected));
  assert.deepEqual(await sourceReviewEvent(DB,ID),changed);
  assert.equal(await auditCount(DB,'draft_edited'),0);
});

test('approval rejects a package changed between preflight and the shared action',async()=>{
  const {DB}=await fixture();
  const expected=await expectedState(DB),changed=await mutatePackage(DB);
  await assertRejected(await reviewRadarActionCore({DB},ID,'approve',{note:NOTE,destinations:DESTINATIONS},ACTOR,expected));
  assert.deepEqual(await sourceReviewEvent(DB,ID),changed);
  assert.equal(await auditCount(DB,'approved'),0);
  assert.equal((await DB.prepare('SELECT COUNT(*) n FROM radar_publication_jobs').first()).n,0);
});

test('approval SQL refuses content drift after its own row read',async()=>{
  const {DB:base}=await fixture();
  const expected=await expectedState(base);
  let changed;
  const hook=interceptWrite(base,sql=>/^UPDATE radar_events SET status='approved'/.test(sql),async()=>{changed=await mutatePackage(base)});
  await assertRejected(await reviewRadarActionCore({DB:hook.DB},ID,'approve',{note:NOTE,destinations:DESTINATIONS},ACTOR,expected));
  assert.equal(hook.wasTriggered(),true);
  assert.deepEqual(await sourceReviewEvent(base,ID),changed);
  assert.equal(await auditCount(base,'approved'),0);
  assert.equal((await base.prepare('SELECT COUNT(*) n FROM radar_publication_jobs').first()).n,0);
});

test('publication rejects a different approved package before claiming its job',async()=>{
  const {DB}=await fixture();
  const expected=await prepareApproved(DB),changed=await mutatePackage(DB);
  const before=await DB.prepare('SELECT * FROM radar_publication_jobs').first();
  await assertRejected(await reviewRadarActionCore({DB},ID,'publish',{},ACTOR,expected));
  assert.deepEqual(await sourceReviewEvent(DB,ID),changed);
  assert.deepEqual(await DB.prepare('SELECT * FROM radar_publication_jobs').first(),before);
  assert.equal(await auditCount(DB,'published'),0);
});

test('publication claim SQL rejects content changed after its own row read',async()=>{
  const {DB:base}=await fixture();
  const expected=await prepareApproved(base);
  const job=await base.prepare('SELECT * FROM radar_publication_jobs').first();
  let changed;
  const hook=interceptWrite(base,sql=>/^UPDATE radar_publication_jobs SET status='running'/.test(sql),async()=>{changed=await mutatePackage(base)});
  await assertRejected(await reviewRadarActionCore({DB:hook.DB},ID,'publish',{},ACTOR,expected));
  assert.equal(hook.wasTriggered(),true);
  assert.deepEqual(await sourceReviewEvent(base,ID),changed);
  assert.deepEqual(await base.prepare('SELECT * FROM radar_publication_jobs').first(),job);
  assert.equal(await auditCount(base,'published'),0);
});

test('partial-resume recovery never queues a second job while one is running',async()=>{
  const {DB}=await fixture();
  const expected=await prepareApproved(DB);
  await DB.prepare("UPDATE radar_publication_jobs SET status='running',started_at='2026-09-16T10:05:00.000Z' WHERE event_id=?").bind(ID).run();
  const before=(await DB.prepare('SELECT * FROM radar_publication_jobs').all()).results;
  await assertRejected(await ensureRadarPublicationJobCore({DB},ID,ACTOR,expected));
  assert.deepEqual((await DB.prepare('SELECT * FROM radar_publication_jobs').all()).results,before);
  assert.equal(await auditCount(DB,'publication_job_recovered'),0);
});

test('recovery insert refuses a publication job that starts after its initial job check',async()=>{
  const {DB:base}=await fixture();
  const expected=await prepareApproved(base),original=await base.prepare('SELECT * FROM radar_publication_jobs').first();
  await base.prepare('DELETE FROM radar_publication_jobs WHERE id=?').bind(original.id).run();
  const hook=interceptWrite(base,sql=>/^INSERT INTO radar_publication_jobs/.test(sql),async()=>{
    await base.prepare("INSERT INTO radar_publication_jobs(event_id,site_payload_json,brain_payload_json,search_payload_json,status,started_at) VALUES(?,?,?,?,'running','2026-09-16T10:05:00.000Z')")
      .bind(ID,original.site_payload_json,original.brain_payload_json,original.search_payload_json).run();
  });
  await assertRejected(await ensureRadarPublicationJobCore({DB:hook.DB},ID,ACTOR,expected));
  assert.equal(hook.wasTriggered(),true);
  const jobs=(await base.prepare('SELECT * FROM radar_publication_jobs').all()).results;
  assert.equal(jobs.length,1);assert.equal(jobs[0].status,'running');
  assert.equal(await auditCount(base,'publication_job_recovered'),0);
});

for(const jobStatus of ['queued','failed'])test(`publication refuses an older ${jobStatus} article even with identical source evidence and generation`,async()=>{
  const {DB}=await fixture();
  const expected=await prepareApproved(DB);
  const job=await DB.prepare('SELECT * FROM radar_publication_jobs').first();
  const oldPayload=JSON.parse(job.site_payload_json);
  oldPayload.article='A different, older article must never be delivered under the current approval.';
  await DB.prepare('UPDATE radar_publication_jobs SET site_payload_json=?,status=? WHERE id=?').bind(JSON.stringify(oldPayload),jobStatus,job.id).run();
  const before=await DB.prepare('SELECT * FROM radar_publication_jobs').first();
  await assertRejected(await reviewRadarActionCore({DB},ID,'publish',{},ACTOR,expected));
  assert.deepEqual(await DB.prepare('SELECT * FROM radar_publication_jobs').first(),before);
  assert.equal((await sourceReviewEvent(DB,ID)).status,'approved');
  assert.equal(await auditCount(DB,'published'),0);
});
