import {recordServiceJob} from '../hq-service-job-runs.mjs';
import {foodCaptureRoutes} from '../member-experience/food-capture.mjs';
import {withHealthKnowledgeWorker} from '../knowledge-health/production.mjs';
import {withDynamicBabyLoveDiscovery} from '../babylove/dynamic-public.mjs';
import {repairHomeSpeed} from '../home-speed-repair.mjs';
import {withPublicResponsePolicyWorker} from '../public-response-policy.mjs';
import {withRootShareWorker} from '../share-preview/metadata.mjs';
import {withMaleObesity} from '../obesity-awareness/production.mjs';
import {withPublicToolDelivery} from '../public-tool-delivery.mjs';
import {withContextSeo} from '../public-seo-context.mjs';
import {withPublicSeoCloseout} from '../public-seo-closeout.mjs';
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
const composedWorker = {
 ...core,
 async fetch(request,env,ctx){
  const capture=await foodCaptureRoutes(request,env);if(capture)return capture;
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
  const publicResponse=await withContextSeo(await withDiscoverySeo(await withApprovedSeo(await withTechnicalSeo(await withSeoFollowThrough(await withProgrammeSeo(await withCatalogueBenefits(request,await withCoaching(request,await withFitActiveEdit(request,response),seed)),request),request),request),request),request),request);
  return withPublicToolDelivery(await (url.pathname.replace(/\/+$/,'')==='/articles/oral-semaglutide-for-weight-loss'?withPublicSeoCloseout(publicResponse,request):publicResponse),request);
 },
 async scheduled(controller,env,ctx){
  await core.scheduled(controller,env,ctx);
  const job=recordServiceJob(env.DB,'core_coaching',new Date(controller.scheduledTime || Date.now()).toISOString(),()=>runCoachingNight(env)).then(r=>console.log('shift_coach_night',JSON.stringify(r))).catch(e=>console.error('shift_coach_night_failed',e.status||'unavailable'));
  if(ctx?.waitUntil)ctx.waitUntil(job);else await job;
 }
};

const publicWorker=withHealthKnowledgeWorker(withPublicResponsePolicyWorker(withRootShareWorker(withMaleObesity(composedWorker))));
// Evaluate the already-approved CSS against the settled outer document.
export default {...publicWorker,async fetch(request,...args){
 let response=await publicWorker.fetch(request,...args);
 response=await withDynamicBabyLoveDiscovery(response,request,args[0]);
 if(request.method!=='GET'||new URL(request.url).pathname!=='/'||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const before=await response.text(),after=repairHomeSpeed(before,'/',{final:true});
 if(after===before)return new Response(before,response);
 const headers=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}};
