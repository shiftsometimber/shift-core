import {buildIndustrialCatalogue as buildV14} from './industrial-catalogue-v14.js';

const text=x=>String(x||'');
const lower=x=>text(x).toLowerCase();
const FAMILY_PATTERNS=[
  [/Proper Sandwich/i,'proper-sandwich'],[/Traybake/i,'traybake'],[/Slow[- ]Cooker/i,'slow-cooker'],
  [/Protein Pot/i,'protein-pot'],[/Loaded Wrap/i,'loaded-wrap'],[/Breakfast Hash/i,'breakfast-hash'],
  [/Breakfast Buttie/i,'breakfast-buttie'],[/Breakfast Wrap/i,'breakfast-wrap'],[/Breakfast Toastie/i,'breakfast-toastie'],
  [/Overnight Oats/i,'overnight-oats'],[/Work Snack Box/i,'work-snack-box']
];
function family(title=''){for(const [re,id] of FAMILY_PATTERNS)if(re.test(title))return id;return null}
function ingredient(r,re,fallback='the filling'){return r.ingredients?.find(x=>re.test(lower(x.item)))?.item||fallback}
function protein(r){return ingredient(r,/chicken|turkey|beef|pork|salmon|tuna|ham|bacon|sausage|egg|beans|chickpea|tofu|cottage cheese|yoghurt|pudding/i)}
function cookedAlready(p){return /^(cooked\s|boiled eggs?$)/i.test(text(p).trim())}
function prepProtein(p){
  if(/^boiled eggs?$/i.test(text(p).trim()))return `Slice the ${p} and keep them chilled until assembly, or warm them gently if this dish is being served hot.`;
  if(/^cooked\s/i.test(text(p).trim()))return `Warm the ${p} through in the hot pan until piping hot and lightly coloured. It is already cooked, so stop before it dries out.`;
  const x=lower(p);
  if(/egg/.test(x))return `Cook the ${p} until just set, keeping it tender rather than hammering it dry.`;
  if(/beans|chickpea|tofu/.test(x))return `Get the pan properly hot, add the ${p} and let it take on a little colour before you start moving it around.`;
  if(/salmon/.test(x))return `Cook the ${p} until opaque and just flaking at the thickest point; pull it from the heat before it dries out.`;
  return `Get the pan properly hot first. Cook the ${p} until browned and cooked through — colour is flavour, so do not crowd the pan.`;
}
function slowCooker(r){const p=protein(r);return[
  `If you have five minutes, brown the ${p} in a properly hot pan first. It is optional, but that bit of colour gives the finished sauce far more depth.`,
  `Put the vegetables, measured sauce or liquid and ${p} into the slow cooker. Stir once so everything is coated, then cook on LOW for 6–8 hours or HIGH for 3–4 hours.`,
  `Keep the lid on while it cooks. In the final 30 minutes, check the texture: if the sauce is thin, leave the lid slightly ajar or finish uncovered where your cooker allows until it clings to the spoon.`,
  `Check the ${p} is safely cooked, taste the sauce and adjust the seasoning before serving. Cool leftovers quickly and refrigerate.`
]}
function cleanMethod(r,f){
  let method=[...(r.method||[])];
  if(f==='slow-cooker')method=slowCooker(r);
  method=method.map(step=>text(step)
    .replace('rather than being thrown in because the matrix found them.','rather than being thrown in just to fill the box.')
    .replace(/Get the pan properly hot first\. Cook the (cooked [^.]+?) until browned and cooked through — colour is flavour, so do not crowd the pan\./gi,(_,p)=>prepProtein(p))
    .replace(/Cook the (boiled eggs?) until just set, keeping it tender rather than hammering it dry\./gi,(_,p)=>prepProtein(p))
    .replace(/the boiled eggs is meant to be warm/gi,'the boiled eggs are meant to be warm'));
  return method;
}
function repair(r){
  const f=family(r.title);if(!f)return r;
  let title=text(r.title);
  if(/bean-loaded-beans/i.test(r.id||''))title=title.replace(/Shift Classic Beans Breakfast/i,'Shift Loaded Beans Breakfast');
  return {...r,title,method:cleanMethod(r,f),provenance:{...(r.provenance||{}),humanness_v1:{...(r.provenance?.humanness_v1||{}),family:f,composer_version:'v2',editorial_repair:'industrial-v15'}}};
}
export function buildIndustrialCatalogue(){
  const c=buildV14();
  const recipes=c.recipes.map(repair);
  return {...c,recipes,metrics:{...c.metrics,editorialV15:true}};
}
