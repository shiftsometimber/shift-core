import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-10-overdue-registry-access-renewal.json' with {type:'json'};
import {registrySources,supportSources} from './credibility.mjs';
import correction from './reviews/2026-10-18-approved-zenagamtide-switch.json' with {type:'json'};

test('renewal advances exactly the reviewed registry and UK support sources',()=>{
 assert.equal(receipt.registrySources.length,63);
 assert.equal(receipt.supportSources.length,4);
 assert.equal(receipt.clinicalApproval,null);
 assert.equal(receipt.industryComplete,false);
 for(const review of [...receipt.registrySources,...receipt.supportSources]){
  const source=[...registrySources,...supportSources].find(s=>s.id===review.id);
  assert.ok(source,review.id);
  const laterCorrection=source.id===correction.source.id;
  if(laterCorrection){
   assert.equal(correction.source.id,'registry-nct07855133');
   assert.deepEqual(source,correction.source);
   assert.equal(correction.beforeSource.reviewedAt,receipt.reviewedAt);
   assert.equal(correction.beforeSource.reviewedFingerprint,review.reviewedFingerprint);
   assert.equal(correction.clinicalApproval,null);
   assert.equal(correction.wholeProgrammeReviewRenewed,false);
  }
  assert.equal(source.reviewedAt,laterCorrection?correction.reviewedAt:receipt.reviewedAt);
  assert.equal(source.reviewedFingerprint,laterCorrection?correction.source.reviewedFingerprint:review.reviewedFingerprint);
  assert.equal(review.claimsUnchanged,true);
  assert.equal(review.withdrawn,false);
  assert.equal(review.httpStatus,200);
  assert.match(review.responseSha256,/^[a-f0-9]{64}$/);
 }
});

test('registry renewal retains bounded lifecycle evidence and stale estimates',()=>{
 assert.deepEqual(receipt.registryReviewSummary.statuses,{
  RECRUITING:21,NOT_YET_RECRUITING:19,ACTIVE_NOT_RECRUITING:9,COMPLETED:14
 });
 assert.equal(receipt.registryReviewSummary.resultsPosted,1);
 assert.equal(receipt.registryReviewSummary.staleEstimatedStartRecords,15);
 assert.match(receipt.registryReviewSummary.interpretation,/remain estimates/);
 assert.match(receipt.registryReviewSummary.interpretation,/Completed status is not a result/);
});

test('ZP6590 remains pending and delayed outside the renewed review wave',()=>{
 assert.equal(receipt.remainingObstacles.length,1);
 assert.equal(receipt.remainingObstacles[0].id,'zealand-zp6590-pipeline');
 assert.match(receipt.remainingObstacles[0].error,/HTTP 403/);
 assert.match(receipt.remainingObstacles[0].disposition,/Retain verification_pending and check_delayed/);
 assert.ok(!receipt.registrySources.some(s=>s.id==='zealand-zp6590-pipeline'));
 assert.ok(!receipt.supportSources.some(s=>s.id==='zealand-zp6590-pipeline'));
});
