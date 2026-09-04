import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publicApi=fs.readFileSync('radar-public-v1.js','utf8');
const member=fs.readFileSync('frontend/member/member-medicines-watch-v1.js','utf8');

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
