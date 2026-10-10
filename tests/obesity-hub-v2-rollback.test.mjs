import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {restoredMaleObesityHubV2Runtime as p,verifiedMaleObesityRollback,verifyMaleObesityRollback,verifiedStartingPoint} from '../shift-coach/cancelled-release-recovery.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/obesity-hub-v2-rollback-38072143100.json',import.meta.url),'utf8'));
const active=()=>({id:p.deployment,source:'wrangler',versions:[{version_id:p.verifiedVersion,percentage:100}],annotations:{'workers/triggered_by':'deployment','workers/message':'Owned release failed post-deployment checks; restore captured runtime and preserve current data'}});
const version=()=>({id:p.verifiedVersion,metadata:{created_on:p.versionCreatedOn,source:'wrangler'},annotations:{'workers/triggered_by':'version_upload'}});
const prior=()=>({run:p.verifiedRun,source:p.verifiedSource,version:p.verifiedVersion,deployment:p.previousDeployment});
test('only exact failed Hub-v2 run, owned rollback and successful predecessor are retained',()=>assert(verifiedMaleObesityRollback(active(),version(),fixture.failedRun,fixture.failedJob,fixture.failedLogs,prior())));
test('deployment, version, failure, source and rollback drift fail closed',()=>{
 const verify=(a=active(),v=version(),r=fixture.failedRun,j=fixture.failedJob,l=fixture.failedLogs,pr=prior())=>verifiedMaleObesityRollback(a,v,r,j,l,pr);
 for(const a of [{...active(),id:p.previousDeployment},{...active(),versions:[{version_id:p.failedVersion,percentage:100}]},{...active(),versions:[{version_id:p.verifiedVersion,percentage:50}]}])assert.equal(verify(a),false);
 assert.equal(verify(active(),{...version(),metadata:{created_on:'wrong',source:'wrangler'}}),false);
 for(const patch of [{conclusion:'success'},{head_sha:'f'.repeat(40)},{run_attempt:2},{event:'workflow_dispatch'}])assert.equal(verify(active(),version(),{...fixture.failedRun,...patch}),false);
 for(const number of [63,81,114,115])assert.equal(verify(active(),version(),fixture.failedRun,{...fixture.failedJob,steps:fixture.failedJob.steps.filter(x=>x.number!==number)}),false);
 for(const l of [fixture.failedLogs.replace(p.failedVersion,'wrong'),fixture.failedLogs.replace('"releaseVerified":false','"releaseVerified":true'),fixture.failedLogs.replace(p.deployment,'wrong'),fixture.failedLogs+'\n'+fixture.failedLogs])assert.equal(verify(active(),version(),fixture.failedRun,fixture.failedJob,l),false);
 assert.equal(verify(active(),version(),fixture.failedRun,fixture.failedJob,fixture.failedLogs,{...prior(),source:'f'.repeat(40)}),false);
});
test('authenticated chain carries exact retention through subsequent starting-point guard',async()=>{
 const get=async path=>path.includes(String(p.verifiedRun))?(path.includes('/jobs')?fixture.priorJobs:fixture.priorRun):(path.includes('/jobs')?{jobs:[fixture.failedJob]}:fixture.failedRun);
 const logs=async id=>id===p.verifiedJob?fixture.priorLogs:fixture.failedLogs;
 const proof=await verifyMaleObesityRollback(active(),version(),get,logs);
 assert.equal(proof.deployment,p.deployment);
 const record={decision:'retain',restoredMaleObesityRuntimeProof:proof,run:p.run,from:p.verifiedVersion,to:p.verifiedVersion,verifiedRun:p.verifiedRun,ownedProof:null,dataChanged:false,customerRecordsRead:0};
 assert.deepEqual(verifiedStartingPoint(record,active()),{source:p.verifiedSource,version:p.verifiedVersion,run:p.verifiedRun});
 assert.throws(()=>verifiedStartingPoint({...record,dataChanged:true},active()));
 await assert.rejects(()=>verifyMaleObesityRollback(active(),version(),get,async()=>''));
});
