import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publicApi=fs.readFileSync('radar-public-v1.js','utf8');
const member=fs.readFileSync('frontend/member/member-medicines-watch-v1.js','utf8');
const worker=fs.readFileSync('worker-entry-v6.js','utf8');

test('every ticker surface receives one complete approved wire',()=>{
  assert.match(publicApi,/publishedEvents\(env\.DB,200\)/);
  assert.match(publicApi,/ticker_knowledge'\)\|\|hasDestination\(row,'ticker_treatments/);
  assert.doesNotMatch(publicApi,/filter\(row=>hasDestination\(row,surface\)\)\.slice/);
  assert.doesNotMatch(publicApi,/\.slice\(0,(?:6|12)\)\.map/);
});

test('member medicines watch uses the locked public name and full wire',()=>{
  assert.match(member,/SHIFT AI Newsroom/);
  assert.match(member,/same full approved wire shown across Shift/i);
  assert.doesNotMatch(member,/Medicine News|SHIFT MEDICINES INTELLIGENCE/);
});

test('the live SHIFT AI ticker also follows the medicine decision and order routes',()=>{
  assert.match(worker,/PUBLIC_MEDICINE_TICKER_PATCH/);
  assert.match(worker,/\['\/start-here','\/treatment-order'\]/);
  assert.match(worker,/fetch\('\/v1\/radar\/ticker'/);
  assert.match(worker,/item\.url\|\|'\/medicine-news'/);
  assert.match(worker,/prefers-reduced-motion/);
});
