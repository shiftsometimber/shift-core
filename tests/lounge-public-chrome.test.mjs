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

test('Knowledge and Treatment Centre receive the same uncapped approved wire',()=>{
  assert.match(worker,/\['\/explore-knowledge','\/treatment-centre'\]/);
  assert.match(worker,/fetch\('\/v1\/radar\/ticker'/);
  assert.match(worker,/lines\.join\('   •   '\)/);
  assert.doesNotMatch(worker,/items\.slice\(/);
  assert.match(worker,/!body\.current\|\|!lines\.length\)\{strip\.remove\(\);style\.remove\(\);return\}/);
  assert.match(worker,/prefers-reduced-motion:reduce/);
});

test('sitemap restores only the six reviewed mental-health leaves',()=>{
  assert.match(wrangler,/shiftsometimber\.co\.uk\/sitemap\.xml\*/);
  for(const path of ['/mental-health/confidence-self-worth','/mental-health/sleep-mental-health','/mental-health/mental-health-and-weight','/mental-health/talking-about-it','/mental-health/myths-men-mental-health','/mental-health/when-to-get-help']) assert.match(worker,new RegExp(path));
  assert.match(worker,/X-Shift-Sitemap-Authority','reviewed-mental-health-v1/);
});
