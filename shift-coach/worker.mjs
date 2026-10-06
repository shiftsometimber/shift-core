import {withContextSeo} from '../public-seo-context.mjs';
import {discoveryRoute,withDiscoverySeo} from '../public-seo-discovery.mjs';
import {withApprovedSeo} from '../public-seo-approved.mjs';
import {worksheetRoute} from '../prescriber-questions.mjs';
import {withTechnicalSeo} from '../public-seo-technical.mjs';
import {withProgrammeSeo} from '../public-seo-programme.mjs';
import {withSeoFollowThrough} from '../public-seo-follow-through.mjs';
import {withCatalogueBenefits} from '../catalogue-benefits.mjs';
import {tabletRoutineRoutes} from '../member-experience/tablet-routine.mjs';
import {trustRoute,withTrustRepair,pages,withContactReference} from './public-trust-repair.mjs';
import core from '../worker-entry-v6.js';
import {withPublicFontDelivery} from './public-font-delivery.mjs';
export * from '../worker-entry-v6.js';
import {supportTeamRoutes,withSupportTeamLink} from './support-team.mjs';
import {coachingRoutes} from './routes.mjs';
import {coachingAsset,withCoaching} from './presentation.mjs';
import {runCoachingNight} from './night-job.mjs';
import {withFitActiveEdit} from './fit-active-edit.mjs';
// Every original handler, binding, cron and public response passes through.
// Only the member-owned coaching API, its assets and dashboard wrapper are new.
export default {
 ...core,
 async fetch(request,env,ctx){
  const tablet=await tabletRoutineRoutes(request,env);if(tablet)return tablet;
  const discovery=discoveryRoute(request);if(discovery)return discovery;
  const worksheet=worksheetRoute(request);if(worksheet)return worksheet;
  request=await withContactReference(request);
  const trust=trustRoute(request);if(trust)return trust;
  const pagePath=new URL(request.url).pathname.replace(/\.html$/,'').replace(/\/+$/,'');
  if(pages[pagePath]&&['GET','HEAD'].includes(request.method)){const u=new URL(request.url);u.pathname='/terms';u.search='';return withApprovedSeo(await withTrustRepair(request,await core.fetch(new Request(u,{method:'GET',headers:request.headers}),env,ctx)),request);}
  const asset=coachingAsset(request);if(asset)return asset;
  const team=await supportTeamRoutes(request,env);if(team)return team;
  const coaching=await coachingRoutes(request,env);if(coaching)return coaching;
  const response=await withSupportTeamLink(request,await withPublicFontDelivery(request,await withTrustRepair(request,await core.fetch(request,env,ctx))));
  let seed=null;const url=new URL(request.url);
  if(request.method==='GET'&&/^\/member\/dashboard(?:\.html)?$/.test(url.pathname)&&response.status===200&&response.headers.get('Content-Type')?.includes('text/html')){
   url.pathname='/v1/shift-coach';url.search='';
   try{const initial=await coachingRoutes(new Request(url,{method:'GET',headers:request.headers}),env);if(initial?.ok)seed=await initial.json();}catch{/* Client keeps its normal retry path; no unchecked snapshot is used. */}
  }
  return withContextSeo(await withDiscoverySeo(await withApprovedSeo(await withTechnicalSeo(await withSeoFollowThrough(await withProgrammeSeo(await withCatalogueBenefits(request,await withCoaching(request,await withFitActiveEdit(request,response),seed)),request),request),request),request),request),request);
 },
 async scheduled(controller,env,ctx){
  await core.scheduled(controller,env,ctx);
  const job=runCoachingNight(env).then(r=>console.log('shift_coach_night',JSON.stringify(r))).catch(e=>console.error('shift_coach_night_failed',e.status||'unavailable'));
  if(ctx?.waitUntil)ctx.waitUntil(job);else await job;
 }
};
