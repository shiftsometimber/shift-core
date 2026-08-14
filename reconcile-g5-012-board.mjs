import fs from 'node:fs';

const paths={matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',launch:'docs/LAUNCH-FINISH-LINE.md',evidence:'docs/COMMISSIONING-EVIDENCE.md',gate:'finish-line-gate.mjs',blockers:'docs/V1-RELEASE-BLOCKER-BOARD-V2.md',counts:'docs/V1-RELEASE-BLOCKER-COUNTS.txt'};
const data=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
const replace=(key,from,to,label)=>{if(!data[key].includes(from))throw new Error(`missing ${label}`);data[key]=data[key].replace(from,to)};
const replaceRe=(key,re,to,label)=>{if(!re.test(data[key]))throw new Error(`missing ${label}`);data[key]=data[key].replace(re,to)};

const proof='Fresh unchanged production commissioning on main proves the declared 800 ms member API p95 budget after the bounded registration fast-path repair. Natural existing commissioning traffic measured the member handler server-side: registration p95 **350 ms** across 17 samples (median 297, max 350) and login p95 **776 ms** across 11 samples (median 466, max 776). Synthetic GitHub OIDC/fixture overhead is reported separately and is not used to hide member latency; password security was unchanged. Run `31776554705`, job `94693085868`, artifact `9210154378`, digest `sha256:1d0160df5b9d5fe4326761b8d8f76bedc4e3760c8b8ef5ab2b91c24601c0857b`.';

replace('matrix','**Current reconciled scoreboard: 57 total / 36 PASS / 18 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 37 PASS / 17 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
replaceRe('matrix',/^\| G5-012 \| Performance not a release criterion \| AMBER \|.*$/m,`| G5-012 | Performance not a release criterion | **PASS** | ${proof} |`,'G5-012 row');
replace('matrix','## 18-AMBER burn-down classification','## 17-AMBER burn-down classification','matrix amber heading');
replaceRe('matrix',/^\| G5-012 \| FINITE \|.*\n/m,'','G5-012 amber classification');
replace('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 36. AMBER rows: 18. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 37. AMBER rows: 17. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

replaceRe('launch',/^\| M06 \| Accessibility \+ performance release check \| AMBER — .*$/m,`| M06 | Accessibility + performance release check | **PASS** — G3-008 proves the authenticated desktop + 390px accessibility floor and G5-012 now proves the declared 800 ms member API p95 budget on natural production commissioning traffic: registration 350 ms p95 / 17 samples and login 776 ms p95 / 11 samples, with synthetic fixture overhead separated and password security unchanged. |`,'M06 row');
replaceRe('launch',/^Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*36 PASS \/ 18 AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\*\*\.[^\n]*/m,`Exactly **57** original rows remain mandatory. Current evidenced classification is **37 PASS / 17 AMBER / 3 BLOCKED / 0 abstraction orphans**. The latest earned original-row promotion is **G5-012 performance release criterion**, after fresh unchanged production commissioning proved registration 350 ms p95 and login 776 ms p95 against the declared 800 ms member API budget without weakening password security or folding synthetic fixture overhead into the member measurement.`,'launch reconciliation');
replace('launch','In parallel: premium member parity, auth critical-path performance, product analytics, the finite Grub decision review, and 26-family Fit premium visual/domain acceptance.','In parallel: premium member parity, product analytics, the finite Grub decision review, 26-family Fit premium visual/domain acceptance and proactive Today orchestration.','launch swarm');

replace('evidence','**57 total / 36 PASS / 18 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 37 PASS / 17 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
replaceRe('evidence',/^Latest original row closure: .*$/m,`Latest original row closure: **G5-012 performance release criterion.** ${proof}`,'ledger latest closure');
if(!data.evidence.includes('## Gate 5 member API performance release criterion — PASS')) data.evidence += `\n\n## Gate 5 member API performance release criterion — PASS\n**G5-012 PASS:** ${proof}\n`;
replaceRe('evidence',/^## Authenticated accessibility \+ performance — accessibility PASS, performance AMBER$/m,'## Authenticated accessibility + performance — PASS','ledger combined heading');
replaceRe('evidence',/^\*\*G5-012 remains AMBER\.\*\*.*$/m,`**G5-012 PASS:** ${proof}`,'ledger stale G5-012');

replace('gate','must(counts.PASS===36,`original matrix PASS count is 36 (found ${counts.PASS||0})`);','must(counts.PASS===37,`original matrix PASS count is 37 (found ${counts.PASS||0})`);','gate pass count');
replace('gate','must(counts.AMBER===18,`original matrix AMBER count is 18 (found ${counts.AMBER||0})`);','must(counts.AMBER===17,`original matrix AMBER count is 17 (found ${counts.AMBER||0})`);','gate amber count');
replace('gate',"must(matrix.includes('PASS rows: 36. AMBER rows: 18. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 37. AMBER rows: 17. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate matrix summary');
replace('gate',"must(launchFinish.includes('36 PASS / 18 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('37 PASS / 17 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch score');

replace('blockers','**A — V1 RELEASE BLOCKERS: 16 AMBER rows / 6 active shared clusters.**','**A — V1 RELEASE BLOCKERS: 15 AMBER rows / 5 active shared clusters.**','A blocker count');
replaceRe('blockers',/^\*\*A CLOSED: 11 — (.*)\*\*$/m,'**A CLOSED: 12 — $1, G5-012 member API performance release criterion.**','A closed list');
replaceRe('blockers',/^## A8 Accessibility \+ performance release floor\n.*$/m,`## A8 Accessibility + performance release floor — CLOSED\n**G3-008 and G5-012 PASS.** Authenticated desktop + 390px accessibility meets the commissioned contrast/control/focus/landmark/reduced-motion/zero-overflow floor, and fresh natural production member-handler evidence meets the unchanged 800 ms p95 budget: registration 350 ms p95 / 17 samples; login 776 ms p95 / 11 samples.`,'A8 cluster');

replace('counts','A=16\nB=2\nC=3\nAUDIT_PASS=36\nAUDIT_AMBER=18\nAUDIT_BLOCKED=3\n','A=15\nB=2\nC=3\nAUDIT_PASS=37\nAUDIT_AMBER=17\nAUDIT_BLOCKED=3\n','count snapshot');

for(const [key,p] of Object.entries(paths))fs.writeFileSync(p,data[key]);
console.log('PASS reconciled G5-012 production p95 evidence to 37 PASS / 17 AMBER / 3 BLOCKED and A=15');
