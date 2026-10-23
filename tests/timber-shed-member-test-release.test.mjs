import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMemberTestWorker} from '../member-experience/timber-shed-member-test-entry.mjs';
const env=()=>({MEMBER_AUTH_DB:{},SYNTHETIC_DB:{},TIMBER_SHED_MEMBER_TEST_RELEASE:'true',TIMBER_SHED_TEST_MEMBER_ID:'11245'});
const account={userId:11245,user:{email:'shiftsometimber@gmail.com'}};
const req=(path='/member/timber-shed',init)=>new Request('https://shiftsometimber.co.uk'+path,init);
test('only exact authorised live account receives clearly labelled test forum',async()=>{
 const e=env();let observed;
 const w=createMemberTestWorker(async(_,authEnv)=>{observed=authEnv;return account});
 const r=await w.fetch(req(),e);assert.equal(r.status,200);
 assert.equal(observed.DB,e.MEMBER_AUTH_DB);
 const html=await r.text();assert.match(html,/PRIVATE TEST · TEST ACCOUNT ONLY/);
 assert.match(html,/Recognised everyday posts can appear immediately/);
 assert.match(r.headers.get('Cache-Control'),/no-store/);assert.match(r.headers.get('X-Robots-Tag'),/noindex/);
});
test('account identity cannot be chosen through URL or forged role headers',async()=>{
 const w=createMemberTestWorker(async()=>({userId:99,user:{email:account.user.email}}));
 assert.equal((await w.fetch(req('?role=moderator-one',{headers:{'X-User-Id':'11245'}}),env())).status,404);
 const wrongEmail=createMemberTestWorker(async()=>({userId:11245,user:{email:'other@example.invalid'}}));
 assert.equal((await wrongEmail.fetch(req(),env())).status,404);
});
test('unauthenticated asset and API access denied',async()=>{
 const w=createMemberTestWorker(async()=>({response:new Response(null,{status:401})}));
 for(const path of ['/member/timber-shed','/assets/member-experience/timber-shed-forum.mjs','/v1/timber-shed/forum/latest'])
  assert.equal((await w.fetch(req(path),env())).status,401);
});
test('default off and absent/misbound data fail closed before authentication',async()=>{
 let calls=0;const w=createMemberTestWorker(async()=>{calls++;return account});
 for(const patch of [{TIMBER_SHED_MEMBER_TEST_RELEASE:'false'},{TIMBER_SHED_TEST_MEMBER_ID:'99'},{SYNTHETIC_DB:null}]){
  assert.equal((await w.fetch(req(),{...env(),...patch})).status,404);
 }
 const e=env();e.SYNTHETIC_DB=e.MEMBER_AUTH_DB;assert.equal((await w.fetch(req(),e)).status,404);assert.equal(calls,0);
});
test('no account selector, unrelated site route or alternative host is exposed',async()=>{
 let calls=0;const w=createMemberTestWorker(async()=>{calls++;return account});
 for(const path of ['/','/__synthetic/session','/__synthetic/maintenance','/v1/privacy/export','/member/dashboard'])
  assert.equal((await w.fetch(req(path),env())).status,404);
 assert.equal((await w.fetch(new Request('https://alternate.example/member/timber-shed'),env())).status,404);
 assert.equal(calls,0);
});
test('POST protection stays same-origin through the adapter',async()=>{
 const w=createMemberTestWorker(async()=>account);
 const r=await w.fetch(req('/v1/timber-shed/forum/submit',{method:'POST',headers:{Origin:'https://elsewhere.example','Content-Type':'application/json'},body:'{}'}),env());
 assert.equal(r.status,403);assert.equal((await r.json()).error,'same_origin_required');
});
test('authentication failure is closed and does not disclose internal errors',async()=>{
 const w=createMemberTestWorker(async()=>{throw Error('private database detail')});
 const r=await w.fetch(req(),env());assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/database/);
});

test('direct Shed address renders the same full forum behind the existing account gate',async()=>{
 const w=createMemberTestWorker(async()=>account);
 for(const path of ['/timber-shed','/timber-shed/','/timber-shed?source=direct']){
  const r=await w.fetch(req(path),env());assert.equal(r.status,200);const html=await r.text();
  assert.match(html,/Discussion rooms/);assert.match(html,/Start a conversation/);
  assert.match(html,/PRIVATE TEST · TEST ACCOUNT ONLY/);assert.match(r.headers.get('Cache-Control'),/no-store/);
 }
});
test('direct address does not admit visitors or other member accounts',async()=>{
 const loggedOut=createMemberTestWorker(async()=>({response:new Response(null,{status:401})}));
 const other=createMemberTestWorker(async()=>({userId:99,user:{email:'other@example.invalid'}}));
 assert.equal((await loggedOut.fetch(req('/timber-shed'),env())).status,401);
 assert.equal((await other.fetch(req('/timber-shed'),env())).status,404);
 assert.equal((await createMemberTestWorker(async()=>account).fetch(req('/timber-shed-other'),env())).status,404);
});
