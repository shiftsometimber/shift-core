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
