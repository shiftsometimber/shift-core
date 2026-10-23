import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createTimberShedPresentationRoutes} from '../member-experience/timber-shed-presentation.mjs';
const origin='https://shift.test';
const enabled={MEMBER_EXPERIENCE_V1_ENABLED:'true',TIMBER_SHED_PRIVATE_ENABLED:'true'};
test('isolated presentation preserves the approved My Timber entry byte for byte',()=>{
 const expected=execFileSync('git',['show','4e3fcf85c9396260981b495cb2cc5861a76b2734:member-experience/entry.mjs'],{encoding:'utf8'});
 assert.equal(readFileSync(new URL('../member-experience/entry.mjs',import.meta.url),'utf8'),expected);
});
test('default-off presentation and unrelated routes do not authenticate or read data',async()=>{
 let calls=0;const route=createTimberShedPresentationRoutes(async()=>{calls++;return {userId:1}});
 for(const env of [{},{MEMBER_EXPERIENCE_V1_ENABLED:'true'},{TIMBER_SHED_PRIVATE_ENABLED:'true'}]){
  assert.equal((await route(new Request(origin+'/member/timber-shed'),env)).status,404);
 }
 assert.equal(await route(new Request(origin+'/programme'),enabled),null);assert.equal(calls,0);
});
test('member HTML requires an actual positive authenticated account identity',async()=>{
 for(const auth of [{response:Response.json({error:'session_expired'},{status:401})},{userId:0},{userId:'1'}]){
  const route=createTimberShedPresentationRoutes(async()=>auth);
  const response=await route(new Request(origin+'/member/timber-shed'),enabled);
  assert.equal(response.status,401);assert(!await response.text().then(s=>s.includes('shedCompose')));
 }
});
test('authenticated page, HEAD, aliases and private response headers work',async()=>{
 const route=createTimberShedPresentationRoutes(async()=>({userId:1}));
 for(const path of ['/member/timber-shed','/member/timber-shed.html','/member/timber-shed/']){
  const response=await route(new Request(origin+path),enabled);
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/private, no-store/);
  assert.equal(response.headers.get('Vary'),'Cookie');assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
 }
 const response=await route(new Request(origin+'/member/timber-shed',{method:'HEAD'}),enabled);
 assert.equal(response.status,200);assert.equal(await response.text(),'');
 assert.equal((await route(new Request(origin+'/member/timber-shed',{method:'POST'}),enabled)).status,405);
});
test('forum scripts require both forum gates and AI label requires both AI gates',async()=>{
 const route=createTimberShedPresentationRoutes(async()=>({userId:1})),asset=new Request(origin+'/assets/member-experience/timber-shed-forum.mjs');
 for(const env of [enabled,{...enabled,TIMBER_SHED_FORUM_ENABLED:'true'}])assert.equal((await route(asset,env)).status,404);
 const forum={...enabled,TIMBER_SHED_FORUM_ENABLED:'true',TIMBER_SHED_FORUM_PILOT_APPROVED:'true'};
 assert.equal((await route(asset,forum)).status,200);
 assert.match(await (await route(new Request(origin+'/member/timber-shed'),forum)).text(),/id="shedCompose"/);
 assert.doesNotMatch(await (await route(new Request(origin+'/member/timber-shed'),{...forum,TIMBER_SHED_AI_MODERATION_ENABLED:'true'})).text(),/AI-model and rule-based safety screening/);
 assert.match(await (await route(new Request(origin+'/member/timber-shed'),{...forum,TIMBER_SHED_AI_MODERATION_ENABLED:'true',TIMBER_SHED_AI_PROVIDER_APPROVED:'true'})).text(),/AI-model and rule-based safety screening/);
});
