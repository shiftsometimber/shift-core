import fs from 'node:fs';
const s=fs.readFileSync('docs/V1-RELEASE-BLOCKER-BOARD-V2.md','utf8');
for(const x of ['A — V1 RELEASE BLOCKERS: 23','A CLOSED: 4','B — POST-LAUNCH HARDENING: 3','C — EXTERNAL: 3','G5-005 PASS','G1-008 and G1-009 are PASS','G2-009 is no longer in B'])if(!s.includes(x))throw new Error(`release-board accounting missing ${x}`);
const counts=fs.readFileSync('docs/V1-RELEASE-BLOCKER-COUNTS.txt','utf8');
for(const x of ['A=23','B=3','C=3','AUDIT_PASS=28','AUDIT_AMBER=26','AUDIT_BLOCKED=3'])if(!counts.includes(x))throw new Error(`release-board counts missing ${x}`);
const ids=[...s.matchAll(/G[1-5]-\d{3}/g)].map(x=>x[0]);
const unique=new Set(ids);
if(unique.size!==34)throw new Error(`expected 23 release AMBER + 3 post-launch AMBER + 3 external + 4 explicitly retained Category-A closed rows + G2-009 retained PASS, got ${unique.size}`);
console.log('PASS V1 blocker board: 4 Category-A blockers closed; 23 release-blocking AMBER / 3 post-launch AMBER / 3 external; audit 28 PASS / 26 AMBER / 3 BLOCKED; G1-008 and G2-009 retained as evidenced PASS.');
