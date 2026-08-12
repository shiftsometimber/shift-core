import core from './worker.js';
import {memberDailyV2Routes} from './member-daily-v2.js';
import {buildShiftBrainContext} from './shift-brain-v1.js';
import {recordProductEvent} from './product-analytics-v1.js';

export async function memberDailyV3Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path!=='/v1/shift/today'||request.method!=='GET')return memberDailyV2Routes(request,env,ctx);
  const a=await auth(request,env,ctx);if(a.response)return a.response;const uid=Number(a.user.id);
  const [base,brain]=await Promise.all([memberDailyV2Routes(request,env,ctx),buildShiftBrainContext(env,uid,'today',{knowledgeLimit:0})]);
  if(!base?.ok)return base;
  const payload=await base.clone().json().catch(()=>null);if(!payload?.today)return base;
  const feedback=brain.behaviour.feedback.summary||{},active=Object.keys(brain.plans.active||{}),latest=brain.progress.latest;
  payload.today.brain={contract:brain.contract,activePlans:active,feedbackSummary:feedback,memorySignals:brain.memory.intelligent.length,latestProgressDate:latest?.recorded_on||null};
  payload.today.context_used={...(payload.today.context_used||{}),one_shift_brain:true,canonical_contract:brain.contract};
  payload.today.rule='One Shift Brain is the shared member context. Current member statements and safety/clinical boundaries override optimisation.';
  const eventJob=recordProductEvent(env,{userId:uid,eventName:'today_viewed',surface:'shift_today',source:'server',properties:{actions:payload.today.actions?.length||0,activePlans:active.length,memorySignals:brain.memory.intelligent.length}}).catch(e=>console.warn('analytics_today_failed',e?.message));if(ctx?.waitUntil)ctx.waitUntil(eventJob);else await eventJob;
  return new Response(JSON.stringify(payload),{status:base.status,headers:base.headers});
}

async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
