import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureEvidenceDeskSchema} from '../evidence-desk-v1.js';
import {approveDistribution,capturePageBaselineFromPublisher,deliverDistributionJobs,ensureOperationalSchema,evidencePublicationPreflight,grantPublicationAuthority,prepareDistributionJobs,publishEvidencePackage,rollbackEvidencePublication} from '../evidence-desk-operational-v1.js';
import stagingPublisher from '../evidence-desk-staging-publisher-entry.js';
import stagingDistributor from '../evidence-desk-staging-distributor-entry.js';

class Stmt{constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args}bind(...args){return new Stmt(this.db,this.sql,args)}async first(){return this.db.prepare(this.sql).get(...this.args)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.args)}}async run(){const r=this.db.prepare(this.sql).run(...this.args);return{...r,lastInsertRowid:r.lastInsertRowid}}}
class D1{constructor(){this.db=new DatabaseSync(':memory:')}prepare(sql){return new Stmt(this.db,sql)}async exec(sql){this.db.exec(sql)}async batch(ss){this.db.exec('BEGIN');try{const results=[];for(const s of ss)results.push(await s.run());this.db.exec('COMMIT');return results}catch(error){this.db.exec('ROLLBACK');throw error}}}

test('neutral package completes draft-to-staging-to-distribution-to-rollback while production stays off',async()=>{
  const DB=new D1();await ensureEvidenceDeskSchema(DB);await ensureOperationalSchema(DB);
  DB.db.prepare(`INSERT INTO evidence_desk_events(id,source_id,snapshot_id,status,materiality,risk_lane,headline,change_json,impacted_claims_json) VALUES(1,'proof',1,'approved_web_pending_publish','mapped_material_change','amber','Proof','{}','[]')`).run();
  DB.db.prepare(`INSERT INTO evidence_desk_packages(id,event_id,status,title,summary,proposed_changes_json,evidence_json,risk_lane,communication_class,web_eligible,newsletter_eligible,social_eligible,qualified_review_required,communications_review_required,editorial_reviewer,editorial_reviewed_at) VALUES(1,1,'approved_web_pending_publish','Proof','Neutral proof','[{"pagePath":"/proof","contentKey":"body","proposedText":"This is a non-production technical proof."}]','[]','amber','general_information',1,0,0,0,0,'Matt',CURRENT_TIMESTAMP)`).run();
  DB.db.prepare(`UPDATE evidence_desk_operational_control SET monitoring_enabled=1,drafting_enabled=1,website_enabled=1,newsletter_enabled=1,social_enabled=1,staging_publication_enabled=1,production_authority_enabled=0,control_epoch=4`).run();
  DB.db.prepare(`UPDATE evidence_desk_control SET enabled=1,ingestion_enabled=1,website_publish_enabled=1,newsletter_enabled=1,social_enabled=1`).run();
  const publishToken='p'.repeat(64),distributionToken='d'.repeat(64);
  const publisherEnv={DB,STAGING_PUBLISH_TOKEN:publishToken},distributionEnv={DB,STAGING_DISTRIBUTION_TOKEN:distributionToken};
  const env={DB,STAGING_PUBLISH_TOKEN:publishToken,STAGING_DISTRIBUTION_TOKEN:distributionToken,
    WEBSITE_PUBLISHER:{fetch:(url,init)=>stagingPublisher.fetch(new Request(url,init),publisherEnv)},
    NEWSLETTER_PUBLISHER:{fetch:(url,init)=>stagingDistributor.fetch(new Request(url,init),distributionEnv)},
    SOCIAL_PUBLISHER:{fetch:(url,init)=>stagingDistributor.fetch(new Request(url,init),distributionEnv)},
    AI:{run:async(_model,input)=>input.messages[1].content.includes('newsletter')?{response:'{"subject":"Shift proof","previewText":"Technical proof","text":"Read the proof.","html":"<p>Read the proof.</p>"}'}:{response:'{"text":"Read the proof.","hashtags":["#ShiftSomeTimber"]}'}}
  };
  assert.equal((await capturePageBaselineFromPublisher(env,1)).ok,true);
  const before=await evidencePublicationPreflight(DB,1);assert.ok(before.blockers.includes('publication_authority'));
  await grantPublicationAuthority(DB,1,{copySha256:before.copySha256,authorityRef:'OWNER-STAGING-PROOF'},{name:'Matt',role:'owner'});
  assert.equal((await evidencePublicationPreflight(DB,1)).ready,true);
  const publication=await publishEvidencePackage(env,1);assert.equal(publication.ok,true);assert.match(publication.remoteRef,/\/preview\//);
  const prepared=await prepareDistributionJobs(env,1,{destinations:['newsletter','facebook']});assert.equal(prepared.jobs.length,2);
  const payloadHashes=Object.fromEntries(prepared.jobs.map(job=>[job.destination,job.payloadSha256]));
  assert.equal((await approveDistribution(DB,1,{copySha256:publication.copySha256,authorityRef:'OWNER-STAGING-DISTRIBUTION',destinations:['newsletter','facebook'],payloadHashes},{name:'Matt',role:'owner'})).ok,true);
  const delivered=await deliverDistributionJobs(env,{packageId:1});assert.equal(delivered.delivered,2);assert.equal(delivered.failed,0);
  const rolledBack=await rollbackEvidencePublication(env,1);assert.equal(rolledBack.rolledBack,true);
  const control=DB.db.prepare(`SELECT staging_publication_enabled,production_authority_enabled FROM evidence_desk_operational_control WHERE id=1`).get();assert.equal(control.staging_publication_enabled,1);assert.equal(control.production_authority_enabled,0);
  assert.equal(DB.db.prepare(`SELECT COUNT(*) n FROM evidence_desk_publications WHERE package_id=1 AND destination='website' AND status='rolled_back'`).get().n,1);
  assert.equal(DB.db.prepare(`SELECT COUNT(*) n FROM evidence_desk_publications WHERE package_id=1 AND destination IN ('newsletter','facebook') AND status='published'`).get().n,2);
});
