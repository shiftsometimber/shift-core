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

import {ensureQueryRedaction} from '../release/query-log-redaction.mjs';
const settings={observability:{enabled:true,redact_query_string:false,logs:{enabled:true,head_sampling_rate:0.25,persist:true}},tags:['preserved']};
function privacyApi(initial=settings,{reject=false,ignorePatch=false,drift=false}={}){
 let current=structuredClone(initial);const calls=[];
 const fetcher=async(url,options)=>{calls.push({url,method:options.method,body:options.body});if(reject)return Response.json({success:false},{status:403});if(options.method==='PATCH'&&!ignorePatch){const body=JSON.parse(options.body);assert.deepEqual(Object.keys(body),['observability']);current.observability=body.observability;if(drift)current.tags=['unexpected'];}return Response.json({success:true,result:structuredClone(current)})};
 return {calls,fetcher};
}
const options=api=>({accountId:'a'.repeat(32),token:'test-only-credential',fetcher:api.fetcher});
test('deployment redaction repair preserves sampling, logging and unrelated settings',async()=>{
 const api=privacyApi(),r=await ensureQueryRedaction(options(api));assert.equal(r.queryRedactionEnabled,true);assert.equal(r.changed,true);assert.deepEqual(api.calls.map(x=>x.method),['GET','PATCH','GET']);const patch=JSON.parse(api.calls[1].body);assert.deepEqual(patch.observability,{...settings.observability,redact_query_string:true});assert(!JSON.stringify(r).includes('test-only-credential'));
});
test('already-redacted deployment verifies without rewriting settings',async()=>{
 const api=privacyApi({...settings,observability:{...settings.observability,redact_query_string:true}});assert.equal((await ensureQueryRedaction(options(api))).changed,false);assert.deepEqual(api.calls.map(x=>x.method),['GET','GET']);
});
test('redaction verification fails closed on denied access, ignored patch or unrelated drift',async()=>{
 for(const fault of [{reject:true},{ignorePatch:true},{drift:true}])await assert.rejects(ensureQueryRedaction(options(privacyApi(settings,fault))));
});
test('missing observability never causes a replacement of unknown settings',async()=>{
 const api=privacyApi({tags:['retained']});await assert.rejects(ensureQueryRedaction(options(api)),/Missing observability/);assert.deepEqual(api.calls.map(x=>x.method),['GET']);
});
