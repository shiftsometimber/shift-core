import core from '../worker-entry-v6.js';
export * from '../worker-entry-v6.js';
import {coachingRoutes} from './routes.mjs';
import {coachingAsset,withCoaching} from './presentation.mjs';
import {runCoachingNight} from './night-job.mjs';
// Every original handler, binding, cron and public response passes through.
// Only the member-owned coaching API, its assets and dashboard wrapper are new.
export default {
 ...core,
 async fetch(request,env,ctx){
  const asset=coachingAsset(request);if(asset)return asset;
  const coaching=await coachingRoutes(request,env);if(coaching)return coaching;
  return withCoaching(request,await core.fetch(request,env,ctx));
 },
 async scheduled(controller,env,ctx){
  await core.scheduled(controller,env,ctx);
  const job=runCoachingNight(env).then(r=>console.log('shift_coach_night',JSON.stringify(r))).catch(e=>console.error('shift_coach_night_failed',e.status||'unavailable'));
  if(ctx?.waitUntil)ctx.waitUntil(job);else await job;
 }
};
