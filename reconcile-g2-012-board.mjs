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

replace('matrix', '**Current reconciled scoreboard: 57 total / 29 PASS / 25 AMBER / 3 BLOCKED / 0 unmapped.**', '**Current reconciled scoreboard: 57 total / 30 PASS / 24 AMBER / 3 BLOCKED / 0 unmapped.**', 'matrix scoreboard');
replaceRe('matrix', /^\| G2-012 \| Progress units are inconsistent \| AMBER \|.*$/m, '| G2-012 | Progress units are inconsistent | **PASS** | Fresh production rendered acceptance proves the real member Progress Picture journey at 1440px and 390px: a valid image is decoded, `14 st 13.5 lb` is saved and correctly normalised/rendered as `15 st 0 lb`, `50.0 in waist` is retained, the member sees explicit save completion, production returns HTTP 201, and the same units/state remain after logout and fresh login with zero root overflow and no console/page errors. Evidence: `docs/evidence/2026-08-13-g2-012-progress-units-rendered-pass.md`. |', 'G2-012 row');
replace('matrix', '## 26-AMBER burn-down classification', '## 24-AMBER burn-down classification', 'amber heading');
replaceRe('matrix', /^\| G1-012 \| HUMAN\/DEVICE \| B08 fresh unassisted Dave run \|\n/m, '', 'stale G1-012 classification');
replaceRe('matrix', /^\| G2-012 \| FINITE \| M13 unit system \|\n/m, '', 'G2-012 classification');
replace('matrix', 'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 29. AMBER rows: 25. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.', 'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 30. AMBER rows: 24. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.', 'matrix reconciliation');

replace('launch', 'Current evidenced classification is **29 PASS / 25 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G1-008 loading/empty/success states**, after the live adapter fingerprint and unchanged desktop + 390px state-system run passed. No adjacent premium/Dave row is promoted by association.', 'Current evidenced classification is **30 PASS / 24 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G2-012 Progress units**, after the real desktop + 390px member journey saved normalised stone/lb and inches values, showed the expected completion outcome and retained the same state after logout/login. No adjacent Progress/premium row is promoted by association.', 'launch reconciliation');
replaceRe('launch', /^\| M13 \| Whole-person Progress \+ proper units \| AMBER — .*$/m, '| M13 | Whole-person Progress + proper units | AMBER — G2-012 has now production-proven the controlled stone/lb + inches round-trip and retained-unit behaviour at desktop + 390px. M13 remains open for the coherent whole-person Progress story and the broader premium Progress presentation; unit closure is not being used to promote adjacent rows. |', 'M13 row');
replaceRe('launch', /^\| B08 \| Dave release-candidate journey \| AMBER — .*$/m, '| B08 | Dave release-candidate journey | AMBER — reconciled evidence remains **16/20 non-duplicated journey legs (80%)**. G1-012 unattended synthetic Dave release coverage is PASS; the remaining Dave boundary is genuine real-inbox registration/verification/recovery plus partner-dependent treatment support. |', 'B08 row');

replace('evidence', '**57 total / 29 PASS / 25 AMBER / 3 BLOCKED / 0 abstraction orphans.**', '**57 total / 30 PASS / 24 AMBER / 3 BLOCKED / 0 abstraction orphans.**', 'ledger scoreboard');
replaceRe('evidence', /^Latest original row closure: .*$/m, 'Latest original row closure: **G2-012 Progress units.** Fresh production rendered acceptance on desktop 1440x900 and mobile 390x844 proves the real Progress Picture member journey: valid image decode, explicit save completion, HTTP 201, correct `15 st 0 lb · 50.0 in waist` rendering, no impossible 14 lb remainder, retained state after logout/fresh login, zero root overflow and no console/page errors. Retained evidence: `docs/evidence/2026-08-13-g2-012-progress-units-rendered-pass.md`. No adjacent Progress/premium row is promoted by association.', 'ledger latest closure');
if (!data.evidence.includes('## Gate 2 Progress units — PASS')) {
  const marker = '## Gate 2 Fit duration/session quality — PASS';
  if (!data.evidence.includes(marker)) throw new Error('ledger insertion marker missing');
  data.evidence = data.evidence.replace(marker, '## Gate 2 Progress units — PASS\n**G2-012 PASS:** production rendered acceptance proves the member-visible unit round-trip at desktop + 390px. `14 st 13.5 lb` normalises to `15 st 0 lb`; `50.0 in waist` is retained; the save succeeds through the production API; and the same values return after logout/login with zero root overflow and no browser errors. Evidence: `docs/evidence/2026-08-13-g2-012-progress-units-rendered-pass.md`.\n\n' + marker);
}

replace('gate', 'must(counts.PASS===29,`original matrix PASS count is 29 (found ${counts.PASS||0})`);', 'must(counts.PASS===30,`original matrix PASS count is 30 (found ${counts.PASS||0})`);', 'gate pass count');
replace('gate', 'must(counts.AMBER===25,`original matrix AMBER count is 25 (found ${counts.AMBER||0})`);', 'must(counts.AMBER===24,`original matrix AMBER count is 24 (found ${counts.AMBER||0})`);', 'gate amber count');
replace('gate', "must(matrix.includes('PASS rows: 29. AMBER rows: 25. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');", "must(matrix.includes('PASS rows: 30. AMBER rows: 24. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');", 'gate matrix summary');
replace('gate', "must(launchFinish.includes('29 PASS / 25 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');", "must(launchFinish.includes('30 PASS / 24 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');", 'gate launch score');

replace('blockers', '**A — V1 RELEASE BLOCKERS: 22 AMBER rows / 7 active shared clusters.**', '**A — V1 RELEASE BLOCKERS: 21 AMBER rows / 7 active shared clusters.**', 'A blocker count');
replaceRe('blockers', /^\*\*A CLOSED: 5 — .*\*\*$/m, '**A CLOSED: 6 — G5-005 public trust architecture, G1-002 production email binding/delivery, G1-009 authenticated cross-browser/mobile regression acceptance, G1-008 rendered loading/empty/success state system, G1-012 unattended synthetic Dave release gate, G2-012 Progress unit round-trip.**', 'A closed line');
replace('blockers', '## A6 Progress core\nG2-011, G2-012. Whole-person Progress story plus controlled kg/stone-lb and metric UX.', '## A6 Progress core\nG2-011. Whole-person Progress story remains open. **G2-012 is PASS:** the real member UI now production-proves correct stone/lb normalisation, inches readback and logout/login retention at desktop + 390px; do not keep the unit defect in the active blocker count.', 'A6 Progress');

for (const [key,p] of Object.entries(paths)) fs.writeFileSync(p, data[key]);
console.log('PASS G2-012 reconciliation: 57 / 30 PASS / 24 AMBER / 3 BLOCKED; Category-A 21 AMBER.');
