import fs from 'node:fs';

const human=JSON.parse(fs.readFileSync('evidence/matt-v1-final-content-acceptance-2026-08-14.json','utf8'));
const grub=JSON.parse(fs.readFileSync('evidence/grub-v1-final-decisions-2026-08-14.json','utf8'));
const fit=JSON.parse(fs.readFileSync('evidence/fit-v1-final-decisions-2026-08-14.json','utf8'));
const fitLedger=JSON.parse(fs.readFileSync('content/fit/premium-visual-production-v1.json','utf8'));
const contracts=JSON.parse(fs.readFileSync('content/fit/premium-v1-render-contracts.json','utf8'));

const fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg)};
const sameSet=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&new Set(b).size===b.length&&a.every(x=>new Set(b).has(x));

need(human?.proof==='MATT_V1_FINAL_AUTHORITATIVE_HUMAN_ACCEPTANCE_2026_08_14','human acceptance proof marker invalid');
need(human?.decision_source==='Explicit user instruction: Accept','human acceptance source not explicit');
need(human?.grub?.review_run===31803717241,'Grub review run drifted');
need(human?.grub?.artifact_id===9220287723,'Grub artifact id drifted');
need(human?.grub?.artifact_sha256==='f02c540a1f6059796ab8615021f8e4747a12f052ce3cd4faa1f14cb0c5f7f7f4','Grub artifact digest drifted');
need(human?.grub?.required_recipes===798&&human?.grub?.required_template_decisions===8,'Grub accepted cohort size drifted');
need(grub?.proof==='M11_SECOND_PERSON_DECISIONS','Grub decisions proof invalid');
need(grub?.source_summary?.requiredRecipes===798&&grub?.source_summary?.requiredTemplateDecisions===8,'Grub decision summary drifted');
need(Array.isArray(grub?.decisions)&&grub.decisions.length===8,'exactly eight Grub decisions required');
need((grub?.decisions||[]).every(x=>x.decision==='PASS'),'all final Grub decisions must PASS');
need(sameSet((grub?.decisions||[]).map(x=>x.template_digest),human?.grub?.template_digests||[]),'Grub decision digest set does not equal accepted authority');

need(human?.fit?.review_run===31802631318,'Fit review run drifted');
need(human?.fit?.artifact_id===9219877222,'Fit artifact id drifted');
need(human?.fit?.artifact_sha256==='b0ad06b2badc5ae83a750ec44b360b81f39e8b59407a3c705bb460a17e3012da','Fit artifact digest drifted');
need(human?.fit?.required_movements===26,'Fit accepted cohort size drifted');
need(fit?.proof==='FIT_V1_DOMAIN_MEMBER_ACCEPTANCE','Fit decision proof invalid');
need(Array.isArray(fit?.decisions)&&fit.decisions.length===26,'exactly 26 Fit decisions required');
need((fit?.decisions||[]).every(x=>x.decision==='PASS'),'all final Fit decisions must PASS');
const fitIds=(fit?.decisions||[]).map(x=>x.movement_id);
const ledgerIds=(fitLedger?.produced_candidates||[]).map(x=>x.canonical_movement);
const contractIds=(contracts||[]).map(x=>x.id);
need(fitLedger?.geometry_version==='v3','Fit geometry authority drifted');
need(fitLedger?.counts?.produced===26&&fitLedger?.counts?.technically_qa_passed===26,'Fit technical QA prerequisite not 26/26');
need(sameSet(fitIds,human?.fit?.movement_ids||[]),'Fit decision set does not equal accepted human authority');
need(sameSet(fitIds,ledgerIds),'Fit decision set does not equal current produced ledger');
need(sameSet(fitIds,contractIds),'Fit decision set does not equal current render contracts');

if(fail.length){console.error(JSON.stringify({proof:'FINAL_V1_HUMAN_ACCEPTANCE_GATE',status:'FAIL',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'FINAL_V1_HUMAN_ACCEPTANCE_GATE',status:'PASS',grub:{decisions:8,recipes:798},fit:{decisions:26,geometry:'v3'},auditPromotion:false,next:'publication_and_production_serving_proof'},null,2));
