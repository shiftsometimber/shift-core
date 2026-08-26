import test from 'node:test';import assert from 'node:assert/strict';import {TAP_ROOMS,REPORT_CATEGORIES,detectTapRoomRisk} from '../tap-room-v1.js';
test('six permanent rooms are exact',()=>assert.deepEqual(TAP_ROOMS.map(x=>x.slug),['sport-banter','treatment-experiences','food-everyday','confidence-setbacks','travel-breaks','general-life']));
test('report categories and priorities are governed',()=>assert.deepEqual(Object.fromEntries(Object.entries(REPORT_CATEGORIES).map(([k,v])=>[k,v.priority])),{unsafe_treatment_advice:'P1',medication_sales:'P1',harassment:'P2',spam:'P2',crisis:'P0',other:'P2'}));
test('unsafe dose instructions are held while genuine experience remains allowed',()=>{
  for(const text of ['You should skip your next dose','Double the dosage next week','I would take an extra shot mate.','Move up a strength, you will be fine.',"I'd go up to 10mg if I were you."])assert.ok(detectTapRoomRisk(text).includes('unsafe_treatment_advice'),text);
  for(const text of ['I felt sick for two days after mine.','My doctor told me to increase the dose to 5mg.','Did you skip a dose because you were ill?','Do not stop taking it without speaking to your prescriber.'])assert.deepEqual(detectTapRoomRisk(text),[],text);
  assert.ok(detectTapRoomRisk('You need to stop it now.','treatment-experiences').includes('unsafe_treatment_advice'));
  assert.deepEqual(detectTapRoomRisk('You should stop letting him walk over you.','general-life'),[]);
});
test('selling language is detected in ordinary Treatment-room wording',()=>{
  assert.ok(detectTapRoomRisk('DM me to buy an unlicensed peptide').includes('medication_sales'));
  assert.ok(detectTapRoomRisk('I get mine from Dave, message me and I will sort you out.','treatment-experiences').includes('medication_sales'));
  assert.deepEqual(detectTapRoomRisk('I get my football shirts from Dave, message me.','sport-banter'),[]);
});
test('explicit and euphemistic crisis language is detected',()=>{
  for(const text of ['I want to end my life','I do not want to be here anymore.','I cannot go on like this and everyone would be better without me.','I wish I would not wake up'])assert.ok(detectTapRoomRisk(text).includes('crisis'),text);
  assert.deepEqual(detectTapRoomRisk("I can't go on holiday because of work."),[]);
});
