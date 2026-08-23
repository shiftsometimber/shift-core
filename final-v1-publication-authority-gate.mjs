import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const out=process.env.FINAL_V1_PUBLICATION_EVIDENCE_DIR||'final-v1-publication-evidence';
const grubOut=path.join(out,'grub');
fs.mkdirSync(grubOut,{recursive:true});

// Human acceptance must remain the first fail-closed boundary.
execFileSync(process.execPath,['final-v1-human-acceptance-gate.mjs'],{stdio:'inherit'});

// Bind the genuine eight accepted decisions to the regenerated launch cohort.
execFileSync(process.execPath,['grub-v1-publication-pack.mjs','evidence/grub-v1-final-decisions-2026-08-14.json'],{
  stdio:'inherit',env:{...process.env,GRUB_PUBLICATION_DIR:grubOut}
});
const grubSummary=JSON.parse(fs.readFileSync(path.join(grubOut,'grub-v1-publication-summary.json'),'utf8'));
const grubPayload=JSON.parse(fs.readFileSync(path.join(grubOut,'grub-v1-publishable.json'),'utf8'));
if(grubSummary.publicationReady!==true||grubSummary.decisionCount!==8||grubSummary.approvedRecipes!==798||grubSummary.heldRecipes!==0)throw new Error(`accepted Grub publication authority mismatch: ${JSON.stringify(grubSummary)}`);
if(!Array.isArray(grubPayload.items)||grubPayload.items.length!==798)throw new Error('accepted Grub publication payload must contain exactly 798 records');
if(grubPayload.items.some(x=>x.status!=='published'||x.review?.status!=='approved'||x.data?.nutrition?.status!=='validated'||!String(x.data?.nutrition?.methodology||'').includes('CoFID')))throw new Error('accepted Grub publication payload contains a non-published/non-approved/non-CoFID-validated record');

// Fit human/domain acceptance remains distinct from technical QA, but can now
// authorise the exact 26 premium assets that already passed deterministic QA.
const fit=JSON.parse(fs.readFileSync('evidence/fit-v1-final-decisions-2026-08-14.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('content/fit/premium-visual-production-v1.json','utf8'));
const contracts=JSON.parse(fs.readFileSync('content/fit/premium-v1-render-contracts.json','utf8'));
const accepted=new Set((fit.decisions||[]).filter(x=>x.decision==='PASS').map(x=>x.movement_id));
const candidates=ledger.produced_candidates||[];
if(accepted.size!==26||candidates.length!==26||ledger.counts?.technically_qa_passed!==26||ledger.geometry_version!=='v3')throw new Error('Fit accepted/technical authority is not exact 26/26 v3');
const contractIds=new Set((contracts||[]).map(x=>x.id));
const fitItems=candidates.map(c=>{
  if(!accepted.has(c.canonical_movement))throw new Error(`Fit candidate not human accepted: ${c.canonical_movement}`);
  if(!contractIds.has(c.canonical_movement))throw new Error(`Fit candidate has no canonical render contract: ${c.canonical_movement}`);
  if(c.status!=='technical_qa_pass'||c.geometry!=='v3')throw new Error(`Fit technical QA drift: ${c.canonical_movement}`);
  if(!c.asset||!fs.existsSync(c.asset))throw new Error(`Fit accepted asset missing: ${c.canonical_movement}`);
  return {movement_id:c.canonical_movement,title:c.display_name,asset:c.asset,status:'publication_authorised',human_domain_acceptance:'PASS',technical_qa:'PASS',geometry:'v3'};
});
if(new Set(fitItems.map(x=>x.movement_id)).size!==26)throw new Error('Fit publication authority does not contain 26 unique movements');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'fit-v1-publication-authority.json'),JSON.stringify({proof:'FIT_V1_PUBLICATION_AUTHORITY',count:26,items:fitItems},null,2));
const report={
  proof:'FINAL_V1_POST_HUMAN_PUBLICATION_AUTHORITY',status:'PASS',auditPromotion:false,
  grub:{humanDecisions:8,publishableRecords:798,held:0,nutrition:'validated CoFID-bound'},
  fit:{humanDomainDecisions:26,publicationAuthorisedAssets:26,technicalQa:26,geometry:'v3'},
  next:'production_serving_proof_of_exact_accepted_authority'
};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
console.log('PASS final V1 publication authority: genuine human acceptance binds to exactly 798 Grub publication records and 26 Fit premium assets; audit rows remain unpromoted until exact accepted authority is demonstrated in production member serving.');
