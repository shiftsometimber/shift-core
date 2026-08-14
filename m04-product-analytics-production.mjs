import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.M04_EVIDENCE_DIR||'m04-product-analytics-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});

const nonce=`m04-${Date.now()}-${randomUUID().slice(0,8)}`;
const email=`shiftsometimber+structured-authrender-${nonce}@gmail.com`;
const password=`Shift-M04-${randomUUID()}-Aa1!`;
const report={proof:'M04_REAL_PRODUCT_ANALYTICS_FUNNEL_PRODUCTION_V1',status:'RUNNING',journey:{},events:[],failures:[]};
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
const fail=(name,detail)=>{report.failures.push({name,detail:String(detail).slice(0,1200)});write();throw new Error(`${name}: ${detail}`)};
const cookieOf=r=>(r.headers.get('set-cookie')||'').split(';')[0];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function call(p,{method='GET',body,cookie,oidc=false}={}){
  const headers={Origin:SITE,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(cookie)headers.Cookie=cookie;
  if(oidc)headers['X-Shift-Commissioning-OIDC']=OIDC;
  const r=await fetch(API+p,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
  let data={};try{data=await r.clone().json()}catch{data={text:(await r.text()).slice(0,500)}}
  return{r,data,cookie:cookieOf(r)};
}

// A green source merge is not deployment evidence. Do not begin the member journey
// until production itself exposes the restricted commissioning evidence route.
// The prior fixed 35-second sleep was falsified by run 31793732771: production still
// returned the legacy 404 after the sleep, so that run could not prove M04 either way.
let readiness=null;
for(let attempt=0;attempt<150;attempt++){
  readiness=await call('/v1/commissioning/product-events?userId=1&hours=1',{oidc:true});
  if(readiness.r.status===200||readiness.r.status===503)break;
  if(readiness.r.status!==404&&readiness.r.status!==502)fail('analytics-route-readiness',`${readiness.r.status} ${JSON.stringify(readiness.data)}`);
  if(attempt<149)await sleep(2000);
}
if(!readiness||![200,503].includes(readiness.r.status))fail('analytics-route-readiness-timeout',`${readiness?.r?.status} ${JSON.stringify(readiness?.data)}`);
report.journey.analyticsRouteReady={status:readiness.r.status};write();

const registration=await call('/v1/auth/register',{method:'POST',oidc:true,body:{email,password,firstName:'AnalyticsProof',source:'commissioning-m04'}});
if(registration.r.status!==201||!registration.data?.user?.id||!registration.cookie)fail('registration',`${registration.r.status} ${JSON.stringify(registration.data)}`);
const userId=Number(registration.data.user.id);let cookie=registration.cookie;
report.journey.registration={status:registration.r.status,emailVerified:registration.data.emailVerified===true};write();

let x=await call('/v1/auth/logout',{method:'POST',cookie,body:{}});if(!x.r.ok)fail('logout-after-register',x.r.status);
x=await call('/v1/auth/login',{method:'POST',body:{email,password}});if(!x.r.ok||!x.cookie)fail('first-login',`${x.r.status} ${JSON.stringify(x.data)}`);cookie=x.cookie;report.journey.firstLogin=true;

const stateInput={myWhy:{why:'Have more energy and keep the plan useful in real life.',promise:'Do the next sensible thing.'},preferences:{foodDislikes:['mushrooms'],exerciseDislikes:['running'],goal:'steady_weight_loss',commissioningAnalyticsNonce:nonce}};
x=await call('/v1/member-state',{method:'PATCH',cookie,body:stateInput});if(!x.r.ok)fail('onboarding-state',`${x.r.status} ${JSON.stringify(x.data)}`);report.journey.onboardingSaved=true;

x=await call('/v1/shift/today',{cookie});if(!x.r.ok||!x.data?.today)fail('today',`${x.r.status} ${JSON.stringify(x.data)}`);report.journey.today=true;

const grub=await call('/v1/grub/plan',{method:'POST',cookie,body:{days:1,preferences:{cuisines:['curry']},dislikes:['mushrooms']}});
if(!grub.r.ok||!(grub.data?.plan?.days||[]).length)fail('grub',`${grub.r.status} ${JSON.stringify(grub.data)}`);report.journey.grub=true;
const fit=await call('/v1/fit/plan',{method:'POST',cookie,body:{days:1,minutes_per_day:20,location:'home',equipment:['none'],limitations:[],preferences:{dislikes:['running']}}});
if(!fit.r.ok||!(fit.data?.plan?.sessions||[]).length)fail('fit',`${fit.r.status} ${JSON.stringify(fit.data)}`);report.journey.fit=true;

const recordedOn=new Date().toISOString().slice(0,10);
x=await call('/v1/progress',{method:'POST',cookie,body:{recordedOn,weightKg:102.4,waistCm:111,steps:6200,sleepHours:7,moodScore:7,source:'commissioning-m04'}});
if(!x.r.ok)fail('progress',`${x.r.status} ${JSON.stringify(x.data)}`);report.journey.progress=true;

x=await call('/v1/shift-ai/chat',{method:'POST',cookie,body:{message:'Give me one practical thing to keep today simple.'}});
if(!x.r.ok||!x.data?.ok)fail('shift-ai',`${x.r.status} ${JSON.stringify(x.data)}`);report.journey.shiftAi=true;

const bad=await call('/v1/auth/login',{method:'POST',body:{email,password:'Definitely-Wrong-Password-2026!'}});
if(bad.r.status!==401)fail('real-auth-error',`${bad.r.status} ${JSON.stringify(bad.data)}`);report.journey.realError=true;

x=await call('/v1/auth/logout',{method:'POST',cookie,body:{}});if(!x.r.ok)fail('logout-before-return',x.r.status);
x=await call('/v1/auth/login',{method:'POST',body:{email,password}});if(!x.r.ok||!x.cookie)fail('return-login',`${x.r.status} ${JSON.stringify(x.data)}`);cookie=x.cookie;report.journey.returnLogin=true;

const [retainedState,retainedProgress]=await Promise.all([call('/v1/member-state',{cookie}),call('/v1/progress',{cookie})]);
if(!retainedState.r.ok||retainedState.data?.state?.preferences?.commissioningAnalyticsNonce!==nonce)fail('retained-onboarding','member state missing after return');
const progressRows=retainedProgress.data?.entries||retainedProgress.data?.progress||[];
if(!retainedProgress.r.ok||!JSON.stringify(progressRows).includes(recordedOn))fail('retained-progress','progress entry missing after return');
report.journey.retainedAfterReturn=true;write();

const required=['registration_started','registration_completed','login_succeeded','onboarding_completed','today_viewed','grub_plan_generated','fit_plan_generated','progress_logged','shift_ai_message','error_presented','member_returned'];
let evidence=null;
for(let attempt=0;attempt<30;attempt++){
  evidence=await call(`/v1/commissioning/product-events?userId=${userId}&hours=1`,{oidc:true});
  if(evidence.r.ok){const names=(evidence.data?.events||[]).map(e=>e.event_name);if(required.every(n=>names.includes(n))&&names.filter(n=>n==='login_succeeded').length>=2)break}
  await sleep(1000);
}
if(!evidence?.r?.ok)fail('analytics-evidence-route',`${evidence?.r?.status} ${JSON.stringify(evidence?.data)}`);
const events=evidence.data?.events||[],names=events.map(e=>e.event_name);for(const name of required)if(!names.includes(name))fail(`event-${name}`,`missing from ${JSON.stringify(names)}`);
if(names.filter(n=>n==='login_succeeded').length<2)fail('login-count',JSON.stringify(names));

const firstIndex=n=>events.findIndex(e=>e.event_name===n),lastIndex=n=>events.map(e=>e.event_name).lastIndexOf(n);
if(firstIndex('registration_started')<0||firstIndex('registration_started')>=firstIndex('registration_completed'))fail('registration-order',JSON.stringify(names));
if(firstIndex('onboarding_completed')>=firstIndex('today_viewed'))fail('onboarding-before-today',JSON.stringify(names));
if(firstIndex('today_viewed')>=firstIndex('grub_plan_generated')||firstIndex('today_viewed')>=firstIndex('fit_plan_generated'))fail('today-before-products',JSON.stringify(names));
if(lastIndex('member_returned')<=lastIndex('login_succeeded')){
  const returnEvent=lastIndex('member_returned'),secondLogin=events.map((e,i)=>e.event_name==='login_succeeded'?i:-1).filter(i=>i>=0)[1];
  if(returnEvent<=secondLogin)fail('return-order',JSON.stringify(names));
}

report.events=events.map(e=>({id:e.id,event_name:e.event_name,surface:e.surface,source:e.source,occurred_at:e.occurred_at}));
report.counts=Object.fromEntries(required.map(n=>[n,names.filter(x=>x===n).length]));
report.status='PASS';write();
console.log(JSON.stringify(report,null,2));
console.log('PASS M04 production analytics funnel: the real member journey persisted registration, verified login, onboarding, Today, Grub, Fit, Progress, Shift AI, a real auth error and a retained return signal in chronological product analytics.');