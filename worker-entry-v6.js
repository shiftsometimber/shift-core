import hq from './hq-ai-v2.js';
import {runScheduledIntelligence} from './scheduled-intelligence.js';
import {runKnowledgeFlywheel} from './scheduled-knowledge-v1.js';
import {memberCommissioningRoute} from './member-commissioning-v1.js';
import {shiftVisualiseV2Routes} from './shift-visualise-v2.js';
import {memberPracticalRoutes} from './member-practical-v1.js';
import {memberProductV8Routes} from './member-product-v8.js';
import {memberDailyV3Routes} from './member-daily-v3.js';
import {personalRoutes} from './personal-platform-v1.js';
import {knowledgeRoutes} from './knowledge-graph-v1.js';
import {knowledgeEditorialRoutes} from './knowledge-editorial-v1.js';
import {shiftBrainRoutes} from './shift-brain-v1.js';
import {analyticsRoutes,recordProductEvent} from './product-analytics-v1.js';
import {radarPublicRoutes} from './radar-public-v1.js';
import {radarRoutes} from './radar-integration-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {commissioningOpsRoutes} from './commissioning-ops-v1.js';
import {handleCommissioningIdentity} from './commissioning-identity-v1.js';
import {handleEmailVerification} from './auth-email-verification-v1.js';
import {handleAuthRecovery} from './auth-recovery-v1.js';
import {memberContrastStatic} from './member-contrast-static-v1.js';
import {fastMemberRegister} from './member-register-fastpath-v2.js';
import {fastMemberLogin} from './member-login-fastpath-v1.js';
import {shiftMeRoutes} from './shift-me-v1.js';
import {shiftMe3DProofRoutes} from './shift-me-3d-proof-v1.js';
import {sportClubhouseRoutes} from './sport-clubhouse-v1.js';
import {privacyHealthErasureRoute} from './privacy-health-erasure-route-v1.js';
import {commerceStripeRoutes} from './commerce-stripe-v1.js';
import {fastMemberStateRoute} from './member-state-fast-v1.js';
import {askTimberRoutes} from './ask-timber-v1.js';

const MEMBER_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const GIT_MEMBER_ASSETS=new Map([
  ['/api-adapter-v33d.js','application/javascript; charset=utf-8'],
  ['/member-product-v33d.js','application/javascript; charset=utf-8'],
  ['/member-grub-programme-v1.js','application/javascript; charset=utf-8'],
  ['/member-grub-programme-v1.css','text/css; charset=utf-8'],
  ['/member-grub.html','text/html; charset=utf-8'],
  ['/member-shell-v33g.js','application/javascript; charset=utf-8'],
  ['/member-progress-v1.js','application/javascript; charset=utf-8'],
  ['/member-progress-picture-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-plans-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-plans-premium-v1.css','text/css; charset=utf-8'],
  ['/member-today-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-today-premium-v1.css','text/css; charset=utf-8'],
  ['/member-my-timber-problem-v1.js','application/javascript; charset=utf-8'],
  ['/shift-me-api-v1.js','application/javascript; charset=utf-8'],
  ['/member-shift-me-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-shift-me-premium-v1.css','text/css; charset=utf-8'],
  ['/member-life-back-v1.js','application/javascript; charset=utf-8'],
  ['/member-life-back-v1.css','text/css; charset=utf-8'],
  ['/member-medicines-watch-v1.js','application/javascript; charset=utf-8'],
  ['/member-medicines-watch-v1.css','text/css; charset=utf-8'],
  ['/member-sport-v1.js','application/javascript; charset=utf-8'],
  ['/member-sport-v1.css','text/css; charset=utf-8']
]);
function isMemberProductPath(path){return path.startsWith('/v1/shift/')||path.startsWith('/v1/shift-me')||path.startsWith('/v1/sport/')||path.startsWith('/v1/grub/')||path.startsWith('/v1/fit/')||path.startsWith('/v1/hydration/')||path.startsWith('/v1/plan/')||path.startsWith('/v1/progress/')||path==='/v1/progress'||path==='/v1/member-state'||path.startsWith('/v1/auth/')||path.startsWith('/v1/privacy/')||path==='/v1/events';}
function memberCorsHeaders(request){const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Shift-Commissioning-OIDC','Vary':'Origin'};if(MEMBER_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withMemberCors(response,request){const headers=new Headers(response.headers);for(const [k,v]of Object.entries(memberCorsHeaders(request)))headers.set(k,v);if(!headers.has('X-Shift-Request-Id'))headers.set('X-Shift-Request-Id',crypto.randomUUID());headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
async function gitMemberAsset(path,env){
  const contentType=GIT_MEMBER_ASSETS.get(path)||(/^\/assets\/fit\/premium\/[a-z0-9-]+\.svg$/.test(path)?'image/svg+xml; charset=utf-8':null);if(!env.MEMBER_ASSETS||!contentType)return null;
  const asset=await env.MEMBER_ASSETS.fetch(new Request(`https://member-assets.local${path}`,{method:'GET'}));
  if(!asset.ok)return new Response('member asset unavailable',{status:502,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  const headers=new Headers(asset.headers);headers.set('Content-Type',contentType);headers.set('Cache-Control','public, max-age=300, must-revalidate');headers.set('X-Content-Type-Options','nosniff');headers.set('X-Shift-Frontend-Authority',`git:frontend/member${path}`);
  return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
}
function deferAnalytics(ctx,work,label){
  const task=Promise.resolve().then(work).catch(e=>console.warn(`${label}_failed`,e?.message));
  if(ctx?.waitUntil)ctx.waitUntil(task);
  return task;
}
async function coreAuthFetch(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/',registration=request.method==='POST'&&path==='/v1/auth/register',startedAt=registration?new Date().toISOString():null;
  const fast=await fastMemberRegister(request,env);const response=fast||await hq.fetch(request,env,ctx);
  if(registration&&response.ok){
    const copy=response.clone(),registrationPath=fast?'fast-v2':'core';
    deferAnalytics(ctx,async()=>{
      const data=await copy.json().catch(()=>null),uid=Number(data?.user?.id||0);if(!uid)return;
      await recordProductEvent(env,{userId:uid,eventName:'registration_started',surface:'registration',source:'server',occurredAt:startedAt,properties:{path:registrationPath}});
      await recordProductEvent(env,{userId:uid,eventName:'registration_completed',surface:'registration',source:'server',properties:{path:registrationPath}});
    },'analytics_registration');
  }
  return response;
}

export default {
  async fetch(request,env,ctx){
    const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/member/grub'||path==='/member/grub.html'||path==='/member-grub')){
      if(!env.MEMBER_ASSETS)return new Response('Grub unavailable',{status:503});
      return env.MEMBER_ASSETS.fetch(new Request(new URL('/member-grub',request.url),request));
    }
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/'||path==='/member/dashboard'||path==='/member/dashboard.html'||path==='/member-login'||path==='/member-register'||path==='/my-timber-preview')){
      if(!env.MEMBER_ASSETS)return new Response('preview shell unavailable',{status:503});
      return env.MEMBER_ASSETS.fetch(new Request(new URL('/my-timber-preview',request.url),request));
    }
    if((request.method==='GET'||request.method==='HEAD')&&path==='/shift-me')return Response.redirect(new URL('/member/dashboard#shiftme',request.url),302);
    const shiftMe3DProof=await shiftMe3DProofRoutes(request);if(shiftMe3DProof)return shiftMe3DProof;
    const gitAsset=await gitMemberAsset(path,env);if(gitAsset)return gitAsset;
    const contrast=await memberContrastStatic(request,env);if(contrast)return contrast;
    const askTimber=await askTimberRoutes(request,env);if(askTimber)return askTimber;
    const commerce=await commerceStripeRoutes(request,env,ctx);if(commerce)return commerce;
    if(request.method==='OPTIONS'&&isMemberProductPath(path))return new Response(null,{status:204,headers:memberCorsHeaders(request)});

    const loginAnalyticsRequest=request.method==='POST'&&path==='/v1/auth/login'?request.clone():null;
    const fastLogin=await fastMemberLogin(request,env);
    if(fastLogin){
      if(loginAnalyticsRequest){const responseCopy=fastLogin.clone();deferAnalytics(ctx,()=>recordFinalLogin(loginAnalyticsRequest,responseCopy,env),'analytics_login');}
      return withMemberCors(fastLogin,request);
    }
    const commissioningOps=await commissioningOpsRoutes(request,env);if(commissioningOps)return commissioningOps;
    const commissioningIdentity=await handleCommissioningIdentity(request,env,ctx,coreAuthFetch);
    if(commissioningIdentity)return withMemberCors(commissioningIdentity,request);

    const emailVerification=await handleEmailVerification(request,env,ctx,coreAuthFetch);
    if(emailVerification){
      if(loginAnalyticsRequest){const responseCopy=emailVerification.clone();deferAnalytics(ctx,()=>recordFinalLogin(loginAnalyticsRequest,responseCopy,env),'analytics_login');}
      return withMemberCors(emailVerification,request);
    }

    const authRecovery=await handleAuthRecovery(request,env,ctx,(req,e,c)=>hq.fetch(req,e,c));
    if(authRecovery)return withMemberCors(authRecovery,request);

    const fastMemberState=await fastMemberStateRoute(request,env);if(fastMemberState)return withMemberCors(fastMemberState,request);
    const healthErasure=await privacyHealthErasureRoute(request,env,ctx,(req,e,c)=>hq.fetch(req,e,c));if(healthErasure)return withMemberCors(healthErasure,request);
    const shiftMe=await shiftMeRoutes(request,env,ctx);if(shiftMe)return withMemberCors(shiftMe,request);
    const sportClubhouse=await sportClubhouseRoutes(request,env);if(sportClubhouse)return withMemberCors(sportClubhouse,request);
    const editorial=await knowledgeEditorialRoutes(request,env,ctx); if(editorial)return editorial;
    const commissioning=await memberCommissioningRoute(request,env,ctx); if(commissioning)return isMemberProductPath(path)?withMemberCors(commissioning,request):commissioning;
    const visualise=await shiftVisualiseV2Routes(request,env,ctx); if(visualise)return withMemberCors(visualise,request);
    const brain=await shiftBrainRoutes(request,env,ctx); if(brain)return withMemberCors(brain,request);
    const analytics=await analyticsRoutes(request,env,ctx); if(analytics)return withMemberCors(analytics,request);
    const knowledge=await knowledgeRoutes(request,env,ctx); if(knowledge)return isMemberProductPath(path)?withMemberCors(knowledge,request):knowledge;
    const daily=await memberDailyV3Routes(request,env,ctx); if(daily)return withMemberCors(daily,request);
    const practical=await memberPracticalRoutes(request,env,ctx); if(practical)return withMemberCors(practical,request);
    const memberV8=await memberProductV8Routes(request,env,ctx); if(memberV8)return withMemberCors(memberV8,request);
    const personal=await personalRoutes(request,env,ctx); if(personal)return withMemberCors(personal,request);
    const radarPublic=await radarPublicRoutes(request,env); if(radarPublic)return radarPublic;
    const radar=await radarRoutes(request,env,ctx); if(radar)return radar;
    const legacyBody=(request.method==='PATCH'&&path==='/v1/member-state')?await request.clone().json().catch(()=>({})):null;
    const fallback=await hq.fetch(request,env,ctx);
    if(fallback.ok&&(path==='/v1/member-state'||path==='/v1/progress'))await recordLegacyJourneyEvent(request,env,ctx,path,legacyBody);
    return isMemberProductPath(path)?withMemberCors(fallback,request):fallback;
  },
  async scheduled(controller,env,ctx){
    const job=Promise.all([runScheduledIntelligence(env),runRadarScheduledScan(env),runKnowledgeFlywheel(env,{limit:1000})])
      .then(r=>console.log('shift_scheduled_intelligence',JSON.stringify(r)))
      .catch(e=>console.error('shift_scheduled_intelligence_failed',e?.message));
    if(ctx?.waitUntil)ctx.waitUntil(job); else await job;
  }
};

async function recordFinalLogin(request,response,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';if(request.method!=='POST'||path!=='/v1/auth/login')return;
  const supplied=await request.json().catch(()=>({}));let body={};try{body=await response.json()}catch{}
  let uid=Number(body?.user?.id||0);
  if(!uid){const email=String(supplied?.email||'').trim().toLowerCase();if(email){const row=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=?').bind(email).first().catch(()=>null);uid=Number(row?.id||0)}}
  if(!uid)return;
  try{
    if(response.ok){
      const prior=await env.DB.prepare(`SELECT COUNT(*) c FROM product_events WHERE user_id=? AND event_name='login_succeeded'`).bind(uid).first().catch(()=>({c:0}));
      await recordProductEvent(env,{userId:uid,eventName:'login_succeeded',surface:'auth',source:'server',properties:{verified:true}});
      if(Number(prior?.c||0)>0)await recordProductEvent(env,{userId:uid,eventName:'member_returned',surface:'auth',source:'server',properties:{via:'login'}});
    }else{
      await recordProductEvent(env,{userId:uid,eventName:'error_presented',surface:'auth',source:'server',properties:{reason:String(body?.error||`http_${response.status}`).slice(0,80),status:response.status}});
    }
  }catch(e){console.warn('analytics_login_failed',e?.message)}
}
async function recordLegacyJourneyEvent(request,env,ctx,path,body){
  const me=await hq.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!me.ok)return;const data=await me.json().catch(()=>({})),uid=Number(data?.user?.id||0);if(!uid)return;
  try{
    if(path==='/v1/progress'&&request.method==='POST')await recordProductEvent(env,{userId:uid,eventName:'progress_logged',surface:'progress',source:'server',properties:{retained:true}});
    if(path==='/v1/member-state'&&request.method==='PATCH'&&body&&body.myWhy&&body.preferences){
      const prior=await env.DB.prepare(`SELECT COUNT(*) c FROM product_events WHERE user_id=? AND event_name='onboarding_completed'`).bind(uid).first().catch(()=>({c:0}));
      if(!Number(prior?.c||0))await recordProductEvent(env,{userId:uid,eventName:'onboarding_completed',surface:'onboarding',source:'server',properties:{profileContext:true}});
    }
  }catch(e){console.warn('analytics_legacy_journey_failed',e?.message)}
}
