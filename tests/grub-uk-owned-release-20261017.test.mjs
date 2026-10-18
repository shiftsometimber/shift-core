import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {digest,assertOwned,assertStock} from '../release/gp-priority-direct-owned-release-20261016.mjs';
import {assertGrubLane,assertCoreWrite,assertPreparedWindow,assertBaselineProvider,assertGrubPrepared,assertCompletedProducer,assertRestoringRun,recoverGrubIntent,assertCapturedGrubRollback,assertPreviousGrubFailure,LANE} from '../release/grub-uk-owned-release-20261017.mjs';
import {verifyGrubLive,expectedGrubAssetResponse} from '../release/grub-uk-live-20261017.mjs';
import {grubRuntime} from '../member-experience/grub-runtime.mjs';
import {applyBookVoiceCopy} from '../book-voice.mjs';
const id='11111111-1111-1111-1111-111111111111',next='22222222-2222-2222-2222-222222222222',deployment='33333333-3333-3333-3333-333333333333';
const binding=(name,text)=>({name,type:'plain_text',text});
function snapshot(){return {deployment:{id:deployment,versions:[{version_id:id,percentage:100}]},version:{id,resources:{bindings:[binding('MEMBER_GP_DIRECTORY_V2_ENABLED','true'),binding('MY_TIMBER_WEEK_VIEW_ENABLED','true')],script_runtime:{compatibility_date:'2026-08-09',compatibility_flags:['nodejs_compat']}}}};}
function accepted(s){return {deploymentId:s.deployment.id,versionId:s.version.id,allBindingsSha256:digest(s.version.resources.bindings.slice().sort((a,b)=>a.name.localeCompare(b.name))),versionSnapshotSha256:digest(s.version),deploymentSnapshotSha256:digest(s.deployment)};}
const run={id:1,run_attempt:1,head_sha:'a'.repeat(40),head_branch:LANE.branch,path:LANE.workflow,event:'push',repository:{full_name:LANE.repository},status:'completed',conclusion:'success'};
test('Grub accepts only literal current push lane, source, attempt and repository',()=>{
 assertGrubLane(run,{source:run.head_sha,runId:1,attempt:1});
 for(const [key,value] of [['id',2],['run_attempt',2],['head_sha','b'.repeat(40)],['head_branch','main'],['path','.github/workflows/cloudflare-production-promote.yml'],['event','workflow_dispatch']])assert.throws(()=>assertGrubLane({...run,[key]:value},{source:run.head_sha,runId:1,attempt:1}));
 assert.throws(()=>assertGrubLane({...run,repository:{full_name:'other/repo'}},{source:run.head_sha,runId:1,attempt:1}));
});
test('Grub baseline refuses moved traffic, altered immutable metadata, duplicate or changed bindings and GP/week deactivation',()=>{
 const before=snapshot(),proof=accepted(before);assertBaselineProvider(before,proof);
 for(const mutate of [s=>s.deployment.id=next,s=>s.deployment.versions[0].percentage=50,s=>s.version.id=next,s=>s.version.metadata={modified:true},s=>s.version.resources.bindings.push(binding('NEW','true')),s=>s.version.resources.bindings.push(binding('MEMBER_GP_DIRECTORY_V2_ENABLED','true')),s=>s.version.resources.bindings[0].text='false',s=>s.version.resources.bindings[1].text='false']){
  const s=structuredClone(before);mutate(s);assert.throws(()=>assertBaselineProvider(s,proof));
 }
});
test('Grub upload preserves every binding/runtime and exact compiled whole bundle',()=>{
 const before=snapshot(),version=structuredClone(before.version);version.id=next;const p={version,bundle:{sha256:'a'.repeat(64),bytes:100},local:{sha256:'a'.repeat(64),bytes:100}};assertGrubPrepared(p,before);
 for(const mutate of [p=>p.version.resources.bindings.push(binding('NEW','true')),p=>p.version.resources.script_runtime.compatibility_date='2026-10-17',p=>p.bundle.sha256='b'.repeat(64),p=>p.local.bytes=99]){const q=structuredClone(p);mutate(q);assert.throws(()=>assertGrubPrepared(q,before));}
});
test('Grub writes are Core deployment only and prepared window retains original five-minute limit',()=>{
 assertCoreWrite('shift-core','/deployments','POST');for(const args of [['shift-hq-management','/deployments','POST'],['shift-core','/versions','POST'],['shift-core','/deployments','DELETE']])assert.throws(()=>assertCoreWrite(...args));
 const now=Date.now();assertPreparedWindow(new Date(now-1000).toISOString(),now);for(const at of [new Date(now-300000).toISOString(),new Date(now+1).toISOString(),'invalid'])assert.throws(()=>assertPreparedWindow(at,now));
});
test('Grub does not reinterpret failed producer evidence as accepted runtime',()=>{
 const expected={id:'1',attempt:'1',source:run.head_sha,branch:run.head_branch,workflow:run.path};assertCompletedProducer(run,expected);assert.throws(()=>assertCompletedProducer({...run,conclusion:'cancelled'},expected));
 const restore={...run,head_branch:'main',path:'.github/workflows/cloudflare-production-promote.yml',conclusion:'cancelled'};assertRestoringRun(restore,{id:'1',attempt:'1',source:run.head_sha,conclusion:'cancelled'});assert.throws(()=>assertRestoringRun({...restore,conclusion:'success'},{id:'1',attempt:'1',source:run.head_sha,conclusion:'success'}));
});
test('Existing owned cleanup and stock assertions still reject stale ownership and stock mutation',()=>{
 const receipt={source:run.head_sha,run:'1',attempt:'1',deploymentId:deployment,versionId:id};assertOwned(snapshot().deployment,receipt,run.head_sha,'1','1');assert.throws(()=>assertOwned({...snapshot().deployment,id:next},receipt,run.head_sha,'1','1'));assert.throws(()=>assertOwned(snapshot().deployment,receipt,run.head_sha,'2','1'));
 assertStock({stock:'same'},{stock:'same'});assert.throws(()=>assertStock({stock:'same'},{stock:'changed'}));
});
test('Live proof compares the whole original serving pipeline and private denials without member writes',async()=>{
 const expected=await expectedGrubAssetResponse(),body=await expected.text(),headers=Object.fromEntries(expected.headers);
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return url.includes('/assets/')?new Response(body,{headers}):Response.json({error:'authentication_required'},{status:401,headers:{'Cache-Control':'no-store','Vary':url.includes('/v1/grub/')?'Origin':'Cookie'}});};
 const result=await verifyGrubLive({fetcher});assert.equal(result.checks.length,7);assert.equal(result.dataWrites,0);assert(calls.every(c=>!c.options.method&&!c.options.body));
});
test('Qualified raw Grub body receives the exact unchanged book-voice adapter and arbitrary body changes fail',async()=>{
 const expected=await expectedGrubAssetResponse(),body=await expected.text(),headers=Object.fromEntries(expected.headers);
 assert.notEqual(body,grubRuntime,'The original serving presentation must actually transform this asset');assert.equal(body,applyBookVoiceCopy('/assets/member-experience/grub.mjs',grubRuntime));assert.equal(expected.headers.get('X-Shift-Book-Voice'),'20261002');
 for(const changed of [grubRuntime,body+'\n// arbitrary function mutation\n',body.replace('Something else','Unreviewed copy'),body.replace("'use strict'","'changed strict mode'")]){assert.notEqual(changed,body);await assert.rejects(verifyGrubLive({fetcher:async()=>new Response(changed,{headers})}),/Serving whole Grub script/);}
 await assert.rejects(verifyGrubLive({fetcher:async()=>new Response(body,{headers:{...headers,'X-Shift-Book-Voice':'unreviewed'}})}),/book voice policy header/);
});
test('Bounded workflow retains concurrency/compiler/time cap, exact owned phases and failure/cancellation cleanup',()=>{
 const source=readFileSync('.github/workflows/grub-uk-release-20261017.yml','utf8');
 for(const literal of ['branches: [release/grub-uk-catalogue-20261017]','group: cloudflare-production-promote','cancel-in-progress: false','timeout-minutes: 60',"version,'4.112.0'",'grub-uk-owned-release-20261017.mjs prepare','grub-uk-owned-release-20261017.mjs deploy','grub-uk-owned-release-20261017.mjs verify','grub-uk-owned-release-20261017.mjs rollback',"always() && (failure() || cancelled()) && steps.prepare.outcome == 'success'"])assert(source.includes(literal),literal);
 assert(!source.includes('workflow_dispatch'));assert(!source.includes('git push'));assert(!source.includes('continue-on-error'));
});

test('Ambiguous provider writes recover only the exact persisted subsequent Core intent',()=>{
 const baseline={deploymentId:deployment,versionId:id},intent={key:'core',versionId:next,message:'Grub exact owned intent',at:'2026-10-17T20:00:00.000Z'},s=snapshot();s.deployment.versions=[{version_id:next,percentage:100}];s.deployment.annotations={'workers/message':intent.message};s.deployment.created_on='2026-10-17T20:00:01.000Z';
 const context={source:run.head_sha,run:'1',attempt:'1',baseline},receipt=recoverGrubIntent(s,intent,context);assert.equal(receipt.previousVersionId,id);assert.equal(receipt.versionId,next);assert.equal(receipt.recoveredFromExactPersistedIntent,true);assert.equal(recoverGrubIntent(snapshot(),intent,context),null);
 for(const mutate of [s=>s.deployment.annotations['workers/message']='other',s=>s.deployment.versions[0].version_id=deployment,s=>s.deployment.versions[0].percentage=50,s=>s.deployment.created_on='2026-10-17T19:59:59.999Z',s=>s.deployment.created_on='invalid']){const altered=structuredClone(s);mutate(altered);assert.throws(()=>recoverGrubIntent(altered,intent,context));}
});

test('Fresh baseline binds the failed Grub attempt to its exact successful owned rollback without accepting the failed candidate',()=>{
 const baseline=JSON.parse(readFileSync('release/grub-everyday-baseline-20261017.json','utf8'));assertCapturedGrubRollback(baseline);const prior=baseline.previousGrubAttempt;
 const failed={...run,id:Number(prior.id),run_attempt:Number(prior.attempt),head_sha:prior.source,conclusion:'failure'};assertPreviousGrubFailure(failed,baseline);assert.throws(()=>assertPreviousGrubFailure({...failed,conclusion:'success'},baseline));
 for(const mutate of [b=>b.workers.core.deploymentId=next,b=>b.workers.core.versionId=next,b=>b.previousGrubAttempt.ownedReceipt.previousVersionId=next,b=>b.previousGrubAttempt.rollbackReceipt.errors.push('unresolved'),b=>b.previousGrubAttempt.conclusion='success']){const altered=structuredClone(baseline);mutate(altered);assert.throws(()=>assertCapturedGrubRollback(altered));}
});

test('Prepared age is checked again immediately before the actual traffic POST',()=>{
 const source=readFileSync('release/grub-uk-owned-release-20261017.mjs','utf8');assert(source.includes("assertPreparedWindow(j.preparedAt);\n  const deployment=await api(specs.core.script,'/deployments',{method:'POST'"));
});
