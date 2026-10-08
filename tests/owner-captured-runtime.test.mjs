import test from 'node:test';import assert from 'node:assert/strict';
import {OWNER_RUNTIME as p,assertOwnerRuntimeEvidence,assertOwnerStartingPoint,verifyOwnerRuntime} from '../release/owner-captured-runtime.mjs';
const active=()=>({id:p.deployments[2],versions:[{version_id:p.version,percentage:100}]});
const version=()=>({id:p.version,metadata:{created_on:p.createdOn,source:'wrangler'},resources:{script:{etag:p.etag}}});
const module=()=>({module:p.module,bytes:p.bytes,sha256:p.sha256});
const timeline=()=>[{id:p.version,number:3917,metadata:{created_on:p.createdOn}},{id:'later-upload',number:3918,metadata:{created_on:'2026-10-08T07:17:15.823831Z'}}];
const proof=()=>assertOwnerRuntimeEvidence(active(),version(),module(),timeline());
const record=()=>({decision:'retain',from:p.version,to:p.version,run:null,verifiedRun:null,ownedProof:null,customerRecordsRead:0,dataChanged:false,ownerCapturedProof:proof()});
test('exact captured version requires its immutable metadata, chronology and reconstructed bytes',()=>{assert.equal(proof().reconstruction,p.reconstruction);for(const id of p.deployments)assert.equal(assertOwnerRuntimeEvidence({...active(),id},version(),module(),timeline()).deployment,id);});
test('unknown, moved and split traffic is never adopted',()=>{for(const a of [{...active(),id:'unknown'},{...active(),versions:[]},{...active(),versions:[{version_id:p.version,percentage:99}]}])assert.throws(()=>assertOwnerRuntimeEvidence(a,version(),module(),timeline()));});
test('latest uploaded bytes or mismatched version metadata cannot stand in for serving code',()=>{for(const v of [{...version(),id:'newer'}, {...version(),resources:{script:{etag:'newer-upload'}}},{...version(),metadata:{created_on:p.createdOn,source:'unknown'}}])assert.throws(()=>assertOwnerRuntimeEvidence(active(),v,module(),timeline()));for(const m of [{...module(),bytes:p.bytes-1},{...module(),sha256:'a'.repeat(64)}])assert.throws(()=>assertOwnerRuntimeEvidence(active(),version(),m,timeline()));});
test('absent or contrary capture chronology fails closed',()=>{for(const t of [[],[{...timeline()[0],number:3918}],[...timeline(),{id:'other',metadata:{created_on:'2026-10-08T06:00:00Z'}}]])assert.throws(()=>assertOwnerRuntimeEvidence(active(),version(),module(),t));});
test('starting point never fabricates a deployment commit or successful CI run',()=>{const v=assertOwnerStartingPoint(record(),active());assert.equal(v.source,null);assert.equal(v.run,null);for(const patch of [{decision:'restore'},{run:1},{verifiedRun:1},{ownedProof:{run:1}},{dataChanged:true},{customerRecordsRead:1},{ownerCapturedProof:{...proof(),sha256:'a'.repeat(64)}}])assert.throws(()=>assertOwnerStartingPoint({...record(),...patch},active()));});
test('unknown identities reject before provider access or reconstruction',async()=>{let called=false;await assert.rejects(verifyOwnerRuntime({...active(),id:'unknown'},version(),{token:'test',fetcher:()=>{called=true;},rebuild:()=>{called=true;}}));assert.equal(called,false);});
test('provider failures never become captured proof',async()=>{await assert.rejects(verifyOwnerRuntime(active(),version(),{token:'test',fetcher:async()=>new Response('{}',{status:403}),rebuild:module}));});

import {RELOAD_RUN,RELOAD_VERIFIER,assertReconciledReloadReceipt} from '../release/approved-runtime-composition.mjs';
test('reload evidence rejects stale sources, partial rounds and unrelated successful jobs',()=>{
 const run={id:RELOAD_RUN,head_sha:RELOAD_VERIFIER,path:'.github/workflows/my-timber-final-production.yml',head_branch:'fix/member-reload-navigation-20261007',event:'push',status:'completed',conclusion:'success'};
 const job={id:113266037954,run_id:RELOAD_RUN,name:'reload-navigation-diagnostics',status:'completed',conclusion:'success',steps:[8,9,11,12,14,15].map(number=>({number,status:'completed',conclusion:'success'}))};
 assert.equal(assertReconciledReloadReceipt(run,job).id,RELOAD_RUN);
 for(const patch of [{id:37680334004},{head_sha:'a'.repeat(40)},{conclusion:'failure'},{status:'in_progress'},{head_branch:'main'}])assert.throws(()=>assertReconciledReloadReceipt({...run,...patch},job));
 for(const patch of [{id:1},{run_id:1},{conclusion:'failure'},{steps:job.steps.slice(0,5)}])assert.throws(()=>assertReconciledReloadReceipt(run,{...job,...patch}));
});
