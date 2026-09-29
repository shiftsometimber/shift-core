import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sources, medicines, REVIEWED_AT} from './data.mjs';
import {projectSourceHealth, REVIEW_INTERVAL_MS} from './monitor.mjs';

const receipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-23-source-review.json', import.meta.url)));
const nhsReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-24-mounjaro-nhs-renewal.json', import.meta.url)));
const foundayoReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-29-foundayo-nice-schedule.json', import.meta.url)));
const reviewTime = Date.parse(receipt.reviewedAt);
const rowFor = (source, now = reviewTime) => ({
  source_url: source.url, check_url: source.checkUrl,
  last_attempt_at: new Date(now).toISOString(), last_success_at: new Date(now).toISOString(),
  attempt_status: 'succeeded', last_http_status: 200,
  last_fingerprint: source.reviewedFingerprint, last_withdrawn: 0,
});

test('source-only review binds twelve complete primary responses without clinical approval', () => {
  assert.equal(receipt.reviewType, 'AI-assisted factual source review; not clinical approval');
  assert.equal(receipt.sources.length, 12);
  assert.equal(new Set(receipt.sources.map(s => s.id)).size, 12);
  for (const proof of receipt.sources) {
    const source = sources.find(s => s.id === proof.id);
    const currentProof = proof.id === 'foundayo-nice' ? foundayoReceipt.sources[0] : proof;
    assert.equal(source.url, currentProof.url);
    assert.equal(source.checkUrl, currentProof.checkUrl);
    assert.equal(source.reviewedAt, currentProof.reviewedAt);
    assert.equal(source.reviewedFingerprint, currentProof.reviewedFingerprint);
    assert.equal(source.sourcePublishedAt, currentProof.sourcePublishedAt);
    assert.equal(currentProof.httpStatus, 200);
    assert.ok(currentProof.bytes > 0 && currentProof.bytes <= 2 * 1024 * 1024);
    assert.match(currentProof.responseSha256, /^[a-f0-9]{64}$/);
    assert.equal(currentProof.withdrawn, false);
    assert.equal(currentProof.wordingChanged, false);
    assert.ok(currentProof.assessment.length > 100);
    const currentReviewTime = Date.parse(currentProof.reviewedAt);
    assert.equal(projectSourceHealth(source, rowFor(source, currentReviewTime), currentReviewTime).status, 'current');
  }
});

test('review expiry, changed content and failures still fail closed', () => {
  for (const proof of receipt.sources) {
    const source = sources.find(s => s.id === proof.id);
    const currentReviewTime = Date.parse(source.reviewedAt);
    const expired = currentReviewTime + REVIEW_INTERVAL_MS + 1;
    assert.ok(projectSourceHealth(source, rowFor(source, expired), expired).reasons.includes('review_due'));
    assert.ok(projectSourceHealth(source, {...rowFor(source, currentReviewTime), last_fingerprint: 'f'.repeat(64)}, currentReviewTime).reasons.includes('source_changed'));
    assert.notEqual(projectSourceHealth(source, {...rowFor(source, currentReviewTime), attempt_status: 'failed', last_http_status: 403}, currentReviewTime).status, 'current');
    assert.ok(projectSourceHealth(source, {...rowFor(source, currentReviewTime), last_withdrawn: 1}, currentReviewTime).reasons.includes('source_withdrawn'));
  }
});

test('separate NHS tirzepatide expiry is renewed only after reading the complete unchanged source', () => {
  assert.equal(nhsReceipt.reviewType, 'AI-assisted factual source review; not clinical approval');
  assert.equal(nhsReceipt.sources.length, 1);
  const proof = nhsReceipt.sources[0];
  const source = sources.find(s => s.id === proof.id);
  assert.equal(proof.id, 'mounjaro-nhs');
  for (const key of ['url', 'checkUrl', 'reviewedAt', 'reviewedFingerprint', 'sourcePublishedAt']) {
    assert.equal(source[key], proof[key]);
  }
  assert.equal(proof.previousReviewedAt, '2026-09-17T05:45:00Z');
  assert.equal(proof.previousReviewedFingerprint, proof.reviewedFingerprint);
  assert.ok(Date.parse(proof.reviewedAt) > Date.parse(proof.previousReviewedAt) + REVIEW_INTERVAL_MS);
  assert.equal(proof.httpStatus, 200);
  assert.ok(proof.bytes > 1000 && proof.bytes <= 2 * 1024 * 1024);
  assert.match(proof.responseSha256, /^[a-f0-9]{64}$/);
  assert.equal(proof.withdrawn, false);
  assert.equal(proof.wordingChanged, false);
  assert.ok(proof.assessment.length > 150);
  const time = Date.parse(proof.reviewedAt);
  assert.equal(projectSourceHealth(source, rowFor(source, time), time).status, 'current');
  const old = {...source, reviewedAt: proof.previousReviewedAt};
  assert.ok(projectSourceHealth(old, rowFor(old, time), time).reasons.includes('review_due'));
});

test('changed SmPC metadata preserves the medicine catalogue and separately evidenced renewals', () => {
  assert.equal(REVIEWED_AT, '2026-09-15T21:28:30Z');
  assert.equal(sources.find(s => s.id === 'wegovy-injection-smpc').sourcePublishedAt, '2026-09-22');
  assert.equal(medicines.find(m => m.id === 'wegovy-injection').reviewedAt, undefined);
  const renewal = JSON.parse(readFileSync(new URL('./reviews/2026-09-23-product-information-renewal.json', import.meta.url)));
  for (const proof of renewal.sources) {
    assert.equal(proof.previousReviewedAt, '2026-09-16T17:44:34Z');
    assert.equal(sources.find(s => s.id === proof.id).reviewedAt, proof.reviewedAt);
    assert.ok(!receipt.sources.some(s => s.id === proof.id));
  }
  assert.equal(sources.find(s => s.id === 'wegovy-tablet-private').reviewedAt, JSON.parse(readFileSync(new URL('./reviews/2026-09-27-wegovy-tablet-provider.json', import.meta.url))).reviewedAt);
  assert.equal(sources.find(s => s.id === 'mounjaro-nhs').reviewedAt, nhsReceipt.reviewedAt);
});
