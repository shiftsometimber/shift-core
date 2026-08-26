import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {ensureEvidenceDeskSchema} from '../evidence-desk-v1.js';
import {approveDistribution,capturePageBaseline,deliverDistributionJobs,draftEvidencePackage,ensureOperationalSchema,evidencePublicationPreflight,grantPublicationAuthority,prepareDistributionJobs,publishEvidencePackage,specialistReview,stopOperationalDesk} from '../evidence-desk-operational-v1.js';

class Stmt{constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args}bind(...args){return new Stmt(this.db,this.sql,args)}async first(){return this.db.prepare(this.sql).get(...this.args)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.args)}}async run(){const r=this.db.prepare(this.sql).run(...this.args);return{...r,lastInsertRowid:r.lastInsertRowid}}}
class D1{constructor(){this.db=new DatabaseSync(':memory:')}prepare(sql){return new Stmt(this.db,sql)}async exec(sql){this.db.exec(sql)}async batch(ss){this.db.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());this.db.exec('COMMIT');return r}catch(e){this.db.exec('ROLLBACK');throw e}}}
const hash='a'.repeat(64),copy='Small exact evidence-bound wording.';

async function fixture({red=true,exact=true}={}){
  const DB=new D1();await ensureEvidenceDeskSchema(DB);await ensureOperationalSchema(DB);
  DB.db.prepare(`INSERT INTO evidence_desk_events(id,source_id,snapshot_id,status,materiality,risk_lane,headline,change_json,impacted_claims_json) VALUES(1,'source',1,'awaiting_decision','mapped_material_change',?,'Change','{}','[]')`).run(red?'red':'amber');
  const proposed=exact?[{revisionId:'v1',pagePath:'/page',contentKey:'section',proposedText:copy}]:[{pagePath:'/page',contentKey:'section',instruction:'Draft'}];
  DB.db.prepare(`INSERT INTO evidence_desk_packages(id,event_id,status,title,summary,proposed_changes_json,evidence_json,risk_lane,communication_class,qualified_review_required,communications_review_required) VALUES(1,1,'awaiting_specialist_review','Package','Summary',?,'[{"source":"official"}]',?,?,?,?)`).run(JSON.stringify(proposed),red?'red':'amber',red?'clinical_safety':'general_information',red?1:0,red?1:0);
  DB.db.prepare(`UPDATE evidence_desk_operational_control SET monitoring_enabled=1,drafting_enabled=1,website_enabled=1,staging_publication_enabled=1,production_authority_enabled=0`).run();
  DB.db.prepare(`UPDATE evidence_desk_control SET enabled=1,website_publish_enabled=1,newsletter_enabled=1,social_enabled=1`).run();
  if(!red)DB.db.prepare(`UPDATE evidence_desk_packages SET status='approved_web_pending_publish',web_eligible=1,editorial_reviewer='Matt',editorial_reviewed_at=CURRENT_TIMESTAMP WHERE id=1`).run();
  return{DB,env:{DB,AI:{run:async()=>({response:'{"pagePath":"/page","contentKey":"section","proposedText":"Generated exact wording."}'})}}};
}

async function seedPublishedWebsite(DB,packageId=1){
  const copySha256=(await evidencePublicationPreflight(DB,packageId)).copySha256;
  DB.db.prepare(`INSERT INTO evidence_desk_publications(package_id,destination,idempotency_key,status,remote_ref,payload_sha256,completed_at) VALUES(?,'website',?,'published','https://staging.example/page',?,CURRENT_TIMESTAMP)`).run(packageId,`web:${packageId}:${copySha256}`,'f'.repeat(64));
  return copySha256;
}

test('automatic drafting creates a SHA-locked revision but grants no authority',async()=>{
  const {DB,env}=await fixture({red:true,exact:false});const result=await draftEvidencePackage(env,1);
  assert.equal(result.ok,true);assert.match(result.copySha256,/^[a-f0-9]{64}$/);assert.equal(result.status,'awaiting_specialist_review');
  const pkg=DB.db.prepare('SELECT qualified_review_ref,communications_review_ref,web_eligible FROM evidence_desk_packages WHERE id=1').get();assert.equal(pkg.qualified_review_ref,null);assert.equal(pkg.communications_review_ref,null);assert.equal(pkg.web_eligible,0);
});

test('red preflight remains blocked until two exact human reviews, rollback and authority',async()=>{
  const {DB}=await fixture();let p=await evidencePublicationPreflight(DB,1);
  assert.deepEqual(p.blockers,['qualified_clinical_review','medicines_communications_review','editorial_approval','page_baseline_and_rollback_capture','publication_authority']);
  const copySha=p.copySha256;
  assert.equal((await specialistReview(DB,1,'clinical',{copySha256:copySha,authorityRef:'GMC-REVIEW-1'},{name:'Real clinician'})).ok,true);
  assert.equal((await specialistReview(DB,1,'communications',{copySha256:copySha,authorityRef:'MEDCOMMS-1'},{name:'Real comms reviewer'})).ok,true);
  DB.db.prepare(`UPDATE evidence_desk_packages SET status='approved_web_pending_publish',web_eligible=1,editorial_reviewer='Matt',editorial_reviewed_at=CURRENT_TIMESTAMP WHERE id=1`).run();
  await capturePageBaseline(DB,1,{pagePath:'/page',baselineSha256:hash,rollbackLocator:'r2://rollback/page',connectorVerified:true},{name:'Release system',role:'publisher'});
  await grantPublicationAuthority(DB,1,{copySha256:copySha,authorityRef:'OWNER-RELEASE-1'},{name:'Matt',role:'owner'});
  p=await evidencePublicationPreflight(DB,1);assert.equal(p.ready,true);assert.deepEqual(p.blockers,[]);
});

test('specialist approval fails if the reviewed copy hash drifts',async()=>{
  const {DB}=await fixture();const result=await specialistReview(DB,1,'clinical',{copySha256:'b'.repeat(64),authorityRef:'GMC-1'},{name:'Clinician'});assert.equal(result.status,409);assert.equal(result.error,'review_copy_hash_mismatch');
});

test('a later copy change invalidates both previously recorded specialist approvals',async()=>{
  const {DB}=await fixture();const copySha=(await evidencePublicationPreflight(DB,1)).copySha256;
  await specialistReview(DB,1,'clinical',{copySha256:copySha,authorityRef:'GMC-1'},{name:'Clinician'});
  await specialistReview(DB,1,'communications',{copySha256:copySha,authorityRef:'MEDCOMMS-1'},{name:'Comms reviewer'});
  DB.db.prepare(`UPDATE evidence_desk_packages SET proposed_changes_json=? WHERE id=1`).run(JSON.stringify([{pagePath:'/page',contentKey:'section',proposedText:'Changed after both specialist reviews.'}]));
  const preflight=await evidencePublicationPreflight(DB,1);assert.ok(preflight.blockers.includes('qualified_clinical_review'));assert.ok(preflight.blockers.includes('medicines_communications_review'));
});

test('publication calls the private connector only after green preflight and is idempotent',async()=>{
  const {DB,env}=await fixture({red:false});const pre=await evidencePublicationPreflight(DB,1);assert.deepEqual(pre.blockers,['page_baseline_and_rollback_capture','publication_authority']);
  await capturePageBaseline(DB,1,{pagePath:'/page',baselineSha256:hash,rollbackLocator:'r2://rollback/page',connectorVerified:true},{name:'Release',role:'publisher'});
  await grantPublicationAuthority(DB,1,{copySha256:pre.copySha256,authorityRef:'OWNER-1'},{name:'Matt',role:'owner'});
  env.STAGING_PUBLISH_TOKEN='s'.repeat(64);let calls=0;env.WEBSITE_PUBLISHER={fetch:async(_url,init)=>{calls++;const payload=JSON.parse(init.body);return Response.json({published:true,url:'https://staging.example/preview/1',versionId:'1',copySha256:payload.copySha256,payloadSha256:createHash('sha256').update(init.body).digest('hex'),baselineSha256:payload.baselineSha256})}};
  let result=await publishEvidencePackage(env,1);assert.equal(result.ok,true);result=await publishEvidencePackage(env,1);assert.equal(result.idempotent,true);assert.equal(calls,1);
});

test('one-action shutdown disables monitoring, drafting and every destination',async()=>{
  const {DB}=await fixture();const result=await stopOperationalDesk(DB,'Operator stop');assert.equal(result.state,'sealed');
  const op=DB.db.prepare('SELECT * FROM evidence_desk_operational_control WHERE id=1').get();for(const k of ['monitoring_enabled','drafting_enabled','website_enabled','newsletter_enabled','social_enabled','staging_publication_enabled','production_authority_enabled'])assert.equal(op[k],0,k);
  const base=DB.db.prepare('SELECT * FROM evidence_desk_control WHERE id=1').get();for(const k of ['enabled','ingestion_enabled','decision_email_enabled','website_publish_enabled','newsletter_enabled','social_enabled'])assert.equal(base[k],0,k);
});

test('newsletter/social approval cannot bypass missing specialist review',async()=>{
  const {DB}=await fixture();const copySha=(await evidencePublicationPreflight(DB,1)).copySha256;
  DB.db.prepare(`UPDATE evidence_desk_packages SET status='approved_web_pending_publish',web_eligible=1,editorial_reviewer='Matt',editorial_reviewed_at=CURRENT_TIMESTAMP WHERE id=1`).run();
  const result=await approveDistribution(DB,1,{copySha256:copySha,authorityRef:'OWNER-ALL',destinations:['newsletter','facebook']},{name:'Matt',role:'owner'});assert.equal(result.status,409);assert.equal(result.error,'specialist_review_required');
});

test('distribution adaptation requires a matching website publication and enabled destination',async()=>{
  const {DB,env}=await fixture({red:false});
  let result=await prepareDistributionJobs(env,1,{destinations:['newsletter']});assert.equal(result.error,'website_publication_required');
  await seedPublishedWebsite(DB);
  result=await prepareDistributionJobs(env,1,{destinations:['newsletter']});assert.equal(result.error,'distribution_destination_disabled');
  DB.db.prepare(`UPDATE evidence_desk_operational_control SET newsletter_enabled=1`).run();
  env.AI.run=async()=>({response:'{"subject":"Shift update","previewText":"Evidence update","text":"Read the sourced update.","html":"<p>Read the sourced update.</p>"}'});
  result=await prepareDistributionJobs(env,1,{destinations:['newsletter']});assert.equal(result.ok,true);assert.equal(result.jobs[0].status,'awaiting_approval');assert.match(result.jobs[0].payloadSha256,/^[a-f0-9]{64}$/);
});

test('distribution approval locks both source copy and final adapted payload hashes',async()=>{
  const {DB,env}=await fixture({red:false});const copySha256=await seedPublishedWebsite(DB);
  DB.db.prepare(`UPDATE evidence_desk_operational_control SET social_enabled=1`).run();
  env.AI.run=async()=>({response:'{"text":"Read the sourced update.","hashtags":["#ShiftSomeTimber"]}'});
  const prepared=await prepareDistributionJobs(env,1,{destinations:['facebook']});const payloadSha256=prepared.jobs[0].payloadSha256;
  let result=await approveDistribution(DB,1,{copySha256,authorityRef:'OWNER-ALL',destinations:['facebook'],payloadHashes:{facebook:'b'.repeat(64)}},{name:'Matt',role:'owner'});assert.equal(result.error,'distribution_payload_not_found');
  result=await approveDistribution(DB,1,{copySha256,authorityRef:'OWNER-ALL',destinations:['facebook'],payloadHashes:{facebook:payloadSha256}},{name:'Matt',role:'owner'});assert.equal(result.ok,true);
  const job=DB.db.prepare(`SELECT status,approved_at FROM evidence_desk_distribution_jobs WHERE id=?`).get(prepared.jobs[0].id);assert.equal(job.status,'queued');assert.ok(job.approved_at);
});

test('newsletter delivery fails closed without connector then publishes once with hash echo',async()=>{
  const {DB,env}=await fixture({red:false});const copySha256=await seedPublishedWebsite(DB);
  DB.db.prepare(`UPDATE evidence_desk_operational_control SET newsletter_enabled=1`).run();
  env.AI.run=async()=>({response:'{"subject":"Shift update","previewText":"Evidence update","text":"Read the sourced update.","html":"<p>Read the sourced update.</p>"}'});
  const prepared=await prepareDistributionJobs(env,1,{destinations:['newsletter']}),payloadSha256=prepared.jobs[0].payloadSha256;
  await approveDistribution(DB,1,{copySha256,authorityRef:'OWNER-ALL',destinations:['newsletter'],payloadHashes:{newsletter:payloadSha256}},{name:'Matt',role:'owner'});
  let result=await deliverDistributionJobs(env,{packageId:1});assert.equal(result.ok,false);assert.equal(result.jobs[0].error,'newsletter_connector_missing');
  env.STAGING_DISTRIBUTION_TOKEN='d'.repeat(64);let calls=0;env.NEWSLETTER_PUBLISHER={fetch:async()=>{calls++;return Response.json({published:true,messageId:'newsletter-1',copySha256,payloadSha256})}};
  result=await deliverDistributionJobs(env,{packageId:1});assert.equal(result.ok,true);assert.equal(result.delivered,1);
  result=await deliverDistributionJobs(env,{packageId:1});assert.equal(result.delivered,0);assert.equal(calls,1);
});

test('social connector hash disagreement is a hard delivery failure',async()=>{
  const {DB,env}=await fixture({red:false});const copySha256=await seedPublishedWebsite(DB);
  DB.db.prepare(`UPDATE evidence_desk_operational_control SET social_enabled=1`).run();
  env.AI.run=async()=>({response:'{"text":"Read the sourced update.","hashtags":["#MensHealth"]}'});
  const prepared=await prepareDistributionJobs(env,1,{destinations:['linkedin']}),payloadSha256=prepared.jobs[0].payloadSha256;
  await approveDistribution(DB,1,{copySha256,authorityRef:'OWNER-ALL',destinations:['linkedin'],payloadHashes:{linkedin:payloadSha256}},{name:'Matt',role:'owner'});
  env.STAGING_DISTRIBUTION_TOKEN='d'.repeat(64);env.SOCIAL_PUBLISHER={fetch:async()=>Response.json({published:true,postId:'post-1',copySha256,payloadSha256:'0'.repeat(64)})};
  const result=await deliverDistributionJobs(env,{packageId:1});assert.equal(result.ok,false);assert.equal(result.jobs[0].error,'distribution_connector_hash_mismatch');
  const job=DB.db.prepare(`SELECT status,error_code FROM evidence_desk_distribution_jobs WHERE id=?`).get(prepared.jobs[0].id);assert.equal(job.status,'failed');assert.equal(job.error_code,'distribution_connector_hash_mismatch');
});
