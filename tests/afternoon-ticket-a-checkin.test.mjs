import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const js=await readFile(new URL('../frontend/member/my-timber-v11.js',import.meta.url),'utf8');

test('My Timber uses the account check-in API, not fiveLoops.lastCheckIn',()=>{
  assert.match(js,/\.getCheckIns\(\)/);
  assert.doesNotMatch(js,/lastCheckIn/);
  assert.doesNotMatch(js,/data-check-save/);
  assert.match(js,/href="\/member\/check-in"/);
});

test('rough canonical check-ins door to Good to Talk',()=>{
  assert.match(js,/struggling\|tough\|rough\|low\|flat/i);
  assert.match(js,/href="\/mens-mental-health"/);
});
