import assert from 'node:assert/strict';
import {createGithubProofGet} from './github-proof-get.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,cpSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// Retain this exact already-serving runtime. The reconstruction and verification
// upload are evidence only: neither is a production deployment or rollback grant.
export const SUPPORT_RUNTIME=Object.freeze({kind:'captured-serving-support-runtime-v1',
 deployment:'8c9fea69-2cca-4da2-9eba-a50dc0e0a72c',deploymentCreatedOn:'2026-10-08T21:20:19.542998Z',
 rollbackDeployment:'b5041b69-d523-45b0-83a2-d5bd0ed36033',rollbackCreatedOn:'2026-10-08T23:56:20.746965Z',rollbackEarliest:'2026-10-08T23:56:18Z',rollbackLatest:'2026-10-08T23:56:22Z',rollbackReceiptRun:37860725562,rollbackReceiptJob:113595632550,rollbackReceiptSource:'5f046576b17ecf5fad5aa5be6d6eab1699f38e86',
 rollbackMessage:'Owned release failed post-deployment checks; restore captured runtime and preserve current data',version:'a403001f-6170-4c81-8afe-e01d05a404df',number:3948,
 createdOn:'2026-10-08T21:20:16.113647Z',etag:'790904f0358557c2b8e2b62f728950310b2facb2abd463e82c942392707a75d5',
 reconstruction:'fa481b8193551cea1b8a7fe496ebc0cf70aa0a74',tree:'b3c38898f79fe658625d8a674dc90cc288638e85',
 module:'worker.js',bytes:13960814,sha256:'eefcc9eb762984093aac7c9988c1a3435e36e882591e74b88d059f6eaff5a658',
 verificationVersion:'1af5c7b8-13ad-4124-9f1c-48123020234c',verificationAt:'2026-10-08T21:48:07.147732Z',
 verificationTag:'seo-serving-capture-20261008',verificationMessage:'Verification-only canonical reconstruction of captured serving SEO runtime; no traffic deployment'});
const p=SUPPORT_RUNTIME;
export function assertSupportRuntimeIdentity(active){
 const rollback=active?.id===p.rollbackDeployment;
 assert(rollback||active?.id===p.deployment,'Unknown support runtime deployment');
 assert.equal(active.created_on,rollback?p.rollbackCreatedOn:p.deploymentCreatedOn,'Captured deployment date drift');assert.equal(active.source,'wrangler');
 assert.deepEqual(active.annotations,rollback?{'workers/message':p.rollbackMessage,'workers/triggered_by':'deployment'}:{'workers/triggered_by':'deployment'});
 assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}],'Serving support runtime moved or split');
}
export function assertSupportRollbackReceipt(run,job){
 assert.equal(run?.id,p.rollbackReceiptRun);assert.equal(run.run_attempt,1);assert.equal(run.head_sha,p.rollbackReceiptSource);assert.equal(run.head_branch,'main');assert.equal(run.event,'push');assert.equal(run.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(run.status,'completed');assert.equal(run.conclusion,'failure');
 assert.equal(job?.id,p.rollbackReceiptJob);assert.equal(job.run_id,p.rollbackReceiptRun);assert.equal(job.run_attempt,1);assert.equal(job.head_sha,p.rollbackReceiptSource);assert.equal(job.name,'promote');assert.equal(job.status,'completed');assert.equal(job.conclusion,'failure');
 for(const [number,name] of [[10,'Recover only the evidenced cancelled runtime to the last verified release'],[50,'Capture current Worker deployment for rollback'],[60,'Deploy current main to production'],[108,'Restore the captured runtime if a post-deployment gate failed'],[109,'Verify query-string log redaction after deployment or rollback']]){
  const step=job.steps?.find(s=>s.number===number);assert.equal(step?.name,name);assert.equal(step?.status,'completed');assert.equal(step?.conclusion,'success');
 }
 const failed=job.steps.filter(s=>s.conclusion==='failure');assert.equal(failed.length,1);assert.equal(failed[0].number,87);assert.equal(failed[0].name,'Prove exact member scripts and authentication on live traffic');
 const restore=job.steps.find(s=>s.number===108);assert.equal(restore.started_at,p.rollbackEarliest);assert.equal(restore.completed_at,p.rollbackLatest);assert(Date.parse(failed[0].completed_at)<=Date.parse(restore.started_at));assert(Date.parse(p.rollbackCreatedOn)>=Date.parse(restore.started_at)&&Date.parse(p.rollbackCreatedOn)<=Date.parse(restore.completed_at));
 return {run:p.rollbackReceiptRun,attempt:1,job:p.rollbackReceiptJob,source:p.rollbackReceiptSource,decision:'retain'};
}
export function assertSupportRuntimeEvidence(active,version,module,verification){
 assertSupportRuntimeIdentity(active);
 assert.equal(version?.id,p.version);assert.equal(version.number,p.number);assert.equal(version.metadata?.created_on,p.createdOn);assert.equal(version.metadata?.source,'wrangler');assert.equal(version.resources?.script?.etag,p.etag);
 assert.equal(verification?.id,p.verificationVersion);assert.equal(verification.metadata?.created_on,p.verificationAt);assert.equal(verification.metadata?.source,'wrangler');assert.equal(verification.resources?.script?.etag,p.etag,'Independent reconstructed upload must match the serving fingerprint');assert.equal(verification.annotations?.['workers/tag'],p.verificationTag);assert.equal(verification.annotations?.['workers/message'],p.verificationMessage);
 assert.deepEqual(module,{module:p.module,bytes:p.bytes,sha256:p.sha256},'Fresh canonical reconstruction differs from independently matched serving code');
 return {kind:p.kind,deployment:active.id,version:p.version,reconstruction:p.reconstruction,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,verificationVersion:p.verificationVersion,...(active.id===p.rollbackDeployment?{rollbackReceiptRun:p.rollbackReceiptRun}: {})};
}
export function assertSupportStartingPoint(record,active){
 assertSupportRuntimeIdentity(active);assert.equal(record?.decision,'retain');assert.equal(record.from,p.version);assert.equal(record.to,p.version);
 for(const name of ['run','verifiedRun','ownedProof'])assert.equal(record[name],null,'Captured support runtime is not a hosted production release');
 assert.equal(record.dataChanged,false);assert.equal(record.customerRecordsRead,0);assert.equal(record.technicalRecovery,undefined);
 assert.deepEqual(record.ownerCapturedProof,{kind:p.kind,deployment:active.id,version:p.version,reconstruction:p.reconstruction,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,verificationVersion:p.verificationVersion,...(active.id===p.rollbackDeployment?{rollbackReceiptRun:p.rollbackReceiptRun}: {})});
 return {kind:p.kind,source:null,run:null,version:p.version,reconstruction:p.reconstruction,deployment:active.id};
}
export function rebuildSupportRuntime(){
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();git('merge-base','--is-ancestor',p.reconstruction,'HEAD');assert.equal(git('rev-parse',p.reconstruction+'^{tree}'),p.tree);
 const dir=mkdtempSync(join(tmpdir(),'shift-support-reconstruction-'));let attached=false;
 try{
  execFileSync('git',['worktree','add','--detach',dir,p.reconstruction],{stdio:'pipe',timeout:120000,maxBuffer:4*1024*1024});attached=true;
  cpSync(realpathSync(resolve('node_modules')),join(dir,'node_modules'),{recursive:true,dereference:false});
  execFileSync(process.execPath,[join(dir,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config',join(dir,'wrangler.jsonc'),'--outdir',join(dir,'build')],{cwd:dir,stdio:'pipe',timeout:120000,maxBuffer:4*1024*1024});
  const b=readFileSync(join(dir,'build/worker.js'));return {module:p.module,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};
 }finally{try{if(attached)execFileSync('git',['worktree','remove','--force',dir],{stdio:'pipe'});}finally{rmSync(dir,{recursive:true,force:true});}}
}
export async function verifySupportRuntime(active,version,{token=process.env.CLOUDFLARE_API_TOKEN,fetcher=fetch,rebuild=rebuildSupportRuntime,githubGet=createGithubProofGet({fetcher})}={}){
 assertSupportRuntimeIdentity(active);assert(typeof token==='string'&&token.trim(),'Provider read access required');
 if(active.id===p.rollbackDeployment){
  const run=await githubGet('/actions/runs/'+p.rollbackReceiptRun+'/attempts/1');
  const jobs=await githubGet('/actions/runs/'+p.rollbackReceiptRun+'/attempts/1/jobs?per_page=100');
  assertSupportRollbackReceipt(run,jobs.jobs?.find(j=>j.id===p.rollbackReceiptJob));
 }
 const r=await fetcher('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core/versions/'+p.verificationVersion,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 assert(r.ok,'Exact immutable verification version unavailable');const d=await r.json();assert.equal(d.success,true);
 return assertSupportRuntimeEvidence(active,version,rebuild(),d.result);
}