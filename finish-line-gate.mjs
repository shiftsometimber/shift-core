import fs from'node:fs';
import {GRUB_BATCH_001} from './content/grub-batch-001.js';
import {FIT_BATCH_001} from './content/fit-batch-001.js';
import {validateContentItem} from './content-factory-v1.js';
let bad=false;const r=f=>fs.readFileSync(f,'utf8'),must=(x,m)=>{if(!x){console.error('FAIL '+m);bad=true}};
const finish=r('docs/LAUNCH-FINISH-LINE.md'),crosswalk=r('docs/ORIGINAL-AUDIT-CROSSWALK.md'),auth=r('auth-recovery-v1.js'),delivery=r('auth-delivery-v1.js'),watch=r('watchtower-v1.js');
for(const x of ['## BLOCKERS','## MUST FINISH','B01','B08','M01','M17','## ORIGINAL-AUDIT RECONCILIATION','57 total','0 unmapped'])must(finish.includes(x),`launch finish line ${x}`);
for(let i=1;i<=17;i++){const id=`M${String(i).padStart(2,'0')}`;must(finish.includes(`| ${id} |`),`missing restored must-finish ${id}`)}
const originals=[...crosswalk.matchAll(/\| (G[1-5]-\d{3}) \| (PASS|AMBER|BLOCKED) \|/g)].map(x=>({id:x[1],status:x[2]}));
must(originals.length===57,'crosswalk must contain exactly 57 mapped original requirements');must(new Set(originals.map(x=>x.id)).size===57,'crosswalk original IDs must be unique');
const counts=originals.reduce((a,x)=>(a[x.status]++,a),{PASS:0,AMBER:0,BLOCKED:0});must(counts.PASS===9&&counts.AMBER===45&&counts.BLOCKED===3,`crosswalk scoreboard ${JSON.stringify(counts)}`);
for(const id of ['G1-003','G1-004'])must(crosswalk.includes(`| ${id} | AMBER | M09 |`),`${id} email verification mapping`);
for(const id of ['G2-002','G2-003','G2-004'])must(crosswalk.includes(`| ${id} | AMBER | M11 |`),`${id} Grub catalogue mapping`);
for(const id of ['G2-006','G2-007'])must(crosswalk.includes(`| ${id} | AMBER | M12 |`),`${id} Fit catalogue mapping`);
for(const item of [...GRUB_BATCH_001,...FIT_BATCH_001]){const v=validateContentItem(item);must(v.ok,`${item.id} deterministic content validation: ${v.errors.join(',')}`)}
must(GRUB_BATCH_001.every(x=>x.data.nutrition.status==='estimated_pending_validation'),'new Grub batch must not fabricate validated nutrition');
must(FIT_BATCH_001.filter(x=>x.data.visualGuidance.status==='approved').every(x=>x.data.visualGuidance.assetRef),'approved Fit visual must have asset');
for(const x of ['recordAuthDelivery','password_reset','binding_missing','status:\x27failed\x27'])must(auth.includes(x),`auth delivery ${x}`);for(const x of ['auth_delivery_events','email_hash','authDeliveryHealth'])must(delivery.includes(x),`delivery store ${x}`);for(const x of ['authDeliveryHealth','auth_email_','Check email binding/provider delivery'])must(watch.includes(x),`Watchtower email ${x}`);
if(bad)process.exit(1);console.log(`PASS finish-line 57/57 crosswalk + M01-M17 + content factory contract — ${GRUB_BATCH_001.length} recipe drafts, ${FIT_BATCH_001.length} exercise drafts`);
