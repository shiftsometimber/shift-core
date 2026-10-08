import test from 'node:test';import assert from 'node:assert/strict';
import {SUPPORT_RUNTIME as p,assertSupportRuntimeIdentity,assertSupportRuntimeEvidence,assertSupportStartingPoint,verifySupportRuntime} from '../release/live-support-runtime.mjs';
const active=()=>({id:p.deployment,versions:[{version_id:p.version,percentage:100}]});
const version=()=>({id:p.version,number:p.number,metadata:{created_on:p.createdOn,source:'wrangler'},resources:{script:{etag:p.etag}}});
const verification=()=>({id:p.verificationVersion,metadata:{created_on:p.verificationAt,source:'wrangler'},resources:{script:{etag:p.etag}},annotations:{'workers/tag':p.verificationTag,'workers/message':p.verificationMessage}});
const module=()=>({module:p.module,bytes:p.bytes,sha256:p.sha256});
const proof=()=>assertSupportRuntimeEvidence(active(),version(),module(),verification());
const record=()=>({decision:'retain',from:p.version,to:p.version,run:null,verifiedRun:null,ownedProof:null,dataChanged:false,customerRecordsRead:0,ownerCapturedProof:proof()});
test('only exact serving deployment, canonical rebuilt bytes and independently matching verification upload can be retained',()=>assert.equal(proof().reconstruction,p.reconstruction));
test('changed deployment, split traffic, new version and reconstructed module bytes fail closed',()=>{
 for(const d of [{...active(),id:'unknown'},{...active(),versions:[{version_id:p.version,percentage:50}]},{...active(),versions:[{version_id:'new',percentage:100}]}])assert.throws(()=>assertSupportRuntimeIdentity(d));
 for(const m of [{...module(),bytes:0},{...module(),sha256:'changed'},{...module(),module:'unknown.js'}])assert.throws(()=>assertSupportRuntimeEvidence(active(),version(),m,verification()));
});
test('provider identity, date, source and immutable fingerprints must match both serving and verification versions',()=>{
 for(const key of ['id','number']){const v=version();v[key]='changed';assert.throws(()=>assertSupportRuntimeEvidence(active(),v,module(),verification()));}
 for(const field of ['created_on','source']){const v=version();v.metadata[field]='changed';assert.throws(()=>assertSupportRuntimeEvidence(active(),v,module(),verification()));}
 for(const target of ['serving','verification']){const v=version(),u=verification();(target==='serving'?v:u).resources.script.etag='changed';assert.throws(()=>assertSupportRuntimeEvidence(active(),v,module(),u));}
 for(const key of ['id','metadata','annotations']){const u=verification();u[key]='changed';assert.throws(()=>assertSupportRuntimeEvidence(active(),version(),module(),u));}
});
test('capture grants retain authority only and never substitutes for hosted production proof or restoration authority',()=>{
 assert.equal(assertSupportStartingPoint(record(),active()).run,null);
 for(const patch of [{decision:'restore'},{run:123},{verifiedRun:123},{ownedProof:{}},{dataChanged:true},{customerRecordsRead:1},{technicalRecovery:{}},{to:'different'},{ownerCapturedProof:{...proof(),sha256:'changed'}}])assert.throws(()=>assertSupportStartingPoint({...record(),...patch},active()));
});
test('provider read must succeed and every supplied rebuild is checked freshly',async()=>{
 const options={token:'synthetic-test-token',fetcher:async()=>({ok:true,json:async()=>({success:true,result:verification()})}),rebuild:module};
 assert.equal((await verifySupportRuntime(active(),version(),options)).version,p.version);
 await assert.rejects(()=>verifySupportRuntime(active(),version(),{...options,rebuild:()=>({...module(),sha256:'changed'})}));
 await assert.rejects(()=>verifySupportRuntime(active(),version(),{...options,fetcher:async()=>({ok:false})}));
 await assert.rejects(()=>verifySupportRuntime(active(),version(),{...options,token:''}));
});

import {readFileSync} from 'node:fs';
import {verifiedStartingPoint} from '../shift-coach/cancelled-release-recovery.mjs';
test('production adoption recognises the fully checked capture without looking up a fabricated hosted run',()=>{
 const point=verifiedStartingPoint(record(),active());assert.equal(point.kind,p.kind);assert.equal(point.run,null);
 const source=readFileSync(new URL('../release/growth-adopt-deployment.mjs',import.meta.url),'utf8');
 assert(source.includes('if(point.kind!==OWNER_RUNTIME.kind&&point.kind!==SUPPORT_RUNTIME.kind){'));
 assert(source.includes('point.kind===SUPPORT_RUNTIME.kind?verifySupportRuntime(active,version):verifyOwnerRuntime(active,version)'));
 assert(source.includes("assert.deepEqual(JSON.parse(readFileSync('b1-runtime-release/cancelled-release-recovery.json')).ownerCapturedProof,proof)"));
 assert(source.includes('Owner runtime moved during adoption'));
});

test('only the exact evidenced rollback deployment can retain the same captured bytes',()=>{
 const rollback={...active(),id:p.rollbackDeployment,created_on:p.rollbackCreatedOn,source:'wrangler',annotations:{'workers/message':p.rollbackMessage,'workers/triggered_by':'deployment'}};
 const captured=assertSupportRuntimeEvidence(rollback,version(),module(),verification());
 assert.equal(captured.deployment,p.rollbackDeployment);
 assert.equal(assertSupportStartingPoint({...record(),ownerCapturedProof:captured},rollback).deployment,p.rollbackDeployment);
 for(const patch of [{id:'another-rollback'},{created_on:'later'},{source:'api'},{annotations:{}}])assert.throws(()=>assertSupportRuntimeIdentity({...rollback,...patch}));
 assert.throws(()=>assertSupportStartingPoint(record(),rollback),'Old deployment receipt cannot stand in for rollback proof');
});

import {SUPPORT_ROLLBACK} from '../release/live-support-runtime.mjs';
test('the evidenced later owned rollback retains only captured bytes within its execution window',()=>{
 const rollback={...active(),id:SUPPORT_ROLLBACK.deployment,created_on:'2026-10-08T18:39:38.500000Z',source:'wrangler',annotations:{'workers/message':p.rollbackMessage,'workers/triggered_by':'deployment'}};
 const captured=assertSupportRuntimeEvidence(rollback,version(),module(),verification());
 assert.equal(captured.deployment,SUPPORT_ROLLBACK.deployment);
 assert.equal(assertSupportStartingPoint({...record(),ownerCapturedProof:captured},rollback).deployment,SUPPORT_ROLLBACK.deployment);
 for(const patch of [{id:'unknown'},{created_on:'invalid'},{created_on:'2026-10-08T18:39:35.000000Z'},{created_on:'2026-10-08T18:39:39.000000Z'},{source:'api'},{annotations:{}},{versions:[{version_id:p.version,percentage:50}]},{versions:[{version_id:'other',percentage:100}]}])assert.throws(()=>assertSupportRuntimeIdentity({...rollback,...patch}));
 assert.throws(()=>assertSupportStartingPoint(record(),rollback));
 assert.throws(()=>assertSupportRuntimeEvidence(rollback,version(),{...module(),sha256:'changed'},verification()));
});
