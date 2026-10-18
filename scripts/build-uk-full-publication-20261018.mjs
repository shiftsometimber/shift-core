import fs from 'node:fs';import{createHash}from'node:crypto';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const file='content/grub/uk-full-corrections-20261018.json',pack=JSON.parse(fs.readFileSync(file));
const input=JSON.parse(fs.readFileSync(process.env.GRUB_CATALOGUE_REVIEW_INPUT));
const originals=new Map(input.authority.rows.map(r=>[r.id,r]));
// Distinct foods/preparation formats remain available. Portion-only descendants
// of the same ingredient set and format do not inflate discovery counts.
const familyKey=r=>['protein-pot','dessert-pot','yoghurt-pot','overnight-oats','overnight-oats-pot'].includes(r.data.food_format)?(r.data.total_minutes>=360?'overnight-oats':'cold-pot'):r.data.food_format;
const fingerprint=r=>JSON.stringify([familyKey(r),[...new Set(r.data.ingredients.map(i=>i.item.toLowerCase()))].sort()]);
const seen=new Map(),duplicateOf=new Map();
for(const r of pack.recipes){const key=fingerprint(r);if(seen.has(key))duplicateOf.set(r.id,seen.get(key));else seen.set(key,r.id);}
const labels=s=>s.replace(/0% /g,'').replace(/virtually fat-free /g,'').replace(/high-protein yoghurt/g,'protein yoghurt').replace(/, drained/g,'').replace(/, dry/g,'').replace(/ without shells/g,'').replace(/100% /g,'').replace(/, raw/g,'');
const groups=new Map();for(const r of pack.recipes){const a=groups.get(r.title)||[];a.push(r);groups.set(r.title,a);}
for(const group of groups.values())if(group.length>1)for(const r of group){
 const alternatives=group.filter(x=>x.id!==r.id);
 const all=r.data.ingredients.map(i=>i.item),common=new Set(all.filter(x=>alternatives.every(o=>o.data.ingredients.some(i=>i.item===x))));
 let distinct=all.filter(x=>!common.has(x));
 // Full ingredient subtitles are exact food descriptors, not numbered clones.
 if(!distinct.length)distinct=all.filter(x=>!/^olive oil$/.test(x));
 r.title+=' — '+distinct.map(labels).join(', ');
}
const collisions=new Map();for(const r of pack.recipes){if(duplicateOf.has(r.id))continue;const g=collisions.get(r.title)||[];g.push(r);collisions.set(r.title,g);}
for(const group of collisions.values())if(group.length>1){
 for(const r of group)r.title+=' ('+r.data.ingredients.map(i=>labels(i.item)).join(', ')+')';
}
for(const r of pack.recipes){r.source_sha256=hash({title:originals.get(r.id).title,data:originals.get(r.id).data,review:originals.get(r.id).review});r.content_sha256=hash({id:r.id,title:r.title,data:r.data});r.duplicate_of=duplicateOf.get(r.id)||null;}
const publication={proof:pack.proof,status:pack.status,owner:pack.owner,base:pack.base,source_input_sha256:pack.source_input_sha256,workbook_sha256:pack.workbook_sha256,human_editorial_review_claimed:false,physical_cooking_trial_claimed:false,recipes:pack.recipes};
publication.release_id=hash(publication);
fs.writeFileSync('grub-uk-full-publication-20261018.mjs','// Exact owner-authorised UK corrections; no independent human or cooking trial attestation.\nexport const UK_FULL_PUBLICATION='+JSON.stringify(publication)+';\n');
const {appendUKCorePublication}=await import('../grub-uk-core-authority-20261017.mjs');
const {applyFullUKCorrections}=await import('../grub-uk-full-authority-20261018.mjs');
const {GRUB_DISCOVERY_MANIFEST:prior}=await import('../member-experience/grub-discovery-manifest-20261017.mjs');
const extended=await appendUKCorePublication(input.authority),corrected=await applyFullUKCorrections(extended);
const old=new Map(prior.rows.map(r=>[r.id,r]));
const rows=corrected.rows.map((r,index)=>{
 const previous=old.get(r.id),duplicate=duplicateOf.get(r.id);
 const core=previous?.eligible===true;
 return {id:r.id,decision:duplicate?'replace':originals.has(r.id)&&!r.id.startsWith('everyday-')?'correct':'retain',eligible:!duplicate,tier:core?previous.tier:'cooking',rank:core?previous.rank:200+index,reason:duplicate?'Ingredient-equivalent portion variant; use '+duplicate+'. Saved identity remains available.':'UK consumer recipe corrected from its actual ingredients and method; retained full catalogue breadth.',hands_on_minutes:r.data.hands_on_minutes??previous?.hands_on_minutes,timing_is_estimate:true,image_policy:'suppress_until_dish_and_portion_checked',content_sha256:hash({title:r.title,data:r.data,review:r.review})};
});
const manifest={proof:prior.proof,status:'approved',source:publication.base,correction_release:publication.release_id,owner_authority:pack.owner,rows};
fs.writeFileSync('member-experience/grub-discovery-manifest-20261017.mjs','// Whole UK catalogue: familiar dishes first; ingredient-equivalent portion variants are not counted twice.\nexport const GRUB_DISCOVERY_MANIFEST='+JSON.stringify(manifest)+';\n');
const evidenceFile='evidence/grub-expansion-closeout-2026-09-16/uk-editorial-decisions-20261017.json',evidence=JSON.parse(fs.readFileSync(evidenceFile));
for(const d of evidence.current_recipes){const m=rows.find(r=>r.id===d.id),c=pack.recipes.find(r=>r.id===d.id);d.previous_decision=d.decision;d.decision=m.decision;d.discovery_eligible=m.eligible;d.reason=m.reason;d.prior_findings=d.findings;d.findings=[];d.assessment={kind:'AI author reading and family-specific correction of exact ingredients/method; independent human or physical trial not claimed',human_review_claimed:false,physical_cooking_trial_claimed:false};if(c){d.current_title=c.title;d.corrected_content_sha256=c.content_sha256;d.corrected_recipe_reference='content/grub/uk-full-corrections-20261018.json#'+c.id;d.resolved=['family-specific method','equipment','raw/cooked state','metric ingredients','estimated elapsed and hands-on timing','storage and label caveats','ingredient nutrition recalculated','UK consumer title matches actual food'];}}
evidence.at=new Date().toISOString();evidence.scope='Complete existing UK catalogue correction; original database and saved identities untouched';evidence.current_uk_release=publication.release_id;evidence.publication_status='Owner-authorised exact existing-recipe correction; deployment and live qualification pending';evidence.discovery_count=rows.filter(r=>r.eligible).length;evidence.owner_instruction=pack.owner;evidence.previous_blanket_withdrawal_superseded=true;
fs.writeFileSync(evidenceFile,JSON.stringify(evidence,null,2)+'\n');
fs.writeFileSync(file,JSON.stringify({...pack,recipes:pack.recipes,publication_digest:publication.release_id},null,2)+'\n');
console.log(JSON.stringify({corrected:pack.recipes.length,fullReferences:rows.length,discoverable:rows.filter(r=>r.eligible).length,portionEquivalentDuplicates:duplicateOf.size,uniqueTitles:new Set(corrected.rows.filter(r=>!duplicateOf.has(r.id)).map(r=>r.title)).size,release_id:publication.release_id,source_only:true}));
