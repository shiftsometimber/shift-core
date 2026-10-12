import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-12-authorised-ribupatide-specialist-renewal.json' with {type:'json'};
import {registrySources} from './credibility.mjs';
import {industry,industrySources} from './industry.mjs';
import {projectSourceHealth} from './monitor.mjs';

const observation=(source,time)=>({id:source.id,source_url:source.url,check_url:source.checkUrl,last_attempt_at:new Date(time).toISOString(),last_success_at:new Date(time).toISOString(),attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0});

test('eight ribupatide specialist sources renew only after unchanged primary-source review',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 assert.deepEqual(receipt.registrySources.map(source=>source.id),['registry-nct06595797','registry-nct06974851','registry-nct06994650','registry-nct07551492','registry-nct07559136','registry-nct07670884','registry-nct07660848']);
 const reviews=[receipt.sponsorSource,...receipt.registrySources],sources=[...industrySources,...registrySources];
 for(const review of reviews){
  const source=sources.find(candidate=>candidate.id===review.id);assert.ok(source,review.id);
  assert.equal(source.reviewedAt,receipt.reviewedAt);assert.equal(source.reviewedFingerprint,review.reviewedFingerprint);assert.equal(review.reviewedFingerprint,review.previousReviewedFingerprint);
  assert.equal(review.withdrawn,false);assert.equal(review.wordingChanged,false);assert.ok(review.assessment.length>250);assert.ok(review.uncertainty.length>150);
  if('lifecycleChanged' in review)assert.equal(review.lifecycleChanged,false);
  const time=Date.parse(receipt.reviewedAt);assert.equal(projectSourceHealth(source,observation(source,time),time).status,'current');
  const old={...source,reviewedAt:review.previousReviewedAt};assert.ok(projectSourceHealth(old,observation(old,time),time).reasons.includes('review_due'));
 }
});

test('only independently due oral and KAI-4729 summary dates advance',()=>{
 assert.deepEqual(receipt.programmeReviews.map(review=>review.id),['ribupatide-oral','kai4729']);
 for(const review of receipt.programmeReviews){const entry=industry.find(item=>item.id===review.id);assert.ok(entry,review.id);assert.equal(entry.reviewedAt,receipt.reviewedAt);assert.equal(review.wordingChanged,false);}
 const injection=industry.find(item=>item.id==='ribupatide-injection');assert.notEqual(injection.reviewedAt,receipt.reviewedAt);
 for(const id of ['hengrui-ribupatide-pmos-20260708','registry-nct06595797','registry-nct06974851','registry-nct06994650','registry-nct07551492','registry-nct07559136','registry-nct07670884','registry-nct07660848']){
  const entryIds=id==='registry-nct07670884'?['ribupatide-oral']:id==='registry-nct07660848'?['ribupatide-injection','kai4729']:['ribupatide-injection'];
  for(const entryId of entryIds){const entry=industry.find(item=>item.id===entryId);const url=id.startsWith('registry-')?'https://clinicaltrials.gov/study/'+id.slice(9).toUpperCase():receipt.sponsorSource.url;assert.equal(entry.additionalEvidence.find(link=>link.url===url)?.reviewedAt,receipt.reviewedAt);}
 }
 assert.deepEqual(receipt.counts,{priorCompletedReviews:36,completedReviewsAfter:37,detailedProgrammes:6,widerProgrammes:112,totalProgrammes:118,configuredSources:202,manualEvidence:102,configuredSourceReviewQueueBefore:8,configuredSourceReviewQueueAfter:0,programmeSummaryFactualReviewNeededBefore:70,programmeSummaryFactualReviewNeededAfter:68});
 for(const flag of ['programmeWordingChanged','configuredSourceCountChanged','programmeCountChanged','registryLifecycleChanged','resultsClaimedFromRegistry','monitorBaselinesChanged','monitorLogicChanged','queueLogicChanged','healthResponseShapeChanged','medicalClaimsChanged','ukAuthorisationChanged','nhsAccessChanged','supplyClaimChanged','clinicalApprovalChanged'])assert.equal(receipt.changes[flag],false);
 assert.deepEqual(receipt.remainingObstacles.map(item=>item.id),['zealand-zp6590-pipeline']);assert.match(receipt.discoveryBoundary,/remain ongoing/);assert.doesNotMatch(receipt.discoveryBoundary,/monitoring is finished/i);
});
