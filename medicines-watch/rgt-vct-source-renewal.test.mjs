import test from 'node:test';
import assert from 'node:assert/strict';
import renewal from './reviews/2026-10-11-authorised-rgt-vct-source-renewal.json' with {type:'json'};
import {sources} from './data.mjs';
import {industry} from './industry.mjs';

test('six overdue RGT-075 and VCT220 registry sources are renewed only after factual review',()=>{
 assert.equal(renewal.registrySources.length,6);
 for(const reviewed of renewal.registrySources){
  const source=sources.find(source=>source.id===reviewed.id);
  assert.ok(source,reviewed.id);
  assert.equal(source.reviewedAt,renewal.reviewedAt);
  assert.equal(source.reviewedFingerprint,reviewed.reviewedFingerprint);
  assert.equal(source.lifecycle.status,reviewed.status);
  assert.deepEqual(source.lifecycle.enrollment,reviewed.enrollment);
  assert.deepEqual(source.lifecycle.start,reviewed.start);
  assert.equal(source.lifecycle.hasResults,false);
 }
});

test('renewal preserves actual and estimated lifecycle distinctions',()=>{
 const hypertension=sources.find(source=>source.id==='registry-nct07360275');
 assert.equal(hypertension.lifecycle.status,'ACTIVE_NOT_RECRUITING');
 assert.equal(hypertension.lifecycle.enrollment.type,'ESTIMATED');
 assert.equal(hypertension.lifecycle.start.type,'ACTUAL');
 assert.equal(hypertension.lifecycle.primaryCompletion.type,'ESTIMATED');
 assert.equal(hypertension.lifecycle.completion.type,'ESTIMATED');
 for(const id of ['registry-nct06277934','registry-nct06867718','registry-nct06569355','registry-nct06939296','registry-nct07011797']){
  const source=sources.find(source=>source.id===id);
  assert.equal(source.lifecycle.status,'COMPLETED');
  assert.equal(source.lifecycle.enrollment.type,'ACTUAL');
  assert.equal(source.lifecycle.completion.type,'ACTUAL');
 }
});

test('source renewal does not silently renew the separate programme-summary queue',()=>{
 for(const id of ['rgt075','vct220']){
  const entry=industry.find(entry=>entry.id===id);
  assert.ok(entry,id);
  assert.notEqual(entry.reviewedAt,renewal.reviewedAt);
 }
 assert.equal(renewal.publication.programmeReviewDatesChanged,false);
 assert.equal(renewal.publication.programmeSummaryQueueChanged,false);
});

test('renewal preserves ZP6590 pending-delayed uncertainty and all source counts',()=>{
 assert.equal(sources.length,203);
 const zp=sources.find(source=>source.id==='zealand-zp6590-pipeline');
 assert.ok(zp);
 assert.notEqual(zp.reviewedAt,renewal.reviewedAt);
 assert.equal(renewal.publication.zp6590,'Remains verification_pending and check_delayed; this review does not alter or certify the blocked Zealand source.');
});
