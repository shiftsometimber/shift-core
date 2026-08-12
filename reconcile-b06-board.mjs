import fs from 'node:fs';

const files={
  matrix:'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',
  launch:'docs/LAUNCH-FINISH-LINE.md',
  evidence:'docs/COMMISSIONING-EVIDENCE.md',
  gate:'finish-line-gate.mjs'
};
const read=k=>fs.readFileSync(files[k],'utf8');
const write=(k,s)=>fs.writeFileSync(files[k],s);
const must=(s,from,to,label)=>{if(!s.includes(from))throw new Error(`missing ${label}: ${from}`);return s.replaceAll(from,to)};

let matrix=read('matrix');
matrix=must(matrix,'57 total / 19 PASS / 35 AMBER / 3 BLOCKED / 0 unmapped','57 total / 20 PASS / 34 AMBER / 3 BLOCKED / 0 unmapped','matrix scoreboard');
matrix=must(matrix,'| G5-008 | HQ is admin UI rather than operating nerve centre | AMBER | Attention endpoint exists; authorised operator fire-drill evidence remains B06. |','| G5-008 | HQ is admin UI rather than operating nerve centre | **PASS** | Authorised HQ-session fire drill proves anonymous denial, GREEN baseline, actionable AMBER/RED state, operator next action, retained history, persisted acknowledgement/resolution and recovery reflected through the real HQ routes. |','G5-008 row');
matrix=must(matrix,'## 35-AMBER burn-down classification','## 34-AMBER burn-down classification','amber heading');
matrix=must(matrix,'| G5-008 | QUICK KILL | B06 authorised HQ operator fire drill |\n','','remove closed quick kill');
matrix=must(matrix,'PASS rows: 19. AMBER rows: 35. BLOCKED rows: 3.','PASS rows: 20. AMBER rows: 34. BLOCKED rows: 3.','matrix reconciliation');
write('matrix',matrix);

let launch=read('launch');
launch=must(launch,'| B06 | HQ production operation | AMBER — authorised operator must see actionable AMBER/RED, next action and recovery |','| B06 | HQ production operation | **PASS** — authorised real HQ-session fire drill proves anonymous denial, actionable AMBER/RED, operator next action, persisted operator acknowledgement/resolution, retained incident history and reflected recovery |','B06 launch row');
launch=must(launch,'19 PASS / 35 AMBER / 3 BLOCKED','20 PASS / 34 AMBER / 3 BLOCKED','launch scoreboard');
launch=must(launch,'The 35 remaining AMBERs are classified','The 34 remaining AMBERs are classified','launch amber count');
write('launch',launch);

let evidence=read('evidence');
if(!evidence.includes('## B06 / original G5-008 — PASS')){
  const marker='## G1-010 + M05 / original G5-011 — PASS';
  const block='## B06 / original G5-008 — PASS\nPR #93 passed the unchanged Master Integration gate and merged. The authorised HQ operator fire drill uses a genuine HQ session through the real `/v1/hq/attention` and `/v1/hq/watchtower` routes; denies anonymous operational attention; proves GREEN baseline, actionable AMBER/RED degradation, operator next actions, retained incident history, persisted acknowledgement/resolution and recovery back to GREEN without deliberately breaking production dependencies. This closes B06/G5-008.\n\n';
  if(!evidence.includes(marker))throw new Error('evidence insertion marker missing');
  evidence=evidence.replace(marker,block+marker);
}
evidence=must(evidence,'57 total / 19 PASS / 35 AMBER / 3 BLOCKED / 0 abstraction orphans.','57 total / 20 PASS / 34 AMBER / 3 BLOCKED / 0 abstraction orphans.','evidence scoreboard');
evidence=must(evidence,'B01; B03 rendered only; B05; B06; B08;','B01; B03 rendered only; B05; B08;','evidence active swarm');
write('evidence',evidence);

let gate=read('gate');
gate=must(gate,"must(counts.PASS===19,`original matrix PASS count is 19 (found ${counts.PASS||0})`);","must(counts.PASS===20,`original matrix PASS count is 20 (found ${counts.PASS||0})`);",'gate pass count');
gate=must(gate,"must(counts.AMBER===35,`original matrix AMBER count is 35 (found ${counts.AMBER||0})`);","must(counts.AMBER===34,`original matrix AMBER count is 34 (found ${counts.AMBER||0})`);",'gate amber count');
gate=must(gate,"must(matrix.includes('PASS rows: 19. AMBER rows: 35. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 20. AMBER rows: 34. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');",'gate summary');
gate=must(gate,"must(launchFinish.includes('19 PASS / 35 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('20 PASS / 34 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');",'gate launch scoreboard');
write('gate',gate);
console.log('PASS B06 authoritative reconciliation: 57 / 20 PASS / 34 AMBER / 3 BLOCKED.');
