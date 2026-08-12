import core from './worker.js';
import {memberProductV5Routes} from './member-product-v5.js';
import {buildShiftBrainContext} from './shift-brain-v1.js';
import {recordProductEvent} from './product-analytics-v1.js';
import {assessMemberOutput} from './member-quality-v1.js';

const OWNED=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/fit/plan','/v1/fit/replace']);

export async function memberProductV6Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!OWNED.has(path)||request.method!=='POST')return memberProductV5Routes(request,env,ctx);
  const a=await auth(request,env,ctx);if(a.response)return a.response;const uid=Number(a.user.id);
  const body=await read(request.clone()),brain=await buildShiftBrainContext(env,uid,'',{knowledgeLimit:0});
  const product=path.startsWith('/v1/grub/')?'grub':'fit',nays=brain.behaviour.feedback.nay.filter(x=>x.product===product).map(x=>x.entity_id),prefs=brain.member.state.preferences||{};
  const merged={...body,exclude:[...new Set([...(Array.isArray(body.exclude)?body.exclude:[]),...nays])],brain_contract:brain.contract};
  if(product==='grub'){
    if(body.preferences===undefined&&Object.keys(prefs).length)merged.preferences=JSON.stringify(prefs);
    if(body.dislikes===undefined&&prefs.dislikes)merged.dislikes=Array.isArray(prefs.dislikes)?prefs.dislikes.join(', '):String(prefs.dislikes);
    if(body.dietaryRequirements===undefined&&prefs.dietaryRequirements)merged.dietaryRequirements=Array.isArray(prefs.dietaryRequirements)?prefs.dietaryRequirements.join(', '):String(prefs.dietaryRequirements);
  }else{
    if(body.preferences===undefined&&Object.keys(prefs).length)merged.preferences=JSON.stringify(prefs);
    if(body.limitations===undefined&&prefs.limitations)merged.limitations=Array.isArray(prefs.limitations)?prefs.limitations.join(', '):String(prefs.limitations);
    if(body.equipment===undefined&&prefs.equipment)merged.equipment=prefs.equipment;
    if(body.location===undefined&&prefs.exercise_location)merged.location=prefs.exercise_location;
  }
  const forwarded=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(merged)}),response=await memberProductV5Routes(forwarded,env,ctx);
  if(!response?.ok)return response;
  const payload=await response.clone().json().catch(()=>null);if(!payload)return response;
  const quality=assessMemberOutput(product,payload,merged);payload.qualityCommissioning=quality;
  if(!quality.ok){const job=recordProductEvent(env,{userId:uid,eventName:'error_presented',surface:`shift_${product}`,source:'server',properties:{reason:'semantic_quality_floor',issueCodes:quality.issues.map(x=>x.code).join(',').slice(0,300)}}).catch(()=>{});if(ctx?.waitUntil)ctx.waitUntil(job);else await job;return new Response(JSON.stringify({ok:false,error:'quality_gate_failed',message:'Shift rejected a recommendation that did not meet the member quality bar. Please retry.',quality}),{status:503,headers:response.headers});}
  payload.oneShiftBrain={contract:brain.contract,preferencesApplied:Object.keys(prefs).length>0,historicalNaysApplied:nays.length};
  const eventName=path.endsWith('/plan')?(product==='grub'?'grub_plan_generated':'fit_plan_generated'):null;
  if(eventName){const eventJob=recordProductEvent(env,{userId:uid,eventName,surface:`shift_${product}`,source:'server',properties:{oneShiftBrain:true,preferencesApplied:Object.keys(prefs).length>0,historicalNaysApplied:nays.length,qualityScore:quality.score,qualityReview:quality.requiresReview,days:Number(body.days)||null,minutesPerDay:product==='fit'?Number(body.minutes_per_day)||null:null}}).catch(e=>console.warn('analytics_product_failed',e?.message));if(ctx?.waitUntil)ctx.waitUntil(eventJob);else await eventJob;}
  return new Response(JSON.stringify(payload),{status:response.status,headers:response.headers});
}

async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
async function read(r){try{return await r.json()}catch{return{}}}
