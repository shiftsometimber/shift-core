import fs from 'node:fs';
const s=fs.readFileSync('docs/V1-RELEASE-BLOCKER-BOARD-V2.md','utf8');
for(const x of ['A — V1 RELEASE BLOCKERS: 26','A CLOSED THIS EXECUTION: 1','B — POST-LAUNCH HARDENING: 4','C — EXTERNAL: 3','G5-005 PASS'])if(!s.includes(x))throw new Error(`release-board accounting missing ${x}`);
const counts=fs.readFileSync('docs/V1-RELEASE-BLOCKER-COUNTS.txt','utf8');for(const x of ['A=26','B=4','C=3','AUDIT_PASS=24','AUDIT_AMBER=30','AUDIT_BLOCKED=3'])if(!counts.includes(x))throw new Error(`release-board counts missing ${x}`);
const ids=[...s.matchAll(/G[1-5]-\d{3}/g)].map(x=>x[0]);const unique=new Set(ids);if(unique.size!==34)throw new Error(`expected 30 AMBER + 1 newly closed PASS + 3 external unique rows, got ${unique.size}`);
console.log('PASS V1 blocker board: 1 Category-A blocker closed; 26 release-blocking AMBER / 4 post-launch AMBER / 3 external; audit 24 PASS / 30 AMBER / 3 BLOCKED.');