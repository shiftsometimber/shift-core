import core from './worker.js';

const OWNED=new Set(['/v1/shift/today','/v1/progress/summary','/v1/plan/list']);
const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const safe=v=>{try{return typeof v==='string'?JSON.parse(v):v||{}}catch{return{}}};
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const localDate=()=>new Date().toISOString().slice(0,10);

export async function memberDailyV2Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!OWNED.has(path))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(request.method!=='GET')return json({ok:false,error:'method_not_allowed'},405,request);
  const auth=await authenticate(request,env,ctx);if(auth.response)return withCors(auth.response,request);
  const uid=Number(auth.user.id);
  if(path==='/v1/shift/today')return json({ok:true,today:await buildToday(env,uid,auth.user)},200,request);
  if(path==='/v1/progress/summary')return json({ok:true,progress:await progressSummary(env,uid)},200,request);
  return json({ok:true,plans:await planList(env,uid)},200,request);
}

async function buildToday(env,uid,user){
  const [progress,plans,state,feedback]=await Promise.all([
    env.DB.prepare(`SELECT * FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 30`).bind(uid).all(),
    env.DB.prepare(`SELECT id,plan_type,starts_on,ends_on,status,plan_json,created_at FROM shift_plans WHERE user_id=? AND status='active' ORDER BY id DESC LIMIT 12`).bind(uid).all(),
    env.DB.prepare(`SELECT preferences,roadmap,treatment_finder FROM member_state WHERE user_id=?`).bind(uid).first(),
    env.DB.prepare(`SELECT product,sentiment,COUNT(*) count FROM product_feedback WHERE user_id=? GROUP BY product,sentiment`).bind(uid).all().catch(()=>({results:[]}))
  ]);
  const rows=progress.results||[],latest=rows[0]||{},earliest=rows[rows.length-1]||{};
  const active=Object.fromEntries((plans.results||[]).map(p=>[p.plan_type,{id:p.id,starts_on:p.starts_on,created_at:p.created_at,...safe(p.plan_json)}]));
  const date=localDate(),grub=pickGrub(active.grub,date),fit=pickFit(active.fit,date),hydration=active.hydration||null;
  const actions=[];
  if(grub)actions.push({domain:'grub',priority:100,eyebrow:'EAT',title:grub.name||'Your next meal',detail:mealDetail(grub),cta:{label:'See recipe',target:'grub'}});
  if(fit)actions.push({domain:'fit',priority:90,eyebrow:'MOVE',title:fit.title||'Today’s session',detail:sessionDetail(fit),cta:{label:'See session',target:'fit'}});
  const hydGuide=num(hydration?.guide_ml)||num(hydration?.base_ml);if(hydGuide)actions.push({domain:'hydration',priority:75,eyebrow:'DRINK',title:`Aim around ${Math.round(hydGuide/100)*100}ml today`,detail:'Tea, coffee and other drinks can contribute too — this is a practical guide, not a clinical fluid prescription.',cta:{label:'Log a drink',target:'hydration'}});
  const progressLine=progressNarrative(earliest,latest);if(progressLine)actions.push({domain:'progress',priority:70,eyebrow:'PROGRESS',title:progressLine.title,detail:progressLine.detail,cta:{label:'See progress',target:'progress'}});
  actions.push(oneUsefulAction(latest,active));
  return {
    date,
    greeting:`${daypart()}${user?.first_name?`, ${user.first_name}`:''}.`,
    headline:'Here’s your Shift today.',
    subhead:'No dashboard archaeology. Just the useful stuff.',
    actions:actions.sort((a,b)=>b.priority-a.priority).slice(0,5),
    ask_shift:{prompt:'Anything getting in the way today?',placeholder:'Tell Shift what’s going on…'},
    context_used:{active_plans:Object.keys(active),progress_entries:rows.length,feedback_summary:feedback.results||[],member_preferences:!!state?.preferences},
    rule:'Hard safety and clinical boundaries override convenience or optimisation.'
  };
}

function pickGrub(plan,date){if(!plan)return null;const day=(plan.days||[]).find(d=>d.date===date)||(plan.days||[])[0];if(day?.meals?.length){const order=['breakfast','lunch','dinner','snack'];const hour=new Date().getHours();const wanted=hour<10?'breakfast':hour<14?'lunch':hour<20?'dinner':'snack';return day.meals.find(m=>m.type===wanted)||day.meals.find(m=>m.type===order[Math.min(order.length-1,Math.floor(hour/6))])||day.meals[0];}return plan.meals?.[0]||null;}
function pickFit(plan,date){if(!plan)return null;const sessions=plan.sessions||[];if(!sessions.length)return null;const weekday=new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB',{weekday:'short'}).toLowerCase();return sessions.find(s=>String(s.date||'')===date)||sessions.find(s=>String(s.day||'').toLowerCase().startsWith(weekday))||sessions.find(s=>Number(s.day)===1)||sessions[0];}
function mealDetail(m){const mins=num(m.minutes||m.recipe?.minutes),protein=num(m.protein||m.nutrition?.protein_g);return [mins?`${mins} mins`:null,protein?`${Math.round(protein)}g protein`:null].filter(Boolean).join(' · ')||'Your planned meal is ready when you are.';}
function sessionDetail(s){const mins=num(s.requested_minutes||s.estimated_minutes||s.session?.minutes);const count=(s.exercises||[]).length;return [mins?`${mins} mins`:null,count?`${count} movements`:null,s.location||null].filter(Boolean).join(' · ')||'A realistic session built around the time you have.';}
function progressNarrative(first,last){const a=num(first?.weight_kg),b=num(last?.weight_kg);if(a&&b&&first!==last){const delta=+(b-a).toFixed(1);if(Math.abs(delta)>=0.1)return{title:delta<0?`${Math.abs(delta)}kg down since your first logged weight`:`${delta}kg change since your first logged weight`,detail:'One number never tells the whole story. Waist, blood pressure, movement and how you feel matter too.'};}return null;}
function oneUsefulAction(latest,active){const steps=num(latest?.steps)||0;if(steps<3500)return{domain:'today',priority:60,eyebrow:'ONE THING',title:'Get ten minutes outside if you can',detail:'Nothing heroic. A short walk is useful and easy to repeat.',cta:{label:'Done later',target:'today'}};if(!active.grub)return{domain:'today',priority:60,eyebrow:'ONE THING',title:'Sort tonight’s food before tonight sorts you',detail:'Build a Grub plan while you still have choices.',cta:{label:'Plan food',target:'grub'}};return{domain:'today',priority:60,eyebrow:'ONE THING',title:'Keep today boringly achievable',detail:'Consistency beats a perfect day you cannot repeat.',cta:{label:'Ask Shift',target:'ai'}};}
function daypart(){const h=new Date().getHours();return h<12?'Morning':h<18?'Afternoon':'Evening';}

async function progressSummary(env,uid){
  const {results=[]}=await env.DB.prepare(`SELECT * FROM progress_entries WHERE user_id=? ORDER BY recorded_on ASC,id ASC LIMIT 1000`).bind(uid).all();
  if(!results.length)return{state:'empty',headline:'Your progress story starts with the first check-in.',metrics:[],milestones:[]};
  const first=results[0],latest=results[results.length-1];
  const metrics=[
    metric('weight','Weight',first.weight_kg,latest.weight_kg,'kg',true),metric('waist','Waist',first.waist_cm,latest.waist_cm,'cm',true),metric('systolic','Systolic BP',first.systolic,latest.systolic,'mmHg',null),metric('diastolic','Diastolic BP',first.diastolic,latest.diastolic,'mmHg',null),metric('steps','Steps',first.steps,latest.steps,'steps',false),metric('sleep','Sleep',first.sleep_hours,latest.sleep_hours,'hours',false),metric('mood','Mood',first.mood_score,latest.mood_score,'/10',false)
  ].filter(Boolean);
  const weight=num(latest.weight_kg);const imperial=weight?kgToStone(weight):null;
  return{state:'ready',headline:'Since you started',started_on:first.recorded_on,latest_on:latest.recorded_on,entries:results.length,latest_weight:weight?{kg:weight,stone:imperial.stone,lb:imperial.lb}:null,metrics,milestones:milestones(metrics),message:'Progress is bigger than weight. Shift keeps the useful signals together without turning every day into a test.'};
}
function metric(key,label,start,end,unit,lowerIsBetter){const a=num(start),b=num(end);if(a===null&&b===null)return null;const delta=a!==null&&b!==null?+(b-a).toFixed(1):null;let direction='not_enough_data';if(delta!==null){if(Math.abs(delta)<0.05)direction='same';else if(lowerIsBetter===true)direction=delta<0?'improving':'up';else if(lowerIsBetter===false)direction=delta>0?'improving':'down';else direction=delta<0?'down':'up';}return{key,label,start:a,latest:b,delta,unit,direction};}
function milestones(metrics){return metrics.filter(m=>m.direction==='improving').slice(0,4).map(m=>({key:m.key,label:`${m.label} moving the right way`,detail:m.delta===null?'':`${m.delta>0?'+':''}${m.delta} ${m.unit} since first log`}));}
function kgToStone(kg){const totalLb=kg*2.2046226218,stone=Math.floor(totalLb/14);return{stone,lb:+(totalLb-stone*14).toFixed(1)};}

async function planList(env,uid){const {results=[]}=await env.DB.prepare(`SELECT id,plan_type,starts_on,ends_on,status,plan_json,created_at FROM shift_plans WHERE user_id=? ORDER BY id DESC LIMIT 100`).bind(uid).all();const mapped=results.map(p=>{const plan=safe(p.plan_json);return{id:p.id,type:p.plan_type,status:p.status,starts_on:p.starts_on,ends_on:p.ends_on,created_at:p.created_at,title:planTitle(p.plan_type,plan),summary:planSummary(p.plan_type,plan)}});return{current:mapped.filter(x=>x.status==='active'),replaced:mapped.filter(x=>x.status==='superseded'),other:mapped.filter(x=>!['active','superseded'].includes(x.status))};}
function planTitle(type,p){if(type==='grub')return `${p.days_requested||p.days?.length||1}-day Shift Grub plan`;if(type==='fit')return `${p.days_requested||p.sessions?.length||1}-session Shift Fit plan`;if(type==='hydration')return 'Hydration guide';return `Shift ${String(type||'plan')}`;}
function planSummary(type,p){if(type==='grub')return `${p.days?.length||1} day${(p.days?.length||1)===1?'':'s'} · ${p.targets?.protein_g?`${p.targets.protein_g}g protein guide`: 'food plan'}`;if(type==='fit')return `${p.sessions?.length||0} sessions · ${p.minutes_per_day||p.sessions?.[0]?.requested_minutes||'flexible'} mins`;if(type==='hydration')return p.guide_ml?`About ${p.guide_ml}ml/day guide`:'Hydration guide';return 'Saved Shift plan';}

async function authenticate(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...cors(request)}});}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const h=new Headers(response.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
