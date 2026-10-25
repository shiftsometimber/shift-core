import {verifiedStartingPoint} from '../shift-coach/cancelled-release-recovery.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {FOUNDAYO_RUNTIME as p,assertFoundayoIdentity,foundayoServingProof,assertFoundayoProviderEvidence,assertFoundayoStartingPoint,verifyFoundayoRuntime} from '../release/foundayo-serving-baseline-20261025.mjs';
const active=()=>({id:p.deployment,versions:[{version_id:p.version,percentage:100}],created_on:p.deploymentCreatedOn,source:'wrangler',strategy:'percentage',annotations:{'workers/message':p.message,'workers/triggered_by':'deployment'}});
const version=()=>({id:p.version,metadata:{created_on:p.createdOn,source:'wrangler'},annotations:{'workers/tag':p.tag,'workers/message':p.message,'workers/triggered_by':'version_upload'},resources:{script:{etag:p.etag}}});
const modules=()=>[{module:p.module,bytes:p.bytes,sha256:p.sha256}];
const record=()=>({decision:'retain',from:p.version,to:p.version,run:null,verifiedRun:null,ownedProof:null,dataChanged:false,customerRecordsRead:0,ownerCapturedProof:foundayoServingProof()});
test('exact independently rebuilt owner baseline is retained without inventing successful CI',()=>{
 assert.deepEqual(assertFoundayoProviderEvidence(active(),version(),modules()),foundayoServingProof());
 const point=assertFoundayoStartingPoint(record(),active());
 assert.equal(point.source,p.source);assert.equal(point.run,null);assert.equal(point.kind,p.kind);
 assert.equal(foundayoServingProof().successfulCIPromotion,false);
});
test('unknown, moved and split runtime identities remain rejected',()=>{
 for(const mutate of [d=>d.id='unknown',d=>d.versions[0].version_id='unknown',d=>d.versions[0].percentage=99,d=>d.versions.push({version_id:'other',percentage:1}),d=>d.created_on='other',d=>d.annotations['workers/message']='other']){
  const d=active();mutate(d);assert.throws(()=>assertFoundayoIdentity(d));
 }
});
test('specific provider version, immutable etag and every module byte fingerprint are required',()=>{
 for(const mutate of [v=>v.id='other',v=>v.metadata.created_on='other',v=>v.metadata.source='api',v=>v.resources.script.etag='other',v=>v.annotations['workers/tag']='other']){
  const v=version();mutate(v);assert.throws(()=>assertFoundayoProviderEvidence(active(),v,modules()));
 }
 for(const mutate of [m=>m[0].module='other',m=>m[0].bytes++,m=>m[0].sha256='0'.repeat(64),m=>m.push(m[0])]){
  const m=modules();mutate(m);assert.throws(()=>assertFoundayoProviderEvidence(active(),version(),m));
 }
});
test('recovery record rejects restoration, private-data access, false CI receipts and substituted source',()=>{
 for(const patch of [{decision:'restore'},{run:1},{verifiedRun:1},{ownedProof:{}},{dataChanged:true},{customerRecordsRead:1},{to:'other'},{technicalRecovery:{}},{ownerCapturedProof:{...foundayoServingProof(),source:'0'.repeat(40)}}])
  assert.throws(()=>assertFoundayoStartingPoint({...record(),...patch},active()));
});
test('provider failure is read-only and cannot authorise the baseline',async()=>{
 let calls=0;
 await assert.rejects(verifyFoundayoRuntime(active(),version(),{token:'synthetic-not-a-credential',sourceCheck:()=>({source:p.source,tree:p.tree,base:p.base}),fetcher:async(url,options)=>{
  calls++;assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  assert(url.endsWith('/versions/'+p.version));return {ok:false};
 }}));assert.equal(calls,1);
});

test('original recovery handoff accepts only the exact authenticated owner proof',()=>{
 assert.deepEqual(verifiedStartingPoint(record(),active()),assertFoundayoStartingPoint(record(),active()));
 assert.throws(()=>verifiedStartingPoint({...record(),ownerCapturedProof:{...foundayoServingProof(),kind:'unknown'}},active()));
});
