import test from 'node:test';
import assert from 'node:assert/strict';
import {foundationEvidence,FOUNDATION} from '../member-experience/ai-foundation.mjs';
import {retrieveUnifiedKnowledge} from '../shift-brain-v1.js';
import {askTimberRoutes} from '../ask-timber-v1.js';
const unrelated={id:'radar:1',label:'Access to a GP appointment',domain:'health',data_json:JSON.stringify({summary:'Make practical use of an appointment today.'}),authority:100,verified_at:'2026-09-20',source_ref:'https://example.test/unrelated'};
function database(){return{prepare(sql){const st={bind:()=>st,first:async()=>null,all:async()=>({results:sql.includes('FROM shift_knowledge_nodes')?[unrelated]:[]})};return st}}}
test('public protein question excludes authoritative but irrelevant news and includes usable primary sources',async()=>{
 const message='How can I make protein practical when appetite is low without using supplements?';
 assert.deepEqual(await retrieveUnifiedKnowledge(database(),message),[]);
 let prompt;
 const response=await askTimberRoutes(new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',body:JSON.stringify({message,useJourney:false})}),{DB:database(),SHIFT_AI_PRACTICAL_CONTEXT:'true',AI:{run:async(_,input)=>{prompt=input.messages;return{response:{answer:'A small portion of eggs or beans is one manageable protein choice [1].',confidence:'medium'}}}}});
 const result=await response.json();assert.equal(result.ok,true);
 assert(result.sources.some(x=>x.url.includes('/the-eatwell-guide/')));
 assert(result.sources.some(x=>x.url.includes('/small-appetite/')));
 assert(result.sources.some(x=>x.url.includes('/articles/muscle-on-glp1')));
 assert(!result.sources.some(x=>x.url.includes('example.test')));
 assert.match(JSON.stringify(prompt),/malnutrition risk/);
});
test('foundation is subject-specific and does not invent clinical review or permanent freshness',()=>{
 for(const q of ['Make this practical please','What is my saved goal?','How much is 2+2?'])assert.deepEqual(foundationEvidence(q),[]);
 for(const [q,id]of [['protein','eatwell'],['small appetite','small-appetite'],['walking','movement'],['sleep','sleep']])assert(foundationEvidence(q).some(x=>x.id==='foundation:'+id));
 for(const x of foundationEvidence('protein appetite walking sleep')){assert.equal(x.reviewState,'source_checked');assert.equal(x.provenance[0].checkedAt,'2026-09-27');assert(!x.provenance[0].verifiedAt);assert(new URL(x.provenance[0].ref).hostname.endsWith('nhs.uk'));}
 assert.equal(FOUNDATION.length,4);
});
