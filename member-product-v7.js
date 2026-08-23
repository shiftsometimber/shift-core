import core from './worker.js';
import {authenticateMember} from './member-state-fast-v1.js';
import {memberProductV6Routes} from './member-product-v6.js';
import {listPublishedContent} from './structured-content-v1.js';
import {ensureStructuredLaunchSeed} from './structured-launch-seed-v1.js';
import {assessMemberOutput} from './member-quality-v1.js';

const OWNED=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/fit/plan','/v1/fit/replace']);
const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const FINAL_COUNTS={recipe:798,exercise:1326};
const json=(data,status=200,request)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...cors(request)}});
const pct=(n,d)=>d?Math.round((Number(n)*1000)/Number(d))/10:0;

export async function memberProductV7Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!OWNED.has(path))return memberProductV6Routes(request,env,ctx);
  if(request.method==='OPTIONS')return memberProductV6Routes(request,env,ctx);
  const auth=await authenticateMember(request,env);if(auth.response)return withCors(auth.response,request);
  const body=await readClone(request);
  const base=await memberProductV6Routes(request,env,ctx,{deferQuality:true});
  if(!base?.ok)return withCors(base,request);
  const payload=await base.clone().json().catch(()=>null);if(!payload)return withCors(base,request);
  const nays=await negativeIds(env.DB,auth.user.id,path.startsWith('/v1/grub')?'grub':'fit');
  if(path==='/v1/grub/plan')return structuredGrubPlan(request,env,auth.user.id,body,payload,nays);
  if(path==='/v1/grub/replace')return structuredGrubReplace(request,env,body,payload,nays);
  if(path==='/v1/fit/plan')return structuredFitPlan(request,env,auth.user.id,body,payload,nays);
  return structuredFitReplace(request,env,body,payload,nays);
}

async function structuredGrubPlan(request,env,userId,body,payload,nays){
  const allPublished=await listPublishedContent(env.DB,'recipe',{limit:2500}),authority=finalV1Authority(allPublished,'recipe');
  if(authority.incomplete)return incompleteFinalV1(request,'grub',authority);
  const published=authority.rows.filter(credibleRecipe),prefs=preferenceText(body),recent=await recentGrubIds(env.DB,userId),blocked=new Set([...nays,...recent]);let structuredServed=0;
  const globallyUsed=new Set(),familyCounts=new Map();
  for(const day of payload.plan?.days||[]){
    const used=new Set((day.meals||[]).map(x=>x.id));
    for(let i=0;i<(day.meals||[]).length;i++){
      const current=day.meals[i],type=String(current.type||current.meal_type||'');
      let options=published.filter(x=>x.data?.meal_type===type&&!blocked.has(x.id)&&!used.has(x.id)&&!globallyUsed.has(x.id)&&recipeAllowed(x,prefs)&&withinTime(x,body.max_minutes)&&(familyCounts.get(mealFamily(x.title))||0)<2);
      if(!options.length)options=published.filter(x=>x.data?.meal_type===type&&!blocked.has(x.id)&&!used.has(x.id)&&recipeAllowed(x,prefs)&&withinTime(x,body.max_minutes));
      if(!options.length)return json({ok:false,error:'no_safe_recipe_match',message:`Shift could not safely build a ${type} within those requirements. Change the profile only if the requirement itself has changed.`},409,request);
      options=rankRecipes(options,preferenceLikes(body));
      const preferredWindow=Math.min(options.length,Math.max(8,Math.ceil(options.length*.2))),chosen=toRecipe(options[stableIndex(preferredWindow,userId,day.day,i)]);
      day.meals[i]=chosen;used.add(chosen.id);globallyUsed.add(chosen.id);const family=mealFamily(chosen.name);familyCounts.set(family,(familyCounts.get(family)||0)+1);structuredServed++;
    }
    day.totals={kcal:(day.meals||[]).reduce((a,m)=>a+Number(m.kcal||m.nutrition?.kcal||0),0),protein_g:(day.meals||[]).reduce((a,m)=>a+Number(m.protein||m.nutrition?.protein_g||0),0)};
  }
  const totalItems=(payload.plan?.days||[]).reduce((a,d)=>a+(d.meals||[]).length,0),legacyItems=Math.max(0,totalItems-structuredServed);
  payload.plan.kind='shift_grub_plan_v7';
  payload.plan.catalogue=catalogueMeta(authority,allPublished.length,structuredServed,totalItems,legacyItems);
  payload.plan.personalisation={taste_profile_applied:Boolean(prefs),historical_nays_applied:nays.length,recent_meals_cooled_off:recent.length,exact_repeats_in_plan:totalItems-globallyUsed.size,household_size:Math.max(1,Number(body.household_size)||1),catalogue_target:2500,catalogue_target_is_not_live_count:true};
  const quality=assessMemberOutput('grub',payload,body);payload.qualityCommissioning=quality;
  if(!quality.ok)return qualityFailure(quality,request);
  if(structuredServed)await replaceLatestPlan(env.DB,userId,'grub',payload.plan);
  return json(payload,200,request);
}

async function structuredGrubReplace(request,env,body,payload,nays){
  const allPublished=await listPublishedContent(env.DB,'recipe',{limit:2500}),authority=finalV1Authority(allPublished,'recipe');
  if(authority.incomplete)return incompleteFinalV1(request,'grub',authority);
  const published=authority.rows,type=String(body.type||payload?.meal?.type||''),prefs=preferenceText(body),exclude=new Set([...(body.exclude||[]).map(String),...nays]);
  const options=published.filter(x=>x.data?.meal_type===type&&!exclude.has(x.id)&&recipeAllowed(x,prefs));
  if(!options.length)return json(payload,200,request);
  const meal=toRecipe(options[Math.floor(Math.random()*options.length)]);
  return json({ok:true,meal,catalogue:{...catalogueMeta(authority,allPublished.length,1,1,0),total_items:1,structured_items_served:1,legacy_fallback_items:0,structured_serving_pct:100,legacy_fallback_pct:0,legacy_fallback_used:false}},200,request);
}

async function structuredFitPlan(request,env,userId,body,payload,nays){
  const allPublished=await listPublishedContent(env.DB,'exercise',{limit:2500}),authority=finalV1Authority(allPublished,'exercise');
  if(authority.incomplete)return incompleteFinalV1(request,'fit',authority);
  const published=authority.rows,blocked=new Set(nays),context=fitContext(body),structuredUsedAcrossPlan=new Set(),canonicalUsedAcrossPlan=new Set();let structuredServed=0;
  for(const session of payload.plan?.sessions||[]){
    const usedInSession=new Set((session.exercises||[]).map(x=>x.id));
    for(let i=0;i<(session.exercises||[]).length;i++){
      const current=session.exercises[i],group=String(current.group||current.movement_group||'');
      const eligible=x=>exerciseServesGroup(x,group)&&!blocked.has(x.id)&&!usedInSession.has(x.id)&&!structuredUsedAcrossPlan.has(x.id)&&exerciseAllowed(x,context);
      let options=published.filter(x=>eligible(x)&&!canonicalUsedAcrossPlan.has(String(x.data?.canonical_movement||x.id)));
      if(!options.length)options=published.filter(eligible);
      if(!options.length)continue;
      const chosen=toExercise(options[(Number(session.day||1)+i-1)%options.length],group);session.exercises[i]=chosen;usedInSession.add(chosen.id);structuredUsedAcrossPlan.add(chosen.id);canonicalUsedAcrossPlan.add(String(chosen.canonical_movement||chosen.id));structuredServed++;
    }
    session.estimated_minutes=(session.exercises||[]).reduce((a,x)=>a+Number(x.minutes||0),0);
  }
  const totalItems=(payload.plan?.sessions||[]).reduce((a,s)=>a+(s.exercises||[]).length,0),legacyItems=Math.max(0,totalItems-structuredServed);
  payload.plan.kind='shift_fit_plan_v7';
  payload.plan.catalogue={...catalogueMeta(authority,allPublished.length,structuredServed,totalItems,legacyItems),structured_unique_items_served:structuredUsedAcrossPlan.size,structured_unique_canonical_movements:canonicalUsedAcrossPlan.size};
  const quality=assessMemberOutput('fit',payload,body);payload.qualityCommissioning=quality;
  if(!quality.ok)return qualityFailure(quality,request);
  if(structuredServed)await replaceLatestPlan(env.DB,userId,'fit',payload.plan);
  return json(payload,200,request);
}

async function structuredFitReplace(request,env,body,payload,nays){
  const allPublished=await listPublishedContent(env.DB,'exercise',{limit:2500}),authority=finalV1Authority(allPublished,'exercise');
  if(authority.incomplete)return incompleteFinalV1(request,'fit',authority);
  const published=authority.rows,group=String(body.group||payload?.exercise?.group||''),exclude=new Set([...(body.exclude||[]).map(String),...nays]),context=fitContext(body);
  const options=published.filter(x=>exerciseServesGroup(x,group)&&!exclude.has(x.id)&&exerciseAllowed(x,context));
  if(!options.length)return json(payload,200,request);
  const exercise=toExercise(options[Math.floor(Math.random()*options.length)],group);
  return json({ok:true,exercise,catalogue:{...catalogueMeta(authority,allPublished.length,1,1,0),total_items:1,structured_items_served:1,legacy_fallback_items:0,structured_serving_pct:100,legacy_fallback_pct:0,legacy_fallback_used:false}},200,request);
}

function finalV1Authority(rows,type){
  const accepted=rows.filter(x=>x.data?.provenance?.final_v1_acceptance?.accepted===true),expected=FINAL_COUNTS[type];
  if(!accepted.length)return{active:false,incomplete:false,expected,accepted:0,rows};
  if(accepted.length!==expected)return{active:true,incomplete:true,expected,accepted:accepted.length,rows:[]};
  return{active:true,incomplete:false,expected,accepted:accepted.length,rows:accepted};
}
function incompleteFinalV1(request,product,a){return json({ok:false,error:'final_v1_publication_incomplete',message:'Shift is holding this plan while the accepted launch catalogue finishes publishing.',product,accepted:a.accepted,expected:a.expected},503,request)}
function catalogueMeta(authority,publishedTotal,structuredServed,totalItems,legacyItems){return{authority:authority.active?'final_v1_human_accepted':structuredServed?'structured_published_preferred':'legacy_fallback',structured_published_available:authority.rows.length,published_total_available:publishedTotal,final_v1_human_accepted:authority.active,final_v1_accepted_available:authority.active?authority.accepted:0,total_items:totalItems,structured_items_served:structuredServed,legacy_fallback_items:legacyItems,structured_serving_pct:pct(structuredServed,totalItems),legacy_fallback_pct:pct(legacyItems,totalItems),legacy_fallback_used:legacyItems>0,progressive_cutover:!authority.active,quality_preserving_fallback:true,provenance_visible:true}}
function qualityFailure(quality,request){return json({ok:false,error:'quality_gate_failed',message:'Shift rejected a recommendation that did not meet the member quality bar. Please retry.',quality,composition_stage:'post_structured_v7'},503,request)}
function toRecipe(row){const d=row.data,n=d.nutrition||{},acceptance=d.provenance?.final_v1_acceptance||null;return{id:row.id,type:d.meal_type,name:row.title,minutes:Number(d.prep_minutes||0)+Number(d.cook_minutes||0),kcal:Number(n.kcal||0),protein:Number(n.protein_g||0),fibre:Number(n.fibre_g||0),servings:Number(d.servings||1),ingredients:d.ingredients||[],method:d.method||[],tags:d.tags||[],equipment:d.equipment||[],storage:d.storage,nutrition_basis:n.precision_note,nutrition:{status:n.status,kcal:Number(n.kcal||0),protein_g:Number(n.protein_g||0),carbohydrate_g:Number(n.carbohydrate_g||0),fat_g:Number(n.fat_g||0),fibre_g:Number(n.fibre_g||0),methodology:n.methodology,dataset_version:n.dataset_version,ingredient_evidence_count:Array.isArray(d.ingredient_evidence)?d.ingredient_evidence.length:0},recipe:{servings:Number(d.servings||1),ingredients:(d.ingredients||[]).map(x=>`${x.amount} ${x.item}`),method:d.method||[],minutes:Number(d.prep_minutes||0)+Number(d.cook_minutes||0),equipment:d.equipment||[],storage:d.storage,food_safety:d.food_safety||[],substitutions:d.substitutions||[]},structured:{published:true,version:row.version,updated_at:row.updated_at,provenance:d.provenance||{},final_v1_accepted:Boolean(acceptance?.accepted),review_authority:d.canonical_review||null}};}
function toExercise(row,group){const d=row.data,acceptance=d.provenance?.final_v1_acceptance||null;return{id:row.id,name:row.title,group:group||d.movement_group,movement_group:d.movement_group,canonical_movement:d.canonical_movement,minutes:Number(d.minutes||0),sets:d.dosage?.sets??null,reps:d.dosage?.reps??d.dosage?.time_seconds??null,rest_seconds:Number(d.dosage?.rest_seconds||0),how:d.instructions||[],form_cues:d.form_cues||[],safety_cues:d.safety_cues||[],equipment:d.equipment||[],locations:d.locations||[],avoid:d.limitations?.avoid||[],caution:d.limitations?.caution||[],regressions:d.regressions||[],progressions:d.progressions||[],substitutions:d.substitutions||[],visual:d.visual,structured:{published:true,version:row.version,updated_at:row.updated_at,provenance:d.provenance||{},final_v1_accepted:Boolean(acceptance?.accepted),review_authority:d.canonical_review||null}};}
function preferenceText(body){return [body.preferences,body.dislikes,body.dietaryRequirements].filter(Boolean).join(' ').toLowerCase();}
function preferenceLikes(body){let values=[];if(Array.isArray(body.likes))values.push(...body.likes);if(typeof body.preferences==='string'){try{const parsed=JSON.parse(body.preferences);values.push(...(parsed?.food?.likes||parsed?.likes||[]))}catch{values.push(...body.preferences.split(/[,\n]+/))}}return[...new Set(values.map(x=>String(x).trim().toLowerCase()).filter(Boolean))]}
const UK_TASTE_ALIASES={
  'british':['british','roast','pie','stew','jacket','cottage','shepherd','pub'],
  'healthier fakeaways':['fakeaway','burger','pizza','kebab','curry','chow mein','fried rice','fish and chips'],
  'chippy-style':['fish','chips','chippy','battered'],
  'curry-house favourites':['curry','tikka','masala','biryani','jalfrezi','balti'],
  'chinese takeaway-style':['chinese','stir-fry','noodles','chow mein','fried rice','sweet and sour'],
  'kebab-shop style':['kebab','shawarma','gyros','flatbread'],
  'pub classics':['pub','pie','burger','roast','sausage','mash','fish and chips']
};
function rankRecipes(rows,likes){if(!likes.length)return rows;return rows.map((row,index)=>{const haystack=`${row.title} ${(row.data?.tags||[]).join(' ')} ${(row.data?.ingredients||[]).map(x=>x.item).join(' ')}`.toLowerCase();return{row,index,score:likes.reduce((n,x)=>{const terms=UK_TASTE_ALIASES[x]||[x];return n+(terms.some(term=>haystack.includes(term))?3:0)},0)}}).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.row)}
function withinTime(row,maxMinutes){const max=Number(maxMinutes||0);return !max||(Number(row.data?.prep_minutes||0)+Number(row.data?.cook_minutes||0))<=max}
function credibleRecipe(row){const title=String(row?.title||'').toLowerCase();if(!title)return false;if(/(?:bbq|barbecue).*(?:ham|turkey).*(?:buttie|sandwich)|(?:ham|turkey).*(?:bbq|barbecue).*(?:buttie|sandwich)/.test(title))return false;if(/industrial-|test recipe|placeholder|recipe \d+$/.test(title))return false;return true}
function mealFamily(value){const title=String(value||'').toLowerCase();for(const family of ['buttie','sandwich','wrap','pasta','curry','traybake','stir-fry','salad','rice','potato','omelette','oats','yoghurt','soup'])if(title.includes(family))return family;return title.split(/\s+/).slice(-2).join('-')}
function recipeAllowed(row,prefs){const text=`${row.title} ${(row.data?.ingredients||[]).map(x=>x.item).join(' ')} ${(row.data?.tags||[]).join(' ')}`.toLowerCase(),tags=row.data?.tags||[];if(/no fish|hate fish|fish allergy/.test(prefs)&&tags.includes('fish'))return false;if(prefs.includes('vegetarian')&&!tags.includes('vegetarian'))return false;if(/vegan/.test(prefs)&&!tags.includes('vegan'))return false;if(/gluten[ -]?free|coeliac/.test(prefs)&&!/gluten[ -]?free/.test(text))return false;for(const item of ['mushroom','salmon','tuna','bacon','beef','chicken','egg','cheese','peanut','nut','shellfish','prawn','milk','dairy','soya','soy','sesame','mustard','celery'])if(new RegExp(`(?:hate|no|allergy|allergic|intolerant|avoid)[^,;]{0,24}\\b${item}s?\\b|\\b${item}s?\\b[^,;]{0,24}(?:allergy|allergic|intolerant)`).test(prefs)&&text.includes(item))return false;return true;}
function fitContext(body){const text=[body.preferences,body.limitations].filter(Boolean).join(' ').toLowerCase(),location=String(body.location||(/gym/.test(text)?'gym':/outside|walk/.test(text)?'outside':'home')).toLowerCase(),equipment=expandEquipment((Array.isArray(body.equipment)?body.equipment:[body.equipment]).filter(Boolean));return{location,equipment,text};}
function expandEquipment(items){const out=new Set();for(const raw of items){const x=String(raw).toLowerCase().trim();out.add(x);if(x==='no equipment'||x==='bodyweight')out.add('none');if(x==='dumbbell')out.add('dumbbells');if(x==='dumbbells')out.add('dumbbell');if(x==='resistance band')out.add('band');if(x==='band')out.add('resistance band');if(x==='full gym'){for(const y of ['dumbbell','dumbbells','cable','band','resistance band','stationary bike','rowing erg','step','chair','wall','mat','none'])out.add(y)}}return [...out]}
function exerciseServesGroup(row,group){const groups=Array.isArray(row.data?.serving_groups)?row.data.serving_groups:[];return groups.includes(group)||String(row.data?.movement_group||'')===group}
function exerciseAllowed(row,context){const d=row.data,loc=(d.locations||[]).includes(context.location);if(!loc)return false;const required=(d.equipment||[]).map(x=>String(x).toLowerCase());if(required.length&&context.equipment.length&&!required.some(x=>x==='none'||context.equipment.includes(x)))return false;for(const avoid of d.limitations?.avoid||[])if(context.text.includes(String(avoid).replaceAll('-',' '))||(/knee/.test(context.text)&&String(avoid).includes('knee')))return false;return true;}
async function negativeIds(DB,userId,product){try{const{results=[]}=await DB.prepare(`SELECT entity_id FROM product_feedback WHERE user_id=? AND product=? AND sentiment='nay' ORDER BY updated_at DESC LIMIT 500`).bind(userId,product).all();return results.map(x=>String(x.entity_id));}catch{return[]}}
async function recentGrubIds(DB,userId){try{const{results=[]}=await DB.prepare(`SELECT plan_json FROM shift_plans WHERE user_id=? AND plan_type='grub' ORDER BY id DESC LIMIT 4`).bind(userId).all();const ids=[];for(const row of results){let plan={};try{plan=JSON.parse(row.plan_json||'{}')}catch{}for(const day of plan.days||[])for(const meal of day.meals||[])if(meal?.id)ids.push(String(meal.id));}return[...new Set(ids)].slice(0,160)}catch{return[]}}
function stableIndex(length,userId,day,index){if(!length)return 0;const date=new Date().toISOString().slice(0,10),seed=`${userId}:${date}:${day}:${index}`;let hash=2166136261;for(let i=0;i<seed.length;i++){hash^=seed.charCodeAt(i);hash=Math.imul(hash,16777619)}return(hash>>>0)%length}
async function replaceLatestPlan(DB,userId,product,plan){const row=await DB.prepare(`SELECT id FROM shift_plans WHERE user_id=? AND plan_type=? AND status='active' ORDER BY id DESC LIMIT 1`).bind(userId,product).first();if(row?.id)await DB.prepare(`UPDATE shift_plans SET plan_json=? WHERE id=?`).bind(JSON.stringify(plan),row.id).run();}
async function authenticate(request,env,ctx){const response=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user};}
async function readClone(request){try{return await request.clone().json()}catch{return{}}}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const h=new Headers(response.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
