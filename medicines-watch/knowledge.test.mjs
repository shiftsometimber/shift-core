import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const WATCH = new URL('./', import.meta.url);
const { matchingWatchMedicines, retrieveWatchKnowledge } = await import(new URL('knowledge.mjs', WATCH));
const { medicines, sources, REVIEWED_AT } = await import(new URL('data.mjs', WATCH));
const { CHECK_INTERVAL_MS, REVIEW_INTERVAL_MS } = await import(new URL('monitor.mjs', WATCH));
const NOW = Math.max(Date.parse(REVIEWED_AT), ...sources.map(source => Date.parse(source.reviewedAt))) + 30 * 60 * 1000;
const iso = n => new Date(n).toISOString();
const ids = items => items.map(item => item.id).sort();
const available = items => items.filter(item => item.reviewState !== 'unavailable');
const text = items => items.map(item => item.content || '').join('\n');
const medicine = id => medicines.find(item => item.id === id);
const source = id => sources.find(item => item.id === id);

class ReadOnlyD1 {
  constructor(sqlite) { this.sqlite = sqlite; this.commands = []; }
  prepare(sql) {
    this.commands.push(sql);
    assert.match(sql.trim(), /^SELECT\b/i, 'retrieval must remain SELECT-only');
    const statement = this.sqlite.prepare(sql);
    let args = [];
    const wrapper = {
      bind: (...values) => { args = values; return wrapper; },
      all: async () => ({ results: statement.all(...args) }),
      first: async () => statement.get(...args) || null,
      run: async () => { throw new Error('A reader attempted a database write'); },
    };
    return wrapper;
  }
  async exec(sql) {
    this.commands.push(sql);
    throw new Error('A reader attempted schema initialisation or a write');
  }
}

function setup(t, { schema = true, seed = true, checkedAt = NOW } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  if (schema) sqlite.exec(readFileSync(new URL('migration.sql', WATCH), 'utf8'));
  if (schema && seed) {
    const insert = sqlite.prepare(`INSERT INTO medicines_watch_checks
      (source_id,source_url,check_url,last_attempt_at,last_success_at,attempt_status,
       next_check_at,last_http_status,last_fingerprint,last_withdrawn)
      VALUES (?,?,?,?,?,'succeeded',?,200,?,0)`);
    for (const item of sources) insert.run(item.id, item.url, item.checkUrl || item.url,
      iso(checkedAt), iso(checkedAt), iso(checkedAt + CHECK_INTERVAL_MS), item.reviewedFingerprint || null);
  }
  const DB = new ReadOnlyD1(sqlite);
  t.after(() => assert.ok(DB.commands.every(sql => /^SELECT\b/i.test(sql.trim())),
    'No scan, schema mutation or write may occur during knowledge retrieval'));
  return { DB, sqlite };
}

async function retrieve(DB, query, now = NOW, options = {}) {
  const items = await retrieveWatchKnowledge(DB, query, { ...options, now });
  assert.ok(Array.isArray(items));
  for (const item of items) {
    assert.equal(item.sourceWorld, 'medicines_watch');
    assert.ok(item.medicineId);
    assert.ok(Array.isArray(item.sourceIds));
    assert.ok(Array.isArray(item.provenance));
  }
  return items;
}

function assertStatusOnly(items, id) {
  assert.ok(items.length > 0, 'matched medicines must explain unavailable reviewed evidence');
  assert.ok(items.every(item => item.reviewState === 'unavailable'));
  const entry = medicine(id), body = text(items);
  const claims = [entry.authorisation, entry.mechanism, entry.benefit,
    entry.access.private, entry.access.nhsEngland, ...entry.tradeoffs];
  for (const claim of claims.filter(Boolean)) assert.ok(!body.includes(claim),
    'status-only context must not repeat a substantive medicine claim: ' + claim);
}

test('medicine matching distinguishes oral semaglutide, generic Wegovy and unrelated questions', () => {
  assert.deepEqual(ids(matchingWatchMedicines('Tell me about oral semaglutide')), ['wegovy-tablet']);
  assert.deepEqual(ids(matchingWatchMedicines('What is the position on Wegovy?')), ['wegovy-injection', 'wegovy-tablet']);
  assert.deepEqual(ids(matchingWatchMedicines('Is orforglipron authorised?')), ['foundayo']);
  assert.deepEqual(matchingWatchMedicines('Can you help plan a chicken dinner?'), []);
});

test('unchanged reviewed MHRA evidence admits Foundayo authorisation without blessing its entire card', async t => {
  const { DB } = setup(t), items = await retrieve(DB, 'Foundayo UK authorisation');
  const facts = available(items);
  assert.ok(facts.some(item => item.sourceIds.includes('foundayo-mhra')));
  assert.ok(text(facts).includes(medicine('foundayo').authorisation));
  assert.ok(facts.every(item => !item.sourceIds.includes('foundayo-smpc')),
    'unverified product information cannot inherit MHRA freshness');
});

test('grounding cites exact authority links and retains separate editorial and successful-check dates', async t => {
  const { DB } = setup(t);
  const items = available(await retrieve(DB, 'Foundayo UK authorisation', NOW + 10 * 60 * 1000));
  const fact = items.find(item => item.sourceIds.includes('foundayo-mhra'));
  assert.ok(fact);
  const proof = fact.provenance.find(item => item.ref === source('foundayo-mhra').url);
  assert.ok(proof, 'citation must link the official evidence, not the internal JSON API');
  assert.equal(proof.reviewedAt, source('foundayo-mhra').reviewedAt);
  assert.equal(proof.checkedAt, iso(NOW));
  assert.notEqual(proof.checkedAt, iso(NOW + 10 * 60 * 1000), 'reading is not a source check');
});

test('a failed trial-source check suppresses trial evidence while unchanged MHRA evidence survives', async t => {
  const { DB, sqlite } = setup(t);
  sqlite.prepare(`UPDATE medicines_watch_checks SET attempt_status='failed',last_failure_at=?,last_error='http_403',last_http_status=403 WHERE source_id='retatrutide-lilly'`).run(iso(NOW));
  const items = await retrieve(DB, 'Retatrutide UK authorisation and trials');
  const facts = available(items);
  assert.ok(facts.some(item => item.sourceIds.includes('retatrutide-mhra')));
  assert.ok(facts.every(item => !item.sourceIds.includes('retatrutide-lilly')));
  assert.ok(items.some(item => item.reviewState === 'unavailable'));
});

test('a missing monitor table fails closed and is not silently created', async t => {
  const { DB, sqlite } = setup(t, { schema: false });
  assertStatusOnly(await retrieve(DB, 'Foundayo'), 'foundayo');
  assert.equal(sqlite.prepare("SELECT count(*) count FROM sqlite_master WHERE type='table'").get().count, 0);
});

test('an absent database returns status-only evidence for a matched medicine', async () => {
  assertStatusOnly(await retrieve(undefined, 'Retatrutide'), 'retatrutide');
});

test('a changed MHRA fingerprint suppresses authorisation instead of reapproving the new body', async t => {
  const { DB, sqlite } = setup(t);
  sqlite.prepare("UPDATE medicines_watch_checks SET last_fingerprint=? WHERE source_id='foundayo-mhra'").run('0'.repeat(64));
  const items = await retrieve(DB, 'Foundayo UK authorisation');
  const facts = available(items);
  assert.ok(facts.every(item => !item.sourceIds.includes('foundayo-mhra')));
  assert.ok(!text(items).includes(medicine('foundayo').authorisation));
  assert.ok(items.some(item => item.reviewState === 'unavailable'));
});

test('withdrawn required sources yield status-only evidence', async t => {
  const { DB, sqlite } = setup(t);
  sqlite.prepare("UPDATE medicines_watch_checks SET last_withdrawn=1 WHERE source_id IN ('retatrutide-mhra','retatrutide-lilly')").run();
  assertStatusOnly(await retrieve(DB, 'Retatrutide'), 'retatrutide');
});

test('fresh successful checks cannot renew an expired seven-day editorial review', async t => {
  const later = NOW + REVIEW_INTERVAL_MS + 1;
  const { DB } = setup(t, { checkedAt: later });
  assertStatusOnly(await retrieve(DB, 'Foundayo', later), 'foundayo');
});

test('overdue checks suppress evidence even though the stored fingerprints still match', async t => {
  const { DB } = setup(t, { checkedAt: NOW - CHECK_INTERVAL_MS - 16 * 60 * 1000 });
  assertStatusOnly(await retrieve(DB, 'Retatrutide'), 'retatrutide');
});

test('successful observation without an approved baseline never admits product-information claims', async t => {
  const { DB, sqlite } = setup(t);
  const unreviewedSources = sources.map(item => item.id === 'wegovy-injection-smpc'
    ? { ...item, reviewedFingerprint: undefined } : item);
  sqlite.prepare("UPDATE medicines_watch_checks SET last_fingerprint=? WHERE source_id='wegovy-injection-smpc'").run('a'.repeat(64));
  const facts = available(await retrieve(DB, 'Wegovy injection', NOW, { sources: unreviewedSources }));
  assert.ok(facts.every(item => !item.sourceIds.includes('wegovy-injection-smpc')));
  assert.ok(!text(facts).includes(medicine('wegovy-injection').authorisation));
});

test('reviewed product evidence admits its supported claim but a failed later retrieval suppresses it', async t => {
  const { DB, sqlite } = setup(t);
  assert.ok(source('wegovy-injection-smpc').reviewedFingerprint);
  const current = available(await retrieve(DB, 'Wegovy injection'));
  assert.ok(text(current).includes(medicine('wegovy-injection').authorisation));
  sqlite.prepare("UPDATE medicines_watch_checks SET attempt_status='failed',last_error='http_403',last_http_status=403 WHERE source_id='wegovy-injection-smpc'").run();
  const delayed = available(await retrieve(DB, 'Wegovy injection'));
  assert.ok(!text(delayed).includes(medicine('wegovy-injection').authorisation));
});

test('Foundayo unmonitored launch PDF and its private-availability claim never enter grounded evidence', async t => {
  const { DB } = setup(t), items = await retrieve(DB, 'Foundayo availability');
  const body = text(items), serialised = JSON.stringify(items);
  assert.ok(!body.includes(medicine('foundayo').access.private));
  for (const evidence of medicine('foundayo').evidenceLinks || []) assert.ok(!serialised.includes(evidence.url));
});
