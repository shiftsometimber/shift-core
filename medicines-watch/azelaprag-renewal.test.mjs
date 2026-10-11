import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-11-authorised-azelaprag-renewal.json' with {type:'json'};
import {medicines,sources as detailedSources} from './data.mjs';
import {industry} from './industry.mjs';
import {evidenceQueue,programmeSummaryQueue} from './evidence-desk.mjs';
import {projectSourceHealth} from './monitor.mjs';

const allSources=detailedSources;
const reviewedSources=[...receipt.sources,...receipt.registrySources];
const observation=(source,time)=>({
 id:source.id,source_url:source.url,check_url:source.checkUrl,
 last_attempt_at:new Date(time).toISOString(),last_success_at:new Date(time).toISOString(),
 attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0,
});

test('azelaprag renewal requires actual unchanged primary-source review',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(receipt.clinicalApproval,null);
 assert.equal(receipt.industryComplete,false);
 assert.equal(receipt.sources.length,1);
 assert.equal(receipt.registrySources.length,1);
 assert.equal(receipt.changes.sourceReviewDatesRenewed,2);
 for(const review of reviewedSources){
  const source=allSources.find(candidate=>candidate.id===review.id);
  assert.ok(source,review.id);
  assert.equal(source.reviewedAt,receipt.reviewedAt);
  assert.equal(source.reviewedFingerprint,review.reviewedFingerprint);
  assert.equal(review.reviewedFingerprint,review.previousReviewedFingerprint);
  assert.equal(review.withdrawn,false);
  assert.equal(review.wordingChanged,false);
  assert.ok(review.assessment.length>150);
  const time=Date.parse(receipt.reviewedAt);
  assert.equal(projectSourceHealth(source,observation(source,time),time).status,'current');
  const old={...source,reviewedAt:review.previousReviewedAt};
  assert.ok(projectSourceHealth(old,observation(old,time),time).reasons.includes('review_due'));
 }
});

test('azelaprag renewal clears only its due work and preserves separate queues',()=>{
 const time=Date.parse(receipt.reviewedAt);
 const health={sources:reviewedSources.map(review=>{
  const source=allSources.find(candidate=>candidate.id===review.id);
  return {...projectSourceHealth(source,observation(source,time),time),id:source.id};
 })};
 const sourceQueue=evidenceQueue(allSources,health,time);
 assert.ok(!sourceQueue.some(item=>reviewedSources.some(review=>review.id===item.source.id)));
 assert.equal(receipt.preserved.completedFactualReviews,35);
 assert.equal(receipt.preserved.programmes,116);
 assert.equal(allSources.length,receipt.preserved.configuredSources);
 assert.equal(receipt.preserved.expectedConfiguredSourceFactualReviewNeeded,0);
 assert.equal(receipt.preserved.expectedProgrammeSummaryFactualReviewNeeded,66);
 const catalogueAtReview=[...medicines,...industry].filter(entry=>!['aln2232','aln6222'].includes(entry.id)).map(entry=>['zynergy-petrelintide-enicepatide','mazdutide','aleniglipron'].includes(entry.id)?{...entry,reviewedAt:'2026-10-04T21:37:32Z'}:entry);
 assert.equal(programmeSummaryQueue(catalogueAtReview,time).length,66);
 assert.equal(receipt.preserved.zp6590VerificationPending,true);
 assert.equal(receipt.preserved.zp6590CheckDelayed,true);
 const obstacle=receipt.remainingObstacles.find(item=>item.id==='zealand-zp6590-pipeline');
 assert.deepEqual(obstacle.state,['verification_pending','check_delayed']);
 assert.match(obstacle.nextAction,/do not repeatedly retry/);
});

test('azelaprag wording and evidence state stay bounded',()=>{
 const entry=industry.find(item=>item.id==='azelaprag');
 assert.ok(entry);
 assert.equal(entry.reviewedAt,receipt.reviewedAt);
 assert.match(entry.stage,/discontinued/i);
 assert.match(entry.summary,/terminated/);
 const registry=entry.additionalEvidence.find(item=>item.url==='https://clinicaltrials.gov/study/NCT06515418');
 const filing=entry.additionalEvidence.find(item=>item.url.includes('bioa-20241231.htm'));
 assert.equal(registry.reviewedAt,receipt.reviewedAt);
 assert.equal(registry.sourceUpdatedAt,'2025-03-13');
 assert.equal(filing.reviewedAt,receipt.reviewedAt);
 assert.equal(filing.sourcePublishedAt,'2025-03-20');
 for(const flag of ['programmeWordingChanged','configuredSourceCountChanged','programmeCountChanged','monitorBaselinesChanged','queueLogicChanged','healthResponseShapeChanged','medicalClaimsChanged','ukAuthorisationChanged','nhsAccessChanged','supplyClaimChanged'])assert.equal(receipt.changes[flag],false);
 assert.equal(receipt.preserved.externalCommunicationsSent,false);
 assert.equal(receipt.preserved.customerDataChanged,false);
 assert.equal(receipt.preserved.memberTreatmentChanged,false);
 assert.equal(receipt.preserved.checkoutChanged,false);
});
