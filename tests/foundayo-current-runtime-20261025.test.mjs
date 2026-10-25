import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from './fixtures/foundayo-version-public-metadata-20261025.json' with {type:'json'};
import {FOUNDAYO_RUNTIME as p,assertFoundayoIdentity,assertFoundayoEvidence,foundayoStartingPoint,assertSameFoundayoWindow} from '../release/foundayo-current-runtime-20261025.mjs';
const active=()=>({id:p.deployment,versions:[{version_id:p.version,percentage:100}]});
const module=()=>({name:p.module,bytes:p.bytes,sha256:p.sha256});
const good=()=>assertFoundayoEvidence(active(),structuredClone(fixture),module());
const proof=()=>({identity:good(),checkedAt:'2026-10-25T04:45:00Z',release:'9540d180ca4fbed47d96fd9279d901facba77fb5',releaseStockWindow:{beforeSHA256:'a'.repeat(64),beforeAt:'2026-10-25T04:44:00Z',tables:{retained:'actual source snapshots are independently checked by the window reader'},configurationSHA256:'b'.repeat(64)},productionWrites:0,dataRestored:false,customerRecordsRead:0});
test('exact owner-authorised serving bytes and original public metadata are accepted without inventing a hosted deployment',()=>{
 const x=good();assert.equal(x.manualOwnerRelease,true);assert.equal(x.hostedDeploymentClaimed,false);assert.equal(x.source,p.source);
 const point=foundayoStartingPoint(proof(),active());assert.equal(point.run,null);assert.equal(point.source,null);assert.equal(point.reconstruction,p.source);
});
for(const [name,mutate] of [
 ['unknown deployment',x=>x.id='00000000-0000-0000-0000-000000000000'],
 ['unknown version',x=>x.versions[0].version_id='00000000-0000-0000-0000-000000000000'],
 ['split traffic',x=>x.versions[0].percentage=99],
 ['extra version',x=>x.versions.push({version_id:p.version,percentage:0})]
])test('reject '+name,()=>{const a=active();mutate(a);assert.throws(()=>assertFoundayoIdentity(a));});
for(const [name,mutate] of [
 ['version identity',x=>x.id='unknown'],
 ['version creation',x=>x.metadata.created_on='2026-10-19T00:00:00Z'],
 ['provider source',x=>x.metadata.source='api'],
 ['immutable ETag',x=>x.resources.script.etag='0'.repeat(64)],
 ['source annotation',x=>x.annotations['workers/message']='unrelated upload'],
 ['missing binding',x=>x.resources.bindings.pop()],
 ['changed binding',x=>x.resources.bindings.find(b=>b.name==='STRIPE_MODE').text='live']
])test('reject altered '+name,()=>{const v=structuredClone(fixture);mutate(v);assert.throws(()=>assertFoundayoEvidence(active(),v,module()));});
for(const [name,mutate] of [
 ['module name',x=>x.name='other.js'],
 ['module byte count',x=>x.bytes--],
 ['latest-upload or any other code',x=>x.sha256='8f9fae25c327bd90f5022364ee4054c8d8bc567901c0dc9e522d6a41fc6e33a4']
])test('reject '+name,()=>{const m=module();mutate(m);assert.throws(()=>assertFoundayoEvidence(active(),fixture,m));});
for(const [name,mutate] of [
 ['mutation claim',x=>x.productionWrites=1],
 ['data rollback claim',x=>x.dataRestored=true],
 ['private-data read claim',x=>x.customerRecordsRead=1],
 ['forged identity',x=>x.identity.source='0'.repeat(40)]
])test('reject '+name,()=>{const x=proof();mutate(x);assert.throws(()=>foundayoStartingPoint(x,active()));});
test('adoption must preserve the exact original recovery window',()=>{
 const a=proof(),b=structuredClone(a);b.checkedAt='2026-10-25T04:46:00Z';assertSameFoundayoWindow(a,b);
 b.releaseStockWindow.beforeSHA256='c'.repeat(64);assert.throws(()=>assertSameFoundayoWindow(a,b));
});
test('adoption cannot claim earlier verification',()=>{
 const a=proof(),b=structuredClone(a);b.checkedAt='2026-10-25T04:44:00Z';assert.throws(()=>assertSameFoundayoWindow(a,b));
});
