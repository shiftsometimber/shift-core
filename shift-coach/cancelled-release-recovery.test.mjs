import test from 'node:test';import assert from 'node:assert/strict';import {articleRuntime,recovery,recoveryDecision,verifiedArticleRuntime,verifiedOwnedRuntime,verifiedStartingPoint} from './cancelled-release-recovery.mjs';
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

test('the bounded article release is retained only for its exact successful Worker runtime',()=>{
 const run={id:articleRuntime.run,head_sha:articleRuntime.source,status:'completed',conclusion:'success',event:'push',head_branch:'main',path:articleRuntime.workflow};
 const job={name:'release',conclusion:'success',run_id:articleRuntime.run};
 assert.equal(verifiedArticleRuntime(active(articleRuntime.version),run,job),true);
 assert.equal(verifiedArticleRuntime(active(recovery.verified),run,job),false);
 for(const patch of [{id:1},{head_sha:'f'.repeat(40)},{conclusion:'failure'},{event:'pull_request'},{path:'other.yml'}])assert.equal(verifiedArticleRuntime(active(articleRuntime.version),{...run,...patch},job),false);
 assert.equal(verifiedArticleRuntime(active(articleRuntime.version),run,{...job,run_id:1}),false);
});

test('promotion carries the exact verified later runtime forward and rejects moved or mismatched receipts',()=>{
 const version='11111111-1111-4111-8111-111111111111';
 const record={decision:'retain',run:recovery.run,from:version,to:version,verifiedRun:123,ownedProof:{run:123,source:'a'.repeat(40),version},dataChanged:false};
 assert.deepEqual(verifiedStartingPoint(record,active(version)),{source:'a'.repeat(40),version,run:123});
 for(const patch of [{decision:'restore'},{from:recovery.verified},{verifiedRun:124},{dataChanged:true},{ownedProof:{...record.ownedProof,version:recovery.verified}}])assert.throws(()=>verifiedStartingPoint({...record,...patch},active(version)));
 assert.throws(()=>verifiedStartingPoint(record,active(recovery.verified)));
 assert.throws(()=>verifiedStartingPoint(record,{versions:[{version_id:version,percentage:50}]}));
 assert.throws(()=>verifiedStartingPoint({...record,ownedProof:null},active(version)));
 const old={decision:'retain',run:recovery.run,from:recovery.verified,to:recovery.verified,verifiedRun:recovery.verifiedRun,ownedProof:null,dataChanged:false};
 assert.equal(verifiedStartingPoint(old,active(recovery.verified)).version,recovery.verified);
 assert.equal(verifiedStartingPoint({...old,decision:'restore',from:recovery.unverified},active(recovery.verified)).version,recovery.verified);
});

import {recentSuccessfulPromotions} from './cancelled-release-recovery.mjs';
test('successful deployment evidence uses the exact production workflow instead of unrelated traffic',async()=>{
 const requests=[],production={id:37277280482,path:'.github/workflows/cloudflare-production-promote.yml'};
 const result=await recentSuccessfulPromotions(async path=>{requests.push(path);assert(path.startsWith('/actions/workflows/cloudflare-production-promote.yml/runs?'));return {workflow_runs:[production]}});
 assert.deepEqual(result,[production]);assert.equal(requests.length,1);
 assert(requests.every(path=>path.includes('branch=main&event=push&status=success')));
});
test('workflow-scoped history is bounded and never invents an ownership receipt',async()=>{
 let calls=0;assert.deepEqual(await recentSuccessfulPromotions(async()=>{calls++;return {workflow_runs:Array.from({length:100},()=>({path:'other.yml'}))}}),[]);assert.equal(calls,1);
 calls=0;assert.deepEqual(await recentSuccessfulPromotions(async()=>{calls++;return {workflow_runs:[]}}),[]);assert.equal(calls,1);
 const records=Array.from({length:100},(_,id)=>({id,path:'.github/workflows/cloudflare-production-promote.yml'}));
 assert.deepEqual(await recentSuccessfulPromotions(async()=>({workflow_runs:records})),records.slice(0,5));
});
