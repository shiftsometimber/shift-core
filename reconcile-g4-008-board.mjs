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

const run='31781806555';
const job='94708984307';
const artifact='9212021040';
const digest='cd81613ebd745bd626cd3a27e5a1af57524ce0e9f5120660c8db11087e467136';
const sha='a18b7d09ca04034b8385a8f3dcea02024dc34334';
const proof='docs/evidence/2026-08-14-g4-008-proactive-today-production-pass.md';
const evidence=`Fresh unchanged merged-production member acceptance on main \`${sha}\` proved the existing One Shift Brain/proactive system as coherent daily orchestration rather than plumbing alone: an explicit ordinary-life strategy was durably retained as \`effective_strategy\` at 0.92 confidence; the real premium Today surface rendered exactly one \`SHIFT NOTICED\` card with zero root overflow; a second feed call inside the configured 12-hour cooldown returned no insight; disabling proactive insights returned \`proactive_disabled\`; and reloading Today retained zero proactive cards. The same job reran canonical premium Today desktop + 390px acceptance green. Run \`${run}\`, job \`${job}\`, retained Today artifact \`${artifact}\`, digest \`sha256:${digest}\`. Evidence: \`${proof}\`.`;

replace('matrix','**Current reconciled scoreboard: 57 total / 43 PASS / 11 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 44 PASS / 10 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
replaceRe('matrix',/^\| G4-008 \| Proactive insights are not yet a coherent daily orchestration system \| AMBER \|.*$/m,`| G4-008 | Proactive insights are not yet a coherent daily orchestration system | **PASS** | ${evidence} |`,'G4-008 matrix row');
replace('matrix','## 11-AMBER burn-down classification','## 10-AMBER burn-down classification','matrix amber heading');
const marker='## 10-AMBER burn-down classification';
const cut=data.matrix.indexOf(marker);if(cut<0)throw new Error('burn-down marker missing');
let head=data.matrix.slice(0,cut),tail=data.matrix.slice(cut);
const classRow=/^\| G4-008 \|[^\n]*\|\n/m;if(!classRow.test(tail))throw new Error('G4-008 amber classification missing');tail=tail.replace(classRow,'');data.matrix=head+tail;
replace('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 43. AMBER rows: 11. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 44. AMBER rows: 10. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

replace('launch','Exactly **57** original rows remain mandatory. Current evidenced classification is **43 PASS / 11 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotions are **G3-001, G3-002, G3-003, G3-004, G3-005 and G3-007**, after fresh unchanged merged-production Gate 3 acceptance proved the homepage-grade premium system across the real authenticated member estate at desktop + 390px with responsive intent navigation, contained footer, deliberate controls/hierarchy, zero root overflow and no browser errors. G3-006 remains independently AMBER pending its governed Knowledge/HQ presentation proof.',`Exactly **57** original rows remain mandatory. Current evidenced classification is **44 PASS / 10 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G4-008 proactive Today orchestration**. ${evidence} G3-006 remains independently AMBER pending its governed Knowledge/HQ presentation proof.`,'launch reconciliation');
replace('launch','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 public/member premium-system parity is now PASS; continue the independent G3-006 governed Knowledge/HQ presentation closure, then G4-008 proactive orchestration and remaining Gate 5 non-external acceptance. Human/device and external boundaries do not queue non-blocked work.','Gate 1 human token lifecycles remain batched final acceptance. Gate 2 human editorial/domain decisions remain finite. Gate 3 public/member premium-system parity is PASS with G3-006 still independently open; G4-008 proactive Today orchestration is now production PASS. Continue G3-006 and remaining Gate 5 non-external acceptance without allowing human/device or external boundaries to queue non-blocked work.','launch swarm');
replaceRe('launch',/^\| M12 \| Fit catalogue\/session breadth and visual guidance \|.*$/m,'| M12 | Fit catalogue/session breadth and visual guidance | AMBER — **2,500 authored**; the finite V1 launch cohort is **26 canonical movement decisions / 1,326 technically eligible descendants** with repaired human coaching guidance. The 12-week simulator yields 180/180 unique prescribed objects, all 26 families used and no consecutive canonical repeat. Replacement premium START -> MOVE -> FINISH candidates are now **26/26 produced and 26/26 technically QA-passed on main**; genuine domain/member-comprehension acceptance remains 0/26, and rejected legacy schematic artwork remains excluded. |','launch M12 current state');

replace('evidence','**57 total / 43 PASS / 11 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 44 PASS / 10 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
replaceRe('evidence',/^Latest original row closures:.*$/m,`Latest original row closure: **G4-008 proactive Today orchestration.** ${evidence}`,'ledger latest closure');
replace('evidence','This closes the daily command-centre row only; wider M01/Gate 3 estate parity and G4-008 proactive orchestration remain independently AMBER.','This closes the daily command-centre row only. M01/Gate 3 estate parity and G4-008 proactive orchestration were subsequently closed by their own unchanged merged-production evidence.','ledger stale Today scope');
if(!data.evidence.includes('## Gate 4 proactive daily orchestration — PASS')){
  const gate5='## Gate 5 operations — PASS where earned';
  if(!data.evidence.includes(gate5))throw new Error('Gate 5 ledger marker missing');
  data.evidence=data.evidence.replace(gate5,`## Gate 4 proactive daily orchestration — PASS\n**G4-008 PASS:** ${evidence} This promotion does not weaken current-message safety, clinical boundaries, privacy controls or the canonical One Shift Brain contract.\n\n${gate5}`);
}

replace('blockers','**A — V1 RELEASE BLOCKERS: 9 AMBER rows / 4 active shared clusters.**','**A — V1 RELEASE BLOCKERS: 8 AMBER rows / 3 active shared clusters.**','blocker A count');
replace('blockers','**A CLOSED: 18 — G5-005 public trust architecture, G1-002 production email binding/delivery, G1-009 authenticated cross-browser/mobile regression acceptance, G1-008 rendered loading/empty/success state system, G1-012 unattended synthetic Dave release gate, G2-012 Progress unit round-trip, G2-011 whole-person Progress story, G2-013 Progress Picture reliability, G2-014 premium Progress Picture presentation, G2-001 Shift Today premium daily command centre, G3-008 authenticated accessibility design-system gate, G5-012 member API performance release criterion, G3-001 systemic homepage/member quality, G3-002 responsive navigation parity, G3-003 footer parity, G3-004 premium controls, G3-005 hierarchy/spacing/cards, G3-007 member-intent IA.**','**A CLOSED: 19 — G5-005 public trust architecture, G1-002 production email binding/delivery, G1-009 authenticated cross-browser/mobile regression acceptance, G1-008 rendered loading/empty/success state system, G1-012 unattended synthetic Dave release gate, G2-012 Progress unit round-trip, G2-011 whole-person Progress story, G2-013 Progress Picture reliability, G2-014 premium Progress Picture presentation, G2-001 Shift Today premium daily command centre, G3-008 authenticated accessibility design-system gate, G5-012 member API performance release criterion, G3-001 systemic homepage/member quality, G3-002 responsive navigation parity, G3-003 footer parity, G3-004 premium controls, G3-005 hierarchy/spacing/cards, G3-007 member-intent IA, G4-008 proactive Today orchestration.**','blocker closed count');
replace('blockers','## A3 Today command centre\n**G2-001 PASS:** the real authenticated premium Today command centre is production-proven with canonical content, meaningful real actions, explicit acknowledgement and leave/return retention at desktop + 390px. **G4-008 remains AMBER:** proactive insight orchestration across the existing Brain/Today system still requires its own closure proof.',`## A3 Today command centre — CLOSED\n**G2-001 and G4-008 PASS:** the real authenticated premium Today command centre is production-proven with canonical content, meaningful real actions, explicit acknowledgement and leave/return retention at desktop + 390px. ${evidence}`,'blocker Today cluster');

replace('gate','must(counts.PASS===43,`original matrix PASS count is 43 (found ${counts.PASS||0})`);','must(counts.PASS===44,`original matrix PASS count is 44 (found ${counts.PASS||0})`);','gate PASS count');
replace('gate','must(counts.AMBER===11,`original matrix AMBER count is 11 (found ${counts.AMBER||0})`);','must(counts.AMBER===10,`original matrix AMBER count is 10 (found ${counts.AMBER||0})`);','gate AMBER count');
replace('gate',"must(matrix.includes('PASS rows: 43. AMBER rows: 11. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 44. AMBER rows: 10. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
replace('gate',"must(launchFinish.includes('43 PASS / 11 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('44 PASS / 10 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch score');

for(const [k,p] of Object.entries(paths))fs.writeFileSync(p,data[k]);
console.log('PASS reconciled G4-008 only: 44 PASS / 10 AMBER / 3 BLOCKED');
