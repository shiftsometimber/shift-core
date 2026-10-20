import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../../health-passport/fixture.mjs';
import {deviceHealthRoutes} from '../device-health.mjs';
import {createHealthSync,deviceHealthSyncRuntime} from '../device-health-sync-client.mjs';
import vm from 'node:vm';
const request=(body,id=1)=>new Request('https://shiftsometimber.co.uk/v1/device-health',{method:body?'POST':'GET',headers:{Cookie:'sst_session=test-only-member-'+id,Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
const setup=t=>{const f=fixture();t.after(()=>f.close());const call=(action,extra={},id=1)=>deviceHealthRoutes(request({action,platform:'apple_health',expectedAccountId:id,...extra},id),f.env);return{...f,call,read:async(id=1)=>(await deviceHealthRoutes(request(null,id),f.env)).json()};};
const weight=()=>({id:'synthetic-auto-weight',kind:'weight',at:new Date().toISOString(),weightKg:93.2,source:'Synthetic test scales'});
async function connect(f,kinds=['weight']){const r=await f.call('auto-connect',{agreed:true,kinds});assert.equal(r.status,200);return (await r.json()).automaticSync.apple_health.connectionId;}
test('automatic imports require separate explicit consent and a selected supported type',async t=>{
 const f=setup(t);for(const body of [{kinds:['weight']},{agreed:true,kinds:[]},{agreed:true,kinds:['steps']},{agreed:true,kinds:['weight','weight']}])assert.equal((await f.call('auto-connect',body)).status,400);
 await f.call('connect',{agreed:true});assert.equal((await f.call('sync',{readings:[weight()],connectionId:'forged'})).status,409);
 f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");assert.equal((await f.call('auto-connect',{agreed:true,kinds:['weight']})).status,409);
 assert.equal((await f.read()).automaticSync.apple_health.enabled,false);
});
test('real SQLite import survives reopen, deduplicates, tracks checks honestly and preserves manual history',async t=>{
 const f=setup(t),connectionId=await connect(f),reading=weight();
 assert.equal((await f.call('sync',{connectionId,readings:[]})).status,200);let s=await f.read();assert.ok(s.automaticSync.apple_health.lastCheckedAt);assert.equal(s.automaticSync.apple_health.lastSavedAt,null);assert.equal(s.lastImportedAt,null);
 assert.equal((await f.call('sync',{connectionId,readings:[reading]})).status,200);s=await f.read();assert.equal(s.readings.length,1);const savedAt=s.automaticSync.apple_health.lastSavedAt;
 await f.call('sync',{connectionId,readings:[reading]});s=await f.read();assert.equal(s.readings.length,1);assert.equal(s.automaticSync.apple_health.lastSavedAt,savedAt);assert.equal(s.readings[0].source,'Synthetic test scales');assert.equal((await f.read(2)).readings.length,0);
 await f.call('import',{readings:[{...weight(),id:'synthetic-manual-copy'}]});assert.equal((await f.read()).automaticSync.apple_health.connectionId,connectionId);
 assert.equal((await f.call('sync',{connectionId,readings:[{...reading,weightKg:95}]})).status,409);assert.equal((await f.read()).readings.length,2);
});
test('selected types, old connection, disconnect, re-connect, account mismatch and in-transaction revocation all stop automatic writes',async t=>{
 const f=setup(t),connectionId=await connect(f);const hr={id:'synthetic-hr',kind:'heart_rate',heartRate:78,at:new Date().toISOString(),source:'Synthetic watch'};
 assert.equal((await f.call('sync',{connectionId,readings:[hr]})).status,409);
 assert.equal((await f.call('sync',{connectionId,readings:[weight()],expectedAccountId:2})).status,409);
 await f.call('disconnect');await f.call('connect',{agreed:true});assert.equal((await f.read()).automaticSync.apple_health.enabled,false);assert.equal((await f.call('sync',{connectionId,readings:[weight()]})).status,409);
 const newer=await connect(f);assert.notEqual(newer,connectionId);assert.equal((await f.call('sync',{connectionId,readings:[weight()]})).status,409);
 const original=f.DB.batch.bind(f.DB);f.DB.batch=async statements=>{f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'native_health_auto_import_apple_health',0)");return original(statements);};
 assert.equal((await f.call('sync',{connectionId:newer,readings:[weight()]})).status,409);assert.equal((await f.read()).readings.length,0);
});
test('erase withdraws automatic consent without affecting the phone store or another account',async t=>{
 const f=setup(t),connectionId=await connect(f);await f.call('sync',{connectionId,readings:[weight()]});await f.call('erase');await f.call('connect',{agreed:true});assert.equal((await f.read()).readings.length,0);assert.equal((await f.read()).automaticSync.apple_health.enabled,false);assert.equal((await f.call('sync',{connectionId,readings:[weight()]})).status,409);
});
function client(){
 let state={accountId:1,trackingEnabled:true,permissions:{apple_health:true},automaticSync:{apple_health:{enabled:true,connectionId:'connection-1',kinds:['weight']}}},clock=100000,visible=true,readImpl=async()=>({readings:[weight()]}),reads=0;
 const values=new Map(),posts=[],events=[];const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const api=async body=>{if(body){posts.push(body);if(body.expectedAccountId!==state.accountId)throw Error('Account changed');if(body.action==='disconnect')state.automaticSync.apple_health.enabled=false;}return structuredClone(state);};
 const native={platform:'apple_health',automaticImportVersion:1,requestAutomatic:async(...args)=>{reads++;return readImpl(...args)}};
 const c=createHealthSync({api,native:()=>native,storage,active:()=>visible,now:()=>clock,notify:e=>events.push(e)});
 const bind=()=>storage.setItem('my-timber-health-auto-v1',JSON.stringify({accountId:1,platform:'apple_health',connectionId:'connection-1',lastAttemptAt:0}));
 return{c,native,posts,events,bind,storage,get reads(){return reads},setState:s=>state=s,get state(){return state},setRead:f=>readImpl=f,advance:()=>clock+=61000,hide:()=>visible=false};
}
test('connect-once foreground checks save automatically, throttle resumes, and explicit Sync now can refresh',async()=>{
 const f=client();await f.c.sync();assert.equal(f.reads,0);f.bind();await f.c.sync();assert.equal(f.reads,1);assert.equal(f.posts[0].action,'sync');await f.c.sync();assert.equal(f.reads,1);f.advance();await f.c.sync();assert.equal(f.reads,2);await f.c.sync(true);assert.equal(f.reads,3);assert.equal(f.posts[2].connectionId,'connection-1');
});
test('a changed account before or after native read cannot receive this phone’s health data',async()=>{
 const before=client();before.bind();before.state.accountId=2;await before.c.sync();assert.equal(before.reads,0);assert.equal(before.posts.length,0);
 const after=client();after.bind();after.setRead(async()=>{after.state.accountId=2;return{readings:[weight()]}});await after.c.sync();assert.equal(after.posts.length,0);assert.equal(after.storage.getItem('my-timber-health-auto-v1'),null);
});
test('disconnect or leaving the app during a pending read cancels automatic saving',async()=>{
 for(const operation of ['disconnect','hide']){const f=client();f.bind();let finish;f.setRead(()=>new Promise(r=>finish=r));const work=f.c.sync();await new Promise(r=>setImmediate(r));if(operation==='disconnect')await f.c.disconnect('apple_health',1);else{f.hide();f.c.cancel();}finish({readings:[weight()]});await work;assert.equal(f.posts.filter(x=>x.action==='sync').length,0);}
});
test('old bridges, permission refusal, revoked consent and hidden pages never cause silent permission prompts or imports',async()=>{
 const old=client();old.bind();delete old.native.automaticImportVersion;await old.c.sync();assert.equal(old.reads,0);
 const off=client();off.bind();off.state.trackingEnabled=false;await off.c.sync();assert.equal(off.reads,0);
 const denied=client();denied.bind();denied.setRead(async()=>{throw Error('Permission off')});await denied.c.sync();assert.equal(denied.posts.length,0);assert.equal(denied.events.at(-1).state,'error');
 const hidden=client();hidden.bind();hidden.hide();await hidden.c.sync();assert.equal(hidden.reads,0);
});
test('connect explicitly requests selected permission once, refuses changed account and retains no readings in local storage',async()=>{
 const f=client();let args;f.setRead(async(...a)=>{args=a;return{readings:[]}});await f.c.connect(['weight']);assert.deepEqual(args,[1,['weight'],true]);assert.equal(f.posts[0].action,'auto-connect');assert.doesNotMatch(f.storage.getItem('my-timber-health-auto-v1'),/weightKg|readings|token|password/);
 const changed=client();changed.setRead(async()=>{changed.state.accountId=2;return{readings:[]}});await assert.rejects(changed.c.connect(['weight']),/account changed/);assert.equal(changed.posts.length,0);
});
test('generated foreground runtime parses and contains no background worker, timer polling or service registration',()=>{new vm.Script(deviceHealthSyncRuntime);assert.doesNotMatch(deviceHealthSyncRuntime,/setInterval|serviceWorker|BackgroundFetch/);});

test('the operating-system permission sheet may temporarily hide the page without cancelling explicit connection',async()=>{
 const f=client();f.setRead(async()=>{f.c.cancel('hidden');return{readings:[]}});await f.c.connect(['weight']);assert.equal(f.posts[0].action,'auto-connect');
});
test('blocked device storage prevents enabling automatic imports',async()=>{
 const f=client();f.storage.setItem=()=>{throw Error('Storage unavailable')};await assert.rejects(f.c.connect(['weight']),/Storage unavailable/);assert.equal(f.reads,0);assert.equal(f.posts.length,0);
});
