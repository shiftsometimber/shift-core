import fs from 'node:fs';

const paths={matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',launch:'docs/LAUNCH-FINISH-LINE.md',evidence:'docs/COMMISSIONING-EVIDENCE.md',gate:'finish-line-gate.mjs',blockers:'docs/V1-RELEASE-BLOCKER-BOARD-V2.md'};
const data=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
const replace=(key,from,to,label)=>{if(!data[key].includes(from))throw new Error(`missing ${label}`);data[key]=data[key].replace(from,to)};
const replaceRe=(key,re,to,label)=>{if(!re.test(data[key]))throw new Error(`missing ${label}`);data[key]=data[key].replace(re,to)};

const g2001='Fresh unchanged production rendered acceptance proves the real authenticated Today daily-command-centre journey at 1440x900 and 390px: canonical Today headline/detail/subhead, meaningful real-route actions including My Grub and Hydration, explicit member acknowledgement, leave-to-Grub -> return retention, no fake metrics, zero root overflow and zero browser console/page errors. Run `31774086353`, job `94685791902`, artifact `9209340762`, digest `sha256:ae39f970fb070f21cf03269a57d575c1c30bd0bbb96518842a947a3a3e7fb379`. Evidence: `docs/evidence/2026-08-14-g2-001-today-premium-rendered-pass.md`.';

replace('matrix','**Current reconciled scoreboard: 57 total / 34 PASS / 20 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 35 PASS / 19 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
replaceRe('matrix',/^\| G2-001 \| Shift Today is an engine, not a premium daily command centre \| AMBER \|.*$/m,`| G2-001 | Shift Today is an engine, not a premium daily command centre | **PASS** | ${g2001} |`,'G2-001 row');
replace('matrix','## 20-AMBER burn-down classification','## 19-AMBER burn-down classification','matrix amber heading');
replaceRe('matrix',/^\| G2-001 \| LARGE \| M01\/B08 premium Today experience \|\n/m,'','G2-001 amber classification');
replace('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 34. AMBER rows: 20. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 35. AMBER rows: 19. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

replaceRe('launch',/^\| M01 \| One Shift premium visual system across public \+ My Shift \| AMBER — .*$/m,'| M01 | One Shift premium visual system across public + My Shift | AMBER — public rendered lane is GREEN; G1-009 proves authenticated cross-browser/mobile geometry/routing; G1-008 proves representative empty/loading/success product states; G2-001 proves the premium retained Today daily command centre; G2-014 proves premium Progress Picture presentation; and G2-015 proves the premium retained My Plans manager at desktop + 390px. Remaining work is systemic premium shell/navigation/footer/forms/member IA parity against the homepage design constitution. |','M01 row');
replaceRe('launch',/^Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*34 PASS \/ 20 AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\*\*\. The latest earned original-row promotion is .*$/m,'Exactly **57** original rows remain mandatory. Current evidenced classification is **35 PASS / 19 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G2-001 Shift Today premium daily command centre**, after unchanged production rendered acceptance proved canonical Today content, meaningful real-route actions, explicit acknowledgement and leave/return retention at desktop + 390px with no fake metrics, zero root overflow and no browser errors.','launch reconciliation');

replace('evidence','**57 total / 34 PASS / 20 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 35 PASS / 19 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
replaceRe('evidence',/^Latest original row closure: .*$/m,`Latest original row closure: **G2-001 Shift Today premium daily command centre.** ${g2001}`,'ledger latest closure');
if(!data.evidence.includes('## Gate 2 Shift Today premium daily command centre — PASS')){
  const marker='## Gate 2 My Plans premium manager — PASS';
  if(!data.evidence.includes(marker))throw new Error('ledger G2 insertion marker missing');
  data.evidence=data.evidence.replace(marker,`## Gate 2 Shift Today premium daily command centre — PASS\n**G2-001 PASS:** ${g2001} This closes the daily command-centre row only; wider M01/Gate 3 estate parity and G4-008 proactive orchestration remain independently AMBER.\n\n${marker}`);
}
replaceRe('evidence',/^- Gate 1: finish genuine verification\/recovery token lifecycles; publish the canonical static Fit adapter and rerun explicit loading\/empty\/success acceptance; fresh Dave remains the final unassisted leg\.$/m,'- Gate 1: finish genuine verification/recovery token lifecycles; all currently automatable Gate 1 state/rendered foundations remain locked PASS absent regression evidence; fresh Dave remains the final unassisted leg.','ledger stale Gate1 swarm');
replaceRe('evidence',/^- M01\/M06\/M10: preserve homepage-level premium forest\/cream quality while closing demonstrated member contrast defects, responsive parity and state-system acceptance\.$/m,'- M01/M06/M10: preserve homepage-level premium forest/cream quality while closing demonstrated member contrast defects and remaining whole-estate responsive/system parity; Today, Progress Picture and My Plans premium member surfaces are locked PASS absent regression evidence.','ledger premium swarm');

replace('gate','must(counts.PASS===34,`original matrix PASS count is 34 (found ${counts.PASS||0})`);','must(counts.PASS===35,`original matrix PASS count is 35 (found ${counts.PASS||0})`);','gate pass count');
replace('gate','must(counts.AMBER===20,`original matrix AMBER count is 20 (found ${counts.AMBER||0})`);','must(counts.AMBER===19,`original matrix AMBER count is 19 (found ${counts.AMBER||0})`);','gate amber count');
replace('gate',"must(matrix.includes('PASS rows: 34. AMBER rows: 20. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 35. AMBER rows: 19. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
replace('gate',"must(launchFinish.includes('34 PASS / 20 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('35 PASS / 19 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch score');

replace('blockers','**A — V1 RELEASE BLOCKERS: 18 AMBER rows / 6 active shared clusters.**','**A — V1 RELEASE BLOCKERS: 17 AMBER rows / 6 active shared clusters.**','A blocker count');
replaceRe('blockers',/^\*\*A CLOSED: 9 — (.*)\*\*$/m,'**A CLOSED: 10 — $1, G2-001 Shift Today premium daily command centre.**','A closed list');
replaceRe('blockers',/^## A3 Today command centre\nG2-001, G4-008\. .*$/m,'## A3 Today command centre\n**G2-001 PASS:** the real authenticated premium Today command centre is production-proven with canonical content, meaningful actions, explicit acknowledgement and leave/return retention at desktop + 390px. **G4-008 remains AMBER:** proactive insight orchestration across the existing Brain/Today system still requires its own closure proof.','A3 Today');

for(const [key,p] of Object.entries(paths))fs.writeFileSync(p,data[key]);
console.log('PASS reconciled G2-001 production evidence to 35 PASS / 19 AMBER / 3 BLOCKED without promoting adjacent rows');
