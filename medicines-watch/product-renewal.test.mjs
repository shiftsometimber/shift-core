import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sources, medicines, REVIEWED_AT} from './data.mjs';
import {projectSourceHealth, REVIEW_INTERVAL_MS} from './monitor.mjs';

const receipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-23-product-information-renewal.json', import.meta.url)));
const ids = ['mounjaro-smpc', 'wegovy-tablet-smpc', 'orlistat-120-smpc', 'orlistat-60-smpc', 'foundayo-smpc'];
const time = Date.parse(receipt.reviewedAt);
const observation = (source, now = time) => ({
  source_url: source.url, check_url: source.checkUrl,
  last_attempt_at: new Date(now).toISOString(), last_success_at: new Date(now).toISOString(),
  attempt_status: 'succeeded', last_http_status: 200,
  last_fingerprint: source.reviewedFingerprint, last_withdrawn: 0,
});

test('five expired product reviews have complete response receipts and unchanged fingerprints', () => {
  assert.deepEqual(receipt.sources.map(s => s.id).sort(), [...ids].sort());
  assert.equal(receipt.reviewType, 'AI-assisted factual source review; not clinical approval');
  for (const proof of receipt.sources) {
    const source = sources.find(s => s.id === proof.id);
    for (const key of ['url', 'checkUrl', 'reviewedAt', 'reviewedFingerprint', 'sourcePublishedAt']) {
      assert.equal(source[key], proof[key]);
    }
    assert.equal(proof.previousReviewedFingerprint, proof.reviewedFingerprint);
    assert.equal(proof.previousReviewedAt, '2026-09-16T17:44:34Z');
    assert.ok(Date.parse(proof.retrievedAt) <= time);
    assert.ok(time > Date.parse(proof.previousReviewedAt) + REVIEW_INTERVAL_MS);
    assert.equal(proof.httpStatus, 200);
    assert.ok(proof.bytes > 1000 && proof.bytes <= 2 * 1024 * 1024);
    assert.match(proof.responseSha256, /^[a-f0-9]{64}$/);
    assert.equal(proof.withdrawn, false);
    assert.equal(proof.wordingChanged, false);
    assert.ok(proof.assessment.length > 150);
    assert.equal(projectSourceHealth(source, observation(source), time).status, 'current');
  }
});

test('HTTP success does not cure expiry, changed evidence, withdrawal or failure', () => {
  for (const id of ids) {
    const source = sources.find(s => s.id === id);
    const old = {...source, reviewedAt: '2026-09-16T17:44:34Z'};
    assert.ok(projectSourceHealth(old, observation(old), time).reasons.includes('review_due'));
    const expired = time + REVIEW_INTERVAL_MS + 1;
    assert.ok(projectSourceHealth(source, observation(source, expired), expired).reasons.includes('review_due'));
    assert.ok(projectSourceHealth(source, {...observation(source), last_fingerprint: 'f'.repeat(64)}, time).reasons.includes('source_changed'));
    assert.ok(projectSourceHealth(source, {...observation(source), last_withdrawn: 1}, time).reasons.includes('source_withdrawn'));
    assert.notEqual(projectSourceHealth(source, {...observation(source), attempt_status: 'failed', last_http_status: 403}, time).status, 'current');
  }
});

test('renewal does not renew the catalogue, medicine claims, NHS or provider reviews', () => {
  assert.equal(REVIEWED_AT, '2026-09-15T21:28:30Z');
  assert.equal(medicines.find(m => m.id === 'mounjaro').reviewedAt, '2026-09-17T05:45:00Z');
  assert.ok(medicines.filter(m => m.id !== 'mounjaro').every(m => m.reviewedAt === undefined));
  assert.equal(sources.find(s => s.id === 'mounjaro-nhs').reviewedAt, '2026-09-17T05:45:00Z');
  assert.equal(sources.find(s => s.id === 'wegovy-tablet-private').reviewedAt, '2026-09-18T16:36:50Z');
  assert.equal(sources.find(s => s.id === 'wegovy-injection-smpc').reviewedAt, '2026-09-23T15:45:00Z');
});
