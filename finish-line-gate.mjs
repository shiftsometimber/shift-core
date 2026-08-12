import fs from 'node:fs';

let bad = false;
const read = (file) => fs.readFileSync(file, 'utf8');
const must = (condition, message) => { if (!condition) { console.error(`FAIL ${message}`); bad = true; } };

const legacyFinish = read('docs/FINISH-LINE.md');
const launchFinish = read('docs/LAUNCH-FINISH-LINE.md');
const matrix = read('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md');
const auth = read('auth-recovery-v1.js');
const delivery = read('auth-delivery-v1.js');
const watch = read('watchtower-v1.js');

for (const marker of ['## BLOCKER','## MUST FINISH','## POST-LAUNCH','B-01','B-08','M-09','Critical path','Recovery rule']) must(legacyFinish.includes(marker),`legacy finish line ${marker}`);
must((legacyFinish.match(/^B-\d+/gm)||[]).length===8,'exactly 8 legacy blocker IDs');
must((legacyFinish.match(/^M-\d+/gm)||[]).length===9,'exactly 9 legacy must-finish IDs');

for (const marker of ['B01','B08','M01','M17','B03 production behavioural subrows closed: **9/9**','Original-audit reconciliation']) must(launchFinish.includes(marker),`launch finish line ${marker}`);
for(let n=9;n<=17;n+=1){const id=`M${String(n).padStart(2,'0')}`;must(launchFinish.includes(`| ${id} |`),`restored anti-abstraction row ${id}`)}

const rows=[...matrix.matchAll(/^\| (G[1-5]-\d{3}) \|[^\n]*?\| (\*\*PASS\*\*|AMBER|BLOCKED) \|/gm)].map(m=>({id:m[1],status:m[2].replace(/\*/g,'')}));
const ids=rows.map(x=>x.id),unique=new Set(ids);
must(rows.length===57,`original remediation matrix has 57 status-bearing rows (found ${rows.length})`);
must(unique.size===57,`original remediation matrix has 57 unique IDs (found ${unique.size})`);
for(const gate of [1,2,3,4,5])must(ids.some(id=>id.startsWith(`G${gate}-`)),`Gate ${gate} remains represented`);
const counts=rows.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{});
const pass=counts.PASS||0,amber=counts.AMBER||0,blocked=counts.BLOCKED||0;
must(pass+amber+blocked===57,`original matrix status counts reconcile to 57 (found ${pass+amber+blocked})`);
must(blocked===3,`original matrix retains exactly 3 external BLOCKED rows (found ${blocked})`);
const blockedIds=rows.filter(x=>x.status==='BLOCKED').map(x=>x.id).sort();
must(JSON.stringify(blockedIds)===JSON.stringify(['G5-001','G5-002','G5-003']),'only the three genuine external clinical/provider rows are BLOCKED');
const reconciliation=`PASS rows: ${pass}. AMBER rows: ${amber}. BLOCKED rows: ${blocked}.`;
must(matrix.includes(reconciliation),'matrix reconciliation summary matches computed evidence-led counts');
const launchScore=`${pass} PASS / ${amber} AMBER / ${blocked} BLOCKED`;
must(launchFinish.includes(launchScore),'launch board scoreboard matches computed matrix counts');

for(const marker of ['recordAuthDelivery','password_reset','binding_missing',"status:'failed'"])must(auth.includes(marker),`auth delivery ${marker}`);
for(const marker of ['auth_delivery_events','email_hash','authDeliveryHealth'])must(delivery.includes(marker),`delivery store ${marker}`);
for(const marker of ['authDeliveryHealth','auth_email_','Check email binding/provider delivery'])must(watch.includes(marker),`Watchtower email ${marker}`);

if(bad)process.exit(1);
console.log(`PASS V1 finish-line + 57-row audit crosswalk (${pass}/${amber}/${blocked}) + transactional auth observability`);
