import {tabletRoutineRoutes} from '../member-experience/tablet-routine.mjs';
import core from '../worker-entry-v6.js';
import {withPublicFontDelivery} from './public-font-delivery.mjs';
export * from '../worker-entry-v6.js';
import {coachingRoutes} from './routes.mjs';
import {coachingAsset,withCoaching} from './presentation.mjs';
import {runCoachingNight} from './night-job.mjs';
// Every original handler, binding, cron and public response passes through.
// Only the member-owned coaching API, its assets and dashboard wrapper are new.
export default {
 ...core,
 async fetch(request,env,ctx){
  const tablet=await tabletRoutineRoutes(request,env);if(tablet)return tablet;
  const asset=coachingAsset(request);if(asset)return asset;
  const coaching=await coachingRoutes(request,env);if(coaching)return coaching;
  const response=await withPublicFontDelivery(request,await core.fetch(request,env,ctx));
  let seed=null;const url=new URL(request.url);
  if(request.method==='GET'&&/^\/member\/dashboard(?:\.html)?$/.test(url.pathname)&&response.status===200&&response.headers.get('Content-Type')?.includes('text/html')){
   url.pathname='/v1/shift-coach';url.search='';
   try{const initial=await coachingRoutes(new Request(url,{method:'GET',headers:request.headers}),env);if(initial?.ok)seed=await initial.json();}catch{/* Client keeps its normal retry path; no unchecked snapshot is used. */}
  }
  return withCoaching(request,response,seed);
 },
 async scheduled(controller,env,ctx){
  await core.scheduled(controller,env,ctx);
  const job=runCoachingNight(env).then(r=>console.log('shift_coach_night',JSON.stringify(r))).catch(e=>console.error('shift_coach_night_failed',e.status||'unavailable'));
  if(ctx?.waitUntil)ctx.waitUntil(job);else await job;
 }
};
