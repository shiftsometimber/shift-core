// Bounded overlays for three already deployed clients. All unrelated source bytes
// are retained; unexpected target structures fail closed in the parent wrapper.
export const HANDOFF_PATHS = Object.freeze([
  '/assets/my-timber-welcome-20261021.js',
  '/assets/my-timber-onboarding-20261021.js',
  '/my-timber-v11.js'
]);
export const HANDOFF_VERSION = 'continuity-handoff-20261031-v1';
export const HANDOFF_STORAGE_KEY = 'sst-continuity-navigation-20261031';
export const HANDOFF_TTL_MS = 3600000;

// Literal browser source: do not serialise compiled functions into a client.
const navigation = String.raw`(function(){
 'use strict';
 const key='sst-continuity-navigation-20261031',ttl=3600000;
 const destinations={c:'/member/dashboard?entry=continuity#today',a:'/member/dashboard#coming-off-support'};
 const markedJoin=/^\/join-my-timber\/?$/.test(location.pathname)&&new URLSearchParams(location.search).get('continue')==='1';
 const remove=()=>{try{localStorage.removeItem(key)}catch{}};
 function read(allowDashboard=false){
  const readyDashboard=allowDashboard&&/^\/member\/dashboard\/?$/.test(location.pathname)&&document.body?.dataset?.memberSession==='ready';
  if(!markedJoin&&!readyDashboard)return null;
  try{const raw=localStorage.getItem(key);if(!raw)return null;const x=JSON.parse(raw),now=Date.now();
   if(!x||Object.keys(x).sort().join(',')!=='code,createdAt,expiresAt,v'||x.v!==1||!Object.hasOwn(destinations,x.code)||!Number.isFinite(x.createdAt)||!Number.isFinite(x.expiresAt)||x.createdAt>now||x.expiresAt-x.createdAt!==ttl||x.expiresAt<=now){remove();return null}
   return x;
  }catch{remove();return null}
 }
 function currentCode(){
  if(!/^\/member\/dashboard(?:\.html)?\/?$/.test(location.pathname))return null;
  if(location.hash==='#coming-off-support')return 'a';
  return new URLSearchParams(location.search).get('entry')==='continuity'?'c':null;
 }
 function remember(code){if(!Object.hasOwn(destinations,code))return false;const now=Date.now();try{localStorage.setItem(key,JSON.stringify({v:1,code,createdAt:now,expiresAt:now+ttl}));return true}catch{return false}}
 function destination(){const x=read();return x?destinations[x.code]:'/member/dashboard'}
 function consumeDestination(){const x=read();if(!x)return '/member/dashboard';remove();return destinations[x.code]}
 function loginHref(){return '/member-login?returnTo='+encodeURIComponent(read()?'/join-my-timber?continue=1':'/join-my-timber')}
 function prepare(root){if(!read())return;for(const a of root.querySelectorAll('a[href^="/member-login?"]'))a.href=loginHref();for(const a of root.querySelectorAll('a[href="/member/dashboard"]'))a.href=destination();}
 function bindDashboardLink(a,setup){
  const x=read(true);if(!x)return;
  const originalHref=a.href,originalLabel=a.textContent;
  a.href=setup?.completedAt?destinations[x.code]:'/join-my-timber?continue=1';
  a.textContent='Continue where you left off →';
  const continueClick=()=>{
   const latest=read(true);
   if(!latest||latest.code!==x.code){a.href=originalHref;a.textContent=originalLabel;return}
   a.href=setup?.completedAt?destinations[latest.code]:'/join-my-timber?continue=1';
   if(setup?.completedAt)remove();
  };
  a.addEventListener('click',continueClick);a.addEventListener('auxclick',continueClick);
 }
 return {currentCode,remember,destination,consumeDestination,loginHref,prepare,bindDashboardLink,hasPending:()=>Boolean(read())};
})()`;

const welcomePatch = '\n;/* '+HANDOFF_VERSION+' */\n'+String.raw`(()=>{
 const handoff=`+navigation+String.raw`;
 const root=document.getElementById('mtWelcome'),code=handoff.currentCode();if(!root||!code)return;
 for(const a of root.querySelectorAll('a[href="/join-my-timber"],a[href^="/join-my-timber?"],a[href^="/member-register?"]')){
  a.href='/join-my-timber?continue=1';
  const remember=()=>handoff.remember(code);
  a.addEventListener('click',remember);a.addEventListener('auxclick',remember);
 }
})();
`;

const onboardingImport = "import {normalise,persist,goals,steps,readMeasurements,displayMeasurement} from '/assets/my-timber-onboarding-model-20261021.mjs';";
const rootStart = "if(root){\n const $=id=>document.getElementById(id),status=$('joinStatus'),form=$('joinSetup');";
const memberLink = "function memberLink(signedIn){sessionLink.hidden=false;sessionLink.textContent=signedIn?'Back to My Timber':'Already a member? Log in';sessionLink.href=signedIn?'/member/dashboard':'/member-login?returnTo=%2Fjoin-my-timber';}";
const completed = "if(saved?.completedAt&&!new URLSearchParams(location.search).has('edit')){show('joinDone');status.textContent='';return;}";
const setupNavigation = "status.textContent='Saved. Opening My Timber…';location.assign('/member/dashboard');";
const expiredSessionLink = "a.href='/member-login?returnTo=%2Fjoin-my-timber';a.textContent=' Log in and continue.';";
const dashboardStep = "const step=steps[setup?.firstStep];a.href=step?.url||'/join-my-timber';a.textContent=step?.label||'Personalise My Timber →';";

const originalStart = "async function startComingOff(){const box=document.querySelector('[data-coming-result]');if(box)box.textContent='Saving your 12-week starting plan…';try{const plan={version:2,startedAt:new Date().toISOString(),food:true,movement:true,headspace:true,appetiteCheck:true,lifeBack:true,humanSupport:true,medicineBoundary:'prescriber',active:true};await stateWrite(state=>({...state,preferences:{...(state.preferences||{}),fiveLoops:{...((state.preferences||{}).fiveLoops||{}),comingOffPlan:plan}}}));track('after_treatment_started');trackAfterWeek(plan);if(box)box.innerHTML='<b>12-week support active.</b><span>Week 1 starts with noticing what has actually changed.</span>';showComingPlan(plan);document.getElementById('coming-off-support')?.scrollIntoView({block:'start'});}catch(e){if(box)box.textContent=e.message||'Could not save the plan just now.';}}";
const repairedStart = String.raw`async function startComingOff(){
 const control=document.querySelector('[data-coming-save]'),box=document.querySelector('[data-coming-result]');
 if(control?.disabled)return;if(control)control.disabled=true;
 if(box)box.textContent='Opening your after-treatment support…';
 try{
  let plan,resumed=false;
  await stateWrite(state=>{
   const prior=state.preferences?.fiveLoops?.comingOffPlan;
   resumed=prior?.active===true&&typeof prior.startedAt==='string'&&Number.isFinite(Date.parse(prior.startedAt));
   plan=resumed?prior:{version:2,startedAt:new Date().toISOString(),food:true,movement:true,headspace:true,appetiteCheck:true,lifeBack:true,humanSupport:true,medicineBoundary:'prescriber',active:true};
   return {...state,preferences:{...(state.preferences||{}),fiveLoops:{...((state.preferences||{}).fiveLoops||{}),comingOffPlan:plan}}};
  });
  if(!resumed)track('after_treatment_started');trackAfterWeek(plan);
  if(box)box.innerHTML=resumed?'<b>Your saved support is ready.</b><span>Continue from where you are. Your starting date has been kept.</span>':'<b>12-week support active.</b><span>Week 1 starts with noticing what has actually changed.</span>';
  showComingPlan(plan);document.getElementById('coming-off-support')?.scrollIntoView({block:'start'});
 }catch(e){if(box)box.textContent=e.message||'Could not save the plan just now.';}
 finally{if(control)control.disabled=false;}
}`;

function requireOne(source,needle,label){
 if(source.split(needle).length!==2)throw Error('Unexpected '+label+' structure; original client retained');
}
function replaceOne(source,needle,replacement,label){requireOne(source,needle,label);return source.replace(needle,replacement)}

export function transformHandoff(source,pathname){
 if(!HANDOFF_PATHS.includes(pathname))return {html:source,changed:false};
 if(typeof source!=='string')throw TypeError('Handoff client must be text');
 const marker='/* '+HANDOFF_VERSION+' */';
 if(source.includes(marker)){
  requireOne(source,marker,'handoff version marker');
  return {html:source,changed:false};
 }
 let html=source;
 if(pathname===HANDOFF_PATHS[0]){
  requireOne(source,"const root=document.getElementById('mtWelcome');if(!root)return;",'welcome root');
  requireOne(source,"join=root.querySelectorAll('a[href^=\"/member-register?\"]')",'welcome registration links');
  requireOne(source,"location.pathname+location.search+location.hash",'welcome destination');
  html+=welcomePatch;
 }else if(pathname===HANDOFF_PATHS[1]){
  requireOne(source,onboardingImport,'onboarding module import');
  html=replaceOne(html,onboardingImport,onboardingImport+'\n;'+marker+'\nconst __sstContinuityHandoff20261031='+navigation+';','onboarding import');
  html=replaceOne(html,rootStart,"if(root){\n __sstContinuityHandoff20261031.prepare(root);\n const $=id=>document.getElementById(id),status=$('joinStatus'),form=$('joinSetup');",'onboarding root');
  html=replaceOne(html,memberLink,"function memberLink(signedIn){sessionLink.hidden=false;sessionLink.textContent=signedIn?'Back to My Timber':'Already a member? Log in';sessionLink.href=signedIn?__sstContinuityHandoff20261031.destination():__sstContinuityHandoff20261031.loginHref();}",'member session link');
  html=replaceOne(html,completed,"if(saved?.completedAt&&!new URLSearchParams(location.search).has('edit')){if(__sstContinuityHandoff20261031.hasPending()){location.assign(__sstContinuityHandoff20261031.consumeDestination());return;}show('joinDone');status.textContent='';return;}",'completed onboarding');
  html=replaceOne(html,setupNavigation,"status.textContent='Saved. Opening My Timber…';location.assign(__sstContinuityHandoff20261031.consumeDestination());",'setup completion navigation');
  html=replaceOne(html,expiredSessionLink,"a.href=__sstContinuityHandoff20261031.loginHref();a.textContent=' Log in and continue.';",'expired-session login navigation');
  requireOne(source,"const setup=state.preferences?.myTimberOnboarding;const host=",'authenticated dashboard member state');
  requireOne(source,"if(!host||document.body.dataset.memberSession!=='ready')return;",'authenticated dashboard readiness');
  html=replaceOne(html,dashboardStep,dashboardStep+'__sstContinuityHandoff20261031.bindDashboardLink(a,setup);','authenticated dashboard continuation CTA');
 }else{
  requireOne(source,'const AFTER_WEEKS=[','after-treatment roadmap');
  requireOne(source,'function afterWeek(plan,now=Date.now())','after-treatment week calculation');
  requireOne(source,'async function stateWrite(mutator)','after-treatment persistence');
  html=replaceOne(source,originalStart,marker+'\n'+repairedStart,'after-treatment start');
 }
 return {html,changed:true};
}
