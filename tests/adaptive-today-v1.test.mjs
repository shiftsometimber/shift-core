import test from 'node:test';
import assert from 'node:assert/strict';
import {grubOptions,moveOptions} from '../member-daily-v3.js';

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
