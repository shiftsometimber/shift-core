import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,request,setupInput} from './test-fixture.mjs';
import {coachingRoutes} from './routes.mjs';
import {load,mutate} from './store.mjs';
import {deleteItem} from './privacy.mjs';
const start=async t=>{const DB=fixture(t);assert.equal((await coachingRoutes(request('POST',setupInput(0)),{DB})).status,201);return DB};
for(const [name,edit]of [['replace',s=>{s.audit=[]}],['rewrite',s=>{s.audit[0].reason='forged'}],['append',s=>{s.audit.push({...s.audit[0],id:'forged'})}],['reorder',s=>{s.audit.reverse()}]])test('ordinary mutation cannot '+name+' the saved audit history',async t=>{
 const DB=await start(t);await mutate(DB,1,'second',()=>({}));const before=await load(DB,1);
 await assert.rejects(mutate(DB,1,'third',s=>{edit(s);return {}}),/audit_history_changed/);assert.deepEqual(await load(DB,1),before);
});
test('ordinary mutation appends exactly one truthful internal outcome after the prior history',async t=>{
 const DB=await start(t),before=await load(DB,1);await mutate(DB,1,'member_choice',()=>({outcome:'accepted',dataUsed:[],reason:'explicit_choice'}));const after=await load(DB,1);
 assert.deepEqual(after.state.audit.slice(0,-1),before.state.audit);assert.equal(after.state.audit.length,before.state.audit.length+1);assert.equal(after.state.audit.at(-1).outcome,'accepted');assert.equal(after.state.audit.at(-1).reason,'explicit_choice');
});
test('explicit content deletion removes only deleted evidence IDs while retaining history metadata',async t=>{
 const DB=await start(t),before=await load(DB,1),id=before.state.facts[0].id;
 await mutate(DB,1,'delete-item',s=>deleteItem(s,id));const after=await load(DB,1);
 assert(!after.state.facts.some(f=>f.id===id));assert.deepEqual(after.state.audit.slice(0,-1),before.state.audit.map(e=>({...e,dataUsed:e.dataUsed.filter(x=>x!==id)})));
});
test('deletion cannot rewrite history under the name of an ordinary privacy operation',async t=>{
 const DB=await start(t),before=await load(DB,1);
 await assert.rejects(mutate(DB,1,'delete-item',s=>{s.audit=[];return {}}),/audit_history_changed/);assert.deepEqual(await load(DB,1),before);
});
test('final synchronous cancellation check runs after awaited work and prevents the write',async t=>{
 const DB=await start(t),before=await load(DB,1);let off=false,checked=0;
 await assert.rejects(mutate(DB,1,'night_review',async s=>{await Promise.resolve();s.queue=[];off=true;return {}},Date.now(),{beforeWrite:()=>{checked++;if(off)throw Object.assign(Error('proactive_disabled'),{status:409})}}),/proactive_disabled/);
 assert.equal(checked,1);assert.deepEqual(await load(DB,1),before);
});
test('an asynchronous before-write guard is rejected instead of silently ignored',async t=>{
 const DB=await start(t),before=await load(DB,1);
 await assert.rejects(mutate(DB,1,'night_review',()=>({}),Date.now(),{beforeWrite:async()=>true}),/synchronous_write_guard_required/);assert.deepEqual(await load(DB,1),before);
});
test('duplicate route operation does not add a second event',async t=>{
 const DB=fixture(t),input=setupInput(0);assert.equal((await coachingRoutes(request('POST',input),{DB})).status,201);const before=await load(DB,1);assert.equal((await coachingRoutes(request('POST',input),{DB})).status,200);assert.deepEqual(await load(DB,1),before);
});
