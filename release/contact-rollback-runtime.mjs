import assert from 'node:assert/strict';
import {verifiedOwnedRuntime} from '../shift-coach/cancelled-release-recovery.mjs';
// Recognition of one completed owned rollback only. This module cannot deploy or restore.
export const CONTACT_ROLLBACK=Object.freeze({
 run:38291781709,job:114953466887,attempt:1,source:'7da4c5406a59bcd929240bd72cb5c7a7b96c8b60',
 deployment:'4a9c25dc-4208-43f1-9e72-12ee11eba7ac',
 failedDeployment:'5cdcd96c-e280-4282-bbee-150e8f765353',failedVersion:'dc0dd65f-6df9-46d1-a6b0-02bbd2232cac',
 verifiedRun:38248635395,verifiedJob:114828666204,verifiedAttempt:5,
 verifiedSource:'6ca3e8ca2a6eca7fbfa0ee485121a086a6f17d19',
 previousDeployment:'4254eee7-cae4-41bd-a0b6-19844758c332',
 version:'534545ec-7445-49bf-9333-47b08b7ad631',versionCreatedOn:'2026-10-12T13:48:41.560182Z'
});
const p=CONTACT_ROLLBACK,path='.github/workflows/cloudflare-production-promote.yml';
const records=(logs,kind)=>String(logs).split('\n').flatMap(line=>{
 const start=line.indexOf('{"kind":"'+kind+'"');if(start<0)return[];
 try{return[JSON.parse(line.slice(start))]}catch{assert.fail('Malformed exact '+kind+' receipt');}
});
function exactRun(run,id,source,attempt,conclusion){
 assert.equal(run?.id,id);assert.equal(run.head_sha,source);assert.equal(run.run_attempt,attempt);
 assert.equal(run.status,'completed');assert.equal(run.conclusion,conclusion);
 assert.equal(run.event,'push');assert.equal(run.head_branch,'main');assert.equal(run.path,path);
}
function exactJob(job,id,run,source,attempt,conclusion){
 assert.equal(job?.id,id);assert.equal(job.run_id,run);assert.equal(job.head_sha,source);
 assert.equal(job.run_attempt,attempt);assert.equal(job.name,'promote');
 assert.equal(job.status,'completed');assert.equal(job.conclusion,conclusion);
}
function step(job,number,name,conclusion){
 const found=job.steps?.filter(s=>s.number===number);assert.equal(found?.length,1);
 const s=found[0];assert.equal(s.name,name);assert.equal(s.status,'completed');assert.equal(s.conclusion,conclusion);return s;
}
function deployed(value,deploymentId,versionId){
 assert.deepEqual(value,{deploymentId,versionId,percentage:100});
}
function toolChecks(value,stage,source,run,deploymentId,versionId){
 assert.equal(value?.kind,'public_tool_release_check');assert.equal(value.stage,stage);
 assert.equal(value.source,source);assert.equal(String(value.run),String(run));
 assert.equal(value.status,'passed');assert.equal(value.toolChecksVerified,true);assert.deepEqual(value.errors,[]);
 assert.deepEqual(value.checks?.map(c=>c.path),['/decision-centre','/tools/alcohol','/tools/bmi','/tools/calories','/tools/healthy-weight','/tools/protein','/tools/waist-height','/tools/walking','/tools/water']);
 assert(value.checks.every(c=>c.status===200&&c.passed===true&&c.applicationItems===0&&c.canonicalWebPageItems===1));
 deployed(value.deployed,deploymentId,versionId);deployed(value.afterChecks,deploymentId,versionId);
}
export function assertContactRollback(active,version,failed,failedJob,failedLogs,verified,verifiedJob,verifiedLogs){
 assert.equal(active?.id,p.deployment);assert.equal(active.source,'wrangler');
 assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}]);
 assert.deepEqual(active.annotations,{'workers/message':'Owned release failed post-deployment checks; restore captured runtime and preserve current data','workers/triggered_by':'deployment'});
 assert.equal(version?.id,p.version);assert.equal(version.metadata?.created_on,p.versionCreatedOn);
 assert.equal(version.metadata?.source,'wrangler');
 assert.equal(version.annotations?.['workers/triggered_by'],'version_upload');
 assert(!version.annotations?.['workers/tag']&&!version.annotations?.['workers/message']);
 exactRun(failed,p.run,p.source,p.attempt,'failure');exactJob(failedJob,p.job,p.run,p.source,p.attempt,'failure');
 exactRun(verified,p.verifiedRun,p.verifiedSource,p.verifiedAttempt,'success');
 exactJob(verifiedJob,p.verifiedJob,p.verifiedRun,p.verifiedSource,p.verifiedAttempt,'success');
 step(verifiedJob,63,'Deploy current main to production','success');
 step(verifiedJob,114,'Restore the captured runtime if a post-deployment gate failed','skipped');
 step(failedJob,63,'Deploy current main to production','success');
 const failure=step(failedJob,88,'Prove existing public content and login asset are preserved outside exact approved additions','failure');
 const restore=step(failedJob,114,'Restore the captured runtime if a post-deployment gate failed','success');
 step(failedJob,115,'Verify nine public tool pages after owned rollback','success');
 assert(Date.parse(failure.completed_at)<=Date.parse(restore.started_at));
 assert(Date.parse(active.created_on)>=Date.parse(restore.started_at)&&Date.parse(active.created_on)<=Date.parse(restore.completed_at),'Rollback deployment must be inside its actual restore stage');
 const before={id:p.previousDeployment,versions:[{version_id:p.version,percentage:100}]};
 const owned=records(verifiedLogs,'owned_runtime_deployment');assert.equal(owned.length,1);
 assert.equal(owned[0].dataRestored,false);assert(verifiedOwnedRuntime(before,verified,verifiedJob,owned[0]),'Original successful owned deployment must match');
 assert.deepEqual(records(failedLogs,'owned_runtime_deployment'),[{
 kind:'owned_runtime_deployment',at:'2026-10-12T19:09:45.406Z',source:p.source,run:String(p.run),
 deploymentId:p.failedDeployment,versionId:p.failedVersion,previousDeploymentId:p.previousDeployment,previousVersionId:p.version,dataRestored:false
 }]);
 assert(String(failedLogs).includes('Current Version ID: '+p.version));
 for(const [logs,good]of[[verifiedLogs,true],[failedLogs,false]]){
  const reports=records(logs,'guarded_release_verification');assert.equal(reports.length,2,'Both terminal reports required');
  assert.deepEqual(reports[0],reports[1],'Terminal receipts disagree');
  for(const r of reports){
   assert.equal(r.source,good?p.verifiedSource:p.source);assert.equal(String(r.run),String(good?p.verifiedRun:p.run));
   assert.equal(r.workflowStatus,good?'success':'failure');assert.equal(r.releaseVerified,good);
   assert.equal(r.status,good?'verified':'failed');assert.equal(r.deployedVersion,good?p.version:p.failedVersion);
   toolChecks(r.deployChecks,'deploy',r.source,r.run,good?p.previousDeployment:p.failedDeployment,good?p.version:p.failedVersion);
   if(good)assert.equal(r.rollbackChecks,null);
   else{
    toolChecks(r.rollbackChecks,'rollback',p.source,p.run,p.deployment,p.version);
    assert.deepEqual(r.rollbackChecks.expected,{deploymentId:p.previousDeployment,versionId:p.version,percentage:100,checkSource:p.source});
   }
  }
 }
 return{run:p.verifiedRun,source:p.verifiedSource,version:p.version,evidenceKind:'exact-owned-contact-rollback-and-successful-predecessor',failedRun:p.run,rollbackDeployment:p.deployment};
}
export async function verifyContactRollback(active,version,get,getLogs){
 const verified=await get('/actions/runs/'+p.verifiedRun+'/attempts/'+p.verifiedAttempt);
 const verifiedJobs=await get('/actions/runs/'+p.verifiedRun+'/attempts/'+p.verifiedAttempt+'/jobs?per_page=100');
 const failed=await get('/actions/runs/'+p.run+'/attempts/'+p.attempt);
 const failedJobs=await get('/actions/runs/'+p.run+'/attempts/'+p.attempt+'/jobs?per_page=100');
 return assertContactRollback(active,version,failed,failedJobs.jobs?.find(j=>j.id===p.job),await getLogs(p.job),verified,verifiedJobs.jobs?.find(j=>j.id===p.verifiedJob),await getLogs(p.verifiedJob));
}
