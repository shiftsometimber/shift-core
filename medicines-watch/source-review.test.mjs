import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sources, medicines, REVIEWED_AT} from './data.mjs';
import {projectSourceHealth, REVIEW_INTERVAL_MS} from './monitor.mjs';

const receipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-23-source-review.json', import.meta.url)));
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
    assert.equal(source.url, proof.url);
    assert.equal(source.checkUrl, proof.checkUrl);
    assert.equal(source.reviewedAt, proof.reviewedAt);
    assert.equal(source.reviewedFingerprint, proof.reviewedFingerprint);
    assert.equal(source.sourcePublishedAt, proof.sourcePublishedAt);
    assert.equal(proof.httpStatus, 200);
    assert.ok(proof.bytes > 0 && proof.bytes <= 2 * 1024 * 1024);
    assert.match(proof.responseSha256, /^[a-f0-9]{64}$/);
    assert.equal(proof.withdrawn, false);
    assert.equal(proof.wordingChanged, false);
    assert.ok(proof.assessment.length > 100);
    assert.equal(projectSourceHealth(source, rowFor(source), reviewTime).status, 'current');
  }
});

test('review expiry, changed content and failures still fail closed', () => {
  for (const proof of receipt.sources) {
    const source = sources.find(s => s.id === proof.id);
    const expired = reviewTime + REVIEW_INTERVAL_MS + 1;
    assert.ok(projectSourceHealth(source, rowFor(source, expired), expired).reasons.includes('review_due'));
    assert.ok(projectSourceHealth(source, {...rowFor(source), last_fingerprint: 'f'.repeat(64)}, reviewTime).reasons.includes('source_changed'));
    assert.notEqual(projectSourceHealth(source, {...rowFor(source), attempt_status: 'failed', last_http_status: 403}, reviewTime).status, 'current');
    assert.ok(projectSourceHealth(source, {...rowFor(source), last_withdrawn: 1}, reviewTime).reasons.includes('source_withdrawn'));
  }
});

test('changed SmPC metadata does not renew unrelated sources or the medicine catalogue', () => {
  assert.equal(REVIEWED_AT, '2026-09-15T21:28:30Z');
  assert.equal(sources.find(s => s.id === 'wegovy-injection-smpc').sourcePublishedAt, '2026-09-22');
  assert.equal(medicines.find(m => m.id === 'wegovy-injection').reviewedAt, undefined);
  for (const id of ['mounjaro-smpc', 'wegovy-tablet-smpc', 'orlistat-120-smpc', 'orlistat-60-smpc', 'foundayo-smpc']) {
    assert.equal(sources.find(s => s.id === id).reviewedAt, '2026-09-16T17:44:34Z');
  }
  assert.equal(sources.find(s => s.id === 'wegovy-tablet-private').reviewedAt, '2026-09-18T16:36:50Z');
  assert.equal(sources.find(s => s.id === 'mounjaro-nhs').reviewedAt, '2026-09-17T05:45:00Z');
});
