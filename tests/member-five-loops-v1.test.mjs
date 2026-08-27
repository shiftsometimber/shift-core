import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const js=await readFile(new URL('../frontend/member/member-five-loops-v1.js',import.meta.url),'utf8');
const grub=await readFile(new URL('../frontend/member/member-grub.html',import.meta.url),'utf8');
const fit=await readFile(new URL('../frontend/member/member-fit.html',import.meta.url),'utf8');

test('five member loops are present',()=>{
  for(const phrase of ['Use what I’ve actually got.','Give me 20 useful minutes.','Remember where I’m at.','Software not enough?','Keep the basics joined up.'])assert.match(js,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('fridge loop uses governed conundrum endpoint',()=>{
  assert.match(js,/\.conundrum\(/);
  assert.match(js,/allow_pantry_staples:true/);
});

test('remembered check-in and coming-off support persist to member state',()=>{
  assert.match(js,/lastCheckIn/);
  assert.match(js,/comingOffPlan/);
  assert.match(js,/saveMemberState/);
});

test('coming-off loop retains clinical boundary and human route',()=>{
  assert.match(js,/medicineBoundary:'prescriber'/);
  assert.match(js,/contact\.html/);
  assert.match(js,/mens-mental-health\.html/);
});

test('Grub and Fit load the shared five-loop companion',()=>{
  assert.match(grub,/member-five-loops-v1\.js\?v=1/);
  assert.match(fit,/member-five-loops-v1\.js\?v=1/);
  assert.match(grub,/member-five-loops-v1\.css\?v=1/);
  assert.match(fit,/member-five-loops-v1\.css\?v=1/);
});
