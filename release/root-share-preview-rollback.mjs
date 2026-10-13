import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export const ROOT_SHARE_ROLLBACK=Object.freeze({
 run:38443047663,job:115454432183,source:'9b5bc176a318914eb524b013e3dd4ae25c41756f',
 failedDeployment:'0b4a169b-dc81-4bf8-9a14-e46489c0c57a',failedVersion:'f25b2148-3e27-495e-bb34-4b8ece98ee5e',
 deployment:'2c101c54-9a10-4890-a3e7-f292e964d4a7',version:'c2b4ad51-201a-4704-ab32-ec76ca5c8918',
 verifiedRun:38420048446,verifiedJob:115374804411,verifiedSource:'c9756798dd271260c8812e419fae5f0d7c61e194',verifiedDeployment:'c467c3f0-4644-4ce1-b543-fb731fc9305c',
 createdOn:'2026-10-13T15:51:54.847698Z',restoredAt:'2026-10-13T18:40:28.249Z',checkedAt:'2026-10-13T18:40:32.254Z',
 artifact:11839142516,artifactBytes:898341,artifactSha256:'a72d6e823245c3b75009ee2fb6edf3d4b2b0146569d95e51964a7cdb9c7c530d',
 workflow:'.github/workflows/cloudflare-production-promote.yml'
});
const p=ROOT_SHARE_ROLLBACK;
const step=(job,name,conclusion)=>assert((job.steps||[]).some(s=>s.name===name&&s.status==='completed'&&s.conclusion===conclusion),'Required terminal step: '+name);
const run=(r,id,source,conclusion)=>{for(const [k,v]of Object.entries({id,head_sha:source,conclusion,status:'completed',event:'push',head_branch:'main',run_attempt:1,path:p.workflow}))assert.equal(r[k],v,'Exact production run: '+k);};
const job=(j,id,runId,conclusion)=>{for(const [k,v]of Object.entries({id,run_id:runId,name:'promote',status:'completed',conclusion}))assert.equal(j[k],v,'Exact production job: '+k);};
function owned(logs){const found=logs.split('\n').filter(l=>l.includes('{"kind":"owned_runtime_deployment"')).map(l=>JSON.parse(l.slice(l.indexOf('{"kind":"owned_runtime_deployment"'))));assert.equal(found.length,1,'Exactly one immutable owned-deployment receipt required');return found[0];}
function activeShape(a,deployment,version){assert.equal(a.id,deployment);assert.deepEqual(a.versions,[{version_id:version,percentage:100}]);}
export function verifyRootShareRollbackEvidence({active,version,failedRun,failedJob,verifiedRun,verifiedJob,failedLogs,verifiedLogs,artifact,files}){
 activeShape(active,p.deployment,p.version);assert.equal(version.id,p.version);assert.equal(version.metadata?.created_on,p.createdOn);assert.equal(version.metadata?.source,'wrangler');assert.equal(version.annotations?.['workers/triggered_by'],'version_upload');assert(!version.annotations?.['workers/tag']);assert(!version.annotations?.['workers/message']);
 run(failedRun,p.run,p.source,'failure');job(failedJob,p.job,p.run,'failure');run(verifiedRun,p.verifiedRun,p.verifiedSource,'success');job(verifiedJob,p.verifiedJob,p.verifiedRun,'success');
 for(const [name,result]of [['Deploy current main to production','success'],['Verify corrected homepage sharing image and exact page preservation live','failure'],['Restore the captured runtime if a post-deployment gate failed','success'],['Verify nine public tool pages after owned rollback','success']])step(failedJob,name,result);
 for(const [name,result]of [['Deploy current main to production','success'],['Verify B1 protected catalogue and stock remain identical','success'],['Restore the captured runtime if a post-deployment gate failed','skipped']])step(verifiedJob,name,result);
 const old=owned(verifiedLogs),failed=owned(failedLogs);
 for(const [k,v]of Object.entries({source:p.verifiedSource,run:String(p.verifiedRun),deploymentId:p.verifiedDeployment,versionId:p.version,dataRestored:false}))assert.equal(old[k],v,'Original successful owned receipt: '+k);
 for(const [k,v]of Object.entries({source:p.source,run:String(p.run),deploymentId:p.failedDeployment,versionId:p.failedVersion,previousDeploymentId:p.verifiedDeployment,previousVersionId:p.version,dataRestored:false}))assert.equal(failed[k],v,'Failed release captured predecessor: '+k);
 assert(failedLogs.includes('AssertionError [ERR_ASSERTION]')&&failedLogs.includes("'cache-control': 'public, max-age=0, must-revalidate'")&&failedLogs.includes("'cache-control': 'no-store'"),'Exact HEAD/GET verifier failure required');
 assert(failedLogs.includes('Worker Version '+p.version+' has been deployed to 100% of traffic.'),'Actual captured-runtime restoration log required');
 for(const [k,v]of Object.entries({id:p.artifact,name:'b1-runtime-release-'+p.run,size_in_bytes:p.artifactBytes,digest:'sha256:'+p.artifactSha256,expired:false}))assert.equal(artifact[k],v,'Immutable official artifact: '+k);assert.equal(artifact.workflow_run?.id,p.run);assert.equal(artifact.workflow_run?.head_sha,p.source);
 const rollback=files.rollback,report=files.report,record=files.owned,checks=files.checks;
 for(const [k,v]of Object.entries({at:p.restoredAt,restoredVersion:p.version,deployment:p.deployment,dataRestored:false,reason:'Post-deployment gate failed; release remains failed.'}))assert.equal(rollback[k],v,'Actual rollback artifact: '+k);
 assert.deepEqual(record,failed,'Artifact and actual failed job ownership must agree');
 for(const [k,v]of Object.entries({kind:'guarded_release_verification',source:p.source,run:String(p.run),workflowStatus:'failure',releaseVerified:false,status:'failed',deployedVersion:p.failedVersion}))assert.equal(report[k],v,'Failed release stays failed: '+k);
 assert.equal(checks.status,'passed');assert.equal(checks.toolChecksVerified,true);assert.equal(checks.finishedAt,p.checkedAt);assert.equal(checks.source,p.source);assert.equal(checks.run,String(p.run));assert.equal(checks.stage,'rollback');assert.deepEqual(checks.errors,[]);assert.equal(checks.checks.length,9);assert(checks.checks.every(c=>c.passed===true));
 assert.deepEqual(checks.checks.map(c=>c.path),['/decision-centre','/tools/alcohol','/tools/bmi','/tools/calories','/tools/healthy-weight','/tools/protein','/tools/waist-height','/tools/walking','/tools/water']);
 const restored={deploymentId:p.deployment,versionId:p.version,percentage:100};assert.deepEqual(checks.deployed,restored);assert.deepEqual(checks.afterChecks,restored);assert.equal(checks.expected.deploymentId,p.verifiedDeployment);assert.equal(checks.expected.versionId,p.version);assert.equal(checks.expected.percentage,100);assert.deepEqual(report.rollbackChecks,checks);assert.equal(report.deployChecks.status,'passed');assert.equal(report.deployChecks.deployed.deploymentId,p.failedDeployment);assert.equal(report.deployChecks.deployed.versionId,p.failedVersion);assert.equal(report.deployChecks.deployed.percentage,100);
 return {run:p.verifiedRun,source:p.verifiedSource,version:p.version,deployment:p.deployment,evidenceKind:'exact-successful-source-and-guarded-owned-rollback',failedRun:p.run,failedJob:p.job,artifact:p.artifact,artifactSha256:p.artifactSha256,rollbackCheckedAt:p.checkedAt,dataChanged:false,customerRecordsRead:0,newRollbackPerformed:false};
}
export function decodeRootShareRollbackArtifact(bytes){
 assert.equal(bytes.length,p.artifactBytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),p.artifactSha256,'Exact immutable hosted artifact bytes required');
 const dir=mkdtempSync(join(tmpdir(),'root-share-owned-rollback-'));try{const path=join(dir,'receipt.zip');writeFileSync(path,bytes);const read=name=>JSON.parse(execFileSync('unzip',['-p',path,name],{encoding:'utf8',maxBuffer:4*1024*1024}));return {rollback:read('rollback.json'),report:read('tool-schema-release-report.json'),owned:read('owned-runtime-deployment.json'),checks:read('tool-schema-rollback.json')};}finally{rmSync(dir,{recursive:true,force:true});}
}
export async function verifyRootShareRollback(active,version,get,getLogs,getArtifact){
 const [failedRun,failedJobs,verifiedRun,verifiedJobs,artifacts,failedLogs,verifiedLogs]=await Promise.all([get('/actions/runs/'+p.run),get('/actions/runs/'+p.run+'/jobs'),get('/actions/runs/'+p.verifiedRun),get('/actions/runs/'+p.verifiedRun+'/jobs'),get('/actions/runs/'+p.run+'/artifacts'),getLogs(p.job),getLogs(p.verifiedJob)]);
 const artifact=artifacts.artifacts?.find(a=>a.id===p.artifact);assert(artifact,'Exact immutable hosted rollback artifact unavailable');const files=decodeRootShareRollbackArtifact(await getArtifact(p.artifact));
 return verifyRootShareRollbackEvidence({active,version,failedRun,failedJob:failedJobs.jobs?.find(j=>j.id===p.job),verifiedRun,verifiedJob:verifiedJobs.jobs?.find(j=>j.id===p.verifiedJob),failedLogs,verifiedLogs,artifact,files});
}
