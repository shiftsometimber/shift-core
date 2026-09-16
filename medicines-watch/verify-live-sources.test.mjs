import assert from 'node:assert/strict';
import test from 'node:test';
import {sources, REVIEWED_AT} from './data.mjs';
import {verifyLiveSourceReviews} from './verify-live-sources.mjs';

const observation = () => sources.map(({id, reviewedAt}) => ({id, reviewedAt, lastAttemptAt: '2026-09-16T18:00:00Z', status: 'verification_pending'}));

test('live verification accepts separately reviewed sources without advancing other dates', () => {
  const observed = observation();
  assert.equal(observed.filter(source => source.reviewedAt !== REVIEWED_AT).length, 6);
  verifyLiveSourceReviews(observed, sources);
});

test('live verification rejects an old global date or an invented fresh date', () => {
  const stale = observation();
  stale.find(source => source.id === 'mounjaro-smpc').reviewedAt = REVIEWED_AT;
  assert.throws(() => verifyLiveSourceReviews(stale, sources), /exact recorded review date/);
  const unreviewed = observation();
  unreviewed.find(source => source.id === 'mounjaro-nhs').reviewedAt = '2026-09-16T17:44:34Z';
  assert.throws(() => verifyLiveSourceReviews(unreviewed, sources), /exact recorded review date/);
});

test('source replacement or duplication cannot satisfy the live source count', () => {
  const duplicate = observation();
  duplicate[1] = {...duplicate[0]};
  assert.throws(() => verifyLiveSourceReviews(duplicate, sources), /Duplicate source/);
  const unknown = observation();
  unknown[0].id = 'unknown';
  assert.throws(() => verifyLiveSourceReviews(unknown, sources), /Unexpected source/);
});
