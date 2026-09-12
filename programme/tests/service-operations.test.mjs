import test from 'node:test';
import assert from 'node:assert/strict';
import {sqliteAdapter} from '../test-support/db.mjs';
import {SCHEMA,ProgrammeStore} from '../store.mjs';
import {fixture} from '../test-support/fixtures.mjs';
import {provisionAccount,changeAccess} from '../account-operations.mjs';
import {exportAccount} from '../export.mjs';
import {execute,currentState,publicState} from '../service.mjs';
import {programmeRoutes} from '../routes.mjs';
import {firstMonth} from '../journey-sequence.mjs';
const now='2026-09-13T12:00:00Z';
function setup(){const db=sqliteAdapter(),auth=sqliteAdapter();db.sqlite.exec(SCHEMA);auth.sqlite.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT);INSERT INTO users VALUES(1,'Dave'),(2,'Gaz');");return {env:{DB:auth,PROGRAMME_DB:db,PROGRAMME_V1_ENABLED:'true'},store:new ProgrammeStore(db)}}
test('Provisioning requires an existing member, operator and future expiry, and never overwrites records',async()=>{
 const {env,store}=setup(),input={userId:1,actor:'fixture-operator',reason:'Fictional service test',active:true,expiresAt:'2026-10-13T12:00:00Z'};
 for(const change of [{userId:999},{actor:''},{expiresAt:null},{expiresAt:'2026-01-01T00:00:00Z'}])await assert.rejects(provisionAccount(env,{...input,...change},{now}));
 assert.deepEqual(await provisionAccount(env,input,{now}),{created:true,revision:0});const before=await store.get(1);
 await assert.rejects(provisionAccount(env,input,{now}),e=>e.status===409);assert.deepEqual(await store.get(1),before);assert.equal(await store.get(2),null);
});
test('Expiry is resolved on reads and writes; saved records and manual list changes survive',async()=>{
 const {store}=setup(),s=fixture();s.entitlement={active:true,expiresAt:now};await store.create(1,s);
 const options={fixtureMode:true,now};assert.equal(currentState(s,options).entitlement.active,false);
 await assert.rejects(execute(store,1,{type:'review',revision:0,operationId:'expired-review'},options),e=>e.status===403);
 const result=await execute(store,1,{type:'manual-item',name:'Own item',start:'2026-09-14',revision:0,operationId:'expired-own-item'},options);
 assert.equal(result.entitlement.active,false);assert.deepEqual(result.slots,s.slots);assert.equal(result.manualItems.at(-1).name,'Own item');
 assert.equal(currentState({...s,entitlement:{active:true,expiresAt:'bad'}},options).entitlement.active,false);
});
test('Concurrent operator updates use the same revision guard and keep accepted plans intact',async()=>{
 const {env,store}=setup();await store.create(1,fixture());const before=await store.get(1),input={userId:1,revision:0,actor:'fixture-operator',reason:'Fictional pause',active:false};
 const outcomes=await Promise.allSettled([changeAccess(env,input,{now}),changeAccess(env,input,{now})]);assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
 const after=await store.get(1);assert.equal(after.revision,1);assert.equal(after.entitlement.active,false);assert.deepEqual(after.slots,before.slots);assert.deepEqual(after.acquired,before.acquired);assert.deepEqual(after.reports,before.reports);
 assert.equal(publicState(after,{fixtureMode:true}).serviceEvents,undefined);
});
test('Authenticated export survives service expiry, omits internal operation records and never mutates another account',async()=>{
 const {env,store}=setup();const s=fixture();s.entitlement.active=false;await store.create(1,s);await store.create(2,fixture('Gaz'));
 const deps={authenticate:async()=>({userId:1}),fixtureMode:true},url='https://test.invalid/v1/programme/export?userId=2';
 const r=await programmeRoutes(new Request(url),env,deps);assert.equal(r.status,200);assert.match(r.headers.get('Content-Disposition'),/attachment/);assert.match(r.headers.get('Cache-Control'),/no-store/);
 const data=await r.json();assert.equal(data.record.name,'Dave');assert.equal(data.record.operations,undefined);assert.deepEqual(data.record.slots,s.slots);assert.equal((await store.get(2)).revision,0);
 assert.equal((await programmeRoutes(new Request(url,{method:'POST'}),env,deps)).status,405);
 assert.equal((await programmeRoutes(new Request(url),env,{...deps,authenticate:async()=>({response:new Response(null,{status:401})})})).status,401);
 assert.equal(exportAccount(s).format,'shift-programme-export');
});
test('First month prompts follow real dates without inventing reports or marking actions complete',()=>{
 const s=fixture();s.startedOn='2026-09-01';s.review=null;s.slots=[{id:'future',date:'2026-11-01'}];const before=structuredClone(s);
 const expected=[[1,'start'],[3,'prepare'],[7,'first-review'],[14,'repeat'],[21,'disruption'],[28,'reflect'],[30,'next']];
 for(const [day,key] of expected){const d=new Date('2026-09-01T12:00:00Z');d.setUTCDate(day);assert.equal(firstMonth({...s,clock:d.toISOString().slice(0,10)}).key,key)}
 assert.deepEqual(s,before);assert.equal(firstMonth({...s,clock:'2026-12-01'}).key,'return');assert.equal(firstMonth({...s,review:{summary:'No change needed'}}).key,'review');
});
