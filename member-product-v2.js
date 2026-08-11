import core from './worker.js';

const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const today=()=>new Date().toISOString().slice(0,10);
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const j=(data,status=200,request)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...corsHeaders(request)}});

export async function memberProductV2Routes(request,env,ctx){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/',m=request.method.toUpperCase();
  const supported=new Set(['/v1/grub/plan','/v1/grub/conundrum','/v1/fit/plan','/v1/hydration/plan']);
  if(!supported.has(p)) return null;
  if(m==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders(request)});
  if(m!=='POST') return j({ok:false,error:'method_not_allowed'},405,request);
  const a=await auth(request,env,ctx); if(a.response)return withCors(a.response,request);
  await ensurePlanSchema(env.DB);
  if(p==='/v1/grub/plan') return grubPlan(request,env,a.user.id);
  if(p==='/v1/grub/conundrum') return conundrum(request,env,a.user.id);
  if(p==='/v1/fit/plan') return fitPlan(request,env,a.user.id);
  if(p==='/v1/hydration/plan') return hydration(request,env,a.user.id);
  return null;
}

const MEALS=[
 {name:'Eggs on toast with tomatoes',type:'breakfast',kcal:430,protein:28,fibre:7,ingredients:['eggs','bread','tomatoes']},
 {name:'Greek yoghurt, berries and oats',type:'breakfast',kcal:390,protein:30,fibre:8,ingredients:['greek yoghurt','berries','oats']},
 {name:'Porridge with banana and yoghurt',type:'breakfast',kcal:410,protein:22,fibre:9,ingredients:['oats','banana','yoghurt']},
 {name:'Chicken sandwich and fruit',type:'lunch',kcal:510,protein:35,fibre:8,ingredients:['chicken','bread','salad','fruit']},
 {name:'Tuna jacket potato and salad',type:'lunch',kcal:590,protein:42,fibre:10,ingredients:['tuna','potato','salad']},
 {name:'Ham and cheese omelette with salad',type:'lunch',kcal:520,protein:39,fibre:5,ingredients:['eggs','ham','cheese','salad']},
 {name:'Chicken salad wraps',type:'dinner',kcal:620,protein:48,fibre:9,ingredients:['chicken','wraps','salad']},
 {name:'Beef chilli with rice',type:'dinner',kcal:690,protein:46,fibre:11,ingredients:['beef mince','beans','rice','tomatoes']},
 {name:'Chicken pasta with tomato sauce',type:'dinner',kcal:680,protein:47,fibre:8,ingredients:['chicken','pasta','tomatoes']},
 {name:'Homemade pizza wraps',type:'dinner',kcal:610,protein:38,fibre:7,ingredients:['wraps','cheese','tomatoes','chicken']},
 {name:'Protein yoghurt and fruit',type:'snack',kcal:220,protein:22,fibre:4,ingredients:['protein yoghurt','fruit']},
 {name:'Apple and cheese',type:'snack',kcal:210,protein:10,fibre:4,ingredients:['apple','cheese']}
];

async function grubPlan(request,env,uid){
  const b=await read(request),days=Math.min(7,Math.max(1,Number(b.days)||1)),prefs=String(b.preferences||'').toLowerCase();
  const calories=num(b.calories)||2000,protein=num(b.protein_g)||108;
  const planDays=[];
  for(let d=0;d<days;d++){
    const date=new Date(Date.now()+d*86400000).toISOString().slice(0,10);
    const meals=['breakfast','lunch','dinner','snack'].map((type,i)=>{
      const pool=MEALS.filter(x=>x.type===type);
      let idx=(d+i)%pool.length;
      if(type==='dinner'&&prefs.includes('pizza')){
        const pi=pool.findIndex(x=>x.name.toLowerCase().includes('pizza')); if(pi>=0) idx=pi;
      }
      return pool[idx];
    });
    planDays.push({day:d+1,date,meals,totals:meals.reduce((a,m)=>({kcal:a.kcal+m.kcal,protein_g:a.protein_g+m.protein}),{kcal:0,protein_g:0})});
  }
  const plan={kind:'shift_grub_plan',days_requested:days,targets:{calories,protein_g:protein},preference_note:b.preferences||null,days:planDays};
  await savePlan(env,uid,'grub',plan); return j({ok:true,plan},200,request);
}

function norm(x){return String(x||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
function hasIngredient(items,need){
  const n=norm(need);
  const aliases={bread:['bread','toast'],tomatoes:['tomato','tomatoes'],wraps:['wrap','wraps','tortilla'],salad:['salad','lettuce','cucumber'],chicken:['chicken','chicken breast'],eggs:['egg','eggs'],cheese:['cheese','cheddar'],potato:['potato','potatoes','jacket potato'],fruit:['fruit','apple','banana','berries']};
  const wants=aliases[n]||[n]; return items.some(i=>wants.some(w=>i.includes(w)||w.includes(i)));
}
async function conundrum(request,env,uid){
  const b=await read(request),items=[...(b.fridge||[]),...(b.freezer||[]),...(b.cupboard||[]),...(b.items||[])].map(norm).filter(Boolean);
  if(!items.length) return j({ok:true,mode:'fridge_freezer_cupboard',top:[],message:'Tell Shift what you have and I’ll build ideas from those ingredients.'},200,request);
  const candidates=MEALS.map(m=>{const matched=m.ingredients.filter(x=>hasIngredient(items,x));return {...m,matched,missing:m.ingredients.filter(x=>!hasIngredient(items,x)),match_ratio:matched.length/m.ingredients.length};})
    .filter(x=>x.matched.length>=1&&x.match_ratio>=0.5)
    .sort((a,b)=>b.match_ratio-a.match_ratio||b.protein-a.protein)
    .slice(0,4);
  const top=candidates.map(x=>({...x,why:`Uses ${x.matched.join(', ')}`,missing_note:x.missing.length?`You'd still need: ${x.missing.join(', ')}`:'You already listed everything needed.'}));
  return j({ok:true,mode:'fridge_freezer_cupboard',top,message:top.length?'These ideas are based on ingredients you actually listed. Missing items are shown clearly.':'I can’t make a sensible full meal from that list yet. Add a few more ingredients rather than me inventing food you do not have.'},200,request);
}

const EXERCISES={
 walk:[{name:'Brisk walk',sets:1,reps:null,minutes:20,rest_seconds:0,notes:'Comfortably hard pace; you should still be able to talk.'}],
 jog:[{name:'Walk warm-up',sets:1,minutes:5,rest_seconds:0},{name:'Easy jog / walk intervals',sets:6,reps:'2 min jog + 1 min walk',minutes:18,rest_seconds:0,notes:'Keep this easy, not a race.'},{name:'Walk cool-down',sets:1,minutes:5,rest_seconds:0}],
 strength:[{name:'Chair squats',sets:3,reps:'8–12',rest_seconds:60},{name:'Wall or incline press-ups',sets:3,reps:'8–12',rest_seconds:60},{name:'Backpack rows',sets:3,reps:'10–12',rest_seconds:60},{name:'Glute bridges',sets:3,reps:'10–15',rest_seconds:45},{name:'Dead bug',sets:3,reps:'6–10 each side',rest_seconds:45}],
 mobility:[{name:'Easy walk',sets:1,minutes:10,rest_seconds:0},{name:'Hip and ankle mobility',sets:1,minutes:8,rest_seconds:0},{name:'Gentle upper-body mobility',sets:1,minutes:7,rest_seconds:0}]
};
async function fitPlan(request,env,uid){
  const b=await read(request),days=Math.min(7,Math.max(1,Number(b.days)||7)),prefs=String(b.preferences||'').toLowerCase();
  const wantsJog=/jog|run/.test(prefs),wantsHome=/home/.test(prefs),knee=/knee|joint/.test(prefs);
  const sessions=[];
  for(let i=0;i<days;i++){
    let type;
    if(knee) type=i%3===0?'mobility':i%2===0?'strength':'walk';
    else if(wantsJog) type=i%3===0?'jog':i%2===0?'strength':'walk';
    else type=i%3===0?'strength':i%2===0?'walk':'mobility';
    sessions.push({day:i+1,title:type==='strength'?(wantsHome?'Home strength':'Full-body strength'):type==='jog'?'Easy jog / walk session':type==='walk'?'Brisk walking session':'Mobility & recovery',focus:type,exercises:EXERCISES[type],estimated_minutes:EXERCISES[type].reduce((n,x)=>n+(x.minutes||6),0),progression:'If this feels comfortable for two sessions, add 1–2 reps per set or 2–5 minutes — not both at once.'});
  }
  const plan={kind:'shift_fit_plan',days_requested:days,preference_note:b.preferences||null,step_target:7000,sessions,rule:'Start where you are. Pain, dizziness or unusual symptoms beat the plan — stop and seek appropriate advice.'};
  await savePlan(env,uid,'fit',plan); return j({ok:true,plan},200,request);
}

async function hydration(request,env,uid){
  const b=await read(request),weightKg=num(b.weight_kg)||75,activity=num(b.activity_minutes)||0,heat=!!b.hot_weather;
  const guide=Math.round((Math.min(3500,Math.max(1800,weightKg*30))+Math.round(activity/30)*300+(heat?400:0))/100)*100;
  const portions=[['On waking',0.15],['With breakfast',0.15],['Mid-morning',0.12],['With lunch',0.18],['Mid-afternoon',0.12],['With dinner',0.16],['Evening',0.12]];
  let allocated=0; const schedule=portions.map((x,i)=>{let ml=i===portions.length-1?guide-allocated:Math.round(guide*x[1]/50)*50;allocated+=ml;return{when:x[0],ml};});
  const plan={kind:'shift_hydration_plan',guide_ml:guide,guide_litres:+(guide/1000).toFixed(1),schedule,activity_extra_ml:Math.round(activity/30)*300,heat_extra_ml:heat?400:0,note:'General hydration guide only. Some heart, kidney and other conditions need individual fluid advice.'};
  await savePlan(env,uid,'hydration',plan); return j({ok:true,plan},200,request);
}

async function savePlan(env,uid,type,plan){
  await env.DB.prepare(`UPDATE shift_plans SET status='superseded' WHERE user_id=? AND plan_type=? AND status='active'`).bind(uid,type).run();
  await env.DB.prepare(`INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(?,?,?,?,?)`).bind(uid,type,today(),'active',JSON.stringify(plan)).run();
}
async function ensurePlanSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS shift_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,plan_type TEXT NOT NULL,starts_on TEXT NOT NULL,ends_on TEXT,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'active',plan_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
async function read(r){try{return await r.json()}catch{return {}}}
function corsHeaders(request){const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ALLOWED_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const headers=new Headers(response.headers);for(const[k,v]of Object.entries(corsHeaders(request)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
