import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyReconciledReloadAttempt} from '../release/member-acceptance-scope.mjs';
import {RELOAD_RUN,RELOAD_VERIFIER} from '../release/approved-runtime-composition.mjs';
const fixture=()=>({
 run:{id:RELOAD_RUN,run_attempt:1,head_sha:RELOAD_VERIFIER,path:'.github/workflows/my-timber-final-production.yml',head_branch:'fix/member-reload-navigation-20261007',event:'push',status:'completed',conclusion:'success'},
 job:{id:113266037954,run_id:RELOAD_RUN,run_attempt:1,name:'reload-navigation-diagnostics',status:'completed',conclusion:'success',steps:[8,9,11,12,14,15].map(number=>({number,status:'completed',conclusion:'success'}))}
});
function reader(f,trace=[]){return async path=>{trace.push(path);if(path==='/actions/runs/'+RELOAD_RUN+'/attempts/1')return f.run;if(path==='/actions/runs/'+RELOAD_RUN+'/attempts/1/jobs?per_page=100')return {jobs:[f.job]};throw Error('Mutable or unexpected receipt endpoint');};}
test('exact historical attempt is read while the latest rerun may be pending or failed',async()=>{
 const f=fixture(),trace=[];const r=await verifyReconciledReloadAttempt(reader(f,trace));assert.equal(r.id,RELOAD_RUN);assert.equal(trace.length,2);assert(trace.every(p=>p.includes('/attempts/1')));
});
test('a later successful attempt cannot substitute for the original receipt',async()=>{
 for(const key of ['run','job']){const f=fixture();f[key].run_attempt=2;await assert.rejects(verifyReconciledReloadAttempt(reader(f)));}
});
test('wrong run, source, job, branch and failed or incomplete original receipts still reject',async()=>{
 for(const [target,key,value] of [['run','id',1],['run','head_sha','0'.repeat(40)],['run','head_branch','main'],['run','conclusion','failure'],['run','status','in_progress'],['job','id',2],['job','run_id',1],['job','conclusion','failure'],['job','status','in_progress']]){
  const f=fixture();f[target][key]=value;await assert.rejects(verifyReconciledReloadAttempt(reader(f)));
 }
});
test('every Passport and complete member round remains mandatory',async()=>{
 for(const n of [8,9,11,12,14,15]){const f=fixture();f.job.steps.find(s=>s.number===n).conclusion='failure';await assert.rejects(verifyReconciledReloadAttempt(reader(f)),/Every complete/);}
});
test('missing historical job and transport errors never fall back to latest',async()=>{
 const f=fixture();f.job.id=99;await assert.rejects(verifyReconciledReloadAttempt(reader(f)));await assert.rejects(verifyReconciledReloadAttempt(async()=>{throw Error('unavailable')}),/unavailable/);
});

import {verifyLogoutNavigationProof} from '../release/member-acceptance-scope.mjs';
import {LOGOUT_NAVIGATION_RUN,LOGOUT_NAVIGATION_SOURCE,LOGOUT_NAVIGATION_JOB} from '../release/approved-runtime-composition.mjs';
const logoutReceipt=()=>{
 const f=fixture();Object.assign(f.run,{id:LOGOUT_NAVIGATION_RUN,head_sha:LOGOUT_NAVIGATION_SOURCE});Object.assign(f.job,{id:LOGOUT_NAVIGATION_JOB,run_id:LOGOUT_NAVIGATION_RUN});return f;
};
function logoutReader(f,trace=[]){return async path=>{trace.push(path);if(path==='/actions/runs/'+LOGOUT_NAVIGATION_RUN+'/attempts/1')return f.run;if(path==='/actions/runs/'+LOGOUT_NAVIGATION_RUN+'/attempts/1/jobs?per_page=100')return{jobs:[f.job]};throw Error('Mutable logout receipt endpoint')}}
test('logout adoption requires the exact completed original attempt and all three full live rounds',async()=>{
 const f=logoutReceipt(),trace=[];const receipt=await verifyLogoutNavigationProof(logoutReader(f,trace));assert.equal(receipt.rounds,3);assert(trace.every(p=>p.includes('/attempts/1')));
 for(const n of [8,9,11,12,14,15]){const f=logoutReceipt();f.job.steps.find(s=>s.number===n).conclusion='failure';await assert.rejects(verifyLogoutNavigationProof(logoutReader(f)),/Every complete/);}
});
test('logout acceptance rejects a different source, job, attempt, status and missing evidence',async()=>{
 for(const [target,key,value]of [['run','head_sha',RELOAD_VERIFIER],['run','run_attempt',2],['run','conclusion','failure'],['run','status','in_progress'],['job','id',2],['job','run_attempt',2],['job','status','in_progress']]){const f=logoutReceipt();f[target][key]=value;await assert.rejects(verifyLogoutNavigationProof(logoutReader(f)));}
 await assert.rejects(verifyLogoutNavigationProof(async()=>{throw Error('unavailable')}),/unavailable/);
});
