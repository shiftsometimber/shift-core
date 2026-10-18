import {programmeSummaryQueueAtReceipt,catalogueBeforeSuccessor} from './review-history-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-12-authorised-gzc8072-asc30-maritide.json' with {type:'json'};
import {industry,industrySources} from './industry.mjs';
import {registrySources} from './credibility.mjs';
import {medicines,sources} from './data.mjs';
import {projectSourceHealth} from './monitor.mjs';

const observation=(source,time)=>({id:source.id,source_url:source.url,check_url:source.checkUrl,last_attempt_at:new Date(time).toISOString(),last_success_at:new Date(time).toISOString(),attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0});

test('five actually due sources renew only after unchanged complete-source review',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 assert.deepEqual(receipt.sourceReviews.map(item=>item.id),['ganlee-gzc8072-20260907','registry-nct07784699','ascletis-asc30-aurora-first-dose-20260830','registry-nct07743463','registry-nct07743450']);
 const configured=[...industrySources,...registrySources];
 for(const review of receipt.sourceReviews){
  const source=configured.find(item=>item.id===review.id);assert.ok(source,review.id);assert.equal(source.reviewedAt,receipt.reviewedAt);assert.equal(source.reviewedFingerprint,review.reviewedFingerprint);assert.equal(review.reviewedFingerprint,review.previousReviewedFingerprint);
  assert.equal(review.withdrawn,false);assert.equal(review.wordingChanged,false);assert.equal(review.lifecycleChanged,false);assert.ok(review.assessment.length>180);
  const time=Date.parse(receipt.reviewedAt);assert.equal(projectSourceHealth(source,observation(source,time),time).status,'current');
  const old={...source,reviewedAt:review.previousReviewedAt};assert.ok(projectSourceHealth(old,observation(old,time),time).reasons.includes('review_due'));
 }
});

test('GZC8072 and ASC30 wording stays fixed while their summary dates renew',()=>{
 for(const id of ['gzc8072','asc30-oral']){
  const entry=industry.find(item=>item.id===id),review=receipt.programmeReviews.find(item=>item.id===id);assert.ok(entry);assert.equal(entry.reviewedAt,receipt.reviewedAt);assert.equal(review.wordingChanged,false);
 }
 const gzc=industry.find(item=>item.id==='gzc8072');assert.match(gzc.limitations,/no posted results/);assert.match(gzc.ukAuthorisation,/does not establish UK marketing authorisation/);
 const asc=industry.find(item=>item.id==='asc30-oral');assert.match(asc.limitations,/Neither registry has posted results/);assert.match(asc.limitations,/AURORA-2 is specialist type 2 diabetes research/);
});

test('MARITIME-T2D-3 is bounded registered specialist research, not a comparative result',()=>{
 const source=registrySources.find(item=>item.nctId==='NCT07866066');assert.ok(source);assert.equal(source.reviewedFingerprint,'3366f89ab798b87ac4c6392bd2f594a98efba557fe237c39f6a6e5b58d871271');
 assert.equal(source.lifecycle.status,'NOT_YET_RECRUITING');assert.deepEqual(source.lifecycle.phases,['PHASE3']);assert.deepEqual(source.lifecycle.enrollment,{count:1300,type:'ESTIMATED'});assert.deepEqual(source.lifecycle.start,{date:'2026-11-02',type:'ESTIMATED'});assert.equal(source.lifecycle.hasResults,false);
 const entry=industry.find(item=>item.id==='maritide');assert.equal(entry.reviewedAt,receipt.reviewedAt);assert.match(entry.summary,/HbA1c non-inferiority/);assert.match(entry.summary,/body-weight measures are secondary outcomes/);assert.match(entry.limitations,/not comparative findings/);assert.match(entry.limitations,/not yet recruiting/);assert.ok(entry.additionalEvidence.some(link=>link.url==='https://clinicaltrials.gov/study/NCT07866066'));
});

test('release counts and separate queues stay honest',()=>{
 assert.equal(medicines.length+industry.length,119);assert.equal(sources.length,204);assert.equal(registrySources.length,139);
 assert.deepEqual(receipt.counts,{priorCompletedReviews:38,completedReviewsAfter:39,programmes:119,configuredSourcesBefore:203,configuredSourcesAfter:204,manualEvidence:102,configuredSourceReviewQueueBefore:5,configuredSourceReviewQueueAfter:0,programmeSummaryFactualReviewNeededBefore:70,programmeSummaryFactualReviewNeededAfter:68});
 assert.equal(programmeSummaryQueueAtReceipt([...medicines,...industry],Date.parse(receipt.reviewedAt)).length,68);
 assert.deepEqual(receipt.configuredSourcePass.preservedDelayedSources,['zealand-zp6590-pipeline','bivamelagon-rhythm-20250709','rm718-rhythm-20260804']);
 assert.equal(receipt.preserved.zp6590VerificationPending,true);assert.equal(receipt.preserved.zp6590CheckDelayed,true);assert.equal(receipt.preserved.monitorLogicChanged,false);assert.equal(receipt.preserved.medicalClaimsChanged,false);
 assert.equal(receipt.discoveryPass.incomplete,true);assert.match(receipt.discoveryPass.boundary,/cannot prove industry completeness/);assert.match(receipt.discoveryPass.boundary,/Monitoring is not finished/);
});
