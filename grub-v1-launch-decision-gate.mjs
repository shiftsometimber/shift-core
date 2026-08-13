import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const out=process.env.REVIEW_PACK_DIR||'review-evidence';
const decisionsFile=process.env.GRUB_V1_DECISIONS||'evidence/grub-v1-launch-decisions.json';
execFileSync(process.execPath,['grub-editorial-review-surface.mjs'],{stdio:'inherit',env:{...process.env,REVIEW_PACK_DIR:out}});
const cohort=JSON.parse(fs.readFileSync(`${out}/grub-v1-launch-cohort.json`,'utf8'));
if(cohort.summary.requiredRecipes!==783||cohort.summary.requiredTemplateDecisions!==8)throw new Error('Grub launch cohort identity changed; regenerate acceptance pack');
if(!fs.existsSync(decisionsFile)){console.log('READY Grub human acceptance: 783 recipes / 8 immutable decisions; no publication manifest emitted before genuine decisions.');process.exit(0)}
const input=JSON.parse(fs.readFileSync(decisionsFile,'utf8'));
const expected=[...cohort.templateDigests].map(String).sort();
const rows=Array.isArray(input.decisions)?input.decisions:[];
if(rows.length!==8)throw new Error(`expected 8 Grub decisions, got ${rows.length}`);
const map=new Map();
for(const row of rows){const key=String(row.template_digest||'');const decision=String(row.decision||'').toUpperCase();if(!expected.includes(key)||map.has(key))throw new Error(`invalid or duplicate Grub digest ${key}`);if(!['PASS','FIX','REJECT'].includes(decision))throw new Error(`invalid Grub decision ${decision}`);if(decision!=='PASS'&&!String(row.note||'').trim())throw new Error(`${decision} requires note for ${key}`);map.set(key,{decision,note:row.note||''})}
for(const key of expected)if(!map.has(key))throw new Error(`missing Grub decision ${key}`);
const nonPass=[...map].filter(([,x])=>x.decision!=='PASS');
if(nonPass.length){console.log(JSON.stringify({status:'HUMAN_FIX_REQUIRED',nonPass},null,2));process.exit(0)}
const manifest={proof:'V1_GRUB_APPROVED_PUBLICATION_MANIFEST',approvedTemplateDigests:expected,approvedRecipeIds:cohort.recipeIds,counts:{templates:8,recipes:cohort.recipeIds.length},rule:'Only immutable approved launch-cohort recipes may progress to reviewed/published/served; validated nutrition remains mandatory.'};
fs.writeFileSync(`${out}/grub-v1-approved-publication-manifest.json`,JSON.stringify(manifest,null,2));
console.log('PASS Grub V1 acceptance: 8/8 PASS; 783-recipe publication manifest emitted.');
