import test from 'node:test';
import assert from 'node:assert/strict';
import {authoritativePurchaseability} from '../hq-purchaseability-v1.js';

const base={product:{status:'available',sellable:1,partner:'PHARMACY'},variant:{status:'available',sellable:1,availability_state:'available'},inventory:{stock_on_hand:2,reserved:0}};

test('purchaseability is fail-closed unless every HQ gate is green',()=>{
  assert.equal(authoritativePurchaseability(base).canBuy,true);
  assert.equal(authoritativePurchaseability({...base,product:{...base.product,sellable:0}}).canBuy,false);
  assert.equal(authoritativePurchaseability({...base,variant:{...base.variant,sellable:0}}).canBuy,false);
  assert.equal(authoritativePurchaseability({...base,variant:{...base.variant,availability_state:'out_of_stock'}}).canBuy,false);
  assert.equal(authoritativePurchaseability({...base,product:{...base.product,partner:''}}).canBuy,false);
  assert.equal(authoritativePurchaseability({...base,inventory:{stock_on_hand:0,reserved:0}}).canBuy,false);
});

test('availability defaults to unavailable',()=>{
  const truth=authoritativePurchaseability({product:{status:'available',sellable:1,partner:'X'},variant:{status:'available',sellable:1},inventory:{stock_on_hand:2}});
  assert.equal(truth.availabilityState,'unavailable');
  assert.equal(truth.canBuy,false);
});
