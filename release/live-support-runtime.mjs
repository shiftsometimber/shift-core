import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,cpSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// Retain this exact already-serving runtime. The reconstruction and verification
// upload are evidence only: neither is a production deployment or rollback grant.
export const SUPPORT_RUNTIME=Object.freeze({kind:'captured-serving-support-runtime-v1',
 deployment:'8c9fea69-2cca-4da2-9eba-a50dc0e0a72c',deploymentCreatedOn:'2026-10-08T21:20:19.542998Z',
 rollbackDeployment:null,rollbackEarliest:null,rollbackLatest:null,rollbackReceiptRun:null,
 rollbackMessage:'Owned release failed post-deployment checks; restore captured runtime and preserve current data',version:'a403001f-6170-4c81-8afe-e01d05a404df',number:3948,
 createdOn:'2026-10-08T21:20:16.113647Z',etag:'790904f0358557c2b8e2b62f728950310b2facb2abd463e82c942392707a75d5',
 reconstruction:'fa481b8193551cea1b8a7fe496ebc0cf70aa0a74',tree:'b3c38898f79fe658625d8a674dc90cc288638e85',
 module:'worker.js',bytes:13960814,sha256:'eefcc9eb762984093aac7c9988c1a3435e36e882591e74b88d059f6eaff5a658',
 verificationVersion:'1af5c7b8-13ad-4124-9f1c-48123020234c',verificationAt:'2026-10-08T21:48:07.147732Z',
 verificationTag:'seo-serving-capture-20261008',verificationMessage:'Verification-only canonical reconstruction of captured serving SEO runtime; no traffic deployment'});
const p=SUPPORT_RUNTIME;
export function assertSupportRuntimeIdentity(active){
 assert.equal(active?.id,p.deployment,'Unknown support runtime deployment');
 assert.equal(active.created_on,p.deploymentCreatedOn,'Captured deployment date drift');assert.equal(active.source,'wrangler');
 assert.deepEqual(active.annotations,{'workers/triggered_by':'deployment'});
 assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}],'Serving support runtime moved or split');
}
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