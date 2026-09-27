const DATASET={name:"McCance and Widdowson's Composition of Foods Integrated Dataset",version:'CoFID 2021',publisher:'Public Health England',source_url:'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid'};
const METHOD='CoFID 2021 ingredient-level weighted calculation';
const PRECISION='Calculated nutrition is an ingredient-level estimate, not laboratory analysis. Ingredient brands, cooking yield and drained weights can vary.';
const BBQ=m('17-705','Barbecue sauce',140,1,36.1,0.1,1.2,'Generic barbecue sauce is the closest CoFID category; reduced-sugar branded sauce/glaze products may be lower in carbohydrate/energy.');
const MAP={
  'chicken breast':m('18-488','Chicken, meat, average, raw',108,22.3,0,2.1,0,'Closest raw uncoated chicken-meat category in CoFID; branded/trim differences may vary.'),
  '5% beef mince':m('18-508','Beef, mince, raw, extra lean',130,21.9,0,4.2,0,'Closest CoFID raw extra-lean mince category; authored 5% product may vary slightly by brand.'),
  'lean pork loin':m('18-518','Pork, loin medallions, raw, lean',116,24.8,0,1.9,0,'Raw lean loin medallion used as the closest authoritative lean-loin category.'),
  'salmon fillet':m('16-356','Salmon, farmed, flesh only, raw',217,20.4,0,15,0.2,'Raw farmed flesh-only salmon used for an unbranded fillet.'),
  'firm tofu':m('13-570','Tofu, soya bean, steamed',73,8.1,0.7,4.2,0,'Closest plain-tofu CoFID identity. Authored firm tofu is retained as reviewable provenance because firmness/water content can vary.'),
  'raw king prawns':m('16-387','Prawns, king, raw',77,17.6,0,0.7,0),
  'cooked green lentils':m('13-661','Lentils, green and brown, whole, dried, boiled in unsalted water',92,7.8,14.5,0.7,7.4,'Boiled whole green/brown lentils are the closest explicit cooked green-lentil category.'),
  'basmati rice, dry':m('11-857','Rice, white, basmati, raw',351,8.1,83.7,0.5,1.1),
  'brown rice, dry':m('11-866','Rice, brown, basmati, raw',355,8.9,77.6,3.1,3.3,'Brown basmati raw is the closest explicit CoFID dry brown-rice category.'),
  'wholewheat pasta, dry':m('11-718','Pasta, wholewheat, spaghetti, dried, raw',329,12.6,68.3,2.5,11.7,'Wholewheat dried spaghetti used as the closest generic wholewheat dry-pasta category.'),
  'rolled oats':m('11-788','Porridge oats, unfortified',381,10.9,70.7,8.1,7.8,'Unfortified porridge oats are the direct generic CoFID equivalent for authored rolled oats.'),
  'wholemeal bread':m('11-981','Bread, wholemeal, average',217,9.4,42,2.5,7,'Average wholemeal bread used for generic authored wholemeal bread.'),
  'wholemeal bap':m('11-986','Bread rolls, wholemeal',244,10.4,46.1,3.3,5.5,'Wholemeal bread roll is the direct generic CoFID equivalent for the authored wholemeal bap.'),
  'wholegrain crackers':m('11-1134','Crackers, wholemeal, homemade',421,9.8,76.7,10.5,5.4,'Wholemeal crackers are the closest explicit CoFID category for generic wholegrain crackers; brand composition can vary.'),
  '0% Greek yoghurt':m('12-379','Yogurt, low fat, plain',57,4.8,7.8,1,0,'CoFID has no explicit 0% Greek-style plain entry in the diagnostic set; low-fat plain yogurt is used as a transparent macro proxy pending a closer authoritative identity.'),
  'tuna in spring water, drained':m('16-416','Tuna, canned in brine, drained',109,24.9,0,1,0,'Drained canned tuna in brine is used as the closest CoFID macro proxy for spring-water canned tuna; sodium is outside the current five-nutrient calculation.'),
  'lean ham':m('19-496','Ham',107,18.4,1,3.3,0.1,'Generic ham is the closest explicit CoFID identity; authored lean ham may be slightly lower in fat by brand.'),
  'potatoes':m('13-489','Potatoes, old, raw, flesh only',82,1.9,19.6,0.1,2),
  'baking potato':m('13-489','Potatoes, old, raw, flesh only',82,1.9,19.6,0.1,2,'Raw old-potato flesh is used for the authored baking potato before cooking.'),
  'baby potatoes':m('13-618','Potatoes, new and salad, flesh only, raw',68,1.7,16.1,0.1,1.8,'New/salad potato flesh used as the closest authoritative baby-potato category.'),
  'roast potatoes':m('13-619',"Potatoes, new, frozen, `roast' in corn oil",157,2.5,23.4,6.6,3,'Closest explicit CoFID roast-potato category; oil type and preparation remain visible provenance limitations.'),
  'oven chips':m('13-487','Potato chips, oven ready, no batter, baked',189,3.2,35.3,4.9,3.5),
  'individual pizza base':m('11-1016','Pizza base, raw',290,7.8,57.5,4.8,2.5),
  'wholemeal burger bun':m('11-986','Bread rolls, wholemeal',244,10.4,46.1,3.3,5.5,'Wholemeal bread roll is the direct generic CoFID equivalent for the authored wholemeal burger bun.'),
  'onion':m('13-499','Onions, raw',35,1,8,0.1,2.2),
  'mixed peppers':m('13-524','Pepper, capsicum, red, raw',21,0.8,4.3,0.2,2.2,'Red capsicum is used as a transparent proxy for a mixed sweet-pepper portion.'),
  'red pepper':m('13-524','Pepper, capsicum, red, raw',21,0.8,4.3,0.2,2.2),
  'tomato':m('13-517','Tomatoes, standard, raw',14,0.5,3,0.1,1),
  'tomato passata':m('13-530','Tomatoes, canned, whole contents',19,1.1,3.8,0.1,0.8,'Canned whole-content tomatoes are used as a transparent plain-tomato proxy for passata pending an explicit CoFID passata identity.'),
  'chopped tomatoes':m('13-530','Tomatoes, canned, whole contents',19,1.1,3.8,0.1,0.8,'Canned whole-content tomatoes are the closest explicit CoFID category for generic chopped canned tomatoes.'),
  'mixed salad':m('15-648','Salad, green',13,1,1.6,0.4,0,'Generic green salad is used as the closest CoFID identity for an undressed mixed salad portion.'),
  'spinach':m('13-521','Spinach, baby, raw',16,2.6,0.2,0.6,1,'Baby raw spinach is used as the closest explicit CoFID identity for generic raw spinach.'),
  'kidney beans':m('13-660','Beans, red kidney, canned in water, re-heated, drained',100,8.6,15.1,1,6.8,'Drained canned red-kidney beans used for the authored ready-to-use ingredient.'),
  'sweetcorn':m('13-529','Sweetcorn kernels, canned in water, drained',78,2.6,13.9,1.7,3.1,'Drained canned sweetcorn is used for the generic ready-to-use authored ingredient.'),
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
export function validateIndustrialRecipe(recipe){if(!recipe||!Array.isArray(recipe.ingredients)||!recipe.ingredients.length)return{recipe,validated:false,reason:'invalid_recipe'};const evidence=[];const totals=Object.fromEntries(NUTRIENTS.map(k=>[k,0]));for(const ingredient of recipe.ingredients){const mapping=MAP[ingredient.item];if(!mapping)return{recipe,validated:false,reason:`unmapped:${ingredient.item}`};const gram_equivalent=grams(ingredient.amount,ingredient.item);if(!Number.isFinite(gram_equivalent)||gram_equivalent<=0)return{recipe,validated:false,reason:`amount:${ingredient.item}:${ingredient.amount}`};const ev={item:ingredient.item,recipe_amount:ingredient.amount,gram_equivalent,...mapping};evidence.push(ev);for(const key of NUTRIENTS)totals[key]+=Number(mapping.per_100g[key])*gram_equivalent/100}const servings=Math.max(1,Number(recipe.servings)||1);const per=Object.fromEntries(NUTRIENTS.map(k=>[k,round1(totals[k]/servings)]));const blockers=(recipe.review?.blockers||[]).filter(x=>x!=='nutrition_validation');return{validated:true,recipe:{...recipe,nutrition:{status:'validated',methodology:METHOD,dataset_version:DATASET.version,dataset_source_url:DATASET.source_url,validated_at:'2026-08-12',precision_note:PRECISION,...per,ingredient_evidence:evidence},review:{...(recipe.review||{}),status:'draft',blockers}},evidence}}
export function validateIndustrialRecipes(recipes){const output=[],failures=[];let validated=0;for(const recipe of recipes||[]){const r=validateIndustrialRecipe(recipe);output.push(r.recipe);if(r.validated)validated++;else failures.push({id:recipe?.id,reason:r.reason})}return{recipes:output,metrics:{authored:output.length,nutritionValidated:validated,remaining:output.length-validated,dataset:DATASET.version,methodology:METHOD},failures}}
export const industrialCofidDataset=DATASET;
