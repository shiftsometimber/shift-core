import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const entry = readFileSync(new URL('../worker-entry-v6.js', import.meta.url), 'utf8');
const start = entry.indexOf('  async scheduled(controller, env, ctx) {');
const end = entry.indexOf('\n  },\n};', start);
const scheduled = entry.slice(start, end);

test('Medicines Watch runs before shared scheduled jobs', () => {
  assert.ok(start >= 0 && end > start, 'scheduled handler must remain discoverable');
  const watch = scheduled.indexOf('await checkSources(env)');
  const shared = scheduled.indexOf('Promise.allSettled([');
  assert.ok(watch >= 0, 'scheduled handler must invoke the Watch');
  assert.ok(shared > watch, 'Watch must complete before D1-heavy sibling jobs begin');
  assert.equal((scheduled.match(/checkSources\(env\)/g) || []).length, 1);
});

test('scheduled sibling failures are isolated and named', () => {
  assert.match(scheduled, /status: "rejected"/);
  for (const name of ['intelligence', 'radar', 'knowledge', 'fit-reminders']) {
    assert.ok(scheduled.includes('"' + name + '"'), name);
  }
  assert.doesNotMatch(scheduled, /Promise\.all\(\[/);
});
