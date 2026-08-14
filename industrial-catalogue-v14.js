import {buildIndustrialCatalogue as buildV13,grubHumannessIssues} from './industrial-catalogue-v13.js';

const lower=x=>String(x||'').toLowerCase();
const FAMILIES=[[/Proper Sandwich/i,'proper-sandwich'],[/Traybake/i,'traybake'],[/Slow[- ]Cooker/i,'slow-cooker'],[/Protein Pot/i,'protein-pot'],[/Loaded Wrap/i,'loaded-wrap'],[/Breakfast Hash/i,'breakfast-hash'],[/Breakfast Buttie/i,'breakfast-buttie'],[/Breakfast Wrap/i,'breakfast-wrap'],[/Breakfast Toastie/i,'breakfast-toastie'],[/Overnight Oats/i,'overnight-oats'],[/Work Snack Box/i,'work-snack-box']];
function family(title=''){for(const [re,id] of FAMILIES)if(re.test(title))return id;return null}
function ingredient(r,re,fallback='the filling'){return r.ingredients?.find(x=>re.test(lower(x.item)))?.item||fallback}
function protein(r){return ingredient(r,/chicken|turkey|beef|pork|salmon|tuna|ham|bacon|sausage|egg|beans|chickpea|tofu|cottage cheese|yoghurt|pudding/i)}
function prepareAlreadyCooked(p){
  if(/^boiled eggs?$/i.test(String(p).trim()))return `Slice the ${p} and keep them chilled until assembly, or warm them gently if this dish is being served hot.`;
  return `Warm the ${p} through in the hot pan until piping hot and lightly coloured. It is already cooked, so stop before it dries out.`;
}
function slowCooker(r){const p=protein(r);return[
  `If you have five minutes, brown the ${p} in a properly hot pan first. It is optional, but that bit of colour gives the finished sauce far more depth.`,
  `Put the vegetables, measured sauce or liquid and ${p} into the slow cooker. Stir once so everything is coated, then cook on LOW for 6–8 hours or HIGH for 3–4 hours.`,
  `Keep the lid on while it cooks. In the final 30 minutes, check the texture: if the sauce is thin, leave the lid slightly ajar or finish uncovered where your cooker allows until it clings to the spoon.`,
  `Check the ${p} is safely cooked, taste the sauce and adjust the seasoning before serving. Cool leftovers quickly and refrigerate.`
]}
function repairMethod(r,f){
  let method=f==='slow-cooker'?slowCooker(r):[...(r.method||[])];
  return method.map(step=>String(step)
    .replace('rather than being thrown in because the matrix found them.','rather than being thrown in just to fill the box.')
    .replace(/Get the pan properly hot first\. Cook the (cooked [^.]+?) until browned and cooked through — colour is flavour, so do not crowd the pan\./gi,(_,p)=>prepareAlreadyCooked(p))
    .replace(/Cook the (boiled eggs?) until just set, keeping it tender rather than hammering it dry\./gi,(_,p)=>prepareAlreadyCooked(p))
    .replace(/the boiled eggs is meant to be warm/gi,'the boiled eggs are meant to be warm'));
}
function repair(r){
  const f=family(r.title);if(!f)return r;
  let title=String(r.title||'');
  if(/bean-loaded-beans/i.test(String(r.id||'')))title=title.replace(/Shift Classic Beans Breakfast/i,'Shift Loaded Beans Breakfast');
  return {...r,title,method:repairMethod(r,f),provenance:{...(r.provenance||{}),humanness_v1:{...(r.provenance?.humanness_v1||{}),family:f,composer_version:'v2',editorial_repair:'v14-review-authority'}}};
}
export {grubHumannessIssues};
export function buildIndustrialCatalogue(){const c=buildV13(),recipes=c.recipes.map(repair);return{...c,recipes,metrics:{...c.metrics,v14EditorialRepair:true}}}
