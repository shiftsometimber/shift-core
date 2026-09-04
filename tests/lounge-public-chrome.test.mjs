import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
const wrangler=fs.readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8');

test('shared public chrome script is narrowly routed through Shift Core',()=>{
  assert.match(wrangler,/shiftsometimber\.co\.uk\/site-config-v3a\.js\*/);
  assert.match(wrangler,/www\.shiftsometimber\.co\.uk\/site-config-v3a\.js\*/);
  assert.match(worker,/hostname='projectshift\.pages\.dev'/);
});

test('public chrome patch replaces the retired Tap Room destination and label',()=>{
  assert.match(worker,/path==='\/tap-room'/);
  assert.match(worker,/link\.href='\/lounge'/);
  assert.match(worker,/link\.textContent='The Lounge'/);
});
