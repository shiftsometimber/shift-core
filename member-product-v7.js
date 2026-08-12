import core from './worker.js';
import {memberProductV6Routes} from './member-product-v6.js';
import {listPublishedContent} from './structured-content-v1.js';
import {ensureStructuredLaunchSeed} from './structured-launch-seed-v1.js';

const OWNED=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/fit/plan','/v1/fit/replace']);
const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const json=(data,status=200,request)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...cors(request)}});

export async function memberProductV7Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!OWNED.has(path))return memberProductV6Routes(request,env,ctx);
  if(request.method==='OPTIONS')return memberProductV6Routes(request,env,ctx);
  const auth=await authenticate(request,env,ctx);if(auth.response)return withCors(auth.response,request);
  const body=await readClone(request);
  await ensureStructuredLaunchSeed(env.DB);
  const base=await memberProductV6Routes(request,env,ctx);
  if(!base?.ok)return withCors(base,request);
  const payload=await base.clone().json().catch(()=>null);if(!payload)return withCors(base,request);
  const nays=await negativeIds(env.DB,auth.user.id,path.startsWith('/v1/grub')?'grub':'fit');
  if(path==='/v1/grub/plan')return structuredGrubPlan(request,env,auth.user.id,body,payload,nays);
  if(path==='/v1/grub/replace')return structuredGrubReplace(request,env,body,payload,nays);
  if(path==='/v1/fit/plan')return structuredFitPlan(request,env,auth.user.id,body,payload,nays);
  return structuredFitReplace(request,env,body,payload,nays);
}

async function structuredGrubPlan(request,env,userId,body,payload,nays){
  const published=await listPublishedContent(env.DB,'recipe',{limit:500});
  const prefs=preferenceText(body),blocked=new Set(nays);
  let structuredServed=0;
  for(const day of payload.plan?.days||[]){
    const used=new Set((day.meals||[]).map(x=>x.id));
    for(let i=0;i<(day.meals||[]).length;i++){
      const current=day.meals[i],type=String(current.type||current.meal_type||'');
      const options=published.filter(x=>x.data?.meal_type===type&&!blocked.has(x.id)&&!used.has(x.id)&&recipeAllowed(x,prefs));
      if(!options.length)continue;
      const chosen=toRecipe(options[(Number(day.day||1)+i-1)%options.length]);
      day.meals[i]=chosen;used.add(chosen.id);structuredServed++;
    }
    day.totals={kcal:(day.meals||[]).reduce((a,m)=>a+Number(m.kcal||m.nutrition?.kcal||0),0),protein_g:(day.meals||[]).reduce((a,m)=>a+Number(m.protein||m.nutrition?.protein_g||0),0)};
  }
  payload.plan.kind='shift_grub_plan_v7';
  payload.plan.catalogue={authority:structuredServed?'structured_published_preferred':'legacy_fallback',structured_published_available:published.length,structured_items_served:structuredServed,legacy_fallback_used:structuredServed<(payload.plan?.days||[]).reduce((a,d)=>a+(d.meals||[]).length,0),provenance_visible:true};
  if(structuredServed)await replaceLatestPlan(env.DB,userId,'grub',payload.plan);
  return json(payload,200,request);
}

async function structuredGrubReplace(request,env,body,payload,nays){
  const published=await listPublishedContent(env.DB,'recipe',{limit:500}),type=String(body.type||payload?.meal?.type||''),prefs=preferenceText(body),exclude=new Set([...(body.exclude||[]).map(String),...nays]);
  const options=published.filter(x=>x.data?.meal_type===type&&!exclude.has(x.id)&&recipeAllowed(x,prefs));
  if(!options.length)return json(payload,200,request);
  return json({ok:true,meal:toRecipe(options[Math.floor(Math.random()*options.length)]),catalogue:{authority:'structured_published',legacy_fallback_used:false}},200,request);
}

async function structuredFitPlan(request,env,userId,body,payload,nays){
  const published=await listPublishedContent(env.DB,'exercise',{limit:500}),blocked=new Set(nays),context=fitContext(body),structuredUsedAcrossPlan=new Set();let structuredServed=0;
  for(const session of payload.plan?.sessions||[]){
    const usedInSession=new Set((session.exercises||[]).map(x=>x.id));
    for(let i=0;i<(session.exercises||[]).length;i++){
      const current=session.exercises[i],group=String(current.group||current.movement_group||'');
      const options=published.filter(x=>x.data?.movement_group===group&&!blocked.has(x.id)&&!usedInSession.has(x.id)&&!structuredUsedAcrossPlan.has(x.id)&&exerciseAllowed(x,context));
      if(!options.length)continue;
      const chosen=toExercise(options[(Number(session.day||1)+i-1)%options.length]);session.exercises[i]=chosen;usedInSession.add(chosen.id);structuredUsedAcrossPlan.add(chosen.id);structuredServed++;
    }
    session.estimated_minutes=(session.exercises||[]).reduce((a,x)=>a+Number(x.minutes||0),0);
  }
  const totalItems=(payload.plan?.sessions||[]).reduce((a,s)=>a+(s.exercises||[]).length,0);
  payload.plan.kind='shift_fit_plan_v7';
  payload.plan.catalogue={authority:structuredServed?'structured_published_preferred':'legacy_fallback',structured_published_available:published.length,structured_items_served:structuredServed,structured_unique_items_served:structuredUsedAcrossPlan.size,legacy_fallback_used:structuredServed<totalItems,progressive_cutover:true,quality_preserving_fallback:true,provenance_visible:true};
  if(structuredServed)await replaceLatestPlan(env.DB,userId,'fit',payload.plan);
  return json(payload,200,request);
}

async function structuredFitReplace(request,env,body,payload,nays){
  const published=await listPublishedContent(env.DB,'exercise',{limit:500}),group=String(body.group||payload?.exercise?.group||''),exclude=new Set([...(body.exclude||[]).map(String),...nays]),context=fitContext(body);
  const options=published.filter(x=>x.data?.movement_group===group&&!exclude.has(x.id)&&exerciseAllowed(x,context));
  if(!options.length)return json(payload,200,request);
  return json({ok:true,exercise:toExercise(options[Math.floor(Math.random()*options.length)]),catalogue:{authority:'structured_published',legacy_fallback_used:false}},200,request);
}

function toRecipe(row){const d=row.data,n=d.nutrition||{};return{id:row.id,type:d.meal_type,name:row.title,minutes:Number(d.prep_minutes||0)+Number(d.cook_minutes||0),kcal:Number(n.kcal||0),protein:Number(n.protein_g||0),fibre:Number(n.fibre_g||0),servings:Number(d.servings||1),ingredients:d.ingredients||[],method:d.method||[],tags:d.tags||[],equipment:d.equipment||[],storage:d.storage,nutrition_basis:n.precision_note,nutrition:{status:n.status,kcal:Number(n.kcal||0),protein_g:Number(n.protein_g||0),carbohydrate_g:Number(n.carbohydrate_g||0),fat_g:Number(n.fat_g||0),fibre_g:Number(n.fibre_g||0),methodology:n.methodology,dataset_version:n.dataset_version},recipe:{servings:Number(d.servings||1),ingredients:(d.ingredients||[]).map(x=>`${x.amount} ${x.item}`),method:d.method||[],minutes:Number(d.prep_minutes||0)+Number(d.cook_minutes||0),equipment:d.equipment||[],storage:d.storage,food_safety:d.food_safety||[],substitutions:d.substitutions||[]},structured:{published:true,version:row.version,updated_at:row.updated_at,provenance:d.provenance||{}}};}
function toExercise(row){const d=row.data;return{id:row.id,name:row.title,group:d.movement_group,minutes:Number(d.minutes||0),sets:d.dosage?.sets??null,reps:d.dosage?.reps??d.dosage?.time_seconds??null,rest_seconds:Number(d.dosage?.rest_seconds||0),how:d.instructions||[],form_cues:d.form_cues||[],equipment:d.equipment||[],locations:d.locations||[],avoid:d.limitations?.avoid||[],caution:d.limitations?.caution||[],regressions:d.regressions||[],progressions:d.progressions||[],substitutions:d.substitutions||[],visual:d.visual,structured:{published:true,version:row.version,updated_at:row.updated_at,provenance:d.provenance||{}}};}
function preferenceText(body){return [body.preferences,body.dislikes,body.dietaryRequirements].filter(Boolean).join(' ').toLowerCase();}
function recipeAllowed(row,prefs){const text=`${row.title} ${(row.data?.ingredients||[]).map(x=>x.item).join(' ')}`.toLowerCase(),tags=row.data?.tags||[];if(/no fish|hate fish|fish allergy/.test(prefs)&&tags.includes('fish'))return false;if(prefs.includes('vegetarian')&&!tags.includes('vegetarian'))return false;for(const item of ['mushroom','salmon','tuna','bacon','beef','chicken','egg','cheese'])if((prefs.includes(`hate ${item}`)||prefs.includes(`no ${item}`))&&text.includes(item))return false;return true;}
function fitContext(body){const text=[body.preferences,body.limitations].filter(Boolean).join(' ').toLowerCase(),location=String(body.location||(/gym/.test(text)?'gym':/outside|walk/.test(text)?'outside':'home')).toLowerCase(),equipment=(Array.isArray(body.equipment)?body.equipment:[body.equipment]).filter(Boolean).map(x=>String(x).toLowerCase());return{location,equipment,text};}
function exerciseAllowed(row,context){const d=row.data,loc=(d.locations||[]).includes(context.location);if(!loc)return false;const required=d.equipment||[];if(required.length&&context.equipment.length&&!required.some(x=>context.equipment.includes(String(x).toLowerCase())||String(x).toLowerCase()==='none'))return false;for(const avoid of d.limitations?.avoid||[])if(context.text.includes(String(avoid).replaceAll('-',' '))||(/knee/.test(context.text)&&String(avoid).includes('knee')))return false;return true;}
async function negativeIds(DB,userId,product){try{const{results=[]}=await DB.prepare(`SELECT entity_id FROM product_feedback WHERE user_id=? AND product=? AND sentiment='nay' ORDER BY updated_at DESC LIMIT 500`).bind(userId,product).all();return results.map(x=>String(x.entity_id));}catch{return[]}}
async function replaceLatestPlan(DB,userId,product,plan){const row=await DB.prepare(`SELECT id FROM shift_plans WHERE user_id=? AND plan_type=? AND status='active' ORDER BY id DESC LIMIT 1`).bind(userId,product).first();if(row?.id)await DB.prepare(`UPDATE shift_plans SET plan_json=? WHERE id=?`).bind(JSON.stringify(plan),row.id).run();}
async function authenticate(request,env,ctx){const response=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user};}
async function readClone(request){try{return await request.clone().json()}catch{return{}}}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const h=new Headers(response.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
