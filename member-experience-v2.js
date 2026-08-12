import core from './worker.js';
import {listProactiveInsights,buildProactiveInsights,nextDeliverableInsight,markInsightDelivered} from './proactive-insights.js';
import {getMemoryPrivacy} from './memory-privacy.js';
import {buildShiftBrainContext} from './shift-brain-v1.js';

export async function memberBootstrap(request,env,ctx){
  const a=await auth(request,env,ctx);if(a.response)return a.response;const uid=Number(a.user.id);
  const [brain]=await Promise.all([buildShiftBrainContext(env,uid,'',{knowledgeLimit:0}),buildProactiveInsights(env,uid)]);
  const prefs=brain.memory.privacy,insights=(Number(prefs.proactive_insights)?await listProactiveInsights(env.DB,uid):[]).filter(x=>Number(x.confidence||0)>=0.80).slice(0,3);
  return json({ok:true,experience:'Shift AI',member:{id:uid,name:brain.member.profile.first_name||null},brain:{contract:brain.contract,activePlans:Object.keys(brain.plans.active),latestProgress:brain.progress.latest,feedbackSummary:brain.behaviour.feedback.summary},memory:{enabled:!!Number(prefs.auto_memory),count:brain.memory.intelligent.length,preview:brain.memory.intelligent.slice(0,4)},proactive:{enabled:!!Number(prefs.proactive_insights),cooldownHours:Number(prefs.proactive_cooldown_hours||48),insights},ui:{headline:'Your Shift',subhead:'Pick up where you left off. No starting from scratch.',composerPlaceholder:'What’s going on?',showMemoryControls:true,showProactiveCards:true}})
}

export async function proactiveFeed(request,env,ctx){
  const a=await auth(request,env,ctx);if(a.response)return a.response;const uid=Number(a.user.id),brain=await buildShiftBrainContext(env,uid,'',{knowledgeLimit:0}),prefs=brain.memory.privacy;
  if(!Number(prefs.proactive_insights))return json({ok:true,insights:[],reason:'proactive_disabled',brainContract:brain.contract});
  await buildProactiveInsights(env,uid);const insight=await nextDeliverableInsight(env.DB,uid);
  if(!insight)return json({ok:true,insights:[],cooldownHours:Number(prefs.proactive_cooldown_hours||48),brainContract:brain.contract});
  await markInsightDelivered(env.DB,uid,insight.id);return json({ok:true,insights:[insight],cooldownHours:Number(prefs.proactive_cooldown_hours||48),brainContract:brain.contract,contextUsed:{activePlans:Object.keys(brain.plans.active),feedback:brain.behaviour.feedback.summary,memorySignals:brain.memory.intelligent.length}})
}

async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
