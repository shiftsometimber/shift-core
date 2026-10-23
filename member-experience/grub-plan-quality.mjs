// Checks saved meal ideas; this does not calculate a member's dietary needs.
// NICE NG246 1.16.8–12 reserves low-energy diets (800–1,200 kcal/day)
// for supported specialist pathways. 1,200 is an engineering review trigger,
// never a target or evidence that a larger total is nutritionally adequate.
export const AUTOMATIC_PLAN_REVIEW_KCAL=1200;
const known=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n))&&Number(n)>=0;
const round=n=>Math.round(n*10)/10;
export function planNutrition(week,recipes){
 const lookup=new Map(recipes.map(r=>[r.id,r])),days=[];
 for(const day of [...new Set(week.map(x=>x.day))].sort((a,b)=>a-b)){
  const entries=week.filter(x=>x.day===day),meals=entries.map(x=>lookup.get(x.recipeId));
  const getters={kcal:r=>r?.kcal,protein:r=>r?.protein_g,fibre:r=>r?.nutrition?.fibre_g};
  const coverage=Object.fromEntries(Object.entries(getters).map(([key,get])=>[key,meals.filter(r=>known(get(r))).length]));
  const values=Object.fromEntries(Object.entries(getters).map(([key,get])=>[key,coverage[key]===meals.length?round(meals.reduce((n,r)=>n+Number(get(r)),0)):null]));
  const threeMeals=entries.length===3&&['breakfast','lunch','dinner'].every(slot=>entries.some(e=>e.slot===slot));
  const review=threeMeals?(values.kcal===null?'unknown-energy':values.kcal<=AUTOMATIC_PLAN_REVIEW_KCAL?'low-energy':null):null;
  days.push({day,meals:meals.length,...values,coverage,threeMeals,review});
 }
 const totals=Object.fromEntries(['kcal','protein','fibre'].map(key=>[key,days.length&&days.every(d=>known(d[key]))?round(days.reduce((n,d)=>n+d[key],0)):null]));
 return {days,totals};
}
export function automaticPlanIssue(week,recipes){
 const day=planNutrition(week,recipes).days.find(d=>d.review);
 if(!day)return null;
 return day.review==='unknown-energy'
  ?'Day '+day.day+' is missing energy information. We cannot check this automatic plan. Choose individual meals instead. Your saved week has not changed.'
  :'Day '+day.day+' adds up to only '+day.kcal+' kcal per person for three meals. We cannot save this as an automatic week. Try different choices or choose individual meals using your agreed food plan. Your saved week has not changed.';
}
