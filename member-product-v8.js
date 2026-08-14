import core from './worker.js';
import {memberProductV7Routes} from './member-product-v7.js';
import {memberProductV6Routes} from './member-product-v6.js';
import {memberProductV5Routes} from './member-product-v5.js';
import {assessMemberOutput} from './member-quality-v1.js';
import {ensureFitDurationUtilisation} from './fit-duration-v1.js';
import {recordProductEvent} from './product-analytics-v1.js';

export async function memberProductV8Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path==='/v1/grub/plan'&&request.method==='POST'){
    const response=await memberProductV7Routes(request,env,ctx);
    if(response?.ok)await recordPlanAnalytics(request,env,ctx,'grub_plan_generated','grub');
    return response;
  }
  if(path!=='/v1/fit/plan'||request.method!=='POST')return memberProductV7Routes(request,env,ctx);

  const body=await readClone(request);
  const response=await memberProductV7Routes(rebuild(request,request.url,body),env,ctx);
  if(!response?.ok){
    const failure=await response.clone().json().catch(()=>null);
    const repetition=Array.isArray(failure?.quality?.issues)&&failure.quality.issues.some(x=>x?.code==='fit_repetition');
    if(failure?.error==='quality_gate_failed'&&repetition){
      const repaired=await repairRepeatedComposition(request,env,ctx,body,response.headers);
      if(repaired){if(repaired.ok)await recordPlanAnalytics(request,env,ctx,'fit_plan_generated','fit');return repaired;}
    }
    return response;
  }
  const payload=await response.clone().json().catch(()=>null);
  if(!payload?.plan)return response;

  const duration=ensureFitDurationUtilisation(payload.plan,{minimumUtilisation:0.8});
  payload.plan.duration_composition={minimum_utilisation_pct:80,continuous_extension_only:true,no_duplicate_padding:true,report:duration.sessions};
  const quality=assessMemberOutput('fit',payload,body);
  payload.qualityCommissioning=quality;
  if(!quality.ok)return new Response(JSON.stringify({ok:false,error:'quality_gate_failed',message:'Shift rejected a recommendation that did not meet the member quality bar. Please retry.',quality,composition_stage:'post_duration_v8'}),{status:503,headers:response.headers});

  if(duration.changed){
    const auth=await authenticate(request,env,ctx);
    if(auth.response)return auth.response;
    await replaceLatestPlan(env.DB,auth.user.id,payload.plan);
  }
  await recordPlanAnalytics(request,env,ctx,'fit_plan_generated','fit');
  return new Response(JSON.stringify(payload),{status:response.status,headers:response.headers});
}

async function recordPlanAnalytics(request,env,ctx,eventName,surface){
  try{
    const auth=await authenticate(request,env,ctx);if(auth.response)return;
    await recordProductEvent(env,{userId:Number(auth.user.id),eventName,surface,source:'server',properties:{retainedPlan:true,composer:'v8'}});
  }catch(e){console.warn(`analytics_${surface}_plan_failed`,e?.message)}
}
async function repairRepeatedComposition(request,env,ctx,body,headers){
  const base=await memberProductV6Routes(rebuild(request,request.url,body),env,ctx,{deferQuality:true});
  if(!base?.ok)return null;
  const payload=await base.clone().json().catch(()=>null);
  if(!payload?.plan?.sessions)return null;
  const globallyUsed=new Set();let replacements=0;
  for(const session of payload.plan.sessions){
    const exercises=Array.isArray(session?.exercises)?session.exercises:[];
    for(let i=0;i<exercises.length;i++){
      const current=exercises[i],id=String(current?.id||current?.name||'');
      if(id&&!globallyUsed.has(id)){globallyUsed.add(id);continue;}
      const replacement=await sameGroupReplacement(request,env,ctx,current,body,globallyUsed);
      if(replacement){exercises[i]=replacement;globallyUsed.add(String(replacement.id||replacement.name||''));replacements++;}
    }
    session.estimated_minutes=exercises.reduce((a,x)=>a+Math.max(0,Number(x?.minutes||0)),0);
  }
  const duration=ensureFitDurationUtilisation(payload.plan,{minimumUtilisation:0.8});
  payload.plan.duration_composition={minimum_utilisation_pct:80,continuous_extension_only:true,no_duplicate_padding:true,report:duration.sessions};
  payload.plan.repetition_repair={kind:'same_group_cross_session_diversification',replacements,quality_gate_preserved:true};
  const quality=assessMemberOutput('fit',payload,body);payload.qualityCommissioning=quality;
  if(!quality.ok)return new Response(JSON.stringify({ok:false,error:'quality_gate_failed',message:'Shift rejected a recommendation that did not meet the member quality bar. Please retry.',quality,composition_stage:'post_repetition_repair_v8',replacements}),{status:503,headers});
  const auth=await authenticate(request,env,ctx);if(auth.response)return auth.response;
  await replaceLatestPlan(env.DB,auth.user.id,payload.plan);
  return new Response(JSON.stringify(payload),{status:200,headers});
}
async function sameGroupReplacement(request,env,ctx,current,body,globallyUsed){
  const u=new URL(request.url);u.pathname='/v1/fit/replace';
  const replacementBody={group:current?.group||current?.movement_group,exclude:[...globallyUsed],location:body.location,equipment:body.equipment,limitations:body.limitations,preferences:body.preferences};
  const r=await memberProductV5Routes(rebuild(request,u.toString(),replacementBody),env,ctx);if(!r?.ok)return null;
  const j=await r.json().catch(()=>null),candidate=j?.exercise,id=String(candidate?.id||candidate?.name||'');return candidate&&id&&!globallyUsed.has(id)?candidate:null;
}
async function replaceLatestPlan(DB,userId,plan){
  const row=await DB.prepare(`SELECT id FROM shift_plans WHERE user_id=? AND plan_type='fit' AND status='active' ORDER BY id DESC LIMIT 1`).bind(userId).first();
  if(row?.id)await DB.prepare(`UPDATE shift_plans SET plan_json=? WHERE id=?`).bind(JSON.stringify(plan),row.id).run();
}
async function authenticate(request,env,ctx){const response=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user};}
function rebuild(request,url,body){const h=new Headers(request.headers);h.set('Content-Type','application/json');return new Request(url,{method:'POST',headers:h,body:JSON.stringify(body||{})});}
async function readClone(request){try{return await request.clone().json()}catch{return{}}}
