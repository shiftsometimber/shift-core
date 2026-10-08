import test from 'node:test';import assert from 'node:assert/strict';
import {readSiteAnswerWithRetry} from '../release/ai-response-proof.mjs';
const source={url:'https://shiftsometimber.co.uk/life-back',reviewState:'published_site'};
const cached={ok:true,mode:'grounded',journeyUsed:false,delivery:'cached_public',answer:'Life Back offers useful public guidance for your next practical step. [1]',sources:[source]};
const fallback={ok:true,mode:'reviewed_direct',answer:'Direct reviewed extract. [1]',sources:[source]};
const response=value=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json','cf-ray':'synthetic-LHR'}});
test('exact provider fallback retries the same request but only a fully checked cache receipt passes',async()=>{
 let calls=0;const retries=[];const request=async()=>({startedAt:Date.now(),response:response(++calls<3?fallback:cached)});
 assert.equal((await readSiteAnswerWithRetry(request,{sources:[source]},{onRetry:r=>retries.push(r)})).delivery,'cached_public');assert.equal(calls,3);assert.deepEqual(retries,[{attempt:1,edge:'LHR'},{attempt:2,edge:'LHR'}]);
});
test('persistent fallback fails the original strict proof after three attempts',async()=>{let calls=0;await assert.rejects(()=>readSiteAnswerWithRetry(async()=>({response:response((calls++,fallback))})));assert.equal(calls,3);});
test('malformed answers and changed evidence never get a retry or acceptance',async()=>{
 for(const value of [{...cached,delivery:undefined},{...cached,sources:[]},{...cached,answer:'short'},{...fallback,ok:false}]){let calls=0;await assert.rejects(()=>readSiteAnswerWithRetry(async()=>({response:response((calls++,value))})));assert.equal(calls,1);}
});
test('retry retains the fresh-stream requirement rather than accepting cached or direct JSON',async()=>{let calls=0;await assert.rejects(()=>readSiteAnswerWithRetry(async()=>({response:response(++calls===1?fallback:cached)}),{requireStream:true}));assert.equal(calls,2);});
test('successful answers are read once and invalid attempt limits are rejected',async()=>{let calls=0;const request=async()=>({response:response((calls++,cached))});await readSiteAnswerWithRetry(request);assert.equal(calls,1);for(const attempts of [0,4,1.5])await assert.rejects(()=>readSiteAnswerWithRetry(request,{}, {attempts}));});
