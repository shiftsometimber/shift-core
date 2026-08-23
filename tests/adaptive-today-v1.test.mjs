import test from 'node:test';
import assert from 'node:assert/strict';
import {grubOptions,moveOptions,resolveTreatmentSetup} from '../member-daily-v3.js';

test('rough guts produces three small named plates, not a completion task',()=>{
  const meals=grubOptions({guts:'rough'},{});
  assert.equal(meals.length,3);
  assert.equal(meals[0].name,'Scrambled eggs on toast');
  assert.ok(meals.every(meal=>meal.name&&meal.proteinG>0));
});

test('yesterday rewrites tonight without asking the member again',()=>{
  assert.equal(grubOptions({guts:'fine'},{guts:'rough'})[0].key,'eggs-toast');
  assert.equal(moveOptions({energy:'good'},{energy:'empty'})[0].minutes,10);
});

test('good energy permits a longer walk while not tonight remains valid',()=>{
  const moves=moveOptions({energy:'good'},{});
  assert.equal(moves[0].minutes,25);
  assert.equal(moves.at(-1).key,'not-tonight');
  assert.equal(moves.at(-1).minutes,0);
});

test('first-run treatment is chip-driven, infers route and rejects invented doses',()=>{
  assert.deepEqual(resolveTreatmentSetup({medicineKey:'mounjaro',doseKey:'5mg',durationKey:'weeks'}),{medicine:'Mounjaro',route:'jab',dose:'5mg',week:3,status:'active'});
  assert.equal(resolveTreatmentSetup({medicineKey:'mounjaro',doseKey:'9mg',durationKey:'weeks'}),null);
  assert.equal(resolveTreatmentSetup({medicineKey:'add-later'}).status,'add_later');
});
