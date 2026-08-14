import fs from 'node:fs';

const paths={
  matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',
  launch:'docs/LAUNCH-FINISH-LINE.md',
  evidence:'docs/COMMISSIONING-EVIDENCE.md',
  blockers:'docs/V1-RELEASE-BLOCKER-BOARD-V2.md',
  gate:'finish-line-gate.mjs'
};
const data=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
const replace=(key,from,to,label)=>{if(!data[key].includes(from))throw new Error(`missing ${label}`);data[key]=data[key].replace(from,to)};
const replaceRe=(key,re,to,label)=>{if(!re.test(data[key]))throw new Error(`missing ${label}`);data[key]=data[key].replace(re,to)};

const sha='2e4b062cb64bb7db17bb73215b522519a14c0976';
const run='31783956351';
const job='94715577166';
const artifact='9212761395';
const digest='e7cef0655dc4146d5ef2e800978696e881afdc68242945548c9a781727b59b06';
const proof='docs/evidence/2026-08-14-g5-014-sceptical-customer-production-pass.md';
const evidence=`Fresh unchanged main-production browser acceptance on \`${sha}\` proved the real sceptical-customer outcome rather than a strategy assertion. Shift loaded cleanly at 1440x900 and 390x844 with HTTP 200, visible H1/main landmark, zero root overflow and zero browser page/console errors; meaningful mobile decision controls met the commissioned touch-size floor. The live proposition visibly communicates ordinary-bloke audience, evidence-before-hype/no-profit-led-rankings, useful free calculators/Health MOT/Treatment Finder/comparisons/Knowledge, long-term maintenance thinking, the Useful First / Commercial Second promise, pre-launch honesty and explicit qualified-clinician boundaries. The browser then followed substantive Knowledge, Editorial Standards, Clinical Governance and Tools destinations, all HTTP 200 with substantive content and zero overflow. The same run opened the current Numan weight-loss benchmark and observed clinician, coaching, medication, long-term and regulated-service signals; Shift passed by differentiating through evidence, trust, usefulness and premium execution without pretending unavailable regulated clinical capability exists. Run \`${run}\`, job \`${job}\`, artifact \`${artifact}\`, digest \`sha256:${digest}\`. Evidence: \`${proof}\`.`;

replace('matrix','**Current reconciled scoreboard: 57 total / 44 PASS / 10 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 45 PASS / 9 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
replaceRe('matrix',/^\| G5-014 \| Numan\/customer trust competitive test not embedded \| AMBER \|.*$/m,`| G5-014 | Numan/customer trust competitive test not embedded | **PASS** | ${evidence} |`,'G5-014 matrix row');
replace('matrix','## 10-AMBER burn-down classification','## 9-AMBER burn-down classification','matrix amber heading');
const marker='## 9-AMBER burn-down classification';const cut=data.matrix.indexOf(marker);if(cut<0)throw new Error('burn-down marker missing');
let head=data.matrix.slice(0,cut),tail=data.matrix.slice(cut);
const classRow=/^\| G5-014 \|[^\n]*\|\n/m;if(!classRow.test(tail))throw new Error('G5-014 amber classification missing');tail=tail.replace(classRow,'');data.matrix=head+tail;
replace('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 44. AMBER rows: 10. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 45. AMBER rows: 9. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

replaceRe('launch',/^\| M17 \| Sceptical-customer \/ Numan competitive acceptance \| AMBER[^\n]*$/m,`| M17 | Sceptical-customer / Numan competitive acceptance | **PASS** — ${evidence} |`,'launch M17');
replaceRe('launch',/^Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*44 PASS \/ 10 AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\*\*\.[^\n]*$/m,`Exactly **57** original rows remain mandatory. Current evidenced classification is **45 PASS / 9 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G5-014 sceptical-customer / current Numan competitive acceptance**. ${evidence} G3-006 remains independently AMBER pending its governed Knowledge/HQ presentation proof.`,'launch reconciliation');
replace('launch','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 public/member premium-system parity is PASS with G3-006 still independently open; G4-008 proactive Today orchestration is now production PASS. Continue G3-006 and remaining Gate 5 non-external acceptance without allowing human/device or external boundaries to queue non-blocked work.','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 public/member premium-system parity is PASS with G3-006 still independently open; G4-008 proactive Today orchestration and M17/G5-014 competitive acceptance are production PASS. Continue G3-006 and remaining non-blocked M04/M08 commissioning without allowing human/device or external boundaries to queue work.','launch swarm');

replace('evidence','**57 total / 44 PASS / 10 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 45 PASS / 9 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
replaceRe('evidence',/^Latest original row closure:.*$/m,`Latest original row closure: **G5-014 sceptical-customer / current Numan competitive acceptance.** ${evidence}`,'ledger latest closure');
if(!data.evidence.includes('## Gate 5 sceptical-customer competitive acceptance — PASS')){
  const gateMarker='## Gate 5 operations — PASS where earned';
  if(!data.evidence.includes(gateMarker))throw new Error('Gate 5 ledger marker missing');
  data.evidence=data.evidence.replace(gateMarker,`## Gate 5 sceptical-customer competitive acceptance — PASS\n**G5-014 PASS:** ${evidence} This closes only competitive/trust acceptance; external clinical/provider rows remain BLOCKED.\n\n${gateMarker}`);
}

replace('blockers','**B — POST-LAUNCH HARDENING: 2 AMBER rows.**','**B — POST-LAUNCH HARDENING: 1 AMBER row.**','blocker B count');
replace('blockers','- G5-014 Numan/sceptical-customer competitive hardening.\n','', 'blocker G5-014 B row');
replace('blockers','## B — post-launch hardening\n- G3-006 Knowledge editorial/reviewer presentation refinement; governed Knowledge lifecycle is already production-proven.','## B — post-launch hardening\n- G3-006 Knowledge editorial/reviewer presentation refinement; governed Knowledge lifecycle is already production-proven.\n\n**G5-014 is no longer in B:** fresh unchanged main-production browser acceptance proved the sceptical-customer/current-Numan quality bar through evidence, trust, substantive decision-support, premium desktop/mobile execution and honest unavailable-clinical-capability boundaries.','blocker B note');

replace('gate','must(counts.PASS===44,`original matrix PASS count is 44 (found ${counts.PASS||0})`);','must(counts.PASS===45,`original matrix PASS count is 45 (found ${counts.PASS||0})`);','gate PASS count');
replace('gate','must(counts.AMBER===10,`original matrix AMBER count is 10 (found ${counts.AMBER||0})`);','must(counts.AMBER===9,`original matrix AMBER count is 9 (found ${counts.AMBER||0})`);','gate AMBER count');
replace('gate',"must(matrix.includes('PASS rows: 44. AMBER rows: 10. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 45. AMBER rows: 9. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
replace('gate',"must(launchFinish.includes('44 PASS / 10 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('45 PASS / 9 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch score');

for(const [k,p] of Object.entries(paths))fs.writeFileSync(p,data[k]);
console.log('PASS reconciled G5-014 only: 45 PASS / 9 AMBER / 3 BLOCKED');
