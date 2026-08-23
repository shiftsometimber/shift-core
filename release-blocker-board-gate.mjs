// Evidence-led release accounting gate. Fail closed if the authoritative matrix, compact counts and release board drift.
import fs from 'node:fs';

const board=fs.readFileSync('docs/V1-RELEASE-BLOCKER-BOARD-V2.md','utf8');
const countsText=fs.readFileSync('docs/V1-RELEASE-BLOCKER-COUNTS.txt','utf8');
const matrix=fs.readFileSync('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md','utf8');

const counts=Object.fromEntries(countsText.trim().split(/\r?\n/).map(line=>line.split('=').map(x=>x.trim())));
for(const key of ['A','B','C','AUDIT_PASS','AUDIT_AMBER','AUDIT_BLOCKED']){
  if(!/^\d+$/.test(String(counts[key]??''))) throw new Error(`release-board count missing/invalid ${key}`);
  counts[key]=Number(counts[key]);
}
if(counts.A+counts.B!==counts.AUDIT_AMBER) throw new Error(`AMBER classification drift A+B=${counts.A+counts.B} audit=${counts.AUDIT_AMBER}`);
if(counts.C!==counts.AUDIT_BLOCKED) throw new Error(`BLOCKED classification drift C=${counts.C} audit=${counts.AUDIT_BLOCKED}`);
if(counts.AUDIT_PASS+counts.AUDIT_AMBER+counts.AUDIT_BLOCKED!==57) throw new Error('authoritative audit total is not 57');

for(const x of [
  `A — V1 RELEASE BLOCKERS: ${counts.A} AMBER rows`,
  `B — POST-LAUNCH HARDENING: ${counts.B} AMBER rows`,
  `C — EXTERNAL: ${counts.C} BLOCKED rows`
]) if(!board.includes(x)) throw new Error(`release-board accounting missing ${x}`);

const scoreboard=`Current reconciled scoreboard: 57 total / ${counts.AUDIT_PASS} PASS / ${counts.AUDIT_AMBER} AMBER / ${counts.AUDIT_BLOCKED} BLOCKED / 0 unmapped.`;
if(!matrix.includes(scoreboard)) throw new Error(`matrix scoreboard drift: expected ${scoreboard}`);

const authoritative=matrix.split('## 8-AMBER burn-down classification')[0];
const rows=authoritative.split(/\r?\n/).filter(line=>/^\| G[1-5]-\d{3} \|/.test(line));
if(rows.length!==57) throw new Error(`expected 57 authoritative matrix rows, got ${rows.length}`);
const tally={PASS:0,AMBER:0,BLOCKED:0};
for(const row of rows){
  const cells=row.split('|').map(x=>x.trim()).filter(Boolean);
  const status=String(cells[2]||'').replace(/\*/g,'').trim();
  if(!(status in tally)) throw new Error(`unknown matrix status ${status} in ${cells[0]}`);
  tally[status]++;
}
if(tally.PASS!==counts.AUDIT_PASS||tally.AMBER!==counts.AUDIT_AMBER||tally.BLOCKED!==counts.AUDIT_BLOCKED){
  throw new Error(`matrix row tally drift ${JSON.stringify(tally)} vs counts ${counts.AUDIT_PASS}/${counts.AUDIT_AMBER}/${counts.AUDIT_BLOCKED}`);
}

console.log(`PASS V1 blocker board: A=${counts.A}, B=${counts.B}, C=${counts.C}; audit ${tally.PASS} PASS / ${tally.AMBER} AMBER / ${tally.BLOCKED} BLOCKED; all 57 authoritative rows reconciled.`);
