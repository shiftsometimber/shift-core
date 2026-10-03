import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../../health-passport/fixture.mjs';
import {deviceHealthRoutes,normaliseDeviceReadings} from '../device-health.mjs';
import {appendHealthExport} from '../health-routes.mjs';
import {privacyHealthErasureRoute} from '../../privacy-health-erasure-route-v1.js';
const req=(body,id=1,headers={})=>new Request('https://shiftsometimber.co.uk/v1/device-health',{method:body?'POST':'GET',headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json',...(id?{Cookie:'sst_session=test-only-member-'+id}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
const readings=()=>[{id:'sample-heart',kind:'heart_rate',at:new Date().toISOString(),heartRate:82,source:'Fictional watch'},{id:'sample-bp',kind:'blood_pressure',at:new Date().toISOString(),systolic:130,diastolic:84,source:'Fictional cuff'},{id:'sample-weight',kind:'weight',at:new Date().toISOString(),weightKg:92.6,source:'Fictional scales'}];
const setup=t=>{const f=fixture();t.after(()=>f.close());return f;};
const action=(f,action,extra={},id=1)=>deviceHealthRoutes(req({action,platform:'apple_health',expectedAccountId:id,...extra},id),f.env);
const read=async(f,id=1)=>(await deviceHealthRoutes(req(null,id),f.env)).json();
test('explicit account-bound consent and optional tracking are required; origin and payload reject unsafe writes',async t=>{
 const f=setup(t);assert.equal((await deviceHealthRoutes(req(null,0),f.env)).status,401);
 assert.equal((await action(f,'connect')).status,400);
 assert.equal((await action(f,'import',{readings:readings()})).status,409);
 assert.equal((await deviceHealthRoutes(req({action:'connect',platform:'apple_health',expectedAccountId:2,agreed:true}),f.env)).status,409);
 assert.equal((await deviceHealthRoutes(req({action:'connect',platform:'apple_health',expectedAccountId:1,agreed:true},1,{Origin:'https://evil.example'}),f.env)).status,403);
 assert.equal((await deviceHealthRoutes(req({action:'connect',platform:'apple_health',expectedAccountId:1,agreed:true},1,{'Sec-Fetch-Site':'cross-site'}),f.env)).status,403);
 f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");assert.equal((await action(f,'connect',{agreed:true})).status,409);
});
test('three typed readings save once, preserve other preferences, survive fresh read and remain private to the member',async t=>{
 const f=setup(t),input=readings(),before=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);
 assert.equal((await action(f,'connect',{agreed:true})).status,200);assert.equal((await action(f,'import',{readings:input})).status,200);
 assert.equal((await read(f)).readings.length,3);assert.deepEqual((await read(f,2)).readings,[]);
 assert.equal((await action(f,'import',{readings:input})).status,200);assert.equal((await read(f)).readings.length,3);
 const after=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);delete after.deviceHealth;assert.deepEqual(after,before);
 assert.equal((await action(f,'import',{readings:[{...input[0],heartRate:95}]})).status,409);
 const row=(await read(f)).readings.find(r=>r.kind==='heart_rate');assert.equal(row.unit,'bpm');assert.equal(row.resting_hr,undefined);
});
test('withdrawal inside transaction and concurrent updates cannot import or overwrite newer records',async t=>{
 const f=setup(t);await action(f,'connect',{agreed:true});const original=f.DB.batch.bind(f.DB);
 f.DB.batch=async statements=>{f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'native_health_import_apple_health',0)");return original(statements);};
 assert.equal((await action(f,'import',{readings:readings()})).status,409);assert.equal((await read(f)).readings.length,0);
 f.DB.batch=original;await action(f,'connect',{agreed:true});
 f.DB.batch=async statements=>{f.db.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.deviceHealth',json(?)) WHERE user_id=1").run(JSON.stringify({readings:[],marker:'newer'}));return original(statements);};
 assert.equal((await action(f,'import',{readings:readings()})).status,409);assert.match(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences,/newer/);
});
test('disconnect denies further imports; export includes imported copies; delete and whole-tracking erasure clear only owned optional data',async t=>{
 const f=setup(t);await action(f,'connect',{agreed:true});await action(f,'import',{readings:readings()});
 await action(f,'disconnect');assert.equal((await action(f,'import',{readings:readings()})).status,409);assert.equal((await read(f)).readings.length,3);
 const exportRequest=new Request('https://shiftsometimber.co.uk/v1/privacy/export',{method:'POST',headers:{Cookie:'sst_session=test-only-member-1'}});
 const exported=await appendHealthExport(exportRequest,f.env,Response.json({ok:true}));assert.equal((await exported.json()).deviceHealth.readings.length,3);
 assert.equal((await action(f,'erase')).status,200);assert.equal((await read(f)).readings.length,0);assert.equal((await read(f)).permissions.apple_health,false);
 await action(f,'connect',{agreed:true});await action(f,'import',{readings:readings()});
 const response=await privacyHealthErasureRoute(new Request('https://shiftsometimber.co.uk/v1/privacy/health-tracking',{method:'DELETE'}),f.env,{},async()=>Response.json({user:{id:1}}));assert.equal(response.status,200);
 const state=await read(f);assert.equal(state.readings.length,0);assert.equal(state.permissions.apple_health,false);assert.equal(state.trackingEnabled,false);assert.ok(f.db.prepare('SELECT id FROM users WHERE id=1').get());
});
test('normalisation rejects mixed units, wrong fields, future/old dates, duplicate keys and oversized imports without writes',()=>{
 for(const bad of [{...readings()[0],heartRate:'82'},{...readings()[0],heartRate:82,weightKg:92},{...readings()[1],systolic:60,diastolic:90},{...readings()[2],weightKg:0},{...readings()[2],weightLbs:200},{...readings()[0],at:'2099-01-01'}, {...readings()[0],source:'bad\nsource'}])assert.throws(()=>normaliseDeviceReadings('apple_health',[bad]));
 assert.throws(()=>normaliseDeviceReadings('other',readings()));const r=readings()[0];assert.throws(()=>normaliseDeviceReadings('apple_health',[r,r]));assert.throws(()=>normaliseDeviceReadings('apple_health',Array(151).fill(r)));
});
