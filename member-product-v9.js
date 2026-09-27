import core from './worker.js';
import {memberProductV8Routes} from './member-product-v8.js';
import {memberProductV6Routes} from './member-product-v6.js';
import {memberProductV5Routes} from './member-product-v5.js';
import {assessMemberOutput} from './member-quality-v1.js';
import {ensureFitDurationUtilisation} from './fit-duration-v1.js';

export async function memberProductV9Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path!=='/v1/fit/plan'||request.method!=='POST')return memberProductV8Routes(request,env,ctx);

  const body=await readClone(request);
  const first=await memberProductV8Routes(rebuild(request,request.url,body),env,ctx);
  if(first?.ok)return first;
  const failure=await first.clone().json().catch(()=>null);
  const repetition=Array.isArray(failure?.quality?.issues)&&failure.quality.issues.some(x=>x?.code==='fit_repetition');
  if(failure?.error!=='quality_gate_failed'||!repetition)return first;

  // V8 correctly rejects a plan whose sessions are dominated by repeated
  // exercises. Recover by rebuilding the same member request through the
  // pre-quality composition layer, then replace cross-session duplicates with
  // genuine same-group alternatives. We never weaken or bypass the quality bar.
  const base=await memberProductV6Routes(rebuild(request,request.url,body),env,ctx,{deferQuality:true});
  if(!base?.ok)return first;
  const payload=await base.clone().json().catch(()=>null);
  if(!payload?.plan?.sessions)return first;

  const globallyUsed=new Set();
  let replacements=0;
  for(const session of payload.plan.sessions){
    const exercises=Array.isArray(session?.exercises)?session.exercises:[];
    for(let i=0;i<exercises.length;i++){
      const current=exercises[i],id=String(current?.id||current?.name||'');
      if(id&&!globallyUsed.has(id)){globallyUsed.add(id);continue;}
      const replacement=await sameGroupReplacement(request,env,ctx,current,body,globallyUsed);
      if(replacement){exercises[i]=replacement;globallyUsed.add(String(replacement.id||replacement.name||''));replacements++;}
      else if(id)globallyUsed.add(id);
    }
    session.estimated_minutes=exercises.reduce((a,x)=>a+Math.max(0,Number(x?.minutes||0)),0);
  }

  const duration=ensureFitDurationUtilisation(payload.plan,{minimumUtilisation:0.8});
  payload.plan.duration_composition={minimum_utilisation_pct:80,continuous_extension_only:true,no_duplicate_padding:true,report:duration.sessions};
  payload.plan.repetition_repair={kind:'same_group_cross_session_diversification',replacements,quality_gate_preserved:true};
  const quality=assessMemberOutput('fit',payload,body);
  payload.qualityCommissioning=quality;
  if(!quality.ok){
    return json({ok:false,error:'quality_gate_failed',message:'Shift rejected a recommendation that did not meet the member quality bar. Please retry.',quality,composition_stage:'post_repetition_repair_v9',replacements},503,first.headers);
  }

  const auth=await authenticate(request,env,ctx);
  if(auth.response)return auth.response;
  await replaceLatestPlan(env.DB,auth.user.id,payload.plan);
  return json(payload,200,first.headers);
}

async function sameGroupReplacement(request,env,ctx,current,body,globallyUsed){
  const u=new URL(request.url);u.pathname='/v1/fit/replace';
  const replacementBody={group:current?.group||current?.movement_group,exclude:[...globallyUsed],location:body.location,equipment:body.equipment,limitations:body.limitations,preferences:body.preferences};
  const response=await memberProductV5Routes(rebuild(request,u.toString(),replacementBody),env,ctx);
  if(!response?.ok)return null;
  const j=await response.json().catch(()=>null),candidate=j?.exercise;
  const id=String(candidate?.id||candidate?.name||'');
  return candidate&&id&&!globallyUsed.has(id)?candidate:null;
}
async function replaceLatestPlan(DB,userId,plan){const row=await DB.prepare(`SELECT id FROM shift_plans WHERE user_id=? AND plan_type='fit' AND status='active' ORDER BY id DESC LIMIT 1`).bind(userId).first();if(row?.id)await DB.prepare(`UPDATE shift_plans SET plan_json=? WHERE id=?`).bind(JSON.stringify(plan),row.id).run();}
async function authenticate(request,env,ctx){const response=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user};}
function rebuild(request,url,body){const h=new Headers(request.headers);h.set('Content-Type','application/json');return new Request(url,{method:'POST',headers:h,body:JSON.stringify(body||{})});}
async function readClone(request){try{return await request.clone().json()}catch{return{}}}
function json(data,status,headersLike){const h=new Headers(headersLike||{});h.set('Content-Type','application/json; charset=utf-8');h.set('Cache-Control','no-store');return new Response(JSON.stringify(data),{status,headers:h});}
