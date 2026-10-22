import test from 'node:test';
import assert from 'node:assert/strict';
import {runSyntheticSmoke} from './timber-shed-ai-synthetic-smoke.mjs';
test('no dedicated key means zero provider requests',async()=>{
 let count=0;
 const result=await runSyntheticSmoke('',async()=>{count++;throw Error('must not call')});
 assert.equal(result.ok,false);assert.equal(result.error,'dedicated_api_key_missing');assert.equal(count,0);
});
test('fictional fixtures are classified without sending real member data',async()=>{
 const calls=[];
 const result=await runSyntheticSmoke('fictional-test-key',async(content,env)=>{
  calls.push({content,env});
  return {ok:true,model:'omni-moderation-latest',severity:'routine',requiresHumanApproval:true,mayAutoPublish:false};
 });
 assert.equal(result.ok,true);assert.equal(result.syntheticOnly,true);assert.equal(calls.length,3);
 assert(result.results.every(x=>x.requiresHumanApproval===true&&x.mayAutoPublish===false));
 assert(calls.every(x=>x.env.TIMBER_SHED_AI_MODERATION_KEY==='fictional-test-key'));
 assert(calls.every(x=>!Object.keys(x.content).some(k=>/member|health|email|weight|user_id/i.test(k))));
 assert(!JSON.stringify(result).includes('fictional-test-key'));
});
test('provider failure stops the smoke check and does not pretend it passed',async()=>{
 let calls=0;
 const result=await runSyntheticSmoke('fictional-test-key',async()=>{
  calls++;return {ok:false,error:'model_unavailable'};
 });
 assert.equal(result.ok,false);assert.equal(result.error,'provider_test_failed');assert.equal(result.completed,0);assert.equal(calls,1);
});
