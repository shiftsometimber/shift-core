import test from 'node:test';
import assert from 'node:assert/strict';
import {LANE,PREDECESSORS,digest,latestDeployment,assertProvider,assertPrepared,assertOwned,assertStock,assertLane,settleOwnedCleanup} from '../release/gp-priority-direct-owned-release-20261016.mjs';
const id='11111111-1111-1111-1111-111111111111',other='22222222-2222-2222-2222-222222222222',deployment='33333333-3333-3333-3333-333333333333';
const bindings=[{name:'HQ_PARTNERS_ENABLED',type:'plain_text',text:'true'},{name:'DB',type:'d1',id:'original-db'},{name:'AUTH_SECRET',type:'secret_text'}];
const snapshot=()=>({deployment:{id:deployment,created_on:'2026-10-16T21:00:00Z',versions:[{version_id:id,percentage:100}]},version:{id,resources:{bindings:structuredClone(bindings),script:{etag:'opaque-provider-etag'},script_runtime:{compatibility_date:'2026-09-11',compatibility_flags:[]}}}});
test('latest provider deployment is chronological, single and 100%',()=>{const s=snapshot().deployment;assert.equal(latestDeployment([{...s,id:other,created_on:'2026-10-15T21:00:00Z'},s]).id,deployment);assert.throws(()=>latestDeployment([{...s,versions:[{version_id:id,percentage:99}]}]));assert.throws(()=>latestDeployment([{...s,versions:[{version_id:id,percentage:50},{version_id:other,percentage:50}]}]));});
test('provider preserves actual dormant GP and existing partner true',()=>{assert.equal(assertProvider(snapshot(),{deployment,version:id},{hq:true}).gpEnabled,false);});
for(const [label,mutate]of [
 ['moved deployment',s=>s.deployment.id=other],['wrong version',s=>s.version.id=other],
 ['GP active',s=>s.version.resources.bindings.push({name:'MEMBER_GP_DIRECTORY_V2_ENABLED',type:'plain_text',text:'true'})],
 ['opaque GP',s=>s.version.resources.bindings.push({name:'MEMBER_GP_DIRECTORY_V2_ENABLED',type:'secret_text'})],
 ['duplicate binding',s=>s.version.resources.bindings.push({...s.version.resources.bindings[0]})],
 ['partner disabled',s=>s.version.resources.bindings[0].text='false']
])test('provider rejects '+label,()=>{const s=snapshot();mutate(s);assert.throws(()=>assertProvider(s,{deployment,version:id},{hq:true}));});
const prepared=()=>({version:{...snapshot().version,id:other},bundle:{sha256:'a'.repeat(64),bytes:1234},local:{sha256:'a'.repeat(64),bytes:1234}});
test('prepared upload preserves complete bindings and whole compiled bytes',()=>{assertPrepared(prepared(),snapshot());const p=prepared();p.version.resources.bindings.reverse();assertPrepared(p,snapshot());});
for(const [label,mutate]of [
 ['binding changed',p=>p.version.resources.bindings[1].id='different-db'],['secret removed',p=>p.version.resources.bindings.pop()],
 ['runtime changed',p=>p.version.resources.script_runtime.compatibility_date='2026-09-12'],['bundle hash changed',p=>p.bundle.sha256='b'.repeat(64)],['bundle size changed',p=>p.bundle.bytes++]
])test('prepared upload rejects '+label,()=>{const p=prepared();mutate(p);assert.throws(()=>assertPrepared(p,snapshot()));});
test('owned rollback refuses another source, run, attempt or newer deployment',()=>{const s=snapshot(),r={source:'a'.repeat(40),run:'123',attempt:'1',deploymentId:deployment,versionId:id};assertOwned(s.deployment,r,r.source,'123','1');for(const [field,v]of [['source','b'.repeat(40)],['run','124'],['attempt','2'],['deploymentId',other],['versionId',other]])assert.throws(()=>assertOwned(s.deployment,{...r,[field]:v},r.source,'123','1'));});
test('protected stock compares complete rows and every config digest',()=>{const b={tables:{products:{rows:1,sha256:'a'}},configurationSha256:{core:'x',hq:'y'}};assertStock(b,structuredClone(b));for(const v of [{...b,tables:{products:{rows:1,sha256:'b'}}},{...b,configurationSha256:{core:'x',hq:'z'}}])assert.throws(()=>assertStock(b,v));});
test('actual dedicated push lane is distinct from main terminals',()=>{const r={id:123,run_attempt:1,head_sha:'a'.repeat(40),head_branch:LANE.branch,event:'push',path:LANE.workflow,repository:{full_name:LANE.repository}},c={sha:r.head_sha,runId:'123',attempt:'1'};assertLane(r,c);for(const [k,v]of [['head_branch','main'],['event','workflow_dispatch'],['path','.github/workflows/cloudflare-production-promote.yml'],['head_sha','b'.repeat(40)],['run_attempt',2]])assert.throws(()=>assertLane({...r,[k]:v},c));});
test('binding digest authenticates complete fields independent of object key order',()=>{assert.equal(digest({a:1,b:2}),digest({b:2,a:1}));assert.notEqual(digest(bindings),digest(bindings.slice(0,-1)));assert.notEqual(PREDECESSORS.core.source,LANE.main);assert.notEqual(PREDECESSORS.hq.source,PREDECESSORS.core.source);});
test('refusing a newer HQ deployment still attempts exact owned Core cleanup',async()=>{const calls=[];const rows=await settleOwnedCleanup(['hq','core'],async key=>{calls.push(key);if(key==='hq')throw Error('Newer deployment');return{key,action:'restore'};});assert.deepEqual(calls,['hq','core']);assert.equal(rows[0].action,'refused_or_failed');assert.equal(rows[1].action,'restore');});
test('missing actual provider runtime fields cannot pass an undefined comparison',()=>{const p=prepared();delete p.version.resources.script_runtime;assert.throws(()=>assertPrepared(p,snapshot()));});
