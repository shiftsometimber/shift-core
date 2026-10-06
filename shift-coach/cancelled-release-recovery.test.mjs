import test from 'node:test';import assert from 'node:assert/strict';import {articleRuntime,recovery,recoveryDecision,verifiedArticleRuntime,verifiedOwnedRuntime,verifiedStartingPoint} from './cancelled-release-recovery.mjs';
const active=(id,deployment=id===recovery.unverified?recovery.unverifiedDeployment:'restored-deployment')=>({id:deployment,versions:[{version_id:id,percentage:100}]}),workflow={status:'completed',event:'push',head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml'},failed={...workflow,id:recovery.run,head_sha:recovery.source,run_attempt:1,conclusion:'cancelled'},verified={...workflow,id:recovery.verifiedRun,head_sha:recovery.verifiedSource,conclusion:'success'};
test('recovery only restores the exact evidenced cancelled runtime to the verified source',()=>{
 assert.deepEqual(recovery,{run:37512509413,source:'36301f661e9a2e220c15e7f1ccf070612186242b',unverified:'81f4a3a8-9b25-4bb5-bd0d-1e870cfc0206',unverifiedDeployment:'ec4aeeed-9656-4bc0-8e9d-6d751d6fac77',verified:'35e9b183-12c6-4a22-a68b-1a9ee3c8cef4',verifiedDeployment:'3f64ff03-76c6-4aaf-bc66-f4c3865711d9',verifiedRun:37510903784,verifiedSource:'ddde14b19d6ef79547e27afb4ed76bf1f4e39f05'});
 assert.equal(recoveryDecision(active(recovery.unverified),failed,verified),'restore');assert.equal(recoveryDecision(active(recovery.verified),failed,verified),'retain');
 for(const change of [{conclusion:'success'},{head_sha:'f'.repeat(40)},{run_attempt:2},{id:1},{status:'in_progress'},{event:'pull_request'},{head_branch:'preview'},{path:'other.yml'}])assert.throws(()=>recoveryDecision(active(recovery.unverified),{...failed,...change},verified));
 assert.throws(()=>recoveryDecision(active(recovery.unverified,'unknown-deployment'),failed,verified));
 assert.throws(()=>recoveryDecision(active('unknown'),failed,verified));assert.throws(()=>recoveryDecision(active(recovery.unverified),failed,{...verified,conclusion:'failure'}));
 for(const change of [{status:'in_progress'},{event:'pull_request'},{head_branch:'preview'},{path:'other.yml'}])assert.throws(()=>recoveryDecision(active(recovery.unverified),failed,{...verified,...change}));
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
import {catalogueRuntime,verifiedCatalogueRuntime} from './cancelled-release-recovery.mjs';
import {catalogueRollback,verifiedCatalogueRollback} from './cancelled-release-recovery.mjs';
import {readFileSync} from 'node:fs';
import {validateBaselineRepair,BASELINE_REPAIR_PATHS,CATALOGUE_COPY_PATHS} from '../release/fit-300-scope.mjs';
test('retain the restored catalogue baseline only with exact failed job, rollback and original runtime evidence',()=>{
 const p=catalogueRollback,c=catalogueRuntime,receipt=JSON.parse(readFileSync('docs/catalogue-runtime-rollback-37462426049.json','utf8'));
 const a={id:p.deployment,versions:[{version_id:c.version,percentage:100}]},run={id:p.run,head_sha:p.source,status:'completed',conclusion:'failure',run_attempt:1,event:'push',head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml'};
 const job={id:p.job,run_id:p.run,name:'promote',conclusion:'failure',steps:[{number:68,name:'Measure and retain live homepage mobile speed',conclusion:'failure'},{number:107,name:'Restore the captured runtime if a post-deployment gate failed',conclusion:'success'}]};
 const logs=JSON.stringify(receipt.owned)+'\nSUCCESS Worker Version '+c.version+' has been deployed to 100% of traffic.';
 assert.equal(verifiedCatalogueRollback(a,run,job,logs,receipt),true);
 for(const patch of [{id:'unknown'},{versions:[{version_id:p.failedVersion,percentage:100}]},{versions:[{version_id:c.version,percentage:50}]}])assert.equal(verifiedCatalogueRollback({...a,...patch},run,job,logs,receipt),false);
 for(const patch of [{id:1},{head_sha:'f'.repeat(40)},{conclusion:'success'},{run_attempt:2},{path:'other.yml'},{head_branch:'preview'}])assert.equal(verifiedCatalogueRollback(a,{...run,...patch},job,logs,receipt),false);
 assert.equal(verifiedCatalogueRollback(a,run,{...job,steps:job.steps.slice(0,1)},logs,receipt),false);
 assert.equal(verifiedCatalogueRollback(a,run,job,'',receipt),false);
 for(const patch of [{rollback:{...receipt.rollback,dataRestored:true}},{owned:{...receipt.owned,previousVersionId:p.failedVersion}},{artifact:{id:1,sha256:'bad'}},{independentObservation:{...receipt.independentObservation,percentage:50}}])assert.equal(verifiedCatalogueRollback(a,run,job,logs,{...receipt,...patch}),false);
});
test('composed baseline repair preserves newer verifier pins and rejects every finite payload drift',()=>{
 const repair=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).baselineRepairComposition;
 assert(repair,'Exact baseline composition required');
 validateBaselineRepair(repair,()=> 'same-blob');
 for(const patch of [{proof:'other'},{base:'f'.repeat(40)},{paths:[...repair.paths,'other.mjs']}])assert.throws(()=>validateBaselineRepair({...repair,...patch},()=> 'same-blob'));
 for(const changed of [...BASELINE_REPAIR_PATHS,...CATALOGUE_COPY_PATHS])assert.throws(()=>validateBaselineRepair(repair,(ref,p)=>ref==='HEAD'&&p===changed?'changed':'same-blob'));
});
test('finite local catalogue release needs exact deployment, hosted proof and independent live receipt',()=>{
 const p=catalogueRuntime,a={id:p.deployment,versions:[{version_id:p.version,percentage:100}]};
 const r={id:p.run,head_sha:p.source,status:'completed',conclusion:'success',event:'push',head_branch:'release/catalogue-benefits-20261006',path:'.github/workflows/catalogue-benefits-proof.yml'},j={id:p.job,run_id:p.run,name:'proof',conclusion:'success'};
 const receipt=JSON.parse(readFileSync('docs/catalogue-benefits-live-receipt-20261006.json','utf8'));
 assert.equal(verifiedCatalogueRuntime(a,r,j,receipt),true);
 for(const patch of [{id:'unknown'},{versions:[{version_id:p.version,percentage:50}]},{versions:[{version_id:recovery.unverified,percentage:100}]}])assert.equal(verifiedCatalogueRuntime({...a,...patch},r,j,receipt),false);
 for(const patch of [{id:1},{head_sha:'f'.repeat(40)},{conclusion:'failure'},{event:'pull_request'},{head_branch:'main'},{path:'other.yml'}])assert.equal(verifiedCatalogueRuntime(a,{...r,...patch},j,receipt),false);
 assert.equal(verifiedCatalogueRuntime(a,r,{...j,id:1},receipt),false);
 for(const patch of [{versionId:'unknown'},{deploymentId:'unknown'},{source:'f'.repeat(40)},{liveProof:{allExact:false}},{productionDatabaseWrites:1},{hostedProof:{run:p.run,job:p.job,conclusion:'failure'}}])assert.equal(verifiedCatalogueRuntime(a,r,j,{...receipt,...patch}),false);
});
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

import {recordedImageRuntime} from './cancelled-release-recovery.mjs';
test('recorded current image deployment remains discoverable when workflow history omits it',async()=>{
 assert.deepEqual(recordedImageRuntime,{run:37336998330,source:'9d2b9e146063d634ac7ce058258c00dd7d804d2c',version:'f81ab965-f6aa-4655-be7d-b29f4ac29d67'});
 const record={id:recordedImageRuntime.run,head_sha:recordedImageRuntime.source,conclusion:'success',status:'completed',path:'.github/workflows/cloudflare-production-promote.yml',event:'push',head_branch:'main'};
 const requests=[];const get=async path=>{requests.push(path);return path==='/actions/runs/'+record.id?record:{workflow_runs:[]}};
 assert.deepEqual(await recentSuccessfulPromotions(get,active(recordedImageRuntime.version)),[record]);assert.equal(requests.length,2);
 for(const patch of [{head_sha:'f'.repeat(40)},{conclusion:'failure'},{status:'in_progress'},{event:'pull_request'},{head_branch:'other'},{path:'other.yml'}])await assert.rejects(recentSuccessfulPromotions(async path=>path==='/actions/runs/'+record.id?{...record,...patch}:{workflow_runs:[]},active(recordedImageRuntime.version)));
 requests.length=0;assert.deepEqual(await recentSuccessfulPromotions(get,active('unknown')),[]);assert.equal(requests.length,1);
});

import {technicalRecovery,verifiedTechnicalCancelledRecovery} from './cancelled-release-recovery.mjs';
test('cancelled SEO recovery needs exact cancelled ownership and the successful captured predecessor',()=>{
 const e=JSON.parse(readFileSync('docs/runtime-cancelled-37512509413.json')),p=technicalRecovery;
 const a={id:p.deployment,versions:[{version_id:p.version,percentage:100}]},fl=JSON.stringify(e.cancelled.owned),vl=JSON.stringify(e.verified.owned);
 const check=(a2=a,r=e.cancelled.run,j=e.cancelled.job,f=fl,v=e.verified.run,vj=e.verified.job,l=vl)=>verifiedTechnicalCancelledRecovery(a2,r,j,f,v,vj,l);
 assert.equal(check(),true);
 for(const patch of [{id:'unknown'},{versions:[{version_id:p.version,percentage:50}]},{versions:[{version_id:p.verifiedVersion,percentage:100}]}])assert.equal(check({...a,...patch}),false);
 for(const patch of [{id:1},{head_sha:'f'.repeat(40)},{run_attempt:2},{conclusion:'success'},{event:'pull_request'},{path:'other.yml'},{head_branch:'preview'}])assert.equal(check(a,{...e.cancelled.run,...patch}),false);
 for(const patch of [{id:1},{run_id:1},{conclusion:'success'},{steps:e.cancelled.job.steps.filter(s=>s.number!==107)}])assert.equal(check(a,e.cancelled.run,{...e.cancelled.job,...patch}),false);
 assert.equal(check(a,e.cancelled.run,e.cancelled.job,''),false);
 for(const patch of [{previousVersionId:'unknown'},{previousDeploymentId:'unknown'},{deploymentId:'unknown'},{source:'f'.repeat(40)},{dataRestored:true}])assert.equal(check(a,e.cancelled.run,e.cancelled.job,JSON.stringify({...e.cancelled.owned,...patch})),false);
 for(const patch of [{conclusion:'cancelled'},{head_sha:'f'.repeat(40)},{run_attempt:2},{id:1}])assert.equal(check(a,e.cancelled.run,e.cancelled.job,fl,{...e.verified.run,...patch}),false);
 assert.equal(check(a,e.cancelled.run,e.cancelled.job,fl,e.verified.run,{...e.verified.job,id:1}),false);
 assert.equal(check(a,e.cancelled.run,e.cancelled.job,fl,e.verified.run,e.verified.job,''),false);
 assert.equal(check(a,e.cancelled.run,e.cancelled.job,fl+'\n'+fl),false);
});
test('restored SEO starting point stays exact and never treats the cancelled source as verified',()=>{
 const p=technicalRecovery,proof={run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment};
 const r={decision:'restore',run:p.run,from:p.version,to:p.verifiedVersion,verifiedRun:p.verifiedRun,technicalRecovery:proof,ownedProof:null,customerRecordsRead:0,dataChanged:false};
 assert.deepEqual(verifiedStartingPoint(r,active(p.verifiedVersion)),{source:p.verifiedSource,version:p.verifiedVersion,run:p.verifiedRun});
 for(const patch of [{decision:'retain'},{run:1},{from:'unknown'},{to:p.version},{verifiedRun:1},{dataChanged:true},{customerRecordsRead:1},{technicalRecovery:{...proof,source:'f'.repeat(40)}}])assert.throws(()=>verifiedStartingPoint({...r,...patch},active(p.verifiedVersion)));
 assert.throws(()=>verifiedStartingPoint(r,active(p.version)));
});

import {tabletRuntime,TABLET_RUNTIME_RECEIPT,verifyTabletRuntime} from './cancelled-release-recovery.mjs';
const tabletFixture=()=>{
 const p=tabletRuntime,active={id:p.deployment,source:'wrangler',created_on:'2026-10-06T21:11:22.219924Z',versions:[{version_id:p.version,percentage:100}]};
 const version={id:p.version,metadata:{created_on:'2026-10-06T21:11:18.582505Z',source:'wrangler'},annotations:{'workers/message':'Tablet guidance source '+p.source+'; hosted proof '+p.reviewRun,'workers/triggered_by':'version_upload'}};
 const text=readFileSync(TABLET_RUNTIME_RECEIPT,'utf8');
 const get=async path=>{
  const id=Number(path.split('/')[3]),previous=id===p.previousRun,review=id===p.reviewRun;
  if(path.includes('/jobs'))return {jobs:[{id:previous?1:review?p.reviewJob:p.job,run_id:id,name:previous?'promote':'verify',status:'completed',conclusion:'success'}]};
  return{id,head_sha:previous?p.previousSource:review?p.reviewSource:p.source,status:'completed',conclusion:'success',event:previous?'push':'pull_request',head_branch:previous?'main':'codex/tablet-guidance-20261006',path:previous?'.github/workflows/cloudflare-production-promote.yml':'.github/workflows/practical-guides-proof.yml'};
 };
 const logs=async()=>JSON.stringify({kind:'owned_runtime_deployment',source:p.previousSource,run:String(p.previousRun),deploymentId:p.previousDeployment,versionId:p.previousVersion,dataRestored:false});
 return{p,active,version,text,get,logs};
};
test('exact tablet local receipt, active version, hosted source proofs and successful predecessor qualify only for retention',async()=>{
 const f=tabletFixture(),proof=await verifyTabletRuntime(f.active,f.version,f.text,f.get,f.logs);
 assert.equal(proof.source,f.p.source);assert.equal(proof.deployment,f.p.deployment);assert.match(proof.evidenceKind,/recorded-local-deployment/);
});
test('tablet adoption rejects other runtimes, traffic splits and annotation drift',async()=>{
 const f=tabletFixture();
 for(const active of [{...f.active,id:'other'},{...f.active,versions:[{version_id:f.p.version,percentage:99}]}])await assert.rejects(verifyTabletRuntime(active,f.version,f.text,f.get,f.logs));
 await assert.rejects(verifyTabletRuntime(f.active,{...f.version,annotations:{}},f.text,f.get,f.logs));
});
test('tablet adoption never infers deployment from a hosted source proof or an edited local receipt',async()=>{
 const f=tabletFixture();await assert.rejects(verifyTabletRuntime(f.active,f.version,f.text+' ',f.get,f.logs),/Exact recorded/);
 await assert.rejects(verifyTabletRuntime(f.active,f.version,f.text,f.get,async()=>''),/predecessor deployment/);
 for(const patch of [{head_sha:'f'.repeat(40)},{conclusion:'failure'}]){
  const get=async path=>{const r=await f.get(path);return path==='/actions/runs/'+f.p.run?{...r,...patch}:r;};
  await assert.rejects(verifyTabletRuntime(f.active,f.version,f.text,get,f.logs));
 }
});

import {tabletOwnedRollback,verifiedTabletOwnedRollback} from './cancelled-release-recovery.mjs';
test('only the exact owned rollback may retain the earlier verified tablet version',()=>{
 const p=tabletOwnedRollback,t=tabletRuntime;
 const active={id:p.deployment,versions:[{version_id:t.version,percentage:100}]};
 const run={id:p.run,head_sha:p.source,run_attempt:1,status:'completed',conclusion:'failure',event:'push',head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml'};
 const job={id:p.job,run_id:p.run,name:'promote',status:'completed',conclusion:'failure',steps:[[50,'Capture current Worker deployment for rollback'],[60,'Deploy current main to production'],[107,'Restore the captured runtime if a post-deployment gate failed']].map(([number,name])=>({number,name,conclusion:'success'}))};
 const owned={kind:'owned_runtime_deployment',source:p.source,run:String(p.run),deploymentId:p.failedDeployment,versionId:p.failedVersion,previousDeploymentId:t.deployment,previousVersionId:t.version,dataRestored:false};
 const logs=JSON.stringify(owned)+'\nSUCCESS  Worker Version '+t.version+' has been deployed to 100% of traffic.';
 const artifact={id:p.artifact,name:'b1-runtime-release-'+p.run,digest:p.digest,size_in_bytes:4291476,workflow_run:{id:p.run,head_sha:p.source,head_branch:'main'}};
 const check=(a=active,r=run,j=job,l=logs,e=artifact)=>verifiedTabletOwnedRollback(a,r,j,l,e);
 assert.equal(check(),true);
 for(const patch of [{id:'unknown'},{versions:[{version_id:p.failedVersion,percentage:100}]},{versions:[{version_id:t.version,percentage:99}]}])assert.equal(check({...active,...patch}),false);
 for(const patch of [{head_sha:'f'.repeat(40)},{run_attempt:2},{conclusion:'success'},{event:'pull_request'},{path:'other.yml'}])assert.equal(check(active,{...run,...patch}),false);
 for(const patch of [{id:1},{conclusion:'success'},{steps:job.steps.filter(s=>s.number!==107)}])assert.equal(check(active,run,{...job,...patch}),false);
 for(const patch of [{previousVersionId:'other'},{previousDeploymentId:'other'},{dataRestored:true}])assert.equal(check(active,run,job,JSON.stringify({...owned,...patch})+'\nSUCCESS  Worker Version '+t.version+' has been deployed to 100% of traffic.'),false);
 assert.equal(check(active,run,job,logs+'\n'+JSON.stringify(owned)),false);
 assert.equal(check(active,run,job,JSON.stringify(owned)),false);
 for(const patch of [{id:1},{digest:'sha256:other'},{workflow_run:{...artifact.workflow_run,head_sha:'f'.repeat(40)}}])assert.equal(check(active,run,job,logs,{...artifact,...patch}),false);
});
