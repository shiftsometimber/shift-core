import fs from 'node:fs';

const paths={matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',launch:'docs/LAUNCH-FINISH-LINE.md',evidence:'docs/COMMISSIONING-EVIDENCE.md',gate:'finish-line-gate.mjs',blockers:'docs/V1-RELEASE-BLOCKER-BOARD-V2.md',counts:'docs/V1-RELEASE-BLOCKER-COUNTS.txt'};
const data=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
const replace=(key,from,to,label)=>{if(!data[key].includes(from))throw new Error(`missing ${label}`);data[key]=data[key].replace(from,to)};
const replaceRe=(key,re,to,label)=>{if(!re.test(data[key]))throw new Error(`missing ${label}`);data[key]=data[key].replace(re,to)};

const proof='Fresh authenticated production accessibility acceptance is GREEN at 1440x900 and 390x844 across My Shift, Today, Grub, Fit and Progress. The unchanged gate proved compliant hero/cream eyebrow contrast, primary-action contrast, form/control boundaries, visible keyboard focus, reduced-motion preference, landmarks and zero document-root overflow with zero failures. Representative observed ratios include 8.93:1 on light-sage hero eyebrows, 5.89:1 on dark-olive cream-surface eyebrows, 6.52:1 on primary actions and 4.52:1 on control boundaries. Run `31776240473`, job `94692136266`, artifact `9209976443`, digest `sha256:301aa895174c01cfc5a2d54c76b92b6fcd2e81eccfb8c3be9352ed0e6aac853e`.';

replace('matrix','**Current reconciled scoreboard: 57 total / 35 PASS / 19 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 36 PASS / 18 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
replaceRe('matrix',/^\| G3-008 \| Accessibility is not a design-system gate \| AMBER \|.*$/m,`| G3-008 | Accessibility is not a design-system gate | **PASS** | ${proof} |`,'G3-008 row');
replaceRe('matrix',/## 19-AMBER burn-down classification/,'## 18-AMBER burn-down classification','matrix amber heading');
replaceRe('matrix',/^\| G3-008 \|.*\n/m,'','G3-008 amber classification');
replace('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 35. AMBER rows: 19. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 36. AMBER rows: 18. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

replaceRe('launch',/Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*35 PASS \/ 19 AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\*\*\.[^\n]*/m,`Exactly **57** original rows remain mandatory. Current evidenced classification is **36 PASS / 18 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G3-008 accessibility design-system gate**, after fresh authenticated production acceptance passed desktop + 390px contrast, controls, focus, reduced motion, landmarks and overflow with zero failures.`,'launch reconciliation');

replace('evidence','**57 total / 35 PASS / 19 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 36 PASS / 18 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
replaceRe('evidence',/^Latest original row closure: .*$/m,`Latest original row closure: **G3-008 accessibility design-system gate.** ${proof}`,'ledger latest closure');
if(!data.evidence.includes('## Gate 3 accessibility design-system gate — PASS')) data.evidence += `\n\n## Gate 3 accessibility design-system gate — PASS\n**G3-008 PASS:** ${proof}\n`;

replace('gate','must(counts.PASS===35,`original matrix PASS count is 35 (found ${counts.PASS||0})`);','must(counts.PASS===36,`original matrix PASS count is 36 (found ${counts.PASS||0})`);','gate pass count');
replace('gate','must(counts.AMBER===19,`original matrix AMBER count is 19 (found ${counts.AMBER||0})`);','must(counts.AMBER===18,`original matrix AMBER count is 18 (found ${counts.AMBER||0})`);','gate amber count');
replace('gate',"must(matrix.includes('PASS rows: 35. AMBER rows: 19. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 36. AMBER rows: 18. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
replace('gate',"must(launchFinish.includes('35 PASS / 19 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('36 PASS / 18 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch score');

replace('blockers','**A — V1 RELEASE BLOCKERS: 17 AMBER rows / 6 active shared clusters.**','**A — V1 RELEASE BLOCKERS: 16 AMBER rows / 6 active shared clusters.**','A blocker count');
replaceRe('blockers',/^\*\*A CLOSED: 10 — (.*)\*\*$/m,'**A CLOSED: 11 — $1, G3-008 accessibility design-system gate.**','A closed list');
replaceRe('blockers',/^## A8 Accessibility\/performance\n.*$/m,`## A8 Accessibility/performance\n**G3-008 PASS:** authenticated production accessibility is green at desktop + 390px for contrast, controls, focus, reduced motion, landmarks and zero root overflow. **G5-012 remains AMBER** until fresh post-optimisation production p95 proves both registration and login within the unchanged 800ms budget.`,'A8 cluster');

replace('counts','A=17\nB=2\nC=3\nAUDIT_PASS=35\nAUDIT_AMBER=19\nAUDIT_BLOCKED=3\n','A=16\nB=2\nC=3\nAUDIT_PASS=36\nAUDIT_AMBER=18\nAUDIT_BLOCKED=3\n','count snapshot');

for(const [key,p] of Object.entries(paths))fs.writeFileSync(p,data[key]);
console.log('PASS reconciled G3-008 to 36 PASS / 18 AMBER / 3 BLOCKED and A=16');
