import {programmeSummaryQueueAtReceipt,catalogueBeforeSuccessor} from './review-history-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-12-authorised-rhythm-pdf-alternatives.json' with {type:'json'};
import {industry,industrySources} from './industry.mjs';
import {registrySources} from './credibility.mjs';
import {medicines,sources} from './data.mjs';
import {projectSourceHealth} from './monitor.mjs';

const expected={
 'bivamelagon-rhythm-20250709':{url:'https://ir.rhythmtx.com/news-releases/news-release-details/rhythm-pharmaceuticals-announces-oral-mc4r-agonist-bivamelagon',checkUrl:'https://ir.rhythmtx.com/node/12446/pdf',fingerprint:'9f0faf3cb0d4f6b24e93601eee0a6090ef2f604e8e22b3cc9315dd3e67343805'},
 'rm718-rhythm-20260804':{url:'https://ir.rhythmtx.com/news-releases/news-release-details/rhythm-pharmaceuticals-announces-preliminary-data-phase-2-trial',checkUrl:'https://ir.rhythmtx.com/node/13501/pdf',fingerprint:'d10fbca2dfa163968fa0dd3fc406d5a15118fbe5b1d23339455e54ebb3805fa6'}
};

test('Rhythm public evidence links stay fixed while only official PDF check routes replace denied HTML checks',()=>{
 assert.equal(receipt.publicationStatus,'owner_authorised_source_monitor_repair');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 for(const [id,want] of Object.entries(expected)){
  const source=industrySources.find(item=>item.id===id),review=receipt.sources.find(item=>item.id===id);assert.ok(source);assert.ok(review);
  assert.equal(source.url,want.url);assert.equal(source.checkUrl,want.checkUrl);assert.equal(new URL(source.checkUrl).hostname,'ir.rhythmtx.com');assert.equal(source.format,'pdf');assert.equal(source.reviewedAt,receipt.reviewedAt);assert.equal(source.reviewedFingerprint,want.fingerprint);assert.equal(review.reviewedFingerprint,want.fingerprint);
 }
 assert.equal(receipt.monitoring.successesSeeded,false);assert.equal(receipt.monitoring.thresholdsChanged,false);assert.equal(receipt.medicineWordingChanged,false);assert.equal(receipt.programmeReviewDatesChanged,false);assert.equal(receipt.monitorLogicChanged,false);
});

test('reviewed fingerprints are the immutable exact bytes of both complete official PDFs',()=>{
 assert.deepEqual(receipt.retrievals.map(item=>[item.id,item.httpStatus,item.contentType,item.bytes,item.responseSha256]),[
  ['bivamelagon-rhythm-20250709',200,'application/pdf',280402,expected['bivamelagon-rhythm-20250709'].fingerprint],
  ['rm718-rhythm-20260804',200,'application/pdf',270065,expected['rm718-rhythm-20260804'].fingerprint]
 ]);
 for(const source of receipt.sources)assert.equal(receipt.retrievals.find(item=>item.id===source.id).responseSha256,source.reviewedFingerprint);
});

test('source-route repair preserves catalogue, claims, queues and unresolved ZP6590 boundaries',()=>{
 assert.equal(medicines.length+industry.length,119);assert.equal(sources.length,204);assert.equal(registrySources.length,139);assert.equal(programmeSummaryQueueAtReceipt([...medicines,...industry],Date.parse(receipt.reviewedAt)).length,69);
 assert.deepEqual(receipt.monitoring,{sourceCountBefore:204,sourceCountAfter:204,configuredSourceReviewQueueBefore:0,configuredSourceReviewQueueAfter:0,priorCompletedReviews:39,completedReviewsAfter:40,programmeSummaryFactualReviewNeeded:69,thresholdsChanged:false,successesSeeded:false,expected:receipt.monitoring.expected});
 assert.equal(receipt.preserved.zp6590VerificationPending,true);assert.equal(receipt.preserved.zp6590CheckDelayed,true);assert.equal(receipt.preserved.monitoringFinished,false);
 for(const id of ['bivamelagon','rm718']){const item=industry.find(entry=>entry.id===id);assert.equal(item.reviewedAt,'2026-10-06T13:43:02Z');assert.equal(item.clinicalApproval,null);assert.match(item.ukAuthorisation,/do(?:es)? not establish UK marketing authorisation/i);}
});

test('fresh matching PDF observations are current without fabricating production state',()=>{
 const now=Date.parse(receipt.reviewedAt);
 for(const source of receipt.sources){const observation={id:source.id,source_url:source.url,check_url:source.checkUrl,last_attempt_at:receipt.reviewedAt,last_success_at:receipt.reviewedAt,attempt_status:'succeeded',last_http_status:200,last_fingerprint:source.reviewedFingerprint,last_withdrawn:0};assert.equal(projectSourceHealth(source,observation,now).status,'current');}
});
