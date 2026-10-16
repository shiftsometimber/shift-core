import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyOwnedRollbackChain,assertOwnedRollbackStartingPoint} from '../release/verified-owned-rollback.mjs';

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
 f[side].logs=log(records);f.policy[side==='failed'?'followingFailed':side==='previousFailed'?'failed':side].logs=pin(f[side].logs);
}

function chainFixture(){
 const f=fixture(),old=f.failed,source='e'.repeat(40),run=30;
 const records=old.logs.toString().split('\n').map(l=>JSON.parse(l.slice(l.indexOf('{"kind":'))));
 function walk(value){if(Array.isArray(value))return value.map(walk);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,walk(v)]));if(typeof value==='string')return value.replaceAll('2026-10-14T19:','2026-10-14T20:').replaceAll('b'.repeat(40),source);return value;}
 const rs=walk(records);
 for(const x of rs){x.run=String(run);if(x.kind==='owned_runtime_deployment'){x.deploymentId=id(6);x.versionId=id(7);x.previousDeploymentId=id(3);x.previousVersionId=id(4);}
 if(x.kind==='public_tool_release_check'||x.kind==='guarded_release_verification'){
  const cs=x.kind==='public_tool_release_check'?[x]:[x.deployChecks,x.rollbackChecks];
  for(const c of cs){c.run=String(run);const rollback=c.stage==='rollback';c.deployed=deployment(rollback?id(8):id(6),rollback?id(4):id(7));c.afterChecks=structuredClone(c.deployed);c.expected=rollback?{...deployment(id(3),id(4)),checkSource:source}:deployment(id(6),id(7));}
  if(x.kind==='guarded_release_verification')x.deployedVersion=id(7);
 }}
 const before=walk(JSON.parse(old.stockBefore));before.release=source;
 const rollback=walk(JSON.parse(old.rollback));rollback.deployment=id(8);
 const archive=Buffer.from('following original archive'),logs=log(rs);
 f.policy.followingFailed={run,source,attempt:2,job:31,logs:pin(logs),artifact:{id:130,run,source,...pin(archive)},stockBefore:pin(bytes(before)),rollback:pin(bytes(rollback))};
 const job=walk(structuredClone(old.job));Object.assign(job,{id:31,run_id:run,head_sha:source});
 const artifact=walk(structuredClone(old.artifact));Object.assign(artifact,{id:130,size_in_bytes:archive.length,digest:'sha256:'+pin(archive).sha256});Object.assign(artifact.workflow_run,{id:run,head_sha:source});
 const runRecord=walk(structuredClone(old.run));Object.assign(runRecord,{id:run,head_sha:source});
 f.previousFailed=old;f.failed={archive,logs,run:runRecord,job,artifact,stockBefore:bytes(before),rollback:bytes(rollback)};
 f.current=walk(structuredClone(f.current));f.current.deployment.id=id(8);f.current.stock.run=run;f.current.stock.failedCandidate=source;f.current.stock.servingDeployment=id(8);f.now='2026-10-14T20:06:00Z';
 return f;
}
test('recognises only the complete successful→failed-owned-rollback→following-failed-owned-rollback chain',()=>{const f=chainFixture(),r=verifyOwnedRollbackChain(f);assert.equal(r.deployment,id(8));assert.equal(r.predecessorDeployment,id(1));assert.equal(r.predecessorRun,10);assert.equal(r.failedRun,30);assert.equal(r.failedReleaseVerified,false);assert.equal(r.evidence.precedingOwnedRollback.deployment,id(3));assert.equal(r.evidence.precedingOwnedRollback.failedRun,20);assert.equal(r.source,'a'.repeat(40));assert.equal(assertOwnedRollbackStartingPoint(r,f.current.deployment),true);});
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

for(const[name,mutate]of invalid)test('following chain rejects '+name,()=>{const f=chainFixture();mutate(f);assert.throws(()=>verifyOwnedRollbackChain(f));});
const bridgeInvalid=[
 ['missing following policy',f=>{delete f.policy.followingFailed;}],
 ['same previous and following failed run',f=>{f.policy.followingFailed.run=f.policy.failed.run;}],
 ['previous failed run reclassified successful',f=>{f.previousFailed.run.conclusion='success';}],
 ['previous failed job reclassified successful',f=>{f.previousFailed.job.conclusion='success';}],
 ['previous failure source drift',f=>{f.previousFailed.run.head_sha='d'.repeat(40);}],
 ['previous artifact tampered',f=>{f.previousFailed.archive=Buffer.from('changed');}],
 ['previous log tampered',f=>{f.previousFailed.logs=Buffer.from('changed');}],
 ['previous original before snapshot tampered',f=>{f.previousFailed.stockBefore=Buffer.from('{}');}],
 ['previous original rollback file tampered',f=>{f.previousFailed.rollback=Buffer.from('{}');}],
 ['following job overlaps previous rollback',f=>{f.failed.job.started_at='2026-10-14T19:04:00Z';}],
 ['same-version earlier rollback is not current owner',f=>{f.current.deployment.id=id(3);}],
 ['bridge capture substitutes original successful deployment',f=>alterRecords(f,'failed',rs=>{rs.find(r=>r.kind==='owned_runtime_deployment').previousDeploymentId=id(1);})],
 ['bridge capture substitutes foreign same-version deployment',f=>alterRecords(f,'failed',rs=>{rs.find(r=>r.kind==='owned_runtime_deployment').previousDeploymentId=id(9);})],
 ['earlier rollback verified flag altered',f=>alterRecords(f,'previousFailed',rs=>{for(const x of rs.filter(x=>x.kind==='guarded_release_verification'))x.releaseVerified=true;})],
 ['following before and current stock agree with each other but differ from prior protected stock',f=>{const before=JSON.parse(f.failed.stockBefore);before.tables.medicine_inventory.rows=2;f.failed.stockBefore=bytes(before);f.policy.followingFailed.stockBefore=pin(f.failed.stockBefore);f.current.stock.tables=structuredClone(before.tables);}],
 ['following before and current config agree with each other but differ from prior protected config',f=>{const before=JSON.parse(f.failed.stockBefore);before.configurationSha256='0'.repeat(64);f.failed.stockBefore=bytes(before);f.policy.followingFailed.stockBefore=pin(f.failed.stockBefore);f.current.stock.configurationSha256=before.configurationSha256;}]
];
for(const[name,mutate]of bridgeInvalid)test('owned bridge rejects '+name,()=>{const f=chainFixture();mutate(f);assert.throws(()=>verifyOwnedRollbackChain(f));});
