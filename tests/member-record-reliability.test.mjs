import test from 'node:test';
import assert from 'node:assert/strict';
import {ordersFixture} from '../shift-coach/member-record-fixture.mjs';
import {fixture} from '../health-passport/fixture.mjs';
import {commerceStripeRoutes} from '../commerce-stripe-v1.js';
import {myJourneyCheckInRoutes, myJourneyTrendRoutes} from '../my-journey-checkin-v1.js';
import {journeySignals, journeyExport, repeatedTreatmentTiming} from '../my-journey-observation-v1.js';

const origin='https://shiftsometimber.co.uk';
const request=(path,id=1,options={})=>new Request(origin+path,{...options,headers:{Cookie:`sst_session=test-only-member-${id}`,...options.headers}});


test('order details use the selected owned ID even with a duplicate legacy reference; null notes remain readable',async t=>{
 const f=ordersFixture();t.after(()=>f.close());
 const before=JSON.stringify(f.db.prepare('SELECT * FROM orders ORDER BY id').all());
 for(const notes of ['null','false','3','[]','malformed','{}']){
  f.db.prepare('UPDATE orders SET notes=? WHERE id=2').run(notes);
  const response=await commerceStripeRoutes(request('/v1/commerce/orders'),f.env,{});
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.orders.length,1);assert.equal(data.orders[0].items[0].product_name,'Own account item');
  assert.equal(data.orders[0].carrier,'');assert.equal(data.orders[0].total_pence,null);
  assert(!('id' in data.orders[0]));assert(!JSON.stringify(data).includes('Other account item'));
 }
 f.db.prepare('UPDATE orders SET notes=? WHERE id=2').run('null');
 assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM orders ORDER BY id').all()),before);
});

test('weekly check-in and export tolerate legacy null/scalar preferences without creating measurements',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());
 for(const preferences of ['null','false','3','"text"','[]','malformed','{}']){
  f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(preferences);
  const response=await myJourneyCheckInRoutes(request('/v1/journey/weekly-check-in'),f.env,{});
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.prefill.weightKg,null);assert.equal(data.prefill.waistCm,null);
  assert.equal((await myJourneyTrendRoutes(request('/v1/journey/export'),f.env)).status,200);
 }
 const response=await myJourneyCheckInRoutes(request('/v1/journey/weekly-check-in',1,{method:'POST',headers:{'Content-Type':'application/json'},body:'null'}),f.env,{});
 assert.equal(response.status,400);assert.equal((await response.json()).error,'overall_feeling_required');
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM my_journey_weekly_checkins').get().n,0);
 const saved=await myJourneyCheckInRoutes(request('/v1/journey/weekly-check-in',1,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weekEnding:'2026-09-28',overallFeeling:'alright',clothesFit:'same',weightKg:null,waistCm:null,disruptions:['holiday'],movement:{minutes:0,sessionsCompleted:3}})}),f.env,{});
 assert.equal(saved.status,201);
 const weekly=await (await myJourneyCheckInRoutes(request('/v1/journey/weekly-check-in?date=2026-09-28'),f.env,{})).json();
 assert.equal(weekly.saved.weightKg,null);assert.equal(weekly.saved.waistCm,null);assert.deepEqual(weekly.saved.disruptions,['holiday']);
 const trend=await (await myJourneyTrendRoutes(request('/v1/journey/trends'),f.env)).json();
 assert.equal(trend.export.records[0].movementMinutes,0);assert.equal(trend.export.records[0].weightKg,null);
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM progress_entries WHERE source='my_journey_weekly'").get().n,0);
});

test('missing values do not become zero measurements, changes or same-day treatment timing',()=>{
 const missing=[null,undefined,'','   ',false,[],{},'bad'];
 for(const value of missing){
  const rows=[100,value,value,value].map((weightKg,i)=>({date:`2026-09-${String(7+i*7).padStart(2,'0')}`,confirmed:true,weightKg,waistCm:value,symptoms:{nausea:{severity:2,daysAfterTreatment:value}}}));
  const signals=journeySignals(rows);assert.equal(signals.weightDeltaKg,null);assert.equal(signals.waistDeltaCm,null);
  assert.equal(signals.weightDirection,'unknown');assert.equal(signals.weightBroadlySteady,false);
  assert.equal(repeatedTreatmentTiming(rows,'nausea'),null);
  assert(journeyExport(rows).missing.includes('waistCm'));
 }
 const rows=[0,'0',2].map((movementMinutes,i)=>({date:`2026-09-${String(7+i*7).padStart(2,'0')}`,confirmed:true,movementMinutes,symptoms:{nausea:{severity:2,daysAfterTreatment:0}}}));
 assert.equal(repeatedTreatmentTiming(rows,'nausea').cycles,3);
 assert.equal(journeySignals(rows.map(row=>({...row,weightKg:row.movementMinutes}))).weightDeltaKg,2);
});
