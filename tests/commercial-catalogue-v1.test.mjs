import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCommercialGate,provisionalCostCeilingPence} from '../commercial-catalogue-v1.js';

test('60 percent GM produces a 40 percent provisional cost ceiling',()=>{
  assert.equal(provisionalCostCeilingPence(1000),400);
  assert.equal(provisionalCostCeilingPence(16900),6760);
});

test('TBC commercial data blocks sale',()=>{
  assert.deepEqual(evaluateCommercialGate({commercial_state:'blocked'}),{ok:false,reason:'commercial_not_approved'});
});

test('approval cannot bypass unconfirmed actual cost',()=>{
  assert.deepEqual(evaluateCommercialGate({commercial_state:'approved',actual_cost_status:'tbc',actual_cost_pence:null}),{ok:false,reason:'cost_unconfirmed'});
});

test('confirmed supplier and economics pass at target',()=>{
  const result=evaluateCommercialGate({commercial_state:'approved',actual_cost_status:'confirmed',actual_cost_pence:400,p_and_p_cost_status:'confirmed',p_and_p_cost_pence:100,contribution_cost_status:'confirmed',payment_cost_pence:30,expected_refund_decline_cost_pence:10,direct_support_cost_pence:10,minimum_contribution_pence:400,lead_time_status:'confirmed',lead_time_min_days:2,lead_time_max_days:4,supplier_status:'approved',price_pence:1000,target_gm_bps:6000});
  assert.deepEqual(result,{ok:true,productGmBps:6000,contributionPence:450});
});

test('below-target product GM is rejected',()=>{
  const result=evaluateCommercialGate({commercial_state:'approved',actual_cost_status:'confirmed',actual_cost_pence:401,p_and_p_cost_status:'confirmed',p_and_p_cost_pence:100,contribution_cost_status:'confirmed',payment_cost_pence:30,expected_refund_decline_cost_pence:10,direct_support_cost_pence:10,minimum_contribution_pence:400,lead_time_status:'confirmed',lead_time_min_days:2,lead_time_max_days:4,supplier_status:'approved',price_pence:1000,target_gm_bps:6000});
  assert.equal(result.ok,false);assert.equal(result.reason,'gross_margin_below_target');
});

test('approved product still blocks when contribution inputs are TBC',()=>{
  const result=evaluateCommercialGate({commercial_state:'approved',actual_cost_status:'confirmed',actual_cost_pence:400,p_and_p_cost_status:'confirmed',p_and_p_cost_pence:100,contribution_cost_status:'tbc'});
  assert.equal(result.reason,'contribution_inputs_unconfirmed');
});
