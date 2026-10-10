import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {restoredMaleObesityHubV2TransportRuntime as p,restoredMaleObesityHubV2Runtime as first,verifiedMaleObesityRollback,verifyMaleObesityRollback,verifiedStartingPoint} from '../shift-coach/cancelled-release-recovery.mjs';
const f=JSON.parse(readFileSync(new URL('./fixtures/obesity-hub-v2-transport-rollback-38075479733.json',import.meta.url),'utf8'));
const prior=JSON.parse(readFileSync(new URL('./fixtures/obesity-hub-v2-rollback-38072143100.json',import.meta.url),'utf8'));
const active=()=>({id:p.deployment,source:'wrangler',versions:[{version_id:p.verifiedVersion,percentage:100}],annotations:{'workers/triggered_by':'deployment','workers/message':'Owned release failed post-deployment checks; restore captured runtime and preserve current data'}});
const version=()=>({id:p.verifiedVersion,metadata:{created_on:p.versionCreatedOn,source:'wrangler'},annotations:{'workers/triggered_by':'version_upload'}});
const proof=()=>({run:p.verifiedRun,source:p.verifiedSource,version:p.verifiedVersion,deployment:first.deployment,priorRollbackProof:{...first,version:first.verifiedVersion}});
test('exact transport rollback requires original owned rollback chain and failed preservation gate',()=>assert(verifiedMaleObesityRollback(active(),version(),f.failedRun,f.failedJob,f.failedLogs,proof())));
test('unknown IDs, missing failure, false success or missing prior chain fail closed',()=>{
 const verify=(a=active(),v=version(),r=f.failedRun,j=f.failedJob,l=f.failedLogs,pr=proof())=>verifiedMaleObesityRollback(a,v,r,j,l,pr);
 for(const patch of [{id:first.deployment},{versions:[{version_id:p.failedVersion,percentage:100}]},{versions:[{version_id:p.verifiedVersion,percentage:50}]}])assert.equal(verify({...active(),...patch}),false);
 for(const number of [63,81,88,114,115])assert.equal(verify(active(),version(),f.failedRun,{...f.failedJob,steps:f.failedJob.steps.filter(x=>x.number!==number)}),false);
 for(const l of [f.failedLogs.replace("code: 'ECONNRESET'",'wrong'),f.failedLogs.replace(p.deployment,'wrong'),f.failedLogs.replace('"releaseVerified":false','"releaseVerified":true'),f.failedLogs+'\n'+f.failedLogs])assert.equal(verify(active(),version(),f.failedRun,f.failedJob,l),false);
 assert.equal(verify(active(),version(),{...f.failedRun,conclusion:'success'}),false);assert.equal(verify(active(),version(),f.failedRun,f.failedJob,f.failedLogs,{...proof(),priorRollbackProof:null}),false);
});
test('both exact failed-release chains and the successful original are authenticated before retaining',async()=>{
 const get=async path=>path.includes(String(p.verifiedRun))?(path.includes('/jobs')?prior.priorJobs:prior.priorRun):path.includes(String(first.run))?(path.includes('/jobs')?{jobs:[prior.failedJob]}:prior.failedRun):(path.includes('/jobs')?{jobs:[f.failedJob]}:f.failedRun);
 const logs=async id=>id===p.verifiedJob?prior.priorLogs:id===first.job?prior.failedLogs:f.failedLogs;
 const r=await verifyMaleObesityRollback(active(),version(),get,logs);assert.equal(r.deployment,p.deployment);
 const record={decision:'retain',restoredMaleObesityRuntimeProof:r,run:p.run,from:p.verifiedVersion,to:p.verifiedVersion,verifiedRun:p.verifiedRun,ownedProof:null,dataChanged:false,customerRecordsRead:0};assert.deepEqual(verifiedStartingPoint(record,active()),{source:p.verifiedSource,version:p.verifiedVersion,run:p.verifiedRun});
 await assert.rejects(()=>verifyMaleObesityRollback(active(),version(),get,async id=>id===first.job?'':await logs(id)));
});
