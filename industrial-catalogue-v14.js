import {buildIndustrialCatalogue as buildV13,grubHumannessIssues as v13HumannessIssues} from './industrial-catalogue-v13.js';

const lower=x=>String(x||'').toLowerCase();
const FAMILIES=[[/Proper Sandwich/i,'proper-sandwich'],[/Traybake/i,'traybake'],[/Slow[- ]Cooker/i,'slow-cooker'],[/Protein Pot/i,'protein-pot'],[/Loaded Wrap/i,'loaded-wrap'],[/Breakfast Hash/i,'breakfast-hash'],[/Breakfast Buttie/i,'breakfast-buttie'],[/Breakfast Wrap/i,'breakfast-wrap'],[/Breakfast Toastie/i,'breakfast-toastie'],[/Overnight Oats/i,'overnight-oats'],[/Work Snack Box/i,'work-snack-box']];
function family(title=''){for(const [re,id] of FAMILIES)if(re.test(title))return id;return null}
function ingredient(r,re,fallback='the filling'){return r.ingredients?.find(x=>re.test(lower(x.item)))?.item||fallback}
function hasIngredient(r,re){return (r.ingredients||[]).some(x=>re.test(lower(x.item)))}
function protein(r){return ingredient(r,/chicken|turkey|beef|pork|salmon|tuna|ham|bacon|sausage|egg|beans|chickpea|tofu|cottage cheese|yoghurt|pudding/i)}
function prepareAlreadyCooked(p){
  if(/^boiled eggs?$/i.test(String(p).trim()))return `Slice the ${p} and keep them chilled until assembly, or warm them gently if this dish is being served hot.`;
  return `Warm the ${p} through in the hot pan until piping hot and lightly coloured. It is already cooked, so stop before it dries out.`;
}
function slowCooker(r){const p=protein(r),coldCream=ingredient(r,/mayonnaise|yoghurt|creme fraiche|cream cheese/i,''),hasLiquid=hasIngredient(r,/stock|broth|passata|chopped tomato|tomato sauce|water|coconut milk|milk|juice|wine|sauce/i);return[
  `If you have five minutes, brown the ${p} in a properly hot pan first. It is optional, but that bit of colour gives the finished dish far more depth.`,
  hasLiquid?`Put the vegetables, measured cooking liquid and ${p} into the slow cooker. Stir once so everything is coated, then cook on LOW for 6–8 hours or HIGH for 3–4 hours.`:`Put the vegetables and ${p} into the slow cooker with the measured glaze or seasoning. Cover and cook on LOW for 6–8 hours or HIGH for 3–4 hours; the sealed cooker and vegetables provide moisture, so do not add a heavy creamy dressing at this stage.`,
  hasLiquid?`Keep the lid on while it cooks. In the final 30 minutes, check the texture: if the cooking liquid is still thin, leave the lid slightly ajar or finish uncovered where your cooker allows until it reduces.`:`Keep the lid on while it cooks. Check once near the end: if the pot looks genuinely dry rather than glossy from released juices, add only a small splash of hot water and continue until the vegetables are tender.`,
  coldCream?`Check the ${p} is safely cooked, switch the cooker off, then stir through the ${coldCream} and final flavourings away from the heat. Taste, season and cool leftovers quickly before refrigerating.`:`Check the ${p} is safely cooked, taste the finished dish and adjust the seasoning before serving. Cool leftovers quickly and refrigerate.`
]}
function loadedWrap(r,method){const p=protein(r),out=[...method],hasSauce=hasIngredient(r,/sauce|glaze|ketchup|mustard|paste|relish|mayonnaise|yoghurt|juice|vinegar/i),alreadyCold=/boiled eggs?/i.test(p);if(out.length>=2)out[1]=hasSauce&&!alreadyCold?`Keep the lettuce, tomato and other fresh/crunchy ingredients out of the pan. Mix the measured sauce or dressing with the ${p}; if the filling is being served hot, reduce only the sauce-coated ${p} until it is no longer wet enough to soak the wrap.`:`Keep the lettuce, tomato and other fresh/crunchy ingredients out of the pan. Season the ${p} with the measured flavourings and keep the fresh ingredients fresh; there is no sauce reduction step to invent here.`;return out}
function traybake(r,method){const out=[...method],coldCream=ingredient(r,/mayonnaise|yoghurt|creme fraiche|cream cheese/i,'');if(out.length>=3){if(coldCream)out[2]=`Add the vegetables to the hot tray and roast for another 15–20 minutes until the edges colour. Keep the ${coldCream} chilled and add it only after the tray comes out of the oven.`;else if(!hasIngredient(r,/sauce|glaze|ketchup|mustard|paste|relish|juice|vinegar/i))out[2]='Add the vegetables to the hot tray and roast for another 15–20 minutes. Turn once if needed so the edges colour rather than steam; no extra sauce is required.';}return out}
function snackBox(r){const chilled=ingredient(r,/yoghurt|cottage cheese|pudding|milk/i,'');if(chilled)return[
  `Build the snack box around the ${chilled}, fruit and crunch so each part has a job rather than simply filling space.`,
  `Portion the ${chilled} first, add the fruit in bite-size pieces and keep crackers, oats or seeds separate so they stay crisp.`,
  `Taste the creamy element with the fruit before packing; the combination should work without needing mystery extras.`,
  `Seal the box, keep it chilled, and add the crunchy pieces only when you are ready to eat.`
];return[
  'Build the snack box around the fruit and crunch that are actually listed. Cut the fruit into bite-size pieces and portion everything rather than piling it in loose.',
  'Keep crackers, oats and seeds dry and separate from juicy fruit until you are ready to eat.',
  'Taste the fruit combination before packing; if the flavours do not work together, that variant should not ship.',
  'Pack in a lidded container, chill any cut fruit promptly, and combine the crunchy pieces only when you are ready to eat.'
]}
function snackPot(r){const base=ingredient(r,/yoghurt|cottage cheese|pudding|milk/i,'');if(base)return null;const fruit=ingredient(r,/banana|apple|berries|cherry|mango|pineapple|peach|pear|plum/i,'fruit');return[
  `Start with the ${fruit} in a bowl or lidded pot and add the other measured fruit.`,
  'Fold through the measured flavouring, then keep the oats, seeds or other crunchy ingredients separate until serving.',
  'Taste the fruit mixture before packing. It should make sense as a combination without pretending there is a creamy protein base.',
  'Chill the fruit pot until needed and add the crunchy ingredients just before eating.'
]}
function oatCrunch(r){const oats=ingredient(r,/rolled oats|porridge oats/i,'oats'),fruit=ingredient(r,/banana|apple|berries|cherry|mango|pineapple|peach|pear|plum/i,'fruit');return[
  `Toast the ${oats} and seeds in a dry frying pan over a medium heat for 4–5 minutes, stirring until they smell nutty and take on a little colour.`,
  `Tip the toasted crunch onto a plate and let it cool completely while you prepare the ${fruit} and other measured fruit.`,
  'Pack the cooled oat crunch separately from the fruit so it stays crisp; this is a crunch pot, not overnight oats and does not pretend to contain a creamy protein base.',
  'Keep the cut fruit chilled and combine with the oat crunch only when you are ready to eat.'
]}
function repairMethod(r,f){
  let method=f==='slow-cooker'?slowCooker(r):[...(r.method||[])];
  method=method.map(step=>String(step)
    .replace('rather than being thrown in because the matrix found them.','rather than being thrown in just to fill the box.')
    .replace(/Get the pan properly hot first\. Cook the (cooked [^.]+?) until browned and cooked through — colour is flavour, so do not crowd the pan\./gi,(_,p)=>prepareAlreadyCooked(p))
    .replace(/Get the pan properly hot first\. Cook the (tuna in spring water, drained|lean ham) until browned and cooked through — colour is flavour, so do not crowd the pan\./gi,(_,p)=>prepareAlreadyCooked(p))
    .replace(/Cook the (boiled eggs?) until just set, keeping it tender rather than hammering it dry\./gi,(_,p)=>prepareAlreadyCooked(p))
    .replace(/the boiled eggs is meant to be warm/gi,'the boiled eggs are meant to be warm'));
  if(f==='loaded-wrap')method=loadedWrap(r,method);
  if(f==='traybake')method=traybake(r,method);
  if(f==='work-snack-box')method=snackBox(r);
  if(f==='protein-pot'){if(!hasIngredient(r,/yoghurt|cottage cheese|pudding|milk/i)&&/Overnight Oats/i.test(String(r.title||'')))method=oatCrunch(r);else{const corrected=snackPot(r);if(corrected)method=corrected;}}
  return method;
}
function repair(r){
  const f=family(r.title);if(!f)return r;
  let title=String(r.title||''),equipment=[...(r.equipment||[])];
  if(/bean-loaded-beans/i.test(String(r.id||'')))title=title.replace(/Shift Classic Beans Breakfast/i,'Shift Loaded Beans Breakfast');
  if(f==='protein-pot'&&!hasIngredient(r,/yoghurt|cottage cheese|pudding|milk/i)){if(/Overnight Oats/i.test(title)){title=title.replace(/Overnight Oats Protein Pot$/i,'Oat Crunch Snack Pot');equipment=['hob','frying-pan','lidded-container'];}else title=title.replace(/Protein Pot$/i,'Snack Pot');}
  return {...r,title,equipment,method:repairMethod(r,f),provenance:{...(r.provenance||{}),humanness_v1:{...(r.provenance?.humanness_v1||{}),family:f,composer_version:'v2',editorial_repair:'v14-review-authority'}}};
}
export function grubHumannessIssues(r){const issues=[...v13HumannessIssues(r)];return [...new Set(issues)]}
export function buildIndustrialCatalogue(){const c=buildV13(),recipes=c.recipes.map(repair);return{...c,recipes,metrics:{...c.metrics,v14EditorialRepair:true}}}
