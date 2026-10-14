import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import receipt from './reviews/2026-10-12-authorised-te8105-asc36-renewal.json' with {type:'json'};
import baseline from './reviews/2026-10-12-pre-renewal-wording-hashes.json' with {type:'json'};
import {industry,industrySources} from './industry.mjs';
import {registrySources,changes} from './credibility.mjs';
import {medicines,sources} from './data.mjs';
import {manualEvidence,programmeSummaryQueue} from './evidence-desk.mjs';
import {catalogueBeforeSuccessor} from './review-history-fixture.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const clean=entries=>entries.map(({reviewedAt,...entry})=>({...entry,additionalEvidence:entry.additionalEvidence?.map(({reviewedAt,...link})=>link)}));
test('12 October renewal advances one source and two fully reread summaries, preserving all medical wording',()=>{
 assert.equal(hash(clean(industry)),baseline.programmeWordingSha256);
 assert.equal(hash(registrySources.map(({reviewedAt,...source})=>source)),baseline.registrySha256);
 assert.deepEqual(receipt.sourceRenewals.map(item=>item.id),['registry-nct07857473']);
 assert.deepEqual(receipt.programmeSummaryReviews.map(item=>item.id),['te8105','asc36-oral']);
 for(const review of receipt.programmeSummaryReviews){
  const entry=industry.find(item=>item.id===review.id);
  assert.equal(entry.reviewedAt,receipt.reviewedAt);assert.equal(entry.clinicalApproval,null);
  assert.equal(review.completePrimaryEvidenceRead,true);assert.equal(review.completeExistingWordingRead,true);assert.equal(review.wordingChanged,false);
  assert.equal(catalogueBeforeSuccessor([entry],Date.parse(receipt.reviewedAt)-1)[0].reviewedAt,review.previousReviewedAt);
 }
 const source=registrySources.find(item=>item.id===receipt.sourceRenewals[0].id);
 assert.equal(source.reviewedAt,receipt.reviewedAt);assert.equal(source.reviewedFingerprint,receipt.sourceRenewals[0].previousReviewedFingerprint);
 assert.equal(industrySources.find(item=>item.id==='ascletis-asc36-oral-phase1-20260908')?.reviewedAt,'2026-10-12T11:55:30Z');
 assert.equal(receipt.sourceRenewals[0].lifecycle.status,'NOT_YET_RECRUITING');assert.equal(receipt.sourceRenewals[0].lifecycle.hasResults,false);
 assert.equal(receipt.sourceRenewals[0].lifecycle.start.type,'ESTIMATED');
});
test('12 October renewal has exact separate counters and retains pending monitoring and unadopted discovery',()=>{
 const entries=[...medicines,...industry];assert.equal(entries.length,119);assert.equal(sources.length,204);assert.equal(manualEvidence(entries,sources).length,102);
 assert.equal(programmeSummaryQueue(entries,Date.parse(receipt.reviewedAt)).length,69);
 assert.equal(programmeSummaryQueue(catalogueBeforeSuccessor(entries,Date.parse(receipt.reviewedAt)-1),Date.parse(receipt.reviewedAt)-1).length,71);
 assert.equal(changes.length,43);assert.equal(receipt.completedReviewsAfter,42);assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 assert.equal(receipt.preserved.zp6590VerificationPending,true);assert.equal(receipt.preserved.zp6590CheckDelayed,true);assert.equal(receipt.preserved.monitorSuccessesSeeded,false);
 assert.ok(!industry.some(item=>/cgx.?926/i.test(item.id)));assert.ok(receipt.directSourceRecoveryChecks.every(item=>!item.renewalRequested&&!item.productionObservationChanged));
});
