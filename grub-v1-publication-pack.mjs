import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {assertPublishableStructuredContent} from './structured-content-v1.js';

const decisionsFile=process.env.GRUB_DECISIONS_FILE||process.argv[2];
const outDir=process.env.GRUB_PUBLICATION_DIR||'grub-publication-evidence';
if(!decisionsFile)throw new Error('GRUB_DECISIONS_FILE (or argv[2]) is required');
fs.mkdirSync(outDir,{recursive:true});

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shift-grub-v1-publication-'));
execFileSync(process.execPath,['grub-editorial-review-surface.mjs'],{stdio:'inherit',env:{...process.env,REVIEW_PACK_DIR:dir}});
const pack=JSON.parse(fs.readFileSync(path.join(dir,'grub-second-person-review-pack.json'),'utf8'));
const launch=JSON.parse(fs.readFileSync(path.join(dir,'grub-v1-launch-cohort.json'),'utf8'));
const supplied=JSON.parse(fs.readFileSync(decisionsFile,'utf8'));
const requiredRecipes=Number(launch?.summary?.requiredRecipes||0);
const requiredDecisions=Number(launch?.summary?.requiredTemplateDecisions||0);

if(supplied?.proof!=='M11_SECOND_PERSON_DECISIONS')throw new Error('decision payload proof marker invalid');
if(Number(supplied?.source_summary?.requiredRecipes)!==requiredRecipes)throw new Error(`decision payload recipe count ${supplied?.source_summary?.requiredRecipes} does not match regenerated launch manifest ${requiredRecipes}`);
if(Number(supplied?.source_summary?.requiredTemplateDecisions)!==requiredDecisions)throw new Error('decision payload decision count does not match regenerated launch manifest');
const selected=new Set(launch.templateDigests||[]),launchIds=new Set(launch.recipeIds||[]);
if(requiredDecisions!==8||selected.size!==8)throw new Error(`regenerated V1 decision invariant failed: summary ${requiredDecisions} / digests ${selected.size}`);
if(!(requiredRecipes>0)||launchIds.size!==requiredRecipes)throw new Error(`regenerated V1 recipe invariant failed: summary ${requiredRecipes} / unique ids ${launchIds.size}`);

const decisions=Array.isArray(supplied.decisions)?supplied.decisions:[];
if(decisions.length!==requiredDecisions)throw new Error(`all ${requiredDecisions} V1 decisions are required together; got ${decisions.length}`);
const byDigest=new Map();
for(const d of decisions){
  const digest=String(d?.template_digest||'');
  const decision=String(d?.decision||'').toUpperCase();
  if(!selected.has(digest))throw new Error(`decision digest is not in regenerated V1 cohort: ${digest}`);
  if(byDigest.has(digest))throw new Error(`duplicate decision digest: ${digest}`);
  if(!['PASS','FIX','REJECT'].includes(decision))throw new Error(`invalid decision for ${digest}: ${decision}`);
  if(decision!=='PASS'&&!String(d?.note||'').trim())throw new Error(`${decision} requires reviewer note for ${digest}`);
  byDigest.set(digest,{...d,decision});
}
if(byDigest.size!==requiredDecisions)throw new Error(`decision set does not cover all ${requiredDecisions} immutable V1 digests`);

const families=new Map(pack.templateFamilies.map(f=>[f.template_digest,f]));
const reviewableById=new Map(pack.reviewable.map(r=>[r.id,r]));
const approvedSources=[],held=[];
for(const digest of launch.templateDigests){
  const family=families.get(digest);if(!family)throw new Error(`selected family missing after regeneration: ${digest}`);
  const decision=byDigest.get(digest);if(!decision)throw new Error(`decision missing after validation: ${digest}`);
  const descendants=pack.reviewable.filter(r=>r.template_key===family.template_key);
  for(const r of descendants){
    if(!launchIds.has(r.id))throw new Error(`family descendant escaped V1 launch binding: ${r.id}`);
    if(decision.decision!=='PASS')held.push({id:r.id,template_digest:digest,decision:decision.decision,note:String(decision.note||'').trim()});
    else approvedSources.push({source:r,template_digest:digest});
  }
}

const approvedIds=new Set(approvedSources.map(x=>x.source.id)),heldIds=new Set(held.map(x=>x.id));
if(approvedIds.size+heldIds.size!==requiredRecipes)throw new Error(`decision propagation does not reconcile to launch manifest ${requiredRecipes}: ${approvedIds.size}+${heldIds.size}`);
if([...approvedIds].some(id=>heldIds.has(id)))throw new Error('recipe is simultaneously approved and held');
if([...approvedIds,...heldIds].some(id=>!launchIds.has(id)))throw new Error('publication pack contains recipe outside immutable V1 cohort');

// Decision gating happens before publication-record validation. This guarantees a
// FIX/REJECT produces a finite hold summary and no partial publishable payload,
// rather than allowing an unrelated serializer check to obscure the human hold.
if(held.length){
  const summary={proof:'M11_V1_PUBLICATION_PACK_V1',decisionCount:byDigest.size,boundRecipes:requiredRecipes,approvedRecipes:approvedIds.size,heldRecipes:held.length,publicationByMeal:null,allPass:false,publicationReady:false,criterion:`Publication payload exists only when all ${requiredDecisions} immutable family decisions PASS; any FIX/REJECT fails the ${requiredRecipes}-recipe regenerated launch publication closed.`};
  fs.writeFileSync(path.join(outDir,'grub-v1-publication-summary.json'),JSON.stringify(summary,null,2));
  fs.writeFileSync(path.join(outDir,'grub-v1-held.json'),JSON.stringify(held,null,2));
  const payload=path.join(outDir,'grub-v1-publishable.json');if(fs.existsSync(payload))fs.unlinkSync(payload);
  console.error(JSON.stringify(summary,null,2));
  throw new Error(`V1 publication held: ${held.length} descendants are behind FIX/REJECT decisions; no partial launch payload emitted`);
}

const items=[];
for(const {source,template_digest:digest} of approvedSources){
  const canonical=reviewableById.get(source.id);if(!canonical)throw new Error(`bound descendant missing from reviewable catalogue: ${source.id}`);
  const item={id:canonical.id,contentType:'recipe',title:canonical.title,status:'published',data:{meal_type:canonical.meal_type,servings:Number(canonical.servings||1),equipment:canonical.equipment||[],storage:canonical.storage||null,shift_says:canonical.shift_says||null,nutrition:{status:'validated',...canonical.nutrition,methodology:'CoFID 2021 ingredient-level weighted calculation'},ingredients:canonical.ingredients,method:canonical.method,allergens:canonical.allergens||[],food_safety:canonical.food_safety,ingredient_evidence:canonical.ingredient_evidence,canonical_review:{template_digest:digest}},review:{status:'approved',scope:'canonical_family',template_digest:digest,decision_source:'M11_SECOND_PERSON_DECISIONS'}};
  assertPublishableStructuredContent(item);
  items.push(item);
}

const mealTypes=['breakfast','lunch','dinner','snack'];
const publicationByMeal=Object.fromEntries(mealTypes.map(type=>[type,items.filter(x=>x.data.meal_type===type).length]));
for(const type of mealTypes){
  const expected=Number(launch?.summary?.selectedByMeal?.[type]||0);
  if(publicationByMeal[type]!==expected)throw new Error(`publication ${type} runtime partition ${publicationByMeal[type]} does not match accepted launch manifest ${expected}`);
}
if(items.some(x=>!mealTypes.includes(x.data.meal_type)))throw new Error('publication payload contains recipe without runtime-addressable meal_type');
if(items.length!==requiredRecipes)throw new Error(`all-PASS publication item count ${items.length} does not match launch manifest ${requiredRecipes}`);

const summary={proof:'M11_V1_PUBLICATION_PACK_V1',decisionCount:byDigest.size,boundRecipes:requiredRecipes,approvedRecipes:items.length,heldRecipes:0,publicationByMeal,allPass:true,publicationReady:true,criterion:`Publication payload exists only when all ${requiredDecisions} immutable family decisions PASS; any FIX/REJECT fails the ${requiredRecipes}-recipe regenerated launch publication closed. Every published descendant also retains the accepted meal_type required by the live structured Grub selector.`};
fs.writeFileSync(path.join(outDir,'grub-v1-publication-summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(outDir,'grub-v1-held.json'),'[]\n');
fs.writeFileSync(path.join(outDir,'grub-v1-publishable.json'),JSON.stringify({proof:'M11_V1_PUBLISHABLE_CONTENT_V1',source_summary:{requiredRecipes,requiredTemplateDecisions:requiredDecisions,selectedByMeal:publicationByMeal},items},null,2));
console.log(JSON.stringify(summary,null,2));
console.log(`PASS M11 V1 publication pack: ${requiredDecisions} immutable PASS decisions generate exactly ${requiredRecipes} regenerated publishable reviewed+validated, runtime-addressable recipe records; any non-PASS decision fails closed before partial publication.`);
