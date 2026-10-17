import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

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
function timeoutFixture(){
 const f=chainFixture(),source='f'.repeat(40),run=40,served=deployment(id(9),id('a')),captured=deployment(id(8),id(4)),restored=deployment(id('b'),id(4));
 const owned={kind:'owned_runtime_deployment',source,run:String(run),at:'2026-10-14T21:01:00Z',deploymentId:served.deploymentId,versionId:served.versionId,previousDeploymentId:captured.deploymentId,previousVersionId:captured.versionId,dataRestored:false};
 const deploy=checks(source,run,'deploy',served,served,'2026-10-14T21:01:10Z','2026-10-14T21:01:20Z');
 const report={kind:'guarded_release_verification',source,run:String(run),workflowStatus:'cancelled',releaseVerified:false,status:'unverified',deployedVersion:served.versionId,deployChecks:deploy,rollbackChecks:null};
 const archive=Buffer.from('cancelled exact archive'),logs=log([owned,deploy,report,report]),captureArchive=Buffer.from('capture exact archive');
 const stock=JSON.parse(f.failed.stockBefore);stock.release=source;stock.checkedAt='2026-10-14T21:00:30Z';
 const before={id:captured.deploymentId,versions:[{version_id:captured.versionId,percentage:100}],created_on:'2026-10-14T20:03:00Z'};
 const message='Exact fixture owned timeout recovery';
 const after={id:restored.deploymentId,versions:[{version_id:restored.versionId,percentage:100}],created_on:'2026-10-14T21:05:10Z',annotations:{'workers/message':message,'workers/triggered_by':'deployment'}};
 const unchanged={tables:stock.tables,configurationSha256:stock.configurationSha256,identical:true,customerRecordsRead:false,productionWrites:0};
 const manual={kind:'exact-owned-timeout-runtime-recovery',at:'2026-10-14T21:05:15Z',source,run,attempt:1,job:41,failedReleaseRemainsUnverified:true,originalRunAccepted:false,dataRestored:false,databaseWrites:0,runtimeMutations:1,ownedReceipt:owned,capturedBefore:before,activeBefore:{id:served.deploymentId,versions:[{version_id:served.versionId,percentage:100}]},after,decision:{action:'restore',versionId:captured.versionId},preStock:{...unchanged,checkedAt:'2026-10-14T21:05:06Z'},postStock:{...unchanged,checkedAt:'2026-10-14T21:05:15Z'}};
 const manualChecks=checks(source,run,'rollback',restored,{...captured,checkSource:source},'2026-10-14T21:05:20Z','2026-10-14T21:05:30Z');
 const pinValue={run,attempt:1,source,job:41,artifact:{id:140,run,source,...pin(archive)},logs:pin(logs),captureArtifact:{id:141,run,source,...pin(captureArchive)},stockBefore:pin(bytes(stock)),ownedReceipt:pin(bytes(owned)),captureBefore:pin(bytes([before]))};
 const runRecord={...f.failed.run,id:run,head_sha:source,run_attempt:1,conclusion:'cancelled'};
 const job={...f.failed.job,id:41,run_id:run,head_sha:source,run_attempt:1,conclusion:'cancelled',started_at:'2026-10-14T21:00:00Z',completed_at:'2026-10-14T21:05:00Z',steps:[step('Capture current Worker deployment for rollback'),step('Deploy current main to production'),step('Verify nine public tool pages against the owned deployment'),{...step('Prove exact member scripts and authentication on live traffic'),conclusion:'cancelled'},{...step('Restore the captured runtime if a post-deployment gate failed'),conclusion:'skipped'}]};
 const artifact=(id,contents)=>({id,size_in_bytes:contents.length,digest:'sha256:'+pin(contents).sha256,expired:false,created_at:job.completed_at,workflow_run:{id:run,head_sha:source,head_branch:'main',repository_id:99,head_repository_id:99}});
 f.cancelled={run:runRecord,job,artifact:artifact(140,archive),archive,logs,captureArtifact:artifact(141,captureArchive),captureArchive,stockBefore:bytes(stock),ownedReceipt:bytes(owned),captureBefore:bytes([before]),manualRecovery:bytes(manual),manualChecks:bytes(manualChecks)};
 f.timeoutPolicy={kind:'EXACT_OWNED_TIMEOUT_RECOVERY_38928866205',cancelled:pinValue,manual:{deployment:restored.deploymentId,version:restored.versionId,message,recovery:pin(f.cancelled.manualRecovery),checks:pin(f.cancelled.manualChecks)},originalRunAccepted:false,originalHistoryAssertionsPreserved:true,freshProviderAndProtectedStockRequired:true};
 f.current=structuredClone(f.current);f.current.observedAt='2026-10-14T21:06:00Z';f.current.deployment=after;Object.assign(f.current.stock,{checkedAt:'2026-10-14T21:06:00Z',beforeAt:stock.checkedAt,run,attempt:1,failedCandidate:source,servingDeployment:restored.deploymentId,servingVersions:after.versions});f.now='2026-10-14T21:06:00Z';return f;
}
export {timeoutFixture};
