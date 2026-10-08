import test from 'node:test';import assert from 'node:assert/strict';
import {SUPPORT_RUNTIME as p,assertSupportRuntimeIdentity,assertSupportRuntimeEvidence,assertSupportStartingPoint,verifySupportRuntime,assertSupportRollbackReceipt} from '../release/live-support-runtime.mjs';
const active=()=>({id:p.deployment,created_on:p.deploymentCreatedOn,source:'wrangler',annotations:{'workers/triggered_by':'deployment'},versions:[{version_id:p.version,percentage:100}]});
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

test('capture recognises only its exact serving identity and evidenced restoration without replacement authority',()=>{
 assert.equal(p.rollbackReceiptRun,37860725562);assert.equal(p.rollbackDeployment,'b5041b69-d523-45b0-83a2-d5bd0ed36033');
 for(const id of ['3e9176eb-468d-42d6-b97a-7c8c1113ffcc','2f65a40d-9bfd-4d23-ae21-27f41661eabc','unknown'])assert.throws(()=>assertSupportRuntimeIdentity({...active(),id}));
 for(const patch of [{created_on:'later'},{source:'api'},{annotations:{}}])assert.throws(()=>assertSupportRuntimeIdentity({...active(),...patch}));
});
const restored=()=>({...active(),id:p.rollbackDeployment,created_on:p.rollbackCreatedOn,annotations:{'workers/message':p.rollbackMessage,'workers/triggered_by':'deployment'}});
const rollbackRun=()=>({id:p.rollbackReceiptRun,run_attempt:1,head_sha:p.rollbackReceiptSource,head_branch:'main',event:'push',path:'.github/workflows/cloudflare-production-promote.yml',status:'completed',conclusion:'failure'});
const rollbackJob=()=>({id:p.rollbackReceiptJob,run_id:p.rollbackReceiptRun,run_attempt:1,head_sha:p.rollbackReceiptSource,name:'promote',status:'completed',conclusion:'failure',steps:[
 ...[[10,'Recover only the evidenced cancelled runtime to the last verified release'],[50,'Capture current Worker deployment for rollback'],[60,'Deploy current main to production'],[109,'Verify query-string log redaction after deployment or rollback']].map(([number,name])=>({number,name,status:'completed',conclusion:'success'})),
 {number:87,name:'Prove exact member scripts and authentication on live traffic',status:'completed',conclusion:'failure',completed_at:'2026-10-08T23:56:17Z'},
 {number:108,name:'Restore the captured runtime if a post-deployment gate failed',status:'completed',conclusion:'success',started_at:p.rollbackEarliest,completed_at:p.rollbackLatest}
]});
test('exact rollback identity and immutable failed-attempt evidence retain the original captured source only',()=>{
 assert.doesNotThrow(()=>assertSupportRuntimeIdentity(restored()));
 assert.equal(assertSupportRollbackReceipt(rollbackRun(),rollbackJob()).decision,'retain');
 const value=assertSupportRuntimeEvidence(restored(),version(),module(),verification());
 assert.equal(value.rollbackReceiptRun,p.rollbackReceiptRun);
 assert.equal(assertSupportStartingPoint({...record(),ownerCapturedProof:value},restored()).run,null);
 for(const patch of [{created_on:'later'},{source:'api'},{annotations:{'workers/triggered_by':'deployment'}},{versions:[{version_id:'unknown',percentage:100}]}])assert.throws(()=>assertSupportRuntimeIdentity({...restored(),...patch}));
});
test('changed rollback run, source, attempt, failed gate or restoration step rejects the receipt',()=>{
 for(const patch of [{id:1},{run_attempt:2},{head_sha:'unknown'},{conclusion:'success'},{event:'workflow_dispatch'},{head_branch:'unknown'}])assert.throws(()=>assertSupportRollbackReceipt({...rollbackRun(),...patch},rollbackJob()));
 for(const patch of [{id:1},{run_attempt:2},{head_sha:'unknown'},{conclusion:'success'}])assert.throws(()=>assertSupportRollbackReceipt(rollbackRun(),{...rollbackJob(),...patch}));
 for(const number of [10,50,60,87,108,109]){const j=rollbackJob();j.steps=j.steps.filter(s=>s.number!==number);assert.throws(()=>assertSupportRollbackReceipt(rollbackRun(),j));}
 for(const patch of [{conclusion:'failure'},{started_at:'later'},{completed_at:'later'}]){const j=rollbackJob();Object.assign(j.steps.find(s=>s.number===108),patch);assert.throws(()=>assertSupportRollbackReceipt(rollbackRun(),j));}
});
test('rollback verification retrieves the exact original attempt and requires its proof before fresh rebuild',async()=>{
 const paths=[],options={token:'synthetic-test-token',fetcher:async()=>({ok:true,json:async()=>({success:true,result:verification()})}),rebuild:module,githubGet:async path=>{paths.push(path);return path.includes('/jobs?')?{jobs:[rollbackJob()]}:rollbackRun();}};
 assert.equal((await verifySupportRuntime(restored(),version(),options)).rollbackReceiptRun,p.rollbackReceiptRun);
 assert.deepEqual(paths,['/actions/runs/37860725562/attempts/1','/actions/runs/37860725562/attempts/1/jobs?per_page=100']);
 await assert.rejects(()=>verifySupportRuntime(restored(),version(),{...options,githubGet:async path=>path.includes('/jobs?')?{jobs:[]}:rollbackRun()}));
});