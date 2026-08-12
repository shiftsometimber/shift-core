import core from './worker.js';
import {memberProductV7Routes} from './member-product-v7.js';
import {assessMemberOutput} from './member-quality-v1.js';
import {ensureFitDurationUtilisation} from './fit-duration-v1.js';

export async function memberProductV8Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path!=='/v1/fit/plan'||request.method!=='POST')return memberProductV7Routes(request,env,ctx);

  const body=await readClone(request);
  const response=await memberProductV7Routes(request,env,ctx);
  if(!response?.ok)return response;
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
  return new Response(JSON.stringify(payload),{status:response.status,headers:response.headers});
}

async function replaceLatestPlan(DB,userId,plan){
  const row=await DB.prepare(`SELECT id FROM shift_plans WHERE user_id=? AND plan_type='fit' AND status='active' ORDER BY id DESC LIMIT 1`).bind(userId).first();
  if(row?.id)await DB.prepare(`UPDATE shift_plans SET plan_json=? WHERE id=?`).bind(JSON.stringify(plan),row.id).run();
}
async function authenticate(request,env,ctx){const response=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user};}
async function readClone(request){try{return await request.clone().json()}catch{return{}}}
