import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchPublicProofText} from '../release/public-proof-text-fetch.mjs';
const reset=()=>Object.assign(new TypeError('fetch failed'),{cause:{code:'ECONNRESET'}});
test('connection reset retries one public request with a finite delay and retains evidence',async()=>{
 let calls=0;const waits=[];const r=await fetchPublicProofText('https://example.com/public',{pause:async n=>waits.push(n),fetcher:async()=>{if(++calls===1)throw reset();return new Response('exact approved body')}});
 assert.deepEqual(r,{status:200,body:'exact approved body',attempts:2,transportFailures:[{attempt:1,code:'ECONNRESET'}]});assert.deepEqual(waits,[250]);
});
test('body transport failure retries the complete response, never a partial body',async()=>{
 let calls=0;const r=await fetchPublicProofText('https://example.com/public',{pause:async()=>{},fetcher:async()=>++calls===1?{status:200,text:async()=>{throw reset()}}:new Response('complete')});assert.equal(r.body,'complete');assert.equal(r.attempts,2);
});
test('persistent transport failure stops after three attempts',async()=>{
 let calls=0;const waits=[];await assert.rejects(()=>fetchPublicProofText('https://example.com/public',{pause:async n=>waits.push(n),fetcher:async()=>{calls++;throw reset()}}),/fetch failed/);assert.equal(calls,3);assert.deepEqual(waits,[250,500]);
});
test('HTTP failures and arbitrary programming or assertion errors do not retry',async()=>{
 let calls=0;const r=await fetchPublicProofText('https://example.com/public',{fetcher:async()=>{calls++;return new Response('not found',{status:404})}});assert.equal(r.status,404);assert.equal(r.attempts,1);assert.equal(calls,1);
 for(const error of [new Error('bad code'),new assert.AssertionError({message:'changed content'})]){calls=0;await assert.rejects(()=>fetchPublicProofText('https://example.com/public',{fetcher:async()=>{calls++;throw error}}));assert.equal(calls,1)}
});
