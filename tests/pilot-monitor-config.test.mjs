import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../', import.meta.url));
const workflow = readFileSync(new URL('../.github/workflows/shift-ai-r4-pilot-monitor.yml', import.meta.url), 'utf8');
// Execute the actual workflow block so a parser regression cannot bypass this test.
const script = workflow.match(/node - <<'NODE'\n([\s\S]*?)\n\s+NODE\n/)[1]
  .replace(/^          /gm, '');
const source = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const productionD1 = '88f40aed-cb23-4372-8c94-8a73f48bc847';
const require = createRequire(import.meta.url);
const wranglerModuleRoot = dirname(dirname(require.resolve('wrangler/package.json')));

function generate(configSource = source, databaseId = productionD1) {
  const dir = mkdtempSync(join(tmpdir(), 'shift-pilot-monitor-'));
  const output = join(dir, 'monitor.generated.jsonc');
  writeFileSync(join(dir, 'wrangler.jsonc'), configSource);
  try {
    const result = spawnSync(process.execPath, ['-'], {
      cwd: dir,
      input: script,
      encoding: 'utf8',
      timeout: 15000,
      // No API credentials or remote commands are needed to parse a local file.
      env: {
        PATH: dirname(process.execPath),
        NODE_PATH: wranglerModuleRoot,
        PRODUCTION_CONFIG: output,
        PRODUCTION_D1_ID: databaseId,
        WRANGLER_SEND_METRICS: 'false',
        NO_COLOR: '1',
      },
    });
    return {
      ...result,
      generated: existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : null,
      sourceAfter: readFileSync(join(dir, 'wrangler.jsonc'), 'utf8'),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('monitor parses the production JSONC and preserves config except disabled model flags', () => {
  const result = generate();
  assert.equal(result.status, 0, result.stderr);
  const expected = require('wrangler').experimental_readRawConfig({ config: join(root, 'wrangler.jsonc') }).rawConfig;
  expected.vars = { ...expected.vars, SHIFT_AI_R4_PILOT_ENABLED: 'false', SHIFT_TODAY_MODEL_ENABLED: 'false' };
  assert.deepEqual(result.generated, expected);
  assert.equal(result.sourceAfter, source);
  assert.equal(result.generated.name, 'shift-core');
  assert.equal(result.generated.d1_databases.find(db => db.binding === 'DB').database_id, productionD1);
});

test('monitor rejects a mismatched database before writing generated config', () => {
  const result = generate(source, 'nonproduction-database');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /production monitor binding mismatch/);
  assert.equal(result.generated, null);
});

test('monitor rejects a mismatched Worker before writing generated config', () => {
  const result = generate(source.replace('"name": "shift-core"', '"name": "shift-core-preview"'));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /production monitor binding mismatch/);
  assert.equal(result.generated, null);
});

test('monitor rejects malformed JSONC before writing generated config', () => {
  const result = generate(source + '\nthis is not JSONC');
  assert.notEqual(result.status, 0);
  assert.equal(result.generated, null);
});

function sqlite(sql, row, at = '2026-10-11T19:33:29.000Z', query = false) {
  const result = spawnSync('python3', ['-c', `
import json, sqlite3, sys
p=json.loads(sys.stdin.read())
db=sqlite3.connect(':memory:')
db.row_factory=sqlite3.Row
db.execute('CREATE TABLE shift_ai_pilot_control (id INTEGER PRIMARY KEY, enabled INTEGER, starts_at TEXT, ends_at TEXT, stopped_at TEXT, stop_reason TEXT, updated_at TEXT)')
db.execute('INSERT INTO shift_ai_pilot_control VALUES (?,?,?,?,?,?,?)', [1]+p['row'])
db.executescript("""
CREATE TABLE user_auth (email_verified INTEGER);
CREATE TABLE shift_ai_today_audit (created_at TEXT,user_id TEXT,event_name TEXT,outcome TEXT,proposal_id TEXT,result_json TEXT);
CREATE TABLE shift_today_choices (user_id TEXT,local_date TEXT,domain TEXT,choice_json TEXT);
CREATE TABLE shift_ai_today_proposals (id TEXT,user_id TEXT,local_date TEXT,status TEXT,confirmed_at TEXT,classification TEXT);
""")
sql=p['sql'].replace("julianday('now')", "julianday('"+p['at']+"')")
if p['query']:
 result=db.execute(sql).fetchone()
else:
 db.executescript(sql)
 result=db.execute('SELECT * FROM shift_ai_pilot_control WHERE id=1').fetchone()
print(json.dumps(dict(result)))
`], { input: JSON.stringify({ sql, row, at, query }), encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
const expirySql = workflow.match(/- name: Close only an elapsed enabled pilot[\s\S]*?--command "\n([\s\S]*?)" \| tee/)[1];
const control = (end, enabled = 1, stop = null) => [enabled, '2026-08-25T15:29:48.453Z', end, null, stop, null];

test('elapsed pilot closes at or after its actual deadline, preserving the deadline', () => {
  const deadline = '2026-09-08T15:29:48.453Z';
  for (const at of [deadline, '2026-10-11T19:33:29.000Z']) {
    const row = sqlite(expirySql, control(deadline), at);
    assert.equal(row.enabled, 0);
    assert.equal(row.ends_at, deadline);
    assert.equal(row.stop_reason, 'AUTOMATED_MONITOR_PILOT_EXPIRED');
    assert.ok(row.stopped_at);
  }
});

test('unexpired and concurrently extended windows remain untouched', () => {
  for (const end of ['2026-10-11T19:33:29.001Z', '2026-11-11T19:33:29.000Z']) {
    const row = sqlite(expirySql, control(end));
    assert.equal(row.enabled, 1);
    assert.equal(row.stop_reason, null);
    assert.equal(row.stopped_at, null);
  }
});

test('disabled controls retain their original stop reason and cannot be reactivated', () => {
  const row = sqlite(expirySql, control('2026-09-08T15:29:48.453Z', 0, 'OPERATOR_STOP'));
  assert.equal(row.enabled, 0);
  assert.equal(row.stop_reason, 'OPERATOR_STOP');
});

test('expiry stop is idempotent and retains the first stop timestamp', () => {
  const first = sqlite(expirySql, control('2026-09-08T15:29:48.453Z'));
  const again = sqlite(expirySql, [first.enabled,first.starts_at,first.ends_at,first.stopped_at,first.stop_reason,first.updated_at]);
  assert.deepEqual(again, first);
});

test('expiry repair is control-row-only and keeps the existing hard-stop path', () => {
  assert.match(expirySql, /WHERE id=1 AND enabled=1/);
  assert.doesNotMatch(expirySql, /DELETE|INSERT|enabled=1,/);
  assert.equal((expirySql.match(/UPDATE /g)||[]).length, 1);
  assert.match(workflow, /AUTOMATED_MONITOR_HARD_STOP/);
  assert.match(workflow, /julianday\(c.starts_at\) IS NULL OR julianday\(c.ends_at\) IS NULL/);
  assert.match(workflow, /env\.PILOT_ENABLED != '1' && env\.EXPECTED_EXPIRY != '1'/);
  assert.match(workflow, /env\.PILOT_ENABLED == '1' && env\.WINDOW_ACTIVE == '1'/);
});

test('production mutation cannot run on a pull request or a non-main branch', () => {
  assert.match(workflow, /needs: verify/);
  assert.match(workflow, /github.event_name != 'pull_request' && github.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(workflow, /branches: \[main, codex/);
});

const aggregateSql = workflow.match(/- name: Read aggregate usage and hard-stop invariants[\s\S]*?--command "\n([\s\S]*?)" \| tee/)[1];

test('valid active, future-start and expired windows are classified from the database clock', () => {
  const now = '2026-10-11T19:33:29.000Z';
  assert.equal(sqlite(aggregateSql, control('2026-11-11T19:33:29.000Z'), now, true).window_active, 1);
  const future = [1,'2026-10-12T19:33:29.000Z','2026-11-11T19:33:29.000Z',null,null,null];
  const beforeStart = sqlite(aggregateSql, future, now, true);
  assert.equal(beforeStart.window_active, 0);
  assert.equal(beforeStart.hard_anomalies, 0);
  const expired = sqlite(aggregateSql, control(now), now, true);
  assert.equal(expired.window_active, 0);
  assert.equal(expired.hard_anomalies, 1);
});

test('malformed and reversed enabled windows remain safety failures rather than expected expiry', () => {
  for (const [start,end] of [[null,'2026-09-08T15:29:48.453Z'],['not-a-date','2026-09-08T15:29:48.453Z'],['2026-08-25T15:29:48.453Z',null],['2026-08-25T15:29:48.453Z','not-a-date'],['2026-09-09T15:29:48.453Z','2026-09-08T15:29:48.453Z']]) {
    const input = [1,start,end,null,null,null];
    const unchanged = sqlite(expirySql,input);
    assert.equal(unchanged.enabled,1);
    assert.equal(unchanged.stop_reason,null);
    const audit = sqlite(aggregateSql,input,undefined,true);
    assert.equal(audit.hard_anomalies,1);
    assert.equal(audit.expected_expiry,0);
    assert.equal(audit.window_active,0);
  }
});

test('only a valid elapsed control with the explicit expiry receipt is expected expiry', () => {
  for (const reason of ['OPERATOR_STOP','AUTOMATED_MONITOR_HARD_STOP',null]) {
    assert.equal(sqlite(aggregateSql,control('2026-09-08T15:29:48.453Z',0,reason),undefined,true).expected_expiry,0);
  }
  const closed = sqlite(expirySql,control('2026-09-08T15:29:48.453Z'));
  const audit = sqlite(aggregateSql,[closed.enabled,closed.starts_at,closed.ends_at,closed.stopped_at,closed.stop_reason,closed.updated_at],undefined,true);
  assert.equal(audit.expected_expiry,1);
  assert.equal(audit.hard_anomalies,0);
  assert.equal(audit.window_active,0);
  assert.equal(sqlite(aggregateSql,control('2026-11-11T19:33:29.000Z',0,'AUTOMATED_MONITOR_PILOT_EXPIRED'),undefined,true).expected_expiry,0);
});
