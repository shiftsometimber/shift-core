import test from 'node:test';
import assert from 'node:assert/strict';
import {claimIsRenderable,claimsChannels} from '../claims-library-v1.js';

const approved={state:'approved',permitted_channel:'public_service',permitted_destination:'/start-here',effective_at:'2026-01-01T00:00:00Z',review_at:'2027-01-01T00:00:00Z'};
test('approved in-date claim renders only at its exact channel and destination',()=>{
  assert.equal(claimIsRenderable(approved,{channel:'public_service',destination:'/start-here',at:new Date('2026-08-22')}),true);
  assert.equal(claimIsRenderable(approved,{channel:'factual_product',destination:'/start-here',at:new Date('2026-08-22')}),false);
  assert.equal(claimIsRenderable(approved,{channel:'public_service',destination:'/different',at:new Date('2026-08-22')}),false);
});
test('draft, withdrawn, expired and overdue-review claims never render',()=>{
  for(const state of ['draft','withdrawn','expired'])assert.equal(claimIsRenderable({...approved,state},{channel:'public_service',destination:'/start-here',at:new Date('2026-08-22')}),false);
  assert.equal(claimIsRenderable({...approved,review_at:'2026-01-01T00:00:00Z'},{channel:'public_service',destination:'/start-here',at:new Date('2026-08-22')}),false);
  assert.equal(claimIsRenderable({...approved,withdrawn_at:'2026-08-01T00:00:00Z'},{channel:'public_service',destination:'/start-here',at:new Date('2026-08-22')}),false);
});
test('claims channels are deliberately finite',()=>assert.deepEqual(claimsChannels,['public_service','treatment_pathway','factual_product','checkout','member_support','transactional']));
