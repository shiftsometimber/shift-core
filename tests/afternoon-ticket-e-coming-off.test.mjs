import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const js=await readFile(new URL('../frontend/member/my-timber-v11.js',import.meta.url),'utf8');

test('coming-off support contains all six immediate actions',()=>{
  for(const needle of ['/articles/stopping-glp1','/member/grub#sstFiveLoops','/member/fit?minutes=20&mode=coming-off','appetite back?','/mens-mental-health','Message Matt']) assert.match(js,new RegExp(needle.replace(/[?]/g,'\\?'),'i'));
});

test('starting the plan persists more than a boolean and opens the plan',()=>{
  assert.match(js,/appetiteCheck:true/);
  assert.match(js,/humanSupport:true/);
  assert.match(js,/medicineBoundary:'prescriber'/);
  assert.match(js,/showComingPlan\(true\)/);
});

test('no member coming-off route is invented',()=>{
  assert.doesNotMatch(js,/\/member\/coming-off/);
});
