import fs from 'node:fs';

const paths={matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',launch:'docs/LAUNCH-FINISH-LINE.md',evidence:'docs/COMMISSIONING-EVIDENCE.md',blockers:'docs/V1-RELEASE-BLOCKER-BOARD-V2.md',gate:'finish-line-gate.mjs'};
const data=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
const rep=(k,from,to,label)=>{if(!data[k].includes(from))throw new Error(`missing ${label}`);data[k]=data[k].replace(from,to)};
const rex=(k,re,to,label)=>{if(!re.test(data[k]))throw new Error(`missing ${label}`);data[k]=data[k].replace(re,to)};

const proof='docs/evidence/2026-08-14-g5-014-sceptical-customer-production-pass.md';
const evidence='Fresh unchanged main-production browser acceptance on `2e4b062cb64bb7db17bb73215b522519a14c0976` proved the real sceptical-customer outcome: Shift loaded cleanly at 1440x900 and 390x844 with HTTP 200, visible H1/main landmark, zero root overflow and zero browser page/console errors; meaningful mobile decision controls met the commissioned touch-size floor. The live proposition visibly communicates ordinary-bloke audience, evidence-before-hype/no-profit-led-rankings, useful free decision-support, long-term maintenance thinking, the Useful First / Commercial Second promise, pre-launch honesty and explicit qualified-clinician boundaries. The browser followed Knowledge, Editorial Standards, Clinical Governance and Tools, all HTTP 200 with substantive content and zero overflow. The same run opened the current Numan weight-loss benchmark and observed clinician, coaching, medication, long-term and regulated-service signals; Shift passed by differentiating through evidence, trust, usefulness and premium execution without pretending unavailable regulated clinical capability exists. Run `31783956351`, job `94715577166`, artifact `9212761395`, digest `sha256:e7cef0655dc4146d5ef2e800978696e881afdc68242945548c9a781727b59b06`. Evidence: `'+proof+'`.';

rep('matrix','**Current reconciled scoreboard: 57 total / 45 PASS / 9 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 46 PASS / 8 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
rex('matrix',/^\| G5-014 \| Numan\/customer trust competitive test not embedded \| AMBER \|.*$/m,'| G5-014 | Numan/customer trust competitive test not embedded | **PASS** | '+evidence+' |','G5-014 matrix row');
rep('matrix','## 9-AMBER burn-down classification','## 8-AMBER burn-down classification','amber heading');
rex('matrix',/^\| G5-014 \| FINITE \|[^\n]*\|\n/m,'','G5-014 burn-down row');
rep('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 45. AMBER rows: 9. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 46. AMBER rows: 8. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

rex('launch',/^\| M17 \| Sceptical-customer \/ Numan competitive acceptance \| AMBER[^\n]*$/m,'| M17 | Sceptical-customer / Numan competitive acceptance | **PASS** — '+evidence+' |','launch M17');
rex('launch',/^Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*45 PASS \/ 9 AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\*\*\.[^\n]*$/m,'Exactly **57** original rows remain mandatory. Current evidenced classification is **46 PASS / 8 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G5-014 sceptical-customer / current Numan competitive acceptance**. '+evidence,'launch reconciliation');
rep('launch','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 is now fully PASS, including the governed Knowledge/HQ editorial workflow; G4-008 proactive Today orchestration is production PASS. Continue remaining Gate 5 non-external acceptance without allowing human/device or external boundaries to queue non-blocked work.','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 is fully PASS; Gate 4 proactive Today orchestration is PASS; and all currently automatable non-external Gate 5 original rows are now PASS. Keep human/device and genuine external boundaries honest while continuing only evidence/recovery upkeep and any newly exposed regression defects.','launch swarm');

rep('evidence','**57 total / 45 PASS / 9 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 46 PASS / 8 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
rex('evidence',/^Latest original row closure:.*$/m,'Latest original row closure: **G5-014 sceptical-customer / current Numan competitive acceptance.** '+evidence,'ledger latest');
if(!data.evidence.includes('## Gate 5 sceptical-customer competitive acceptance — PASS')){
 const marker='## Gate 5 operations — PASS where earned';if(!data.evidence.includes(marker))throw new Error('Gate 5 marker missing');
 data.evidence=data.evidence.replace(marker,'## Gate 5 sceptical-customer competitive acceptance — PASS\n**G5-014 PASS:** '+evidence+' This closes only competitive/trust acceptance; external clinical/provider rows remain BLOCKED and Dave human/device acceptance remains AMBER.\n\n'+marker);
}

rep('blockers','**B — POST-LAUNCH HARDENING: 1 AMBER row.**','**B — POST-LAUNCH HARDENING: 0 AMBER rows.**','blocker B count');
rep('blockers','- G5-014 Numan/sceptical-customer competitive hardening.\n','', 'blocker G5 row');
if(!data.blockers.includes('**G5-014 SCEPTICAL-CUSTOMER PASS:**')){
 const marker='## C — external';if(!data.blockers.includes(marker))throw new Error('blocker C marker missing');
 data.blockers=data.blockers.replace(marker,'**G5-014 SCEPTICAL-CUSTOMER PASS:** '+evidence+'\n\n'+marker);
}

rep('gate','must(counts.PASS===45,`original matrix PASS count is 45 (found ${counts.PASS||0})`);','must(counts.PASS===46,`original matrix PASS count is 46 (found ${counts.PASS||0})`);','gate PASS count');
rep('gate','must(counts.AMBER===9,`original matrix AMBER count is 9 (found ${counts.AMBER||0})`);','must(counts.AMBER===8,`original matrix AMBER count is 8 (found ${counts.AMBER||0})`);','gate AMBER count');
rep('gate',"must(matrix.includes('PASS rows: 45. AMBER rows: 9. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 46. AMBER rows: 8. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
rep('gate',"must(launchFinish.includes('45 PASS / 9 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('46 PASS / 8 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch score');

for(const [k,p] of Object.entries(paths))fs.writeFileSync(p,data[k]);
console.log('PASS reconciled G5-014 only: 46 PASS / 8 AMBER / 3 BLOCKED');
