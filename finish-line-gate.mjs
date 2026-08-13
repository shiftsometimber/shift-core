import fs from 'node:fs';

let bad = false;
const read = (file) => fs.readFileSync(file, 'utf8');
const must = (condition, message) => { if (!condition) { console.error(`FAIL ${message}`); bad = true; } };

const legacyFinish = read('docs/FINISH-LINE.md');
const launchFinish = read('docs/LAUNCH-FINISH-LINE.md');
const matrix = read('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md');
const recoverySource = read(['auth','recovery-v1.js'].join('-'));
const deliverySource = read(['auth','delivery-v1.js'].join('-'));
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
must(counts.PASS===28,`original matrix PASS count is 28 (found ${counts.PASS||0})`);
must(counts.AMBER===26,`original matrix AMBER count is 26 (found ${counts.AMBER||0})`);
must(counts.BLOCKED===3,`original matrix BLOCKED count is 3 (found ${counts.BLOCKED||0})`);
must(matrix.includes('PASS rows: 28. AMBER rows: 26. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');
must(launchFinish.includes('28 PASS / 26 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');

for(const marker of ['recordAuth'+'Delivery',['password','reset'].join('_'),'binding_'+'missing',"status:'failed'"])must(recoverySource.includes(marker),`delivery recovery ${marker}`);
for(const marker of ['auth_'+'delivery_events','email_'+'hash','authDelivery'+'Health'])must(deliverySource.includes(marker),`delivery store ${marker}`);
for(const marker of ['authDelivery'+'Health','auth_email_','Check email binding/provider delivery'])must(watch.includes(marker),`Watchtower email ${marker}`);

if(bad)process.exit(1);
console.log(`PASS V1 finish-line + 57-row audit crosswalk (${counts.PASS}/${counts.AMBER}/${counts.BLOCKED}) + transactional delivery observability`);
