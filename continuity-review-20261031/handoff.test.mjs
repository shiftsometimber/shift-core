import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {HANDOFF_PATHS,HANDOFF_STORAGE_KEY,HANDOFF_TTL_MS,transformHandoff} from './handoff.mjs';

const importLine="import {normalise,persist,goals,steps,readMeasurements,displayMeasurement} from '/assets/my-timber-onboarding-model-20261021.mjs';";
const completed="if(saved?.completedAt&&!new URLSearchParams(location.search).has('edit')){show('joinDone');status.textContent='';return;}";
const memberLink="function memberLink(signedIn){sessionLink.hidden=false;sessionLink.textContent=signedIn?'Back to My Timber':'Already a member? Log in';sessionLink.href=signedIn?'/member/dashboard':'/member-login?returnTo=%2Fjoin-my-timber';}";
const success="status.textContent='Saved. Opening My Timber…';location.assign('/member/dashboard');";
const expiredSessionLink="a.href='/member-login?returnTo=%2Fjoin-my-timber';a.textContent=' Log in and continue.';";
const dashboardStep="const step=steps[setup?.firstStep];a.href=step?.url||'/join-my-timber';a.textContent=step?.label||'Personalise My Timber →';";
// Fixtures reproduce the exact bounded live structures while replacing unrelated
// UI/API work. Assertions below execute the transformed browser code in a VM.
const welcome=String.raw`(()=>{const root=document.getElementById('mtWelcome');if(!root)return;
const login=[],join=root.querySelectorAll('a[href^="/member-register?"]');
const dest=location.pathname+location.search+location.hash;
})();`;
const onboarding=importLine+`
const root=document.getElementById('mtOnboarding');
if(root){
 const $=id=>document.getElementById(id),status=$('joinStatus'),form=$('joinSetup');
}
const sessionLink={},status={};function show(id){globalThis.shown=id}
${memberLink}
function completeExisting(saved){${completed}globalThis.notCompleted=true}
function completeSetup(){${success}}
function lateLogin(){const a={};${expiredSessionLink}return a.href}
let running=false,done=false;
async function offer(){if(done||running||document.body.dataset.memberSession!=='ready')return;running=true;try{const state=(await api.get('/v1/member-state')).state;const setup=state.preferences?.myTimberOnboarding;const host=document.querySelector('#previewMember');if(!host||document.body.dataset.memberSession!=='ready')return;const a=document.createElement('a');${dashboardStep}host.prepend(a);done=true;}finally{running=false}}
`;
const originalStart="async function startComingOff(){const box=document.querySelector('[data-coming-result]');if(box)box.textContent='Saving your 12-week starting plan…';try{const plan={version:2,startedAt:new Date().toISOString(),food:true,movement:true,headspace:true,appetiteCheck:true,lifeBack:true,humanSupport:true,medicineBoundary:'prescriber',active:true};await stateWrite(state=>({...state,preferences:{...(state.preferences||{}),fiveLoops:{...((state.preferences||{}).fiveLoops||{}),comingOffPlan:plan}}}));track('after_treatment_started');trackAfterWeek(plan);if(box)box.innerHTML='<b>12-week support active.</b><span>Week 1 starts with noticing what has actually changed.</span>';showComingPlan(plan);document.getElementById('coming-off-support')?.scrollIntoView({block:'start'});}catch(e){if(box)box.textContent=e.message||'Could not save the plan just now.';}}";
const support=`const AFTER_WEEKS=[];
function afterWeek(plan,now=Date.now()){return Math.min(12,Math.floor((now-Date.parse(plan.startedAt))/604800000)+1)}
async function stateWrite(mutator){globalThis.saved=mutator(globalThis.saved);if(globalThis.saveWait)await globalThis.saveWait}
${originalStart}
`;
function storage(){const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m}}
function context({path='/join-my-timber',search='?continue=1',hash='',store=storage(),now=1770000000000,document={getElementById:()=>null}}={}){
 const assigned=[];
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
 const ctx=vm.createContext({Date:Clock,URLSearchParams,localStorage:store,location:{pathname:path,search,hash,assign:p=>assigned.push(p)},document,console});
 ctx.__test={assigned,store,setNow:n=>{now=n}};return ctx;
}
function runOnboarding(ctx){const {html}=transformHandoff(onboarding,HANDOFF_PATHS[1]);vm.runInContext(html.replace(importLine,''),ctx);return ctx}
const evaluate=(ctx,code)=>vm.runInContext(code,ctx);
function marker(ctx,code='a',age=0,extra={}){const now=evaluate(ctx,'Date.now()');ctx.localStorage.setItem(HANDOFF_STORAGE_KEY,JSON.stringify({v:1,code,createdAt:now-age,expiresAt:now-age+HANDOFF_TTL_MS,...extra}))}

test('only the three exact clients are transformed, structurally and idempotently',()=>{
 assert.deepEqual(transformHandoff('unrelated','/assets/else.js'),{html:'unrelated',changed:false});
 for(const [i,source] of [welcome,onboarding,support].entries()){
  const r=transformHandoff(source,HANDOFF_PATHS[i]);assert.equal(r.changed,true);
  assert.deepEqual(transformHandoff(r.html,HANDOFF_PATHS[i]),{html:r.html,changed:false});
 }
 assert.throws(()=>transformHandoff(welcome.replace("if(!root)return;",'if(!root)throw Error();'),HANDOFF_PATHS[0]),/Unexpected/);
 assert.throws(()=>transformHandoff(onboarding.replace(success,success+success),HANDOFF_PATHS[1]),/Unexpected/);
 assert.throws(()=>transformHandoff(support.replace("version:2,startedAt",'version:3,startedAt'),HANDOFF_PATHS[2]),/Unexpected/);
});

test('a marked Join click stores only finite navigation data and a generic URL flag',()=>{
 const handlers={},link={href:'/join-my-timber',addEventListener:(k,f)=>handlers[k]=f};
 const root={querySelectorAll:selector=>selector.includes('/join-my-timber')?[link]:[]};
 const ctx=context({path:'/member/dashboard',hash:'#coming-off-support',search:'',document:{getElementById:()=>root}});
 const out=transformHandoff(welcome,HANDOFF_PATHS[0]).html;vm.runInContext(out,ctx);
 assert.equal(link.href,'/join-my-timber?continue=1');assert.equal(ctx.localStorage.m.size,0,'merely viewing support must not write a marker');
 handlers.click();const saved=JSON.parse(ctx.localStorage.getItem(HANDOFF_STORAGE_KEY));
 assert.deepEqual(Object.keys(saved).sort(),['code','createdAt','expiresAt','v']);assert.equal(saved.code,'a');assert.equal(saved.expiresAt-saved.createdAt,3600000);
 assert.doesNotMatch(link.href,/aftercare|medicine|email|memberId|returnTo/);
 handlers.auxclick();assert.equal(JSON.parse(ctx.localStorage.getItem(HANDOFF_STORAGE_KEY)).code,'a');
});

test('continuity starts use only their fixed code and unrelated dashboard visits add nothing',()=>{
 for(const [search,hash,expected] of [['?entry=continuity','#today','c'],['?entry=anything','#today',null],['','#visualise',null]]){
  const handlers={},link={addEventListener:(k,f)=>handlers[k]=f},root={querySelectorAll:s=>s.includes('/join-my-timber')?[link]:[]};
  const ctx=context({path:'/member/dashboard',search,hash,document:{getElementById:()=>root}});vm.runInContext(transformHandoff(welcome,HANDOFF_PATHS[0]).html,ctx);
  if(expected){handlers.click();assert.equal(JSON.parse(ctx.localStorage.getItem(HANDOFF_STORAGE_KEY)).code,expected)}else assert.equal(ctx.localStorage.m.size,0);
 }
});

test('new-tab verification can use the marker but generic Join never consumes it',()=>{
 const store=storage(),first=context({store});marker(first,'a');
 const generic=runOnboarding(context({store,search:''}));evaluate(generic,'completeSetup()');assert.deepEqual(generic.__test.assigned,['/member/dashboard']);assert.ok(store.getItem(HANDOFF_STORAGE_KEY));
 const verification=runOnboarding(context({store}));assert.equal(evaluate(verification,'__sstContinuityHandoff20261031.loginHref()'),'/member-login?returnTo=%2Fjoin-my-timber%3Fcontinue%3D1');
 evaluate(verification,'completeSetup()');assert.deepEqual(verification.__test.assigned,['/member/dashboard#coming-off-support']);assert.equal(store.getItem(HANDOFF_STORAGE_KEY),null);
});

test('both fixed destinations work and a completed setup resumes without repeating onboarding',()=>{
 for(const [code,destination] of [['a','/member/dashboard#coming-off-support'],['c','/member/dashboard?entry=continuity#today']]){
  const ctx=runOnboarding(context());marker(ctx,code);evaluate(ctx,'completeExisting({completedAt:"2026-10-31"})');
  assert.deepEqual(ctx.__test.assigned,[destination]);assert.equal(ctx.localStorage.getItem(HANDOFF_STORAGE_KEY),null);
 }
});

test('expired, future, malformed, extended and arbitrary redirect markers are rejected',()=>{
 for(const raw of [
  {v:1,code:'a',createdAt:1770000000000-3600001,expiresAt:1770000000000-1},
  {v:1,code:'a',createdAt:1770000000001,expiresAt:1770003600001},
  {v:1,code:'https://outside.example',createdAt:1770000000000,expiresAt:1770003600000},
  {v:1,code:'a',createdAt:1770000000000,expiresAt:1770003600001},
  {v:1,code:'a',createdAt:1770000000000,expiresAt:1770003600000,member:'must not be retained'},
  'not-json'
 ]){
  const ctx=runOnboarding(context());ctx.localStorage.setItem(HANDOFF_STORAGE_KEY,typeof raw==='string'?raw:JSON.stringify(raw));evaluate(ctx,'completeSetup()');
  assert.deepEqual(ctx.__test.assigned,['/member/dashboard']);assert.equal(ctx.localStorage.getItem(HANDOFF_STORAGE_KEY),null);
 }
 const ctx=runOnboarding(context({search:'?continue=1&returnTo=https%3A%2F%2Foutside.example'}));evaluate(ctx,'completeSetup()');assert.deepEqual(ctx.__test.assigned,['/member/dashboard']);
});

test('verification and completed-page links retain only the marked flow',()=>{
 const ctx=runOnboarding(context()),login={href:'/member-login?returnTo=%2Fjoin-my-timber'},done={href:'/member/dashboard'};marker(ctx,'a');
 ctx.testRoot={querySelectorAll:s=>s.includes('member-login')?[login]:[done]};
 evaluate(ctx,'__sstContinuityHandoff20261031.prepare(testRoot)');assert.equal(login.href,'/member-login?returnTo=%2Fjoin-my-timber%3Fcontinue%3D1');assert.equal(done.href,'/member/dashboard#coming-off-support');
 assert.equal(evaluate(ctx,'lateLogin()'),'/member-login?returnTo=%2Fjoin-my-timber%3Fcontinue%3D1');
});

function dashboardContext({store=storage(),setup=null,ready=true,now=1770000000000}={}){
 const links=[];let reads=0;
 const host={prepend:a=>links.unshift(a)};
 const document={body:{dataset:{memberSession:ready?'ready':'signed-out'}},getElementById:()=>null,querySelector:()=>host,createElement:()=>({handlers:{},addEventListener(k,f){this.handlers[k]=f}})};
 const ctx=context({path:'/member/dashboard',search:'',hash:'',store,document,now});
 ctx.steps={food:{url:'/member/grub',label:'Find a meal'}};
 ctx.api={get:async()=>{reads++;return {state:{preferences:{...(setup?{myTimberOnboarding:setup}:{})}}}}};
 runOnboarding(ctx);return{ctx,links,reads:()=>reads};
}
test('real verification callback offers continuation on the authenticated dashboard, then Join preserves it',async()=>{
 const store=storage(),origin=context({store});marker(origin,'a');
 // The verification service returns to generic login, which then opens generic
 // dashboard. The marker is not consumed on login and no redirect is automatic.
 const login=context({path:'/member-login.html',search:'?verified=1',store});assert.ok(login.localStorage.getItem(HANDOFF_STORAGE_KEY));
 const {ctx,links,reads}=dashboardContext({store});await evaluate(ctx,'offer()');
 assert.equal(reads(),1);assert.deepEqual(ctx.__test.assigned,[]);assert.equal(links[0].href,'/join-my-timber?continue=1');assert.equal(links[0].textContent,'Continue where you left off →');assert.ok(store.getItem(HANDOFF_STORAGE_KEY));
 links[0].handlers.click();assert.ok(store.getItem(HANDOFF_STORAGE_KEY),'incomplete setup must retain the marker');
 const joined=runOnboarding(context({store}));evaluate(joined,'completeSetup()');assert.deepEqual(joined.__test.assigned,['/member/dashboard#coming-off-support']);assert.equal(store.getItem(HANDOFF_STORAGE_KEY),null);
});
test('completed setup offers the fixed destination and consumes only on an explicit click',async()=>{
 const store=storage(),origin=context({store});marker(origin,'c');
 const {ctx,links}=dashboardContext({store,setup:{completedAt:'2026-10-31',firstStep:'food'}});await evaluate(ctx,'offer()');
 assert.equal(links[0].href,'/member/dashboard?entry=continuity#today');assert.deepEqual(ctx.__test.assigned,[]);assert.ok(store.getItem(HANDOFF_STORAGE_KEY));
 links[0].handlers.click();assert.equal(store.getItem(HANDOFF_STORAGE_KEY),null);
 const returned=dashboardContext({store,setup:{completedAt:'2026-10-31',firstStep:'food'}});await evaluate(returned.ctx,'offer()');assert.equal(returned.links[0].href,'/member/grub');assert.equal(returned.links[0].textContent,'Find a meal');
});
test('unready or expired dashboard never offers continuation and expiry before a click restores the original CTA',async()=>{
 const store=storage(),origin=context({store});marker(origin,'a');
 const unready=dashboardContext({store,ready:false});await evaluate(unready.ctx,'offer()');assert.equal(unready.reads(),0);assert.equal(unready.links.length,0);assert.ok(store.getItem(HANDOFF_STORAGE_KEY));
 const expired=dashboardContext({store,now:1770000000000+HANDOFF_TTL_MS+1});await evaluate(expired.ctx,'offer()');assert.equal(expired.links[0].href,'/join-my-timber');assert.equal(store.getItem(HANDOFF_STORAGE_KEY),null);
 marker(origin,'a');const fresh=dashboardContext({store,setup:{completedAt:'2026-10-31',firstStep:'food'}});await evaluate(fresh.ctx,'offer()');fresh.ctx.__test.setNow(1770000000000+HANDOFF_TTL_MS+1);fresh.links[0].handlers.click();assert.equal(fresh.links[0].href,'/member/grub');assert.equal(fresh.links[0].textContent,'Find a meal');
});

function supportContext(prior){
 const control={disabled:false},box={},events=[],ctx=context({document:{querySelector:s=>s==='[data-coming-save]'?control:box,getElementById:()=>({scrollIntoView(){}})}});
 ctx.saved={unrelated:'kept',preferences:{other:'kept',fiveLoops:{otherLoop:'kept',...(prior?{comingOffPlan:prior}:{})}}};
 ctx.track=name=>events.push(name);ctx.trackAfterWeek=()=>events.push('week');ctx.showComingPlan=p=>ctx.displayed=p;
 vm.runInContext(transformHandoff(support,HANDOFF_PATHS[2]).html,ctx);return{ctx,control,box,events};
}
test('new support starts once and preserves unrelated preferences',async()=>{
 const {ctx,control,events}=supportContext();let release;ctx.saveWait=new Promise(resolve=>release=resolve);
 const first=evaluate(ctx,'startComingOff()'),second=evaluate(ctx,'startComingOff()');assert.equal(control.disabled,true);release();await Promise.all([first,second]);
 assert.equal(ctx.saved.unrelated,'kept');assert.equal(ctx.saved.preferences.other,'kept');assert.equal(ctx.saved.preferences.fiveLoops.otherLoop,'kept');
 assert.equal(ctx.saved.preferences.fiveLoops.comingOffPlan.active,true);assert.equal(ctx.saved.preferences.fiveLoops.comingOffPlan.medicineBoundary,'prescriber');assert.equal(events.filter(x=>x==='after_treatment_started').length,1);assert.equal(control.disabled,false);
});
test('repeat Start resumes the original date including after week 12',async()=>{
 for(const weeks of [3,15]){
  const startedAt=new Date(1770000000000-weeks*604800000).toISOString(),prior={version:2,active:true,startedAt,custom:'retained'};
  const {ctx,events}=supportContext(prior);await evaluate(ctx,'startComingOff()');await evaluate(ctx,'startComingOff()');
  assert.equal(ctx.saved.preferences.fiveLoops.comingOffPlan.startedAt,startedAt);assert.equal(ctx.displayed.custom,'retained');assert.equal(events.includes('after_treatment_started'),false);
 }
});
test('save failures retain the original error path and unlock the control',async()=>{
 const {ctx,control,box}=supportContext();evaluate(ctx,"stateWrite=async()=>{throw Error('Save unavailable')}");await evaluate(ctx,'startComingOff()');assert.equal(box.textContent,'Save unavailable');assert.equal(control.disabled,false);assert.equal(ctx.displayed,undefined);
});

test('current public clients match the bounded transform structures', {skip:process.env.HANDOFF_LIVE_CHECK!=='1'},()=>{
 for(const path of HANDOFF_PATHS){const url='https://shiftsometimber.co.uk'+path+(path===HANDOFF_PATHS[0]?'?v=3':path===HANDOFF_PATHS[2]?'?v=1':'');
  const source=execFileSync('curl',['-fLsS','--max-time','25',url],{encoding:'utf8',maxBuffer:1e6});
  const r=transformHandoff(source,path);assert.equal(r.changed,true,path);
  const executable=path===HANDOFF_PATHS[1]?r.html.replace(importLine,''):r.html;new vm.Script(executable,{filename:path});
 }
});
