import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildIndustrialCatalogue} from './industrial-catalogue-v9.js';
import {APPROVED,grams} from './industrial-grub-systemic-v3.mjs';

const index=JSON.parse(fs.readFileSync(process.env.COFID_INDEX||'/tmp/cofid-index.json','utf8'));
const foods=new Map((index.foods||[]).map(food=>[String(food.code),food]));
const nutrients=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];
const round=n=>Math.round((Number(n)+Number.EPSILON)*10)/10;
const normalise=x=>String(x||'').replace(/\s+/g,' ').trim();
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function calculate(recipe){
  const evidence=[];
  const totals=Object.fromEntries(nutrients.map(key=>[key,0]));
  for(const ingredient of recipe.ingredients||[]){
    const mapping=APPROVED[ingredient.item];
    const weight=grams(ingredient.amount,ingredient.item);
    const food=mapping?foods.get(String(mapping.code)):null;
    if(!mapping||!food||!(weight>0))return {eligible:false,reason:`mapping_or_quantity:${ingredient.item}:${ingredient.amount}`};
    for(const key of nutrients){
      const value=Number(food[key]);
      if(!Number.isFinite(value))return {eligible:false,reason:`nutrition_data:${ingredient.item}:${key}`};
      totals[key]+=value*weight/100;
    }
    evidence.push({item:ingredient.item,amount:ingredient.amount,grams:round(weight),cofid_code:food.code,cofid_name:food.name,mapping_state:mapping.state,mapping_confidence:mapping.confidence,mapping_basis:mapping.basis,...(mapping.limitation?{mapping_limitation:mapping.limitation}:{})});
  }
  const servings=Math.max(1,Number(recipe.servings)||1);
  const nutrition=Object.fromEntries(nutrients.map(key=>[key,round(totals[key]/servings)]));
  const suspicious=nutrition.kcal<80||nutrition.kcal>1800||nutrition.protein_g<0||nutrition.protein_g>150||nutrition.fat_g>160||nutrition.carbohydrate_g>250;
  const safety=!(recipe.food_safety?.length>=2&&recipe.method?.length>=4);
  if(suspicious)return {eligible:false,reason:'nutrition_outlier',nutrition};
  if(safety)return {eligible:false,reason:'food_safety_structure',nutrition};
  return {eligible:true,nutrition,evidence};
}

function familyKey(recipe){
  const equipment=(recipe.equipment||[]).map(normalise).sort().join('+')||'none';
  const tags=(recipe.tags||[]).map(normalise).filter(Boolean).sort().slice(0,5).join('+')||'untagged';
  const methodShape=(recipe.method||[]).map(step=>normalise(step).replace(/\d+(?:\.\d+)?/g,'#')).join('|');
  return `${recipe.meal_type||'unknown'}|${equipment}|${tags}|${hash(methodShape).slice(0,10)}`;
}

const catalogue=buildIndustrialCatalogue().recipes;
const reviewable=[];
const quarantine=[];
for(const recipe of catalogue){
  const calculated=calculate(recipe);
  if(!calculated.eligible){quarantine.push({id:recipe.id,title:recipe.title,reason:calculated.reason});continue}
  const decisionContent={
    title:recipe.title,
    meal_type:recipe.meal_type,
    servings:recipe.servings,
    prep_minutes:recipe.prep_minutes,
    cook_minutes:recipe.cook_minutes,
    ingredients:recipe.ingredients,
    method:recipe.method,
    equipment:recipe.equipment,
    allergens:recipe.allergens,
    substitutions:recipe.substitutions,
    storage:recipe.storage,
    food_safety:recipe.food_safety,
    nutrition:calculated.nutrition
  };
  reviewable.push({
    id:recipe.id,
    title:recipe.title,
    meal_type:recipe.meal_type,
    family_key:familyKey(recipe),
    content_hash:hash(decisionContent),
    review_status:'decision_required',
    allowed_decisions:['approve','fix','reject'],
    unlocks:1,
    ...decisionContent,
    ingredient_evidence:calculated.evidence,
    authoring_provenance:recipe.provenance||{},
    existing_blockers:recipe.review?.blockers||[]
  });
}

const familyCounts=new Map();
for(const item of reviewable)familyCounts.set(item.family_key,(familyCounts.get(item.family_key)||0)+1);
for(const item of reviewable)item.family_unlock_count=familyCounts.get(item.family_key)||1;
reviewable.sort((a,b)=>b.family_unlock_count-a.family_unlock_count||a.meal_type.localeCompare(b.meal_type)||a.title.localeCompare(b.title));

const duplicateHashes=[...reviewable.reduce((m,x)=>{m.set(x.content_hash,(m.get(x.content_hash)||[]).concat(x.id));return m},new Map())].filter(([,ids])=>ids.length>1);
const missingSecondPersonBarrier=reviewable.filter(x=>!x.existing_blockers.includes('second_person_content_review'));
const summary={
  proof:'M11_SECOND_PERSON_REVIEW_PACK',
  generated_at:'2026-08-13',
  catalogue:catalogue.length,
  reviewable_low_risk:reviewable.length,
  quarantined:quarantine.length,
  review_families:familyCounts.size,
  duplicate_content_hashes:duplicateHashes.length,
  missing_second_person_barrier:missingSecondPersonBarrier.length,
  policy:'This pack does not approve or publish content. A reviewer independent of the authoring decision must inspect each decision or governed family sample and record approve/fix/reject against the immutable content hash before publication eligibility.'
};

if(catalogue.length!==2876)throw new Error(`expected 2,876 industrial recipes, got ${catalogue.length}`);
if(reviewable.length<2800)throw new Error(`review pack regressed below 2,800 LOW-risk nutrition-valid recipes: ${reviewable.length}`);
if(duplicateHashes.length)throw new Error(`review pack contains ${duplicateHashes.length} duplicate immutable content hashes`);
if(missingSecondPersonBarrier.length)throw new Error(`${missingSecondPersonBarrier.length} reviewable recipes lost second_person_content_review barrier`);

const outDir=process.env.REVIEW_PACK_DIR||'review-evidence';
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'grub-second-person-review-pack.json'),JSON.stringify({summary,reviewable,quarantine},null,2));
const topFamilies=[...familyCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30);
const md=[
  '# Grub second-person review pack',
  '',
  `Catalogue: ${summary.catalogue}`,
  `Reviewable LOW-risk nutrition-valid: ${summary.reviewable_low_risk}`,
  `Quarantined: ${summary.quarantined}`,
  `Review families: ${summary.review_families}`,
  '',
  '## Review rule',
  summary.policy,
  '',
  'Approval must be recorded against the immutable `content_hash`. Any content edit changes the hash and requires re-review. Canonical nutrition governance is evidence, not content-review approval.',
  '',
  '## Highest-volume review families',
  ...topFamilies.map(([key,count])=>`- ${count} recipes — ${key}`),
  '',
  '## Decision workflow',
  '1. Inspect title, exact ingredients/amounts, method, food-safety guidance, allergens and calculated nutrition.',
  '2. Record `approve`, `fix` or `reject` against the immutable content hash.',
  '3. `fix` and `reject` remain unpublished. Any fixed content receives a new hash and must be reviewed again.',
  '4. Publication remains separately gated by structured-content publication rules.',
  ''
].join('\n');
fs.writeFileSync(path.join(outDir,'grub-second-person-review-pack.md'),md);
console.log(JSON.stringify(summary,null,2));
console.log(`PASS M11 second-person review-pack preparation: ${reviewable.length}/${catalogue.length} LOW-risk nutrition-valid recipes are packaged for independent content review without weakening the publication barrier; ${quarantine.length} remain quarantined.`);
