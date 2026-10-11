import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-11-authorised-two-source-freshness.json' with {type:'json'};
import {sources as detailedSources} from './data.mjs';
import {industrySources} from './industry.mjs';
import {projectSourceHealth} from './monitor.mjs';

const allSources=[...detailedSources,...industrySources];
const observation=(source,time)=>({
 source_url:source.url,check_url:source.checkUrl,
 last_attempt_at:new Date(time).toISOString(),last_success_at:new Date(time).toISOString(),
 attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0,
});

test('two fresh source reviews renew only the exact unchanged configured sources',()=>{
 assert.equal(receipt.sources.length,2);
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(receipt.clinicalApproval,null);
 assert.equal(receipt.industryComplete,false);
 assert.equal(receipt.changes.sourceReviewDatesRenewed,2);
 for(const review of receipt.sources){
  const source=allSources.find(candidate=>candidate.id===review.id);
  assert.ok(source,review.id);
  assert.equal(source.reviewedAt,receipt.reviewedAt);
  assert.equal(source.reviewedFingerprint,review.reviewedFingerprint);
  assert.equal(review.reviewedFingerprint,review.previousReviewedFingerprint);
  assert.equal(review.monitorStatus,'current');
  assert.equal(review.monitorHttpStatus,200);
  assert.equal(review.withdrawn,false);
  assert.equal(review.wordingChanged,false);
  assert.ok(review.assessment.length>250);
  const time=Date.parse(receipt.reviewedAt);
  assert.equal(projectSourceHealth(source,observation(source,time),time).status,'current');
  const old={...source,reviewedAt:review.previousReviewedAt};
  assert.ok(projectSourceHealth(old,observation(old,time),time).reasons.includes('review_due'));
 }
});

test('freshness renewal preserves queue semantics, ZP uncertainty and publication boundaries',()=>{
 assert.deepEqual(receipt.preserved,{
  completedFactualReviews:35,programmes:116,configuredSources:202,programmeSummaryFactualReviewNeeded:66,
  zp6590VerificationPending:true,zp6590CheckDelayed:true,externalCommunicationsSent:false,
  customerDataChanged:false,memberTreatmentChanged:false,checkoutChanged:false
 });
 for(const flag of ['programmeWordingChanged','programmeReviewDatesChanged','configuredSourceCountChanged','programmeCountChanged','monitorBaselinesChanged','queueLogicChanged','healthResponseShapeChanged','medicalClaimsChanged','ukAuthorisationChanged','nhsAccessChanged','supplyClaimChanged'])assert.equal(receipt.changes[flag],false);
 assert.equal(receipt.remainingObstacles.length,1);
 assert.equal(receipt.remainingObstacles[0].id,'zealand-zp6590-pipeline');
 assert.deepEqual(receipt.remainingObstacles[0].state,['verification_pending','check_delayed']);
 assert.match(receipt.remainingObstacles[0].obstacle,/HTTP 403/);
 assert.match(receipt.remainingObstacles[0].nextAction,/do not retry/);
});
