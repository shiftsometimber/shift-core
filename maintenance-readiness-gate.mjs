import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const manifest=JSON.parse(read('./evidence/frozen-candidate-v1.json'));
const handover=read('./docs/SEVEN-PHASE-MAINTENANCE-HANDOVER.md');
const runbook=read('./docs/EXTERNAL-GATE-ENGINEERING-RUNBOOK.md');
const need=(ok,message)=>{if(!ok)throw new Error(message)};
const SHA256=/^[a-f0-9]{64}$/;

need(manifest.schema==='shift.frozen-candidate.v1','frozen manifest schema changed');
need(/^[a-f0-9]{40}$/.test(manifest.targetCommit),'frozen target commit missing');
need(manifest.state==='merge-ready-frozen','candidate is not frozen');
need(manifest.productionTouched===false,'frozen manifest must not claim production mutation');
need(manifest.physicalIphoneSafari?.state==='passed','physical iPhone acceptance missing');
need(SHA256.test(manifest.automation?.iphoneArtifact?.digest||'')&&SHA256.test(manifest.automation?.desktopArtifact?.digest||''),'device artifact digests missing');
need(JSON.stringify(manifest.palette)===JSON.stringify(['#050505','#E7E3DA','#707762']),'frozen palette changed');
need(JSON.stringify(manifest.lockedGates)===JSON.stringify(['commercial','claims','supplier','stock','purchase','clinical']),'frozen gate set changed');
for(const phase of ['1','2','3','4','5','6','7'])need(handover.includes(`| ${phase} |`),`phase ${phase} handover missing`);
for(const phrase of ['dry-run','idempotency key','rollback','separate commercial, clinical and production actors','explicit production authorisation','separate explicit medicine-sale authorisation'])need(runbook.includes(phrase),`unlock runbook missing ${phrase}`);
need(/Catalogue intake must never mutate them/.test(runbook),'claims separation missing');
need(/Medicine purchasing stays blocked/.test(runbook),'purchase fail-closed rule missing');

console.log(JSON.stringify({proof:'FROZEN_CANDIDATE_MAINTENANCE_READINESS',status:'PASS',targetCommit:manifest.targetCommit,phases:7,lockedGates:manifest.lockedGates,productionTouched:false},null,2));
