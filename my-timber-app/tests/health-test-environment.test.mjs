import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {healthTestFetch} from '../health-test/worker.mjs';
import {renderHealthTestConfig} from '../scripts/configure-health-test.mjs';

const origin='https://isolated-health-test.example';
async function fixture(t){
 const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
 sqlite.exec(readFileSync(new URL('../health-test/schema.sql',import.meta.url),'utf8'));
 sqlite.exec(readFileSync(new URL('../../migrations/021_device_health_sync.sql',import.meta.url),'utf8'));
 function stmt(sql,args=[]){return{bind(...values){return stmt(sql,values)},async first(){return sqlite.prepare(sql).get(...args)??null},async all(){return{results:sqlite.prepare(sql).all(...args)}},async run(){return{meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}}}
 const env={HEALTH_TEST_ENVIRONMENT:'isolated-health-test',HEALTH_TEST_ACCESS_CODE:'synthetic-private-test-access-code',DB:{prepare:stmt,async batch(items){sqlite.exec('BEGIN');try{const result=[];for(const item of items)result.push(await item.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}}};
 const request=(path,method='GET',body,cookie='',requestOrigin=origin)=>new Request(origin+path,{method,headers:{Origin:requestOrigin,Cookie:cookie},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const call=(...args)=>healthTestFetch(request(...args),env);
 async function login(member){const r=await call('/health-test/sign-in','POST',{member,code:env.HEALTH_TEST_ACCESS_CODE});assert.equal(r.status,200);return r.headers.get('Set-Cookie').split(';')[0]}
 return{sqlite,env,call,request,login};
}
test('test configuration rejects production database IDs and malformed IDs',()=>{
 const template=readFileSync(new URL('../health-test/wrangler.template.jsonc',import.meta.url),'utf8');
 const production='{"d1_databases":[{"database_id":"11111111-1111-1111-1111-111111111111"}]}';
 assert.throws(()=>renderHealthTestConfig(template,production,'11111111-1111-1111-1111-111111111111'),/Production database/);
 assert.throws(()=>renderHealthTestConfig(template,production,'bad'),/UUID/);
 assert.throws(()=>renderHealthTestConfig(template,'{}','22222222-2222-2222-2222-222222222222'),/could not be checked/);
 const config=JSON.parse(renderHealthTestConfig(template,production,'22222222-2222-2222-2222-222222222222'));
 assert.equal(config.d1_databases[0].database_name,'shift-my-timber-health-test-db');assert.equal(config.observability.enabled,false);
});
test('harness fails closed on production origin, missing secret, marker or unexpected members',async t=>{
 const f=await fixture(t);assert.equal((await f.call('/v1/device-health/test-environment')).status,200);
 assert.equal((await healthTestFetch(new Request('https://shiftsometimber.co.uk/v1/device-health/test-environment'),f.env)).status,503);
 assert.equal((await healthTestFetch(new Request('https://preview.shiftsometimber.co.uk/v1/device-health/test-environment'),f.env)).status,503);
 const saved=f.env.HEALTH_TEST_ACCESS_CODE;f.env.HEALTH_TEST_ACCESS_CODE='';assert.equal((await f.call('/v1/device-health/test-environment')).status,503);f.env.HEALTH_TEST_ACCESS_CODE=saved;
 f.sqlite.exec('INSERT INTO users(id) VALUES(999)');assert.equal((await f.call('/v1/device-health/test-environment')).status,503);f.sqlite.exec('DELETE FROM users WHERE id=999');
 f.sqlite.exec('DELETE FROM health_test_environment');assert.equal((await f.call('/v1/device-health/test-environment')).status,503);
});
test('private test sign-in requires the access code, same origin and an allowed account',async t=>{
 const f=await fixture(t);assert.equal((await f.call('/health-test/sign-in','POST',{member:101,code:'wrong'})).status,401);
 assert.equal((await f.call('/health-test/sign-in','POST',{member:999,code:f.env.HEALTH_TEST_ACCESS_CODE})).status,401);
 assert.equal((await f.call('/health-test/sign-in','POST',{member:101,code:f.env.HEALTH_TEST_ACCESS_CODE},'','https://foreign.example')).status,403);
 const cookie=await f.login(101);assert.match(cookie,/sst_session=/);
 assert.equal((await (await f.call('/health-test/account','GET',undefined,cookie)).json()).member,101);
});
test('test accounts exercise actual consent, imports, export, clearing and sign-out independently',async t=>{
 const f=await fixture(t),a=await f.login(101),b=await f.login(102);
 const payload=value=>({platform:'health_connect',readings:[{type:'weight_kg',value,observedAt:new Date().toISOString(),sourceRecordId:'same-device-record'}]});
 assert.equal((await f.call('/v1/device-health/readings','POST',payload(91),a)).status,409);
 for(const cookie of [a,b])assert.equal((await f.call('/health-test/consent','POST',{enabled:true},cookie)).status,200);
 assert.equal((await f.call('/v1/device-health/readings','POST',payload(91),a)).status,201);
 assert.equal((await f.call('/v1/device-health/readings','POST',payload(105),b)).status,201);
 const exported=await (await f.call('/v1/privacy/export','POST',{},a)).json();assert.equal(exported.connectedHealth.readings[0].value,91);assert.equal(exported.connectedHealth.readings.length,1);
 await f.call('/health-test/consent','POST',{enabled:false},a);assert.deepEqual((await (await f.call('/v1/device-health/readings','GET',undefined,a)).json()).latest,{});
 await f.call('/health-test/clear','POST',{},a);assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM device_health_readings WHERE user_id=101').get().n,0);
 assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM device_health_readings WHERE user_id=102').get().n,1);
 await f.call('/health-test/sign-out','POST',{},a);assert.equal((await f.call('/v1/device-health/readings','GET',undefined,a)).status,401);
});
test('harness serves the real connected-health UI and no medicine/payment/email handlers',async t=>{
 const f=await fixture(t);const page=await f.call('/member/dashboard');assert.equal(page.status,200);assert.match(await page.text(),/connectedHealthPanel/);
 assert.equal((await f.call('/checkout')).status,404);assert.equal((await f.call('/v1/orders')).status,404);
});
