import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {deviceHealthSyncRoute,appendDeviceHealthExport} from '../device-health-sync.mjs';

// Synthetic data only. Exercise the candidate's actual auth, consent, routes,
// migration and SQL against a local database; no remote service is contacted.
const origin='https://isolated-health-test.invalid';
async function digest(value){return Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex')}
async function fixture(t,{migrate=true}={}){
 const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
 sqlite.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE users(id INTEGER PRIMARY KEY);
 CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
 CREATE TABLE consents(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,consent_type TEXT,granted INTEGER);`);
 if(migrate)sqlite.exec(readFileSync(new URL('../../migrations/021_device_health_sync.sql',import.meta.url),'utf8'));
 for(const id of [1,2]){
  sqlite.prepare('INSERT INTO users(id) VALUES(?)').run(id);
  sqlite.prepare('INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').run(id,id,await digest('synthetic-session-'+id),new Date(Date.now()+3600000).toISOString());
  sqlite.prepare('INSERT INTO consents(user_id,consent_type,granted) VALUES(?,?,1)').run(id,'my_shift_health_tracking');
 }
 function statement(sql,values=[]){return {
  bind(...args){return statement(sql,args)},
  async first(){return sqlite.prepare(sql).get(...values)??null},
  async all(){return {results:sqlite.prepare(sql).all(...values)}},
  async run(){return {success:true,meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}}}
 }}
 const DB={prepare:statement,async batch(statements){
  sqlite.exec('BEGIN');try{const output=[];for(const stmt of statements)output.push(await stmt.run());sqlite.exec('COMMIT');return output}catch(error){sqlite.exec('ROLLBACK');throw error}
 }};
 const env={DB};
 const reading=(type='weight_kg',value=92.4,id='synthetic-reading')=>({type,value,sourceRecordId:id,observedAt:new Date(Date.now()-60000).toISOString()});
 function request(path,method='GET',body,userId=1,requestOrigin=origin){
  const headers={};if(userId!==null)headers.Cookie='sst_session=synthetic-session-'+userId;
  if(requestOrigin!==null)headers.Origin=requestOrigin;
  return new Request(origin+path,{method,headers,...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
 }
 const route=(path,method,body,userId,requestOrigin)=>deviceHealthSyncRoute(request(path,method,body,userId,requestOrigin),env);
 const sync=(userId=1,platform='apple_health',readings=[reading()])=>route('/v1/device-health/readings','POST',{platform,readings},userId);
 const count=()=>Number(sqlite.prepare('SELECT count(*) AS n FROM device_health_readings').get().n);
 const consent=(id,granted)=>sqlite.prepare('INSERT INTO consents(user_id,consent_type,granted) VALUES(?,?,?)').run(id,'my_shift_health_tracking',granted?1:0);
 return {sqlite,env,reading,request,route,sync,count,consent};
}

test('missing health migration fails closed without touching health data',async t=>{
 const f=await fixture(t,{migrate:false});const r=await f.route('/v1/device-health/status');assert.equal(r.status,503);assert.equal((await r.json()).error,'health_sync_not_ready');
});
test('missing, expired and revoked sessions cannot read or import health data',async t=>{
 const f=await fixture(t);
 assert.equal((await f.route('/v1/device-health/readings','GET',undefined,null)).status,401);
 f.sqlite.prepare('UPDATE user_sessions SET expires_at=? WHERE id=1').run('2000-01-01T00:00:00Z');assert.equal((await f.sync()).status,401);
 f.sqlite.prepare('UPDATE user_sessions SET revoked_at=? WHERE id=2').run(new Date().toISOString());assert.equal((await f.sync(2)).status,401);assert.equal(f.count(),0);
});
test('explicit health consent gates imports and suppresses readings after withdrawal',async t=>{
 const f=await fixture(t);f.consent(1,false);assert.equal((await f.sync()).status,409);assert.equal(f.count(),0);
 f.consent(1,true);assert.equal((await f.sync()).status,201);f.consent(1,false);
 const r=await f.route('/v1/device-health/readings');assert.deepEqual(await r.json(),{ok:true,trackingEnabled:false,latest:{}});
 assert.equal((await f.sync()).status,409);assert.equal(f.count(),1);
});
test('missing and foreign origin cannot import or disconnect',async t=>{
 const f=await fixture(t);for(const requestOrigin of [null,'https://untrusted.invalid']){
  assert.equal((await f.route('/v1/device-health/readings','POST',{platform:'apple_health',readings:[f.reading()]},1,requestOrigin)).status,403);
  assert.equal((await f.route('/v1/device-health/connection','DELETE',{platform:'apple_health'},1,requestOrigin)).status,403);
 }assert.equal(f.count(),0);
});
test('Apple and Android imports save the expected units without storing raw source IDs',async t=>{
 const f=await fixture(t);for(const platform of ['apple_health','health_connect']){
  const r=await f.sync(1,platform,[f.reading('systolic_mmhg',128),f.reading('heart_rate_bpm',70)]);assert.equal(r.status,201);
 }
 const rows=f.sqlite.prepare('SELECT * FROM device_health_readings').all();assert.equal(rows.length,4);
 for(const row of rows){assert.match(row.source_record_hash,/^[a-f0-9]{64}$/);assert.equal(row.unit,row.type==='systolic_mmhg'?'mmHg':'bpm');assert.ok(!JSON.stringify(row).includes('synthetic-reading'))}
});
test('retrying an import updates the same record instead of duplicating it',async t=>{
 const f=await fixture(t);await f.sync();await f.sync(1,'apple_health',[f.reading('weight_kg',91.5)]);
 assert.equal(f.count(),1);assert.equal(f.sqlite.prepare('SELECT value FROM device_health_readings').get().value,91.5);
});
test('same source ID in different member accounts remains isolated',async t=>{
 const f=await fixture(t);await f.sync(1);await f.sync(2,'apple_health',[f.reading('weight_kg',106)]);
 assert.equal(f.count(),2);assert.equal((await (await f.route('/v1/device-health/readings')).json()).latest.weight_kg.value,92.4);
 assert.equal((await (await f.route('/v1/device-health/readings','GET',undefined,2)).json()).latest.weight_kg.value,106);
});
test('latest readings are selected by observation time rather than upload time',async t=>{
 const f=await fixture(t);await f.sync();await f.sync(1,'health_connect',[{...f.reading('weight_kg',100,'older'),observedAt:new Date(Date.now()-86400000).toISOString()}]);
 const data=await (await f.route('/v1/device-health/readings')).json();assert.equal(data.latest.weight_kg.value,92.4);
});
test('invalid mixed batches are rejected atomically',async t=>{
 const f=await fixture(t);const r=await f.sync(1,'apple_health',[f.reading(),f.reading('systolic_mmhg',900)]);assert.equal(r.status,400);assert.equal(f.count(),0);
 assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM device_health_connections').get().n,0);
});
test('malformed, empty, oversized and over-count requests are rejected',async t=>{
 const f=await fixture(t);assert.equal((await f.route('/v1/device-health/readings','POST','{bad')).status,400);
 assert.equal((await f.sync(1,'apple_health',[])).status,400);
 assert.equal((await f.sync(1,'apple_health',Array.from({length:151},()=>f.reading()))).status,400);
 assert.equal((await f.route('/v1/device-health/readings','POST','x'.repeat(131073))).status,413);assert.equal(f.count(),0);
});
test('storage failures return retryable failure rather than claiming sync succeeded',async t=>{
 const f=await fixture(t);f.env.DB.batch=async()=>{throw new Error('synthetic database outage')};const r=await f.sync();assert.equal(r.status,503);assert.equal((await r.json()).error,'health_sync_failed');assert.equal(f.count(),0);
});
test('disconnect is scoped to the member and platform and preserves historical readings',async t=>{
 const f=await fixture(t);await f.sync(1);await f.sync(1,'health_connect');await f.sync(2);
 const r=await f.route('/v1/device-health/connection','DELETE',{platform:'apple_health'});assert.equal(r.status,200);
 const rows=f.sqlite.prepare('SELECT user_id,platform,enabled FROM device_health_connections ORDER BY user_id,platform').all().map(r=>({...r}));
 assert.deepEqual(rows,[{user_id:1,platform:'apple_health',enabled:0},{user_id:1,platform:'health_connect',enabled:1},{user_id:2,platform:'apple_health',enabled:1}]);assert.equal(f.count(),3);
});
test('privacy export includes only the signed-in member and omits source hashes',async t=>{
 const f=await fixture(t);await f.sync(1);await f.sync(2,'apple_health',[f.reading('weight_kg',106)]);
 const r=await appendDeviceHealthExport(f.request('/v1/privacy/export','POST',{}),f.env,Response.json({member:'synthetic-member'}));
 const data=await r.json();assert.equal(data.connectedHealth.readings.length,1);assert.equal(data.connectedHealth.readings[0].value,92.4);assert.ok(!JSON.stringify(data).includes('source_record_hash'));
});
test('account deletion cascades to connected-health records',async t=>{
 const f=await fixture(t);await f.sync(1);await f.sync(2);f.sqlite.prepare('DELETE FROM users WHERE id=1').run();
 assert.equal(f.count(),1);assert.equal(f.sqlite.prepare('SELECT user_id FROM device_health_readings').get().user_id,2);
});
test('health responses discourage caching and indexing',async t=>{
 const f=await fixture(t);const r=await f.route('/v1/device-health/status');assert.equal(r.headers.get('Cache-Control'),'no-store, private');assert.equal(r.headers.get('Vary'),'Cookie');assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow');
});
test('a missing measurement rejects the whole import instead of saving a false zero',async t=>{
 const f=await fixture(t);const r=await f.sync(1,'apple_health',[f.reading(),f.reading('steps',null)]);
 assert.equal(r.status,400);assert.equal((await r.json()).error,'invalid_reading');assert.equal(f.count(),0);
});
