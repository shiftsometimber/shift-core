import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const replace=(s,from,to,label)=>{must(s.includes(from),`missing ${label}`);return s.replace(from,to)};

let matrix=read('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md');
matrix=replace(matrix,'**Current reconciled scoreboard: 57 total / 27 PASS / 27 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 28 PASS / 26 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
const g1=/^\| G1-008 \| Loading\/empty\/success states inconsistent \| AMBER \|.*$/m;
must(g1.test(matrix),'missing G1-008 AMBER row');
matrix=matrix.replace(g1,'| G1-008 | Loading/empty/success states inconsistent | **PASS** | Exact-path production deployment now serves the Git-authoritative 7,278-byte member adapter with the Fit-only finite 60-second generation budget. Unchanged production run `31744305693`, rendered-state-system job `94594994187`, proves desktop + 390px retained auth, four fresh-member empty states, Grub and Fit explicit in-flight loading, locked generating actions, HTTP 200 product responses, visibly rendered returned items, settled completion copy and zero document-root overflow. Evidence artifact `9198446706`, digest `c50deb642456f43555c52925709c0b389865f62ca0fb916e3eaab2391a5795e5`; retained evidence `docs/evidence/2026-08-13-g1-008-production-pass.md`. |');
matrix=matrix.replaceAll('PASS rows: 27. AMBER rows: 27. BLOCKED rows: 3.','PASS rows: 28. AMBER rows: 26. BLOCKED rows: 3.');
write('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',matrix);

let gate=read('finish-line-gate.mjs');
gate=replace(gate,'must(counts.PASS===27,`original matrix PASS count is 27 (found ${counts.PASS||0})`);','must(counts.PASS===28,`original matrix PASS count is 28 (found ${counts.PASS||0})`);','gate PASS count');
gate=replace(gate,'must(counts.AMBER===27,`original matrix AMBER count is 27 (found ${counts.AMBER||0})`);','must(counts.AMBER===26,`original matrix AMBER count is 26 (found ${counts.AMBER||0})`);','gate AMBER count');
gate=replace(gate,"must(matrix.includes('PASS rows: 27. AMBER rows: 27. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 28. AMBER rows: 26. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
gate=replace(gate,"must(launchFinish.includes('27 PASS / 27 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('28 PASS / 26 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch summary');
write('finish-line-gate.mjs',gate);

write('docs/V1-RELEASE-BLOCKER-COUNTS.txt','A=23\nB=3\nC=3\nAUDIT_PASS=28\nAUDIT_AMBER=26\nAUDIT_BLOCKED=3\n');

let board=read('docs/V1-RELEASE-BLOCKER-BOARD-V2.md');
board=replace(board,'**A — V1 RELEASE BLOCKERS: 24 AMBER rows / 7 active shared clusters.**','**A — V1 RELEASE BLOCKERS: 23 AMBER rows / 7 active shared clusters.**','A headline');
board=replace(board,'**A CLOSED: 3 — G5-005 public trust architecture, G1-002 production email binding/delivery, G1-009 authenticated cross-browser/mobile regression acceptance.**','**A CLOSED: 4 — G5-005 public trust architecture, G1-002 production email binding/delivery, G1-009 authenticated cross-browser/mobile regression acceptance, G1-008 production loading/empty/success state-system acceptance.**','A closed');
board=replace(board,'G1-008, G2-013, G2-014, G3-001, G3-002, G3-003, G3-004, G3-005, G3-007. **G1-009 is PASS:**','G2-013, G2-014, G3-001, G3-002, G3-003, G3-004, G3-005, G3-007. **G1-008 and G1-009 are PASS:**','A2 IDs');
board=replace(board,'Remaining closure is the premium populated/empty/error state system, shell/navigation/footer/forms/Progress Picture/member IA and final physical-device hostile acceptance; do not reopen G1-009 without genuine regression evidence.','G1-008 additionally proves explicit Grub/Fit loading, locked actions, HTTP-successful returned content, settled completion and fresh-member empty states on desktop + 390px. Remaining closure is the premium visual system, shell/navigation/footer/forms/Progress Picture/member IA and final physical-device hostile acceptance; do not reopen G1-008/G1-009 without genuine regression evidence.','A2 closure');
write('docs/V1-RELEASE-BLOCKER-BOARD-V2.md',board);

let launch=read('docs/LAUNCH-FINISH-LINE.md');
launch=replace(launch,'Behaviour **9/9 PASS and locked**; full row remains AMBER only for rendered/premium/loading-state evidence. The cross-browser/mobile geometry/routing prerequisite is production-green; G1-008 remains bounded to publishing the canonical static Fit adapter and rerunning loading/empty/success.','Behaviour **9/9 PASS and locked**; explicit loading/empty/success acceptance is now also production-green at desktop + 390px under G1-008. The full row remains AMBER only for premium rendered/member-quality evidence outside that closed state-system requirement.','B03');
launch=replace(launch,'AMBER — exhaustive routing is green, G1-007 rendered failure-state acceptance is PASS, and G1-009 cross-browser/mobile authenticated routing/geometry is PASS. Explicit loading/empty/success acceptance remains bounded to the G1-008 static frontend publish/rerun.','AMBER — exhaustive routing is green, G1-007 rendered failure-state acceptance is PASS, G1-009 cross-browser/mobile authenticated routing/geometry is PASS, and G1-008 explicit loading/empty/success acceptance is now PASS. Remaining M10 closure is the final whole-estate release sweep on the consolidated RC rather than any known state-system defect.','M10');
launch=replace(launch,'Current evidenced classification is **27 PASS / 27 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G2-009 Conundrum catalogue intelligence**, proven on unchanged production through the governed published catalogue.','Current evidenced classification is **28 PASS / 26 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G1-008 loading/empty/success state-system consistency**, proven on unchanged production at desktop + 390px after the exact-path static adapter deployment.');
launch=replace(launch,'Gate 1: finish genuine verification/recovery token lifecycles and publish the canonical static Fit adapter before rerunning loading/empty/success acceptance. In parallel:','Gate 1: G1-008 loading/empty/success is closed; finish genuine verification/recovery token lifecycles. In parallel:');
write('docs/LAUNCH-FINISH-LINE.md',launch);

let ledger=read('docs/COMMISSIONING-EVIDENCE.md');
if(!ledger.includes('G1-008 production state-system PASS — 2026-08-13'))ledger += '\n\n## G1-008 production state-system PASS — 2026-08-13\nRun `31744305693`, job `94594994187`, completed the unchanged strict desktop + 390px empty/loading/success acceptance with zero failures after the live adapter was corrected to the Git-authoritative Fit-only finite generation budget. Artifact `9198446706`, digest `c50deb642456f43555c52925709c0b389865f62ca0fb916e3eaab2391a5795e5`. Original row G1-008 is PASS; no adjacent premium/accessibility/editorial/human-token row is promoted by association.\n';
write('docs/COMMISSIONING-EVIDENCE.md',ledger);

console.log('Reconciled G1-008 PASS: A 24->23; audit 27/27/3 -> 28/26/3.');
