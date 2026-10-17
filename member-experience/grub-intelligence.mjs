import {filterRecipe} from './grub-search.mjs';
import {discoverable,discoveryRank,discoveryTier} from './grub-discovery.mjs';

export const grubModes=['lighter','fuller','protein','quicker','budget'];
export const grubEfforts=['no-cook','five','cook'];
export function noCookingMeal(r){
 return r.cook_minutes===0&&Array.isArray(r.method)&&r.method.length>0
  &&!r.method.some(step=>/hot pan|\bwarm\b|\btoast\b|\bfry\b|\bboil\b|\bbake\b|\bheat\b|\bmicrowave\b|\bgrill\b/i.test(step));
}
export function effortAllows(r,effort){
 return effort==='no-cook'?noCookingMeal(r):effort==='five'?Number.isFinite(r.minutes)&&r.minutes>0&&r.minutes<=5:true;
}

const number=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
const fibre=r=>number(r?.nutrition?.fibre_g)?Number(r.nutrition.fibre_g):null;
const mainMeal=r=>['lunch','dinner'].includes(r.meal_type);
const round=n=>Math.round(n*10)/10;
// These published meals use ready-to-eat fillings and cold assembly. A short
// advertised time alone is insufficient: some catalogue wraps still need a pan.
const everydayIds=['chicken-wholemeal-wrap','tuna-wholemeal-wrap','bean-wholemeal-wrap','chicken-pitta','tuna-pitta','bean-pitta'].map(id=>'industrial-lunch-'+id);
everydayIds.unshift('everyday-chicken-salad','everyday-ham-sandwich','everyday-tuna-sandwich','everyday-chicken-salad-sandwich','everyday-ham-salad');
export function everydayMeal(r){
 return everydayIds.includes(r.id)&&r.meal_type==='lunch'&&r.minutes>0&&r.minutes<=10&&r.cook_minutes===0
  &&r.ingredients?.length>=2&&r.ingredients.length<=5&&r.method?.length>0
  &&!r.method.some(step=>/hot pan|\bwarm\b|\btoast\b|\bfry\b|\bboil\b|\bbake\b/i.test(step));
}
const everydayOrder=r=>{const i=everydayIds.indexOf(r.id);return i<0?Infinity:i};
const everydayCookedIds=['everyday-beans-on-toast','everyday-scrambled-eggs-on-toast','industrial-dinner-chicken-traybake','industrial-lunch-tuna-jacket-potato','industrial-lunch-bean-jacket-potato','industrial-lunch-chicken-jacket-potato','industrial-lunch-salmon-toastie'];
export function everydayCookedMeal(r){return everydayCookedIds.includes(r.id)&&r.ingredients?.length<=5&&r.method?.length>=2&&r.minutes>0&&r.minutes<=90&&r.cook_minutes>0}


export function recipeExcluded(r,text=''){
 return String(text).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).some(x=>{
  const terms=x==='fish'?['fish','salmon','tuna','cod','haddock','anchovy','mackerel','sardine']:x==='nuts'?['nut','almond','cashew','pecan','pistachio']:[x];
  return terms.some(t=>r.ingredients.some(i=>i.item.toLowerCase().includes(t))||r.allergens.some(a=>a.toLowerCase().includes(t)));
 });
}
export function grubMemberContext(prefs={},today=new Date().toISOString().slice(0,10)){
 const food=prefs.food||{};
 return {exclusions:Array.isArray(food.dislikes)?food.dislikes.join(','):String(food.dislikes||''),maxMinutes:Number(food.maxMinutes)||null,
  dietaryReviewRequired:Array.isArray(food.dietaryRequirements)&&food.dietaryRequirements.length>0,
  fitCompleted:Object.values(prefs.fitJourney?.entries||{}).some(x=>x.recordedOn===today&&x.status==='done')};
}
function eligible(r,state,context,allowSavedOnly=false){
 return (allowSavedOnly||discoverable(r))&&effortAllows(r,state.options?.effort)&&!context.dietaryReviewRequired&&!recipeExcluded(r,[state.options?.exclude,context.exclusions].filter(Boolean).join(','))
  &&!(state.learning?.nay||[]).includes(r.id)
  &&(state.options?.style!=='vegetarian'||filterRecipe(r,'vegetarian'))
  &&(!context.maxMinutes||number(r.minutes)&&r.minutes<=context.maxMinutes);
}
export function repeatMeals(state,recipes,context={}){
 const ids=[...new Set([...(state.learning?.yay||[]).slice().reverse(),...(state.saved||[]).slice().reverse()])];
 return ids.map(id=>recipes.find(r=>r.id===id)).filter(r=>r&&mainMeal(r)&&eligible(r,state,context,true)).slice(0,4);
}
function score(r,state,context){
 const preference={protein:'high protein',budget:'budget',fast:'fast',vegetarian:'vegetarian'}[state.options?.style];
 return ((state.learning?.yay||[]).includes(r.id)||state.saved?.includes(r.id)?100:0)
  +(!(state.learning?.recent||[]).includes(r.id)?40:0)
  +(preference&&filterRecipe(r,preference)?20:0)+(context.fitCompleted&&r.protein_g>=25?10:0)
  +(everydayMeal(r)?60:0)+(state.options?.effort==='cook'&&everydayCookedMeal(r)?(r.id.startsWith('everyday-')?120:90):0)+(r.id==='industrial-dinner-chicken-traybake'?5:0);
}
export function recommendationFor(state,recipes,context={}){
 const pool=recipes.filter(r=>mainMeal(r)&&eligible(r,state,context));
 const stored=pool.find(r=>r.id===state.recommendation?.recipeId);
 const recipe=stored||[...pool].sort((a,b)=>score(b,state,context)-score(a,state,context)||discoveryTier(a)-discoveryTier(b)||discoveryRank(a)-discoveryRank(b)||everydayOrder(a)-everydayOrder(b)||a.id.localeCompare(b.id))[0];
 if(!recipe)return {recipe:null,message:context.dietaryReviewRequired?'Your saved dietary requirements need checking before we suggest a meal. Use your agreed food plan and check recipes and labels.':state.options?.effort==='five'?'No reviewed meal fits 5 minutes and your saved choices right now. Try No cooking or Happy to cook. Your saved meals stay as they are.':state.options?.effort==='no-cook'?'No reviewed meal fits No cooking and your saved choices right now. Try Happy to cook. Your saved meals stay as they are.':'No reviewed meal matches your saved choices right now. Your recipe library and saved plan are still available in My Timber.'};
 const base=pool.find(r=>r.id===state.recommendation?.baseId)||recipe;
 const selected=state.recommendation?.mode||'planned';
 const reasons=[];
 if(everydayMeal(recipe))reasons.push(recipe.ingredients.length+' ingredients, ready-to-eat filling and no cooking.');
 if(state.saved?.includes(recipe.id)||(state.learning?.yay||[]).includes(recipe.id))reasons.push('You previously saved or liked this recipe.');
 if(state.options?.exclude||context.exclusions)reasons.push('Its listed ingredients avoid your saved exclusions.');
 if(state.options?.style==='vegetarian')reasons.push('It matches your vegetarian meal setting.');
 if(context.maxMinutes)reasons.push('It fits your saved '+context.maxMinutes+'-minute cooking limit.');
 const preference={protein:'high protein',budget:'budget',fast:'fast'}[state.options?.style];
 if(preference&&filterRecipe(recipe,preference))reasons.push('It matches your '+({protein:'higher-protein',budget:'budget',fast:'quick-meal'}[state.options.style])+' preference.');
 if(!(state.learning?.recent||[]).includes(recipe.id))reasons.push('It is outside your recently selected meals.');
 const delta=recipe.id===base.id?'Your current recommendation.':`${round(recipe.kcal-base.kcal)>0?'+':''}${round(recipe.kcal-base.kcal)} kcal · ${round(recipe.protein_g-base.protein_g)>0?'+':''}${round(recipe.protein_g-base.protein_g)}g protein · ${round(recipe.minutes-base.minutes)>0?'+':''}${round(recipe.minutes-base.minutes)} min compared with your previous pick.`;
 return {recipe,baseId:base.id,mode:selected,reasons,delta,servings:state.options?.servings||1,
  benefit:`${recipe.protein_g}g protein per serving${fibre(recipe)!==null?' and '+fibre(recipe)+'g fibre':''}. Meal portions and your overall eating pattern matter for weight management.`,
  fit:context.fitCompleted?'You logged movement in Fit today. A protein-containing meal can be part of recovery; no exercise calories have been deducted.':'Fit and Grub support the same routine: manageable movement and meals you can repeat. No guessed exercise calories are deducted.',
  learned:{yay:state.learning?.yay?.length||0,nay:state.learning?.nay?.length||0},message:state.recommendation?.message||''};
}
export function adjustRecommendation(state,mode,recipes,context={}){
 if(!grubModes.includes(mode))throw Error('Choose one of the meal adjustments shown.');
 const current=recommendationFor(state,recipes,context);if(!current.recipe)throw Error(current.message);
 // Adjust the meal the member can see. An old baseline can falsely claim
 // improvement or select the same meal again. Images are optional presentation.
 const base=current.recipe;
 let pool=recipes.filter(r=>mainMeal(r)&&eligible(r,state,context)&&r.id!==base.id);
 const checks={lighter:r=>number(base.kcal)&&number(r.kcal)&&r.kcal<base.kcal,protein:r=>number(base.protein_g)&&number(r.protein_g)&&r.protein_g>base.protein_g,fuller:r=>fibre(r)!==null&&fibre(base)!==null&&fibre(r)>fibre(base),quicker:r=>number(base.minutes)&&number(r.minutes)&&r.minutes<base.minutes,budget:r=>filterRecipe(r,'budget')};
 pool=pool.filter(checks[mode]);
 pool.sort((a,b)=>mode==='lighter'?a.kcal-b.kcal:mode==='protein'?b.protein_g-a.protein_g:mode==='fuller'?fibre(b)-fibre(a):mode==='quicker'?a.minutes-b.minutes:score(b,state,context)-score(a,state,context));
 if(!pool.length)return {...state.recommendation,recipeId:base.id,baseId:base.id,message:'No '+({lighter:'lower-calorie',protein:'higher-protein',fuller:'higher-fibre',quicker:'quicker',budget:'different budget'}[mode])+' reviewed alternative fits your saved choices. Your meal is unchanged.'};
 return {recipeId:pool[0].id,baseId:base.id,mode,message:mode==='budget'?'A catalogue budget choice. Retailer prices vary; no cash saving is promised.':mode==='fuller'?'Chosen for more fibre. Protein and energy can change too; compare the figures below.':''};
}
// A different suggestion is not a permanent dislike. Keep explicit Nay feedback separate.
export function nextRecommendation(state,recipes,context={}){
 const current=recommendationFor(state,recipes,context);
 if(!current.recipe)throw Error(current.message);
 const base=current.recipe,content=r=>JSON.stringify([r.ingredients,r.method]);
 let pool=recipes.filter(r=>mainMeal(r)&&eligible(r,state,context)&&r.id!==base.id&&content(r)!==content(base));
 if(!pool.length)return {recipeId:base.id,baseId:base.id,mode:'planned',message:'No different reviewed meal fits your saved choices. Your meal is unchanged.'};
 const practical=pool.filter(r=>everydayMeal(r)||(state.options?.effort==='cook'&&everydayCookedMeal(r)));if(practical.length)pool=practical;
 const recent=new Set([...(state.learning?.recent||[]),base.id]);
 const fresh=pool.filter(r=>!recent.has(r.id));if(fresh.length)pool=fresh;
 const protein=r=>r.id.match(/^(?:industrial-(?:lunch|dinner)|everyday)-(chicken|tuna|bean|ham)/)?.[1];
 const different=pool.filter(r=>protein(r)&&protein(r)!==protein(base));if(protein(base)&&different.length)pool=different;
 pool.sort((a,b)=>score(b,state,context)-score(a,state,context)||everydayOrder(a)-everydayOrder(b)||(a.minutes??Infinity)-(b.minutes??Infinity)||a.id.localeCompare(b.id));
 return {recipeId:pool[0].id,baseId:base.id,mode:'planned',message:''};
}
export function nutritionForWeek(state,recipes){
 const lookup=new Map(recipes.map(r=>[r.id,r])),days=[];
 for(const day of [...new Set(state.week.map(x=>x.day))]){
  const meals=state.week.filter(x=>x.day===day).map(x=>lookup.get(x.recipeId));
  const sum=get=>meals.every(r=>r&&number(get(r)))?round(meals.reduce((n,r)=>n+Number(get(r)),0)):null;
  days.push({day,meals:meals.length,kcal:sum(r=>r.kcal),protein:sum(r=>r.protein_g),fibre:sum(fibre)});
 }
 const totals=Object.fromEntries(['kcal','protein','fibre'].map(k=>[k,days.length&&days.every(d=>number(d[k]))?round(days.reduce((n,d)=>n+d[k],0)):null]));
 return {days,totals};
}
