import fs from 'node:fs';

const paths = {
  matrix: 'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',
  launch: 'docs/LAUNCH-FINISH-LINE.md',
  evidence: 'docs/COMMISSIONING-EVIDENCE.md',
  gate: 'finish-line-gate.mjs',
  blockers: 'docs/V1-RELEASE-BLOCKER-BOARD-V2.md'
};
const data = Object.fromEntries(Object.entries(paths).map(([k,p]) => [k, fs.readFileSync(p,'utf8')]));
const replace = (key, from, to, label) => {
  if (!data[key].includes(from)) throw new Error(`missing ${label}`);
  data[key] = data[key].replace(from, to);
};
const replaceRe = (key, re, to, label) => {
  if (!re.test(data[key])) throw new Error(`missing ${label}`);
  data[key] = data[key].replace(re, to);
};

replace('matrix', '**Current reconciled scoreboard: 57 total / 30 PASS / 24 AMBER / 3 BLOCKED / 0 unmapped.**', '**Current reconciled scoreboard: 57 total / 31 PASS / 23 AMBER / 3 BLOCKED / 0 unmapped.**', 'matrix scoreboard');
replaceRe('matrix', /^\| G2-011 \| Progress is a data log, not a whole-person story \| AMBER \|.*$/m, '| G2-011 | Progress is a data log, not a whole-person story | **PASS** | Fresh production rendered acceptance proves a coherent whole-person `Since you started` story at 1440px and 390px from two retained check-ins: weight, waist, steps, sleep and mood move together; `2 check-ins retained` and non-judgemental direction language are visible; the same story survives logout and fresh login with zero root overflow. Run `31766649536`, job `94663838273`, artifact `9206580040`. Evidence: `docs/evidence/2026-08-14-g2-011-whole-person-progress-rendered-pass.md`. |', 'G2-011 row');
replace('matrix', '## 24-AMBER burn-down classification', '## 23-AMBER burn-down classification', 'amber heading');
replaceRe('matrix', /^\| G2-011 \| LARGE \| M13 whole-person Progress story \|\n/m, '', 'G2-011 classification');
replace('matrix', 'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 30. AMBER rows: 24. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.', 'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 31. AMBER rows: 23. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.', 'matrix reconciliation');

replace('launch', 'Current evidenced classification is **30 PASS / 24 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G2-012 Progress units**, after the real desktop + 390px member journey saved normalised stone/lb and inches values, showed the expected completion outcome and retained the same state after logout/login. No adjacent Progress/premium row is promoted by association.', 'Current evidenced classification is **31 PASS / 23 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G2-011 whole-person Progress**, after the real desktop + 390px member journey rendered retained multi-signal Progress as a coherent story and preserved that outcome after logout/fresh login. No adjacent Progress Picture/premium row is promoted by association.', 'launch reconciliation');
replaceRe('launch', /^\| M13 \| Whole-person Progress \+ proper units \| AMBER — .*$/m, '| M13 | Whole-person Progress + proper units | AMBER — G2-011 and G2-012 are now production PASS: retained whole-person Progress story plus controlled stone/lb + inches round-trip are proven at desktop + 390px. M13 remains open only for the broader premium Progress/Progress Picture presentation represented by the separate G2-014/M01 acceptance boundary; no visual-quality row is promoted by association. |', 'M13 row');

replace('evidence', '**57 total / 30 PASS / 24 AMBER / 3 BLOCKED / 0 abstraction orphans.**', '**57 total / 31 PASS / 23 AMBER / 3 BLOCKED / 0 abstraction orphans.**', 'ledger scoreboard');
replaceRe('evidence', /^Latest original row closure: .*$/m, 'Latest original row closure: **G2-011 whole-person Progress.** Fresh production rendered acceptance on desktop 1440x900 and mobile 390x844 proves the real authenticated member sees a coherent `Since you started` story across retained weight, waist, steps, sleep and mood, with `2 check-ins retained`, non-judgemental direction language, logout/fresh-login persistence and zero root overflow. Run `31766649536`, job `94663838273`, artifact `9206580040`. Retained evidence: `docs/evidence/2026-08-14-g2-011-whole-person-progress-rendered-pass.md`. No adjacent Progress Picture/premium row is promoted by association.', 'ledger latest closure');
if (!data.evidence.includes('## Gate 2 whole-person Progress — PASS')) {
  const marker = '## Gate 2 Progress units — PASS';
  if (!data.evidence.includes(marker)) throw new Error('ledger insertion marker missing');
  data.evidence = data.evidence.replace(marker, '## Gate 2 whole-person Progress — PASS\n**G2-011 PASS:** production rendered acceptance turns two genuine retained Progress check-ins into one coherent `Since you started` member story spanning weight, waist, steps, sleep and mood. The member sees `2 check-ins retained` plus non-judgemental direction language, and the same story persists after logout/fresh login at desktop + 390px with zero root overflow. Run `31766649536`, job `94663838273`, artifact `9206580040`. Evidence: `docs/evidence/2026-08-14-g2-011-whole-person-progress-rendered-pass.md`.\n\n' + marker);
}

replace('gate', 'must(counts.PASS===30,`original matrix PASS count is 30 (found ${counts.PASS||0})`);', 'must(counts.PASS===31,`original matrix PASS count is 31 (found ${counts.PASS||0})`);', 'gate pass count');
replace('gate', 'must(counts.AMBER===24,`original matrix AMBER count is 24 (found ${counts.AMBER||0})`);', 'must(counts.AMBER===23,`original matrix AMBER count is 23 (found ${counts.AMBER||0})`);', 'gate amber count');
replace('gate', "must(matrix.includes('PASS rows: 30. AMBER rows: 24. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');", "must(matrix.includes('PASS rows: 31. AMBER rows: 23. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');", 'gate matrix summary');
replace('gate', "must(launchFinish.includes('30 PASS / 24 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');", "must(launchFinish.includes('31 PASS / 23 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');", 'gate launch score');

replace('blockers', '**A — V1 RELEASE BLOCKERS: 21 AMBER rows / 7 active shared clusters.**', '**A — V1 RELEASE BLOCKERS: 20 AMBER rows / 6 active shared clusters.**', 'A blocker count');
replaceRe('blockers', /^\*\*A CLOSED: 6 — .*\*\*$/m, '**A CLOSED: 7 — G5-005 public trust architecture, G1-002 production email binding/delivery, G1-009 authenticated cross-browser/mobile regression acceptance, G1-008 rendered loading/empty/success state system, G1-012 unattended synthetic Dave release gate, G2-012 Progress unit round-trip, G2-011 whole-person Progress story.**', 'A closed line');
replace('blockers', '## A6 Progress core\nG2-011. Whole-person Progress story remains open. **G2-012 is PASS:** the real member UI now production-proves correct stone/lb normalisation, inches readback and logout/login retention at desktop + 390px; do not keep the unit defect in the active blocker count.', '## A6 Progress core — CLOSED\n**G2-011 and G2-012 PASS.** Production proves the retained whole-person `Since you started` Progress story plus correct stone/lb normalisation and inches readback at desktop + 390px, including logout/fresh-login retention. Premium Progress Picture presentation remains separately open in A2 via G2-013/G2-014 and is not promoted by association.', 'A6 Progress');

for (const [key,p] of Object.entries(paths)) fs.writeFileSync(p, data[key]);
console.log('PASS G2-011 reconciliation: 57 / 31 PASS / 23 AMBER / 3 BLOCKED; Category-A 20 AMBER.');
