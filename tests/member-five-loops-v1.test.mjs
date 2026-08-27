import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const js=await readFile(new URL('../frontend/member/my-timber-v11.js',import.meta.url),'utf8');
const grub=await readFile(new URL('../frontend/member/member-grub.html',import.meta.url),'utf8');
const fit=await readFile(new URL('../frontend/member/member-fit.html',import.meta.url),'utf8');

test('five member loops are native My Timber support rather than an extra bolt-on',()=>{
  for(const phrase of ['MY TIMBER · SUPPORT','Use what I’ve actually got.','Give me 20 useful minutes.','Remember where I’m at.','Software not enough?','Keep the basics joined up.'])assert.match(js,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.doesNotMatch(js,/MEMBER EXTRAS/);
  assert.match(js,/sstFiveLoopsStyle/);
});

test('fridge loop uses governed conundrum endpoint and persists its last usable result',()=>{
  assert.match(js,/\.conundrum\(/);
  assert.match(js,/allow_pantry_staples:true/);
  assert.match(js,/lastFridge/);
  assert.match(js,/Use this in Grub/);
});

test('remembered check-in and coming-off support persist to member state and return to Today',()=>{
  assert.match(js,/lastCheckIn/);
  assert.match(js,/comingOffPlan/);
  assert.match(js,/saveMemberState/);
  assert.match(js,/Use this in Today/);
  assert.match(js,/Support plan active/);
});

test('coming-off loop retains clinical boundary and human route',()=>{
  assert.match(js,/medicineBoundary:'prescriber'/);
  assert.match(js,/contact\.html/);
  assert.match(js,/mens-mental-health\.html/);
});

test('Grub and Fit use the already-published My Timber runtime with no orphan support assets',()=>{
  assert.match(grub,/my-timber-v11\.js\?v=2/);
  assert.match(fit,/my-timber-v11\.js\?v=2/);
  assert.doesNotMatch(grub,/member-five-loops-v1\.(?:js|css)/);
  assert.doesNotMatch(fit,/member-five-loops-v1\.(?:js|css)/);
});
