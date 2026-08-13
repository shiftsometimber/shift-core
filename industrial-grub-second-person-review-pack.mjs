import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {buildIndustrialCatalogue} from './industrial-catalogue-v11.js';
import {APPROVED,grams} from './industrial-grub-systemic-v3.mjs';
import {editorialSemanticIssues} from './industrial-grub-semantic-quality-v1.mjs';

const index=JSON.parse(fs.readFileSync(process.env.COFID_INDEX||'/tmp/cofid-index.json','utf8'));
const foods=new Map((index.foods||[]).map(food=>[String(food.code),food]));
const nutrients=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];
const round=n=>Math.round((Number(n)+Number.EPSILON)*10)/10;
const normalise=x=>String(x||'').toLowerCase().replace(/\s+/g,' ').trim();
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

function methodTemplate(recipe){
  let text=(recipe.method||[]).map(normalise).join('|');
  const ingredientNames=[...new Set((recipe.ingredients||[]).map(x=>normalise(x.item)).filter(Boolean))].sort((a,b)=>b.length-a.length);
  for(const ingredient of ingredientNames)text=text.split(ingredient).join('{ingredient}');
  return text.replace(/\b\d+(?:\.\d+)?\b/g,'#');
}
function templateKey(recipe){
  const equipment=(recipe.equipment||[]).map(normalise).sort().join('+')||'none';
  return `${recipe.meal_type||'unknown'}|${equipment}|${(recipe.ingredients||[]).length}|${hash(methodTemplate(recipe)).slice(0,12)}`;
}

const catalogue=buildIndustrialCatalogue().recipes;
const reviewable=[];
const nutritionQuarantine=[];
const editorialQuarantine=[];
let nutritionValid=0;
for(const recipe of catalogue){
  const calculated=calculate(recipe);
  if(!calculated.eligible){nutritionQuarantine.push({id:recipe.id,title:recipe.title,reason:calculated.reason});continue}
  nutritionValid++;
  const semanticIssues=editorialSemanticIssues(recipe);
  if(semanticIssues.length){
    editorialQuarantine.push({id:recipe.id,title:recipe.title,issues:semanticIssues,nutrition:calculated.nutrition,existing_blockers:recipe.review?.blockers||[]});
    continue;
  }
  const decisionContent={title:recipe.title,meal_type:recipe.meal_type,servings:recipe.servings,prep_minutes:recipe.prep_minutes,cook_minutes:recipe.cook_minutes,ingredients:recipe.ingredients,method:recipe.method,equipment:recipe.equipment,allergens:recipe.allergens,substitutions:recipe.substitutions,storage:recipe.storage,food_safety:recipe.food_safety,nutrition:calculated.nutrition};
  reviewable.push({id:recipe.id,title:recipe.title,meal_type:recipe.meal_type,template_key:templateKey(recipe),method_template:methodTemplate(recipe),content_hash:hash(decisionContent),review_status:'decision_required',allowed_decisions:['approve','fix','reject'],...decisionContent,ingredient_evidence:calculated.evidence,authoring_provenance:recipe.provenance||{},existing_blockers:recipe.review?.blockers||[]});
}

const grouped=new Map();
for(const item of reviewable){const xs=grouped.get(item.template_key)||[];xs.push(item);grouped.set(item.template_key,xs)}
const templateFamilies=[...grouped.entries()].map(([key,items])=>{
  items.sort((a,b)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
  const contentHashes=items.map(x=>x.content_hash).sort();
  const representativeIndexes=[0,Math.floor((items.length-1)/2),items.length-1];
  const representatives=[...new Set(representativeIndexes)].map(i=>items[i]).map(x=>({id:x.id,title:x.title,content_hash:x.content_hash,ingredients:x.ingredients,method:x.method,nutrition:x.nutrition,allergens:x.allergens,food_safety:x.food_safety}));
  return{template_key:key,template_digest:hash({key,contentHashes}),descendant_count:items.length,meal_type:items[0]?.meal_type,equipment:items[0]?.equipment||[],method_template:items[0]?.method_template,titles:items.map(x=>x.title),content_hashes:contentHashes,representatives,reviewer_scope_rule:'Template-level approval is permitted only when the reviewer explicitly approves this immutable template digest after checking the representatives and full title/variant list. Any descendant content change changes a content hash and therefore the template digest.'};
}).sort((a,b)=>b.descendant_count-a.descendant_count||String(a.template_key).localeCompare(String(b.template_key)));
const familyCountByKey=new Map(templateFamilies.map(x=>[x.template_key,x.descendant_count]));
for(const item of reviewable)item.template_unlock_count=familyCountByKey.get(item.template_key)||1;
reviewable.sort((a,b)=>b.template_unlock_count-a.template_unlock_count||a.meal_type.localeCompare(b.meal_type)||a.title.localeCompare(b.title));

const duplicateHashes=[...reviewable.reduce((m,x)=>{m.set(x.content_hash,(m.get(x.content_hash)||[]).concat(x.id));return m},new Map())].filter(([,ids])=>ids.length>1);
const missingSecondPersonBarrier=reviewable.filter(x=>!x.existing_blockers.includes('second_person_content_review'));
const missingSemanticBarrier=editorialQuarantine.filter(x=>!x.existing_blockers.includes('editorial_semantic_review'));
const issueCounts={};
for(const item of editorialQuarantine)for(const issue of item.issues)issueCounts[issue.code]=(issueCounts[issue.code]||0)+1;
const summary={proof:'M11_SECOND_PERSON_REVIEW_PACK',generated_at:'2026-08-13',catalogue:catalogue.length,nutrition_valid:nutritionValid,nutrition_quarantined:nutritionQuarantine.length,editorial_ready:reviewable.length,editorial_quarantined:editorialQuarantine.length,editorial_issue_counts:issueCounts,canonical_review_templates:templateFamilies.length,largest_template_unlock:templateFamilies[0]?.descendant_count||0,duplicate_content_hashes:duplicateHashes.length,missing_second_person_barrier:missingSecondPersonBarrier.length,missing_editorial_semantic_barrier:missingSemanticBarrier.length,policy:'Nutrition validity is not editorial approval. Obvious combinatorial semantic mismatches are quarantined before independent review. A reviewer independent of authoring must record approve/fix/reject against an immutable recipe content hash or canonical template digest. Quarantined recipes require rebuild or explicit editorial resolution before they can re-enter review.'};

if(catalogue.length!==2876)throw new Error(`expected 2,876 industrial recipes, got ${catalogue.length}`);
if(nutritionValid!==2876)throw new Error(`expected all 2,876 recipes to remain nutrition-valid, got ${nutritionValid}`);
if(nutritionQuarantine.length!==0)throw new Error(`expected zero nutrition quarantine, got ${nutritionQuarantine.length}`);
if(reviewable.length<2500)throw new Error(`editorial-ready cohort fell below 2,500 short-term floor: ${reviewable.length}`);
if(reviewable.length+editorialQuarantine.length!==2876)throw new Error('editorial partition does not reconcile to catalogue');
if(templateFamilies.length>140)throw new Error(`canonical review compression regressed above 140 templates: ${templateFamilies.length}`);
if(duplicateHashes.length)throw new Error(`review pack contains ${duplicateHashes.length} duplicate immutable content hashes`);
if(missingSecondPersonBarrier.length)throw new Error(`${missingSecondPersonBarrier.length} reviewable recipes lost second_person_content_review barrier`);
if(missingSemanticBarrier.length)throw new Error(`${missingSemanticBarrier.length} editorial-quarantined recipes lost editorial_semantic_review barrier`);

const outDir=process.env.REVIEW_PACK_DIR||'review-evidence';
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'grub-second-person-review-pack.json'),JSON.stringify({summary,templateFamilies,reviewable,nutritionQuarantine,editorialQuarantine},null,2));
const md=['# Grub second-person review pack','',`Catalogue: ${summary.catalogue}`,`Nutrition-valid: ${summary.nutrition_valid}`,`Nutrition quarantine: ${summary.nutrition_quarantined}`,`Editorial-ready for independent review: ${summary.editorial_ready}`,`Editorial semantic quarantine: ${summary.editorial_quarantined}`,`Canonical review templates: ${summary.canonical_review_templates}`,`Largest single template unlock: ${summary.largest_template_unlock}`,'','## Review rule',summary.policy,'','## Canonical template queue — highest unlock first',...templateFamilies.map((family,index)=>`${index+1}. **${family.descendant_count} recipes** — \`${family.template_key}\` — digest \`${family.template_digest.slice(0,16)}…\` — representatives: ${family.representatives.map(x=>x.title).join(' / ')}`),'','## Editorial quarantine summary',...Object.entries(issueCounts).map(([key,value])=>`- ${key}: ${value}`),'','## Decision workflow','1. Review each editorial-ready canonical template from highest unlock down: method structure, representative ingredient/amount combinations, food-safety guidance, allergens, nutrition plausibility and the full title/variant list.','2. Record `approve`, `fix` or `reject` against the immutable `template_digest` (or an individual `content_hash` when an exception needs recipe-level treatment).','3. Semantic-quarantined objects do not enter the approval queue until rebuilt or explicitly resolved.','4. Publication remains separately gated; this pack itself can never publish.',''].join('\n');
fs.writeFileSync(path.join(outDir,'grub-second-person-review-pack.md'),md);
console.log(JSON.stringify(summary,null,2));
console.log(`PASS M11 independent-review preparation: ${nutritionValid}/${catalogue.length} remain nutrition-valid; ${reviewable.length} are editorial-ready and ${editorialQuarantine.length} obvious semantic cross-products are quarantined before independent review.`);