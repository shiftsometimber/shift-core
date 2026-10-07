import test from 'node:test';
import assert from 'node:assert/strict';
import {withLiveRequestRetry} from './live-request-retry.cjs';
const wait=async()=>{};
test('temporary HTTP errors retry the same read and retain the final response',async()=>{
 for(const status of [429,500,502,503,504]){
  let calls=0;const final={response:{status:200},text:'exact content'};
  assert.equal(await withLiveRequestRetry(async()=>++calls===1?{response:{status},text:'temporary'}:final,{wait}),final);
  assert.equal(calls,2);
 }
 let calls=0;const result=await withLiveRequestRetry(async()=>{calls++;return {status:500}},{wait});assert.equal(calls,3);assert.equal(result.status,500);
});
test('browser timeouts are bounded and successful responses still undergo original assertions',async()=>{
 let calls=0;const response={status:()=>200};assert.equal(await withLiveRequestRetry(async()=>{if(++calls<3)throw Object.assign(new Error('navigation timed out'),{name:'TimeoutError'});return response},{wait}),response);assert.equal(calls,3);
 calls=0;await assert.rejects(withLiveRequestRetry(async()=>{calls++;throw Object.assign(new Error('timeout'),{name:'TimeoutError'})},{wait}),/timeout/);assert.equal(calls,3);
 const bad=await withLiveRequestRetry(async()=>({status:()=>404}),{wait});assert.throws(()=>assert.equal(bad.status(),200));
});
test('permanent responses and content failures are never retried or accepted',async()=>{
 for(const status of [400,401,403,404]){let calls=0;assert.equal((await withLiveRequestRetry(async()=>{calls++;return {status}},{wait})).status,status);assert.equal(calls,1);}
 let calls=0;await assert.rejects(withLiveRequestRetry(async()=>{calls++;assert.equal('changed copy','approved copy')},{wait}),assert.AssertionError);assert.equal(calls,1);
});
