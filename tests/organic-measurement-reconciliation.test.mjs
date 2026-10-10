import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcile} from '../scripts/reconcile-organic-measurement.mjs';
const fixture=(clicks,impressions,more=false)=>({siteUrl:'sc-domain:shiftsometimber.co.uk',startDate:'2026-09-09',endDate:'2026-10-06',searchType:'web',scope:{country:'gbr',brand:'all'},pagination:{hasMore:more},rows:[{clicks,impressions}]});
test('withholds page CTR for reproduced complete-row discrepancy',()=>{const r=reconcile(fixture(24,2895),fixture(24,2895),fixture(0,1901));assert.equal(r.pageClickAttribution,'unresolved');assert.equal(r.pageCTRUsable,false);assert.equal(r.property.clicks,24);});
test('allows genuinely quiet matching reports without inventing activity',()=>assert.equal(reconcile(fixture(0,12),fixture(0,12),fixture(0,10)).pageCTRUsable,true));
test('rejects unequal dates and incomplete pagination',()=>{const changed={...fixture(24,2895),endDate:'2026-10-05'};assert.throws(()=>reconcile(fixture(24,2895),changed,fixture(0,1901)),/Incomparable/);assert.throws(()=>reconcile(fixture(24,2895),fixture(24,2895),fixture(0,1901,true)),/remaining rows/);});
test('does not bless a disagreement between property controls',()=>assert.equal(reconcile(fixture(24,2895),fixture(20,2895),fixture(0,1901)).pageCTRUsable,false));
test('requires explicit scope instead of treating missing filters as comparable',()=>assert.throws(()=>reconcile({...fixture(1,10),scope:undefined},fixture(1,10),fixture(1,10)),/Explicit/));
const daily=(rows)=>({...fixture(0,0),rows});
const day1={date:'2026-09-09',clicks:1,impressions:67},day2={date:'2026-09-10',clicks:0,impressions:35};
test('records independent daily and page agreement without inventing a cause',()=>{
  const p=daily([day1,day2]),pages=fixture(0,55);
  const r=reconcile(p,p,pages,{property:daily([day2,day1]),pages});
  assert.equal(r.independentDailyControlsAgree,true);assert.equal(r.independentPageControlsAgree,true);
  assert.match(r.cause,/source-level investigation/);assert.equal(r.pageCTRUsable,false);
});
test('identical window totals cannot conceal differing independent daily clicks',()=>{
  const p=daily([day1,day2]),pages=fixture(0,55);
  const r=reconcile(p,p,pages,{property:daily([{...day1,clicks:0},{...day2,clicks:1}]),pages});
  assert.equal(r.independentDailyControlsAgree,false);assert.equal(r.pageCTRUsable,false);
});
test('rejects incomplete and mismatched native exports',()=>{
  const p=daily([day1,day2]),pages=fixture(0,55);
  assert.throws(()=>reconcile(p,p,pages,{property:{...p,endDate:'2026-10-05'},pages}),/independent export scope/);
  assert.throws(()=>reconcile(p,p,pages,{property:p,pages:fixture(0,55,true)}),/remaining rows/);
});
