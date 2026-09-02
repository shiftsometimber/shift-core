import fs from 'node:fs';
let failed=false;const fail=m=>{console.error(m);failed=true};
const src=fs.readFileSync('member-daily-v2.js','utf8');
const brain=fs.readFileSync('member-daily-v3.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
for(const s of ["/v1/shift/today","/v1/progress/summary","/v1/plan/list","No dashboard archaeology","Here’s your Shift today","Since you started","kgToStone","current:mapped.filter","replaced:mapped.filter"])if(!src.includes(s))fail(`Missing daily/product contract: ${s}`);
if(!entry.includes('memberDailyV3Routes'))fail('Daily V3 Brain wrapper is not wired into production entrypoint');
if(!brain.includes('memberDailyV2Routes'))fail('Daily V3 is not delegating to proven V2 product contract');
if(!brain.includes('canonical_contract:brainContract')||!brain.includes("brain?.contract||'one-shift-brain-v1'"))fail('Daily V3 does not expose canonical Brain context evidence with a safe fallback');
if(!entry.includes("path.startsWith('/v1/progress/')"))fail('Progress routes are missing from member CORS contract');
if(failed)process.exit(1);
console.log('Gate 2 daily source gate passed: Today V3 Brain wrapper preserves Today/Progress/Plans contract.');

// G2-001 stays in the existing Today lane: prove the presentation consumes the canonical
// contract and is published by the same Git-authoritative member runtime rather than a parallel dashboard.
await import('./g2-001-today-premium-source-gate.mjs');

// G2-012 compares Git source with the deployed Worker. A pull request must validate source
// before it can be deployed; the production promotion workflow runs the exact live hash proof.
if(process.env.GITHUB_EVENT_NAME!=='pull_request')await import('./g2-012-production-proof.mjs');
else console.log('G2-012 live hash proof is deferred to post-deployment production promotion.');
