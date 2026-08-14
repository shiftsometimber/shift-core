import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shift-final-gate2-reconcile-'));
fs.cpSync('docs',path.join(tmp,'docs'),{recursive:true});
const serving={proof:'FINAL_V1_AUTHENTICATED_PRODUCTION_SERVING_V1',failures:[],summary:{grub:{acceptedAvailable:798,served:28,unique:28,nayRetained:'recipe-proof'},fit:{acceptedAvailable:1326,uniqueCanonical:12,nayRetained:'exercise-proof'},analytics:{grubPlanGenerated:true,fitPlanGenerated:true},retainedReturn:true}};
const publication={proof:'FINAL_V1_PRODUCTION_PUBLICATION_READY_V1',status:'PASS',grub:{published:798},fit:{published:1326},totalPublished:2124,partialPublicationAllowed:false};
const ids=['calf-raise','chair-balance-reach','chest-press','dead-bug','glute-bridge','hamstring-mobility','hip-flexor-mobility','hip-hinge','lat-pulldown','loaded-carry','low-impact-march','overhead-press','plank','push-up','reverse-lunge','row','rowing-erg','shadow-boxing','sit-to-stand','squat','stationary-bike','step-up','thoracic-rotation','triceps-extension','walk','wall-slides'];
const visual={proof:'FIT_V1_26_PREMIUM_ASSETS_PRODUCTION_HTTP_V1',status:'PASS',accepted:26,served:26,allThreeStates:true,rows:ids.map(id=>({id,ok:true}))};
const servingPath=path.join(tmp,'serving.json'),publicationPath=path.join(tmp,'publication.json'),visualPath=path.join(tmp,'visual.json');
fs.writeFileSync(servingPath,JSON.stringify(serving));fs.writeFileSync(publicationPath,JSON.stringify(publication));fs.writeFileSync(visualPath,JSON.stringify(visual));
const run=spawnSync(process.execPath,['reconcile-final-v1-gate2-board.mjs'],{cwd:process.cwd(),encoding:'utf8',env:{...process.env,RECONCILE_ROOT:tmp,FINAL_V1_SERVING_REPORT:servingPath,FINAL_V1_PUBLICATION_SUMMARY:publicationPath,FINAL_V1_FIT_ASSET_REPORT:visualPath,GITHUB_RUN_ID:'synthetic-reconciliation-gate',FINAL_V1_SOURCE_SHA:'synthetic-source-sha'}});
if(run.status!==0){process.stderr.write(run.stdout||'');process.stderr.write(run.stderr||'');throw new Error(`reconciliation script failed synthetic exact-production proof: ${run.status}`)}
const counts=fs.readFileSync(path.join(tmp,'docs/V1-RELEASE-BLOCKER-COUNTS.txt'),'utf8');
if(counts!=='A=0\nB=0\nC=3\nAUDIT_PASS=54\nAUDIT_AMBER=0\nAUDIT_BLOCKED=3\n')throw new Error(`wrong reconciled counts: ${JSON.stringify(counts)}`);
const matrix=fs.readFileSync(path.join(tmp,'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md'),'utf8');
for(const id of ['G2-002','G2-003','G2-004','G2-007'])if(!new RegExp(`^\\| ${id} \\|[^\\n]*\\| \\*\\*PASS\\*\\* \\|`,'m').test(matrix))throw new Error(`${id} did not reconcile to PASS`);
if(!matrix.includes('PASS rows: 54. AMBER rows: 0. BLOCKED rows: 3.'))throw new Error('matrix summary did not reconcile');
const blocker=fs.readFileSync(path.join(tmp,'docs/V1-RELEASE-BLOCKER-BOARD-V2.md'),'utf8');
if(!blocker.includes('0 AMBER rows / 0 active shared clusters')||!blocker.includes('A=0 ACHIEVED'))throw new Error('release board did not reach A=0');
const launch=fs.readFileSync(path.join(tmp,'docs/LAUNCH-FINISH-LINE.md'),'utf8');
if(!launch.includes('54 PASS / 0 AMBER / 3 BLOCKED')||!launch.includes('| M11 | Grub catalogue depth, validated nutrition and variety | **PASS**')||!launch.includes('| M12 | Fit catalogue/session breadth and visual guidance | **PASS**'))throw new Error('launch board did not reconcile final Gate 2');
const ledger=fs.readFileSync(path.join(tmp,'docs/COMMISSIONING-EVIDENCE.md'),'utf8');
if(!ledger.includes('57 total / 54 PASS / 0 AMBER / 3 BLOCKED')||!ledger.includes('Final Gate 2 accepted-authority production closure — PASS'))throw new Error('evidence ledger did not reconcile');
if(!fs.existsSync(path.join(tmp,'docs/evidence/2026-08-14-final-v1-gate2-production-pass.md')))throw new Error('final Gate 2 evidence file not generated');
console.log('PASS final Gate 2 reconciliation source gate: synthetic exact 798+1326 production proof plus 26/26 live premium SVG proof atomically converts only the final four AMBER originals to 54/0/3 and A=0.');
