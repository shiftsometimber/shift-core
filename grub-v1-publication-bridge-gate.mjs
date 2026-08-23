import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'shift-grub-v1-publication-proof-'));
const review=path.join(root,'review');
fs.mkdirSync(review,{recursive:true});
execFileSync(process.execPath,['grub-editorial-review-surface.mjs'],{stdio:'inherit',env:{...process.env,REVIEW_PACK_DIR:review}});
const launch=JSON.parse(fs.readFileSync(path.join(review,'grub-v1-launch-cohort.json'),'utf8'));
const digests=launch.templateDigests||[];
const requiredRecipes=Number(launch?.summary?.requiredRecipes||0);
const requiredDecisions=Number(launch?.summary?.requiredTemplateDecisions||0);
if(requiredDecisions!==8||digests.length!==8)throw new Error(`V1 launch decision invariant failed: ${requiredDecisions}/${digests.length}`);
if(!(requiredRecipes>0)||new Set(launch.recipeIds||[]).size!==requiredRecipes)throw new Error(`V1 launch recipe manifest mismatch: ${requiredRecipes}/${new Set(launch.recipeIds||[]).size}`);

const source_summary={requiredRecipes,requiredTemplateDecisions:requiredDecisions};
const decisionFile=path.join(root,'all-pass.json');
fs.writeFileSync(decisionFile,JSON.stringify({proof:'M11_SECOND_PERSON_DECISIONS',source_summary,decisions:digests.map(template_digest=>({template_digest,decision:'PASS'}))},null,2));
const publishDir=path.join(root,'all-pass-publication');
execFileSync(process.execPath,['grub-v1-publication-pack.mjs',decisionFile],{stdio:'inherit',env:{...process.env,GRUB_PUBLICATION_DIR:publishDir}});
const passSummary=JSON.parse(fs.readFileSync(path.join(publishDir,'grub-v1-publication-summary.json'),'utf8'));
const payload=JSON.parse(fs.readFileSync(path.join(publishDir,'grub-v1-publishable.json'),'utf8'));
if(passSummary.decisionCount!==requiredDecisions||passSummary.approvedRecipes!==requiredRecipes||passSummary.heldRecipes!==0||passSummary.publicationReady!==true)throw new Error(`all-PASS publication bridge mismatch: ${JSON.stringify(passSummary)}`);
if(!Array.isArray(payload.items)||payload.items.length!==requiredRecipes)throw new Error(`all-PASS publication payload must contain exactly ${requiredRecipes} reviewed+validated records`);

const fixedDigest=digests[0];
const holdFile=path.join(root,'one-fix.json');
fs.writeFileSync(holdFile,JSON.stringify({proof:'M11_SECOND_PERSON_DECISIONS',source_summary,decisions:digests.map(template_digest=>template_digest===fixedDigest?{template_digest,decision:'FIX',note:'commissioning hold proof'}:{template_digest,decision:'PASS'})},null,2));
const holdDir=path.join(root,'one-fix-publication');
const held=spawnSync(process.execPath,['grub-v1-publication-pack.mjs',holdFile],{encoding:'utf8',env:{...process.env,GRUB_PUBLICATION_DIR:holdDir}});
if(held.status===0)throw new Error('FIX decision must fail the launch publication bridge closed');
const holdSummary=JSON.parse(fs.readFileSync(path.join(holdDir,'grub-v1-publication-summary.json'),'utf8'));
if(holdSummary.heldRecipes<1||holdSummary.publicationReady!==false)throw new Error(`FIX hold summary invalid: ${JSON.stringify(holdSummary)}`);
if(fs.existsSync(path.join(holdDir,'grub-v1-publishable.json')))throw new Error('partial publishable payload leaked despite FIX decision');

const evidenceDir=process.env.GRUB_BRIDGE_EVIDENCE_DIR||'grub-publication-bridge-evidence';
fs.mkdirSync(evidenceDir,{recursive:true});
const report={proof:'M11_V1_DECISION_TO_PUBLICATION_BRIDGE_V1',immutableDecisions:requiredDecisions,boundRecipes:requiredRecipes,allPass:{approved:requiredRecipes,held:0,publicationReady:true,payloadRecords:payload.items.length},nonPass:{decision:'FIX',held:holdSummary.heldRecipes,publicationReady:false,partialPayloadEmitted:false},criterion:`A complete immutable ${requiredDecisions}-decision PASS set yields exactly the regenerated ${requiredRecipes}-record launch manifest; any FIX/REJECT fails the V1 launch bridge closed with no partial payload.`};
fs.writeFileSync(path.join(evidenceDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
console.log(`PASS M11 V1 decision-to-publication bridge: technically ready for the finite ${requiredDecisions}-decision human review over ${requiredRecipes} regenerated recipes; publication remains held until genuine decisions are returned.`);
