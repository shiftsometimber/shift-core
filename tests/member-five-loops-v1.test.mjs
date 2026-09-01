import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const js=await readFile(new URL('../frontend/member/my-timber-v11.js',import.meta.url),'utf8');
const grub=await readFile(new URL('../frontend/member/member-grub.html',import.meta.url),'utf8');
const fit=await readFile(new URL('../frontend/member/member-fit.html',import.meta.url),'utf8');

test('five member loops are native My Timber support rather than an extra bolt-on',()=>{
  for(const phrase of ['MY TIMBER · SUPPORT','Use what I’ve actually got.','Give me 20 useful minutes.','How have I actually been?','Message Matt.','Coming off is a plan, not a switch.'])assert.match(js,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.doesNotMatch(js,/MEMBER EXTRAS/);
  assert.match(js,/sstFiveLoopsStyle/);
});

test('fridge loop uses governed conundrum endpoint and persists its last usable result',()=>{
  assert.match(js,/\.conundrum\(/);
  assert.match(js,/allow_pantry_staples:true/);
  assert.match(js,/lastFridge/);
  assert.match(js,/rememberFridge\(raw,result\)/);
  assert.match(js,/renderFridge\(result\)/);
});

test('remembered check-in and coming-off support persist to member state and return to Today',()=>{
  assert.match(js,/getCheckIns\(\)/);
  assert.match(js,/comingOffPlan/);
  assert.match(js,/saveMemberState/);
  assert.match(js,/Shift remembered your last check-in/);
  assert.match(js,/Plan active\./);
});

test('Today consumes recent support state without silently rewriting the day',()=>{
  assert.match(js,/renderToday\(loops,entry\)/);
  assert.match(js,/recent\(checkTime\(entry\),96\)/);
  assert.match(js,/recent\(fridge\.at,24\)/);
  assert.match(js,/Today’s prompt is smaller because of it/);
  assert.match(js,/Make today manageable/);
  assert.match(js,/adjustDailyShift\(\{scenario:button\.dataset\.contextRebuild\}\)/);
  assert.match(js,/feeling_rough/);
});

test('Today keeps coming-off support practical and medicine decisions with the prescriber',()=>{
  assert.match(js,/Coming-off support is active/);
  assert.match(js,/prescriber handles medicine decisions/);
  assert.match(js,/\/member\/grub/);
  assert.match(js,/\/member\/fit\?minutes=20/);
  assert.match(js,/href="\/mens-mental-health"/);
});

test('Today only reuses fresh fridge contents and sends the member back to verify them',()=>{
  assert.match(js,/recent\(fridge\.at,24\)/);
  assert.match(js,/Check my fridge/);
});

test('coming-off loop retains clinical boundary and human route',()=>{
  assert.match(js,/medicineBoundary:'prescriber'/);
  assert.match(js,/href="\/contact"/);
  assert.match(js,/href="\/mens-mental-health"/);
});

test('Grub and Fit use the already-published My Timber runtime with no orphan support assets',()=>{
  assert.match(grub,/my-timber-v11\.js\?v=2/);
  assert.match(fit,/my-timber-v11\.js\?v=2/);
  assert.doesNotMatch(grub,/member-five-loops-v1\.(?:js|css)/);
  assert.doesNotMatch(fit,/member-five-loops-v1\.(?:js|css)/);
});

test('private support loops render only after the member session is verified',()=>{
  assert.match(js,/await A\.getMe\(\)/);
  assert.match(js,/if\(path!='\/member\/dashboard'&&e\?\.status===401\)/);
  assert.match(js,/return;\s*}\s*shell\(\)/);
});
