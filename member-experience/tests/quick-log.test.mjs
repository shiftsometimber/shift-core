import test from 'node:test';
import assert from 'node:assert/strict';
import {quickLogPayload, createQuickLogFlow, quickLogClient} from '../quick-log.mjs';

const today = '2026-10-24';
const values = extra => ({recordedOn:today,weightUnit:'kg',...extra});
function fixture(overrides={}) {
  let posts=0, reads=0, clears=0;
  const services={
    getMe:async()=>({user:{id:7}}),
    getUnits:async()=>({units:{weight:'stone_lb'}}),
    ensureConsent:async()=>true,
    getConsents:async()=>({consents:[{id:2,consent_type:'my_shift_health_tracking',granted:1}]}),
    getJourney:async()=>({journey:{setup:{paused:false}}}),
    saveProgress:async()=>{posts++;return{ok:true};},
    getSummary:async()=>{reads++;return{progress:{state:'ready',metrics:[{key:'weight',latest:93.2}]}};},
    onClear:()=>{clears++;},...overrides
  };
  return {services,flow:createQuickLogFlow(services),get posts(){return posts;},get reads(){return reads;},get clears(){return clears;}};
}

test('one note is a complete entry; blank optional measurements are omitted',()=>{
  assert.deepEqual(quickLogPayload(values({notes:'  Stairs felt easier.  '}),today),{recordedOn:today,source:'my_timber_quick_log',notes:'Stairs felt easier.'});
  assert.throws(()=>quickLogPayload(values({}),today),/one reading or a note/);
});
test('meaningful zero values remain zero while missing stays missing',()=>{
  assert.deepEqual(quickLogPayload(values({steps:'0',proteinG:'0',sleepHours:'0'}),today),{recordedOn:today,source:'my_timber_quick_log',steps:0,proteinG:0,sleepHours:0});
  assert.throws(()=>quickLogPayload(values({restingHr:'0'}),today),/resting pulse/);
  assert.throws(()=>quickLogPayload(values({steps:'5.5'}),today),/whole number/);
});
test('kg, pounds and stone/pounds convert to the same canonical weight',()=>{
  const kg=quickLogPayload(values({weight:'93.2'}),today).weightKg;
  const lbs=quickLogPayload(values({weightUnit:'lb',weight:String(93.2/0.45359237)}),today).weightKg;
  const stone=quickLogPayload(values({weightUnit:'stone_lb',weightStone:'14',weightPounds:'9.471485'}),today).weightKg;
  assert.equal(kg,93.2);assert.equal(lbs,kg);assert.equal(stone,kg);
  assert.throws(()=>quickLogPayload(values({weightUnit:'stone_lb',weightStone:'14',weightPounds:'14'}),today),/pounds/);
  assert.throws(()=>quickLogPayload(values({weight:'2'}),today),/20–400/);
  assert.equal(quickLogPayload(values({weightUnit:'lb',weight:'44.092'}),today).weightKg,20);
});
test('backdated valid dates work; impossible and future dates do not',()=>{
  assert.equal(quickLogPayload(values({recordedOn:'2024-02-29',notes:'A note'}),today).recordedOn,'2024-02-29');
  for(const date of ['2026-02-29','2026-10-25','24/10/2026',''])assert.throws(()=>quickLogPayload(values({recordedOn:date,notes:'A note'}),today),/valid earlier date/);
});
test('notes are bounded and three-option feelings are never converted to a score',()=>{
  assert.throws(()=>quickLogPayload(values({notes:'x'.repeat(4001)}),today),/4,000/);
  const payload=quickLogPayload(values({notes:'A bit flat',moodScore:'1',feeling:'flat'}),today);
  assert.equal(Object.hasOwn(payload,'moodScore'),false);
});
test('saved account units are read without changing them',async()=>{
  const f=fixture();assert.deepEqual(await f.flow.open(),{owner:'7',units:'stone_lb'});assert.equal(f.posts,0);
});
test('no consent causes no progress POST',async()=>{
  const f=fixture({ensureConsent:async()=>false});await f.flow.open();await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/Nothing saved/);assert.equal(f.posts,0);
});
test('fresh withdrawn consent wins over a cached ensure result',async()=>{
  const f=fixture({getConsents:async()=>({consents:[{id:5,consent_type:'my_shift_health_tracking',granted:0},{id:2,consent_type:'my_shift_health_tracking',granted:1}]})});
  await f.flow.open();await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/Review your current/);assert.equal(f.posts,0);
});
test('tracking pause is respected',async()=>{
  const f=fixture({getJourney:async()=>({journey:{setup:{paused:true}}})});await f.flow.open();await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/paused/);assert.equal(f.posts,0);
});
test('a fresh account with unconfigured Journey can save a single note without setup',async()=>{
  const f=fixture({getJourney:async()=>({ok:true,journey:{version:1,setup:{complete:false},weight:{},waist:{},wellbeing:{},lifeBack:{}}})});
  await f.flow.open();const result=await f.flow.save({recordedOn:today,notes:'First day here.'});assert.equal(result.saved,true);assert.equal(result.refreshed,true);assert.equal(f.posts,1);
});
test('an account change during consent stops the draft from posting',async()=>{
  let id=7;
  const f=fixture({getMe:async()=>({user:{id}}),ensureConsent:async()=>{id=8;return true;}});
  await f.flow.open();await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/account changed/);assert.equal(f.posts,0);assert.equal(f.flow.owner,null);
});
test('failed summary refresh retains save acknowledgement and retry only reads',async()=>{
  let shouldFail=true;
  const f=fixture({getSummary:async()=>{if(shouldFail)throw Error('offline');return{state:'ready',metrics:[]};}});
  await f.flow.open();const first=await f.flow.save({recordedOn:today,notes:'A note'});
  assert.equal(first.saved,true);assert.equal(first.refreshed,false);assert.equal(f.posts,1);
  shouldFail=false;const second=await f.flow.save();assert.equal(second.refreshed,true);assert.equal(f.posts,1);
});
test('ambiguous POST timeout is held and never automatically replayed',async()=>{
  let attempts=0;
  const f=fixture({saveProgress:async()=>{attempts++;throw Object.assign(Error('timeout'),{code:'timeout'});}});
  await f.flow.open();await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/timeout/);
  assert.equal(f.flow.unconfirmed,true);await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/Check your saved records/);assert.equal(attempts,1);
  f.flow.allowCheckedRetry();assert.equal(f.flow.unconfirmed,false);
});
test('missing positive POST receipt is unconfirmed, not false success',async()=>{
  const f=fixture({saveProgress:async()=>({})});await f.flow.open();await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/did not confirm/);assert.equal(f.flow.saved,false);assert.equal(f.flow.unconfirmed,true);
});
test('a concurrent second Save is blocked while the first request is pending',async()=>{
  let resolve;
  const f=fixture({saveProgress:()=>new Promise(r=>{resolve=r;})});await f.flow.open();const first=f.flow.save({recordedOn:today,notes:'A note'});
  while(!resolve)await new Promise(r=>setImmediate(r));
  await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/already in progress/);resolve({ok:true});assert.equal((await first).refreshed,true);
});
test('account change while reading summary clears saved presentation',async()=>{
  let id=7;
  const f=fixture({getMe:async()=>({user:{id}}),getSummary:async()=>{id=8;return{state:'ready',metrics:[]};}});
  await f.flow.open();await assert.rejects(f.flow.save({recordedOn:today,notes:'A note'}),/account changed/);assert.equal(f.flow.owner,null);assert.equal(f.flow.saved,false);assert.ok(f.clears);
});
test('rapid opens share one identity/units operation rather than invalidating each other',async()=>{
  let unitsResolve, unitsReads=0;
  const f=fixture({getUnits:()=>{unitsReads++;return new Promise(resolve=>{unitsResolve=resolve;});}});
  const first=f.flow.open(),second=f.flow.open();assert.equal(first,second);
  while(!unitsResolve)await new Promise(r=>setImmediate(r));unitsResolve({units:{weight:'kg'}});
  assert.deepEqual(await first,{owner:'7',units:'kg'});assert.deepEqual(await second,{owner:'7',units:'kg'});assert.equal(unitsReads,1);assert.equal(f.clears,0);
});
test('consent withdrawal while summary is in flight suppresses its values without repeating POST',async()=>{
  let granted=1;
  const f=fixture({getConsents:async()=>({consents:[{id:9,consent_type:'my_shift_health_tracking',granted}]}),getSummary:async()=>{granted=0;return{state:'ready',metrics:[{key:'weight',latest:93.2}]};}});
  await f.flow.open();const result=await f.flow.save({recordedOn:today,notes:'A note'});assert.equal(result.saved,true);assert.equal(result.refreshed,false);assert.equal(Object.hasOwn(result,'progress'),false);assert.equal(f.posts,1);
  const retry=await f.flow.save();assert.equal(retry.refreshed,false);assert.equal(f.posts,1);
});
test('hiding the page after POST defers summary reads and retains its receipt',async()=>{
  const f=fixture({canPresent:()=>false});await f.flow.open();const result=await f.flow.save({recordedOn:today,notes:'A note'});assert.equal(result.saved,true);assert.equal(result.refreshed,false);assert.equal(f.posts,1);assert.equal(f.reads,0);
});
test('late positive POST after pagehide clear cannot create a receipt inherited by another owner',async()=>{
  let id=7,present=true,resolvePost;
  const f=fixture({getMe:async()=>({user:{id}}),canPresent:()=>present,saveProgress:()=>new Promise(resolve=>{resolvePost=resolve;})});
  await f.flow.open();const pending=f.flow.save({recordedOn:today,notes:'First account note.'}).then(value=>({value}),error=>({error}));
  while(!resolvePost)await new Promise(r=>setImmediate(r));present=false;f.flow.clear();resolvePost({ok:true});
  const outcome=await pending;assert.equal(outcome.error?.code,'stale_operation');assert.equal(outcome.value,undefined);assert.equal(f.flow.saved,false);assert.equal(f.flow.unconfirmed,false);assert.equal(f.reads,0);
  id=8;present=true;await f.flow.open();assert.equal(f.flow.owner,'8');assert.equal(f.flow.saved,false);assert.equal(f.flow.unconfirmed,false);
});
test('late positive POST cannot acknowledge or read a newly bound account',async()=>{
  let id=7,resolvePost;
  const f=fixture({getMe:async()=>({user:{id}}),saveProgress:()=>new Promise(resolve=>{resolvePost=resolve;})});
  await f.flow.open();const pending=f.flow.save({recordedOn:today,notes:'First account note.'}).then(value=>({value}),error=>({error}));
  while(!resolvePost)await new Promise(r=>setImmediate(r));f.flow.clear();id=8;await f.flow.open();resolvePost({ok:true});
  const outcome=await pending;assert.equal(outcome.error?.code,'stale_operation');assert.equal(outcome.value,undefined);assert.equal(f.flow.owner,'8');assert.equal(f.flow.saved,false);assert.equal(f.flow.unconfirmed,false);assert.equal(f.reads,0);
});
test('late failed POST cannot mark another account uncertain or block its next save',async()=>{
  let id=7,rejectPost;
  const f=fixture({getMe:async()=>({user:{id}}),saveProgress:()=>new Promise((resolve,reject)=>{rejectPost=reject;})});
  await f.flow.open();const pending=f.flow.save({recordedOn:today,notes:'First account note.'}).then(value=>({value}),error=>({error}));
  while(!rejectPost)await new Promise(r=>setImmediate(r));f.flow.clear();id=8;await f.flow.open();rejectPost(Object.assign(Error('timeout'),{code:'timeout'}));
  const outcome=await pending;assert.equal(outcome.error?.code,'stale_operation');assert.match(outcome.error.message,/original account/);assert.equal(f.flow.owner,'8');assert.equal(f.flow.saved,false);assert.equal(f.flow.unconfirmed,false);
  f.services.saveProgress=async()=>({ok:true});const next=await f.flow.save({recordedOn:today,notes:'Second account note.'});assert.equal(next.owner,'8');assert.equal(next.refreshed,true);
});
test('late failed summary cannot publish an old success or clear a newly bound account',async()=>{
  let id=7,rejectSummary;
  const f=fixture({getMe:async()=>({user:{id}}),getSummary:()=>new Promise((resolve,reject)=>{rejectSummary=reject;})});
  await f.flow.open();const pending=f.flow.save({recordedOn:today,notes:'First account note.'}).then(value=>({value}),error=>({error}));
  while(!rejectSummary)await new Promise(r=>setImmediate(r));f.flow.clear();id=8;await f.flow.open();rejectSummary(Object.assign(Error('expired old response'),{status:401}));
  const outcome=await pending;assert.equal(outcome.error?.code,'stale_operation');assert.equal(outcome.value,undefined);assert.equal(f.flow.owner,'8');assert.equal(f.flow.saved,false);assert.equal(f.flow.unconfirmed,false);
});
test('browser bundle is self-contained syntactically valid JavaScript',()=>{
  assert.doesNotThrow(()=>new Function(quickLogClient));
});
