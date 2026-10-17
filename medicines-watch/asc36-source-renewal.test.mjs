import {programmeSummaryQueueAtReceipt,catalogueBeforeSuccessor} from './review-history-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-12-authorised-asc36-source-renewal.json' with {type:'json'};
import {industry,industrySources} from './industry.mjs';
import {medicines,sources} from './data.mjs';
import {projectSourceHealth} from './monitor.mjs';
import {manualEvidence} from './evidence-desk.mjs';

test('ASC36 source renews only after a complete unchanged primary-source rereview',()=>{
 const source=industrySources.find(item=>item.id===receipt.source.id);
 assert.ok(source);assert.equal(receipt.publicationStatus,'owner_authorised_factual_source_renewal');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 for(const key of ['url','checkUrl','format','contentSelector','sourcePublishedAt','reviewedAt','reviewedFingerprint'])assert.equal(source[key],receipt.source[key]);
 assert.equal(receipt.source.previousReviewedFingerprint,receipt.source.reviewedFingerprint);assert.equal(receipt.source.withdrawn,false);assert.equal(receipt.source.wordingChanged,false);
 assert.deepEqual(receipt.retrieval,{...receipt.retrieval,httpStatus:200,bytes:16300,responseSha256:'ef557f52838f4b3cc7d4747f5281454569f35ff4a59ebe81ff9e91ef5fb348e9'});
});

test('ASC36 source-only receipt preserves medical wording and its historical programme review date',()=>{
 const entry=catalogueBeforeSuccessor(industry,Date.parse(receipt.reviewedAt)).find(item=>item.id==='asc36-oral');assert.ok(entry);
 assert.equal(entry.reviewedAt,'2026-10-05T11:27:10Z');assert.equal(entry.clinicalApproval,null);assert.match(entry.summary,/86 participants/);assert.match(entry.summary,/separate from ASC36 subcutaneous injection/);
 assert.match(entry.limitations,/does not identify first dosing, recruitment status/);assert.match(entry.limitations,/non-human primates or rats/);assert.match(entry.ukAuthorisation,/not marketing approval in the US or UK/);assert.match(entry.nhsEngland,/No NICE recommendation or NHS England access/);assert.match(entry.supply,/does not establish lawful UK retail supply/);
 assert.equal(receipt.medicineWordingChanged,false);assert.equal(receipt.programmeReviewDateChanged,false);assert.equal(receipt.monitorLogicChanged,false);
});

test('ASC36 renewal preserves catalogue, manual evidence, summary queue and ZP6590 boundaries',()=>{
 const all=[...medicines,...industry];assert.equal(all.length,119);assert.equal(sources.length,204);assert.equal(manualEvidence(all,sources).length,102);assert.equal(programmeSummaryQueueAtReceipt(all,Date.parse(receipt.reviewedAt)).length,70);
 assert.deepEqual(receipt.monitoring,{sourceCountBefore:204,sourceCountAfter:204,configuredSourceReviewQueueBefore:1,configuredSourceReviewQueueAfter:0,priorCompletedReviews:40,completedReviewsAfter:41,programmeSummaryFactualReviewNeeded:70,thresholdsChanged:false,successesSeeded:false});
 assert.equal(receipt.preserved.zp6590VerificationPending,true);assert.equal(receipt.preserved.zp6590CheckDelayed,true);assert.equal(receipt.preserved.monitoringFinished,false);
});

test('fresh unchanged ASC36 observation becomes current without fabricated production state',()=>{
 const source=industrySources.find(item=>item.id===receipt.source.id),time=Date.parse(receipt.reviewedAt);
 const observation={id:source.id,source_url:source.url,check_url:source.checkUrl,last_attempt_at:receipt.reviewedAt,last_success_at:receipt.reviewedAt,attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0};
 assert.equal(projectSourceHealth(source,observation,time).status,'current');assert.equal(receipt.monitoring.successesSeeded,false);
});

test('ASC36 registry absence stays an incomplete discovery check',()=>{
 assert.equal(receipt.registrySearch.httpStatus,200);assert.equal(receipt.registrySearch.recordsReturned,0);assert.match(receipt.registrySearch.boundary,/not proof/);assert.equal(receipt.discoveryPass.industryComplete,false);
});
