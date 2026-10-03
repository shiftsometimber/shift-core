// Provision only the exact dedicated, private two-fixture health acceptance service.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');
assert.equal(process.env.GITHUB_REF,'refs/heads/codex/health-harness-provision-20261003');
const account='9e5386dcf455be34c582d93f8bfc79e6',name='shift-my-timber-health-test',databaseName='shift-my-timber-health-test-db';
const dir='health-harness-proof';mkdirSync(dir,{recursive:true});
const cf=async(path,method='GET',body)=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const j=await r.json();assert(r.ok&&j.success,'Cloudflare request failed '+r.status+' '+JSON.stringify((j.errors||[]).map(e=>e.code)));return j.result;};
const [databases,workers]=await Promise.all([cf('/d1/database'),cf('/workers/scripts')]);
assert(!databases.some(d=>d.name===databaseName),'Named test database already exists; do not reuse or overwrite it');
assert(!workers.some(w=>w.id===name),'Named test Worker already exists; do not overwrite it');
const main=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/contents/wrangler.jsonc?ref=main',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(20000)});assert(main.ok);
const mainSource=Buffer.from((await main.json()).content,'base64').toString(),productionIds=[...mainSource.matchAll(/"database_id"\s*:\s*"([a-f0-9-]{36})"/g)].map(m=>m[1]);assert(productionIds.length>=1);
const created=await cf('/d1/database','POST',{name:databaseName});assert.equal(created.name,databaseName);assert.match(created.uuid,/^[a-f0-9-]{36}$/);assert(!productionIds.includes(created.uuid));
const receipt={at:new Date().toISOString(),source:process.env.GITHUB_SHA,applicationSource:'df392f22d3167b51d9401b011d0ed24411ccff0b',database:{id:created.uuid,name:created.name},worker:name,productionDatabaseUsed:false,productionWorkerChanged:false,physicalDeviceAcceptance:false,ready:false,privateAccessCodeRetainedInReport:false};
const save=()=>writeFileSync(dir+'/receipt.json',JSON.stringify(receipt,null,2));save();
const cli=(args,input)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',input,maxBuffer:4e6});
execFileSync(process.execPath,['my-timber-app/scripts/configure-health-test.mjs',created.uuid],{stdio:'pipe'});
const config='my-timber-app/health-test/wrangler.health-test.json';
for(const sql of ['my-timber-app/health-test/schema.sql','migrations/021_device_health_sync.sql'])cli(['d1','execute',databaseName,'--remote','--config',config,'--file',sql]);
const output=cli(['deploy','--config',config]),urls=[...output.matchAll(/https:\/\/shift-my-timber-health-test\.[a-z0-9-]+\.workers\.dev/g)].map(m=>m[0]);assert(urls.length);const origin=urls.at(-1);receipt.origin=origin;save();
// This setup credential is generated here, never written to an artifact, and
// deliberately unavailable after this job. Rotate it privately for device testing.
const code=randomBytes(32).toString('base64url');cli(['secret','put','HEALTH_TEST_ACCESS_CODE','--config',config],code+'\n');
let ready=false;for(let n=0;n<12;n++){const r=await fetch(origin+'/v1/device-health/test-environment',{signal:AbortSignal.timeout(10000)});if(r.status===200&&(await r.json()).environment==='isolated-health-test'){ready=true;break;}await new Promise(resolve=>setTimeout(resolve,5000));}assert(ready,'New test service did not become ready');
const checks=[];
async function call(path,{cookie,body,method=body===undefined?'GET':'POST',expected=200}={}){
 const r=await fetch(origin+path,{method,redirect:'error',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});assert.equal(r.status,expected,path);checks.push({path,method,status:r.status});return r;
}
await call('/health-test/sign-in',{body:{member:101,code:'invalid-access-code'},expected:401});
await call('/v1/device-health/readings',{expected:401});
const sessions={};for(const member of [101,102]){const r=await call('/health-test/sign-in',{body:{member,code}});const cookie=r.headers.get('set-cookie');assert(cookie?.includes('HttpOnly')&&cookie.includes('Secure')&&cookie.includes('SameSite=Strict'));sessions[member]=cookie.split(';')[0];}
const observedAt=new Date(Date.now()-60000).toISOString();
const payload=value=>({platform:'apple_health',readings:[{type:'weight_kg',value,sourceRecordId:'fictional-online-harness-check',observedAt}]});
await call('/v1/device-health/readings',{cookie:sessions[101],body:payload(92.4),expected:409});
for(const member of [101,102])await call('/health-test/consent',{cookie:sessions[member],body:{enabled:true}});
await call('/v1/device-health/readings',{cookie:sessions[101],body:payload(92.4),expected:201});
await call('/v1/device-health/readings',{cookie:sessions[102],body:payload(106),expected:201});
await call('/v1/device-health/readings',{cookie:sessions[101],body:payload(91.5),expected:201});
for(const[member,value]of [[101,91.5],[102,106]]){const data=await(await call('/v1/device-health/readings',{cookie:sessions[member]})).json();assert.equal(data.latest.weight_kg.value,value);const exported=await(await call('/v1/privacy/export',{cookie:sessions[member],body:{}})).json();assert(Array.isArray(exported.connectedHealth.readings));assert.equal(exported.connectedHealth.readings.length,1);assert.equal(exported.connectedHealth.readings[0].value,value);}
await call('/health-test/consent',{cookie:sessions[101],body:{enabled:false}});
await call('/v1/device-health/readings',{cookie:sessions[101],body:payload(91.5),expected:409});
const withdrawn=await(await call('/v1/device-health/readings',{cookie:sessions[101]})).json();assert.deepEqual(withdrawn.latest,{});
await call('/health-test/clear',{cookie:sessions[101],body:{}});
const other=await(await call('/v1/device-health/readings',{cookie:sessions[102]})).json();assert.equal(other.latest.weight_kg.value,106);
await call('/health-test/clear',{cookie:sessions[102],body:{}});
for(const member of [101,102])await call('/health-test/sign-out',{cookie:sessions[member],body:{}});
await call('/v1/device-health/readings',{cookie:sessions[101],expected:401});
// Only this newly-created test database is cleaned. No test health values or
// sessions remain between the automated proof and tomorrow's device session.
await cf('/d1/database/'+created.uuid+'/query','POST',{batch:['user_sessions','consents','device_health_readings','device_health_connections'].map(table=>({sql:'DELETE FROM '+table,params:[]}))});
const count=await cf('/d1/database/'+created.uuid+'/query','POST',{sql:'SELECT (SELECT count(*) FROM users) members,(SELECT count(*) FROM user_sessions) sessions,(SELECT count(*) FROM consents) consents,(SELECT count(*) FROM device_health_readings) readings,(SELECT count(*) FROM device_health_connections) connections;'});
const totals=count[0].results[0];assert.deepEqual(totals,{members:2,sessions:0,consents:0,readings:0,connections:0});
receipt.ready=true;receipt.checkedAt=new Date().toISOString();receipt.checks=checks;receipt.fixtureIsolationAndRetryVerified=true;receipt.fixtureConsentWithdrawalExportEraseVerified=true;receipt.afterCounts=totals;receipt.nextAction='Rotate HEALTH_TEST_ACCESS_CODE privately, then build signed debug devices against the recorded exact origin and perform OS permission/sync acceptance.';save();
console.log('PASS: newly isolated health harness; two synthetic accounts; consent, retry, export and erasure verified; test readings/sessions cleared. Physical devices remain untested.');
