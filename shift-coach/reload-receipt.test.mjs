import test from 'node:test';import assert from 'node:assert/strict';
import {fetchOriginalReloadProof} from './reload-receipt.mjs';
const run={id:37763695261,head_sha:'8d84eb29eb74c3f156ce0ee815cc2d1c644be1e9',path:'.github/workflows/my-timber-final-production.yml',head_branch:'fix/member-reload-navigation-20261007',event:'push',status:'completed',conclusion:'success',run_attempt:1};
const job={id:113266037954,run_id:run.id,name:'reload-navigation-diagnostics',status:'completed',conclusion:'success',run_attempt:1,steps:[8,9,11,12,14,15].map(number=>({number,status:'completed',conclusion:'success'}))};
const get=(r=run,j=job)=>async path=>path.includes('/jobs?')?{jobs:[j]}:r;
test('only original attempt endpoints and the independently pinned job are used',async()=>{const calls=[];const receipt=await fetchOriginalReloadProof(async path=>{calls.push(path);return get()(path)});assert.deepEqual(calls,['/actions/runs/37763695261/attempts/1','/actions/runs/37763695261/attempts/1/jobs?per_page=100']);assert.equal(receipt.attempt,1);});
test('changed attempts, source, job, workflow and failed original proof are rejected',async()=>{
 for(const patch of [{run_attempt:2},{conclusion:'failure'},{head_sha:'a'.repeat(40)},{path:'other'},{event:'workflow_dispatch'}])await assert.rejects(()=>fetchOriginalReloadProof(get({...run,...patch})));
 for(const patch of [{run_attempt:2},{conclusion:'failure'},{id:113543764401},{steps:job.steps.slice(1)}])await assert.rejects(()=>fetchOriginalReloadProof(get(run,{...job,...patch})));
 await assert.rejects(()=>fetchOriginalReloadProof(async path=>path.includes('/jobs?')?{jobs:[job,job]}:run));
});