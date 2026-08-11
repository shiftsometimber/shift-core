import fs from 'node:fs';
let failed=false;const fail=m=>{console.error(m);failed=true};
const src=fs.readFileSync('member-daily-v2.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
for(const s of ["/v1/shift/today","/v1/progress/summary","/v1/plan/list","No dashboard archaeology","Here’s your Shift today","Since you started","kgToStone","current:mapped.filter","replaced:mapped.filter"])if(!src.includes(s))fail(`Missing daily/product contract: ${s}`);
if(!entry.includes('memberDailyV2Routes'))fail('Daily V2 is not wired into production entrypoint');
if(!entry.includes("path.startsWith('/v1/progress/')"))fail('Progress routes are missing from member CORS contract');
if(failed)process.exit(1);
console.log('Gate 2 daily source gate passed: Today, Progress summary and plan manager contracts are wired.');
