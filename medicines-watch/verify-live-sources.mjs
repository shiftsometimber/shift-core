import assert from 'node:assert/strict';

export function verifyLiveSourceReviews(observed, expected) {
  assert.equal(observed.length, expected.length, 'Every configured source must appear');
  const byId = new Map(expected.map(source => [source.id, source]));
  const seen = new Set();
  for (const source of observed) {
    assert.ok(byId.has(source.id), 'Unexpected source: ' + source.id);
    assert.ok(!seen.has(source.id), 'Duplicate source: ' + source.id);
    seen.add(source.id);
    assert.equal(source.reviewedAt, byId.get(source.id).reviewedAt, source.id + ' must retain its exact recorded review date');
    assert.ok(source.lastAttemptAt, source.id + ' has been attempted');
    assert.ok(['current', 'verification_pending', 'check_delayed', 'awaiting_review'].includes(source.status), source.id + ' has a known evidence status');
  }
}
