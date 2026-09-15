import {filterRecipe} from './grub-search.mjs';

export const grubModes=['lighter','fuller','protein','quicker','budget'];
const number=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
const fibre=r=>number(r?.nutrition?.fibre_g)?Number(r.nutrition.fibre_g):null;
const mainMeal=r=>['lunch','dinner'].includes(r.meal_type);
const round=n=>Math.round(n*10)/10;
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
function eligible(r,state,context){
 return !context.dietaryReviewRequired&&!recipeExcluded(r,[state.options?.exclude,context.exclusions].filter(Boolean).join(','))
  &&!(state.learning?.nay||[]).includes(r.id)
  &&(state.options?.style!=='vegetarian'||filterRecipe(r,'vegetarian'))
  &&(!context.maxMinutes||number(r.minutes)&&r.minutes<=context.maxMinutes);
}
function score(r,state,context){
 const preference={protein:'high protein',budget:'budget',fast:'fast',vegetarian:'vegetarian'}[state.options?.style];
 return ((state.learning?.yay||[]).includes(r.id)||state.saved?.includes(r.id)?100:0)
  +(!(state.learning?.recent||[]).includes(r.id)?40:0)
  +(preference&&filterRecipe(r,preference)?20:0)+(context.fitCompleted&&r.protein_g>=25?10:0)
  +(r.id==='industrial-dinner-chicken-traybake'?5:0);
}
export function recommendationFor(state,recipes,context={}){
 const pool=recipes.filter(r=>r.image&&mainMeal(r)&&eligible(r,state,context));
 const stored=pool.find(r=>r.id===state.recommendation?.recipeId);
 const recipe=stored||[...pool].sort((a,b)=>score(b,state,context)-score(a,state,context)||a.id.localeCompare(b.id))[0];
 if(!recipe)return {recipe:null,message:context.dietaryReviewRequired?'Your saved dietary requirements need checking before we suggest a meal. Use your agreed food plan and check recipes and labels.':'No illustrated meal matches your saved choices right now. Your full recipe library and saved plan are still available.'};
 const base=pool.find(r=>r.id===state.recommendation?.baseId)||recipe;
 const selected=state.recommendation?.mode||'planned';
 const reasons=[];
 if(state.saved?.includes(recipe.id)||(state.learning?.yay||[]).includes(recipe.id))reasons.push('You previously saved or liked this recipe.');
 if(state.options?.exclude||context.exclusions)reasons.push('Its listed ingredients avoid your saved exclusions.');
 if(state.options?.style==='vegetarian')reasons.push('It matches your vegetarian meal setting.');
 if(context.maxMinutes)reasons.push('It fits your saved '+context.maxMinutes+'-minute cooking limit.');
 const preference={protein:'high protein',budget:'budget',fast:'fast'}[state.options?.style];
 if(preference&&filterRecipe(recipe,preference))reasons.push('It matches your '+({protein:'higher-protein',budget:'budget',fast:'quick-meal'}[state.options.style])+' preference.');
 if(!(state.learning?.recent||[]).includes(recipe.id))reasons.push('It is outside your recently selected meals.');
 const delta=recipe.id===base.id?'Original recommendation.':`${round(recipe.kcal-base.kcal)>0?'+':''}${round(recipe.kcal-base.kcal)} kcal · ${round(recipe.protein_g-base.protein_g)>0?'+':''}${round(recipe.protein_g-base.protein_g)}g protein · ${round(recipe.minutes-base.minutes)>0?'+':''}${round(recipe.minutes-base.minutes)} min compared with your original pick.`;
 return {recipe,baseId:base.id,mode:selected,reasons,delta,servings:state.options?.servings||1,
  benefit:`${recipe.protein_g}g protein per serving${fibre(recipe)!==null?' and '+fibre(recipe)+'g fibre':''}. Meal portions and your overall eating pattern matter for weight management.`,
  fit:context.fitCompleted?'You logged movement in Fit today. A protein-containing meal can be part of recovery; no exercise calories have been deducted.':'Fit and Grub support the same routine: manageable movement and meals you can repeat. No guessed exercise calories are deducted.',
  learned:{yay:state.learning?.yay?.length||0,nay:state.learning?.nay?.length||0},message:state.recommendation?.message||''};
}
export function adjustRecommendation(state,mode,recipes,context={}){
 if(!grubModes.includes(mode))throw Error('Choose one of the meal adjustments shown.');
 const current=recommendationFor(state,recipes,context);if(!current.recipe)throw Error(current.message);
 const base=recipes.find(r=>r.id===current.baseId)||current.recipe;
 let pool=recipes.filter(r=>r.image&&mainMeal(r)&&eligible(r,state,context)&&r.id!==base.id);
 const checks={lighter:r=>number(r.kcal)&&r.kcal<base.kcal,protein:r=>number(r.protein_g)&&r.protein_g>base.protein_g,fuller:r=>fibre(r)!==null&&fibre(base)!==null&&fibre(r)>fibre(base),quicker:r=>number(r.minutes)&&r.minutes<base.minutes,budget:r=>filterRecipe(r,'budget')};
 pool=pool.filter(checks[mode]);
 pool.sort((a,b)=>mode==='lighter'?a.kcal-b.kcal:mode==='protein'?b.protein_g-a.protein_g:mode==='fuller'?fibre(b)-fibre(a):mode==='quicker'?a.minutes-b.minutes:score(b,state,context)-score(a,state,context));
 if(!pool.length)return {...state.recommendation,recipeId:current.recipe.id,baseId:base.id,message:'No '+({lighter:'lower-calorie',protein:'higher-protein',fuller:'higher-fibre',quicker:'quicker',budget:'different budget'}[mode])+' illustrated alternative fits your saved choices. Your meal is unchanged.'};
 return {recipeId:pool[0].id,baseId:base.id,mode,message:mode==='budget'?'A catalogue budget choice. Retailer prices vary; no cash saving is promised.':mode==='fuller'?'Chosen for more fibre. Protein and energy can change too; compare the figures below.':''};
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
