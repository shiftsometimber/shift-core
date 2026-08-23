import core from './worker.js';

const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const today=()=>new Date().toISOString().slice(0,10);
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const j=(data,status=200,request)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...corsHeaders(request)}});

export async function memberProductV2Routes(request,env,ctx){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/',m=request.method.toUpperCase();
  const supported=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/grub/conundrum','/v1/fit/plan','/v1/hydration/plan']);
  if(!supported.has(p)) return null;
  if(m==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders(request)});
  if(m!=='POST') return j({ok:false,error:'method_not_allowed'},405,request);
  const a=await auth(request,env,ctx); if(a.response)return withCors(a.response,request);
  await ensurePlanSchema(env.DB);
  if(p==='/v1/grub/plan') return grubPlan(request,env,a.user.id);
  if(p==='/v1/grub/replace') return replaceMeal(request,env,a.user.id);
  if(p==='/v1/grub/conundrum') return conundrum(request,env,a.user.id);
  if(p==='/v1/fit/plan') return fitPlan(request,env,a.user.id);
  if(p==='/v1/hydration/plan') return hydration(request,env,a.user.id);
  return null;
}

const MEALS=[
 {id:'eggs-toast',name:'Eggs on toast with tomatoes',type:'breakfast',kcal:430,protein:28,fibre:7,ingredients:['2 eggs','2 slices wholemeal bread','tomatoes'],method:['Toast the bread.','Cook the eggs how you like them.','Serve with chopped or grilled tomatoes.'],minutes:10},
 {id:'yoghurt-oats',name:'Greek yoghurt, berries and oats',type:'breakfast',kcal:390,protein:30,fibre:8,ingredients:['Greek yoghurt','berries','oats'],method:['Spoon yoghurt into a bowl.','Add oats and berries.','Mix and eat.'],minutes:3},
 {id:'porridge-banana',name:'Porridge with banana and yoghurt',type:'breakfast',kcal:410,protein:22,fibre:9,ingredients:['oats','milk or water','banana','yoghurt'],method:['Cook oats with milk or water.','Slice banana over the top.','Finish with yoghurt.'],minutes:8},
 {id:'chicken-sandwich',name:'Chicken sandwich and fruit',type:'lunch',kcal:510,protein:35,fibre:8,ingredients:['chicken','wholemeal bread','salad','fruit'],method:['Fill the bread with chicken and salad.','Serve with fruit.'],minutes:5},
 {id:'tuna-jacket',name:'Tuna jacket potato and salad',type:'lunch',kcal:590,protein:42,fibre:10,ingredients:['potato','tuna','salad'],method:['Cook the potato until soft.','Split and add tuna.','Serve with salad.'],minutes:15},
 {id:'omelette',name:'Ham and cheese omelette',type:'lunch',kcal:520,protein:39,fibre:4,ingredients:['eggs','ham','cheese'],method:['Beat the eggs.','Cook in a non-stick pan.','Add ham and cheese, fold and finish cooking.'],minutes:10},
 {id:'chicken-cheese-wrap',name:'Chicken and cheese wrap',type:'lunch',kcal:540,protein:43,fibre:5,ingredients:['chicken','wraps','cheese'],method:['Warm the wrap.','Add sliced chicken and grated cheese.','Fold and toast briefly if you want it melted.'],minutes:8},
 {id:'chicken-wrap',name:'Chicken salad wraps',type:'dinner',kcal:620,protein:48,fibre:9,ingredients:['chicken','wraps','salad'],method:['Cook or reheat the chicken.','Fill wraps with chicken and salad.','Fold and serve.'],minutes:15},
 {id:'beef-chilli',name:'Beef chilli with rice',type:'dinner',kcal:690,protein:46,fibre:11,ingredients:['beef mince','beans','rice','tomatoes'],method:['Brown the mince.','Add tomatoes and beans and simmer.','Serve with cooked rice.'],minutes:30},
 {id:'chicken-pasta',name:'Chicken pasta with tomato sauce',type:'dinner',kcal:680,protein:47,fibre:8,ingredients:['chicken','pasta','tomatoes'],method:['Cook pasta.','Cook chicken until piping hot throughout.','Add tomato sauce and combine.'],minutes:25},
 {id:'pizza-wrap',name:'Homemade pizza wraps',type:'dinner',kcal:610,protein:38,fibre:7,ingredients:['wraps','cheese','tomatoes','chicken'],method:['Spread tomato over the wrap.','Top with chicken and cheese.','Bake or air-fry until crisp and the cheese melts.'],minutes:12},
 {id:'protein-yoghurt',name:'Protein yoghurt and fruit',type:'snack',kcal:220,protein:22,fibre:4,ingredients:['protein yoghurt','fruit'],method:['Open yoghurt.','Add fruit.'],minutes:2},
 {id:'apple-cheese',name:'Apple and cheese',type:'snack',kcal:210,protein:10,fibre:4,ingredients:['apple','cheese'],method:['Slice apple and cheese.','Eat. Complicated stuff.'],minutes:2}
];

const mealPublic=m=>({...m,recipe:{ingredients:m.ingredients,method:m.method,minutes:m.minutes}});

async function grubPlan(request,env,uid){
  const b=await read(request),days=clamp(Number(b.days)||1,1,7),prefs=String(b.preferences||'').toLowerCase();
  const calories=num(b.calories)||2000,protein=num(b.protein_g)||108;
  const planDays=[];
  for(let d=0;d<days;d++){
    const date=new Date(Date.now()+d*86400000).toISOString().slice(0,10);
    const meals=['breakfast','lunch','dinner','snack'].map((type,i)=>{
      const pool=MEALS.filter(x=>x.type===type);
      let idx=(d+i)%pool.length;
      if(type==='dinner'&&prefs.includes('pizza')){const pi=pool.findIndex(x=>x.id==='pizza-wrap');if(pi>=0)idx=pi;}
      return mealPublic(pool[idx]);
    });
    planDays.push({day:d+1,date,meals,totals:meals.reduce((a,m)=>({kcal:a.kcal+m.kcal,protein_g:a.protein_g+m.protein}),{kcal:0,protein_g:0})});
  }
  const plan={kind:'shift_grub_plan',days_requested:days,targets:{calories,protein_g:protein},preference_note:b.preferences||null,days:planDays,feedback_rule:'Yay keeps it. Nay swaps it without changing the whole plan.'};
  await savePlan(env,uid,'grub',plan); return j({ok:true,plan},200,request);
}

async function replaceMeal(request,env,uid){
  const b=await read(request),type=String(b.type||''),exclude=new Set((b.exclude||[]).map(String)),prefs=String(b.preferences||'').toLowerCase();
  let pool=MEALS.filter(x=>x.type===type&&!exclude.has(x.id));
  if(prefs.includes('no fish'))pool=pool.filter(x=>!x.name.toLowerCase().includes('tuna'));
  if(!pool.length)return j({ok:false,error:'no_replacement_available'},409,request);
  const choice=mealPublic(pool[Math.floor(Math.random()*pool.length)]);
  return j({ok:true,meal:choice},200,request);
}

function norm(x){return String(x||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
function baseIngredient(x){return norm(x).replace(/^\d+(\.\d+)?\s*/,'').replace(/^(slices?|tbsp|tsp|g|kg|ml|l)\s+/,'');}
function hasIngredient(items,need){
  const n=baseIngredient(need);
  const aliases={bread:['bread','toast'],tomatoes:['tomato','tomatoes'],wraps:['wrap','wraps','tortilla'],salad:['salad','lettuce','cucumber'],chicken:['chicken','chicken breast'],eggs:['egg','eggs'],cheese:['cheese','cheddar'],potato:['potato','potatoes','jacket potato'],fruit:['fruit','apple','banana','berries'],yoghurt:['yoghurt','yogurt','greek yoghurt','greek yogurt']};
  const key=Object.keys(aliases).find(k=>n.includes(k))||n;
  const wants=aliases[key]||[key]; return items.some(i=>wants.some(w=>i.includes(w)||w.includes(i)));
}
async function conundrum(request,env,uid){
  const b=await read(request),items=[...(b.fridge||[]),...(b.freezer||[]),...(b.cupboard||[]),...(b.items||[])].map(norm).filter(Boolean);
  if(!items.length)return j({ok:true,mode:'fridge_freezer_cupboard',top:[],message:'Tell Shift what you have and I’ll build ideas from those ingredients.'},200,request);
  const candidates=MEALS.map(m=>{const matched=m.ingredients.filter(x=>hasIngredient(items,x));const missing=m.ingredients.filter(x=>!hasIngredient(items,x));return {...mealPublic(m),matched,missing,match_ratio:matched.length/m.ingredients.length};})
    .filter(x=>x.matched.length>=2&&x.match_ratio>=0.66)
    .sort((a,b)=>a.missing.length-b.missing.length||b.match_ratio-a.match_ratio||b.protein-a.protein)
    .slice(0,4);
  const top=candidates.map(x=>({...x,why:`Uses ${x.matched.join(', ')}`,missing_note:x.missing.length?`You'd still need: ${x.missing.join(', ')}`:'You already listed everything needed.'}));
  return j({ok:true,mode:'fridge_freezer_cupboard',top,message:top.length?'Built from the food you actually listed. Anything extra you would need is shown clearly.':'I can’t make a sensible full meal from that list yet. Add a few more ingredients rather than me inventing food you do not have.'},200,request);
}

const EX={
 walk:{name:'Brisk walk',minutes:10,notes:'Walk quickly enough to feel warmer and breathe a bit harder, but you should still be able to talk.',how:['Stand tall and relax your shoulders.','Walk at a purposeful pace.','Shorten the stride if joints complain.']},
 chair_squat:{name:'Chair squat',minutes:5,sets:3,reps:'8–12',rest_seconds:60,notes:'Sit back to a chair and stand again. A simple leg-strength move with a clear depth marker.',how:['Stand just in front of a sturdy chair.','Push hips back and bend knees until you lightly touch the chair.','Drive through your feet to stand tall.']},
 press_up:{name:'Wall or incline press-up',minutes:5,sets:3,reps:'8–12',rest_seconds:60,notes:'A press-up made easier by using a wall, kitchen worktop or sturdy table.',how:['Hands slightly wider than shoulders.','Keep body in a straight line.','Lower chest toward the support, then press away.']},
 row:{name:'Backpack row',minutes:5,sets:3,reps:'10–12',rest_seconds:60,notes:'Use a loaded backpack as a simple pulling exercise.',how:['Hinge forward with a flat back.','Pull the backpack toward your lower ribs.','Lower slowly and keep shoulders away from ears.']},
 bridge:{name:'Glute bridge',minutes:4,sets:3,reps:'10–15',rest_seconds:45,notes:'A floor exercise for glutes and hips.',how:['Lie on your back with knees bent and feet flat.','Squeeze glutes and lift hips.','Pause, then lower under control.']},
 dead_bug:{name:'Dead bug',minutes:5,sets:3,reps:'6–10 each side',rest_seconds:45,notes:'A slow core-control exercise — not an actual deceased insect.',how:['Lie on your back with hips and knees bent to about 90 degrees.','Brace your stomach gently and keep your lower back controlled.','Slowly lower the opposite arm and leg, return, then swap sides.']},
 mobility:{name:'Gentle mobility flow',minutes:5,notes:'Easy movements for shoulders, hips and ankles. Nothing should be forced.',how:['Roll shoulders slowly.','Move hips through a comfortable range.','Circle ankles and finish with easy marching on the spot.']},
 jog:{name:'Easy jog / walk intervals',minutes:10,notes:'Keep it easy: 2 minutes jogging, 1 minute walking. Repeat.',how:['Start with an easy walk.','Jog at a pace you could sustain.','Use the walk breaks before you feel cooked.']}
};

function buildSession(i,minutes,prefs){
  const knee=/knee|joint/.test(prefs),jog=/jog|run/.test(prefs),home=/home/.test(prefs);
  const focus=knee?(i%2?'strength':'mobility'):jog?(i%3===0?'jog':i%2?'strength':'walk'):(i%3===0?'strength':i%2?'walk':'mobility');
  let keys=focus==='strength'?['chair_squat','press_up','row','bridge','dead_bug']:focus==='jog'?['walk','jog','mobility']:focus==='walk'?['walk','mobility']:['mobility','walk'];
  const out=[];let used=0;
  for(const k of keys){const e=EX[k];if(used>=minutes)break;const take=Math.min(e.minutes,Math.max(3,minutes-used));out.push({...e,minutes:take});used+=take;}
  if(used<minutes&&out.length)out[out.length-1]={...out[out.length-1],minutes:out[out.length-1].minutes+(minutes-used)};
  return {day:i+1,title:focus==='strength'?(home?'Home strength':'Full-body strength'):focus==='jog'?'Easy jog / walk':focus==='walk'?'Brisk walk + mobility':'Mobility & recovery',focus,exercises:out,estimated_minutes:minutes,progression:'When this feels comfortable twice in a row, add a couple of reps or a few minutes — not everything at once.'};
}
async function fitPlan(request,env,uid){
  const b=await read(request),days=clamp(Number(b.days)||3,1,7),minutes=clamp(Number(b.minutes_per_day)||30,10,60),prefs=String(b.preferences||'').toLowerCase();
  const sessions=Array.from({length:days},(_,i)=>buildSession(i,minutes,prefs));
  const plan={kind:'shift_fit_plan',days_requested:days,minutes_per_day:minutes,preference_note:b.preferences||null,step_target:7000,sessions,rule:'Start where you are. Pain, dizziness or unusual symptoms beat the plan — stop and seek appropriate advice.'};
  await savePlan(env,uid,'fit',plan); return j({ok:true,plan},200,request);
}

async function hydration(request,env,uid){
  const b=await read(request),weightKg=num(b.weight_kg)||75,activity=num(b.activity_minutes)||0,heat=!!b.hot_weather;
  const guide=Math.round((Math.min(3500,Math.max(1800,weightKg*30))+Math.round(activity/30)*300+(heat?400:0))/100)*100;
  const portions=[['On waking',0.15],['With breakfast',0.15],['Mid-morning',0.12],['With lunch',0.18],['Mid-afternoon',0.12],['With dinner',0.16],['Evening',0.12]];
  let allocated=0;const schedule=portions.map((x,i)=>{let ml=i===portions.length-1?guide-allocated:Math.round(guide*x[1]/50)*50;allocated+=ml;return{when:x[0],ml};});
  const drinks=[
    {drink:'Water',counts:true,note:'Best default choice.'},
    {drink:'Tea / brew',counts:true,note:'Counts towards fluid intake.'},
    {drink:'Coffee',counts:true,note:'Counts towards fluid intake; keep caffeine sensible.'},
    {drink:'Milk',counts:true,note:'Counts towards fluid intake.'},
    {drink:'Sugar-free squash / soft drink',counts:true,note:'Counts towards fluid intake.'},
    {drink:'Fruit juice',counts:true,note:'Counts, but keep juice/smoothies to about 150ml a day because of free sugars.'},
    {drink:'Beer / alcohol',counts:false,note:'Do not use alcohol to hit the Shift hydration target.'}
  ];
  const plan={kind:'shift_hydration_plan',guide_ml:guide,guide_litres:+(guide/1000).toFixed(1),schedule,drinks,activity_extra_ml:Math.round(activity/30)*300,heat_extra_ml:heat?400:0,note:'General hydration guide only. Some heart, kidney and other conditions need individual fluid advice.'};
  await savePlan(env,uid,'hydration',plan);return j({ok:true,plan},200,request);
}

async function savePlan(env,uid,type,plan){await env.DB.prepare(`UPDATE shift_plans SET status='superseded' WHERE user_id=? AND plan_type=? AND status='active'`).bind(uid,type).run();await env.DB.prepare(`INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(?,?,?,?,?)`).bind(uid,type,today(),'active',JSON.stringify(plan)).run();}
async function ensurePlanSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS shift_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,plan_type TEXT NOT NULL,starts_on TEXT NOT NULL,ends_on TEXT,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'active',plan_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
async function read(r){try{return await r.json()}catch{return {}}}
function corsHeaders(request){const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ALLOWED_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const headers=new Headers(response.headers);for(const[k,v]of Object.entries(corsHeaders(request)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
