import {authenticateMember} from '../member-state-fast-v1.js';
import {journeyDay} from './journey-records.mjs';
import {known,portionNutrition,recipeNutrition,nutritionSources} from './v7-nutrition.mjs';
const parse=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};
const json=(b,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const fail=(text,status=400)=>{throw Object.assign(Error(text),{status});};
const guard="COALESCE((SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1),0)=1 AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=?),0)<>1";
// Runs after a food write or in the overnight job, never on a screen GET.
// The existing eaten-food table remains the only intake ledger.
export function nutritionSummaryStatement(DB,userId,at){
 const on=journeyDay(at);
 const sum=k=>"(SELECT COALESCE(SUM(CASE WHEN json_type(body_json,'$."+k+"') IN ('integer','real') THEN json_extract(body_json,'$."+k+"') ELSE 0 END),0) FROM member_food_entries WHERE user_id="+Number(userId)+" AND recorded_on='"+on+"')";
 const unknown=k=>"(SELECT COUNT(*) FROM member_food_entries WHERE user_id="+Number(userId)+" AND recorded_on='"+on+"' AND COALESCE(json_type(body_json,'$."+k+"'),'null') NOT IN ('integer','real'))";
 return DB.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.v7NutritionDay',json_object('on',?,'proteinG',"+sum('proteinG')+",'kcal',"+sum('kcal')+",'unknownProtein',"+unknown('proteinG')+",'unknownCalories',"+unknown('kcal')+")),updated_at=? WHERE user_id=? AND "+guard).bind(on,at,userId,userId,userId);
}
export async function updateNutritionSummary(DB,userId,at=new Date().toISOString()){
 await nutritionSummaryStatement(DB,userId,at).run();
}
export async function v7FoodRoutes(request,env,helpers={}){
 const u=new URL(request.url),path=u.pathname;
 if(!['/v1/grub/food-search','/v1/grub/barcode','/v1/grub/eaten'].includes(path))return null;
 // Legacy GETs and the old food form retain their existing handler and response.
 if(path.endsWith('/eaten')&&request.method!=='PATCH'&&request.method!=='POST')return null;
 if(!['POST','PATCH'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.headers.get('Origin')!==u.origin)return json({error:'Use this page to record food.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON is required'},415);
 const raw=await request.clone().text();if(raw.length>16000)return json({error:'Request is too large'},413);
 let input;try{input=JSON.parse(raw)}catch{return json({error:'Invalid request'},400);}
 if(path.endsWith('/eaten')&&input.v7!==true)return null;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 if(String(input.expectedAccount)!==String(auth.userId))return json({error:'Your account changed. Reload before saving.'},409);
 try{
  if(path.endsWith('/food-search')){
   const query=String(input.query||'').trim();if(query.length<2||query.length>100)fail('Enter at least two letters to search.');
   const normal=query.replace(/yoghurt/ig,'yogurt'),escape=q=>'%'+q.replace(/[\\%_]/g,'\\$&')+'%';
   const rows=(await env.DB.prepare("SELECT body_json FROM member_food_catalogue WHERE source='cofid' AND (name LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\') ORDER BY name LIMIT 24").bind(escape(query),escape(normal)).all()).results||[];
   return json({foods:rows.map(r=>parse(r.body_json)),source:nutritionSources.cofid.name});
  }
  if(path.endsWith('/barcode'))return barcode(env.DB,input,helpers.fetch||fetch);
  const consent=await env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(auth.userId).first();
  const prefs=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first())?.preferences);
  if(Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)fail('Optional health tracking is off or paused.',409);
  if(!/^[-a-zA-Z0-9]{16,80}$/.test(input.operationId||''))fail('Reload before saving.');
  if(!['breakfast','lunch','dinner','snacks'].includes(input.meal))fail('Choose the meal you ate.');
  const at=new Date().toISOString(),on=input.on;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(on||'')||on>journeyDay(at)||Number.isNaN(Date.parse(on+'T12:00:00Z'))||new Date(on+'T12:00:00Z').toISOString().slice(0,10)!==on)fail('Choose a valid date up to today.');
  const grams=input.amount;
  let entry,existing;
  if(request.method==='PATCH'){
   existing=await env.DB.prepare('SELECT body_json FROM member_food_entries WHERE id=? AND user_id=?').bind(input.id,auth.userId).first();
   if(!existing)fail('This food record is unavailable.',404);
   const old=parse(existing.body_json);if(input.revision!==(old.revision||0))fail('This food record changed. Reopen it before editing.',409);let n;if(old.nutritionFood)n=portionNutrition(old.nutritionFood,grams);else if(old.nutritionBase){if(!known(input.servings)||input.servings<=0||input.servings>8)fail('Choose how many servings you ate.');n={...old.nutritionBase,...Object.fromEntries(['kcal','proteinG','carbohydrateG','sugarsG','fatG','saturatesG','fibreG','saltG'].map(k=>[k,known(old.nutritionBase[k])?old.nutritionBase[k]*input.servings:null]))};}else fail('Edit this original record through your saved records.',409);entry={...old,...n,...(old.nutritionBase?{servings:input.servings}:{}),on,meal:input.meal,revision:(old.revision||0)+1};
  }else{
   const duplicate=await env.DB.prepare('SELECT user_id,body_json FROM member_food_entries WHERE id=?').bind(input.operationId).first();
   if(duplicate){if(duplicate.user_id!==auth.userId)fail('That request could not be confirmed.',409);const old=parse(duplicate.body_json);if(old.intent!==JSON.stringify([input.catalogueId||input.recipeId,on,input.meal,input.amount,input.servings,input.offPlan===true]))fail('That request changed. Start a new food record.',409);return json({ok:true,id:input.operationId,entry:old,duplicate:true,nutritionDay:prefs.v7NutritionDay});}
   let nutrition,food;
   if(input.recipeId){
    const recipe=await helpers.recipeById?.(env.DB,input.recipeId,prefs);nutrition=recipeNutrition(recipe);
    if(!nutrition)fail('This meal has no confirmed nutrition source.',409);
    if(!known(input.servings)||input.servings<=0||input.servings>8)fail('Choose how many servings you ate.');
    nutrition={...nutrition,nutritionBase:structuredClone(nutrition),servings:input.servings,...Object.fromEntries(['kcal','proteinG','carbohydrateG','sugarsG','fatG','saturatesG','fibreG','saltG'].map(k=>[k,known(nutrition[k])?nutrition[k]*input.servings:null]))};
    food=recipe.name;
   }else{
    const row=await env.DB.prepare('SELECT body_json FROM member_food_catalogue WHERE id=?').bind(input.catalogueId).first(),record=parse(row?.body_json);
    if(!row)fail('Choose a food from the database.',409);
    nutrition=portionNutrition(record,grams);food=record.name;
    nutrition.nutritionFood=record;
   }
   entry={...nutrition,food,on,meal:input.meal,offPlan:input.offPlan===true,operationId:input.operationId,revision:0,
    intent:JSON.stringify([input.catalogueId||input.recipeId,on,input.meal,input.amount,input.servings,input.offPlan===true])};
  }
  // No pile action, award, feedback or milestone can be written by this route.
  await env.DB.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').bind(auth.userId).run();
  const serialized=JSON.stringify(entry);
  const mutation=request.method==='PATCH'?
   env.DB.prepare('UPDATE member_food_entries SET recorded_on=?,body_json=? WHERE id=? AND user_id=? AND body_json=? AND '+guard).bind(on,serialized,input.id,auth.userId,existing.body_json,auth.userId,auth.userId):
   env.DB.prepare('INSERT OR IGNORE INTO member_food_entries(id,user_id,recorded_on,body_json,created_at) SELECT ?,?,?,?,? WHERE '+guard).bind(input.operationId,auth.userId,on,serialized,at,auth.userId,auth.userId);
  const results=await env.DB.batch([mutation,nutritionSummaryStatement(env.DB,auth.userId,at)]);
  if(results[0].meta.changes!==1){
   if(request.method==='POST'){const winner=await env.DB.prepare('SELECT body_json FROM member_food_entries WHERE id=? AND user_id=?').bind(input.operationId,auth.userId).first();if(winner?.body_json===serialized){const saved=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first())?.preferences);return json({ok:true,id:input.operationId,entry,duplicate:true,nutritionDay:saved.v7NutritionDay});}}
   fail('Your record changed, or optional tracking is off. Reload before trying again.',409);
  }
  const next=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first())?.preferences);
  return json({ok:true,id:input.id||input.operationId,entry,nutritionDay:next.v7NutritionDay},request.method==='POST'?201:200);
 }catch(e){return json({error:e.status?e.message:'Your food record could not be confirmed. Reload before retrying.'},e.status||503);}
}
async function barcode(DB,input,fetcher){
 const code=String(input.barcode||'');if(!/^(?:\d{8}|\d{12,14})$/.test(code))fail('Enter a valid barcode.');
 const id='off:'+code,old=await DB.prepare('SELECT body_json,updated_at FROM member_food_catalogue WHERE id=?').bind(id).first();
 if(old&&Date.now()-Date.parse(old.updated_at)<86400000)return json({food:parse(old.body_json),cached:true});
 // A shared DB counter enforces the provider's 15 product reads/minute limit
 // across workers. No member identifier, photo, meal or health data leaves here.
 const minute=new Date().toISOString().slice(0,16);
 const quota=await DB.prepare("INSERT INTO member_food_provider_quota(provider,minute,requests) VALUES('off',?,1) ON CONFLICT(provider) DO UPDATE SET requests=CASE WHEN minute=excluded.minute THEN requests+1 ELSE 1 END,minute=excluded.minute RETURNING requests").bind(minute).first();
 if(quota.requests>15)fail('Barcode lookup is busy. Search for the food or try again in a minute.',429);
 const response=await fetcher('https://world.openfoodfacts.org/api/v3.6/product/'+code+'.json?fields=code,product_name,nutriments,last_modified_t,categories_tags',{headers:{'User-Agent':'MyTimber/7 (https://shiftsometimber.co.uk)'},signal:AbortSignal.timeout(8000)});
 if(!response.ok)fail('That barcode could not be checked. Search for the food instead.',503);
 const payload=await response.json(),p=payload.product,n=p?.nutriments;
 if(!p?.product_name||!n)fail('No nutrition record was found for that barcode.',404);
 const fields={kcal:'energy-kcal_100g',proteinG:'proteins_100g',carbohydrateG:'carbohydrates_100g',sugarsG:'sugars_100g',fatG:'fat_100g',saturatesG:'saturated-fat_100g',fibreG:'fiber_100g',saltG:'salt_100g'};
 const food={id,name:p.product_name,kind:p.categories_tags?.includes('en:beverages')?'drink':'food',per100:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,known(n[v])?n[v]:null])),source:{...nutritionSources.off,recordId:code,version:String(p.last_modified_t||'unversioned'),url:'https://world.openfoodfacts.org/product/'+code},estimate:true};
 await DB.prepare("INSERT INTO member_food_catalogue(id,name,source,body_json,updated_at) VALUES(?,?,'off',?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,body_json=excluded.body_json,updated_at=excluded.updated_at").bind(id,food.name,JSON.stringify(food),new Date().toISOString()).run();
 return json({food,cached:false});
}
