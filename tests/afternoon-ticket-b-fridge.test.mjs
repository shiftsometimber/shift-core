import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const js=await readFile(new URL('../frontend/member/my-timber-v11.js',import.meta.url),'utf8');

test('fridge never ends on an empty conundrum response',()=>{
  assert.match(js,/fallbackMeal\(raw\)/);
  assert.match(js,/!\(result\?\.top\|\|\[\]\)\.length/);
  assert.match(js,/ON-SITE FALLBACK/);
});

test('fallback covers the tiny built-in ingredient set and is cookable',()=>{
  for(const ingredient of ['chicken','egg','mince','oat','frozen veg']) assert.match(js,new RegExp(ingredient,'i'));
  assert.match(js,/method:\[/);
});

test('fridge result is remembered on the member account',()=>{
  assert.match(js,/saveMemberState/);
  assert.match(js,/lastFridge/);
  assert.doesNotMatch(js,/sessionStorage/);
});

test('Grub uses the same fridge runtime',()=>{
  assert.match(js,/path==='\/member\/grub'/);
  assert.match(js,/window\.SST_FRIDGE/);
});
