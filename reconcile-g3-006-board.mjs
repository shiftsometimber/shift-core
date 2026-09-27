import fs from 'node:fs';

const paths={matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',launch:'docs/LAUNCH-FINISH-LINE.md',evidence:'docs/COMMISSIONING-EVIDENCE.md',blockers:'docs/V1-RELEASE-BLOCKER-BOARD-V2.md',gate:'finish-line-gate.mjs'};
const data=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
const rep=(k,from,to,label)=>{if(!data[k].includes(from))throw new Error(`missing ${label}`);data[k]=data[k].replace(from,to)};
const rex=(k,re,to,label)=>{if(!re.test(data[k]))throw new Error(`missing ${label}`);data[k]=data[k].replace(re,to)};

const proof='docs/evidence/2026-08-14-g3-006-knowledge-hq-production-pass.md';
const evidence='Merged-main editorial lifecycle proof blocks both exact HQ and legacy publication before review, retains named approval across leave/return, and preserves reviewer provenance after reviewed publish. After PR #279 repaired production HQ editorial CORS without reflecting hostile origins, a fresh unchanged deployed HQ rerun proved the real Knowledge Hub CMS desk at 1440x900 and 390x844 with the editorial standard and review/publish controls visible, responsive stylesheet settled, `pageErrors: []`, `consoleErrors: []`, zero root overflow and intentional table containment on mobile. HQ run `31781843657`, rerun job `94723912030`, artifact `9213770096`, digest `sha256:132e79eec8d93fe0cea19b300215a5b1e4b18ada5d100d0937af24c04ca5e1e5`. Evidence: `'+proof+'`.';

rep('matrix','**Current reconciled scoreboard: 57 total / 44 PASS / 10 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 45 PASS / 9 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
rex('matrix',/^\| G3-006 \| Knowledge Hub editorial experience is inconsistent \| AMBER \|.*$/m,'| G3-006 | Knowledge Hub editorial experience is inconsistent | **PASS** | '+evidence+' |','G3-006 matrix row');
rep('matrix','## 10-AMBER burn-down classification','## 9-AMBER burn-down classification','amber heading');
rex('matrix',/^\| G3-006 \| FINITE \|[^\n]*\|\n/m,'','G3-006 burn-down row');
rep('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 44. AMBER rows: 10. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 45. AMBER rows: 9. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

rex('launch',/Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*44 PASS \/ 10 AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\*\*\.[\s\S]*?G3-006 remains independently AMBER pending its governed Knowledge\/HQ presentation proof\./,'Exactly **57** original rows remain mandatory. Current evidenced classification is **45 PASS / 9 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G3-006 governed Knowledge/HQ editorial workflow**. '+evidence,'launch reconciliation');
rep('launch','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 public/member premium-system parity is PASS with G3-006 still independently open; G4-008 proactive Today orchestration is now production PASS. Continue G3-006 and remaining Gate 5 non-external acceptance without allowing human/device or external boundaries to queue non-blocked work.','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 is now fully PASS, including the governed Knowledge/HQ editorial workflow; G4-008 proactive Today orchestration is production PASS. Continue remaining Gate 5 non-external acceptance without allowing human/device or external boundaries to queue non-blocked work.','launch swarm');

rep('evidence','**57 total / 44 PASS / 10 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 45 PASS / 9 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
rex('evidence',/^Latest original row closure:.*$/m,'Latest original row closure: **G3-006 governed Knowledge/HQ editorial workflow.** '+evidence,'ledger latest');
rep('evidence','G3-006 is deliberately not included: governed Knowledge/HQ editorial presentation remains independently AMBER until its own merged-production proof closes.','G3-006 is now independently PASS through its governed API lifecycle plus fresh post-CORS deployed HQ presentation proof.','ledger premium section');
rep('evidence','This closes G3-008 independently; G3-001/G3-002/G3-003/G3-004/G3-005/G3-007 were subsequently closed by the dedicated merged-production premium-system proof, while G3-006 remains separate.','This closes G3-008 independently; G3-001/G3-002/G3-003/G3-004/G3-005/G3-007 were subsequently closed by the dedicated merged-production premium-system proof, and G3-006 was later closed by its own governed Knowledge/HQ evidence.','ledger a11y stale scope');
if(!data.evidence.includes('## Gate 3 governed Knowledge/HQ editorial workflow — PASS')){
 const marker='## Gate 4 Knowledge flywheel — PASS';if(!data.evidence.includes(marker))throw new Error('ledger Gate 4 marker missing');
 data.evidence=data.evidence.replace(marker,'## Gate 3 governed Knowledge/HQ editorial workflow — PASS\n**G3-006 PASS:** '+evidence+' The premium presentation preserves the estate-wide design constitution and does not weaken the existing Knowledge lifecycle/RBAC authority.\n\n'+marker);
}

rep('blockers','**B — POST-LAUNCH HARDENING: 2 AMBER rows.**','**B — POST-LAUNCH HARDENING: 1 AMBER row.**','blocker B count');
rep('blockers','M01/Gate 3 premium-system parity is now PASS; G3-006 remains the separate governed Knowledge/HQ hardening lane.','M01/Gate 3 premium-system parity and the separate governed Knowledge/HQ editorial workflow are now PASS.','blocker A6');
rep('blockers','- G3-006 Knowledge editorial/reviewer presentation refinement; governed Knowledge lifecycle is already production-proven.\n','', 'blocker G3 B row');
if(!data.blockers.includes('**G3-006 GOVERNED KNOWLEDGE/HQ PASS:**')){
 const marker='## B — post-launch hardening';if(!data.blockers.includes(marker))throw new Error('blocker B marker missing');
 data.blockers=data.blockers.replace(marker,'## Gate 3 governed Knowledge/HQ — CLOSED\n**G3-006 GOVERNED KNOWLEDGE/HQ PASS:** '+evidence+'\n\n'+marker);
}

rep('gate','must(counts.PASS===44,`original matrix PASS count is 44 (found ${counts.PASS||0})`);','must(counts.PASS===45,`original matrix PASS count is 45 (found ${counts.PASS||0})`);','gate PASS count');
rep('gate','must(counts.AMBER===10,`original matrix AMBER count is 10 (found ${counts.AMBER||0})`);','must(counts.AMBER===9,`original matrix AMBER count is 9 (found ${counts.AMBER||0})`);','gate AMBER count');
rep('gate',"must(matrix.includes('PASS rows: 44. AMBER rows: 10. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 45. AMBER rows: 9. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
rep('gate',"must(launchFinish.includes('44 PASS / 10 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('45 PASS / 9 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch score');

for(const [k,p] of Object.entries(paths))fs.writeFileSync(p,data[k]);
console.log('PASS reconciled G3-006 only: 45 PASS / 9 AMBER / 3 BLOCKED');
