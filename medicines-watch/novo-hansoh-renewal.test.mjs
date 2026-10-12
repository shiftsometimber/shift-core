import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-12-authorised-novo-hansoh-renewal.json' with {type:'json'};
import {registrySources} from './credibility.mjs';
import {industry,industrySources} from './industry.mjs';
import {sources} from './data.mjs';
import {manualEvidence,programmeSummaryQueue} from './evidence-desk.mjs';
import {projectSourceHealth} from './monitor.mjs';

const observation=(source,time)=>({id:source.id,source_url:source.url,check_url:source.checkUrl,last_attempt_at:new Date(time).toISOString(),last_success_at:new Date(time).toISOString(),attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0});

test('seven unchanged registry records renew only after complete primary-source review',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 assert.equal(receipt.registrySources.length,7);
 for(const review of receipt.registrySources){
  const source=registrySources.find(candidate=>candidate.id===review.id);assert.ok(source,review.id);
  assert.equal(source.reviewedAt,receipt.reviewedAt);assert.equal(source.reviewedFingerprint,review.reviewedFingerprint);assert.equal(review.reviewedFingerprint,review.previousReviewedFingerprint);
  assert.equal(review.withdrawn,false);assert.equal(review.wordingChanged,false);assert.equal(review.lifecycleChanged,false);assert.ok(review.assessment.length>250);
  const time=Date.parse(receipt.reviewedAt);assert.equal(projectSourceHealth(source,observation(source,time),time).status,'current');
 }
 assert.equal(industry.find(item=>item.id==='survodutide').reviewedAt,'2026-10-06T00:40:21Z','single-source renewal must not renew the wider programme summary');
});

test('Hansoh selector repair pins the reviewed article body and preserves medical boundaries',()=>{
 const source=industrySources.find(item=>item.id===receipt.hansohSource.id);assert.ok(source);
 assert.equal(source.contentSelector,'.text');assert.equal(source.reviewedAt,receipt.reviewedAt);assert.equal(source.reviewedFingerprint,receipt.hansohSource.reviewedFingerprint);
 assert.match(source.reviewedFingerprint,/^[a-f0-9]{64}$/);assert.notEqual(source.reviewedFingerprint,receipt.hansohSource.previousReviewedFingerprint);
 assert.equal(receipt.changes.monitorLogicChanged,false);assert.equal(receipt.changes.sourceSpecificSelectorChanged,true);
 const entry=industry.find(item=>item.id==='olatorepatide');assert.equal(entry.reviewedAt,receipt.reviewedAt);
 assert.match(entry.summary,/sponsor announcement reports a 48-week randomized/);assert.match(entry.summary,/-19\.3%/);
 assert.match(entry.limitations,/sponsor-reported conference findings/);assert.match(entry.limitations,/does not adopt.*comparative tolerability/i);
 assert.match(entry.ukAuthorisation,/Not established/);assert.match(entry.nhsEngland,/not established/i);assert.match(entry.supply,/unverified/i);assert.equal(entry.clinicalApproval,null);
 assert.ok(entry.additionalEvidence.some(link=>link.url===receipt.olatorepatideEvidence.url));
});

test('programme reviews and counters remain separate and exact at the review instant',()=>{
 for(const review of receipt.programmeReviews){const entry=industry.find(item=>item.id===review.id);assert.ok(entry,review.id);assert.equal(entry.reviewedAt,receipt.reviewedAt);}
 const industryAtReview=industry.filter(entry=>entry.id!=='ly4329090');
 const sourcesAtReview=sources.filter(source=>source.id!=='registry-nct07808073');
 const entries=[...industryAtReview.map(entry=>['ribupatide-oral','kai4729'].includes(entry.id)?{...entry,reviewedAt:'2026-10-05T02:34:35Z'}:entry),...Array.from({length:6},(_,index)=>({id:`detailed-${index}`,name:`Detailed ${index}`,reviewedAt:'2026-09-01T00:00:00Z',additionalEvidence:[]}))];
 assert.equal(programmeSummaryQueue(entries,Date.parse(receipt.reviewedAt)).length,receipt.counts.programmeSummaryQueueAfterReview);
 assert.equal(industryAtReview.length,receipt.counts.widerProgrammes);assert.equal(sourcesAtReview.length,receipt.counts.configuredSources);
 assert.equal(manualEvidence(industryAtReview,sourcesAtReview).length,98);assert.equal(receipt.counts.manualEvidenceAfter,102);
 assert.deepEqual(receipt.preserved,{zp6590VerificationPending:true,zp6590CheckDelayed:true,externalCommunicationsSent:false,customerDataChanged:false,memberTreatmentChanged:false,checkoutChanged:false,homepageChanged:false,sharedNavigationChanged:false,calculatorChanged:false,analyticsChanged:false,consentChanged:false});
 assert.equal(receipt.discovery.boundary.includes('monitoring is not finished'),true);
 assert.deepEqual(receipt.failedChecks.map(item=>item.id),['bivamelagon-rhythm-20250709','rm718-rhythm-20260804']);
});
