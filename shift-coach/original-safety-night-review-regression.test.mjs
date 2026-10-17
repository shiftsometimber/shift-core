import test from 'node:test';
import assert from 'node:assert/strict';
import * as safety from './safety.mjs';
import {initialState,load,mutate} from './store.mjs';
import {prepareToday} from './today.mjs';
import {prepareNight,runCoachingNight} from './night-job.mjs';
import {reviewView} from './life-back.mjs';
import {fixture} from './test-fixture.mjs';
const now=Date.parse('2026-10-14T12:00:00Z'),day=86400000;
function state(){
 const s={...initialState(),consentId:1};s.settings.proactive=true;s.permissions.wearable=true;
 s.facts=[{id:'goal',key:'goal',value:'Have more energy for family time',confirmed:true},{id:'week',key:'week',value:'A busy week at work',confirmed:true},{id:'focus',key:'focus',value:'food',confirmed:true}];
 return s;
}
function saveState(DB,userId,s){DB.sqlite.prepare('UPDATE member_state SET preferences=? WHERE user_id=?').run(JSON.stringify({lifeBack:{progress:{revision:1,shiftAI:s}}}),userId);}
test('C01/C02 finite warning examples suppress coaching while ordinary low mood remains available',()=>{
 for(const value of ['I took an overdose','I cannot keep myself safe','I do not want to be here','I don’t want to be here','My tongue is swelling','I am struggling for breath'])assert.equal(safety.boundary(value).coaching,false,value);
 for(const value of ['I am feeling low after a long week','I am sick of takeaways','Work has been stressful','I want to sleep better'])assert.equal(safety.boundary(value).coaching,true,value);
});
test('C01/C02 every confirmed legacy context field is checked without changing the saved help panel',()=>{
 for(const target of ['focus','extra','routine','constraints']){
  const s=state();if(target==='routine')s.workingRoutines=[{id:'routine',confirmed:true,text:'I cannot keep myself safe'}];
  else if(target==='constraints')s.constraints={id:'constraints',value:{note:'My tongue is swelling'}};
  else s.facts.push({id:'legacy',key:target,value:'I do not want to be here',confirmed:true});
  const result=safety.personalContextBoundary(s);assert.equal(result.coaching,false,target);assert.equal(result.help,safety.helpPanel);
 }
 const s=state();s.facts.push({id:'inferred',value:'I do not want to be here',confirmed:false});
 assert.equal(safety.personalContextBoundary(s).coaching,true);
});
test('C01/C02 unsafe confirmed legacy context cannot prepare a night action or weekly plan',()=>{
 const s=state();s.facts.push({id:'old',key:'extra',value:'I took an overdose',confirmed:true});s.settings.weeklyDay=3;
 const result=prepareNight(s,now);assert.equal(result.outcome,'support_required');assert.equal(s.actions.length,0);assert.equal(s.weeklyPlans.length,0);assert.deepEqual(s.queue,[]);
});
test('C01/C02 natural worker skips unsafe legacy context without saving a night review',async t=>{
 const DB=fixture(t),s=state();s.facts.push({id:'old',key:'extra',value:'I do not want to be here',confirmed:true});saveState(DB,1,s);
 const result=await runCoachingNight({DB,SHIFT_COACH_OFF:'false'},now);assert.equal(result.prepared,0);assert.deepEqual((await load(DB,1)).state,s);
});
for(const point of ['page','load','consent'])test('C07 mutable global stop after awaited '+point+' prevents night writes',async t=>{
 const DB=fixture(t),s=state();saveState(DB,1,s);const env={DB,SHIFT_COACH_OFF:'false'},prepare=DB.prepare.bind(DB);
 DB.prepare=sql=>{const statement=prepare(sql),method=point==='page'?'all':'first';
  const selected=point==='page'?sql.startsWith('SELECT user_id FROM member_state'):point==='load'?sql.includes('COALESCE(json_extract(preferences'):sql.startsWith('SELECT id,granted FROM consents');
  if(selected){const operation=statement[method].bind(statement);statement[method]=async()=>{const result=await operation();env.SHIFT_COACH_OFF='true';return result;};}return statement;};
 const result=await runCoachingNight(env,now);assert.equal(result.disabled,true);assert.equal(result.prepared,0);assert.deepEqual((await load(DB,1)).state,s);
});
test('C07 stop during preparation is checked by the final beforeWrite callback',async t=>{
 const DB=fixture(t),s=state();saveState(DB,1,s);const env={DB,SHIFT_COACH_OFF:'false'},uuid=crypto.randomUUID;
 crypto.randomUUID=()=>{env.SHIFT_COACH_OFF='true';return uuid.call(crypto);};
 let result;try{result=await runCoachingNight(env,now);}finally{crypto.randomUUID=uuid;}
 assert.equal(result.disabled,true);assert.equal(result.prepared,0);assert.deepEqual((await load(DB,1)).state,s);
});
test('C32 personal trailing-seven-day review uses permitted saved evidence and one current safe action',()=>{
 const s=state();s.components=['sleep','energy','activity','mood','weight'];prepareToday(s,now-day);
 s.readings=[
  {id:'sleep1',kind:'sleep',value:6,unit:'hours',at:now-6*day,source:'wearable'},{id:'sleep2',kind:'sleep',value:7,unit:'hours',at:now-day,source:'wearable'},
  {id:'energy1',kind:'energy',value:3,at:now-5*day,source:'wearable'},{id:'energy2',kind:'energy',value:3,at:now-day,source:'wearable'},
  {id:'activity1',kind:'activity',value:6000,at:now-day,source:'wearable'},
  {id:'private',kind:'mood',value:1,at:now-day,source:'voice'},{id:'conflict',kind:'mood',value:5,at:now-day,source:'wearable',conflict:true},
  {id:'old-weight',kind:'weight',value:110,at:now-8*day,source:'wearable'},{id:'future',kind:'weight',value:90,at:now+day,source:'wearable'}
 ];
 s.outcomes=[{id:'helped',value:'helped',title:'Packed lunch before work',at:now-day,dataUsed:[]},{id:'unhelpful',value:'didnt-help',title:'An evening reminder',at:now-day,dataUsed:[]},{id:'old',value:'helped',title:'OLD_SECRET',at:now-8*day,dataUsed:[]}];
 s.reviews=[{id:'rating1',rating:3,at:now-6*day,source:'member',personal:true},{id:'rating2',rating:4,at:now-day,source:'member',personal:true}];
 const before=JSON.stringify(s),r=reviewView(s,now);
 assert.deepEqual(r.window,{from:now-7*day,to:now,days:7});assert.equal(r.combinedScore,null);assert.equal(r.change,1);
 assert(r.whatMoved.some(x=>x.dataUsed.includes('sleep1')&&x.dataUsed.includes('sleep2')));
 assert(r.whatMoved.some(x=>x.dataUsed.includes('helped')));assert(r.whatDidnt.some(x=>x.dataUsed.includes('unhelpful')));
 assert(r.whatDidnt.some(x=>x.kind==='energy'));assert(r.unknowns.some(x=>x.component==='activity'));assert(r.unknowns.some(x=>x.component==='mood'));assert(r.unknowns.some(x=>x.component==='weight'));
 assert.equal(r.nextAction.id,s.actions.at(-1).id);assert.equal(r.next,r.nextAction.title);
 assert.doesNotMatch(JSON.stringify(r),/OLD_SECRET|"private"|"conflict"|"old-weight"|"future"/);assert.equal(JSON.stringify(s),before);
});
test('C32 a single or incompatible-unit reading stays unknown and stale reviews are not a current assessment',()=>{
 const s=state();s.components=['sleep'];s.readings=[{id:'a',kind:'sleep',value:7,unit:'hours',at:now-day,source:'wearable'},{id:'b',kind:'sleep',value:420,unit:'minutes',at:now-2*day,source:'wearable'}];
 s.reviews=[{id:'old',rating:5,at:now-8*day,source:'member',personal:true}];const r=reviewView(s,now);
 assert.equal(r.weeklyAssessment,null);assert.equal(r.change,null);assert.equal(r.whatMoved.length,0);assert.equal(r.unknowns[0].component,'sleep');assert.equal(r.nextAction,null);
});
test('C32 unsafe legacy context suppresses review coaching and does not echo its warning',()=>{
 const s=state();prepareToday(s,now);s.facts.push({id:'legacy',key:'extra',value:'I cannot keep myself safe',confirmed:true});
 const r=reviewView(s,now);assert.equal(r.supportRequired,true);assert.equal(r.nextAction,null);assert.deepEqual(r.whatMoved,[]);assert.deepEqual(r.whatDidnt,[]);assert.doesNotMatch(JSON.stringify(r),/cannot keep myself safe/);
});

for(const stopAfter of [1,2])test('C07 stop between '+(stopAfter===1?'accounts':'pages')+' preserves completed work and prevents further reads/writes',async t=>{
 const DB=fixture(t),first=state(),second=state();second.consentId=2;saveState(DB,1,first);saveState(DB,2,second);
 const env={DB,SHIFT_COACH_OFF:'false'},prepare=DB.prepare.bind(DB);let writes=0,pages=0;
 DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('SELECT user_id FROM member_state'))pages++;
  if(sql.startsWith('UPDATE member_state SET preferences=json_set')){const run=statement.run.bind(statement);statement.run=async()=>{const result=await run();if(++writes===stopAfter)env.SHIFT_COACH_OFF='true';return result;};}return statement;};
 const result=await runCoachingNight(env,now);assert.equal(result.disabled,true);assert.equal(result.prepared,stopAfter);assert.equal(writes,stopAfter);assert.equal(pages,1);
 if(stopAfter===1)assert.deepEqual((await load(DB,2)).state,second);
});
test('C32 future or undated actions and unidentifiable readings do not become current evidence',()=>{
 const s=state();s.components=['sleep'];prepareToday(s,now);s.readings=[{kind:'sleep',value:6,at:now-day,source:'wearable'},{kind:'sleep',value:7,at:now,source:'wearable'}];
 s.actions.at(-1).preparedAt=now+day;let r=reviewView(s,now);assert.equal(r.nextAction,null);assert.equal(r.whatMoved.length,0);assert.equal(r.unknowns[0].component,'sleep');
 delete s.actions.at(-1).preparedAt;r=reviewView(s,now);assert.equal(r.nextAction,null);
});
