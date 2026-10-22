import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {screenForumText,bouncerSubmissionNotice,BOUNCER_NAME,BOUNCER_TAGLINE,BOUNCER_VERSION} from '../member-experience/timber-shed-community-bouncer.mjs';
test('SHIFT Community Bouncer identity is exact and does not pretend to be clinical',()=>{
 assert.equal(BOUNCER_NAME,'SHIFT Community Bouncer');
 assert.equal(BOUNCER_TAGLINE,"Everyone’s welcome. Hassle isn’t.");
 assert.match(BOUNCER_VERSION,/bouncer-rules/);
});
test('ordinary conversations are never auto-published',()=>{
 for(const body of ['I took a walk after work and felt better.','A decent brew and a chat help me unwind.','My favourite dinner is homemade soup.']){
  const result=screenForumText({title:'A normal conversation',body});
  assert.equal(result.severity,'routine');
  assert.equal(result.priority,3);
  assert.equal(result.mayAutoPublish,false);
  assert.equal(result.requiresHumanApproval,true);
  assert.equal(result.requiresSafeguardingSignoff,false);
 }
});
test('potential immediate risk gets critical priority and honest emergency guidance',()=>{
 const result=screenForumText({body:"I am going to end my life tonight."});
 assert.equal(result.severity,'critical');
 assert.equal(result.priority,0);
 assert(result.categories.includes('immediate-safety'));
 assert(result.requiresSafeguardingSignoff);
 const notice=bouncerSubmissionNotice(result);
 assert.match(notice,/999/);
 assert.match(notice,/not an emergency service/);
 assert.match(notice,/nobody may see it immediately/);
});
test('sensitive wellbeing, eating disorder, medication and threats are held for review',()=>{
 for(const [body,category,severity] of [
  ['I am struggling with depression and need a friendly conversation.','mental-wellbeing','review'],
  ['I am worried about bulimia and eating habits.','eating-disorder','high'],
  ['Should I double my dose this weekend?','medication','high'],
  ['I have been thinking about self-harm recently.','self-harm','high'],
  ['I am worried about my cocaine addiction.','substance-use','high'],
  ['I will hurt you if you reply.','harassment','high'],
  ['My address is 12 Example Street.','personal-information','high'],
  ['Visit https://example.com for information.','personal-information','high']
 ]){
  const result=screenForumText({body});
  assert(result.categories.includes(category),category+' missing');
  assert.equal(result.severity,severity,category);
  assert.equal(result.mayAutoPublish,false);
 }
});
test('multiple categories have deterministic priority without copying source text',()=>{
 const body='I am worried about my depression and bulimia.';
 const result=screenForumText({title:'I need a conversation',body});
 assert.deepEqual(result.categories,['eating-disorder','mental-wellbeing']);
 assert.equal(result.severity,'high');
 assert.equal(result.priority,1);
 assert.equal(result.policyVersion,BOUNCER_VERSION);
 assert(!JSON.stringify(result).includes('bulimia'));
 assert(!JSON.stringify(result).includes('depression'));
 assert(Object.isFrozen(result));
});
test('input is bounded and never read from health records or third parties',()=>{
 assert.throws(()=>screenForumText({body:null}),/invalid_content/);
 assert.equal(screenForumText({body:'A friendly hello'}).severity,'routine');
 const src=readFileSync(new URL('../member-experience/timber-shed-community-bouncer.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|member_state|health_records|clinical_records|api\.openai|api\.anthropic/);
});
