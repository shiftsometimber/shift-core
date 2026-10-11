import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-11-authorised-taldefgrobep-attain-maintain-renewal.json' with {type:'json'};
import {registrySources} from './credibility.mjs';
import {projectSourceHealth} from './monitor.mjs';

const observation=(source,time)=>({id:source.id,source_url:source.url,check_url:source.checkUrl,last_attempt_at:new Date(time).toISOString(),last_success_at:new Date(time).toISOString(),attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0});

test('taldefgrobep and ATTAIN-MAINTAIN renew only their unchanged registry records',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);assert.equal(receipt.registrySources.length,2);
 assert.deepEqual(receipt.registrySources.map(source=>source.id),['registry-nct07281495','registry-nct06584916']);
 for(const review of receipt.registrySources){
  const source=registrySources.find(candidate=>candidate.id===review.id);assert.ok(source,review.id);
  assert.equal(source.reviewedAt,receipt.reviewedAt);assert.equal(source.reviewedFingerprint,review.reviewedFingerprint);assert.equal(review.reviewedFingerprint,review.previousReviewedFingerprint);
  assert.equal(review.withdrawn,false);assert.equal(review.wordingChanged,false);assert.equal(review.lifecycleChanged,false);assert.ok(review.assessment.length>300);
  const time=Date.parse(receipt.reviewedAt);assert.equal(projectSourceHealth(source,observation(source,time),time).status,'current');
  const old={...source,reviewedAt:review.previousReviewedAt};assert.ok(projectSourceHealth(old,observation(old,time),time).reasons.includes('review_due'));
 }
});

test('renewal preserves catalogue, separate queue and medical boundaries',()=>{
 assert.deepEqual(receipt.preserved,{completedFactualReviews:35,programmes:118,configuredSources:202,programmeSummaryFactualReviewNeeded:68,zp6590VerificationPending:true,zp6590CheckDelayed:true,externalCommunicationsSent:false,customerDataChanged:false,memberTreatmentChanged:false,checkoutChanged:false});
 for(const flag of ['programmeWordingChanged','programmeReviewDatesChanged','configuredSourceCountChanged','programmeCountChanged','registryLifecycleChanged','resultsClaimed','monitorBaselinesChanged','monitorLogicChanged','queueLogicChanged','healthResponseShapeChanged','medicalClaimsChanged','ukAuthorisationChanged','nhsAccessChanged','supplyClaimChanged'])assert.equal(receipt.changes[flag],false);
 assert.equal(receipt.remainingObstacles.length,1);assert.equal(receipt.remainingObstacles[0].id,'zealand-zp6590-pipeline');assert.deepEqual(receipt.remainingObstacles[0].state,['verification_pending','check_delayed']);
 assert.match(receipt.discoveryBoundary,/remains ongoing/);assert.doesNotMatch(receipt.discoveryBoundary,/monitoring finished/i);
});
