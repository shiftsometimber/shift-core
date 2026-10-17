import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyOwnedRollback,assertOwnedRollbackStartingPoint} from '../release/verified-owned-rollback.mjs';

const paths=['/decision-centre','/tools/alcohol','/tools/bmi','/tools/calories','/tools/healthy-weight','/tools/protein','/tools/waist-height','/tools/walking','/tools/water'];
const id=n=>String(n).repeat(8)+'-'+String(n).repeat(4)+'-'+String(n).repeat(4)+'-'+String(n).repeat(4)+'-'+String(n).repeat(12);
const pin=bytes=>({bytes:Buffer.byteLength(bytes),sha256:createHash('sha256').update(bytes).digest('hex')});
const bytes=value=>Buffer.from(JSON.stringify(value));
const deployment=(deploymentId,versionId)=>({deploymentId,versionId,percentage:100});
const step=name=>({name,status:'completed',conclusion:'success'});
const log=records=>Buffer.from(records.map(r=>'2026-10-14T19:00:00.000Z '+JSON.stringify(r)).join('\n'));
function checks(source,run,stage,served,expected,start,finish){
 return {kind:'public_tool_release_check',source,run:String(run),stage,status:'passed',toolChecksVerified:true,errors:[],
  checks:paths.map(path=>({path,status:200,passed:true,htmlSha256:'d'.repeat(64),jsonBlocks:1,applicationItems:0,canonicalWebPageItems:1})),
  deployed:served,afterChecks:served,expected,checkedAt:start,finishedAt:finish};
}
function fixture(){
 const a='a'.repeat(40),b='b'.repeat(40),old=deployment(id(1),id(4)),candidate=deployment(id(2),id(5)),restored=deployment(id(3),id(4));
 const priorOwned={kind:'owned_runtime_deployment',source:a,run:'10',at:'2026-10-14T18:01:00Z',deploymentId:old.deploymentId,versionId:old.versionId,dataRestored:false};
 const failedOwned={kind:'owned_runtime_deployment',source:b,run:'20',at:'2026-10-14T19:01:00Z',deploymentId:candidate.deploymentId,versionId:candidate.versionId,previousDeploymentId:old.deploymentId,previousVersionId:old.versionId,dataRestored:false};
 const priorCheck=checks(a,10,'deploy',old,old,'2026-10-14T18:01:30Z','2026-10-14T18:02:00Z');
 const failedCheck=checks(b,20,'deploy',candidate,candidate,'2026-10-14T19:01:30Z','2026-10-14T19:02:00Z');
 const rollbackCheck=checks(b,20,'rollback',restored,{...old,checkSource:b},'2026-10-14T19:03:05Z','2026-10-14T19:03:10Z');
 const priorVerification={kind:'guarded_release_verification',source:a,run:'10',workflowStatus:'success',releaseVerified:true,status:'verified',deployedVersion:old.versionId,deployChecks:priorCheck,rollbackChecks:null};
 const failedVerification={kind:'guarded_release_verification',source:b,run:'20',workflowStatus:'failure',releaseVerified:false,status:'failed',deployedVersion:candidate.versionId,deployChecks:failedCheck,rollbackChecks:rollbackCheck};
 const policy={repositoryId:99},f={policy,now:'2026-10-14T19:06:00Z'};
 for(const [name,runId,source,jobId,start,end,conclusion,records] of [
  ['prior',10,a,11,'2026-10-14T18:00:00Z','2026-10-14T18:05:00Z','success',[priorOwned,priorCheck,priorVerification,priorVerification]],
  ['failed',20,b,21,'2026-10-14T19:00:00Z','2026-10-14T19:05:00Z','failure',[failedOwned,failedCheck,rollbackCheck,failedVerification,failedVerification]]]){
  const archive=Buffer.from(name+' original archive'),logs=log(records),artifactId=runId+100;
  policy[name]={run:runId,source,attempt:name==='failed'?2:1,job:jobId,logs:pin(logs),artifact:{id:artifactId,run:runId,source,...pin(archive)}};
  f[name]={archive,logs,
   run:{id:runId,head_sha:source,run_attempt:policy[name].attempt,path:'.github/workflows/cloudflare-production-promote.yml',head_branch:'main',event:'push',status:'completed',conclusion},
   job:{id:jobId,run_id:runId,run_attempt:policy[name].attempt,head_sha:source,head_branch:'main',name:'promote',status:'completed',conclusion,started_at:start,completed_at:end,steps:[
    step('Deploy current main to production'),step('Capture current Worker deployment for rollback'),step('Verify nine public tool pages against the owned deployment'),
    step('Restore the captured runtime if a post-deployment gate failed'),step('Verify nine public tool pages after owned rollback')]},
   artifact:{id:artifactId,size_in_bytes:archive.length,digest:'sha256:'+pin(archive).sha256,expired:false,created_at:end,
    workflow_run:{id:runId,head_sha:source,head_branch:'main',repository_id:99,head_repository_id:99}}};
 }
 const before={phase:'before',checkedAt:'2026-10-14T19:00:30Z',release:b,customerRecordsRead:false,productionWrites:0,configurationSha256:'e'.repeat(64),
  tables:Object.fromEntries(['medicine_products','medicine_variants','medicine_inventory'].map(name=>[name,{rows:1,sha256:'f'.repeat(64)}]))};
 f.failed.stockBefore=bytes(before);policy.failed.stockBefore=pin(f.failed.stockBefore);
 f.failed.rollback=bytes({at:'2026-10-14T19:03:00Z',deployment:restored.deploymentId,restoredVersion:restored.versionId,dataRestored:false});policy.failed.rollback=pin(f.failed.rollback);
 f.current={observedAt:'2026-10-14T19:06:00Z',deployment:{id:restored.deploymentId,versions:[{version_id:restored.versionId,percentage:100}]},
  stock:{kind:'independent-original-protected-stock-comparison-after-owned-rollback',checkedAt:'2026-10-14T19:05:30Z',beforeAt:before.checkedAt,run:20,attempt:2,
   failedCandidate:b,servingSource:a,servingDeployment:restored.deploymentId,servingVersions:[{version_id:restored.versionId,percentage:100}],
   tables:before.tables,configurationSha256:before.configurationSha256,identical:true,customerRecordsRead:false,productionWrites:0,originalFailedReleaseRemainsFailed:true}};
 return f;
}
function alterRecords(f,side,change){
 const records=f[side].logs.toString().split('\n').map(l=>JSON.parse(l.slice(l.indexOf('{"kind":'))));change(records);
 f[side].logs=log(records);f.policy[side].logs=pin(f[side].logs);
}
test('recognises the fully bound original successful predecessor restored by a failed owned attempt',()=>{
 const f=fixture(),r=verifyOwnedRollback(f);
 assert.equal(r.deployment,id(3));assert.equal(r.predecessorDeployment,id(1));assert.equal(r.source,'a'.repeat(40));
 assert.equal(r.failedReleaseVerified,false);assert.equal(r.failedAttempt,2);assert.equal(r.protectedStockIdentical,true);
 assert.equal(assertOwnedRollbackStartingPoint(r,f.current.deployment),true);assert(Object.isFrozen(r));
});
const invalid=[
 ['missing reviewed policy',f=>{f.policy=undefined;}],
 ['failed attempt identity',f=>{f.failed.run.run_attempt=1;}],
 ['failed run source',f=>{f.failed.run.head_sha='c'.repeat(40);}],
 ['failed run id',f=>{f.failed.run.id=22;}],
 ['failed run still active',f=>{f.failed.run.status='in_progress';}],
 ['failed release reclassified successful',f=>{f.failed.run.conclusion='success';}],
 ['wrong workflow',f=>{f.failed.run.path='.github/workflows/another.yml';}],
 ['manual unapproved event',f=>{f.failed.run.event='workflow_dispatch';}],
 ['wrong branch',f=>{f.failed.run.head_branch='preview';}],
 ['wrong failed job',f=>{f.failed.job.id=23;}],
 ['wrong failed job attempt',f=>{f.failed.job.run_attempt=1;}],
 ['wrong failed job run',f=>{f.failed.job.run_id=10;}],
 ['wrong failed job source',f=>{f.failed.job.head_sha='c'.repeat(40);}],
 ['wrong failed job name',f=>{f.failed.job.name='other';}],
 ['non-terminal failed job',f=>{f.failed.job.status='in_progress';}],
 ['prior job not successful',f=>{f.prior.job.conclusion='failure';}],
 ['prior run not successful',f=>{f.prior.run.conclusion='failure';}],
 ['unrelated artifact',f=>{f.failed.artifact.id=999;}],
 ['artifact source drift',f=>{f.failed.artifact.workflow_run.head_sha='c'.repeat(40);}],
 ['artifact run drift',f=>{f.failed.artifact.workflow_run.id=10;}],
 ['artifact repository drift',f=>{f.failed.artifact.workflow_run.repository_id=199;}],
 ['artifact head repository drift',f=>{f.failed.artifact.workflow_run.head_repository_id=199;}],
 ['artifact digest drift',f=>{f.failed.artifact.digest='sha256:'+'0'.repeat(64);}],
 ['artifact expired',f=>{f.failed.artifact.expired=true;}],
 ['artifact from another job time',f=>{f.failed.artifact.created_at='2026-10-14T18:00:00Z';}],
 ['archive tampering',f=>{f.failed.archive=Buffer.from('changed archive');}],
 ['original log tampering',f=>{f.failed.logs=Buffer.concat([f.failed.logs,Buffer.from(' ')]);}],
 ['original stock snapshot tampering',f=>{f.failed.stockBefore=Buffer.from('{}');}],
 ['original rollback receipt tampering',f=>{f.failed.rollback=Buffer.from('{}');}],
 ['unknown current deployment',f=>{f.current.deployment.id=id(6);}],
 ['mixed current deployment',f=>{f.current.deployment.versions.push({version_id:id(5),percentage:50});}],
 ['partial current version',f=>{f.current.deployment.versions[0].percentage=99;}],
 ['unknown current version',f=>{f.current.deployment.versions[0].version_id=id(5);}],
 ['stale provider observation',f=>{f.current.observedAt='2026-10-14T19:00:00Z';}],
 ['future provider observation',f=>{f.current.observedAt='2026-10-14T19:07:00Z';}],
 ['stale stock',f=>{f.current.stock.checkedAt='2026-10-14T18:59:59Z';}],
 ['wrong stock attempt',f=>{f.current.stock.attempt=1;}],
 ['wrong stock source',f=>{f.current.stock.servingSource='b'.repeat(40);}],
 ['wrong stock deployment',f=>{f.current.stock.servingDeployment=id(1);}],
 ['changed stock rows',f=>{f.current.stock.tables={...f.current.stock.tables,medicine_inventory:{rows:2,sha256:'f'.repeat(64)}};}],
 ['changed protected configuration',f=>{f.current.stock.configurationSha256='0'.repeat(64);}],
 ['stock privacy claim drift',f=>{f.current.stock.customerRecordsRead=true;}],
 ['stock write occurred',f=>{f.current.stock.productionWrites=1;}],
 ['failed release accepted in stock evidence',f=>{f.current.stock.originalFailedReleaseRemainsFailed=false;}],
 ['unsuccessful rollback step',f=>{f.failed.job.steps.find(s=>s.name.startsWith('Restore the captured')).conclusion='failure';}],
 ['missing rollback checks step',f=>{f.failed.job.steps=f.failed.job.steps.filter(s=>!s.name.includes('after owned rollback'));}],
 ['wrong captured predecessor',f=>alterRecords(f,'failed',rs=>{rs.find(r=>r.kind==='owned_runtime_deployment').previousDeploymentId=id(6);})],
 ['wrong captured predecessor version',f=>alterRecords(f,'failed',rs=>{rs.find(r=>r.kind==='owned_runtime_deployment').previousVersionId=id(5);})],
 ['unverified original predecessor',f=>alterRecords(f,'prior',rs=>{for(const r of rs.filter(r=>r.kind==='guarded_release_verification'))r.releaseVerified=false;})],
 ['reclassified failed receipt',f=>alterRecords(f,'failed',rs=>{for(const r of rs.filter(r=>r.kind==='guarded_release_verification'))r.releaseVerified=true;})],
 ['missing original public assertion',f=>alterRecords(f,'prior',rs=>{for(const r of rs.filter(r=>r.kind==='guarded_release_verification'))r.deployChecks.checks.pop();})],
 ['rollback expected allocation drift',f=>alterRecords(f,'failed',rs=>{for(const r of rs.filter(r=>r.kind==='guarded_release_verification'))r.rollbackChecks.expected.percentage=50;})],
 ['rollback assertion false',f=>alterRecords(f,'failed',rs=>{for(const r of rs.filter(r=>r.kind==='guarded_release_verification'))r.rollbackChecks.checks[0].passed=false;})],
 ['rollback after-check deployment drift',f=>alterRecords(f,'failed',rs=>{for(const r of rs.filter(r=>r.kind==='guarded_release_verification'))r.rollbackChecks.afterChecks={...r.rollbackChecks.afterChecks,deploymentId:id(6)};})],
 ['conflicting duplicated original receipt',f=>alterRecords(f,'failed',rs=>{rs.push({...rs.find(r=>r.kind==='owned_runtime_deployment'),source:'c'.repeat(40)});})]
];
for(const [name,mutate]of invalid)test('rejects '+name,()=>{const f=fixture();mutate(f);assert.throws(()=>verifyOwnedRollback(f));});
test('starting-point check rejects another deployment serving the same verified version',()=>{
 const f=fixture(),r=verifyOwnedRollback(f);f.current.deployment.id=id(6);
 assert.throws(()=>assertOwnedRollbackStartingPoint(r,f.current.deployment),/starting point moved/);
});

// Preserve every original rollback assertion and exercise the authenticated later rollback chain.
import './verified-owned-rollback-chain.test.mjs';
