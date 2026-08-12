import fs from 'node:fs';
import path from 'node:path';

const readJson=(file)=>JSON.parse(fs.readFileSync(file,'utf8'));
const fail=(message)=>{throw new Error(message)};
const batches=fs.readdirSync('content/grub').filter(x=>/^batch-\d+\.json$/.test(x)).sort().flatMap(x=>readJson(path.join('content/grub',x)));
const manifest=readJson('content/grub/nutrition-validations-v1.json');
if(manifest?.schema_version!==1)fail('nutrition validation schema v1 required');
if(manifest?.dataset?.version!=='CoFID 2021')fail('CoFID 2021 dataset version required');
if(!String(manifest?.dataset?.source_url||'').startsWith('https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid'))fail('authoritative CoFID source URL required');
const byId=new Map(batches.map(x=>[x.id,x]));
const keys=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];
const round1=n=>Math.round((Number(n)+Number.EPSILON)*10)/10;
for(const validation of manifest.validations||[]){
  const recipe=byId.get(validation.recipe_id);if(!recipe)fail(`${validation.recipe_id}: validated recipe not found in authored catalogue`);
  if(validation.status!=='validated'||validation.methodology!=='CoFID 2021 ingredient-level weighted calculation')fail(`${recipe.id}: validation status/methodology invalid`);
  if(!validation.precision_note)fail(`${recipe.id}: member-facing precision note required`);
  if(!Array.isArray(validation.ingredient_evidence)||validation.ingredient_evidence.length!==recipe.ingredients.length)fail(`${recipe.id}: every authored ingredient must have validation evidence`);
  const evidenceByItem=new Map(validation.ingredient_evidence.map(x=>[x.item,x]));
  const totals=Object.fromEntries(keys.map(k=>[k,0]));
  for(const ingredient of recipe.ingredients){
    const ev=evidenceByItem.get(ingredient.item);if(!ev)fail(`${recipe.id}: no nutrition evidence for ${ingredient.item}`);
    if(ev.recipe_amount!==ingredient.amount)fail(`${recipe.id}: stale nutrition evidence amount for ${ingredient.item}`);
    if(!ev.cofid_code||!ev.cofid_name||!Number.isFinite(Number(ev.gram_equivalent))||Number(ev.gram_equivalent)<=0)fail(`${recipe.id}: incomplete CoFID mapping for ${ingredient.item}`);
    for(const key of keys){const value=Number(ev.per_100g?.[key]);if(!Number.isFinite(value)||value<0)fail(`${recipe.id}: invalid ${key} for ${ingredient.item}`);totals[key]+=value*Number(ev.gram_equivalent)/100;}
  }
  for(const key of keys){const calculated=round1(totals[key]/Number(recipe.servings));const declared=round1(validation.per_serving?.[key]);if(!Number.isFinite(declared)||Math.abs(calculated-declared)>0.1)fail(`${recipe.id}: ${key} mismatch calculated=${calculated} declared=${declared}`);}
}
const validated=(manifest.validations||[]).length;
console.log(JSON.stringify({dataset:manifest.dataset.version,authored:batches.length,nutritionValidated:validated,remaining:batches.length-validated,validatedRecipes:(manifest.validations||[]).map(x=>x.recipe_id)},null,2));
console.log(`PASS M11 ingredient-level nutrition evidence for ${validated}/${batches.length} structured Grub recipes; unvalidated recipes remain blocked from publication`);
