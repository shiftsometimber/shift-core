import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-11-authorised-alnylam-rnai-discovery.json' with {type:'json'};
import {medicines,sources} from './data.mjs';
import {industry,industrySources} from './industry.mjs';
import {manualEvidence,programmeSummaryQueue} from './evidence-desk.mjs';

test('Alnylam RNAi discovery adds two distinct bounded programmes',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 assert.equal(receipt.automatedMonitorChanges,false);assert.equal(receipt.entries.length,2);
 assert.deepEqual(receipt.counts,{detailedBefore:6,detailedAfter:6,widerBefore:110,widerAfter:112,totalBefore:116,totalAfter:118,configuredSourcesBefore:202,configuredSourcesAfter:202,manualEvidenceBefore:96,manualEvidenceAfter:101,programmeSummaryFactualReviewNeededBefore:66,programmeSummaryFactualReviewNeededAfter:66});
 const aln2232=industry.find(item=>item.id==='aln2232');
 const aln6222=industry.find(item=>item.id==='aln6222');
 assert.ok(aln2232);assert.ok(aln6222);assert.notEqual(aln2232.id,aln6222.id);
 assert.match(aln2232.stage,/Phase 1\/2/);assert.match(aln2232.summary,/co-initiated with tirzepatide/);
 assert.match(aln2232.limitations,/not an approved combination/);assert.match(aln2232.limitations,/plan, not a completed event/);
 assert.match(aln6222.stage,/first-in-human Phase 1/);assert.match(aln6222.summary,/inhibin E \(INHBE\)/);
 assert.match(aln6222.limitations,/not evidence of efficacy, safety, muscle preservation, strength or function/);
 for(const item of [aln2232,aln6222]){
  assert.equal(item.group,'research');assert.equal(item.clinicalApproval,null);assert.equal(item.sourceIds.length,0);
  assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/);
  assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/);
  assert.match(item.supply,/does not establish lawful UK retail supply/);
  assert.ok(item.additionalEvidence.every(link=>link.reviewedAt===receipt.reviewedAt&&/not automatically content-monitored/i.test(link.checkScope)));
 }
});

test('Alnylam evidence remains manual and preserves established queues and uncertainty',()=>{
 assert.equal(medicines.length+industry.length,118);assert.equal(sources.length,202);
 assert.equal(manualEvidence([...medicines,...industry],[...sources,...industrySources]).length,101);
 assert.equal(programmeSummaryQueue([...medicines,...industry],Date.parse(receipt.reviewedAt)).length,66);
 assert.equal(receipt.preserved.completedFactualReviews,35);
 assert.equal(receipt.preserved.zp6590VerificationPending,true);assert.equal(receipt.preserved.zp6590CheckDelayed,true);
 for(const flag of ['configuredSourceMonitorLogicChanged','monitorBaselinesChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','externalCommunicationsSent','customerDataChanged','memberTreatmentChanged','checkoutChanged'])assert.equal(receipt.preserved[flag],false);
 const zp=receipt.remainingObstacles.find(item=>item.id==='zealand-zp6590-pipeline');
 assert.deepEqual(zp.state,['verification_pending','check_delayed']);assert.match(zp.nextAction,/do not repeatedly retry/);
 const registry=receipt.remainingObstacles.find(item=>item.id==='alnylam-registry-api');
 assert.deepEqual(registry.state,['manual_follow_up']);assert.match(registry.nextAction,/complete official records/);
});
