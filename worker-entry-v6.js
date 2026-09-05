export {SiteContentState} from './site-content-state-v1.js';
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
import {medicineCommerceRoutes} from './medicine-commerce-v1.js';
import {fastMemberStateRoute,authenticateMember} from './member-state-fast-v1.js';
import {askTimberRoutes} from './ask-timber-v1.js';
import {fitReminderRoutes,runFitMorningReminders} from './fit-reminders-v1.js';
import {tapRoomRoutes} from './tap-room-v1.js';
import {myJourneyRoutes} from './my-journey-v1.js';
import {penDayRoutes} from './pen-day-v1.js';
import {myJourneyCheckInRoutes,myJourneyTrendRoutes} from './my-journey-checkin-v1.js';
import {hqCommerceContentRoutes} from './hq-commerce-content-v1.js';
import {hqCatalogueRoutes} from './hq-catalogue-v1.js';
import {continuityInterestRoutes} from './continuity-interest-v1.js';

const MEMBER_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const HQ_ORIGINS=new Set(['https://hq.shiftsometimber.co.uk']);
const GIT_MEMBER_ASSETS=new Map([
  ['/api-adapter-v33d.js','application/javascript; charset=utf-8'],
  ['/member-product-v33d.js','application/javascript; charset=utf-8'],
  ['/member-grub-programme-v1.js','application/javascript; charset=utf-8'],
  ['/member-grub-programme-v1.css','text/css; charset=utf-8'],
  ['/member-grub.html','text/html; charset=utf-8'],
  ['/member-fit-programme-v1.js','application/javascript; charset=utf-8'],
  ['/member-fit-programme-v1.css','text/css; charset=utf-8'],
  ['/shift-push-sw-v1.js','application/javascript; charset=utf-8'],
  ['/member-fit.html','text/html; charset=utf-8'],
  ['/my-timber-v11.css','text/css; charset=utf-8'],
  ['/my-timber-v11.js','application/javascript; charset=utf-8'],
  ['/sst-logo-official.png','image/png'],
  ['/member-shell-v33g.js','application/javascript; charset=utf-8'],
  ['/member-progress-v1.js','application/javascript; charset=utf-8'],
  ['/member-progress-picture-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-plans-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-plans-premium-v1.css','text/css; charset=utf-8'],
  ['/member-today-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-today-premium-v1.css','text/css; charset=utf-8'],
  ['/member-today-final-v1.css','text/css; charset=utf-8'],
  ['/member-my-timber-problem-v1.js','application/javascript; charset=utf-8'],
  ['/shift-me-api-v1.js','application/javascript; charset=utf-8'],
  ['/member-shift-me-premium-v1.js','application/javascript; charset=utf-8'],
  ['/member-shift-me-premium-v1.css','text/css; charset=utf-8'],
  ['/member-life-back-v1.js','application/javascript; charset=utf-8'],
  ['/member-life-back-v1.css','text/css; charset=utf-8'],
  ['/member-my-journey-v1.js','application/javascript; charset=utf-8'],
  ['/member-my-journey-v1.css','text/css; charset=utf-8'],
  ['/member-medicines-watch-v1.js','application/javascript; charset=utf-8'],
  ['/member-medicines-watch-v1.css','text/css; charset=utf-8'],
  ['/member-treatment-journey-v1.js','application/javascript; charset=utf-8'],
  ['/member-pen-day-v1.js','application/javascript; charset=utf-8'],
  ['/member-sport-v1.js','application/javascript; charset=utf-8'],
  ['/member-sport-v1.css','text/css; charset=utf-8'],
  ['/tap-room-v1.js','application/javascript; charset=utf-8'],
  ['/tap-room-v1.css','text/css; charset=utf-8'],
  ['/lounge-nav-v1.css','text/css; charset=utf-8'],
  ['/tap-room-cork.webp','image/webp'],
  ['/tap-room-paper.webp','image/webp']
  ,['/tap-room-landing.webp','image/webp']
  ,['/tap-room-sport.webp','image/webp']
  ,['/tap-room-travel.webp','image/webp']
  ,['/tap-room-food-table.webp','image/webp']
  ,['/tap-room-food-conversation.webp','image/webp']
  ,['/tap-room-treatment.webp','image/webp']
  ,['/tap-room-confidence.webp','image/webp']
  ,['/tap-room-general.webp','image/webp']
  ,['/member-my-journey-checkin-v1.js','application/javascript; charset=utf-8']
  ,['/member-my-journey-checkin-v1.css','text/css; charset=utf-8']
]);
function isMemberProductPath(path){return path==='/v1/continuity-interest'||path==='/v1/journey'||path.startsWith('/v1/journey/')||path==='/v1/my-journey'||path.startsWith('/v1/treatment/')||path.startsWith('/v1/tap-room')||path.startsWith('/v1/lounge')||path.startsWith('/v1/shift/')||path.startsWith('/v1/shift-me')||path.startsWith('/v1/sport/')||path.startsWith('/v1/grub/')||path.startsWith('/v1/fit/')||path.startsWith('/v1/hydration/')||path.startsWith('/v1/plan/')||path.startsWith('/v1/progress/')||path==='/v1/progress'||path==='/v1/member-state'||path.startsWith('/v1/auth/')||path.startsWith('/v1/privacy/')||path==='/v1/events';}
function memberCorsHeaders(request){const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Shift-Commissioning-OIDC, X-Shift-Local-Date, X-Shift-Local-Hour','Vary':'Origin'};if(MEMBER_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withMemberCors(response,request){const headers=new Headers(response.headers);for(const [k,v]of Object.entries(memberCorsHeaders(request)))headers.set(k,v);if(!headers.has('X-Shift-Request-Id'))headers.set('X-Shift-Request-Id',crypto.randomUUID());headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
function withHqCors(response,request){const origin=request.headers.get('Origin')||'';if(!HQ_ORIGINS.has(origin))return response;const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Credentials','true');headers.set('Access-Control-Allow-Methods','GET, POST, PATCH, PUT, DELETE, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Vary','Origin');headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');if(!headers.has('X-Shift-Request-Id'))headers.set('X-Shift-Request-Id',crypto.randomUUID());return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
async function gitMemberAsset(path,env){
  const contentType=GIT_MEMBER_ASSETS.get(path)||(/^\/assets\/fit\/premium\/[a-z0-9-]+\.svg$/.test(path)?'image/svg+xml; charset=utf-8':null);if(!env.MEMBER_ASSETS||!contentType)return null;
  const asset=await env.MEMBER_ASSETS.fetch(new Request(`https://member-assets.local${path}`,{method:'GET'}));
  if(!asset.ok)return new Response('member asset unavailable',{status:502,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  const headers=new Headers(asset.headers);headers.set('Content-Type',contentType);headers.set('Cache-Control','public, max-age=300, must-revalidate');headers.set('X-Content-Type-Options','nosniff');headers.set('X-Shift-Frontend-Authority',`git:frontend/member${path}`);
  if(path==='/shift-push-sw-v1.js'){headers.set('Service-Worker-Allowed','/');headers.set('Cache-Control','no-cache')}
  return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
}
function deferAnalytics(ctx,work,label){
  const task=Promise.resolve().then(work).catch(e=>console.warn(`${label}_failed`,e?.message));
  if(ctx?.waitUntil)ctx.waitUntil(task);
  return task;
}
async function rewritePublicLoungeChrome(response){
  const type=String(response.headers.get('Content-Type')||'').toLowerCase();
  if(!response.ok||!type.includes('text/html'))return response;
  const source=await response.text(),body=source
    .replaceAll('href="/tap-room"','href="/lounge"')
    .replaceAll('href="/tap-room.html"','href="/lounge"')
    .replaceAll('>The Tap Room<','>The Lounge<')
    .replaceAll('>Tap Room<','>The Lounge<')
    .replaceAll('>TAP ROOM<','>THE LOUNGE<');
  const headers=new Headers(response.headers);headers.delete('Content-Length');
  if(body!==source)headers.set('X-Shift-Lounge-Chrome','v1');
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}
const PUBLIC_CHROME_PATCH=`;(()=>{const rename=()=>{for(const link of document.querySelectorAll('a[href]')){let path='';try{path=new URL(link.href,location.href).pathname.replace(/\\/+$/,'')||'/'}catch{}if(path==='/tap-room'||path==='/tap-room.html'){link.href='/lounge';const label=(link.textContent||'').trim();if(/^(?:the )?tap room$/i.test(label))link.textContent='The Lounge'}}};const fullWire=async()=>{const path=location.pathname.replace(/\\.html$/,'').replace(/\\/+$/,'')||'/';if(!['/explore-knowledge','/treatment-centre'].includes(path)||document.querySelector('[data-shift-ai-full-wire]'))return;const strip=document.createElement('section');strip.className='medicine-ticker-v138';strip.dataset.shiftAiFullWire='v1';strip.setAttribute('aria-label','Full approved wire from SHIFT AI Newsroom');strip.innerHTML='<strong>SHIFT AI Newsroom</strong><span data-shift-ai-wire-track>Loading approved medicines wire…</span>';const style=document.createElement('style');style.textContent='[data-shift-ai-full-wire]{display:flex;gap:18px;align-items:center;overflow:hidden;padding:11px max(18px,4vw);background:#707762;color:#050505;border-block:1px solid #050505;font:900 14px/1.35 Arial,sans-serif}[data-shift-ai-full-wire]>strong{flex:0 0 auto;letter-spacing:.04em}[data-shift-ai-wire-track]{display:block;min-width:max-content;white-space:nowrap;animation:sstFullWire 42s linear infinite}[data-shift-ai-full-wire]:hover [data-shift-ai-wire-track],[data-shift-ai-full-wire]:focus-within [data-shift-ai-wire-track]{animation-play-state:paused}@keyframes sstFullWire{from{transform:translateX(30vw)}to{transform:translateX(-100%)}}@media(prefers-reduced-motion:reduce){[data-shift-ai-wire-track]{animation:none;min-width:0;white-space:normal}}';document.head.appendChild(style);const anchor=document.querySelector('header');if(anchor)anchor.insertAdjacentElement('afterend',strip);else document.body.prepend(strip);try{const response=await fetch('/v1/radar/ticker',{credentials:'omit',cache:'no-store'}),body=await response.json();const items=Array.isArray(body.items)?body.items:[],lines=items.map(item=>String(item.ticker_line||item.headline||'').trim()).filter(Boolean);if(!response.ok||!body.current||!lines.length){strip.remove();style.remove();return}strip.querySelector('[data-shift-ai-wire-track]').textContent=lines.join('   •   ')}catch{strip.remove();style.remove()}};const start=()=>{rename();fullWire()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()})();`;
async function publicSiteConfigWithLoungeChrome(request){
  const upstream=new URL(request.url);upstream.protocol='https:';upstream.hostname='projectshift.pages.dev';upstream.port='';
  const response=await fetch(new Request(upstream,request));
  if(!response.ok)return response;
  const headers=new Headers(response.headers);headers.delete('Content-Length');headers.set('Content-Type','application/javascript; charset=utf-8');headers.set('Cache-Control','public, max-age=300, must-revalidate');headers.set('X-Shift-Lounge-Chrome','v2');
  return new Response(`${await response.text()}\n${PUBLIC_CHROME_PATCH}\n`,{status:response.status,statusText:response.statusText,headers});
}
const REVIEWED_MENTAL_HEALTH_PATHS=['/mental-health/confidence-self-worth','/mental-health/sleep-mental-health','/mental-health/mental-health-and-weight','/mental-health/talking-about-it','/mental-health/myths-men-mental-health','/mental-health/when-to-get-help'];
async function publicSitemapWithReviewedMentalHealth(request){
  const upstream=new URL(request.url);upstream.protocol='https:';upstream.hostname='projectshift.pages.dev';upstream.port='';
  const response=await fetch(new Request(upstream,{method:'GET',headers:request.headers}));if(!response.ok)return response;
  let xml=await response.text();const additions=REVIEWED_MENTAL_HEALTH_PATHS.filter(path=>!xml.includes(`<loc>https://shiftsometimber.co.uk${path}</loc>`)).map(path=>`<url><loc>https://shiftsometimber.co.uk${path}</loc><lastmod>2026-09-03</lastmod></url>`).join('');
  if(additions&&xml.includes('</urlset>'))xml=xml.replace('</urlset>',`${additions}</urlset>`);
  const headers=new Headers(response.headers);headers.delete('Content-Length');headers.set('Content-Type','application/xml; charset=utf-8');headers.set('Cache-Control','public, max-age=300, must-revalidate');headers.set('X-Shift-Sitemap-Authority','reviewed-mental-health-v1');
  return new Response(request.method==='HEAD'?null:xml,{status:response.status,statusText:response.statusText,headers});
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
    if(path==='/sitemap.xml'&&(request.method==='GET'||request.method==='HEAD'))return publicSitemapWithReviewedMentalHealth(request);
    if(path==='/site-config-v3a.js'&&(request.method==='GET'||request.method==='HEAD'))return publicSiteConfigWithLoungeChrome(request);
    // Let Shift Core answer HQ browser preflights before feature modules apply
    // session checks. A preflight has no session cookie by design.
    if(request.method==='OPTIONS'&&path.startsWith('/v1/hq/'))return withHqCors(await hq.fetch(request,env,ctx),request);
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/member/progress'||path==='/member/progress.html'||path==='/member/health-mot'||path==='/member/health-mot.html'))return Response.redirect(new URL('/member/dashboard#journey',request.url),301);
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/tap-room'||path==='/tap-room.html'||path.startsWith('/tap-room/')||path==='/member/tap-room'||path==='/member/tap-room.html'))return Response.redirect(new URL('/lounge',request.url),301);
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/lounge'||path==='/lounge.html'||path.startsWith('/lounge/'))){
      if(!env.MEMBER_ASSETS)return new Response('The Lounge is unavailable',{status:503,headers:{'X-Robots-Tag':'noindex, nofollow'}});
      const session=await authenticateTapRoomPage(request,env);if(session)return session;
      const response=await env.MEMBER_ASSETS.fetch(new Request(new URL('/tap-room-shell.txt',request.url),request));const headers=new Headers(response.headers);headers.set('Content-Type','text/html; charset=utf-8');headers.set('Cache-Control','no-store, private');headers.set('X-Robots-Tag','noindex, nofollow, noarchive, nosnippet');return new Response(response.body,{status:response.status,headers});
    }
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/member/grub'||path==='/member/grub.html'||path==='/member-grub')){
      if(!env.MEMBER_ASSETS)return new Response('Grub unavailable',{status:503});
      return env.MEMBER_ASSETS.fetch(new Request(new URL('/member-grub',request.url),request));
    }
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/member/fit'||path==='/member/fit.html'||path==='/member-fit')){
      if(!env.MEMBER_ASSETS)return new Response('Fit unavailable',{status:503});
      return env.MEMBER_ASSETS.fetch(new Request(new URL('/member-fit',request.url),request));
    }
    if((request.method==='GET'||request.method==='HEAD')&&(path==='/'||path==='/member/dashboard'||path==='/member/dashboard.html'||path==='/member-login'||path==='/member-login.html'||path==='/member-register'||path==='/member-register.html'||path==='/my-timber-preview')){
      if(!env.MEMBER_ASSETS)return new Response('preview shell unavailable',{status:503});
      return env.MEMBER_ASSETS.fetch(new Request(new URL('/my-timber-preview',request.url),request));
    }
    if((request.method==='GET'||request.method==='HEAD')&&path==='/shift-me')return Response.redirect(new URL('/member/dashboard#shiftme',request.url),302);
    const shiftMe3DProof=await shiftMe3DProofRoutes(request);if(shiftMe3DProof)return shiftMe3DProof;
    const gitAsset=await gitMemberAsset(path,env);if(gitAsset)return gitAsset;
    const contrast=await memberContrastStatic(request,env);if(contrast)return contrast;
    const hqCatalogue=await hqCatalogueRoutes(request,env,ctx);if(hqCatalogue)return withHqCors(hqCatalogue,request);
    const hqCommerceContent=await hqCommerceContentRoutes(request,env,ctx);if(hqCommerceContent)return path==='/v1/site-content'||path.startsWith('/v1/site-content/')?withMemberCors(hqCommerceContent,request):withHqCors(hqCommerceContent,request);
    const askTimber=await askTimberRoutes(request,env);if(askTimber)return askTimber;
    const continuityInterest=await continuityInterestRoutes(request,env);if(continuityInterest)return withMemberCors(continuityInterest,request);
    const medicineCommerce=await medicineCommerceRoutes(request,env,ctx);if(medicineCommerce)return medicineCommerce;
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
    const myJourney=await myJourneyRoutes(request,env);if(myJourney)return withMemberCors(myJourney,request);
    const penDay=await penDayRoutes(request,env);if(penDay)return withMemberCors(penDay,request);
    const fitReminders=await fitReminderRoutes(request,env,ctx);if(fitReminders)return withMemberCors(fitReminders,request);
    const tapRoom=await tapRoomRoutes(request,env,ctx);if(tapRoom)return withMemberCors(tapRoom,request);
    const journeyCheckIn=await myJourneyCheckInRoutes(request,env,ctx);if(journeyCheckIn)return withMemberCors(journeyCheckIn,request);
    const journeyTrends=await myJourneyTrendRoutes(request,env);if(journeyTrends)return withMemberCors(journeyTrends,request);
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
    const radar=await radarRoutes(request,env,ctx); if(radar)return path.startsWith('/v1/hq/')?withHqCors(radar,request):radar;
    const legacyBody=(request.method==='PATCH'&&path==='/v1/member-state')?await request.clone().json().catch(()=>({})):null;
    const fallback=await rewritePublicLoungeChrome(await hq.fetch(request,env,ctx));
    if(fallback.ok&&(path==='/v1/member-state'||path==='/v1/progress'))await recordLegacyJourneyEvent(request,env,ctx,path,legacyBody);
    return isMemberProductPath(path)?withMemberCors(fallback,request):fallback;
  },
  async scheduled(controller,env,ctx){
    const job=Promise.all([runScheduledIntelligence(env),runRadarScheduledScan(env),runKnowledgeFlywheel(env,{limit:1000}),runFitMorningReminders(env)])
      .then(r=>console.log('shift_scheduled_intelligence',JSON.stringify(r)))
      .catch(e=>console.error('shift_scheduled_intelligence_failed',e?.message));
    if(ctx?.waitUntil)ctx.waitUntil(job); else await job;
  }
};

async function authenticateTapRoomPage(request,env){
  const auth=await authenticateMember(request,env);if(auth.response)return Response.redirect(new URL('/member-login?returnTo=%2Flounge',request.url),302);
  const member=await env.DB.prepare(`SELECT a.email_verified,ms.user_id profile_id FROM user_auth a LEFT JOIN member_state ms ON ms.user_id=a.user_id WHERE a.user_id=?`).bind(auth.userId).first();
  if(!Number(member?.email_verified)||!member?.profile_id)return Response.redirect(new URL('/member/dashboard?lounge=verified-member-required',request.url),302);return null;
}

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
