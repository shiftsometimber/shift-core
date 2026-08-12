const DATASET={name:"McCance and Widdowson's Composition of Foods Integrated Dataset",version:'CoFID 2021',publisher:'Public Health England',source_url:'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid'};
const METHOD='CoFID 2021 ingredient-level weighted calculation';
const PRECISION='Calculated nutrition is an ingredient-level estimate, not laboratory analysis. Ingredient brands, cooking yield and drained weights can vary.';
const BBQ=m('17-705','Barbecue sauce',140,1,36.1,0.1,1.2,'Generic barbecue sauce is the closest CoFID category; reduced-sugar branded sauce/glaze products may be lower in carbohydrate/energy.');
const MAP={
  'chicken breast':m('18-488','Chicken, meat, average, raw',108,22.3,0,2.1,0,'Closest raw uncoated chicken-meat category in CoFID; branded/trim differences may vary.'),
  '5% beef mince':m('18-508','Beef, mince, raw, extra lean',130,21.9,0,4.2,0,'Closest CoFID raw extra-lean mince category; authored 5% product may vary slightly by brand.'),
  'lean pork loin':m('18-518','Pork, loin medallions, raw, lean',116,24.8,0,1.9,0,'Raw lean loin medallion used as the closest authoritative lean-loin category.'),
  'salmon fillet':m('16-356','Salmon, farmed, flesh only, raw',217,20.4,0,15,0.2,'Raw farmed flesh-only salmon used for an unbranded fillet.'),
  'basmati rice, dry':m('11-857','Rice, white, basmati, raw',351,8.1,83.7,0.5,1.1),
  'brown rice, dry':m('11-866','Rice, brown, basmati, raw',355,8.9,77.6,3.1,3.3,'Brown basmati raw is the closest explicit CoFID dry brown-rice category.'),
  'wholewheat pasta, dry':m('11-718','Pasta, wholewheat, spaghetti, dried, raw',329,12.6,68.3,2.5,11.7,'Wholewheat dried spaghetti used as the closest generic wholewheat dry-pasta category.'),
  'potatoes':m('13-489','Potatoes, old, raw, flesh only',82,1.9,19.6,0.1,2),
  'baby potatoes':m('13-618','Potatoes, new and salad, flesh only, raw',68,1.7,16.1,0.1,1.8,'New/salad potato flesh used as the closest authoritative baby-potato category.'),
  'onion':m('13-499','Onions, raw',35,1,8,0.1,2.2),
  'mixed peppers':m('13-524','Pepper, capsicum, red, raw',21,0.8,4.3,0.2,2.2,'Red capsicum is used as a transparent proxy for a mixed sweet-pepper portion.'),
  'red pepper':m('13-524','Pepper, capsicum, red, raw',21,0.8,4.3,0.2,2.2),
  'kidney beans':m('13-660','Beans, red kidney, canned in water, re-heated, drained',100,8.6,15.1,1,6.8,'Drained canned red-kidney beans used for the authored ready-to-use ingredient.'),
  'courgette':m('13-627','Courgette, raw',16,1.3,2.3,0.2,0.5),
  'cherry tomatoes':m('13-519','Tomatoes, cherry, raw',22,1.1,3.6,0.5,1.3),
  'carrots':m('13-496','Carrots, old, raw',34,0.5,7.7,0.4,3.9),
  'peas':m('13-527','Peas, frozen, raw',68,5.3,10.7,0.7,5.3,'Frozen raw peas used for the generic authored pea ingredient.'),
  'broccoli':m('13-502','Broccoli, green, raw',34,4.3,3.2,0.6,4),
  'tikka masala sauce':m('17-626','Sauce, Indian cook in, korma/tikka masala',133,1.7,10.9,9.5,2.5),
  'reduced-sugar BBQ sauce':BBQ,
  'reduced-sugar BBQ glaze':BBQ,
  'olive oil':m('17-038','Oil, olive',899,0,0,99.9,0,'5ml authored measures are converted with a documented 0.92g/ml culinary-oil density assumption.')
};
const NUTRIENTS=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];

function m(cofid_code,cofid_name,kcal,protein_g,carbohydrate_g,fat_g,fibre_g,mapping_note){return{cofid_code,cofid_name,per_100g:{kcal,protein_g,carbohydrate_g,fat_g,fibre_g},...(mapping_note?{mapping_note}:{})}}
function round1(n){return Math.round((Number(n)+Number.EPSILON)*10)/10}
function grams(amount,item){const s=String(amount||'').trim().toLowerCase();const g=s.match(/(?:^|\s|\/)(\d+(?:\.\d+)?)\s*g\b/);if(g)return Number(g[1]);const ml=s.match(/(?:^|\s|\/)(\d+(?:\.\d+)?)\s*ml\b/);if(ml){const volume=Number(ml[1]);if(item==='olive oil')return round1(volume*0.92);return volume}return null}

export function validateIndustrialRecipe(recipe){
  if(!recipe||recipe.meal_type!=='dinner'||!Array.isArray(recipe.ingredients)||!recipe.ingredients.length)return{recipe,validated:false,reason:'not_target_tranche'};
  const evidence=[];const totals=Object.fromEntries(NUTRIENTS.map(k=>[k,0]));
  for(const ingredient of recipe.ingredients){const mapping=MAP[ingredient.item];if(!mapping)return{recipe,validated:false,reason:`unmapped:${ingredient.item}`};const gram_equivalent=grams(ingredient.amount,ingredient.item);if(!Number.isFinite(gram_equivalent)||gram_equivalent<=0)return{recipe,validated:false,reason:`amount:${ingredient.item}:${ingredient.amount}`};const ev={item:ingredient.item,recipe_amount:ingredient.amount,gram_equivalent,...mapping};evidence.push(ev);for(const key of NUTRIENTS)totals[key]+=Number(mapping.per_100g[key])*gram_equivalent/100}
  const servings=Math.max(1,Number(recipe.servings)||1);const per=Object.fromEntries(NUTRIENTS.map(k=>[k,round1(totals[k]/servings)]));
  const blockers=(recipe.review?.blockers||[]).filter(x=>x!=='nutrition_validation');
  return{validated:true,recipe:{...recipe,nutrition:{status:'validated',methodology:METHOD,dataset_version:DATASET.version,dataset_source_url:DATASET.source_url,validated_at:'2026-08-12',precision_note:PRECISION,...per,ingredient_evidence:evidence},review:{...(recipe.review||{}),status:'draft',blockers}},evidence};
}

export function validateIndustrialRecipes(recipes){const output=[],failures=[];let validated=0;for(const recipe of recipes||[]){const r=validateIndustrialRecipe(recipe);output.push(r.recipe);if(r.validated)validated++;else failures.push({id:recipe?.id,reason:r.reason})}return{recipes:output,metrics:{authored:output.length,nutritionValidated:validated,remaining:output.length-validated,dataset:DATASET.version,methodology:METHOD},failures}}
export const industrialCofidDataset=DATASET;
