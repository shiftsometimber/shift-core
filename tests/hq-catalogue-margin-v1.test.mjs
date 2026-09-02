import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateMargin,defaultSellingPrice} from '../hq-catalogue-v1.js';

test('default selling price produces a 60% gross margin',()=>{
  assert.equal(defaultSellingPrice(4000),10000);
  assert.deepEqual(calculateMargin(4000,10000),{costPence:4000,sellingPence:10000,marginPence:6000,marginPercent:60});
});

test('margin remains explicit for manually entered prices',()=>{
  assert.equal(calculateMargin(10000,16900).marginPercent,40.83);
});
