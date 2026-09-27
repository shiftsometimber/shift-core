import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { observationInsert } from './observations.mjs';

const migration = readFileSync(new URL('./migration.sql', import.meta.url), 'utf8');
const existing = {
  source_id: 'source-under-review',
  source_url: 'https://www.gov.uk/government/news/example',
  check_url: 'https://www.gov.uk/api/content/government/news/example',
  last_attempt_at: '2026-09-15T20:00:00.000Z',
  last_success_at: '2026-09-15T20:00:00.000Z',
  last_failure_at: '2026-09-14T18:00:00.000Z',
  attempt_status: 'succeeded',
  next_check_at: '2026-09-15T21:00:00.000Z',
  last_http_status: 200,
  last_error: null,
  last_fingerprint: 'c'.repeat(64),
  last_withdrawn: 1
};
const failedBootstrap = {
  ...existing,
  last_attempt_at: '2026-09-15T21:00:00.000Z',
  last_success_at: null,
  last_failure_at: '2026-09-15T21:00:00.000Z',
  attempt_status: 'failed',
  next_check_at: '2026-09-15T22:00:00.000Z',
  last_http_status: 403,
  last_error: 'http_403',
  last_fingerprint: null,
  last_withdrawn: 0
};

function setup(t) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(migration);
  t.after(() => sqlite.close());
  return sqlite;
}
const read = sqlite => ({ ...sqlite.prepare('SELECT * FROM medicines_watch_checks').get() });

test('failed same-URL CI bootstrap preserves every field of changed and withdrawn source observations', t => {
  for (const last_withdrawn of [0, 1]) {
    const sqlite = setup(t), before = { ...existing, last_withdrawn };
    sqlite.exec(observationInsert(before));
    sqlite.exec(observationInsert(failedBootstrap));
    assert.deepEqual(read(sqlite), before);
  }
});

test('successful same-URL bootstrap also cannot replace scheduler-owned evidence', t => {
  const sqlite = setup(t);
  sqlite.exec(observationInsert(existing));
  sqlite.exec(observationInsert({ ...failedBootstrap, attempt_status: 'succeeded',
    last_success_at: failedBootstrap.last_attempt_at, last_http_status: 200,
    last_error: null, last_fingerprint: 'a'.repeat(64) }));
  assert.deepEqual(read(sqlite), existing);
});

test('changing either source URL replaces old observations instead of borrowing their success', t => {
  for (const field of ['source_url', 'check_url']) {
    const sqlite = setup(t), replacement = { ...failedBootstrap,
      [field]: failedBootstrap[field] + '-replacement' };
    sqlite.exec(observationInsert(existing));
    sqlite.exec(observationInsert(replacement));
    assert.deepEqual(read(sqlite), replacement);
    assert.equal(read(sqlite).last_success_at, null);
    assert.equal(read(sqlite).last_fingerprint, null);
  }
});

test('missing sources insert their actual bootstrap result, including nulls and quoted text', t => {
  const sqlite = setup(t), newSource = { ...failedBootstrap,
    source_id: "provider's-source", last_error: "provider's check failed" };
  sqlite.exec(observationInsert(newSource));
  assert.deepEqual(read(sqlite), newSource);
  assert.equal(sqlite.prepare('SELECT count(*) AS count FROM medicines_watch_checks').get().count, 1);
});
