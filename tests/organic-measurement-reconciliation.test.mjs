import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcile} from '../scripts/reconcile-organic-measurement.mjs';
const fixture=(clicks,impressions,more=false)=>({siteUrl:'sc-domain:shiftsometimber.co.uk',startDate:'2026-09-09',endDate:'2026-10-06',searchType:'web',scope:{country:'gbr',brand:'all'},pagination:{hasMore:more},rows:[{clicks,impressions}]});
test('withholds page CTR for reproduced complete-row discrepancy',()=>{const r=reconcile(fixture(24,2895),fixture(24,2895),fixture(0,1901));assert.equal(r.pageClickAttribution,'unresolved');assert.equal(r.pageCTRUsable,false);assert.equal(r.property.clicks,24);});
test('allows genuinely quiet matching reports without inventing activity',()=>assert.equal(reconcile(fixture(0,12),fixture(0,12),fixture(0,10)).pageCTRUsable,true));
test('rejects unequal dates and incomplete pagination',()=>{const changed={...fixture(24,2895),endDate:'2026-10-05'};assert.throws(()=>reconcile(fixture(24,2895),changed,fixture(0,1901)),/Incomparable/);assert.throws(()=>reconcile(fixture(24,2895),fixture(24,2895),fixture(0,1901,true)),/remaining rows/);});
test('does not bless a disagreement between property controls',()=>assert.equal(reconcile(fixture(24,2895),fixture(20,2895),fixture(0,1901)).pageCTRUsable,false));
test('requires explicit scope instead of treating missing filters as comparable',()=>assert.throws(()=>reconcile({...fixture(1,10),scope:undefined},fixture(1,10),fixture(1,10)),/Explicit/));
