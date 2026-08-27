import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const js=await readFile(new URL('../frontend/member/member-fit-programme-v1.js',import.meta.url),'utf8');

test('20 minutes is the unsaved default',()=>{
  assert.match(js,/<option value="20" selected>20 minutes<\/option>/);
  assert.match(js,/else \$\('#sfMinutes'\)\.value='20'/);
});

test('Fit has a hardcoded no-kit knee-friendly 20 minute fallback',()=>{
  assert.match(js,/fallbackFitPlan/);
  assert.match(js,/20-minute knee-friendly keep-muscle session/);
  assert.match(js,/No equipment/);
  assert.doesNotMatch(js,/No suitable session found/);
});

test('done uses completeFitToday and never doors to visualise',()=>{
  assert.match(js,/SST_API\.completeFitToday/);
  assert.match(js,/logged the session in Progress/);
  assert.doesNotMatch(js,/dashboard#visualise/);
  assert.doesNotMatch(js,/shiftFitCompleted/);
});

test('programme requests one day, not a seven day planner',()=>{
  assert.match(js,/generateFit\(\{days:1,/);
  assert.doesNotMatch(js,/days:7/);
});
