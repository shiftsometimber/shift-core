import core from './worker.js';
import {memberProductV4Routes} from './member-product-v4.js';
import {listPublishedContent} from './structured-content-v1.js';

const OWNED=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/fit/plan','/v1/fit/replace']);
const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const GRUB_FLOOR={breakfast:12,lunch:16,dinner:24,snack:12};
const FIT_FLOOR=48;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const today=()=>new Date().toISOString().slice(0,10);

export async function memberProductStructuredRoutes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!OWNED.has(path)||String(env.STRUCTURED_MEMBER_CATALOGUE||'').toLowerCase()!=='enabled')return memberProductV4Routes(request,env,ctx);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(request.method!=='POST')return reply({ok:false,error:'method_not_allowed'},405,request);

  const product=path.startsWith('/v1/grub/')?'grub':'fit';
  const catalogue=await loadLaunchReadyCatalogue(env.DB,product);
  if(!catalogue.ready)return memberProductV4Routes(request,env,ctx);

  const session=await authenticate(request,env,ctx);if(session.response)return withCors(session.response,request);
  await ensurePlanSchema(env.DB);
  const body=await read(request);
  if(path==='/v1/grub/plan')return grubPlan(request,env,session.user.id,body,catalogue.items);
  if(path==='/v1/grub/replace')return grubReplace(request,body,catalogue.items);
  if(path==='/v1/fit/plan')return fitPlan(request,env,session.user.id,body,catalogue.items);
  return fitReplace(request,body,catalogue.items);
}

export async function loadLaunchReadyCatalogue(DB,product){
  if(product==='grub'){
    const rows=await listPublishedContent(DB,'grub_recipe',{limit:500});
    const items=rows.map(x=>({...x.data,id:x.id,title:x.title})).filter(recipeLaunchReady);
    const counts=Object.fromEntries(Object.keys(GRUB_FLOOR).map(type=>[type,items.filter(x=>x.meal_type===type).length]));
    return{ready:Object.entries(GRUB_FLOOR).every(([type,min])=>counts[type]>=min),items,counts,required:GRUB_FLOOR};
  }
  const rows=await listPublishedContent(DB,'fit_exercise',{limit:500});
  const items=rows.map(x=>({...x.data,id:x.id,title:x.title})).filter(exerciseLaunchReady);
  return{ready:items.length>=FIT_FLOOR,items,count:items.length,required:FIT_FLOOR};
}

function recipeLaunchReady(x){return x?.nutrition?.status==='validated'&&x?.review?.status==='approved'&&['breakfast','lunch','dinner','snack'].includes(x?.meal_type);}
function exerciseLaunchReady(x){return x?.visual?.status==='approved'&&!!x?.visual?.asset_ref&&x?.review?.status==='approved'&&Array.isArray(x?.instructions)&&x.instructions.length>=3;}

async function grubPlan(request,env,uid,body,recipes){
  const days=clamp(Number(body.days)||1,1,7),prefs=preferenceText(body),used=new Set(),planDays=[];
  for(let day=0;day<days;day++){
    const meals=[];
    for(const type of ['breakfast','lunch','dinner','snack']){
      let pool=recipes.filter(x=>x.meal_type===type&&recipeAllowed(x,prefs)&&!used.has(x.id));
      if(!pool.length)pool=recipes.filter(x=>x.meal_type===type&&recipeAllowed(x,prefs));
      if(!pool.length)return reply({ok:false,error:'no_safe_recipe_match',message:`Shift could not build a ${type} without ignoring the current preferences.`},409,request);
      const item=pool[(day+type.length)%pool.length];used.add(item.id);meals.push(publicRecipe(item));
    }
    planDays.push({day:day+1,date:new Date(Date.now()+day*86400000).toISOString().slice(0,10),meals,totals:{kcal:meals.reduce((a,x)=>a+Number(x.nutrition?.kcal||0),0),protein_g:meals.reduce((a,x)=>a+Number(x.nutrition?.protein_g||0),0)}});
  }
  const plan={kind:'shift_grub_plan_structured_v1',catalogue_source:'structured_content',days_requested:days,targets:{calories:Number(body.calories)||2000,protein_g:Number(body.protein_g)||108},days:planDays,quality:{canonical_structured_content:true,validated_nutrition:true,reviewed_content:true},feedback_rule:'Yay and Nay are recommendation signals; replacement never silently ignores exclusions.'};
  await savePlan(env,uid,'grub',plan);return reply({ok:true,plan},200,request);
}

function grubReplace(request,body,recipes){
  const type=String(body.type||''),exclude=new Set((body.exclude||[]).map(String)),prefs=preferenceText(body);
  let pool=recipes.filter(x=>x.meal_type===type&&!exclude.has(x.id)&&recipeAllowed(x,prefs));
  if(!pool.length)pool=recipes.filter(x=>x.meal_type===type&&recipeAllowed(x,prefs));
  if(!pool.length)return reply({ok:false,error:'no_replacement_available'},409,request);
  return reply({ok:true,meal:publicRecipe(pool[Math.floor(Math.random()*pool.length)]),catalogue_source:'structured_content'},200,request);
}

function publicRecipe(x){return{id:x.id,type:x.meal_type,name:x.title,minutes:Number(x.prep_minutes||0)+Number(x.cook_minutes||0),kcal:Number(x.nutrition.kcal),protein:Number(x.nutrition.protein_g),fibre:Number(x.nutrition.fibre_g||0),tags:x.tags||[],allergens:x.allergens||[],substitutions:x.substitutions||[],recipe:{servings:x.servings,ingredients:(x.ingredients||[]).map(i=>`${i.amount} ${i.item}`),method:x.method||[],minutes:Number(x.prep_minutes||0)+Number(x.cook_minutes||0),equipment:x.equipment||[],storage:x.storage||{},food_safety:x.food_safety||[],nutrition_basis:x.nutrition.methodology},nutrition:{kcal:Number(x.nutrition.kcal),protein_g:Number(x.nutrition.protein_g),carbohydrate_g:Number(x.nutrition.carbohydrate_g),fat_g:Number(x.nutrition.fat_g),fibre_g:Number(x.nutrition.fibre_g||0),methodology:x.nutrition.methodology,validated:true},catalogue_source:'structured_content'};}
function preferenceText(body){return [body.preferences,body.dislikes,body.dietaryRequirements].filter(Boolean).join(' ').toLowerCase();}
function recipeAllowed(r,prefs){const hay=`${r.title} ${(r.ingredients||[]).map(x=>x.item).join(' ')} ${(r.tags||[]).join(' ')}`.toLowerCase();if(/no fish|hate fish|fish allergy/.test(prefs)&&(r.allergens||[]).includes('fish'))return false;if(prefs.includes('vegetarian')&&!(r.tags||[]).includes('vegetarian'))return false;for(const item of ['mushroom','salmon','tuna','bacon','beef','chicken','egg','cheese'])if((prefs.includes(`hate ${item}`)||prefs.includes(`no ${item}`)||prefs.includes(`avoid ${item}`))&&hay.includes(item))return false;return true;}

async function fitPlan(request,env,uid,body,exercises){
  const days=clamp(Number(body.days)||3,1,7),minutes=clamp(Number(body.minutes_per_day)||20,10,60),context=fitContext(body),sessions=[];
  for(let day=1;day<=days;day++)sessions.push(composeFit(day,minutes,context,exercises));
  if(sessions.some(s=>!s.exercises.length))return reply({ok:false,error:'no_safe_exercise_match',message:'Shift could not build a sensible session for those limitations, location and equipment.'},409,request);
  const plan={kind:'shift_fit_plan_structured_v1',catalogue_source:'structured_content',days_requested:days,minutes_per_day:minutes,location:context.location,equipment:context.equipment,sessions,quality:{canonical_structured_content:true,approved_visuals:true,reviewed_content:true},rule:'Stop if you develop chest pain, severe breathlessness, dizziness, faintness, or sharp/unusual pain. Seek appropriate medical advice rather than pushing through.'};
  await savePlan(env,uid,'fit',plan);return reply({ok:true,plan},200,request);
}

function fitReplace(request,body,exercises){const context=fitContext(body),group=String(body.group||''),exclude=new Set((body.exclude||[]).map(String)),pool=eligibleExercises(exercises,group,context,exclude);if(!pool.length)return reply({ok:false,error:'no_replacement_available',message:'Shift could not find a sensible equivalent for those limitations and equipment.'},409,request);return reply({ok:true,exercise:publicExercise(pool[Math.floor(Math.random()*pool.length)]),catalogue_source:'structured_content'},200,request);}
function fitContext(body){const equipment=[body.equipment].flat().filter(Boolean).flatMap(x=>String(x).toLowerCase().split(/[,|]/).map(s=>s.trim())).filter(Boolean);return{location:String(body.location||'home').toLowerCase(),equipment:new Set(['none',...equipment]),limitations:String(body.limitations||'').toLowerCase()};}
function eligibleExercises(items,group,ctx,exclude=new Set()){return items.filter(x=>!exclude.has(x.id)&&(!group||x.movement_group===group)&&(!Array.isArray(x.locations)||x.locations.includes(ctx.location)||x.locations.includes('anywhere'))&&equipmentAllowed(x,ctx)&&limitationAllowed(x,ctx));}
function equipmentAllowed(x,ctx){const eq=x.equipment||[];if(!eq.length||eq.includes('none'))return true;if(ctx.location==='gym'&&eq.includes('full-gym'))return true;return eq.every(e=>e==='support'||e==='mat'||ctx.equipment.has(String(e).toLowerCase())||ctx.equipment.has('full-gym'));}
function limitationAllowed(x,ctx){const avoid=x.limitations?.avoid||[];return !avoid.some(tag=>ctx.limitations.includes(String(tag).replace(/-/g,' '))||ctx.limitations.includes(String(tag)));}
function composeFit(day,total,ctx,items){const used=new Set(),out=[];const groups=total<=15?['legs','push','core']:total<=30?['legs','push','pull','core']:['legs','push','pull','core','cardio'];for(const group of groups){const pool=eligibleExercises(items,group,ctx,used);if(!pool.length)continue;const item=pool[(day+out.length)%pool.length];used.add(item.id);out.push(publicExercise(item));}return{day,title:ctx.location==='gym'?'Gym session':ctx.location==='outside'?'Outside movement session':'Home session',requested_minutes:total,estimated_minutes:out.reduce((a,x)=>a+Number(x.minutes||0),0),location:ctx.location,equipment:[...ctx.equipment],limitations:ctx.limitations,exercises:out,progression:'When this feels comfortable for two sessions, use the structured progression for each movement rather than padding the session with arbitrary extra work.'};}
function publicExercise(x){return{id:x.id,name:x.title,group:x.movement_group,minutes:x.minutes,sets:x.dosage?.sets,reps:x.dosage?.reps??x.dosage?.time_seconds??null,rest_seconds:x.dosage?.rest_seconds??0,how:x.instructions||[],form_cues:x.form_cues||[],regressions:x.regressions||[],progressions:x.progressions||[],substitutions:x.substitutions||[],equipment:x.equipment||[],locations:x.locations||[],limitations:x.limitations||{},visual:x.visual,catalogue_source:'structured_content'};}

async function savePlan(env,uid,type,plan){await env.DB.prepare(`UPDATE shift_plans SET status='superseded' WHERE user_id=? AND plan_type=? AND status='active'`).bind(uid,type).run();await env.DB.prepare(`INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(?,?,?,?,?)`).bind(uid,type,today(),'active',JSON.stringify(plan)).run();}
async function ensurePlanSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS shift_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,plan_type TEXT NOT NULL,starts_on TEXT NOT NULL,ends_on TEXT,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'active',plan_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);}
async function authenticate(request,env,ctx){const response=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user};}
async function read(request){try{return await request.json()}catch{return{}}}
function reply(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...cors(request)}});}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const h=new Headers(response.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
