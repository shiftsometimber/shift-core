import test from 'node:test';import assert from 'node:assert/strict';import {recovery,recoveryDecision,verifiedOwnedRuntime} from './cancelled-release-recovery.mjs';
const active=id=>({versions:[{version_id:id,percentage:100}]}),failed={id:recovery.run,head_sha:recovery.source,run_attempt:1,conclusion:'cancelled'},verified={id:recovery.verifiedRun,head_sha:recovery.verifiedSource,conclusion:'success'};
test('recovery only restores the exact evidenced cancelled runtime to the verified source',()=>{
 assert.deepEqual({verified:recovery.verified,verifiedRun:recovery.verifiedRun,verifiedSource:recovery.verifiedSource},{verified:'dee23ccf-be93-4aed-be76-02b724a4c470',verifiedRun:37081219787,verifiedSource:'4350e9a51fece40f5a260da0a847af2a7829c764'});
 assert.equal(recoveryDecision(active(recovery.unverified),failed,verified),'restore');assert.equal(recoveryDecision(active(recovery.verified),failed,verified),'retain');
 for(const change of [{conclusion:'success'},{head_sha:'f'.repeat(40)},{run_attempt:2},{id:1}])assert.throws(()=>recoveryDecision(active(recovery.unverified),{...failed,...change},verified));
 assert.throws(()=>recoveryDecision(active('unknown'),failed,verified));assert.throws(()=>recoveryDecision(active(recovery.unverified),failed,{...verified,conclusion:'failure'}));
 assert.throws(()=>recoveryDecision({versions:[{version_id:recovery.unverified,percentage:50}]},failed,verified));
});

test('a later runtime is retained only against its exact successful production job and owned receipt',()=>{
 const version='11111111-1111-4111-8111-111111111111',run={id:123,status:'completed',conclusion:'success',event:'push',head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml',head_sha:'a'.repeat(40)},job={name:'promote',conclusion:'success',run_id:123},receipt={kind:'owned_runtime_deployment',source:run.head_sha,run:'123',versionId:version,deploymentId:'22222222-2222-4222-8222-222222222222'};
 assert.equal(verifiedOwnedRuntime(active(version),run,job,receipt),true);
 for(const changes of [{conclusion:'failure'},{status:'in_progress'},{event:'pull_request'},{head_branch:'preview'},{path:'different-workflow.yml'}])assert.equal(verifiedOwnedRuntime(active(version),{...run,...changes},job,receipt),false);
 for(const changes of [{source:'b'.repeat(40)},{run:'124'},{versionId:recovery.unverified},{kind:'unowned_runtime'}])assert.equal(verifiedOwnedRuntime(active(version),run,job,{...receipt,...changes}),false);
 assert.equal(verifiedOwnedRuntime(active(version),run,{...job,run_id:124},receipt),false);
 assert.equal(verifiedOwnedRuntime({versions:[{version_id:version,percentage:50}]},run,job,receipt),false);
});
