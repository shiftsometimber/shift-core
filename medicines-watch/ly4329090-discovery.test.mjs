import {programmeSummaryQueueAtReceipt,catalogueBeforeSuccessor} from './review-history-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-12-authorised-ly4329090-discovery.json' with {type:'json'};
import {medicines,sources} from './data.mjs';
import {industry} from './industry.mjs';
import {manualEvidence} from './evidence-desk.mjs';
import {projectSourceHealth} from './monitor.mjs';

test('LY4329090 discovery adds one bounded early Lilly programme from the complete registry record',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 assert.equal(receipt.entries.length,1);assert.equal(receipt.registrySources.length,1);
 const entry=industry.find(item=>item.id==='ly4329090');assert.ok(entry);
 assert.equal(entry.reviewedAt,receipt.reviewedAt);assert.equal(entry.clinicalApproval,null);
 assert.match(entry.stage,/Recruiting subcutaneous Phase 1/);assert.match(entry.summary,/actual 22 September 2026 start/);
 assert.match(entry.limitations,/does not disclose a molecular target or mechanism/);
 assert.match(entry.limitations,/No results are posted/);assert.match(entry.ukAuthorisation,/does not establish/);
 assert.match(entry.nhsEngland,/No NICE recommendation/);assert.match(entry.supply,/does not establish lawful UK retail supply/);
 const source=sources.find(item=>item.id==='registry-nct07808073');assert.ok(source);
 assert.equal(source.reviewedFingerprint,'571cff58158558e75dc2427106d305134bdf3df77ce2e8244548dd22c946fbb1');
 assert.deepEqual(source.lifecycle,{nctId:'NCT07808073',title:'A Study of LY4329090 in Participants With Obesity or Overweight Who Are Otherwise Healthy',sponsor:'Eli Lilly and Company',status:'RECRUITING',whyStopped:null,phases:['PHASE1'],enrollment:{count:184,type:'ESTIMATED'},start:{date:'2026-09-22',type:'ACTUAL'},primaryCompletion:{date:'2027-09',type:'ESTIMATED'},completion:{date:'2027-09',type:'ESTIMATED'},firstPosted:{date:'2026-09-08',type:'ACTUAL'},lastUpdated:{date:'2026-10-08',type:'ACTUAL'},hasResults:false,resultsFirstPosted:null,resultsLastUpdated:null});
 const time=Date.parse(receipt.reviewedAt),observation={id:source.id,source_url:source.url,check_url:source.checkUrl,last_attempt_at:receipt.reviewedAt,last_success_at:receipt.reviewedAt,attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0};
 assert.equal(projectSourceHealth(source,observation,time).status,'current');
 assert.equal(projectSourceHealth({...source,reviewedFingerprint:'0'.repeat(64)},observation,time).status,'awaiting_review');
});

test('LY4329090 addition preserves exact counters, separate queues and medical boundaries',()=>{
 assert.equal(medicines.length+industry.length,119);assert.equal(sources.length,204);
 assert.equal(manualEvidence([...medicines,...industry],sources).length,102);
 assert.equal(programmeSummaryQueueAtReceipt([...medicines,...industry],Date.parse(receipt.reviewedAt)).length,71);
 assert.deepEqual(receipt.counts,{priorCompletedReviews:37,completedReviewsAfter:38,detailedProgrammes:6,widerProgrammesBefore:112,widerProgrammesAfter:113,totalProgrammesBefore:118,totalProgrammesAfter:119,configuredSourcesBefore:202,configuredSourcesAfter:203,manualEvidenceBefore:102,manualEvidenceAfter:102,configuredSourceReviewQueueAfter:0,programmeSummaryFactualReviewNeededAfter:68});
 assert.equal(receipt.discoveryPass.incomplete,true);assert.match(receipt.discoveryPass.boundary,/monitoring is not finished/);
 for(const flag of ['monitorLogicChanged','existingMonitorBaselinesChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','externalCommunicationsSent','customerDataChanged','memberTreatmentChanged','checkoutChanged','homepageChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged'])assert.equal(receipt.preserved[flag],false);
 assert.equal(receipt.preserved.zp6590VerificationPending,true);assert.equal(receipt.preserved.zp6590CheckDelayed,true);
});
