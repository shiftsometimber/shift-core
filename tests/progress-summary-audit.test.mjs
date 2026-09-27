import test from 'node:test';
import assert from 'node:assert/strict';
import {progressSummary} from '../member-daily-v2.js';
const summary=rows=>progressSummary({DB:{prepare:()=>({bind:()=>({all:async()=>({results:rows}),first:async()=>({preferences:'{}'})})})}},17);
test('missing optional measurements never become zero and one observation has no trend',async()=>{
 const p=await summary([{recorded_on:'2026-09-21',weight_kg:103,systolic:null,diastolic:'',steps:' ',sleep_hours:undefined,mood_score:null}]);
 assert.deepEqual(p.metrics.map(m=>m.key),['weight']);assert.equal(p.metrics[0].delta,null);assert.equal(p.metrics[0].direction,'not_enough_data');assert.deepEqual(p.milestones,[]);
});
test('each metric uses its own observations, preserving genuine zero',async()=>{
 const p=await summary([{recorded_on:'2026-09-18',weight_kg:105,steps:0},{recorded_on:'2026-09-19',weight_kg:null,systolic:130},{recorded_on:'2026-09-20',weight_kg:103,steps:1000},{recorded_on:'2026-09-21',weight_kg:null,systolic:125}]);
 const by=Object.fromEntries(p.metrics.map(m=>[m.key,m]));
 assert.equal(by.weight.latest,103);assert.equal(by.weight.delta,-2);assert.equal(by.steps.start,0);assert.equal(by.steps.delta,1000);assert.equal(by.systolic.delta,-5);assert.equal(by.weight.latest_on,'2026-09-20');
});
test('invalid numeric shapes and empty history cannot invent measurements',async()=>{
 assert.equal((await summary([])).state,'empty');
 assert.deepEqual((await summary([{weight_kg:false,steps:[],sleep_hours:'abc',mood_score:{}}])).metrics,[]);
});
