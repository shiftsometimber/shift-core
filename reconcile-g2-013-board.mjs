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

replace('matrix', '**Current reconciled scoreboard: 57 total / 31 PASS / 23 AMBER / 3 BLOCKED / 0 unmapped.**', '**Current reconciled scoreboard: 57 total / 32 PASS / 22 AMBER / 3 BLOCKED / 0 unmapped.**', 'matrix scoreboard');
replaceRe('matrix', /^\| G2-013 \| Progress Picture persistence\/reliability incomplete \| AMBER \|.*$/m, '| G2-013 | Progress Picture persistence/reliability incomplete | **PASS** | Fresh unchanged production rendered acceptance proves a real authenticated member saves a valid photo through the rendered product, sees the decoded image and retained metadata across reload and logout/fresh-login return at 1440px and 390px, while a separate member sees no photo; delete then remains deleted across reload and another fresh-login return. Both viewports had zero root overflow and no browser console/page errors. Run `31768040389`, job `94667884627`, artifact `9207081894`, digest `sha256:cb1c50b2ca2af99ae3f56c904cebddc1c44194f06b84584e6762d4bd2229db29`. Evidence: `docs/evidence/2026-08-14-g2-013-progress-picture-rendered-pass.md`. |', 'G2-013 row');
replace('matrix', '## 23-AMBER burn-down classification', '## 22-AMBER burn-down classification', 'amber heading');
replaceRe('matrix', /^\| G2-013 \| HUMAN\/DEVICE \| M01\/B08 rendered\/mobile Progress Picture acceptance \|\n/m, '', 'G2-013 classification');
replace('matrix', 'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 31. AMBER rows: 23. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.', 'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 32. AMBER rows: 22. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.', 'matrix reconciliation');

replace('launch', 'Current evidenced classification is **31 PASS / 23 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G2-011 whole-person Progress**, after the real desktop + 390px member journey rendered retained multi-signal Progress as a coherent story and preserved that outcome after logout/fresh login. No adjacent Progress Picture/premium row is promoted by association.', 'Current evidenced classification is **32 PASS / 22 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G2-013 Progress Picture persistence/reliability**, after the real desktop + 390px rendered member journey saved a valid private photo, retained it through reload/logout/fresh-login, proved another member could not see it, and proved deletion remained deleted through another return. G2-014 premium presentation remains independently AMBER.', 'launch reconciliation');
replaceRe('launch', /^\| M13 \| Whole-person Progress \+ proper units \| AMBER — .*$/m, '| M13 | Whole-person Progress + proper units | AMBER — G2-011, G2-012 and G2-013 are now production PASS: retained whole-person Progress story, controlled stone/lb + inches round-trip, and private Progress Picture save/return/delete reliability are proven at desktop + 390px. M13 remains open only for the separate G2-014 premium Progress Picture presentation boundary; visual quality is not promoted by association. |', 'M13 row');

replace('evidence', '**57 total / 31 PASS / 23 AMBER / 3 BLOCKED / 0 abstraction orphans.**', '**57 total / 32 PASS / 22 AMBER / 3 BLOCKED / 0 abstraction orphans.**', 'ledger scoreboard');
replaceRe('evidence', /^Latest original row closure: .*$/m, 'Latest original row closure: **G2-013 Progress Picture persistence/reliability.** Fresh unchanged production rendered acceptance on desktop 1440x900 and mobile 390x844 proves a real authenticated member saves a valid private photo, sees the decoded image and retained measurements across reload and logout/fresh-login return, while a second member sees none; deletion then persists across reload and another return. Both viewports have zero root overflow and no browser errors. Run `31768040389`, job `94667884627`, artifact `9207081894`, digest `sha256:cb1c50b2ca2af99ae3f56c904cebddc1c44194f06b84584e6762d4bd2229db29`. Retained evidence: `docs/evidence/2026-08-14-g2-013-progress-picture-rendered-pass.md`. G2-014 premium presentation remains independently AMBER.', 'ledger latest closure');
if (!data.evidence.includes('## Gate 2 Progress Picture reliability — PASS')) {
  const marker = '## Gate 2 whole-person Progress — PASS';
  if (!data.evidence.includes(marker)) throw new Error('ledger insertion marker missing');
  data.evidence = data.evidence.replace(marker, '## Gate 2 Progress Picture reliability — PASS\n**G2-013 PASS:** unchanged production rendered acceptance proves the full private photo lifecycle through the member product at desktop + 390px: valid image upload, decoded rendered history, retained metadata after reload, retained image after logout/fresh login, cross-member privacy isolation, rendered delete, and durable deletion after reload and another return. Run `31768040389`, job `94667884627`, artifact `9207081894`, digest `sha256:cb1c50b2ca2af99ae3f56c904cebddc1c44194f06b84584e6762d4bd2229db29`. Evidence: `docs/evidence/2026-08-14-g2-013-progress-picture-rendered-pass.md`. G2-014 remains AMBER because functional reliability is not premium visual acceptance.\n\n' + marker);
}

replace('gate', 'must(counts.PASS===31,`original matrix PASS count is 31 (found ${counts.PASS||0})`);', 'must(counts.PASS===32,`original matrix PASS count is 32 (found ${counts.PASS||0})`);', 'gate pass count');
replace('gate', 'must(counts.AMBER===23,`original matrix AMBER count is 23 (found ${counts.AMBER||0})`);', 'must(counts.AMBER===22,`original matrix AMBER count is 22 (found ${counts.AMBER||0})`);', 'gate amber count');
replace('gate', "must(matrix.includes('PASS rows: 31. AMBER rows: 23. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');", "must(matrix.includes('PASS rows: 32. AMBER rows: 22. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');", 'gate matrix summary');
replace('gate', "must(launchFinish.includes('31 PASS / 23 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');", "must(launchFinish.includes('32 PASS / 22 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');", 'gate launch score');

replace('blockers', '**A — V1 RELEASE BLOCKERS: 20 AMBER rows / 6 active shared clusters.**', '**A — V1 RELEASE BLOCKERS: 19 AMBER rows / 6 active shared clusters.**', 'A blocker count');
replaceRe('blockers', /^\*\*A CLOSED: 7 — .*\*\*$/m, '**A CLOSED: 8 — G5-005 public trust architecture, G1-002 production email binding/delivery, G1-009 authenticated cross-browser/mobile regression acceptance, G1-008 rendered loading/empty/success state system, G1-012 unattended synthetic Dave release gate, G2-012 Progress unit round-trip, G2-011 whole-person Progress story, G2-013 Progress Picture reliability.**', 'A closed line');
replace('blockers', 'G2-013, G2-014, G3-001, G3-002, G3-003, G3-004, G3-005, G3-007. **G1-008 and G1-009 are PASS:**', 'G2-014, G3-001, G3-002, G3-003, G3-004, G3-005, G3-007. **G1-008, G1-009 and G2-013 are PASS:**', 'A2 list');
replace('blockers', 'Premium Progress Picture presentation remains separately open in A2 via G2-013/G2-014 and is not promoted by association.', 'Progress Picture reliability is also PASS through G2-013. Premium Progress Picture presentation remains separately open in A2 via G2-014 and is not promoted by association.', 'A6 Progress scope');

for (const [key,p] of Object.entries(paths)) fs.writeFileSync(p, data[key]);
console.log('PASS G2-013 reconciliation: 57 / 32 PASS / 22 AMBER / 3 BLOCKED; Category-A 19 AMBER.');
