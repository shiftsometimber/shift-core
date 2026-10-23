import {ingredientOptions} from './grub-ingredients.mjs';
import {discoverable} from './grub-discovery.mjs';
import {memberRecipe,filterRecipe} from './grub-search.mjs';
import {recommendationFor,adjustRecommendation,nextRecommendation,nutritionForWeek,grubEfforts,repeatMeals} from './grub-intelligence.mjs';
import {automaticPlanIssue} from './grub-plan-quality.mjs';

export const emptyGrub=()=>({revision:0,saved:[],week:[],shopping:[],options:{days:7,style:'protein',servings:1,exclude:''},operations:[]});
export class GrubError extends Error{constructor(message,status=400){super(message);this.status=status}}
const fail=m=>{throw new GrubError(m)};
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const slots=['breakfast','lunch','dinner'];
const styles={protein:'high protein',budget:'budget',fast:'fast',vegetarian:'vegetarian'};
export function usableCatalogue(records){return records.map(r=>memberRecipe(r)).filter(Boolean)}
export function planOptions(input){
 const o={days:input.days,style:input.style,servings:input.servings,exclude:String(input.exclude||'').trim()};
 if(![3,5,7].includes(o.days)||!Object.hasOwn(styles,o.style)||!integer(o.servings,1,8)||o.exclude.length>200)fail('Choose the days, meal style and 1–8 servings.');
 if(o.exclude&&!/^[a-z ,'-]+$/i.test(o.exclude))fail('List ingredients to leave out, separated by commas.');
 if(/allerg|coeliac|celiac|free|without|\bno\b/i.test(o.exclude))fail('Enter ingredient names only, such as fish, mushrooms. This planner cannot check allergies.');
 return o;
}
const excluded=(r,text)=>text.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).some(x=>{
 const terms=x==='fish'?['fish','salmon','tuna','cod','haddock','anchovy','mackerel','sardine']:x==='nuts'?['nut','almond','cashew','pecan','pistachio']: [x];
 return terms.some(t=>r.ingredients.some(i=>i.item.toLowerCase().includes(t))||r.allergens.some(a=>a.toLowerCase().includes(t))||String(r.allergen_note||'').toLowerCase().includes(t));
});
function candidates(recipes,options,slot,context={}){
 const curated=recipes.some(r=>r.discovery);
 // In the corrected menu, protein/budget are preferences, not nutritional
 // adequacy or retailer-price guarantees. Time and vegetarian choices remain hard.
 const preference=curated&&['protein','budget'].includes(options.style);
 return recipes.filter(r=>discoverable(r)&&(r.meal_type===slot||(slot==='dinner'&&options.style==='fast'&&r.meal_type==='lunch'))&&(preference||filterRecipe(r,styles[options.style]))&&!excluded(r,options.exclude)&&!excluded(r,context.exclusions||'')&&(!context.maxMinutes||Number.isFinite(r.minutes)&&r.minutes>0&&r.minutes<=context.maxMinutes))
  .sort((a,b)=>Number(filterRecipe(b,styles[options.style]))-Number(filterRecipe(a,styles[options.style])));
}
function choose(pool,used,seed){const fresh=pool.filter(r=>!used.has(r.id));const list=fresh.length?fresh:pool;return list[seed%list.length]}
export function mealFamily(recipe){
 const format=String(recipe.food_format||'').toLowerCase(),name=String(recipe.name||'').toLowerCase();
 if(/wrap|sandwich|buttie|toastie|panini|baguette|pitta|bagel/.test(format+' '+name))return 'bread';
 if(/traybake/.test(format+' '+name))return 'traybake';
 if(/slow.cook/.test(format+' '+name))return 'slow-cooker';
 return format||name;
}
function chooseVaried(pool,used,counts,seed,flexibleFamily=false){
 const fresh=pool.filter(r=>!used.has(r.id));let choices=fresh.length?fresh:pool;
 const nonBread=choices.filter(r=>mealFamily(r)!=='bread');
 if((counts.get('bread')||0)>=2&&nonBread.length)choices=nonBread;
 const lowest=Math.min(...choices.map(r=>counts.get(mealFamily(r))||0));
 if(!flexibleFamily)choices=choices.filter(r=>(counts.get(mealFamily(r))||0)===lowest);
 return choices[seed%choices.length];
}
function assertAutomaticChoices(context){
 if(context.dietaryReviewRequired)fail('Your saved dietary requirements need checking before we build or swap meals. Use your agreed food plan and check recipes and labels. Your saved week has not changed.');
}
export function buildWeek(recipes,input,seed=0,learning={},context={}){
 assertAutomaticChoices(context);
 const options=planOptions(input),week=[];let used=new Set(learning.recent||[]),families={breakfast:new Map(),main:new Map()};
 recipes=recipes.filter(r=>discoverable(r)&&!(learning.nay||[]).includes(r.id));
 const pools=Object.fromEntries(slots.map(slot=>{const pool=candidates(recipes,options,slot,context);if(!pool.length)fail('No '+slot+' recipes meet all your choices and saved food settings. Change your choices or choose individual meals. Your saved week has not changed.');return [slot,pool]}));
 for(let day=1;day<=options.days;day++){
  let issue;
  // Try other eligible meal combinations, never larger portions or looser
  // member constraints. Only a checked candidate changes this local plan.
  for(let attempt=0;attempt<64;attempt++){
   const dayUsed=new Set(used),dayFamilies={breakfast:new Map(families.breakfast),main:new Map(families.main)},entries=[];
   for(const [index,slot]of slots.entries()){
    const counts=dayFamilies[slot==='breakfast'?'breakfast':'main'],r=chooseVaried(pools[slot],dayUsed,counts,seed+day*7+index+attempt*(13+index*17),attempt>=32);
    dayUsed.add(r.id);counts.set(mealFamily(r),(counts.get(mealFamily(r))||0)+1);entries.push({key:day+':'+slot,day,slot,recipeId:r.id,servings:options.servings});
   }
   issue=automaticPlanIssue(entries,recipes);if(!issue){week.push(...entries);used=dayUsed;families=dayFamilies;break}
  }
  if(issue)fail(issue);
 }
 return {week,options};
}
const recipeById=(recipes,id)=>recipes.find(r=>r.id===id)||fail('This recipe is no longer available. Choose another recipe.');
const quantity=(amount,factor)=>{
 const text=String(amount).trim(),m=text.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)?$/i);
 if(m)return {number:Number(m[1])*factor,unit:(m[2]||'').toLowerCase()};
 return {text:factor===1?text:text+' × '+Number(factor.toFixed(3))};
};
export function shoppingForWeek(week,recipes,previous=[]){
 const map=new Map();
 for(const entry of week){const r=recipeById(recipes,entry.recipeId),factor=entry.servings/r.servings;
  for(const ingredient of r.ingredients){const q=quantity(ingredient.amount,factor),unit=(ingredient.unit||q.unit||'').toLowerCase(),key=ingredient.item.toLowerCase()+'|'+unit+(q.text?'|'+q.text:'');
   if(!map.has(key))map.set(key,{key:'recipe:'+key,item:ingredient.item,unit,amount:0,parts:[],source:'week',done:false});
   const item=map.get(key);if(q.number!==undefined)item.amount+=q.number;else item.parts.push(q.text);
  }
 }
 const list=[...map.values()].map(i=>{const amount=i.parts.length?(i.parts.length===1?i.parts[0]:i.parts.length+' × ('+i.parts[0]+')'):String(Number(i.amount.toFixed(2)));const text=[amount,i.unit,i.item].filter(Boolean).join(' ');return {key:i.key,text,source:'week',done:previous.some(p=>p.key===i.key&&p.text===text&&p.done)}});
 return [...list,...previous.filter(i=>i.source==='manual')];
}
export function applyGrubOperation(current,input,recipes,context={}){
 const next=structuredClone(current||emptyGrub());
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(input.operationId||''))fail('Request identity is missing. Refresh and try again.');
 if(next.operations.includes(input.operationId))return next;
 if(input.revision!==next.revision)throw new GrubError('Your food list changed in another tab. Reload it before trying again.',409);
 const a=input.action;
 if(a==='choose-today'){
  const r=recipeById(recipes,input.recipeId);if(!/^\d{4}-\d{2}-\d{2}$/.test(context.date||''))fail('Today is unavailable. Reload and try again.');
  next.today={date:context.date,recipeId:r.id,name:r.name,minutes:r.minutes,kcal:r.kcal,protein_g:r.protein_g,chosenAt:context.at};
 }else if(a==='set-effort'){
  if(!grubEfforts.includes(input.effort))fail('Choose one of the effort options shown.');
  if(next.options?.effort!==input.effort){next.options={...next.options,effort:input.effort};next.recommendation=null;}
 }else if(a==='choose-and-shop'||a==='repeat-and-shop'){
  const r=a==='repeat-and-shop'?repeatMeals(next,recipes,context).find(r=>r.id===input.recipeId):recommendationFor(next,recipes,context).recipe;
  if(!r||r.id!==input.recipeId)fail(a==='repeat-and-shop'?'That favourite is no longer available with your saved choices.':'This suggestion changed. Reload before choosing it.');
  if(a==='repeat-and-shop')next.recommendation={recipeId:r.id,baseId:r.id,mode:'planned'};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(context.date||''))fail('Today is unavailable. Reload and try again.');
  if(!integer(input.servings,1,8))fail('Choose 1–8 people eating.');
  next.today={date:context.date,recipeId:r.id,name:r.name,minutes:r.minutes,kcal:r.kcal,protein_g:r.protein_g,servings:input.servings,shopping:true,chosenAt:context.at};
  next.options={...next.options,servings:input.servings};
 }else if(a==='recommendation-next'){
  const before=recommendationFor(next,recipes,context).recipe;
  if(!before||before.id!==input.recipeId)fail('This suggestion changed. Reload before swapping it.');
  try{next.recommendation=nextRecommendation(next,recipes,context)}catch(e){fail(e.message)}
  next.learning={yay:[],nay:[],...next.learning,recent:[...(next.learning?.recent||[]),before.id].slice(-180)};
 }else if(a==='save'){
  recipeById(recipes,input.recipeId);if(typeof input.saved!=='boolean')fail('Choose save or remove.');
  next.saved=next.saved.filter(x=>x!==input.recipeId);if(input.saved){if(next.saved.length>=100)fail('You have 100 saved recipes. Remove one before saving another.');next.saved.push(input.recipeId)}
 }else if(a==='recommendation-adjust'){
  try{next.recommendation=adjustRecommendation(next,input.mode,recipes,context)}catch(e){fail(e.message)}
 }else if(a==='recommendation-feedback'){
  const recommendation=recommendationFor(next,recipes,context);
  if(!recommendation.recipe||recommendation.recipe.id!==input.recipeId||!['yay','nay'].includes(input.sentiment))fail('This recommendation changed. Reload before rating it.');
  const learning=next.learning||{yay:[],nay:[],recent:[]};
  learning.yay=(learning.yay||[]).filter(id=>id!==input.recipeId);learning.nay=(learning.nay||[]).filter(id=>id!==input.recipeId);
  learning[input.sentiment]=[...learning[input.sentiment],input.recipeId].slice(-798);next.learning=learning;
  if(input.sentiment==='nay')next.recommendation=null;
 }else if(a==='plan'){
  const learning=next.learning||{yay:[],nay:[],recent:[]};learning.recent=[...(learning.recent||[]),...next.week.map(x=>x.recipeId)].slice(-180);
  const built=buildWeek(recipes,input.options,next.revision,learning,context);next.week=built.week;next.options={...next.options,...built.options};next.learning=learning;next.recommendation=null;
 }else if(a==='add'){
  recipeById(recipes,input.recipeId);if(!integer(input.day,1,7)||!slots.includes(input.slot)||!integer(input.servings,1,8))fail('Choose a day, meal and 1–8 servings.');
  const key=input.day+':'+input.slot;next.week=next.week.filter(x=>x.key!==key);next.week.push({key,day:input.day,slot:input.slot,recipeId:input.recipeId,servings:input.servings});next.week.sort((a,b)=>a.day-b.day||slots.indexOf(a.slot)-slots.indexOf(b.slot));
  next.learning={yay:[],nay:[],...next.learning,recent:[...(next.learning?.recent||[]),input.recipeId].slice(-180)};
 }else if(a==='remove-meal'||a==='swap'){
  const entry=next.week.find(x=>x.key===input.key);if(!entry)fail('This meal is no longer in your week.');
  if(a==='remove-meal')next.week=next.week.filter(x=>x.key!==input.key);
  else{assertAutomaticChoices(context);const pool=candidates(recipes,next.options,entry.slot,context).filter(r=>r.id!==entry.recipeId&&!(next.learning?.nay||[]).includes(r.id));if(!pool.length)fail('There is no alternative matching your choices and saved food settings. Choose a recipe in Discover instead.');const day=next.week.filter(x=>x.day===entry.day),checked=pool.filter(r=>!automaticPlanIssue(day.map(x=>x===entry?{...x,recipeId:r.id}:x),recipes));if(!checked.length)fail(automaticPlanIssue(day.map(x=>x===entry?{...x,recipeId:pool[0].id}:x),recipes));entry.recipeId=choose(checked,new Set([...next.week.map(x=>x.recipeId),...(next.learning?.recent||[])]),next.revision).id;}
 }else if(a==='shopping-add'){
  const text=String(input.text||'').trim();if(!text||text.length>160)fail('Enter a shopping item under 160 characters.');if(next.shopping.filter(x=>x.source==='manual').length>=100)fail('Remove a shopping item before adding another.');
  next.shopping.push({key:'manual:'+input.operationId,text,source:'manual',done:false});
 }else if(a==='shopping-check'){
  const item=next.shopping.find(x=>x.key===input.key);if(!item||typeof input.done!=='boolean')fail('This item has changed. Reload the list.');item.done=input.done;
 }else if(a==='shopping-remove'){
  if(!next.shopping.some(x=>x.key===input.key))fail('This item has changed. Reload the list.');next.shopping=next.shopping.filter(x=>x.key!==input.key);
 }else if(a==='clear-week'){next.week=[];}
 else fail('Unknown food action.');
 if(['plan','add','remove-meal','swap','clear-week','choose-and-shop','repeat-and-shop'].includes(a)||(a==='choose-today'&&current?.today?.shopping)){
  const meals=[...next.week],today=next.today;
  // A meal already present in the plan needs one ingredient allowance, not two.
  if(today?.shopping&&recipes.some(r=>r.id===today.recipeId)&&!meals.some(m=>m.recipeId===today.recipeId&&m.servings===today.servings))
   meals.push({recipeId:today.recipeId,servings:today.servings});
  next.shopping=shoppingForWeek(meals,recipes,next.shopping);
 }
 next.revision++;next.operations=[...next.operations,input.operationId].slice(-30);return next;
}
export function workspaceView(state,recipes,context={}){
 const lookup=new Map(recipes.map(r=>[r.id,r]));
 return {currentDate:context.date||null,ingredientOptions:ingredientOptions(recipes),today:state.today||null,revision:state.revision,saved:state.saved,week:state.week,shopping:state.shopping,options:state.options,repeats:repeatMeals(state,recipes,context).map(r=>({id:r.id,name:r.name,minutes:r.minutes})),recipes:[...new Set([...state.saved,...state.week.map(x=>x.recipeId),state.today?.recipeId])].map(id=>lookup.get(id)).filter(Boolean),unavailable:state.saved.filter(id=>!lookup.has(id)),recommendation:recommendationFor(state,recipes,context),nutritionContext:nutritionForWeek(state,recipes)};
}
