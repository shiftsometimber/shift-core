import test from 'node:test';
import assert from 'node:assert/strict';
import {latestDeployment,runtimeRollbackDecision} from '../release/runtime-rollback-guard.mjs';
const id=n=>String(n).padStart(8,'0')+'-0000-4000-8000-000000000000';
const deployment=(n,v,at)=>({id:id(n),created_on:at,versions:[{version_id:id(v),percentage:100}]});
const before=deployment(1,11,'2026-10-02T10:00:00Z'),owned=deployment(2,12,'2026-10-02T11:00:00Z'),newer=deployment(3,13,'2026-10-02T12:00:00Z');
const source='a'.repeat(40),run='123',receipt={kind:'owned_runtime_deployment',source,run,deploymentId:owned.id,versionId:id(12)};
const decide=(active,changes={})=>runtimeRollbackDecision({before,active,receipt,source,run,...changes});
test('restore is limited to the exact failed deployment and its own captured predecessor',()=>{assert.deepEqual(decide(owned),{action:'restore',versionId:id(11)});});
test('a newer deployment is preserved even when it reused the failed runtime version',()=>{
 assert.throws(()=>decide(newer),/Newer deployment/);
 assert.throws(()=>decide({...newer,versions:owned.versions}),/Newer deployment/);
});
test('already restored previous runtime needs no new rollback',()=>{assert.equal(decide({...newer,versions:before.versions}).action,'retain');});
test('missing receipt, another run/source, and mismatched version cannot authorise recovery',()=>{
 for(const replacement of [null,{...receipt,source:'b'.repeat(40)},{...receipt,run:'456'},{...receipt,versionId:id(13)}])assert.throws(()=>decide(owned,{receipt:replacement}));
});
test('deployment capture rejects splits, missing IDs and an empty inventory',()=>{
 assert.equal(latestDeployment([before,newer,owned]).id,newer.id);
 for(const list of [[],[{...owned,id:null}],[{...owned,versions:[{version_id:id(12),percentage:50}]}],[{...owned,versions:[...owned.versions,...owned.versions]}]])assert.throws(()=>latestDeployment(list));
});
