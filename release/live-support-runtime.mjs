import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,cpSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// Retain this exact already-serving runtime. The reconstruction and verification
// upload are evidence only: neither is a production deployment or rollback grant.
export const SUPPORT_RUNTIME=Object.freeze({kind:'captured-serving-support-runtime-v1',
 deployment:'8fa068ce-8f6f-4a3d-bee7-87cf8dad6d12',
 rollbackDeployment:'a31ccb67-da1e-4300-853f-b0d94c234e9d',rollbackCreatedOn:'2026-10-08T17:36:17.889038Z',
 rollbackMessage:'Owned release failed post-deployment checks; restore captured runtime and preserve current data',version:'7b67b3f0-4ec0-41b0-8067-f41dc32ce368',number:3926,
 createdOn:'2026-10-08T14:10:27.976802Z',etag:'101ee4138e7ceea8740edceb5cf69297e348588b6f65d847184f7bf9b9301f26',
 reconstruction:'e7c78344694a0101a8105004356b96d3a2066197',tree:'2f2c2ca801b4773d4bab3b7330cba5e7ca33a48a',
 module:'worker.js',bytes:13957875,sha256:'cfc21a281782dc185e30723df53bb5c7e917332996feacfcd6916b0bc430f082',
 verificationVersion:'ffd402a6-0bdb-4c72-ae85-a697581b2887',verificationAt:'2026-10-08T16:54:00.117465Z',
 verificationTag:'seo-support-baseline-20261008',verificationMessage:'Verification-only reconstruction of serving continuity runtime; no traffic deployment'});
const p=SUPPORT_RUNTIME;
export function assertSupportRuntimeIdentity(active){if(active?.id!==p.deployment){assert.equal(active?.id,p.rollbackDeployment,'Unknown support runtime deployment');assert.equal(active.created_on,p.rollbackCreatedOn);assert.equal(active.source,'wrangler');assert.deepEqual(active.annotations,{'workers/message':p.rollbackMessage,'workers/triggered_by':'deployment'});}assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}],'Serving support runtime moved or split');}
export function assertSupportRuntimeEvidence(active,version,module,verification){
 assertSupportRuntimeIdentity(active);
 assert.equal(version?.id,p.version);assert.equal(version.number,p.number);assert.equal(version.metadata?.created_on,p.createdOn);assert.equal(version.metadata?.source,'wrangler');assert.equal(version.resources?.script?.etag,p.etag);
 assert.equal(verification?.id,p.verificationVersion);assert.equal(verification.metadata?.created_on,p.verificationAt);assert.equal(verification.metadata?.source,'wrangler');assert.equal(verification.resources?.script?.etag,p.etag,'Independent reconstructed upload must match the serving fingerprint');assert.equal(verification.annotations?.['workers/tag'],p.verificationTag);assert.equal(verification.annotations?.['workers/message'],p.verificationMessage);
 assert.deepEqual(module,{module:p.module,bytes:p.bytes,sha256:p.sha256},'Fresh canonical reconstruction differs from independently matched serving code');
 return {kind:p.kind,deployment:active.id,version:p.version,reconstruction:p.reconstruction,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,verificationVersion:p.verificationVersion};
}
export function assertSupportStartingPoint(record,active){
 assertSupportRuntimeIdentity(active);assert.equal(record?.decision,'retain');assert.equal(record.from,p.version);assert.equal(record.to,p.version);
 for(const name of ['run','verifiedRun','ownedProof'])assert.equal(record[name],null,'Captured support runtime is not a hosted production release');
 assert.equal(record.dataChanged,false);assert.equal(record.customerRecordsRead,0);assert.equal(record.technicalRecovery,undefined);
 assert.deepEqual(record.ownerCapturedProof,{kind:p.kind,deployment:active.id,version:p.version,reconstruction:p.reconstruction,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,verificationVersion:p.verificationVersion});
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
export async function verifySupportRuntime(active,version,{token=process.env.CLOUDFLARE_API_TOKEN,fetcher=fetch,rebuild=rebuildSupportRuntime}={}){
 assertSupportRuntimeIdentity(active);assert(typeof token==='string'&&token.trim(),'Provider read access required');
 const r=await fetcher('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core/versions/'+p.verificationVersion,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 assert(r.ok,'Exact immutable verification version unavailable');const d=await r.json();assert.equal(d.success,true);
 return assertSupportRuntimeEvidence(active,version,rebuild(),d.result);
}
