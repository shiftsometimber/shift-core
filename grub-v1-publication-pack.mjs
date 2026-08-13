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

if(supplied?.proof!=='M11_SECOND_PERSON_DECISIONS')throw new Error('decision payload proof marker invalid');
if(Number(supplied?.source_summary?.requiredRecipes)!==783)throw new Error('decision payload is not bound to the 783-recipe V1 cohort');
const selected=new Set(launch.templateDigests||[]),launchIds=new Set(launch.recipeIds||[]);
if(selected.size!==8||launchIds.size!==783)throw new Error(`regenerated V1 cohort invariant failed: ${selected.size} decisions / ${launchIds.size} recipes`);

const decisions=Array.isArray(supplied.decisions)?supplied.decisions:[];
if(decisions.length!==8)throw new Error(`all 8 V1 decisions are required together; got ${decisions.length}`);
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
if(byDigest.size!==8)throw new Error('decision set does not cover all 8 immutable V1 digests');

const families=new Map(pack.templateFamilies.map(f=>[f.template_digest,f]));
const reviewableById=new Map(pack.reviewable.map(r=>[r.id,r]));
const items=[],held=[];
for(const digest of launch.templateDigests){
  const family=families.get(digest);if(!family)throw new Error(`selected family missing after regeneration: ${digest}`);
  const decision=byDigest.get(digest);if(!decision)throw new Error(`decision missing after validation: ${digest}`);
  const descendants=pack.reviewable.filter(r=>r.template_key===family.template_key);
  for(const r of descendants){
    if(!launchIds.has(r.id))throw new Error(`family descendant escaped V1 launch binding: ${r.id}`);
    if(decision.decision!=='PASS'){
      held.push({id:r.id,template_digest:digest,decision:decision.decision,note:String(decision.note||'').trim()});
      continue;
    }
    const source=reviewableById.get(r.id);if(!source)throw new Error(`bound descendant missing from reviewable catalogue: ${r.id}`);
    const item={
      id:source.id,
      contentType:'recipe',
      title:source.title,
      status:'published',
      data:{
        nutrition:{status:'validated',...source.nutrition,methodology:'CoFID 2021 ingredient-level weighted calculation'},
        ingredients:source.ingredients,
        method:source.method,
        allergens:source.allergens||[],
        food_safety:source.food_safety,
        ingredient_evidence:source.ingredient_evidence,
        canonical_review:{template_digest:digest}
      },
      review:{status:'approved',scope:'canonical_family',template_digest:digest,decision_source:'M11_SECOND_PERSON_DECISIONS'}
    };
    assertPublishableStructuredContent(item);
    items.push(item);
  }
}

const approvedIds=new Set(items.map(x=>x.id)),heldIds=new Set(held.map(x=>x.id));
if(approvedIds.size+heldIds.size!==783)throw new Error(`decision propagation does not reconcile to 783: ${approvedIds.size}+${heldIds.size}`);
if([...approvedIds].some(id=>heldIds.has(id)))throw new Error('recipe is simultaneously approved and held');
if([...approvedIds,...heldIds].some(id=>!launchIds.has(id)))throw new Error('publication pack contains recipe outside immutable V1 cohort');

const allPass=held.length===0&&items.length===783;
const summary={proof:'M11_V1_PUBLICATION_PACK_V1',decisionCount:byDigest.size,approvedRecipes:items.length,heldRecipes:held.length,allPass,publicationReady:allPass,criterion:'Publication payload exists only when all 8 immutable family decisions PASS; any FIX/REJECT fails the 783-recipe launch publication closed.'};
fs.writeFileSync(path.join(outDir,'grub-v1-publication-summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(outDir,'grub-v1-held.json'),JSON.stringify(held,null,2));
if(!allPass){
  const payload=path.join(outDir,'grub-v1-publishable.json');if(fs.existsSync(payload))fs.unlinkSync(payload);
  console.error(JSON.stringify(summary,null,2));
  throw new Error(`V1 publication held: ${held.length} descendants are behind FIX/REJECT decisions; no partial launch payload emitted`);
}
fs.writeFileSync(path.join(outDir,'grub-v1-publishable.json'),JSON.stringify({proof:'M11_V1_PUBLISHABLE_CONTENT_V1',items},null,2));
console.log(JSON.stringify(summary,null,2));
console.log('PASS M11 V1 publication pack: 8 immutable PASS decisions generate exactly 783 publishable reviewed+validated recipe records; any non-PASS decision fails closed before partial publication.');
