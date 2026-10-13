import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {diagnosticRequest} from '../health-passport/acceptance-diagnostics.mjs';
test('a failed request retains route and timing without session headers or body and is never retried', async () => {
  let calls=0,ticks=[100,30100];
  await assert.rejects(diagnosticRequest(async()=>{calls++;throw new Error('Timeout 30000ms exceeded. cookie: sst_session=fictional-secret Authorization: Bearer fictional-token body: private-note');},{method:'GET',path:'/v1/grub/workspace',now:()=>ticks.shift()}),error=>{
    assert.equal(error.message,'GET /v1/grub/workspace: request error after 30000ms; no retry performed');
    for(const secret of ['fictional-secret','fictional-token','private-note','cookie','Authorization'])assert(!error.message.includes(secret));
    return true;
  });
  assert.equal(calls,1);
});
test('query strings, fragments and arbitrary request metadata cannot enter failure evidence',async()=>{
  const failure=Object.assign(new Error('private payload'),{name:'TimeoutError'});
  await assert.rejects(diagnosticRequest(async()=>{throw failure;},{method:'GET secret',path:'/v1/grub/workspace?token=secret#private',now:()=>100}),/^Error: REQUEST \[private route\]: timeout after 0ms; no retry performed$/);
});
test('successful and unsuccessful HTTP responses retain their exact status and body for existing acceptance assertions',async()=>{
  for(const status of [200,409,503]){
    const response=Response.json({original:true},{status});
    assert.equal(await diagnosticRequest(async()=>response,{method:'GET',path:'/v1/grub/workspace'}),response);
    assert.equal(response.status,status);
    assert.deepEqual(await response.json(),{original:true});
  }
});
test('the final member harness retains its original request options and response/persistence assertions',()=>{
  const source=readFileSync(new URL('../my-timber-final-production.mjs',import.meta.url),'utf8');
  assert(source.includes('context.request.fetch(`${SITE}${path}`,{method,headers:todayHeaders,...(data===undefined?{}:{data})})'));
  assert(source.includes('assert(response.ok(),`${path}: HTTP ${response.status()}`)'));
  assert(source.includes("assert.deepEqual(await account('/v1/grub/workspace'),chosenWorkspace,'An adjustment must preserve the saved Grub workspace')"));
  assert(!source.includes('timeout:60000'));
});
