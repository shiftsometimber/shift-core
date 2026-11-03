// Public food data only. Member targets and private records never enter a food catalogue.
export const nutritionSources = Object.freeze({
 cofid: {name:'UK CoFID 2021',version:'2021',url:'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid',licence:'Open Government Licence v3.0'},
 off: {name:'Open Food Facts',url:'https://world.openfoodfacts.org',licence:'ODbL 1.0; database contents DbCL 1.0'}
});
export const nutrients=['kcal','proteinG','carbohydrateG','sugarsG','fatG','saturatesG','fibreG','saltG'];
const keys={kcal:'kcal',proteinG:'protein_g',carbohydrateG:'carbohydrate_g',sugarsG:'sugars_g',fatG:'fat_g',saturatesG:'saturates_g',fibreG:'fibre_g',saltG:'salt_g'};
export const known=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
export function recipeNutrition(recipe){
 const n=recipe?.nutrition;
 if(n?.status!=='validated'||!String(n.methodology||'').includes('CoFID 2021'))return null;
 const values=Object.fromEntries(nutrients.map(k=>[k,known(n[keys[k]])?n[keys[k]]:null]));
 if(!known(values.proteinG)||!known(values.kcal))return null;
 return {...values,source:{...nutritionSources.cofid,...(/product.label/i.test(n.methodology)?{name:'CoFID 2021 and named UK product labels'}:{}),recordId:recipe.id,method:n.methodology},basis:'per serving',estimate:true};
}
// Used only when preparing the day's offer, overnight or after an explicit choice.
// Matching uses unrounded amounts and the same database/version, never display strings.
export function proteinMatchedSwaps(original,candidates,limit=3){
 const n=original?.nutrition;
 if(!known(n?.proteinG)||!n.source?.name||!n.source?.version)return [];
 const eligible=candidates.filter(a=>a.id!==original.id&&a.kind===original.kind&&
  a.nutrition?.source?.name===n.source.name&&a.nutrition?.source?.version===n.source.version&&
  known(a.nutrition.proteinG)&&Math.abs(a.nutrition.proteinG-n.proteinG)<=5);
 // Any choice can become the original after Pick. Keep the whole prepared
 // group within five grams, so a second swap obeys the same rule as the first.
 let best=[];for(const low of [n.proteinG,...eligible.map(a=>a.nutrition.proteinG)]){
  if(low>n.proteinG||n.proteinG>low+5)continue;
  const group=eligible.filter(a=>a.nutrition.proteinG>=low&&a.nutrition.proteinG<=low+5).slice(0,limit);
  if(group.length>best.length)best=group;if(best.length===limit)break;
 }
 return best;
}
export function ownNutritionTargets(prefs){
 const food=prefs?.food||{};
 // These are explicit member/plan fields. No population target or weight-based fallback.
 const positive=v=>{const n=typeof v==='number'?v:typeof v==='string'&&v.trim()?Number(v):null;return known(n)&&n>0?n:null;};
 return {proteinG:positive(food.protein_target),kcal:positive(food.calorie_target)};
}
// UK Department of Health FoP guidance, November 2016, Annex 3, tables 2/3.
// The large-portion high rule is applied before the per-100g/ml rule.
// Missing values and nutrients outside the four permitted fields have no colour.
const foodLimits={fatG:[3,17.5,21],saturatesG:[1.5,5,6],sugarsG:[5,22.5,27],saltG:[.3,1.5,1.8]};
const drinkLimits={fatG:[1.5,8.75,10.5],saturatesG:[.75,2.5,3],sugarsG:[2.5,11.25,13.5],saltG:[.3,.75,.9]};
export function trafficLight(nutrient,per100,portionAmount,{kind='food',portionSize=null}={}){
 if(!['food','drink'].includes(kind))return null;
 const rule=(kind==='drink'?drinkLimits:foodLimits)[nutrient];
 if(!rule||!known(per100)||!known(portionAmount)||!known(portionSize))return null;
 if(portionSize>(kind==='drink'?150:100)&&portionAmount>rule[2])return 'high';
 return per100>rule[1]?'high':per100<=rule[0]?'low':'medium';
}
export function portionNutrition(food,amount){
 if(!known(amount)||amount<=0||amount>10000)throw Object.assign(Error('Enter the portion you ate.'),{status:400});
 if(!food?.source?.name||!food.source.recordId)throw Object.assign(Error('This food needs a recorded source.'),{status:409});
 const per100=food.per100||{},values=Object.fromEntries(nutrients.map(k=>[k,known(per100[k])?per100[k]*amount/100:null]));
 return {...values,portionSize:amount,portionUnit:food.kind==='drink'?'ml':'g',kind:food.kind||'food',per100,
  source:structuredClone(food.source),estimate:true,
  lights:Object.fromEntries(Object.keys(foodLimits).map(k=>[k,food.suppressTrafficLights?null:trafficLight(k,per100[k],values[k],{kind:food.kind||'food',portionSize:amount})]))};
}
export function nutritionDay(entries,targets,on){
 const eaten=entries.filter(e=>e.on===on),totals={},unknown={};
 for(const k of nutrients){totals[k]=0;unknown[k]=false;for(const e of eaten){if(known(e[k]))totals[k]+=e[k];else unknown[k]=true;}}
 const bars=Object.fromEntries(['proteinG','kcal'].map(k=>[k,{value:totals[k],target:targets[k],fraction:known(targets[k])&&targets[k]>0?Math.min(1,totals[k]/targets[k]):null,unknown:unknown[k]}]));
 return {on,entries:eaten,totals,unknown,targets,bars,underEating:{enabled:false,reason:'Awaiting clinical thresholds'}};
}
