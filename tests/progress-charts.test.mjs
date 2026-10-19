import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {progressSummary} from '../member-daily-v2.js';
const source=readFileSync(new URL('../frontend/member/member-progress-v1.js',import.meta.url),'utf8');
const document={body:{dataset:{memberTools:'v1'}},readyState:'loading',addEventListener(){}};
const context={document,location:{pathname:'/member/dashboard'},window:{},setTimeout,Date};
vm.runInNewContext(source.replace('  function boot(){','  globalThis.chartMarkup=progressChartMarkup;globalThis.chartValue=chartValue;\n  function boot(){'),context);
const metric=(key,series)=>({key,label:key,series}),now=Date.parse('2026-10-12T12:00:00Z');
test('chart series are additive to the canonical own-account summary with missing and zero preserved',async()=>{
 const queries=[],binds=[],rows=[{recorded_on:'2026-09-01',weight_kg:93.2,steps:0},{recorded_on:'2026-09-02',weight_kg:null,steps:1000},{recorded_on:'2026-09-03',weight_kg:93.2,steps:null}];
 const env={DB:{prepare(q){queries.push(q);return{bind(id){binds.push(id);return{all:async()=>({results:rows}),first:async()=>({preferences:'{}'})}}}}}};
 const p=await progressSummary(env,17),by=Object.fromEntries(p.metrics.map(m=>[m.key,m]));
 assert.deepEqual(by.weight.series,[{on:'2026-09-01',value:93.2},{on:'2026-09-03',value:93.2}]);assert.deepEqual(by.steps.series,[{on:'2026-09-01',value:0},{on:'2026-09-02',value:1000}]);assert.equal(by.weight.delta,0);assert.deepEqual(binds,[17,17]);assert.equal(queries.length,2);assert(queries[0].includes('WHERE user_id=?'));assert.equal(by.weight.observations,2);
});
test('empty and single-point chart states never invent zero, a line or a forecast',()=>{
 assert.match(context.chartMarkup(metric('weight',[]),'kg','all',now),/No readings in this period/);
 const one=context.chartMarkup(metric('weight',[{on:'2026-10-10',value:93.2}]),'kg','all',now);assert.match(one,/One reading/);assert.match(one,/93.2 kg/);assert.doesNotMatch(one,/polyline|forecast|prediction|NaN|Infinity/);assert.match(one,/See readings/);
});
test('real date spacing is preserved and only the latest saved value per day is plotted',()=>{
 const html=context.chartMarkup(metric('steps',[{on:'2026-10-01',value:0},{on:'2026-10-02',value:1000},{on:'2026-10-02',value:2000},{on:'2026-10-12',value:3000}]),'kg','all',now);assert.match(html,/3 recorded days/);assert.match(html,/2,000 steps/);assert.doesNotMatch(html,/1,000 steps/);const positions=[...html.matchAll(/class="shift-chart-hit" cx="([^"]+)"/g)].map(m=>Number(m[1]));assert.equal(positions.length,3);assert(positions[1]-positions[0]<(positions[2]-positions[1])/5);assert.match(html,/data-measured-line/);assert.doesNotMatch(html,/NaN|Infinity/);
});
test('periods have inclusive day cutoffs and skip invalid or future readings',()=>{
 const html=context.chartMarkup(metric('weight',[{on:'2026-09-14',value:93.2},{on:'2026-09-15',value:93.2},{on:'2026-10-12',value:93.2},{on:'2026-10-13',value:93.2},{on:'2026-02-30',value:93.2},{on:'bad date',value:93.2},{on:'2026-10-01',value:null}]),'kg','28',now);assert.match(html,/2 recorded days/);assert.doesNotMatch(html,/14 Sept|13 Oct|NaN|Infinity/);
});
test('weight charts honour all three unit preferences and small screen dimensions',()=>{
 const row=metric('weight',[{on:'2026-10-12',value:93.2}]);assert.match(context.chartMarkup(row,'kg','all',now,320),/viewBox="0 0 320 260"/);assert.match(context.chartMarkup(row,'kg','all',now),/93.2 kg/);assert.match(context.chartMarkup(row,'lb','all',now),/205.5 lb/);assert.match(context.chartMarkup(row,'stone_lb','all',now),/14 st 9.5 lb/);
});
test('all measurement types have readable units and chart text is escaped',()=>{
 for(const [key,value,expected]of [['waist',90,/90 cm/],['systolic',128,/128 mmHg/],['diastolic',82,/82 mmHg/],['sleep',7.5,/7.5 h/],['mood',5,/5\/10/],['steps',0,/0 steps/]])assert.match(context.chartMarkup(metric(key,[{on:'2026-10-12',value}]),'kg','all',now),expected);
 const m={...metric('weight',[{on:'2026-10-12',value:93.2}]),label:'<script>unsafe</script>'},html=context.chartMarkup(m,'kg','all',now);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/tabindex="0" role="button"/);
});

test('owned treatment weights join progress on read without copying records or returning notes',async()=>{
 const queries=[],binds=[],progress=[{recorded_on:'2026-10-10',created_at:'2026-10-10 07:00:00',weight_kg:93.2,steps:0}],treatment=[{occurred_at:'2026-10-12T07:00:00Z',created_at:'2026-10-12T07:00:01Z',weight_kg:93.2},{occurred_at:'2026-10-12T07:01:00Z',weight_kg:null},{occurred_at:'bad',weight_kg:93.2},{occurred_at:'2026-10-12T07:02:00Z',weight_kg:0}];
 const env={MY_TREATMENT_ENABLED:'true',DB:{prepare(q){queries.push(q);return{bind(id){binds.push(id);return{all:async()=>({results:q.includes('member_treatment_events')?treatment:progress}),first:async()=>({preferences:'{}'})}}}}}};
 const p=await progressSummary(env,17),weight=p.metrics.find(m=>m.key==='weight');assert.equal(weight.series.length,2);assert.equal(p.entries,2);assert.equal(p.metrics.find(m=>m.key==='steps').series[0].value,0);assert.deepEqual(binds,[17,17,17]);assert.equal(queries.length,3);assert(queries.every(q=>q.startsWith('SELECT')));assert(queries[1].includes('WHERE user_id=?'));assert(!queries[1].includes('SELECT *'));assert(!JSON.stringify(p).includes('body_json'));assert.equal(p.historyMayBeLimited,false);
});
test('a treatment-only weight creates a real first point; missing weights do not create progress',async()=>{
 const result=async(weight)=>progressSummary({MY_TREATMENT_ENABLED:'true',DB:{prepare:q=>({bind:()=>({all:async()=>({results:q.includes('member_treatment_events')?[{occurred_at:'2026-10-12T07:00:00Z',created_at:'2026-10-12T07:00:00Z',weight_kg:weight}]:[]}),first:async()=>({preferences:'{}'})})})}},17);
 const p=await result(93.2);assert.equal(p.state,'ready');assert.equal(p.metrics[0].delta,null);assert.equal(p.metrics[0].series.length,1);assert.equal((await result(null)).state,'empty');
});

test('custom dates keep both boundary days and exclude readings outside the chosen window',()=>{
 const rows=metric('weight',[{on:'2025-01-01',value:99},{on:'2026-10-01',value:95},{on:'2026-10-10',value:94},{on:'2026-10-12',value:93}]);
 const html=context.chartMarkup(rows,'kg',{from:'2026-10-01',to:'2026-10-10'},now,320);
 assert.equal((html.match(/data-point=/g)||[]).length,2);assert.match(html,/94\.0 kg/);assert.doesNotMatch(html,/data-on="2025-01-01"|data-on="2026-10-12"/);
});
test('custom historical and single-day windows retain actual readings without fabricating a line',()=>{
 const html=context.chartMarkup(metric('weight',[{on:'2025-01-01',value:99},{on:'2026-10-12',value:93}]),'kg',{from:'2025-01-01',to:'2025-01-01'},now,320);
 assert.match(html,/99\.0 kg/);assert.match(html,/One reading/);assert.doesNotMatch(html,/polyline|NaN|Infinity|data-on="2026-10-12"/);
});
test('invalid calendar and reversed custom windows are rejected before plotting',()=>{
 const rows=metric('weight',[]);
 for(const dates of [{from:'2026-02-30',to:'2026-03-01'},{from:'2026-10-12',to:'2026-10-01'}])assert.throws(()=>context.chartMarkup(rows,'kg',dates,now),/Choose a To date/);
});
