import test from 'node:test';
import assert from 'node:assert/strict';
import renewal from './reviews/2026-10-11-authorised-srsd384-renewal.json' with {type:'json'};
import officialAlternatives from './reviews/2026-10-10-authorised-official-alternatives.json' with {type:'json'};
import {sources} from './data.mjs';
import {industry} from './industry.mjs';

test('SRSD384 completed review renews the exact registry source without changing its approved fingerprint',()=>{
 const source=sources.find(source=>source.id==='registry-nct07557355');
 assert.ok(source);
 assert.equal(source.reviewedAt,renewal.reviewedAt);
 assert.equal(source.reviewedFingerprint,renewal.source.reviewedFingerprint);
 assert.equal(source.lifecycle.status,'NOT_YET_RECRUITING');
 assert.equal(source.lifecycle.start.type,'ESTIMATED');
 assert.equal(source.lifecycle.enrollment.type,'ESTIMATED');
 assert.equal(source.lifecycle.hasResults,false);
});

test('SRSD384 summary retains the sponsor-registry discrepancy and renews only reviewed evidence',()=>{
 const entry=industry.find(entry=>entry.id==='srsd384');
 assert.ok(entry);
 assert.equal(entry.reviewedAt,renewal.reviewedAt);
 assert.match(entry.stage,/Sponsor-reported first participant dosed/);
 assert.match(entry.stage,/registry still not yet recruiting/);
 assert.match(entry.limitations,/conflicts with the registry/);
 assert.match(entry.limitations,/not demonstrated human outcomes/);
 assert.ok(entry.additionalEvidence.every(link=>link.reviewedAt===renewal.reviewedAt));
});

test('completed Kailera reviews are connected to configured sources without changing evidence',()=>{
 for(const id of ['kailera-q2-2026','kailera-kainetic-20260930']){
  const source=sources.find(source=>source.id===id);
  assert.ok(source);
  const review=officialAlternatives.sourceReviews.find(review=>review.url===source.url||review.url===source.checkUrl);
  assert.ok(review);
  assert.equal(source.reviewedAt,review.reviewedAt);
  assert.match(source.reviewedFingerprint,/^[a-f0-9]{64}$/);
 }
});

test('renewal preserves ZP6590 pending-delayed semantics rather than certifying the blocked source',()=>{
 const source=sources.find(source=>source.id==='zealand-zp6590-pipeline');
 assert.ok(source);
 assert.notEqual(source.reviewedAt,renewal.reviewedAt);
 assert.equal(renewal.publication.zp6590,'Remains verification_pending and check_delayed. This review does not alter or certify the blocked Zealand pipeline source.');
});
