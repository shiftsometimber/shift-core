import fs from 'node:fs';

const paths={
  matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',
  launch:'docs/LAUNCH-FINISH-LINE.md',
  evidence:'docs/COMMISSIONING-EVIDENCE.md',
  blockers:'docs/V1-RELEASE-BLOCKER-BOARD-V2.md',
  counts:'docs/V1-RELEASE-BLOCKER-COUNTS.txt'
};
const data=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
const must=(c,m)=>{if(!c)throw new Error(m)};
const replace=(key,from,to,label)=>{must(data[key].includes(from),`missing ${label}`);data[key]=data[key].replace(from,to)};
const replaceRe=(key,re,to,label)=>{must(re.test(data[key]),`missing ${label}`);data[key]=data[key].replace(re,to)};

const regression='Fresh production commissioning has invalidated the earlier p95 PASS. Two consecutive unchanged-main measurements breached the declared **800 ms** member API p95 budget without any change to the security acceptance contract: run `31797697394`, job `94758310882` measured registration p95 **504 ms** and login p95 **895 ms**; run `31798221179`, job `94759928178` measured registration p95 **581 ms** across 17 successful member-handler samples and login p95 **852 ms** across 8 successful natural production samples. Password verification/KDF, lockout semantics and the 800 ms budget remain unchanged. Retained evidence: `docs/evidence/2026-08-14-g5-012-repeatable-auth-p95-regression.md`. Closure requires a real latency remediation or production-side cause followed by fresh unchanged production proof under the same security contract.';

replace('matrix','**Current reconciled scoreboard: 57 total / 50 PASS / 4 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 49 PASS / 5 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
replaceRe('matrix',/^\| G5-012 \| Performance not a release criterion \| \*\*PASS\*\* \|.*$/m,`| G5-012 | Performance not a release criterion | AMBER | ${regression} |`,'G5-012 PASS row');
replaceRe('matrix',/^## \d+-AMBER burn-down classification$/m,'## 5-AMBER burn-down classification','matrix AMBER heading');
must(!/^\| G5-012 \| (?:QUICK KILL|FINITE|LARGE|HUMAN\/DEVICE) \|/m.test(data.matrix),'G5-012 already present in AMBER classification');
replace('matrix','| G2-007 | LARGE | M12 produce/accept genuine premium 26-family launch visuals -> domain QA -> review/publication/serving at scale |','| G2-007 | LARGE | M12 produce/accept genuine premium 26-family launch visuals -> domain QA -> review/publication/serving at scale |\n| G5-012 | FINITE | Diagnose repeatable natural production login p95 breach without weakening password security or changing the 800 ms budget -> remediate -> fresh unchanged-production proof |','matrix AMBER classification insertion');
replace('matrix','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 50. AMBER rows: 4. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 49. AMBER rows: 5. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');

replaceRe('launch',/^\| M06 \| Accessibility \+ performance release check \| \*\*PASS\*\* — .*$/m,`| M06 | Accessibility + performance release check | AMBER — G3-008 accessibility remains PASS. G5-012 performance has been reopened by repeatable fresh production evidence: login p95 **895 ms** then **852 ms** against the unchanged **800 ms** budget on runs \`31797697394\` and \`31798221179\`. Password security and the budget are unchanged; fresh remediation + unchanged-production proof is required. |`,'M06 row');
replaceRe('launch',/^Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*50 PASS \/ 4 AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\*\*\.[^\n]*/m,'Exactly **57** original rows remain mandatory. Current evidenced classification is **49 PASS / 5 AMBER / 3 BLOCKED / 0 abstraction orphans**. Fresh repeatable production evidence on 2026-08-14 reopened **G5-012 performance**: login p95 measured 895 ms and then 852 ms against the unchanged 800 ms budget. Previously earned rows remain locked absent their own regression evidence.','launch reconciliation');
replace('launch','Gate 1 registration, verification and recovery are PASS; Dave is PASS for non-clinical V1 at 19/20 with treatment support external BLOCKED. Gate 2 human editorial/domain decisions remain finite. Gate 3 is fully PASS; Gate 4 proactive Today orchestration is PASS; and all currently automatable non-external Gate 5 original rows are now PASS. Keep human/device and genuine external boundaries honest while continuing only evidence/recovery upkeep and any newly exposed regression defects.','Gate 1 registration, verification and recovery are PASS; Dave is PASS for non-clinical V1 at 19/20 with treatment support external BLOCKED. Gate 2 human editorial/domain decisions remain finite. Gate 3 is fully PASS; Gate 4 proactive Today orchestration is PASS. Gate 5 has one newly exposed non-external regression: G5-012 performance is AMBER until the repeatable login p95 breach is remediated and freshly re-proven. Keep human/device and genuine external boundaries honest while continuing evidence/recovery upkeep and regression repair.','launch swarm');

replaceRe('evidence',/^\*\*57 total \/ \d+ PASS \/ \d+ AMBER \/ 3 BLOCKED \/ 0 abstraction orphans\.\*\*$/m,'**57 total / 49 PASS / 5 AMBER / 3 BLOCKED / 0 abstraction orphans.**','ledger scoreboard');
if(!data.evidence.includes('Latest demonstrated regression: **G5-012')){
  replaceRe('evidence',/^(Latest original row closure: .*\n)/m,`$1\nLatest demonstrated regression: **G5-012 member API performance.** ${regression}\n`,'ledger latest closure anchor');
}
data.evidence=data.evidence.replace(/^\*\*G5-012 PASS:\*\*.*$/gm,`**G5-012 AMBER:** ${regression}`);
replaceRe('evidence',/^## Gate 5 member API performance release criterion — PASS$/m,'## Gate 5 member API performance release criterion — AMBER','ledger G5 heading');
must((data.evidence.match(/^\*\*G5-012 AMBER:\*\*/gm)||[]).length>=2,'ledger G5-012 PASS lines were not reopened');

replace('blockers','**A — V1 RELEASE BLOCKERS: 4 AMBER rows / 1 active shared cluster.**','**A — V1 RELEASE BLOCKERS: 5 AMBER rows / 2 active shared clusters.**','blocker A heading');
replaceRe('blockers',/^\*\*A CLOSED: 23 — (.*)\*\*$/m,(m,list)=>`**A CLOSED: 22 — ${list.replace(', G5-012 member API performance release criterion','').replace('G5-012 member API performance release criterion, ','')}**`,'A closed list');
replaceRe('blockers',/^## A8 Accessibility \+ performance release floor — CLOSED\n\*\*G3-008 and G5-012 PASS\.\*\*.*$/m,`## A8 Accessibility + performance release floor — PERFORMANCE REOPENED\n**G3-008 PASS / G5-012 AMBER.** Accessibility remains production-proven at desktop + 390px. Performance was correctly reopened after consecutive fresh natural production login p95 breaches of **895 ms** and **852 ms** against the unchanged **800 ms** budget. Password security remains unchanged; this cluster closes only after real remediation and fresh unchanged-production proof. Evidence: \`docs/evidence/2026-08-14-g5-012-repeatable-auth-p95-regression.md\`.`,'A8 cluster');

replace('counts','A=4\nB=0\nC=3\nAUDIT_PASS=50\nAUDIT_AMBER=4\nAUDIT_BLOCKED=3\n','A=5\nB=0\nC=3\nAUDIT_PASS=49\nAUDIT_AMBER=5\nAUDIT_BLOCKED=3\n','count snapshot');

for(const [key,p] of Object.entries(paths))fs.writeFileSync(p,data[key]);
console.log('PASS reconciled repeatable G5-012 regression to 49 PASS / 5 AMBER / 3 BLOCKED and A=5');
