import fs from 'node:fs';
const s=fs.readFileSync('docs/V1-RELEASE-BLOCKER-BOARD-V2.md','utf8');
for(const x of ['A — V1 RELEASE BLOCKERS: 27','B — POST-LAUNCH HARDENING: 4','C — EXTERNAL: 3'])if(!s.includes(x))throw new Error(`release-board accounting missing ${x}`);
const ids=[...s.matchAll(/G[1-5]-\d{3}/g)].map(x=>x[0]);const unique=new Set(ids);if(unique.size!==34)throw new Error(`expected 31 AMBER + 3 external unique rows, got ${unique.size}`);
console.log('PASS V1 blocker board: 27 release-blocking AMBER rows / 4 post-launch AMBER rows / 3 external rows; 57-row audit remains separate authority.');