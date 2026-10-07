import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {acquisitionClient} from './client.mjs';
import {AI_REFERRER_HOSTS,normaliseAcquisition,VERSION} from './model.mjs';
import {fixture} from './fixture.mjs';
import {activationScorecard} from '../activation-measurement/scorecard.mjs';
function browser({referrer='',path='/programme',consented=true,stored=new Map()}={}){
 const listeners={},window={addEventListener:(name,fn)=>listeners[name]=fn};
 if(consented)stored.set('sstConsentV3',JSON.stringify({acquisition:true,acquisitionVersion:VERSION,analytics:false,updatedAt:new Date(Date.now()-100).toISOString()}));
 const localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
 vm.runInNewContext(acquisitionClient,{window,document:{referrer},location:new URL('https://shiftsometimber.co.uk'+path),URL,Date,localStorage,fetch:()=>{throw Error('Unexpected network')}});
 return {api:window.SSTAcquisition,stored,listeners};
}
test('dedicated AI hosts become bounded labels without retaining prompts or URLs',()=>{
 for(const [host,source] of Object.entries(AI_REFERRER_HOSTS)){
  for(const prefix of ['','www.']){
   const b=browser({referrer:'https://'+prefix+host+'/conversation/private-health-prompt?query=not-kept'});
   const value=b.api.registration();assert.equal(value.source,source);assert.equal(value.medium,'referral');
   assert.equal(normaliseAcquisition(value).source,source);
   assert.doesNotMatch(JSON.stringify(value),/private-health|not-kept|conversation|https|query/);
  }
 }
});
test('lookalike, nested and unsupported hosts are never named assistants',()=>{
 for(const referrer of ['https://chatgpt.com.attacker.invalid/','https://fakechatgpt.com/','https://not-copilot.microsoft.com/','https://user.chatgpt.com/','https://x.ai/'])assert.equal(browser({referrer}).api.registration().source,'referral');
 for(const referrer of ['file://chatgpt.com/private','ftp://claude.ai/private'])assert.equal(browser({referrer}).api.registration(),null);
});
test('embedded AI is not guessed from ordinary search and social sources',()=>{
 for(const [referrer,source] of [['https://www.google.com/search?q=private','google'],['https://www.bing.com/search?q=private','bing'],['https://www.facebook.com/','facebook'],['https://www.instagram.com/','instagram'],['https://x.com/','x']])assert.equal(browser({referrer}).api.registration().source,source);
});
test('AI needs explicit consent and no new source on private paths',()=>{
 assert.equal(browser({referrer:'https://chatgpt.com/',consented:false}).api.registration(),null);
 for(const path of ['/member/dashboard','/my-timber','/checkout','/v1/me','/%6dember-login'])assert.equal(browser({path,referrer:'https://claude.ai/'}).api.registration(),null);
});
test('first source stays fixed across later AI referrals and withdrawal',()=>{
 const first=browser({referrer:'https://chatgpt.com/'}),before=JSON.stringify(first.api.registration());
 const later=browser({referrer:'https://grok.com/',stored:first.stored});assert.equal(JSON.stringify(later.api.registration()),before);
 later.stored.set('sstConsentV3',JSON.stringify({acquisition:false}));later.listeners.storage({key:'sstConsentV3'});assert.equal(later.api.registration(),null);
});
test('AI labels retain referral medium and reject invalid or duplicate tags',()=>{
 for(const source of new Set(Object.values(AI_REFERRER_HOSTS))){
  assert.equal(browser({path:'/programme?utm_source='+source+'&utm_medium=referral'}).api.registration().source,source);
  assert.equal(browser({path:'/programme?utm_source='+source+'&utm_medium=organic'}).api.registration(),null);
  assert.equal(browser({path:'/programme?utm_source='+source+'&utm_medium=referral&utm_source=google'}).api.registration(),null);
 }
});
test('real registration, verification, login and saved Journey reconcile by AI source in SQLite',async t=>{
 const f=fixture(t);
 for(const source of new Set(Object.values(AI_REFERRER_HOSTS))){
  const at=new Date(Date.now()-100).toISOString(),email=source+'@ai-attribution.invalid';
  const response=await f.register(email,{version:VERSION,source,medium:'referral',consent:true,consentAt:at,capturedAt:at,prompt:'not-retained'});
  assert.equal(response.status,201);const body=await response.json();await f.verify(email);
  const {cookie,response:login}=await f.login(email);assert.equal(login.status,200);
  f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(body.user.id);
  assert.equal((await f.save(cookie)).status,200);
 }
 const report=await activationScorecard(f.DB,{now:Date.now()+1000,days:30});
 assert.deepEqual(report.stages.map(s=>s.members),[7,7,7,7]);assert.equal(report.acquisition.attributedMembers,7);assert.equal(report.acquisition.unattributedMembers,0);
 for(const row of report.acquisition.sources){assert.equal(row.medium,'referral');assert.deepEqual([row.registered,row.verified,row.signedIn,row.activated],[1,1,1,1]);}
 assert.doesNotMatch(JSON.stringify(report),/ai-attribution.invalid|not-retained|currentKg|token_hash/);
});
