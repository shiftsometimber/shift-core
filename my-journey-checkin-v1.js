import {authenticateMember} from './member-state-fast-v1.js';
import {recordProductEvent} from './product-analytics-v1.js';
import {buildJourneyObservation,journeyExport} from './my-journey-observation-v1.js';

const FEELING=['rough','difficult','mixed','alright','good','great','0','20','40','60','80','100'];
const SCALE=['very_low','low','mixed','steady','good','very_good','0','20','40','60','80','100'];
const CLOTHES=['tighter','same','a_bit_looser','much_looser','dropped_size','fits_again'];
const DISRUPTIONS=['illness','holiday','meals_out','work_pressure','stress','poor_sleep','injury','routine_changed','other'];
const ROUTES=['injection','tablet','lifestyle','maintenance'];

export async function myJourneyCheckInRoutes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(path!=='/v1/journey/weekly-check-in')return null;
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  await ensureSchema(env.DB);
  if(request.method==='GET')return getWeekly(request,env,auth.user.id);
  if(request.method==='POST')return saveWeekly(request,env,ctx,auth.user.id);
  return respond({ok:false,error:'method_not_allowed'},405,request);
}

export async function myJourneyTrendRoutes(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(path!=='/v1/journey/trends'||request.method!=='GET')return null;
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  await ensureSchema(env.DB);
  const rows=await safeAll(env.DB,`SELECT * FROM my_journey_weekly_checkins WHERE user_id=? AND confirmed_at IS NOT NULL ORDER BY week_ending DESC LIMIT 52`,[auth.user.id]);
  const records=rows.reverse().map(trendRecord),mode=records.at(-1)?.route==='maintenance'?'maintenance':'loss';
  const weeks=Math.max(1,Math.min(12,Number(url.searchParams.get('weeks'))||12));
  const observation=buildJourneyObservation(records,{mode});
  return respond({ok:true,private:true,confirmed_weeks:records.length,observation,export:journeyExport(records,{weeks,mode}),message:observation?'Your confirmed Journey pattern is ready.':'There is not enough confirmed information to show a trend yet. Keep checking in and My Journey will build the picture.'},200,request);
}

async function getWeekly(request,env,uid){
  const url=new URL(request.url),weekEnding=validDate(url.searchParams.get('date'))||localDate(request),start=addDays(weekEnding,-6);
  const [saved,latestWeekly,treatment,progress,checkins,choices,hydration,fitEvents,memberState]=await Promise.all([
    safeFirst(env.DB,`SELECT * FROM my_journey_weekly_checkins WHERE user_id=? AND week_ending=?`,[uid,weekEnding]),
    safeFirst(env.DB,`SELECT week_ending FROM my_journey_weekly_checkins WHERE user_id=? AND week_ending<? ORDER BY week_ending DESC LIMIT 1`,[uid,weekEnding]),
    safeFirst(env.DB,`SELECT medicine,dose,next_dose_on,status FROM shift_treatment_context WHERE user_id=?`,[uid]),
    safeFirst(env.DB,`SELECT recorded_on,weight_kg,waist_cm,sleep_hours,mood_score,protein_g,steps FROM progress_entries WHERE user_id=? AND recorded_on<=? ORDER BY recorded_on DESC,id DESC LIMIT 1`,[uid,weekEnding]),
    safeAll(env.DB,`SELECT local_date,mood,guts,energy FROM shift_today_checkins WHERE user_id=? AND local_date BETWEEN ? AND ? ORDER BY local_date`,[uid,start,weekEnding]),
    safeAll(env.DB,`SELECT local_date,domain,choice_key,choice_json FROM shift_today_choices WHERE user_id=? AND local_date BETWEEN ? AND ? ORDER BY local_date`,[uid,start,weekEnding]),
    safeFirst(env.DB,`SELECT COALESCE(SUM(contribution_ml),0) total_ml,COUNT(DISTINCT substr(logged_at,1,10)) days FROM hydration_log WHERE user_id=? AND substr(logged_at,1,10) BETWEEN ? AND ?`,[uid,start,weekEnding]),
    safeAll(env.DB,`SELECT occurred_at,properties_json FROM product_events WHERE user_id=? AND event_name='fit_session_completed' AND substr(occurred_at,1,10) BETWEEN ? AND ?`,[uid,start,weekEnding]),
    safeFirst(env.DB,`SELECT preferences FROM member_state WHERE user_id=?`,[uid])
  ]);
  const preferences=parse(memberState?.preferences),configured=preferences?.myJourney||{},setup=configured.setup||{};
  const route=ROUTES.includes(setup.route)?setup.route:inferRoute(treatment);
  const prefill=buildPrefill({progress,checkins,choices,hydration,fitEvents,treatment});
  prefill.missedWeek=latestWeekly?daysBetween(latestWeekly.week_ending,weekEnding)>7:false;
  return respond({ok:true,week:{start,ending:weekEnding},route,units:['stone_lb','kg','lb'].includes(setup.units)?setup.units:'stone_lb',review_day:setup.reviewDay??dayName(weekEnding),reason:route==='injection'?'Your jab-day check-in':route==='tablet'?'Your weekly tablet-route review':'Your weekly Journey check-in',prefill,saved:saved?deserialize(saved):null,confirmation_required:true,clinical_boundary:'Treatment and symptoms are recorded as context only. My Journey does not assess dose, suitability or treatment effectiveness.'},200,request);
}

async function saveWeekly(request,env,ctx,uid){
  const body=await request.json().catch(()=>({})),weekEnding=validDate(body.weekEnding)||localDate(request),route=ROUTES.includes(body.route)?body.route:'lifestyle';
  if(redFlagText([body.gutSymptoms,body.note,body.lifeBack?.note].join(' ')))return respond({ok:false,error:'safety_route_required',message:'Your answers include something My Journey should not analyse. If you may be seriously unwell, call 999 or go to A&E. Otherwise use the approved urgent-help guidance or contact your prescriber.',action:{label:'Open urgent-help guidance',href:'/help/urgent'}},409,request);
  const data=normalise(body,route);if(data.error)return respond({ok:false,error:data.error,message:data.message},400,request);
  await env.DB.prepare(`INSERT INTO my_journey_weekly_checkins(user_id,week_ending,route,weight_kg,waist_cm,overall_feeling,mood,energy,confidence,sleep,appetite,physical_comfort,gut_symptoms,treatment_on_schedule,treatment_context_json,food_context_json,movement_context_json,hydration_context_json,clothes_fit,clothes_detail_json,life_back_json,disruptions_json,note,confirmed_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,week_ending) DO UPDATE SET route=excluded.route,weight_kg=excluded.weight_kg,waist_cm=excluded.waist_cm,overall_feeling=excluded.overall_feeling,mood=excluded.mood,energy=excluded.energy,confidence=excluded.confidence,sleep=excluded.sleep,appetite=excluded.appetite,physical_comfort=excluded.physical_comfort,gut_symptoms=excluded.gut_symptoms,treatment_on_schedule=excluded.treatment_on_schedule,treatment_context_json=excluded.treatment_context_json,food_context_json=excluded.food_context_json,movement_context_json=excluded.movement_context_json,hydration_context_json=excluded.hydration_context_json,clothes_fit=excluded.clothes_fit,clothes_detail_json=excluded.clothes_detail_json,life_back_json=excluded.life_back_json,disruptions_json=excluded.disruptions_json,note=excluded.note,confirmed_at=excluded.confirmed_at,updated_at=CURRENT_TIMESTAMP`)
    .bind(uid,weekEnding,route,data.weightKg,data.waistCm,data.overallFeeling,data.mood,data.energy,data.confidence,data.sleep,data.appetite,data.physicalComfort,data.gutSymptoms,data.treatmentOnSchedule,json(data.treatment),json(data.food),json(data.movement),json(data.hydration),data.clothesFit,json(data.clothesDetail),json(data.lifeBack),json(data.disruptions),data.note,new Date().toISOString()).run();
  if(data.weightKg!=null||data.waistCm!=null){await env.DB.prepare(`DELETE FROM progress_entries WHERE user_id=? AND recorded_on=? AND source='my_journey_weekly'`).bind(uid,weekEnding).run();await env.DB.prepare(`INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,sleep_hours,mood_score,notes,source) VALUES(?,?,?,?,?,?,?,'my_journey_weekly')`).bind(uid,weekEnding,data.weightKg,data.waistCm,score(data.sleep),score(data.mood),data.note||null).run()}
  const work=recordProductEvent(env,{userId:uid,eventName:'my_journey_weekly_checkin_confirmed',surface:'my_journey',source:'member',properties:{weekEnding,route,clothesFit:data.clothesFit,disruptions:data.disruptions}}).catch(()=>null);if(ctx?.waitUntil)ctx.waitUntil(work);else await work;
  return respond({ok:true,saved:true,week_ending:weekEnding,message:'Your week is saved in My Journey.',next:'Your confirmed week will now feed your Journey trends. It will not be treated as proof that one factor caused another.'},201,request);
}

function normalise(body,route){
  const metric=(v,min,max)=>v===''||v==null?null:Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):NaN;
  const weightKg=metric(body.weightKg,30,400),waistCm=metric(body.waistCm,40,250);if(Number.isNaN(weightKg)||Number.isNaN(waistCm))return{error:'invalid_measurement',message:'Check the weight or waist measurement and try again.'};
  const overallFeeling=FEELING.includes(body.overallFeeling)?body.overallFeeling:null;if(!overallFeeling)return{error:'overall_feeling_required',message:'Choose the answer that best describes your week.'};
  const pick=v=>SCALE.includes(v)?v:null,clothesFit=CLOTHES.includes(body.clothesFit)?body.clothesFit:null;if(!clothesFit)return{error:'clothes_fit_required',message:'Tell us how your clothes fitted this week.'};
  const disruptions=[...new Set((Array.isArray(body.disruptions)?body.disruptions:[]).filter(x=>DISRUPTIONS.includes(x)))];
  const treatmentOnSchedule=route==='injection'||route==='tablet'?(body.treatmentOnSchedule===true?1:body.treatmentOnSchedule===false?0:null):null;
  return{weightKg,waistCm,overallFeeling,mood:pick(body.mood),energy:pick(body.energy),confidence:pick(body.confidence),sleep:pick(body.sleep),appetite:pick(body.appetite),physicalComfort:pick(body.physicalComfort),gutSymptoms:clean(body.gutSymptoms,500),treatmentOnSchedule,treatment:safeObject(body.treatment),food:safeObject(body.food),movement:safeObject(body.movement),hydration:safeObject(body.hydration),clothesFit,clothesDetail:clothesFit==='same'||clothesFit==='tighter'?{}:safeObject(body.clothesDetail),lifeBack:safeObject(body.lifeBack),disruptions,note:clean(body.note,1000)};
}

function buildPrefill({progress,checkins,choices,hydration,fitEvents,treatment}){const meals=choices.filter(x=>x.domain==='grub'),moves=choices.filter(x=>x.domain==='move'||x.domain==='fit'),avg=(key,map)=>{const nums=checkins.map(x=>map[x[key]]).filter(Number.isFinite);return nums.length?Number((nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1)):null};return{weightKg:num(progress?.weight_kg),waistCm:num(progress?.waist_cm),recordedOn:progress?.recorded_on||null,feeling:{daysRecorded:checkins.length,moodAverage:avg('mood',{rough:1,alright:2,good:3}),energyAverage:avg('energy',{empty:1,managing:2,good:3}),gutRoughDays:checkins.filter(x=>x.guts==='rough').length},food:{daysWithSavedMeal:new Set(meals.map(x=>x.local_date)).size,latestProteinG:num(progress?.protein_g)},movement:{sessionsCompleted:fitEvents.length,daysWithSavedMove:new Set(moves.map(x=>x.local_date)).size,latestSteps:num(progress?.steps)},hydration:{totalMl:num(hydration?.total_ml)||0,daysRecorded:Number(hydration?.days||0)},sleepHours:num(progress?.sleep_hours),treatment:treatment?{medicine:treatment.medicine||null,dose:treatment.dose||null,nextDoseOn:treatment.next_dose_on||null,status:treatment.status||null}:null,sourceNote:'Already-recorded information is pre-filled for confirmation. You can correct it before saving.'}}
function deserialize(r){return{weekEnding:r.week_ending,route:r.route,weightKg:num(r.weight_kg),waistCm:num(r.waist_cm),overallFeeling:r.overall_feeling,mood:r.mood,energy:r.energy,confidence:r.confidence,sleep:r.sleep,appetite:r.appetite,physicalComfort:r.physical_comfort,gutSymptoms:r.gut_symptoms,treatmentOnSchedule:r.treatment_on_schedule==null?null:!!r.treatment_on_schedule,treatment:parse(r.treatment_context_json),food:parse(r.food_context_json),movement:parse(r.movement_context_json),hydration:parse(r.hydration_context_json),clothesFit:r.clothes_fit,clothesDetail:parse(r.clothes_detail_json),lifeBack:parse(r.life_back_json),disruptions:parse(r.disruptions_json)||[],note:r.note,confirmedAt:r.confirmed_at}}
function trendRecord(r){const food=parse(r.food_context_json),movement=parse(r.movement_context_json),lifeBack=parse(r.life_back_json);return{id:r.id,date:r.week_ending,confirmed:Boolean(r.confirmed_at),route:r.route,weightKg:num(r.weight_kg),waistCm:num(r.waist_cm),feeling:r.overall_feeling,clothesFit:r.clothes_fit,lifeBackWins:lifeBack?.status==='win'?[lifeBack.note||'Recorded Life Back win']:[],mealConsistency:num(food?.daysWithSavedMeal),movementMinutes:num(movement?.minutes)||num(movement?.sessionsCompleted),disruptions:parse(r.disruptions_json)||[]}}
function inferRoute(t){const m=String(t?.medicine||'').toLowerCase();if(!m)return'lifestyle';if(/tablet|oral|rybelsus/.test(m))return'tablet';return'injection'}
function redFlagText(v){return /(?:chest pain|cannot breathe|can’t breathe|severe abdominal pain|vomit(?:ing)? blood|black stools?|faint(?:ed|ing)?|suicid(?:e|al)|anaphylaxis|face swelling)/i.test(String(v||''))}
function score(v){return{very_low:1,low:3,mixed:5,steady:6,good:8,very_good:10}[v]||null}
function clean(v,n){const s=String(v??'').trim();return s?s.slice(0,n):null}function safeObject(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}function parse(v){try{return JSON.parse(v||'{}')}catch{return{}}}function json(v){return JSON.stringify(v||{})}function num(v){return Number.isFinite(Number(v))?Number(v):null}
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):null}function localDate(r){return validDate(r.headers.get('X-Shift-Local-Date'))||new Date().toISOString().slice(0,10)}function addDays(d,n){const x=new Date(`${d}T12:00:00Z`);x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}function daysBetween(a,b){return Math.round((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/86400000)}function dayName(d){return new Intl.DateTimeFormat('en-GB',{weekday:'long',timeZone:'UTC'}).format(new Date(`${d}T12:00:00Z`))}
async function safeFirst(DB,sql,args=[]){try{return await DB.prepare(sql).bind(...args).first()}catch{return null}}async function safeAll(DB,sql,args=[]){try{return(await DB.prepare(sql).bind(...args).all()).results||[]}catch{return[]}}
function respond(body,status,request){const origin=request.headers.get('Origin')||'',h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};if(origin)h['Access-Control-Allow-Origin']=origin;return new Response(JSON.stringify(body),{status,headers:h})}
async function ensureSchema(DB){await DB.prepare(`CREATE TABLE IF NOT EXISTS my_journey_weekly_checkins (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,week_ending TEXT NOT NULL,route TEXT NOT NULL,weight_kg REAL,waist_cm REAL,overall_feeling TEXT NOT NULL,mood TEXT,energy TEXT,confidence TEXT,sleep TEXT,appetite TEXT,physical_comfort TEXT,gut_symptoms TEXT,treatment_on_schedule INTEGER,treatment_context_json TEXT NOT NULL DEFAULT '{}',food_context_json TEXT NOT NULL DEFAULT '{}',movement_context_json TEXT NOT NULL DEFAULT '{}',hydration_context_json TEXT NOT NULL DEFAULT '{}',clothes_fit TEXT NOT NULL,clothes_detail_json TEXT NOT NULL DEFAULT '{}',life_back_json TEXT NOT NULL DEFAULT '{}',disruptions_json TEXT NOT NULL DEFAULT '[]',note TEXT,confirmed_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,week_ending))`).run();await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_journey_weekly_user_date ON my_journey_weekly_checkins(user_id,week_ending)`).run()}
