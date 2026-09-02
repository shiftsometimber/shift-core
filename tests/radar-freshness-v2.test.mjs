import test from 'node:test';
import assert from 'node:assert/strict';
import { radarFreshnessState } from '../radar-freshness-v2.js';

const now = Date.parse('2026-09-02T20:00:00Z');

test('never-published Radar is RED even after a current successful scan', () => {
  const state = radarFreshnessState({
    lastScan: '2026-09-02T19:30:00Z',
    lastEvent: null,
    lastPublication: null,
    lastTickerItem: null,
    failures: 0
  }, now);
  assert.equal(state.status, 'RED');
  assert.equal(state.current, false);
  assert.deepEqual(state.reasons.map(reason => reason.code), [
    'publication_never_completed',
    'ticker_never_published'
  ]);
});

test('current scan, publication and ticker may be GREEN during a quiet feed', () => {
  const state = radarFreshnessState({
    lastScan: '2026-09-02T19:30:00Z',
    lastEvent: null,
    lastPublication: '2026-09-02T18:00:00Z',
    lastTickerItem: '2026-09-02T18:00:00Z',
    failures: 0
  }, now);
  assert.equal(state.status, 'GREEN');
  assert.equal(state.current, true);
  assert.deepEqual(state.reasons, []);
});
