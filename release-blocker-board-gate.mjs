import fs from 'node:fs';
const s=fs.readFileSync('docs/V1-RELEASE-BLOCKER-BOARD-V2.md','utf8');
for(const x of ['A — V1 RELEASE BLOCKERS: 24','A CLOSED: 3','B — POST-LAUNCH HARDENING: 4','C — EXTERNAL: 3','G5-005 PASS','G1-009 is PASS'])if(!s.includes(x))throw new Error(`release-board accounting missing ${x}`);
const counts=fs.readFileSync('docs/V1-RELEASE-BLOCKER-COUNTS.txt','utf8');
for(const x of ['A=24','B=4','C=3','AUDIT_PASS=26','AUDIT_AMBER=28','AUDIT_BLOCKED=3'])if(!counts.includes(x))throw new Error(`release-board counts missing ${x}`);
const ids=[...s.matchAll(/G[1-5]-\d{3}/g)].map(x=>x[0]);
const unique=new Set(ids);
if(unique.size!==34)throw new Error(`expected 24 release AMBER + 4 post-launch AMBER + 3 external + 3 explicitly retained closed rows, got ${unique.size}`);
console.log('PASS V1 blocker board: 3 Category-A blockers closed; 24 release-blocking AMBER / 4 post-launch AMBER / 3 external; audit 26 PASS / 28 AMBER / 3 BLOCKED.');
