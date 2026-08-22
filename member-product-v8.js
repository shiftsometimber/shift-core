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
  if(path==='/v1/shift/daily-plan'&&request.method==='GET'){const auth=await authenticateMember(request,env);if(auth.response)return auth.response;const daily=await fitDailyContext(request,env,auth.user.id);return jsonResponse({ok:true,daily},200,request)}
  if(path==='/v1/shift/daily-action'&&request.method==='POST')return saveDailyAction(request,env);
  if(path==='/v1/shift/daily-adjust'&&request.method==='POST')return saveDailyAdjustment(request,env);
  if(path==='/v1/shift/daily-meal'&&request.method==='POST')return saveDailyMealDecision(request,env);
  if(path==='/v1/shift/preview-billy'&&request.method==='POST'&&env.SHIFT_ENVIRONMENT==='my-timber-preview')return seedPreviewBilly(request,env);
  if(path==='/v1/fit/today/complete'&&request.method==='POST')return completeFitToday(request,env,ctx);
  if(path==='/v1/grub/plan'&&request.method==='POST'){
    const analyticsAuth=await authenticate(request,env,ctx);
    const response=await memberProductV7Routes(request,env,ctx);
    if(response?.ok&&!analyticsAuth.response)await recordPlanAnalyticsForUser(env,analyticsAuth.user.id,'grub_plan_generated','grub');
    return response;
  }
  if(path!=='/v1/fit/plan'||request.method!=='POST')return memberProductV7Routes(request,env,ctx);

  const analyticsAuth=await authenticate(request,env,ctx);
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

async function saveDailyAction(request,env){const auth=await authenticateMember(request,env);if(auth.response)return auth.response;const body=await readClone(request),domain=String(body.domain||'').slice(0,30),action=String(body.action||'').slice(0,30),allowed=domain==='recovery'&&action==='done';if(!allowed)return jsonResponse({ok:false,error:'invalid_daily_action'},400,request);await env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_today_choices (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,domain TEXT NOT NULL,choice_key TEXT NOT NULL,choice_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,local_date,domain))`).run();const date=localDate(request),value={key:'done',label:'Recovery protected',completed:true,completed_at:new Date().toISOString()};await env.DB.prepare(`INSERT INTO shift_today_choices(user_id,local_date,domain,choice_key,choice_json) VALUES(?,?,?,?,?) ON CONFLICT(user_id,local_date,domain) DO UPDATE SET choice_key=excluded.choice_key,choice_json=excluded.choice_json,updated_at=CURRENT_TIMESTAMP`).bind(auth.user.id,date,domain,'done',JSON.stringify(value)).run();await recordProductEvent(env,{userId:auth.user.id,eventName:'daily_recovery_completed',surface:'daily_shift_front_door',source:'member',properties:{date}});return jsonResponse({ok:true,date,domain,completed:true},200,request)}

async function saveDailyAdjustment(request,env){
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const body=await readClone(request),scenario=String(body.scenario||'').slice(0,30),allowed=['working_late','feeling_rough','rough_guts','knackered','eating_out','pub_tonight','missed_lunch','no_time','plans_cancelled','next_three_hours'];
  if(!allowed.includes(scenario))return jsonResponse({ok:false,error:'invalid_daily_adjustment'},400,request);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_today_choices (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,domain TEXT NOT NULL,choice_key TEXT NOT NULL,choice_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,local_date,domain))`).run();
  const labels={working_late:'Working late',feeling_rough:'Feeling rough',rough_guts:'Guts playing up',knackered:'Absolutely knackered',eating_out:'Eating out',pub_tonight:'Going to the pub',missed_lunch:'Missed lunch',no_time:'No time to train',plans_cancelled:'Plans cancelled',next_three_hours:'Sort my next three hours'};
  const date=localDate(request),value={key:scenario,label:labels[scenario],changed_at:new Date().toISOString()};
  await env.DB.prepare(`INSERT INTO shift_today_choices(user_id,local_date,domain,choice_key,choice_json) VALUES(?,?,?,?,?) ON CONFLICT(user_id,local_date,domain) DO UPDATE SET choice_key=excluded.choice_key,choice_json=excluded.choice_json,updated_at=CURRENT_TIMESTAMP`).bind(auth.user.id,date,'day_change',scenario,JSON.stringify(value)).run();
  await recordProductEvent(env,{userId:auth.user.id,eventName:'daily_shift_rebuilt',surface:'daily_shift_today',source:'member',properties:{date,scenario}});
  const daily=await fitDailyContext(request,env,auth.user.id);
  return jsonResponse({ok:true,daily},200,request);
}

async function saveDailyMealDecision(request,env){
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const body=await readClone(request),action=String(body.action||''),mealId=String(body.meal_id||'').slice(0,120);
  if(!['accept','swap','reject'].includes(action)||!mealId)return jsonResponse({ok:false,error:'invalid_meal_decision'},400,request);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_meal_preferences (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,meal_id TEXT NOT NULL,preference TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,meal_id))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_today_choices (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,domain TEXT NOT NULL,choice_key TEXT NOT NULL,choice_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,local_date,domain))`).run();
  const row=await safeFirst(env.DB,`SELECT plan_json FROM shift_plans WHERE user_id=? AND plan_type='grub' AND status='active' ORDER BY id DESC LIMIT 1`,[auth.user.id]),plan=safeJson(row?.plan_json),meals=(plan.days||[]).flatMap(day=>day?.meals||[]),current=meals.find(meal=>String(meal.id||'')===mealId);
  if(!current)return jsonResponse({ok:false,error:'meal_not_in_retained_plan'},409,request);
  const date=localDate(request);
  if(action==='reject')await env.DB.prepare(`INSERT INTO shift_meal_preferences(user_id,meal_id,preference) VALUES(?,?,'never') ON CONFLICT(user_id,meal_id) DO UPDATE SET preference='never',updated_at=CURRENT_TIMESTAMP`).bind(auth.user.id,mealId).run();
  if(action==='accept'){
    const value={key:mealId,name:current.name,meal_id:mealId,accepted:true,accepted_at:new Date().toISOString()};
    await saveTodayChoice(env.DB,auth.user.id,date,'grub',mealId,value);
    await recordProductEvent(env,{userId:auth.user.id,eventName:'daily_meal_accepted',surface:'daily_shift_today',source:'member',properties:{date,mealId}});
    return jsonResponse({ok:true,action,daily:await fitDailyContext(request,env,auth.user.id),message:'Meal kept for today.'},200,request);
  }
  const blocked=(await safeAll(env.DB,`SELECT meal_id FROM shift_meal_preferences WHERE user_id=? AND preference='never'`,[auth.user.id])).map(item=>String(item.meal_id));
  const wantedType=String(current.type||''),alternatives=meals.filter(meal=>String(meal.id||'')!==mealId&&!blocked.includes(String(meal.id||''))),sameType=alternatives.filter(meal=>String(meal.type||'').toLowerCase()===wantedType.toLowerCase()),pool=sameType.length?sameType:alternatives;
  const replacement=[...pool].sort((a,b)=>Number(a.minutes||999)-Number(b.minutes||999)||Number(b.protein||0)-Number(a.protein||0))[0];
  if(!replacement)return jsonResponse({ok:false,error:'no_suitable_meal_swap',message:'There is no suitable alternative in your retained Grub plan yet.'},409,request);
  await saveTodayChoice(env.DB,auth.user.id,date,'meal_override',String(replacement.id||''),{...replacement,swapped_from:mealId,reason:action==='reject'?'rejected':'swap'});
  await recordProductEvent(env,{userId:auth.user.id,eventName:action==='reject'?'daily_meal_rejected':'daily_meal_swapped',surface:'daily_shift_today',source:'member',properties:{date,mealId,replacementId:replacement.id}});
  return jsonResponse({ok:true,action,daily:await fitDailyContext(request,env,auth.user.id),message:action==='reject'?'Understood. Shift will not suggest that meal again.':'Meal swapped without rebuilding your day.'},200,request);
}

async function saveTodayChoice(DB,userId,date,domain,key,value){return DB.prepare(`INSERT INTO shift_today_choices(user_id,local_date,domain,choice_key,choice_json) VALUES(?,?,?,?,?) ON CONFLICT(user_id,local_date,domain) DO UPDATE SET choice_key=excluded.choice_key,choice_json=excluded.choice_json,updated_at=CURRENT_TIMESTAMP`).bind(userId,date,domain,key,JSON.stringify(value)).run()}

async function seedPreviewBilly(request,env){
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;const date=localDate(request);
  const grub={days:[{day:1,totals:{kcal:1910,protein_g:132},meals:[{id:'preview-breakfast',type:'Breakfast',name:'Berry protein overnight oats',minutes:5,kcal:420,protein:31},{id:'preview-lunch',type:'Lunch',name:'Chicken shawarma flatbread',minutes:15,kcal:520,protein:39},{id:'preview-dinner',type:'Dinner',name:'Fakeaway salt and pepper chicken',minutes:25,kcal:610,protein:46}]},{day:2,totals:{kcal:1840,protein_g:128},meals:[{id:'preview-breakfast-alt',type:'Breakfast',name:'Apple and cinnamon protein porridge',minutes:7,kcal:405,protein:29},{id:'preview-lunch-alt',type:'Lunch',name:'Tuna crunch jacket potato',minutes:10,kcal:490,protein:37},{id:'preview-quick-dinner',type:'Dinner',name:'Loaded chicken tikka jacket potato',minutes:12,kcal:560,protein:44}]}],catalogue:{published_total_available:798},personalisation:{household_size:1}};
  const fit={minutes_per_day:30,sessions:[{title:'Full-body strength without the faff',estimated_minutes:30,exercises:[{id:'chair-squat',name:'Chair squat',minutes:6},{id:'wall-press',name:'Wall press',minutes:6},{id:'band-row',name:'Resistance-band row',minutes:6},{id:'march',name:'Supported march',minutes:6}]}]};
  await env.DB.prepare(`DELETE FROM shift_today_choices WHERE user_id=? AND local_date=?`).bind(auth.user.id,date).run().catch(()=>null);
  await env.DB.prepare(`DELETE FROM shift_meal_preferences WHERE user_id=?`).bind(auth.user.id).run().catch(()=>null);
  await env.DB.prepare(`UPDATE shift_plans SET status='superseded' WHERE user_id=? AND plan_type IN ('grub','fit') AND status='active'`).bind(auth.user.id).run();
  await env.DB.batch([env.DB.prepare(`INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(?,?,?,?,?)`).bind(auth.user.id,'grub',date,'active',JSON.stringify(grub)),env.DB.prepare(`INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(?,?,?,?,?)`).bind(auth.user.id,'fit',date,'active',JSON.stringify(fit))]);
  return jsonResponse({ok:true,message:'Billy’s joined Grub and Fit day is ready.'},200,request);
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
  const [checkin,previous,progress,choices,hydration,recent,treatment,grubPlanRow,fitPlanRow,rejectedMeals]=await Promise.all([
    safeFirst(env.DB,`SELECT mood,guts,energy FROM shift_today_checkins WHERE user_id=? AND local_date=?`,[userId,date]),
    safeFirst(env.DB,`SELECT mood,guts,energy FROM shift_today_checkins WHERE user_id=? AND local_date<? ORDER BY local_date DESC LIMIT 1`,[userId,date]),
    safeFirst(env.DB,`SELECT recorded_on,protein_g,sleep_hours,mood_score,steps FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 1`,[userId]),
    safeAll(env.DB,`SELECT domain,choice_key,choice_json FROM shift_today_choices WHERE user_id=? AND local_date=?`,[userId,date]),
    safeFirst(env.DB,`SELECT COALESCE(SUM(contribution_ml),0) hydration_ml FROM hydration_log WHERE user_id=? AND substr(logged_at,1,10)=?`,[userId,date]),
    safeAll(env.DB,`SELECT occurred_at,properties_json FROM product_events WHERE user_id=? AND event_name='fit_session_completed' ORDER BY occurred_at DESC LIMIT 7`,[userId]),
    safeFirst(env.DB,`SELECT medicine,dose,next_dose_on,status FROM shift_treatment_context WHERE user_id=?`,[userId]),
    safeFirst(env.DB,`SELECT starts_on,plan_json FROM shift_plans WHERE user_id=? AND plan_type='grub' AND status='active' ORDER BY id DESC LIMIT 1`,[userId]),
    safeFirst(env.DB,`SELECT starts_on,plan_json FROM shift_plans WHERE user_id=? AND plan_type='fit' AND status='active' ORDER BY id DESC LIMIT 1`,[userId]),
    safeAll(env.DB,`SELECT meal_id FROM shift_meal_preferences WHERE user_id=? AND preference='never'`,[userId])
  ]);
  const saved=Object.fromEntries(choices.map(row=>[row.domain,{key:row.choice_key,...safeJson(row.choice_json)}])),sleep=Number(progress?.sleep_hours||0),protein=Number(progress?.protein_g||0),hydrationMl=Number(hydration?.hydration_ml||0),activity=activitySummary(recent,date),reasons=[],grubPlan=safeJson(grubPlanRow?.plan_json),fitPlan=safeJson(fitPlanRow?.plan_json),dayChange=saved.day_change?.key||null;
  let mode='train',minutesCap=60,intensity='normal';
  if(checkin?.guts==='rough'){reasons.push('Your stomach is rough today');mode='recover';minutesCap=10;intensity='gentle'}
  if(checkin?.energy==='empty'){reasons.push('Your energy is empty');mode='recover';minutesCap=Math.min(minutesCap,10);intensity='gentle'}
  if(mode==='train'&&sleep>0&&sleep<5.5){reasons.push(`You logged ${sleep} hours’ sleep`);mode='light';minutesCap=20;intensity='easy'}
  if(mode==='train'&&previous?.energy==='empty'){reasons.push('Your last check-in showed empty energy');mode='light';minutesCap=20;intensity='easy'}
  if(mode==='train'&&hour>=14&&hydrationMl>0&&hydrationMl<750){reasons.push('Fluids are still low for this point in the day');mode='light';minutesCap=20;intensity='easy'}
  if(mode==='train'&&activity.trained_yesterday){reasons.push('You completed a full session yesterday');mode='light';minutesCap=20;intensity='easy'}
  if(treatment?.status==='active'&&treatment.next_dose_on===date)reasons.push(`${treatment.medicine} dose is recorded for today`);
  if(!checkin)reasons.push('No My Timber check-in is saved yet, so Shift is using your profile and recent progress');
  const completedToday=saved.fit?.key==='completed'||recent.some(row=>String(row.occurred_at||'').slice(0,10)===date),foodChoice=saved.grub?.name||null,recoveryDone=saved.recovery?.key==='done';
  const headline=completedToday?'You have already logged movement today.':mode==='recover'?'Recovery wins today.':mode==='light'?'Keep today lighter.':'You are good to train.';
  const after=[];
  if(hydrationMl<1500)after.push('Have a drink after the session and keep fluids ticking over.');
  if(protein>0&&protein<70)after.push('Protein looks light in your latest log; make the next meal protein-led.');else after.push('Follow the session with a normal protein-containing meal—no punishment eating.');
  after.push(mode==='recover'?'Rest is part of the programme today.':'Give the worked muscles time to recover before loading them hard again.');
  const progression=mode==='train'&&activity.full_sessions_7>=2&&checkin?.energy==='good'?{status:'ready',instruction:'If every rep stays tidy, add 1–2 reps or the smallest sensible resistance increase—not both.'}:{status:'hold',instruction:mode==='train'?'Repeat the quality you have already earned; progression is optional today.':'No progression today. The lighter dose is the programme working properly.'},todayPlan={priority:completedToday?'Movement is logged. Keep food and fluids useful, then recover.':mode==='recover'?'Protect recovery today. Gentle movement is enough.':mode==='light'?'Show up without emptying the tank.':'Complete one proper session, then recover well.',movement:completedToday?'Movement completed and logged.':mode==='recover'?'Up to 10 minutes of gentle mobility or an easy walk.':mode==='light'?`Up to ${minutesCap} minutes at an easy, controlled effort.`:`Up to ${minutesCap} minutes of useful training.`,movement_done:completedToday,grub:foodChoice?`${foodChoice} is already chosen for today.`:checkin?.guts==='rough'?'Keep food simple and tolerable; use Shift Grub when you are ready to choose.':protein>0&&protein<70?'Make the next meal protein-led; Shift Grub can choose a realistic option.':'Choose one satisfying protein-led meal in Shift Grub.',grub_done:Boolean(foodChoice),hydration:hydrationMl?`${hydrationMl} ml logged. Keep fluids ticking over across the day.`:'No fluids logged yet. Start with one drink rather than chasing a perfect target.',hydration_ml:hydrationMl,recovery:recoveryDone?'Recovery action protected for today.':mode==='recover'?'Rest is the programme today—not a failed session.':sleep>0&&sleep<5.5?'Sleep was short, so intensity has been reduced. Prioritise an earlier finish tonight.':'Finish feeling capable of coming back tomorrow.',recovery_done:recoveryDone,links:{grub:'/member/grub',fit:'#sfBuild',progress:'/member/dashboard#visualise'}};
  const dailyOutput=composeDailyOutput({date,hour,grubPlan,grubStartsOn:grubPlanRow?.starts_on,fitPlan,hydrationMl,mode,minutesCap,dayChange,reasons,completedToday,mealAccepted:Boolean(saved.grub?.key),recoveryDone,mealOverride:saved.meal_override,rejectedMealIds:rejectedMeals.map(item=>String(item.meal_id))});
  return{contract:'shift-fit-daily-context/v3',date,mode,intensity,minutes_cap:minutesCap,headline,reasons,checkin:checkin||null,recent:{sleep_hours:sleep||null,protein_g:protein||null,hydration_ml:hydrationMl,completed_today:completedToday,completed_sessions_7:activity.sessions_7},activity,progression,today_plan:todayPlan,daily_output:dailyOutput,weekly_guide:{moderate_minutes:150,strength_days:2,source:'NHS physical activity guidelines for adults aged 19 to 64',member_minutes_logged:activity.minutes_7,member_full_sessions_logged:activity.full_sessions_7,note:'This only counts sessions logged in Shift; walking, sport and other activity may also count.'},connections:{food_choice:foodChoice,move_choice:saved.move?.name||null,treatment:treatment?.status==='active'?{medicine:treatment.medicine,dose:treatment.dose,next_dose_on:treatment.next_dose_on}:null},after_session:after,rule:'Current symptoms and safety override progression. Food, fluids, recovery and recent completion inform today’s dose.'};
}

export function composeDailyOutput({date,hour,grubPlan,grubStartsOn,fitPlan,hydrationMl,mode,minutesCap,dayChange,reasons,completedToday,mealAccepted=false,recoveryDone=false,mealOverride=null,rejectedMealIds=[]}){
  const days=Array.isArray(grubPlan?.days)?grubPlan.days:[],start=new Date(`${grubStartsOn||date}T00:00:00Z`),today=new Date(`${date}T00:00:00Z`),offset=Math.max(0,Math.floor((today-start)/86400000)),day=days.length?days[offset%days.length]:null,allMeals=days.flatMap(item=>item?.meals||[]),dayMeals=day?.meals||[],wanted=hour<11?/breakfast/i:hour<16?/lunch|snack/i:/dinner|tea|evening/i;
  const allowedMeals=allMeals.filter(item=>!rejectedMealIds.includes(String(item.id||''))),allowedDayMeals=dayMeals.filter(item=>!rejectedMealIds.includes(String(item.id||'')));
  let meal=mealOverride?.id?mealOverride:(allowedDayMeals.find(item=>wanted.test(String(item.type||'')))||allowedDayMeals[0]||null);
  const quickModes=new Set(['working_late','knackered','no_time','plans_cancelled','next_three_hours','missed_lunch']),gentleModes=new Set(['feeling_rough','rough_guts','knackered']);
  if(quickModes.has(dayChange)){
    const quickDinners=allowedMeals.filter(item=>/dinner|tea|evening/i.test(String(item.type||''))&&Number(item.minutes||999)<=20);
    meal=[...quickDinners].sort((a,b)=>Number(a.minutes||999)-Number(b.minutes||999)||Number(b.protein||0)-Number(a.protein||0))[0]||meal;
  }
  if(gentleModes.has(dayChange)){
    const sameMealType=allowedMeals.filter(item=>String(item.type||'').toLowerCase()===String(meal?.type||'').toLowerCase()&&Number(item.minutes||999)<=15);
    meal=[...sameMealType].sort((a,b)=>Number(a.minutes||999)-Number(b.minutes||999)||Number(b.protein||0)-Number(a.protein||0))[0]||meal;
  }
  const session=Array.isArray(fitPlan?.sessions)?fitPlan.sessions[0]:null,exerciseList=session?.exercises||[],baseMinutes=Number(session?.estimated_minutes||session?.requested_minutes||fitPlan?.minutes_per_day||minutesCap||0),cap=quickModes.has(dayChange)||gentleModes.has(dayChange)?Math.min(10,baseMinutes):Math.min(baseMinutes||minutesCap,minutesCap),workout=session?{ready:true,completed:Boolean(completedToday),title:gentleModes.has(dayChange)?`Gentle ${Math.max(5,cap)}-minute reset`:quickModes.has(dayChange)?`10-minute version of ${session.title||'today’s session'}`:(session.title||'Today’s movement'),minutes:Math.max(5,cap||baseMinutes),exercise_count:exerciseList.length,exercises:exerciseList.slice(0,3).map(item=>item?.name).filter(Boolean),first_exercise:exerciseList[0]?.name||null,href:'/member/fit'}:{ready:false,completed:false,title:'Build today’s movement once',minutes:null,exercise_count:0,exercises:[],first_exercise:null,href:'/member/fit'};
  const mealOutput=meal?{ready:true,accepted:Boolean(mealAccepted),id:meal.id||null,type:meal.type||'Next meal',name:meal.name,kcal:Number(meal.kcal||0)||null,protein_g:Number(meal.protein||0)||null,minutes:Number(meal.minutes||0)||null,href:'/member/grub'}:{ready:false,accepted:false,type:'Next meal',name:'Build today’s Grub once',kcal:null,protein_g:null,minutes:null,href:'/member/grub'};
  const adjusted=Boolean(dayChange),changeCopy={working_late:'No drama. Evening rebuilt around the late finish.',feeling_rough:'Today is gentler: easier food, steady fluids and lighter movement.',rough_guts:'Rough Guts Mode: gentler food and fluids first; movement is optional.',knackered:'Can’t Be Arsed Mode: one small win, the easiest meal and ten minutes at most.',eating_out:'Eating out: the rest of today has been kept lighter without turning dinner into a lecture.',pub_tonight:'Pub Tonight Mode: food and fluids moved forward; tomorrow starts normally.',missed_lunch:'Missed lunch: the next useful meal is forward—no compensation or punishment.',no_time:'No time: movement is down to ten useful minutes.',plans_cancelled:'Plans cancelled: the quickest useful version is now in front.',next_three_hours:'Chaos Mode: the old plan is parked. Here are the best three actions from now.'}[dayChange]||null;
  let next;
  if(!mealOutput.ready)next={kind:'meal_setup',eyebrow:'NEXT',title:'Set your tastes once',detail:'Shift needs your food boundaries before it can choose safely.',cta:'Build my Grub',href:'/member/grub'};
  else if(!mealAccepted)next={kind:'meal',eyebrow:'DO THIS NEXT',title:mealOutput.name,detail:mealMeta(mealOutput),cta:'Choose this meal',href:'#today-meal'};
  else if(!workout.ready)next={kind:'fit_setup',eyebrow:'NEXT',title:'Set your movement profile once',detail:'Time, place, kit and limitations are enough.',cta:'Build my Fit',href:'/member/fit'};
  else if(!completedToday)next={kind:'movement',eyebrow:'THEN',title:workout.title,detail:`${workout.minutes} minutes${workout.first_exercise?` · starts with ${workout.first_exercise}`:''}`,cta:'Start session',href:workout.href};
  else if(hydrationMl<1500)next={kind:'hydration',action:'water',eyebrow:'NEXT',title:'Add 250 ml',detail:`${hydrationMl} ml logged today. Keep it simple and steady.`,cta:'Log 250 ml',href:null};
  else if(!recoveryDone)next={kind:'recovery',action:'recovery',eyebrow:'LAST JOB',title:'Protect recovery',detail:'Finish today able to come back tomorrow.',cta:'Recovery sorted',href:null};
  else next={kind:'complete',eyebrow:'TODAY',title:'You’re sorted',detail:'Meal chosen, movement logged, fluids moving and recovery protected.',cta:'Review today',href:'/member/dashboard#today'};
  return{status:mealOutput.ready&&workout.ready?'ready':'needs_setup',headline:recoveryDone?'Today, properly sorted.':adjusted?'Day rebuilt.':'Today, handled.',subhead:adjusted?changeCopy:'Your real Grub and Fit plans are joined here. Shift serves the useful next action without making you rebuild the day.',adjustment:dayChange,meal:mealOutput,workout,hydration:{logged_ml:hydrationMl,next_ml:250,copy:hydrationMl?`${hydrationMl} ml logged · add 250 ml when useful`:'Start with 250 ml; no perfect target chasing'},recovery:{completed:Boolean(recoveryDone)},next,why:[...reasons.slice(0,2),mealOutput.ready?'Meal selected from your retained Grub plan':'Grub needs setting once',workout.ready?'Movement selected from your retained Fit plan':'Fit needs setting once'],completed_today:completedToday};
}
function mealMeta(meal){return[meal.type,meal.minutes&&`${meal.minutes} min`,meal.kcal&&`${meal.kcal} kcal`,meal.protein_g&&`${meal.protein_g}g protein`].filter(Boolean).join(' · ')}
function neutralDailyContext(request){return{contract:'shift-fit-daily-context/v2',date:localDate(request),mode:'train',intensity:'normal',minutes_cap:60,headline:'You are good to train.',reasons:['Using your saved movement profile.'],checkin:null,recent:{},connections:{},today_plan:{priority:'Complete one useful session, then recover well.',movement:'Build today’s session around your time, place and kit.',grub:'Choose one satisfying protein-led meal.',hydration:'Keep fluids ticking over.',recovery:'Finish feeling capable of coming back tomorrow.'},after_session:['Have a drink and include protein in a normal meal afterwards.'],rule:'Current symptoms and safety override progression.'}}
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
