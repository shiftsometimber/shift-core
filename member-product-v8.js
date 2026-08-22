import core from './worker.js';
import {authenticateMember} from './member-state-fast-v1.js';
import {memberProductV7Routes} from './member-product-v7.js';
import {memberProductV6Routes} from './member-product-v6.js';
import {memberProductV5Routes} from './member-product-v5.js';
import {assessMemberOutput} from './member-quality-v1.js';
import {ensureFitDurationUtilisation} from './fit-duration-v1.js';
import {recordProductEvent} from './product-analytics-v1.js';

export async function memberProductV8Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path==='/v1/fit/today/complete'&&request.method==='POST')return completeFitToday(request,env,ctx);
  if(path==='/v1/grub/plan'&&request.method==='POST'){
    const analyticsAuth=await authenticateMember(request,env);
    const response=await memberProductV7Routes(request,env,ctx);
    if(response?.ok&&!analyticsAuth.response)await recordPlanAnalyticsForUser(env,analyticsAuth.user.id,'grub_plan_generated','grub');
    return response;
  }
  if(path!=='/v1/fit/plan'||request.method!=='POST')return memberProductV7Routes(request,env,ctx);

  const analyticsAuth=await authenticateMember(request,env);
  const body=await readClone(request);
  const daily=!analyticsAuth.response?await fitDailyContext(request,env,analyticsAuth.user.id):neutralDailyContext(request);
  const adaptedBody=adaptFitRequest(body,daily);
  const response=await memberProductV7Routes(rebuild(request,request.url,adaptedBody),env,ctx);
  if(!response?.ok){
    const failure=await response.clone().json().catch(()=>null);
    const repetition=Array.isArray(failure?.quality?.issues)&&failure.quality.issues.some(x=>x?.code==='fit_repetition');
    if(failure?.error==='quality_gate_failed'&&repetition){
      const repaired=await repairRepeatedComposition(request,env,ctx,body,response.headers);
      if(repaired){if(repaired.ok&&!analyticsAuth.response)await recordPlanAnalyticsForUser(env,analyticsAuth.user.id,'fit_plan_generated','fit');return repaired;}
    }
    return response;
  }
  const payload=await response.clone().json().catch(()=>null);
  if(!payload?.plan)return response;
  payload.plan.daily_coaching=daily;

  const duration=ensureFitDurationUtilisation(payload.plan,{minimumUtilisation:0.8});
  payload.plan.duration_composition={minimum_utilisation_pct:80,continuous_extension_only:true,no_duplicate_padding:true,report:duration.sessions};
  const quality=assessMemberOutput('fit',payload,adaptedBody);
  payload.qualityCommissioning=quality;
  if(!quality.ok)return new Response(JSON.stringify({ok:false,error:'quality_gate_failed',message:'Shift rejected a recommendation that did not meet the member quality bar. Please retry.',quality,composition_stage:'post_duration_v8'}),{status:503,headers:response.headers});

  if(duration.changed){
    const auth=analyticsAuth.response?await authenticateMember(request,env):analyticsAuth;
    if(auth.response)return auth.response;
    await replaceLatestPlan(env.DB,auth.user.id,payload.plan);
  }
  if(!analyticsAuth.response)await recordPlanAnalyticsForUser(env,analyticsAuth.user.id,'fit_plan_generated','fit');
  return new Response(JSON.stringify(payload),{status:response.status,headers:response.headers});
}

async function completeFitToday(request,env,ctx){
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const body=await readClone(request),date=localDate(request),localHour=Math.max(0,Math.min(23,Number(request.headers.get('X-Shift-Local-Hour'))||new Date().getUTCHours())),minutes=Math.max(0,Math.min(180,Number(body.minutes)||0)),mode=String(body.mode||'train').slice(0,30),exerciseIds=Array.isArray(body.exercise_ids)?body.exercise_ids.map(String).slice(0,30):[];
  await recordProductEvent(env,{userId:auth.user.id,eventName:'fit_session_completed',surface:'fit_programme_uk',source:'member',properties:{date,local_hour:localHour,minutes,mode,exerciseIds}});
  try{await env.DB.prepare(`INSERT INTO shift_today_choices(user_id,local_date,domain,choice_key,choice_json) VALUES(?,?,?,?,?) ON CONFLICT(user_id,local_date,domain) DO UPDATE SET choice_key=excluded.choice_key,choice_json=excluded.choice_json,updated_at=CURRENT_TIMESTAMP`).bind(auth.user.id,date,'fit','completed',JSON.stringify({completed:true,minutes,mode,exercise_ids:exerciseIds,completed_at:new Date().toISOString()})).run()}catch(error){console.warn('fit_today_choice_save_failed',error?.message)}
  return jsonResponse({ok:true,date,completed:true,message:'Today, sorted. Shift will use this when it builds tomorrow.'},200,request);
}

export async function fitDailyContext(request,env,userId){
  const date=localDate(request),hour=Math.max(0,Math.min(23,Number(request.headers.get('X-Shift-Local-Hour'))||new Date().getUTCHours()));
  const [checkin,previous,progress,choices,hydration,recent]=await Promise.all([
    safeFirst(env.DB,`SELECT mood,guts,energy FROM shift_today_checkins WHERE user_id=? AND local_date=?`,[userId,date]),
    safeFirst(env.DB,`SELECT mood,guts,energy FROM shift_today_checkins WHERE user_id=? AND local_date<? ORDER BY local_date DESC LIMIT 1`,[userId,date]),
    safeFirst(env.DB,`SELECT recorded_on,protein_g,sleep_hours,mood_score,steps FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 1`,[userId]),
    safeAll(env.DB,`SELECT domain,choice_key,choice_json FROM shift_today_choices WHERE user_id=? AND local_date=?`,[userId,date]),
    safeFirst(env.DB,`SELECT COALESCE(SUM(contribution_ml),0) hydration_ml FROM hydration_log WHERE user_id=? AND substr(logged_at,1,10)=?`,[userId,date]),
    safeAll(env.DB,`SELECT occurred_at,properties_json FROM product_events WHERE user_id=? AND event_name='fit_session_completed' ORDER BY occurred_at DESC LIMIT 7`,[userId])
  ]);
  const saved=Object.fromEntries(choices.map(row=>[row.domain,{key:row.choice_key,...safeJson(row.choice_json)}])),sleep=Number(progress?.sleep_hours||0),protein=Number(progress?.protein_g||0),hydrationMl=Number(hydration?.hydration_ml||0),activity=activitySummary(recent,date),reasons=[];
  let mode='train',minutesCap=60,intensity='normal';
  if(checkin?.guts==='rough'){reasons.push('Your stomach is rough today');mode='recover';minutesCap=10;intensity='gentle'}
  if(checkin?.energy==='empty'){reasons.push('Your energy is empty');mode='recover';minutesCap=Math.min(minutesCap,10);intensity='gentle'}
  if(mode==='train'&&sleep>0&&sleep<5.5){reasons.push(`You logged ${sleep} hours’ sleep`);mode='light';minutesCap=20;intensity='easy'}
  if(mode==='train'&&previous?.energy==='empty'){reasons.push('Your last check-in showed empty energy');mode='light';minutesCap=20;intensity='easy'}
  if(mode==='train'&&hour>=14&&hydrationMl>0&&hydrationMl<750){reasons.push('Fluids are still low for this point in the day');mode='light';minutesCap=20;intensity='easy'}
  if(mode==='train'&&activity.trained_yesterday){reasons.push('You completed a full session yesterday');mode='light';minutesCap=20;intensity='easy'}
  if(!checkin)reasons.push('No My Timber check-in is saved yet, so Shift is using your profile and recent progress');
  const completedToday=saved.fit?.key==='completed'||recent.some(row=>String(row.occurred_at||'').slice(0,10)===date),foodChoice=saved.grub?.name||null;
  const headline=completedToday?'You have already logged movement today.':mode==='recover'?'Recovery wins today.':mode==='light'?'Keep today lighter.':'You are good to train.';
  const after=[];
  if(hydrationMl<1500)after.push('Have a drink after the session and keep fluids ticking over.');
  if(protein>0&&protein<70)after.push('Protein looks light in your latest log; make the next meal protein-led.');else after.push('Follow the session with a normal protein-containing meal—no punishment eating.');
  after.push(mode==='recover'?'Rest is part of the programme today.':'Give the worked muscles time to recover before loading them hard again.');
  const progression=mode==='train'&&activity.full_sessions_7>=2&&checkin?.energy==='good'?{status:'ready',instruction:'If every rep stays tidy, add 1–2 reps or the smallest sensible resistance increase—not both.'}:{status:'hold',instruction:mode==='train'?'Repeat the quality you have already earned; progression is optional today.':'No progression today. The lighter dose is the programme working properly.'};
  return{contract:'shift-fit-daily-context/v1',date,mode,intensity,minutes_cap:minutesCap,headline,reasons,checkin:checkin||null,recent:{sleep_hours:sleep||null,protein_g:protein||null,hydration_ml:hydrationMl,completed_today:completedToday,completed_sessions_7:activity.sessions_7},activity,progression,weekly_guide:{moderate_minutes:150,strength_days:2,source:'NHS physical activity guidelines for adults aged 19 to 64',member_minutes_logged:activity.minutes_7,member_full_sessions_logged:activity.full_sessions_7,note:'This only counts sessions logged in Shift; walking, sport and other activity may also count.'},connections:{food_choice:foodChoice,move_choice:saved.move?.name||null},after_session:after,rule:'Current symptoms and safety override progression. Food, fluids, recovery and recent completion inform today’s dose.'};
}
function neutralDailyContext(request){return{contract:'shift-fit-daily-context/v1',date:localDate(request),mode:'train',intensity:'normal',minutes_cap:60,headline:'You are good to train.',reasons:['Using your saved movement profile.'],checkin:null,recent:{},connections:{},after_session:['Have a drink and include protein in a normal meal afterwards.'],rule:'Current symptoms and safety override progression.'}}
function adaptFitRequest(body,daily){const requested=Math.max(10,Math.min(60,Number(body.minutes_per_day)||30)),minutes=Math.min(requested,Number(daily.minutes_cap)||requested),context=[body.preferences,daily.mode==='recover'?'gentle mobility supported movement recovery':daily.mode==='light'?'easy controlled movement leave plenty in reserve':'progressive controlled training'].filter(Boolean).join('. ');return{...body,days:1,minutes_per_day:minutes,preferences:context,limitations:[body.limitations,daily.checkin?.guts==='rough'?'rough stomach nausea avoid intense work':'',daily.checkin?.energy==='empty'?'very low energy avoid intense work':''].filter(Boolean).join('. ')}}
async function safeFirst(DB,sql,bindings){try{return await DB.prepare(sql).bind(...bindings).first()}catch{return null}}
async function safeAll(DB,sql,bindings){try{return(await DB.prepare(sql).bind(...bindings).all()).results||[]}catch{return[]}}
function safeJson(value){try{return JSON.parse(value||'{}')}catch{return{}}}
function activitySummary(rows,date){const items=rows.map(row=>{const p=safeJson(row.properties_json),day=String(p.date||row.occurred_at||'').slice(0,10);return{day,minutes:Math.max(0,Number(p.minutes)||0),mode:String(p.mode||'train')}}).filter(x=>x.day),cutoff=new Date(`${date}T00:00:00Z`);cutoff.setUTCDate(cutoff.getUTCDate()-6);const week=items.filter(x=>new Date(`${x.day}T00:00:00Z`)>=cutoff&&x.day<=date),days=[...new Set(items.map(x=>x.day))].sort().reverse();let cursor=new Date(`${date}T00:00:00Z`),streak=0;if(!days.includes(date))cursor.setUTCDate(cursor.getUTCDate()-1);while(days.includes(cursor.toISOString().slice(0,10))){streak++;cursor.setUTCDate(cursor.getUTCDate()-1)}const yesterday=new Date(`${date}T00:00:00Z`);yesterday.setUTCDate(yesterday.getUTCDate()-1);const y=yesterday.toISOString().slice(0,10);return{sessions_7:week.length,minutes_7:week.reduce((n,x)=>n+x.minutes,0),full_sessions_7:week.filter(x=>x.mode==='train').length,showing_up_streak:streak,trained_yesterday:items.some(x=>x.day===y&&x.mode==='train')}}
function localDate(request){return String(request.headers.get('X-Shift-Local-Date')||new Date().toISOString().slice(0,10)).slice(0,10)}
function jsonResponse(data,status,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Shift-Request-Id':crypto.randomUUID()}})}

async function recordPlanAnalyticsForUser(env,userId,eventName,surface){
  const uid=Number(userId||0);if(!uid)throw new Error(`analytics_${surface}_member_missing`);
  const recent=await env.DB.prepare(`SELECT id FROM product_events WHERE user_id=? AND event_name=? AND occurred_at>=datetime('now','-2 minutes') ORDER BY id DESC LIMIT 1`).bind(uid,eventName).first().catch(()=>null);
  if(recent?.id)return;
  await recordProductEvent(env,{userId:uid,eventName,surface,source:'server',properties:{retainedPlan:true,composer:'v8',recording:'authenticated_request'}});
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
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
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
