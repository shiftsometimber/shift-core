import test from 'node:test';
import assert from 'node:assert/strict';
import {commercialHqRoutes,treatmentHqSummary} from '../commercial-hq-v1.js';

test('non-HQ paths are ignored',async()=>assert.equal(await commercialHqRoutes(new Request('https://api.example/v1/other'),{}),null));
test('HQ catalogue rejects an unapproved origin before touching storage',async()=>{
  const response=await commercialHqRoutes(new Request('https://api.example/v1/hq/catalogue',{headers:{Origin:'https://evil.example','X-Shift-Admin-Key':'secret'}}),{ADMIN_API_KEY:'secret'});
  assert.equal(response.status,403);assert.equal((await response.json()).error,'origin_not_allowed');
});
test('HQ catalogue rejects a missing admin secret before touching storage',async()=>{
  const response=await commercialHqRoutes(new Request('https://api.example/v1/hq/catalogue',{headers:{Origin:'https://hq.shiftsometimber.co.uk'}}),{ADMIN_API_KEY:'secret'});
  assert.equal(response.status,401);assert.equal((await response.json()).error,'unauthorised');
});

test('HQ treatment summary is binary and never represents a purchase-enabled medicine',()=>{
  const summary=treatmentHqSummary([
    {purchase_state:'blocked',gate:{blockers:['stock_unconfirmed','purchase_disabled']}},
    {purchase_state:'blocked',gate:{blockers:['stock_unconfirmed','supplier_unapproved','purchase_disabled']}}
  ]);
  assert.deepEqual(summary,{total:2,purchaseEnabled:0,purchaseBlocked:2,allPurchasePathsLocked:true,blockerCounts:{stock_unconfirmed:2,purchase_disabled:2,supplier_unapproved:1}});
});
