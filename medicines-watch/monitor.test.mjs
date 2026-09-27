import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { checkSources, readWatchHealth, fingerprintSource, projectSourceHealth,
  CHECK_INTERVAL_MS, REVIEW_INTERVAL_MS } from './monitor.mjs';

const NOW = Date.parse('2026-09-15T22:00:00Z');
const source = {
  id: 'test-mhra', url: 'https://www.gov.uk/government/news/test',
  checkUrl: 'https://www.gov.uk/api/content/government/news/test', format: 'govuk-json',
  reviewedAt: new Date(NOW - CHECK_INTERVAL_MS).toISOString(), requiredTerms: ['Example medicine', 'authorised']
};
const document = {
  title: 'Example medicine authorised', description: 'A source description.',
  details: { body: '<p>Example medicine is authorised for its specific indication.</p>' },
  public_updated_at: '2026-09-15T10:00:00Z', withdrawn_notice: null
};
const body = data => JSON.stringify(data ?? document);
const response = (data = document) => new Response(body(data), { headers: { 'content-type': 'application/json' } });

class D1 {
  constructor() { this.db = new DatabaseSync(':memory:'); this.commands = []; }
  async exec(sql) { this.commands.push(sql); this.db.exec(sql); }
  prepare(sql) {
    this.commands.push(sql);
    const statement = this.db.prepare(sql), params = [];
    const wrapper = {
      bind: (...values) => { params.push(...values); return wrapper; },
      run: async () => ({ meta: { changes: Number(statement.run(...params).changes) } }),
      all: async () => ({ results: statement.all(...params) })
    };
    return wrapper;
  }
}
function setup(t) {
  const DB = new D1();
  t.after(() => DB.db.close());
  return { DB };
}
async function approvedSource() {
  return { ...source, reviewedFingerprint: (await fingerprintSource(source, body(), 'application/json')).fingerprint };
}
async function scan(env, sourceToUse = source, extra = {}) {
  return checkSources(env, { sources: [sourceToUse], now: NOW, fetchImpl: async () => response(), ...extra });
}
async function health(env, sourceToUse = source, extra = {}) {
  return readWatchHealth(env, { sources: [sourceToUse], medicines: [{ id: 'example', sourceIds: [sourceToUse.id] }], now: NOW, ...extra });
}

test('GET health is SELECT-only, including a missing migration, and cannot claim checked', async t => {
  const env = setup(t);
  const state = await health(env);
  assert.equal(state.available, false);
  assert.equal(state.status, 'verification_pending');
  assert.equal(state.checkedAt, null);
  assert.deepEqual(env.DB.commands, ['SELECT * FROM medicines_watch_checks']);
  assert.equal(env.DB.db.prepare("SELECT count(*) AS count FROM sqlite_master WHERE type='table'").get().count, 0);
});

test('scheduled schema initialization respects D1 newline-separated exec semantics', async t => {
  for (const alreadyMigrated of [false, true]) {
    const env = setup(t);
    // Wrangler's file migration accepts full SQL; D1's Worker exec binding
    // sends each newline-delimited line as a separate statement.
    if (alreadyMigrated) env.DB.db.exec(readFileSync(new URL('./migration.sql', import.meta.url), 'utf8'));
    env.DB.exec = async sql => {
      env.DB.commands.push(sql);
      for (const statement of sql.trim().split('\n')) env.DB.db.prepare(statement).run();
    };
    let fetches = 0;
    const result = await scan(env, source, { fetchImpl: async () => { fetches++; return response(); } });
    assert.equal(result.checked, 1, `alreadyMigrated=${alreadyMigrated}`);
    assert.equal(fetches, 1);
    const state = await health(env);
    assert.equal(state.sources[0].checkStatus, 'current');
    assert.equal(state.sources[0].reviewStatus, 'verification_pending');
    assert.equal(state.sources[0].reviewedAt, source.reviewedAt);
  }
});

test('source retrieval uses a redirect mode supported by the Workers runtime', async t => {
  const env = setup(t);
  let fetches = 0;
  const result = await scan(env, source, { fetchImpl: async (url, init) => {
    // workerd rejects unsupported modes before contacting the source.
    if (!['follow', 'manual'].includes(init.redirect)) throw new TypeError('Invalid redirect value');
    fetches++;
    return response();
  } });
  assert.equal(result.checked, 1);
  assert.equal(result.failed, 0);
  assert.equal(fetches, 1);
  const state = await health(env);
  assert.equal(state.sources[0].checkStatus, 'current');
  assert.equal(state.sources[0].reviewStatus, 'verification_pending');
  assert.equal(state.sources[0].reviewedAt, source.reviewedAt);
});

test('source redirects are rejected without following or renewing successful evidence', async t => {
  for (const status of [301, 302, 303, 307, 308]) {
    const env = setup(t), approved = await approvedSource();
    await scan(env, approved);
    const previousFingerprint = env.DB.db.prepare('SELECT last_fingerprint FROM medicines_watch_checks').get().last_fingerprint;
    let fetches = 0, followed = 0;
    const result = await scan(env, approved, { now: NOW + CHECK_INTERVAL_MS,
      fetchImpl: async (url, init) => {
        if (!['follow', 'manual'].includes(init.redirect)) throw new TypeError('Invalid redirect value');
        fetches++;
        if (url !== source.checkUrl || init.redirect === 'follow') {
          followed++;
          return response();
        }
        return new Response(null, { status, headers: { Location: 'https://unreviewed.example/replacement' } });
      }
    });
    assert.equal(result.checked, 0, `status=${status}`);
    assert.equal(result.failed, 1);
    assert.equal(fetches, 1);
    assert.equal(followed, 0);
    const state = await health(env, approved, { now: NOW + CHECK_INTERVAL_MS });
    assert.equal(state.sources[0].error, `http_${status}`);
    assert.equal(state.sources[0].httpStatus, status);
    assert.equal(state.sources[0].checkStatus, 'check_delayed');
    assert.equal(state.sources[0].lastSuccessAt, new Date(NOW).toISOString());
    assert.equal(state.sources[0].reviewedAt, approved.reviewedAt);
    assert.equal(approved.reviewedFingerprint, previousFingerprint);
    assert.equal(env.DB.db.prepare('SELECT last_fingerprint FROM medicines_watch_checks').get().last_fingerprint, previousFingerprint);
  }
});

test('successful first fingerprint stays verification pending and never approves a source', async t => {
  const env = setup(t);
  assert.equal((await scan(env)).checked, 1);
  const state = await health(env);
  assert.equal(state.sources[0].checkStatus, 'current');
  assert.equal(state.sources[0].status, 'verification_pending');
  assert.equal(state.sources[0].reviewedAt, source.reviewedAt);
  assert.equal(state.medicines[0].status, 'verification_pending');
  assert.ok(env.DB.db.prepare('SELECT last_fingerprint FROM medicines_watch_checks').get().last_fingerprint);
  const columns = env.DB.db.prepare('PRAGMA table_info(medicines_watch_checks)').all().map(row => row.name);
  assert.ok(!columns.includes('reviewed_at'));
});

test('unchanged approved source refreshes retrieval only; review expires after seven days', async t => {
  const env = setup(t), approved = await approvedSource();
  await scan(env, approved);
  assert.equal((await health(env, approved)).status, 'current');
  await scan(env, approved, { now: NOW + REVIEW_INTERVAL_MS });
  const state = await health(env, approved, { now: NOW + REVIEW_INTERVAL_MS });
  assert.equal(state.sources[0].reviewedAt, source.reviewedAt);
  assert.equal(state.sources[0].lastSuccessAt, new Date(NOW + REVIEW_INTERVAL_MS).toISOString());
  assert.equal(state.sources[0].status, 'awaiting_review');
  assert.ok(state.sources[0].reasons.includes('review_due'));
});

test('changed medical text is awaiting review without overwriting editorial approval', async t => {
  const env = setup(t), approved = await approvedSource();
  await scan(env, approved, { fetchImpl: async () => response({ ...document,
    details: { body: '<p>Example medicine is authorised for a materially different indication.</p>' } }) });
  const state = await health(env, approved);
  assert.equal(state.status, 'awaiting_review');
  assert.deepEqual(state.sources[0].reasons, ['source_changed']);
  assert.equal(approved.reviewedFingerprint, (await approvedSource()).reviewedFingerprint);
});

test('a withdrawal is flagged even without a reviewed fingerprint', async t => {
  const env = setup(t);
  await scan(env, source, { fetchImpl: async () => response({ ...document,
    withdrawn_notice: { explanation: '<p>This publication has been withdrawn.</p>', withdrawn_at: '2026-09-15T21:00:00Z' } }) });
  const state = await health(env);
  assert.equal(state.status, 'awaiting_review');
  assert.ok(state.sources[0].reasons.includes('source_withdrawn'));
});

test('failed fetch keeps last successful observation and separate latest failure time', async t => {
  const env = setup(t), approved = await approvedSource();
  await scan(env, approved);
  const later = NOW + CHECK_INTERVAL_MS;
  await scan(env, approved, { now: later, fetchImpl: async () => new Response('Forbidden', { status: 403 }) });
  let state = await health(env, approved, { now: later });
  assert.equal(state.status, 'check_delayed');
  assert.equal(state.sources[0].lastSuccessAt, new Date(NOW).toISOString());
  assert.equal(state.sources[0].lastFailureAt, new Date(later).toISOString());
  assert.equal(state.sources[0].error, 'http_403');
  await scan(env, approved, { now: later + CHECK_INTERVAL_MS });
  state = await health(env, approved, { now: later + CHECK_INTERVAL_MS });
  assert.equal(state.status, 'current');
  assert.equal(state.sources[0].lastFailureAt, new Date(later).toISOString());
  assert.equal(state.sources[0].error, null);
});

test('malformed JSON, empty 202, wrong MIME and wrong identity cannot pass as fresh', async t => {
  for (const [makeResponse, error] of [
    [() => new Response('{oops', { headers: { 'content-type': 'application/json' } }), 'invalid_json'],
    [() => new Response('', { status: 202 }), 'http_202'],
    [() => new Response(body(), { headers: { 'content-type': 'text/html' } }), 'unexpected_content_type'],
    [() => response({ title: 'Example medicine authorised', details: {} }), 'invalid_govuk_document'],
    [() => response({ ...document, title: 'Other news', details: { body: '<p>Something unrelated.</p>' } }), 'source_identity_not_verified']
  ]) {
    const env = setup(t);
    const result = await scan(env, source, { fetchImpl: async () => makeResponse() });
    assert.equal(result.failed, 1);
    assert.equal(result.outcomes[0].error, error);
    assert.equal((await health(env)).checkedAt, null);
  }
});

test('deadline and streamed byte cap apply before fingerprinting', async t => {
  let signal;
  const timeoutEnv = setup(t);
  const timeout = await scan(timeoutEnv, source, { timeoutMs: 15, fetchImpl: (_, options) => {
    signal = options.signal; return new Promise(() => {});
  } });
  assert.equal(timeout.outcomes[0].error, 'check_timeout');
  assert.equal(signal.aborted, true);
  const capEnv = setup(t);
  const tooLarge = await scan(capEnv, source, { maxBytes: 32 });
  assert.equal(tooLarge.outcomes[0].error, 'response_too_large');
  assert.equal((await health(capEnv)).sources[0].lastSuccessAt, null);
});

test('complete large HTML sources are checked without approving their evidence', async t => {
  const htmlSource = { ...source, format: 'html', contentSelector: '#smpc' };
  const html = '<html><title>Example medicine</title><div id="smpc">' +
    'Example medicine authorised. Important clinical limitations apply. '.repeat(19500) +
    '</div></html>';
  const size = new TextEncoder().encode(html).byteLength;
  assert.ok(size > 1024 * 1024 && size < 2 * 1024 * 1024);
  const fetchImpl = async () => new Response(html, { headers: {
    'content-type': 'text/html', 'content-length': String(size)
  } });
  const previousLimit = setup(t);
  assert.equal((await scan(previousLimit, htmlSource, { fetchImpl, maxBytes: 1024 * 1024 }))
    .outcomes[0].error, 'response_too_large');
  const env = setup(t);
  assert.equal((await scan(env, htmlSource, { fetchImpl })).checked, 1);
  const state = await health(env, htmlSource);
  assert.equal(state.sources[0].checkStatus, 'current');
  assert.equal(state.sources[0].reviewStatus, 'verification_pending');
  assert.equal(state.sources[0].reviewedAt, htmlSource.reviewedAt);
  assert.equal(htmlSource.reviewedFingerprint, undefined);
});

test('2 MiB hard ceiling rejects declared and streamed excess even with a larger option', async t => {
  for (const declared of [true, false]) {
    const env = setup(t);
    const result = await scan(env, source, { maxBytes: 10 * 1024 * 1024,
      fetchImpl: async () => new Response('x'.repeat(2 * 1024 * 1024 + 1), {
        headers: { 'content-type': 'application/json',
          ...(declared ? { 'content-length': String(2 * 1024 * 1024 + 1) } : {}) }
      }) });
    assert.equal(result.outcomes[0].error, 'response_too_large');
    assert.equal((await health(env)).sources[0].lastSuccessAt, null);
  }
});

test('hourly reservation is atomic across overlapping scheduled invocations', async t => {
  const env = setup(t);
  let calls = 0, release;
  const pending = new Promise(resolve => { release = resolve; });
  const fetchImpl = async () => { calls++; await pending; return response(); };
  const first = scan(env, source, { fetchImpl });
  const second = scan(env, source, { fetchImpl });
  await new Promise(resolve => setTimeout(resolve, 10));
  release();
  const results = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(results.reduce((sum, result) => sum + result.skipped, 0), 1);
  assert.equal((await scan(env, source, { now: NOW + CHECK_INTERVAL_MS - 1 })).skipped, 1);
  assert.equal((await scan(env, source, { now: NOW + CHECK_INTERVAL_MS })).checked, 1);
});

test('requests are bounded to three concurrent sources', async t => {
  const env = setup(t);
  let active = 0, maximum = 0;
  const result = await checkSources(env, {
    now: NOW, sources: Array.from({ length: 8 }, (_, index) => ({ ...source, id: `source-${index}` })),
    fetchImpl: async () => {
      active++; maximum = Math.max(maximum, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--; return response();
    }
  });
  assert.equal(result.checked, 8);
  assert.equal(maximum, 3);
});

test('changed source URLs invalidate historical checks and source hashes', async t => {
  const env = setup(t), approved = await approvedSource();
  await scan(env, approved);
  const replacement = { ...approved, checkUrl: 'https://www.gov.uk/api/content/government/news/replacement' };
  assert.equal((await health(env, replacement)).sources[0].lastSuccessAt, null);
  await scan(env, replacement, { fetchImpl: async () => new Response('missing', { status: 404 }) });
  assert.equal((await health(env, replacement)).sources[0].lastSuccessAt, null);
  assert.equal(env.DB.db.prepare('SELECT last_fingerprint FROM medicines_watch_checks').get().last_fingerprint, null);
});

test('GovUK fingerprint ignores page furniture and whitespace but tracks content date', async () => {
  const original = await fingerprintSource(source, body());
  const equivalent = await fingerprintSource(source, body({ ...document, links: { irrelevant: 'navigation' },
    details: { body: '<p>Example medicine is <strong>authorised</strong> for its specific indication.</p>\n<script>changingBanner()</script>' } }));
  assert.equal(equivalent.fingerprint, original.fingerprint);
  const updated = await fingerprintSource(source, body({ ...document, public_updated_at: '2026-09-15T12:00:00Z' }));
  assert.notEqual(updated.fingerprint, original.fingerprint);
});

test('HTML extraction retains nested clinical text, ignores navigation and rejects missing selectors', async () => {
  const htmlSource = { ...source, format: 'html', contentSelector: '#smpc' };
  const html = '<html><title>Example medicine</title><nav>Unstable menu</nav><div id="smpc">' +
    '<div><h2>Example medicine authorised</h2></div><div>Specific indication and important clinical limitations apply. Always read the complete product information.</div>' +
    '</div><footer>Changing cookie count 1</footer></html>';
  const original = await fingerprintSource(htmlSource, html, 'text/html');
  const same = await fingerprintSource(htmlSource, html.replace('cookie count 1', 'cookie count 999'), 'text/html');
  assert.equal(original.fingerprint, same.fingerprint);
  const changed = await fingerprintSource(htmlSource, html.replace('important clinical limitations', 'new clinical restrictions'), 'text/html');
  assert.notEqual(original.fingerprint, changed.fingerprint);
  await assert.rejects(fingerprintSource(htmlSource, '<html><main>Generic blocked page</main></html>', 'text/html'), /missing_content_selector/);
});

test('stale or interrupted scans cannot borrow a previous successful check to appear current', async () => {
  const approved = await approvedSource();
  const row = { source_id: approved.id, source_url: approved.url, check_url: approved.checkUrl,
    last_success_at: new Date(NOW).toISOString(), last_attempt_at: new Date(NOW).toISOString(),
    last_fingerprint: approved.reviewedFingerprint, last_withdrawn: 0, attempt_status: 'succeeded' };
  assert.equal(projectSourceHealth(approved, row, NOW + 76 * 60 * 1000).status, 'check_delayed');
  assert.equal(projectSourceHealth(approved, { ...row, attempt_status: 'checking' }, NOW + 9000).status, 'check_delayed');
});

test('migration and writer initialize compatible owned schemas without Radar tables', async t => {
  const env = setup(t);
  await env.DB.exec(readFileSync(new URL('./migration.sql', import.meta.url), 'utf8'));
  await scan(env);
  assert.deepEqual(env.DB.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name), ['medicines_watch_checks']);
});
