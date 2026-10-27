import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyForumSubmissionWithModel,parseModerationResult,mergeModerationSignals,AI_MODERATION_POLICY,AI_MODERATION_MODEL} from '../member-experience/timber-shed-ai-moderation.mjs';
import {screenForumText} from '../member-experience/timber-shed-community-bouncer.mjs';
const payload=(categories={},flagged=false)=>({model:AI_MODERATION_MODEL,results:[{flagged,categories}]});
const authorised={TIMBER_SHED_AI_MODERATION_ENABLED:'true',TIMBER_SHED_AI_PROVIDER_APPROVED:'true',TIMBER_SHED_AI_MODERATION_KEY:'test-secret-only'};
test('AI moderation does not contact external providers until separately approved',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('should never be called')};
 assert.equal((await classifyForumSubmissionWithModel({body:'Hello there'},{},fetcher)).error,'model_not_authorised');
 assert.equal((await classifyForumSubmissionWithModel({body:'Hello there'},{TIMBER_SHED_AI_MODERATION_ENABLED:'true'},fetcher)).error,'model_not_authorised');
 assert.equal(calls,0);
});
test('server-only model request sends just the deliberately submitted text, never member records',async()=>{
 const calls=[];
 const fetcher=async(url,opts)=>{calls.push({url,opts});return{ok:true,json:async()=>payload({'self-harm':true},true)}};
 const result=await classifyForumSubmissionWithModel({title:'Need some support',body:'This is fictional content.'},authorised,fetcher);
 assert.equal(result.ok,true);assert.equal(result.severity,'high');assert.equal(result.mayAutoPublish,false);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.openai.com/v1/moderations');
 const sent=JSON.parse(calls[0].opts.body);
 assert.deepEqual(Object.keys(sent).sort(),['input','model']);
 assert.equal(sent.model,AI_MODERATION_MODEL);
 assert.equal(sent.input,'Need some support\nThis is fictional content.');
 assert(!calls[0].opts.body.includes('user_id'));
 assert.equal(calls[0].opts.headers.Authorization,'Bearer test-secret-only');
});
test('unknown flags and severe safety signals cannot be silently treated as safe',()=>{
 const severe=parseModerationResult(payload({'self-harm/intent':true},true));
 assert.equal(severe.severity,'critical');assert.equal(severe.priority,0);
 const unknown=parseModerationResult(payload({'new-category':true},true));
 assert.equal(unknown.severity,'high');
 const unflagged=parseModerationResult(payload({'harassment':false},false));
 assert.equal(unflagged.severity,'routine');assert.equal(unflagged.requiresHumanApproval,true);
 assert.equal(unflagged.policyVersion,AI_MODERATION_POLICY);
});
test('invalid, incomplete and nonconforming responses fail closed',()=>{
 for(const item of [null,{},payload({},true),{model:'unexpected',results:[{flagged:false,categories:{}}]}, {model:AI_MODERATION_MODEL,results:[{flagged:'false',categories:{}}]}, {model:AI_MODERATION_MODEL,results:[{flagged:false,categories:{harassment:'false'}}]}]){
  const result=parseModerationResult(item);
  if(item&&item.results?.[0]?.flagged===true&&item.model===AI_MODERATION_MODEL&&item.results[0].categories&&Object.keys(item.results[0].categories).length===0){assert.equal(result.ok,true);assert.equal(result.severity,'high');continue}
  assert.equal(result.ok,false);
 }
});
test('network error, provider failure and missing key do not create a safe result',async()=>{
 const missing=await classifyForumSubmissionWithModel({body:'Fictional text.'},{...authorised,TIMBER_SHED_AI_MODERATION_KEY:''},async()=>{throw Error('must not call')});
 assert.equal(missing.ok,false);
 const down=await classifyForumSubmissionWithModel({body:'Fictional text.'},authorised,async()=>({ok:false,status:429}));
 assert.equal(down.ok,false);
 const failed=await classifyForumSubmissionWithModel({body:'Fictional text.'},authorised,async()=>{throw Error('network down')});
 assert.equal(failed.ok,false);
});
test('two layers combine with most cautious classification and never authorise publication',()=>{
 const rules=screenForumText({body:'I am worried about my medication dose.'});
 const model=parseModerationResult(payload({'self-harm/intent':true},true));
 const combined=mergeModerationSignals(rules,model);
 assert.equal(combined.severity,'critical');
 assert.equal(combined.priority,0);
 assert(combined.categories.includes('model:self-harm/intent'));
 assert.equal(combined.mayAutoPublish,false);
 assert.equal(combined.requiresSafeguardingSignoff,true);
 assert.equal(mergeModerationSignals(rules,{ok:false}).ok,false);
});
