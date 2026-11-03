import test from 'node:test';import assert from 'node:assert/strict';
import {applyV7Operation,v7State,v7Share,v7NextReason,v7Week} from '../v7-model.mjs';
const at='2026-11-03T12:00:00Z',a={id:'meal-a',name:'Make a familiar dinner',kind:'food',proteinG:45},b={id:'meal-b',name:'An alternative dinner',kind:'food'},context={action:a,alternatives:[b]};
const blank=()=>({revision:0,entries:[],operations:[]});
function op(s,action,rest={},time=at){const next=structuredClone(s);if(applyV7Operation(next,{action,revision:s.revision,operationId:crypto.randomUUID(),...rest},time,context))next.revision++;return next;}
test('one log per London calendar day survives swaps, retries, reloads and another device',()=>{
 let s=op(blank(),'v7-select',{actionId:b.id});s=op(s,'v7-complete',{actionId:b.id});
 const persisted=JSON.parse(JSON.stringify(s));
 for(let i=0;i<5;i++)s=op(s,'v7-complete',{actionId:i%2?a.id:b.id});
 assert.deepEqual(s,persisted);assert.equal(v7State(s,at).count,1);
 assert.throws(()=>op(s,'v7-select',{actionId:a.id}),e=>e.status===409);
 const tomorrow=op(s,'v7-complete',{actionId:a.id},'2026-11-04T12:00:00Z');assert.equal(v7State(tomorrow).count,2);
});
test('Done saves only the action; food totals have no write path',()=>{
 const s={...blank(),foodEaten:{proteinG:40},grubV2:{eaten:40}};
 const after=op(s,'v7-complete',{actionId:a.id,proteinG:99,food:'untrusted'});
 assert.equal(after.foodEaten.proteinG,40);assert.equal(after.grubV2.eaten,40);assert.equal(after.v7.days['2026-11-03'].log.action.proteinG,45);
 assert.equal(after.v7.days['2026-11-03'].log.food,undefined);
});
test('optional feedback and dismissal keep the log; negative feedback explains tomorrow’s change',()=>{
 const s=op(blank(),'v7-complete',{actionId:a.id}),id=s.v7.days['2026-11-03'].log.id;
 assert.equal(v7State(JSON.parse(JSON.stringify(s)),at).count,1);
 for(const outcome of ['helped','not-helped','later']){
  const after=op(s,'v7-feedback',{on:'2026-11-03',logId:id,outcome});assert.equal(v7State(after,at).count,1);
  if(outcome==='not-helped')assert.match(v7NextReason(after,'2026-11-04').text,/different approach/);
 }
 assert.throws(()=>op(s,'v7-feedback',{on:'2026-11-03',logId:'foreign',outcome:'helped'}),e=>e.status===409);
});
test('weight defaults on, off chooses strength, and re-enabling leads with weight',()=>{
 const s=blank();assert.deepEqual(v7State(s,at).preferences,{showWeight:true,lead:'weight',activity:null});
 const off=op(s,'v7-preferences',{showWeight:false});assert.equal(v7State(off,at).preferences.lead,'strength');
 const on=op(off,'v7-preferences',{showWeight:true});assert.equal(v7State(on,at).preferences.lead,'weight');
});
test('a hard week never clears the pile, and Monday resets only the derived weekly count',()=>{
 const s=op(blank(),'v7-complete',{actionId:a.id},'2026-10-25T12:00:00Z');
 assert.equal(v7State(s,'2026-10-26T12:00:00Z').weeklyCount,0);assert.equal(v7State(s,at).count,1);assert.equal(v7State(s,at).returning,true);
 assert.equal(v7Week('2026-10-25'),'2026-10-19');assert.equal(v7Week('2026-10-26'),'2026-10-26');
});
test('30th milestone is awarded once, preserved across retries; sharing cannot expose private fields',()=>{
 let s=blank();for(let n=0;n<30;n++){const t=new Date(Date.UTC(2026,9,1+n,12)).toISOString();s=op(s,'v7-complete',{actionId:a.id},t);}
 const id=s.v7.milestones['30'].id;
 s=op(s,'v7-complete',{actionId:a.id},'2026-10-30T12:00:00Z');s=op(s,'v7-complete',{actionId:a.id},'2026-10-31T12:00:00Z');
 assert.equal(s.v7.milestones['30'].id,id);assert.equal(v7State(s,at).count,30);assert.equal(v7State(s,at).lifetimeCount,31);
 s.privateHealth={weight:100,medicine:'secret'};s.goal='private reason';assert.deepEqual(Object.keys(v7Share(s)).sort(),['brand','logs','milestone','target','title','weekCount'].sort());
 assert.doesNotMatch(JSON.stringify(v7Share(s)),/weight|secret|private reason|protein/);
});
test('London midnight and daylight-saving boundaries use the existing account calendar',()=>{
 let s=op(blank(),'v7-complete',{actionId:a.id},'2026-06-01T22:59:59Z');s=op(s,'v7-complete',{actionId:a.id},'2026-06-01T23:00:00Z');
 assert.equal(Object.keys(s.v7.days).length,2);
 let fall=op(blank(),'v7-complete',{actionId:a.id},'2026-10-25T00:30:00Z');fall=op(fall,'v7-complete',{actionId:a.id},'2026-10-25T01:30:00Z');assert.equal(v7State(fall,at).count,1);
});
