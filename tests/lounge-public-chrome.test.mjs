import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';

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

test('Knowledge and Treatment Centre receive the same uncapped approved wire',()=>{
  assert.match(worker,/\['\/explore-knowledge','\/treatment-centre'\]/);
  assert.match(worker,/fetch\('\/v1\/radar\/ticker'/);
  assert.match(worker,/lines\.join\('   •   '\)/);
  assert.doesNotMatch(worker,/items\.slice\(/);
  assert.match(worker,/!body\.current\|\|!lines\.length\)\{strip\.remove\(\);style\.remove\(\);return\}/);
  assert.match(worker,/prefers-reduced-motion:reduce/);
});

test('unified sitemap retains exactly the six reviewed mental-health additions',()=>{
  assert.match(wrangler,/shiftsometimber\.co\.uk\/sitemap\.xml\*/);
  const reviewedPaths=worker.match(/const\s+REVIEWED_MENTAL_HEALTH_PATHS\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(reviewedPaths,'reviewed mental-health allowlist must remain explicit');
  assert.deepEqual(Array.from(runInNewContext(reviewedPaths[1])),[
    '/mental-health/confidence-self-worth',
    '/mental-health/sleep-mental-health',
    '/mental-health/mental-health-and-weight',
    '/mental-health/talking-about-it',
    '/mental-health/myths-men-mental-health',
    '/mental-health/when-to-get-help',
  ]);
  // Approved newsroom and SHIFT Health additions now share this sitemap.
  // The mental-health allowlist remains independently bounded to six leaves.
  assert.match(worker,/requiredPaths\s*=\s*\[\.\.\.new Set\(\[\.\.\.REVIEWED_MENTAL_HEALTH_PATHS/);
  assert.match(worker,/headers\.set\(\s*["']X-Shift-Sitemap-Authority["']\s*,\s*["']unified-estate-v1-no-removals["']\s*\)/);
});
