import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const WORKFLOW='.github/workflows/cloudflare-production-promote.yml';
const PUBLIC_PATHS=['/decision-centre','/tools/alcohol','/tools/bmi','/tools/calories','/tools/healthy-weight','/tools/protein','/tools/waist-height','/tools/walking','/tools/water'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const sha=/^[a-f0-9]{64}$/;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const time=value=>{const n=Date.parse(value);assert(Number.isFinite(n),'Valid evidence time required');return n;};
const positive=n=>assert(Number.isSafeInteger(n)&&n>0,'Exact positive evidence identifier required');
const identity=value=>{assert.match(value?.deploymentId??'',uuid);assert.match(value?.versionId??'',uuid);return {deploymentId:value.deploymentId,versionId:value.versionId,percentage:100};};
const providerIdentity=value=>{
 assert.match(value?.id??'',uuid);assert.equal(value?.versions?.length,1,'Mixed runtime cannot be recognised');
 assert.equal(value.versions[0].percentage,100,'Only one fully serving runtime can be recognised');
 return identity({deploymentId:value.id,versionId:value.versions[0].version_id});
};
function pinned(bytes,pin,label){
 assert(Buffer.isBuffer(bytes)||typeof bytes==='string',label+' bytes required');
 const raw=Buffer.from(bytes);positive(pin?.bytes);assert.match(pin?.sha256??'',sha);
 assert.equal(raw.length,pin.bytes,label+' size drift');assert.equal(digest(raw),pin.sha256,label+' digest drift');return raw;
}
function json(bytes,pin,label){return JSON.parse(pinned(bytes,pin,label).toString('utf8'));}
function source(record,pin){
 assert.equal(record?.source,pin.source,'Receipt source drift');assert.equal(String(record?.run),String(pin.run),'Receipt run drift');
}
function unique(logs,kind,stage){
 const values=[];
 for(const line of logs.toString('utf8').split('\n')){
  const start=line.indexOf('{"kind":');if(start<0)continue;
  let value;try{value=JSON.parse(line.slice(start));}catch{assert(!line.slice(start).startsWith('{"kind":"'+kind+'"'),'Malformed required receipt');continue;}
  if(value.kind===kind&&(stage===undefined||value.stage===stage))values.push(value);
 }
 assert(values.length>0,'Missing '+kind+' receipt');
 for(const value of values)assert.deepEqual(value,values[0],'Conflicting '+kind+' receipts');
 return values[0];
}
function step(job,name,conclusion='success'){
 const matches=job.steps?.filter(s=>s.name===name)??[];
 assert.equal(matches.length,1,'Exact workflow step required: '+name);
 assert.equal(matches[0].status,'completed');assert.equal(matches[0].conclusion,conclusion,'Required workflow step did not succeed: '+name);
}
function metadata(e,pin,conclusion,repositoryId){
 positive(pin?.run);positive(pin?.job);positive(pin?.attempt);assert.match(pin?.source??'',/^[a-f0-9]{40}$/);
 const {run,job,artifact}=e;
 assert.equal(run?.id,pin.run);assert.equal(run?.run_attempt,pin.attempt);assert.equal(run?.head_sha,pin.source);
 assert.equal(run?.path,WORKFLOW);assert.equal(run?.event,'push');assert.equal(run?.head_branch,'main');
 assert.equal(run?.status,'completed');assert.equal(run?.conclusion,conclusion);
 assert.equal(job?.id,pin.job);assert.equal(job?.run_id,pin.run);assert.equal(job?.run_attempt,pin.attempt);
 assert.equal(job?.head_sha,pin.source);assert.equal(job?.head_branch,'main');assert.equal(job?.name,'promote');
 assert.equal(job?.status,'completed');assert.equal(job?.conclusion,conclusion);
 assert(time(job.completed_at)>=time(job.started_at),'Job time order drift');
 const a=pin.artifact;positive(a?.id);
 assert.equal(a.run,pin.run);assert.equal(a.source,pin.source);
 assert.equal(artifact?.id,a.id);assert.equal(artifact?.size_in_bytes,a.bytes);assert.equal(artifact?.expired,false);
 assert.equal(artifact?.digest,'sha256:'+a.sha256,'Authenticated artifact digest required');
 assert.equal(artifact?.workflow_run?.id,pin.run);assert.equal(artifact?.workflow_run?.head_sha,pin.source);
 assert.equal(artifact?.workflow_run?.head_branch,'main');assert.equal(artifact?.workflow_run?.repository_id,repositoryId);
 assert.equal(artifact?.workflow_run?.head_repository_id,repositoryId);
 assert(time(artifact.created_at)>=time(job.started_at)&&time(artifact.created_at)<=time(job.completed_at),'Artifact is outside the exact job');
 pinned(e.archive,a,'Original artifact');return pinned(e.logs,pin.logs,'Original job log');
}
function publicChecks(checks,pin,stage,deployed,expected,job){
 source(checks,pin);assert.equal(checks?.kind,'public_tool_release_check');assert.equal(checks?.stage,stage);
 assert.equal(checks?.status,'passed');assert.equal(checks?.toolChecksVerified,true);assert.deepEqual(checks?.errors,[]);
 assert.equal(checks?.checks?.length,PUBLIC_PATHS.length,'Every public rollback assertion is required');
 assert.deepEqual(checks.checks.map(c=>c.path).sort(),[...PUBLIC_PATHS].sort(),'Public check path drift');
 for(const c of checks.checks){
  assert.equal(c.status,200);assert.equal(c.passed,true);assert.match(c.htmlSha256??'',sha);
  assert(Number.isInteger(c.jsonBlocks)&&c.jsonBlocks>0);assert.equal(c.applicationItems,0);assert.equal(c.canonicalWebPageItems,1);
 }
 assert.deepEqual(identity(checks.deployed),deployed);assert.equal(checks.deployed.percentage,100);
 assert.deepEqual(identity(checks.afterChecks),deployed);assert.equal(checks.afterChecks.percentage,100);
 assert.equal(checks.expected?.deploymentId,expected.deploymentId);assert.equal(checks.expected?.versionId,expected.versionId);
 assert(time(checks.checkedAt)>=time(job.started_at)&&time(checks.finishedAt)>=time(checks.checkedAt)&&time(checks.finishedAt)<=time(job.completed_at),'Public proof time drift');
}
function stockSnapshot(snapshot,pin,job){
 assert.equal(snapshot.phase,'before');assert.equal(snapshot.release,pin.source);
 assert.equal(snapshot.customerRecordsRead,false);assert.equal(snapshot.productionWrites,0);
 assert(time(snapshot.checkedAt)>=time(job.started_at)&&time(snapshot.checkedAt)<=time(job.completed_at));
 assert.deepEqual(Object.keys(snapshot.tables).sort(),['medicine_inventory','medicine_products','medicine_variants']);
 for(const table of Object.values(snapshot.tables)){assert(Number.isSafeInteger(table.rows)&&table.rows>=0);assert.match(table.sha256??'',sha);}
 assert.match(snapshot.configurationSha256??'',sha);return snapshot;
}
function fresh(at,now){const age=time(now)-time(at);assert(age>=0&&age<=300000,'Current runtime/stock evidence is stale or from the future');}

// Policy is reviewed, source-controlled authority: exact original run/attempt/job,
// log and archive hashes plus selected original-file hashes. Never build it from
// an untrusted saved recovery receipt. Metadata and current provider observations
// must be freshly authenticated by the caller; this module performs no I/O.
function verifyOwnedRollbackHistory({policy,failed,prior}){
 positive(policy?.repositoryId);
 const failedLogs=metadata(failed,policy.failed,'failure',policy.repositoryId);
 const priorLogs=metadata(prior,policy.prior,'success',policy.repositoryId);
 assert(time(prior.job.completed_at)<time(failed.job.started_at),'Predecessor is not an earlier successful job');
 const old=unique(priorLogs,'owned_runtime_deployment'),attempted=unique(failedLogs,'owned_runtime_deployment');
 const priorVerification=unique(priorLogs,'guarded_release_verification'),failedVerification=unique(failedLogs,'guarded_release_verification');
 source(old,policy.prior);source(attempted,policy.failed);source(priorVerification,policy.prior);source(failedVerification,policy.failed);
 assert.equal(old.dataRestored,false);assert.equal(attempted.dataRestored,false);
 const predecessor=identity(old),candidate=identity(attempted);
 assert.notEqual(candidate.deploymentId,predecessor.deploymentId);assert.notEqual(candidate.versionId,predecessor.versionId);
 assert.equal(attempted.previousDeploymentId,predecessor.deploymentId,'Original captured deployment chain drift');
 assert.equal(attempted.previousVersionId,predecessor.versionId,'Original captured version chain drift');
 assert(time(old.at)>=time(prior.job.started_at)&&time(old.at)<=time(prior.job.completed_at));
 assert(time(attempted.at)>=time(failed.job.started_at)&&time(attempted.at)<=time(failed.job.completed_at));
 assert.equal(priorVerification.workflowStatus,'success');assert.equal(priorVerification.releaseVerified,true);assert.equal(priorVerification.status,'verified');
 assert.equal(priorVerification.deployedVersion,predecessor.versionId);assert.equal(priorVerification.rollbackChecks,null);
 publicChecks(priorVerification.deployChecks,policy.prior,'deploy',predecessor,predecessor,prior.job);
 assert.deepEqual(priorVerification.deployChecks,unique(priorLogs,'public_tool_release_check','deploy'));
 assert.equal(failedVerification.workflowStatus,'failure');assert.equal(failedVerification.releaseVerified,false);assert.equal(failedVerification.status,'failed');
 assert.equal(failedVerification.deployedVersion,candidate.versionId,'Failed candidate must remain distinct from the restored version');
 publicChecks(failedVerification.deployChecks,policy.failed,'deploy',candidate,candidate,failed.job);
 assert.deepEqual(failedVerification.deployChecks,unique(failedLogs,'public_tool_release_check','deploy'));
 const restored=identity(failedVerification.rollbackChecks?.deployed);
 assert.equal(restored.versionId,predecessor.versionId,'Rollback did not restore the verified predecessor');
 assert.notEqual(restored.deploymentId,predecessor.deploymentId);assert.notEqual(restored.deploymentId,candidate.deploymentId);
 publicChecks(failedVerification.rollbackChecks,policy.failed,'rollback',restored,predecessor,failed.job);
 assert.equal(failedVerification.rollbackChecks.expected.checkSource,policy.failed.source);assert.equal(failedVerification.rollbackChecks.expected.percentage,100);
 assert.deepEqual(failedVerification.rollbackChecks,unique(failedLogs,'public_tool_release_check','rollback'));
 for(const job of [prior.job,failed.job])step(job,'Deploy current main to production');
 step(failed.job,'Capture current Worker deployment for rollback');
 step(failed.job,'Restore the captured runtime if a post-deployment gate failed');
 step(failed.job,'Verify nine public tool pages after owned rollback');
 step(prior.job,'Verify nine public tool pages against the owned deployment');
 const rollback=json(failed.rollback,policy.failed.rollback,'Original rollback receipt');
 assert.equal(rollback.restoredVersion,predecessor.versionId);assert.equal(rollback.deployment,restored.deploymentId);assert.equal(rollback.dataRestored,false);
 assert(time(rollback.at)>=time(attempted.at)&&time(rollback.at)<=time(failedVerification.rollbackChecks.finishedAt));
 const before=stockSnapshot(json(failed.stockBefore,policy.failed.stockBefore,'Original stock snapshot'),policy.failed,failed.job);
 assert(time(before.checkedAt)<time(attempted.at),'Original stock snapshot must precede owned deployment');
 return {failedLogs,priorLogs,predecessor,candidate,restored,before};
}
export function verifyOwnedRollback({policy,failed,prior,current,now}){
 const {predecessor,restored,before}=verifyOwnedRollbackHistory({policy,failed,prior});
 fresh(current?.observedAt,now);assert.deepEqual(providerIdentity(current?.deployment),restored,'Runtime moved after the owned rollback');
 const s=current.stock;fresh(s?.checkedAt,now);
 assert.equal(s?.kind,'independent-original-protected-stock-comparison-after-owned-rollback');
 assert.equal(s.run,policy.failed.run);assert.equal(s.attempt,policy.failed.attempt);
 assert.equal(s.failedCandidate,policy.failed.source);assert.equal(s.servingSource,policy.prior.source);
 assert.equal(s.servingDeployment,restored.deploymentId);
 assert.deepEqual(s.servingVersions,[{version_id:restored.versionId,percentage:100}]);
 assert.equal(s.beforeAt,before.checkedAt);assert.deepEqual(s.tables,before.tables);assert.equal(s.configurationSha256,before.configurationSha256);
 assert.equal(s.identical,true);assert.equal(s.customerRecordsRead,false);assert.equal(s.productionWrites,0);assert.equal(s.originalFailedReleaseRemainsFailed,true);
 assert(time(s.checkedAt)>=time(failed.job.completed_at),'Stock comparison must follow terminal rollback');
 return Object.freeze({kind:'verified_owned_runtime_rollback',checkedAt:now,source:policy.prior.source,version:restored.versionId,deployment:restored.deploymentId,
  predecessorDeployment:predecessor.deploymentId,predecessorRun:policy.prior.run,predecessorAttempt:policy.prior.attempt,
  failedRun:policy.failed.run,failedAttempt:policy.failed.attempt,failedSource:policy.failed.source,failedReleaseVerified:false,
  publicToolChecksVerified:true,protectedStockIdentical:true,dataRestored:false,
  evidence:Object.freeze({failedArtifact:policy.failed.artifact.sha256,priorArtifact:policy.prior.artifact.sha256,failedLog:policy.failed.logs.sha256,priorLog:policy.prior.logs.sha256})});
}
export function verifyOwnedRollbackChain({policy,previousFailed,prior,failed,current,now}){
 const originalPolicy=policy;
 const history=verifyOwnedRollbackHistory({policy:originalPolicy,failed:previousFailed,prior});
 const pin=originalPolicy.followingFailed;
 assert(pin,'One exact source-controlled following failed release is required');
 assert.notEqual(pin.run,originalPolicy.failed.run,'Following and previous failed runs must remain distinct');
 policy={...originalPolicy,failed:pin};
 const failedLogs=metadata(failed,pin,'failure',policy.repositoryId);
 assert(time(previousFailed.job.completed_at)<time(failed.job.started_at),'Following failed job must follow the authenticated previous rollback');
 const attempted=unique(failedLogs,'owned_runtime_deployment'),failedVerification=unique(failedLogs,'guarded_release_verification');
 source(attempted,pin);source(failedVerification,pin);
 const predecessor=history.predecessor,captured=history.restored,candidate=identity(attempted);
 assert.notEqual(candidate.deploymentId,captured.deploymentId);
 assert.notEqual(candidate.versionId,captured.versionId);
 assert.equal(attempted.dataRestored,false);
 assert.equal(attempted.previousDeploymentId,captured.deploymentId,'Following release did not capture the exact authenticated prior owned rollback deployment');
 assert.equal(attempted.previousVersionId,captured.versionId,'Following release did not capture the exact authenticated prior owned rollback version');
 assert(time(attempted.at)>=time(failed.job.started_at)&&time(attempted.at)<=time(failed.job.completed_at));
 assert.equal(failedVerification.workflowStatus,'failure');assert.equal(failedVerification.releaseVerified,false);assert.equal(failedVerification.status,'failed');
 assert.equal(failedVerification.deployedVersion,candidate.versionId);
 publicChecks(failedVerification.deployChecks,pin,'deploy',candidate,candidate,failed.job);
 assert.deepEqual(failedVerification.deployChecks,unique(failedLogs,'public_tool_release_check','deploy'));
 const restored=identity(failedVerification.rollbackChecks?.deployed);
 assert.equal(restored.versionId,captured.versionId,'Following rollback did not restore the original verified runtime');
 assert.notEqual(restored.deploymentId,captured.deploymentId);assert.notEqual(restored.deploymentId,candidate.deploymentId);
 publicChecks(failedVerification.rollbackChecks,pin,'rollback',restored,captured,failed.job);
 assert.equal(failedVerification.rollbackChecks.expected.checkSource,pin.source);
 assert.equal(failedVerification.rollbackChecks.expected.percentage,100);
 assert.deepEqual(failedVerification.rollbackChecks,unique(failedLogs,'public_tool_release_check','rollback'));
 step(failed.job,'Capture current Worker deployment for rollback');
 step(failed.job,'Deploy current main to production');
 step(failed.job,'Restore the captured runtime if a post-deployment gate failed');
 step(failed.job,'Verify nine public tool pages after owned rollback');
 const rollback=json(failed.rollback,pin.rollback,'Original following rollback receipt');
 assert.equal(rollback.restoredVersion,captured.versionId);assert.equal(rollback.deployment,restored.deploymentId);assert.equal(rollback.dataRestored,false);
 assert(time(rollback.at)>=time(attempted.at)&&time(rollback.at)<=time(failedVerification.rollbackChecks.finishedAt));
 const before=stockSnapshot(json(failed.stockBefore,pin.stockBefore,'Original following stock snapshot'),pin,failed.job);
 assert(time(before.checkedAt)<time(attempted.at));
 assert.deepEqual(before.tables,history.before.tables,'Protected stock differs across authenticated rollback chain');
 assert.equal(before.configurationSha256,history.before.configurationSha256,'Protected configuration differs across authenticated rollback chain');
 fresh(current?.observedAt,now);assert.deepEqual(providerIdentity(current?.deployment),restored,'Runtime moved after the owned rollback');
 const s=current.stock;fresh(s?.checkedAt,now);
 assert.equal(s?.kind,'independent-original-protected-stock-comparison-after-owned-rollback');
 assert.equal(s.run,policy.failed.run);assert.equal(s.attempt,policy.failed.attempt);
 assert.equal(s.failedCandidate,policy.failed.source);assert.equal(s.servingSource,policy.prior.source);
 assert.equal(s.servingDeployment,restored.deploymentId);
 assert.deepEqual(s.servingVersions,[{version_id:restored.versionId,percentage:100}]);
 assert.equal(s.beforeAt,before.checkedAt);assert.deepEqual(s.tables,before.tables);assert.equal(s.configurationSha256,before.configurationSha256);
 assert.equal(s.identical,true);assert.equal(s.customerRecordsRead,false);assert.equal(s.productionWrites,0);assert.equal(s.originalFailedReleaseRemainsFailed,true);
 assert(time(s.checkedAt)>=time(failed.job.completed_at),'Stock comparison must follow terminal rollback');
 return Object.freeze({kind:'verified_owned_runtime_rollback',checkedAt:now,source:policy.prior.source,version:restored.versionId,deployment:restored.deploymentId,
  predecessorDeployment:predecessor.deploymentId,predecessorRun:policy.prior.run,predecessorAttempt:policy.prior.attempt,
  failedRun:policy.failed.run,failedAttempt:policy.failed.attempt,failedSource:policy.failed.source,failedReleaseVerified:false,
  publicToolChecksVerified:true,protectedStockIdentical:true,dataRestored:false,
  evidence:Object.freeze({failedArtifact:policy.failed.artifact.sha256,priorArtifact:policy.prior.artifact.sha256,failedLog:policy.failed.logs.sha256,priorLog:policy.prior.logs.sha256,precedingOwnedRollback:Object.freeze({deployment:captured.deploymentId,version:captured.versionId,failedRun:originalPolicy.failed.run,failedAttempt:originalPolicy.failed.attempt,failedSource:originalPolicy.failed.source,failedArtifact:originalPolicy.failed.artifact.sha256,failedLog:originalPolicy.failed.logs.sha256})})});
}


// Call immediately before adoption with a fresh provider read. Matching version
// alone is insufficient: a later same-version deployment is a different owner.
export function assertOwnedRollbackStartingPoint(receipt,active){
 assert.equal(receipt?.kind,'verified_owned_runtime_rollback');assert.equal(receipt?.failedReleaseVerified,false);
 assert.deepEqual(providerIdentity(active),identity({deploymentId:receipt.deployment,versionId:receipt.version}),'Owned rollback starting point moved');
 return true;
}
