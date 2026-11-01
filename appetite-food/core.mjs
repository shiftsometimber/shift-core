import {effortAllows,recipeExcluded} from '../member-experience/grub-intelligence.mjs';
import {filterRecipe} from '../member-experience/grub-search.mjs';
export const emptyFoodDay=()=>({revision:0,appetite:null,options:{effort:'five',style:'any'},entries:[],feedback:[],operations:[]});
export class FoodDayError extends Error{}
const fail=message=>{throw new FoodDayError(message)};
const known=['low','usual','more','struggling'];
export function suggestFood(state,recipes,context={}){
 if(!known.includes(state.appetite))return {recipe:null,reason:'Tell us how your appetite feels today.'};
 if(state.appetite==='struggling')return {recipe:null,support:true,reason:'If eating or drinking is difficult, contact your own prescriber or clinical team. This food picker cannot assess symptoms. If you feel seriously unwell, seek urgent medical help.'};
 if(context.dietaryReviewRequired)return {recipe:null,reason:'Your dietary requirements need checking before this picker can suggest a meal. Use your agreed food plan and check recipes and labels.'};
 const excluded=state.feedback.filter(x=>x.outcome==='not-for-me').map(x=>x.recipeId);
 let pool=recipes.filter(r=>r.source==='published_catalogue'&&r.discovery?.eligible!==false&&r.ingredients?.length&&r.method?.length&&effortAllows(r,state.options.effort)&&(!context.maxMinutes||typeof r.minutes==='number'&&r.minutes<=context.maxMinutes)&&!recipeExcluded(r,context.exclusions||'')&&!excluded.includes(r.id)&&(state.options.style!=='vegetarian'||filterRecipe(r,'vegetarian')));
 if(!pool.length)return {recipe:null,reason:'No reviewed meal fits these choices. Change the cooking time or use your existing food plan. Your exclusions have not been relaxed.'};
 const recent=new Set(state.entries.slice(-3).map(e=>e.recipeId));
 const liked=new Set(state.feedback.filter(x=>x.outcome==='helped').map(x=>x.recipeId));
 const score=r=>-(state.viewed||[]).includes(r.id)*50+(liked.has(r.id)?12:0)-(recent.has(r.id)?25:0)+(state.appetite==='low'?Math.max(0,8-r.ingredients.length)*3:0)+(state.options.style==='budget'&&filterRecipe(r,'budget')?8:0);
 pool.sort((a,b)=>score(b)-score(a)||(a.discovery?.rank??1000)-(b.discovery?.rank??1000)||a.id.localeCompare(b.id));
 const recipe=pool.find(r=>r.id===state.currentRecipeId)||pool[0],reasons=[];
 if(state.appetite==='low')reasons.push('A short ingredient list keeps the preparation manageable. Low appetite has not been treated as a calorie target.');
 else reasons.push('Chosen from the reviewed recipe library to fit your preparation choice.');
 if(liked.has(recipe.id))reasons.push('You recorded that this meal helped.');
 if(state.options.style==='budget'&&filterRecipe(recipe,'budget'))reasons.push('A catalogue budget choice; shop prices vary.');
 return {recipe,reason:reasons.join(' ')};
}
export function recordFoodDay(state,input,recipes,context={}){
 if(!input||Object.keys(input).some(k=>!['action','revision','operationId','value','effort','style','recipeId','entryId','portion','outcome'].includes(k)))fail('Unsupported food action.');
 if(!/^[a-zA-Z0-9-]{8,80}$/.test(input.operationId||''))fail('A unique action reference is required.');
 const stamp=JSON.stringify({...input,revision:undefined});
 const prior=state.operations.find(x=>x.id===input.operationId);
 if(prior){if(prior.stamp!==stamp)fail('This action reference has already been used.');return state;}
 if(input.revision!==state.revision)fail('Your food day changed. Reload before saving.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(context.day||''))fail('A valid local day is required.');
 const next=structuredClone(state),recipe=()=>recipes.find(r=>r.id===input.recipeId&&r.source==='published_catalogue'&&r.discovery?.eligible!==false);
 if(input.action==='appetite'){if(!known.includes(input.value))fail('Choose an appetite option.');next.appetite=input.value;next.currentRecipeId=null;}
 else if(input.action==='options'){if(!['no-cook','five','cook'].includes(input.effort)||!['any','vegetarian','budget'].includes(input.style))fail('Choose the preparation and food options shown.');next.options={effort:input.effort,style:input.style};next.currentRecipeId=null;}
 else if(input.action==='plan'){
  const current=suggestFood(state,recipes,context);if(!current.recipe||current.recipe.id!==input.recipeId||!recipe())fail('Choose the current reviewed meal first.');
  next.entries.push({id:input.operationId,recipeId:input.recipeId,recipeName:current.recipe.name,day:context.day,status:'planned'});
  next.currentRecipeId=input.recipeId;
 }else if(input.action==='another'){
  const current=suggestFood(state,recipes,context);if(!current.recipe||current.recipe.id!==input.recipeId)fail('Choose the current food idea.');next.currentRecipeId=null;next.viewed=[...(state.viewed||[]),input.recipeId].slice(-20);
 }else if(input.action==='eat'){
  const entry=next.entries.find(e=>e.id===input.entryId&&e.day===context.day);if(!entry||entry.status!=='planned')fail('Choose an unlogged planned meal.');
  if(![0.5,1,1.5,2].includes(input.portion))fail('Choose the amount actually eaten.');const original=recipes.find(r=>r.id===entry.recipeId);entry.status='eaten';entry.portion=input.portion;entry.proteinPerServing=typeof original?.protein_g==='number'&&Number.isFinite(original.protein_g)?original.protein_g:null;
 }else if(input.action==='feedback'){
  if(!['helped','not-for-me','tried-no-help','not-done'].includes(input.outcome)||!recipe())fail('Choose one of the feedback options shown.');
  if(!state.entries.some(e=>e.recipeId===input.recipeId&&e.day===context.day))fail('Choose this meal before giving feedback.');
  if(input.outcome==='not-done'&&state.entries.some(e=>e.recipeId===input.recipeId&&e.day===context.day&&e.status==='eaten'))fail('This meal is already logged as eaten. Choose feedback that matches what happened.');
  next.feedback.push({recipeId:input.recipeId,day:context.day,outcome:input.outcome,attempted:input.outcome==='not-done'?false:input.outcome==='not-for-me'?null:true});
 }else fail('Unknown food action.');
 next.revision++;next.operations.push({id:input.operationId,stamp});return next;
}
export function loggedProtein(state,recipes,day){
 const eaten=state.entries.filter(e=>e.day===day&&e.status==='eaten');
 if(!eaten.length)return {grams:null,meals:0,complete:false};
 const values=eaten.map(e=>typeof e.proteinPerServing==='number'&&Number.isFinite(e.proteinPerServing)?e.proteinPerServing*e.portion:null);
 return {grams:values.includes(null)?null:Math.round(values.reduce((a,b)=>a+b,0)*10)/10,meals:eaten.length,complete:!values.includes(null)};
}
