import test from 'node:test';
import assert from 'node:assert/strict';
import {screenForumText} from '../member-experience/timber-shed-community-bouncer.mjs';
import {routinePublicationDecision} from '../member-experience/timber-shed-routine-publication.mjs';
const decide=input=>routinePublicationDecision(input,screenForumText(input));
test('recognised ordinary conversation can pass without treating all unflagged text as safe',()=>{
 for(const input of [{title:'Weekend plans',body:'I went for a walk today. It felt good to get outside.'},{body:'Sounds like a good plan. Hope you have a lovely weekend.'},{title:'A small win this week',body:'Made time for a lunchtime walk this week.'}])assert.equal(decide(input).publish,true);
 assert.equal(decide({title:'Weekend plans',body:'Some unfamiliar but apparently ordinary wording.'}).publish,false);
});
test('mixed harmful, sensitive, identifying, obfuscated and unknown messages never gain positive recognition',()=>{
 const samples=['I went for a walk today. You should die.','I went for a walk today. Take 5 mg.','I went for a walk today. My address is 12 High Street.','I went for a walk today. My anxiety has been difficult.','I went for a walk today. DM me for spare pens.','I went for a walk today. http://example.test','I went for a walk today; hurt someone','I wеnt for a walk today.','I went for a walk today. <script>bad</script>','I went for a walk today. 12345','I went for a walk today. Well done for starving.'];
 for(const body of samples)assert.equal(decide({title:'Weekend plans',body}).publish,false,body);
});
test('missing, stale, flagged or uncertain triage is always a hold',()=>{
 const input={title:'Weekend plans',body:'I went for a walk today.'},screen=screenForumText(input);
 for(const result of [null,{...screen,policyVersion:'old'},{...screen,severity:'review'},{...screen,categories:['unknown']}])assert.equal(routinePublicationDecision(input,result).publish,false);
});
