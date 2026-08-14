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
const regression='Fresh production commissioning invalidated the earlier p95 PASS. Two consecutive unchanged-main measurements breached the declared **800 ms** member API p95 budget: run `31797697394`, job `94758310882` measured registration p95 **504 ms** and login p95 **895 ms**; run `31798221179`, job `94759928178` measured registration p95 **581 ms** across 17 successful member-handler samples and login p95 **852 ms** across 8 successful natural production samples. Password verification/KDF, lockout semantics and the 800 ms budget remain unchanged. Evidence: `docs/evidence/2026-08-14-g5-012-repeatable-auth-p95-regression.md`. Closure requires real latency remediation or a demonstrated production-side cause followed by fresh unchanged-production proof under the same security contract.';

// Matrix is the source of truth. Reopen only G5-012 and derive counts from the actual 57 rows.
must(/^\| G5-012 \| Performance not a release criterion \| (?:\*\*PASS\*\*|AMBER) \|/m.test(data.matrix),'G5-012 row missing');
data.matrix=data.matrix.replace(/^\| G5-012 \| Performance not a release criterion \| (?:\*\*PASS\*\*|AMBER) \|.*$/m,`| G5-012 | Performance not a release criterion | AMBER | ${regression} |`);
const rows=[...data.matrix.matchAll(/^\| (G[1-5]-\d{3}) \|[^\n]*?\| (\*\*PASS\*\*|AMBER|BLOCKED) \|/gm)].map(m=>m[2].replace(/\*/g,''));
must(rows.length===57,`expected 57 matrix rows, found ${rows.length}`);
const counts=rows.reduce((a,s)=>(a[s]=(a[s]||0)+1,a),{PASS:0,AMBER:0,BLOCKED:0});
must(counts.PASS+counts.AMBER+counts.BLOCKED===57,'matrix counts do not total 57');
data.matrix=data.matrix.replace(/\*\*Current reconciled scoreboard: 57 total \/ \d+ PASS \/ \d+ AMBER \/ \d+ BLOCKED \/ 0 unmapped\.\*\*/,`**Current reconciled scoreboard: 57 total / ${counts.PASS} PASS / ${counts.AMBER} AMBER / ${counts.BLOCKED} BLOCKED / 0 unmapped.**`);
data.matrix=data.matrix.replace(/^## \d+-AMBER burn-down classification$/m,`## ${counts.AMBER}-AMBER burn-down classification`);
if(!/^\| G5-012 \| (?:QUICK KILL|FINITE|LARGE|HUMAN\/DEVICE) \|/m.test(data.matrix)){
  const anchor='| G2-007 | LARGE | M12 produce/accept genuine premium 26-family launch visuals -> domain QA -> review/publication/serving at scale |';
  must(data.matrix.includes(anchor),'matrix classification insertion anchor missing');
  data.matrix=data.matrix.replace(anchor,`${anchor}\n| G5-012 | FINITE | Diagnose repeatable natural production login p95 breach without weakening password security or changing the 800 ms budget -> remediate -> fresh unchanged-production proof |`);
}
data.matrix=data.matrix.replace(/All 57 original audit requirements remain represented exactly once in the matrix\. PASS rows: \d+\. AMBER rows: \d+\. BLOCKED rows: \d+\. Total: 57\. Zero row may be removed or compressed away\./,`All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: ${counts.PASS}. AMBER rows: ${counts.AMBER}. BLOCKED rows: ${counts.BLOCKED}. Total: 57. Zero row may be removed or compressed away.`);

// Launch board: accessibility stays earned; performance reopens.
data.launch=data.launch.replace(/^\| M06 \| Accessibility \+ performance release check \|.*$/m,'| M06 | Accessibility + performance release check | AMBER — G3-008 accessibility remains PASS. G5-012 performance is reopened by repeatable fresh production evidence: login p95 **895 ms** then **852 ms** against the unchanged **800 ms** budget on runs `31797697394` and `31798221179`. Password security and the budget are unchanged; fresh remediation + unchanged-production proof is required. |');
data.launch=data.launch.replace(/^Exactly \*\*57\*\* original rows remain mandatory\. Current evidenced classification is \*\*\d+ PASS \/ \d+ AMBER \/ \d+ BLOCKED \/ 0 abstraction orphans\*\*\.[^\n]*/m,`Exactly **57** original rows remain mandatory. Current evidenced classification is **${counts.PASS} PASS / ${counts.AMBER} AMBER / ${counts.BLOCKED} BLOCKED / 0 abstraction orphans**. Fresh repeatable production evidence on 2026-08-14 reopened **G5-012 performance**: login p95 measured 895 ms and then 852 ms against the unchanged 800 ms budget. Previously earned rows remain locked absent their own regression evidence.`);
data.launch=data.launch.replace(/^Gate 1 registration, verification and recovery are PASS; Dave is PASS for non-clinical V1 at 19\/20 with treatment support external BLOCKED\.[^\n]*$/m,'Gate 1 registration, verification and recovery are PASS; Dave is PASS for non-clinical V1 at 19/20 with treatment support external BLOCKED. Gate 2 human editorial/domain decisions remain finite. Gate 3 is fully PASS; Gate 4 proactive Today orchestration is PASS. Gate 5 has one newly exposed non-external regression: G5-012 performance is AMBER until the repeatable login p95 breach is remediated and freshly re-proven. Keep human/device and genuine external boundaries honest while continuing evidence/recovery upkeep and regression repair.');

// Evidence ledger had drifted behind the matrix; reconcile it to the matrix while retaining both old and new proof history.
data.evidence=data.evidence.replace(/^\*\*57 total \/ \d+ PASS \/ \d+ AMBER \/ \d+ BLOCKED \/ 0 abstraction orphans\.\*\*$/m,`**57 total / ${counts.PASS} PASS / ${counts.AMBER} AMBER / ${counts.BLOCKED} BLOCKED / 0 abstraction orphans.**`);
if(!data.evidence.includes('Latest demonstrated regression: **G5-012')){
  data.evidence=data.evidence.replace(/^(Latest original row closure: .*\n)/m,`$1\nLatest demonstrated regression: **G5-012 member API performance.** ${regression}\n`);
}
data.evidence=data.evidence.replace(/^\*\*G5-012 PASS:\*\*.*$/gm,`**G5-012 AMBER:** ${regression}`);
data.evidence=data.evidence.replace(/^## Gate 5 member API performance release criterion — PASS$/m,'## Gate 5 member API performance release criterion — AMBER');
must((data.evidence.match(/^\*\*G5-012 AMBER:\*\*/gm)||[]).length>=2,'evidence ledger did not reopen G5-012 proof lines');

// Operational blocker board: four finite Gate 2 rows + reopened performance row.
const compactBefore=Object.fromEntries(data.counts.trim().split(/\r?\n/).map(line=>line.split('=').map(x=>x.trim())));
const B=Number(compactBefore.B||0);
const A=counts.AMBER-B;
must(Number.isInteger(A)&&A>=0,'derived A count invalid');
data.blockers=data.blockers.replace(/^\*\*A — V1 RELEASE BLOCKERS: \d+ AMBER rows \/ \d+ active shared clusters\.\*\*$/m,`**A — V1 RELEASE BLOCKERS: ${A} AMBER rows / 2 active shared clusters.**`);
data.blockers=data.blockers.replace(/^\*\*A CLOSED: (\d+) — (.*)\*\*$/m,(m,n,list)=>{
  if(!list.includes('G5-012 member API performance release criterion'))return m;
  const cleaned=list.replace(', G5-012 member API performance release criterion','').replace('G5-012 member API performance release criterion, ','');
  return `**A CLOSED: ${Math.max(0,Number(n)-1)} — ${cleaned}**`;
});
data.blockers=data.blockers.replace(/^## A8 Accessibility \+ performance release floor — CLOSED\n\*\*G3-008 and G5-012 PASS\.\*\*.*$/m,'## A8 Accessibility + performance release floor — PERFORMANCE REOPENED\n**G3-008 PASS / G5-012 AMBER.** Accessibility remains production-proven at desktop + 390px. Performance was correctly reopened after consecutive fresh natural production login p95 breaches of **895 ms** and **852 ms** against the unchanged **800 ms** budget. Password security remains unchanged; this cluster closes only after real remediation and fresh unchanged-production proof. Evidence: `docs/evidence/2026-08-14-g5-012-repeatable-auth-p95-regression.md`.');

// Compact counts are regenerated, not hand-maintained.
data.counts=`A=${A}\nB=${B}\nC=${counts.BLOCKED}\nAUDIT_PASS=${counts.PASS}\nAUDIT_AMBER=${counts.AMBER}\nAUDIT_BLOCKED=${counts.BLOCKED}\n`;

for(const [key,p] of Object.entries(paths))fs.writeFileSync(p,data[key]);
console.log(`PASS reconciled G5-012 regression: ${counts.PASS} PASS / ${counts.AMBER} AMBER / ${counts.BLOCKED} BLOCKED; A=${A}`);
