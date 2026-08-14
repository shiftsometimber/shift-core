import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {assertPublishableStructuredContent} from './structured-content-v1.js';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shift-grub-v1-propagation-'));
execFileSync(process.execPath,['grub-editorial-review-surface.mjs'],{stdio:'inherit',env:{...process.env,REVIEW_PACK_DIR:dir}});
const pack=JSON.parse(fs.readFileSync(path.join(dir,'grub-second-person-review-pack.json'),'utf8'));
const launch=JSON.parse(fs.readFileSync(path.join(dir,'grub-v1-launch-cohort.json'),'utf8'));
const selected=new Set(launch.templateDigests||[]),launchIds=new Set(launch.recipeIds||[]);
const requiredRecipes=Number(launch?.summary?.requiredRecipes||0);
if(selected.size!==8)throw new Error(`expected 8 immutable V1 decisions, got ${selected.size}`);
if(!(requiredRecipes>0)||launchIds.size!==requiredRecipes)throw new Error(`launch manifest count mismatch: summary ${requiredRecipes} / unique descendants ${launchIds.size}`);

const families=new Map(pack.templateFamilies.map(f=>[f.template_digest,f]));
const reviewableById=new Map(pack.reviewable.map(r=>[r.id,r]));
const familyIds=new Map();
for(const digest of selected){
  const family=families.get(digest);if(!family)throw new Error(`selected digest absent from regenerated pack: ${digest}`);
  const ids=new Set(pack.reviewable.filter(r=>r.template_key===family.template_key).map(r=>r.id));
  familyIds.set(digest,ids);
}
const union=new Set([...familyIds.values()].flatMap(x=>[...x]));
if(union.size!==launchIds.size||[...union].some(id=>!launchIds.has(id)))throw new Error('launch recipe binding does not exactly equal selected immutable families');

function apply(decisions){
  if(!Array.isArray(decisions)||decisions.length!==selected.size)throw new Error('all 8 V1 decisions are required as one immutable decision set');
  const byDigest=new Map();
  for(const d of decisions){
    if(!selected.has(d.template_digest))throw new Error(`decision digest is not in regenerated V1 pack: ${d.template_digest}`);
    if(byDigest.has(d.template_digest))throw new Error(`duplicate decision digest: ${d.template_digest}`);
    if(!['PASS','FIX','REJECT'].includes(d.decision))throw new Error(`invalid decision ${d.decision}`);
    if(d.decision!=='PASS'&&!String(d.note||'').trim())throw new Error(`${d.decision} requires reviewer note`);
    byDigest.set(d.template_digest,d);
  }
  if(byDigest.size!==selected.size)throw new Error('decision set is incomplete');
  const approved=[],held=[];
  for(const [digest,ids] of familyIds){
    const decision=byDigest.get(digest);
    for(const id of ids){
      const r=reviewableById.get(id);if(!r)throw new Error(`bound descendant missing: ${id}`);
      if(decision.decision==='PASS'){
        const item={id:r.id,contentType:'recipe',title:r.title,status:'published',data:{nutrition:{status:'validated',...r.nutrition,methodology:'CoFID 2021 ingredient-level weighted calculation'},ingredients:r.ingredients,method:r.method,food_safety:r.food_safety,ingredient_evidence:r.ingredient_evidence,canonical_review:{template_digest:digest}},review:{status:'approved',scope:'canonical_family',template_digest:digest}};
        assertPublishableStructuredContent(item);approved.push(id);
      }else held.push({id,template_digest:digest,decision:decision.decision});
    }
  }
  return{approved,held};
}

const allPass=[...selected].map(template_digest=>({template_digest,decision:'PASS'}));
const passResult=apply(allPass);
if(passResult.approved.length!==requiredRecipes||passResult.held.length!==0)throw new Error(`all-PASS propagation did not unlock exact manifest descendants: ${passResult.approved.length}/${passResult.held.length}, expected ${requiredRecipes}`);

const first=allPass[0].template_digest,firstCount=familyIds.get(first).size;
const holdResult=apply(allPass.map(d=>d.template_digest===first?{...d,decision:'FIX',note:'bounded repair required'}:d));
if(holdResult.held.length!==firstCount)throw new Error(`FIX did not hold exact family descendants: ${holdResult.held.length}/${firstCount}`);
if(holdResult.approved.length!==requiredRecipes-firstCount)throw new Error('FIX leaked or over-held descendants outside exact family');

let rejectedMutation=false;try{apply(allPass.map((d,i)=>i?d:{...d,template_digest:d.template_digest.slice(0,-1)+(d.template_digest.endsWith('0')?'1':'0')}))}catch{rejectedMutation=true}
if(!rejectedMutation)throw new Error('mutated immutable digest was accepted');
let rejectedMissing=false;try{apply(allPass.slice(1))}catch{rejectedMissing=true}
if(!rejectedMissing)throw new Error('incomplete decision set was accepted');

console.log(JSON.stringify({proof:'M11_V1_DECISION_PROPAGATION_GATE_V1',decisions:selected.size,boundDescendants:launchIds.size,allPassApproved:passResult.approved.length,fixFamilyHeld:firstCount,mutationRejected:rejectedMutation,incompleteSetRejected:rejectedMissing},null,2));
console.log(`PASS M11 V1 propagation mechanism: 8 immutable decisions bind exactly ${requiredRecipes} regenerated descendants; PASS unlocks only bound validated recipes; FIX/REJECT hold their exact family; mutated/missing decision sets fail closed.`);
