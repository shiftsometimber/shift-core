import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,cpSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// This is a reconstruction of a captured owner-authorised local runtime.
// Neither its reconstruction commit nor the successful browser run is a deployment.
export const OWNER_RUNTIME=Object.freeze({
 kind:'owner-authorised-captured-runtime-v1',
 version:'27bc1a6d-1752-45f8-aee2-975af367da75',
 etag:'0ae93468c7d2c247cd09fb2849441e4ec141cc85c77afb038c12e45e47e34691',
 createdOn:'2026-10-07T20:48:06.905796Z',
 captureAt:'2026-10-08T06:16:59.877Z',
 reconstruction:'052865c6f9171ad3a8e67b844a9161ae1b08cf16',
 tree:'d6abb8ef360a8da399ba368cb2526eb0b4411fcf',
 module:'worker.js',bytes:13957396,
 sha256:'bfe67f9a1a77a32e41725a4962a3b21fe6ea6c2c7f94589ce3e421151910cad4',
 deployments:['57da22e7-3858-4022-8aa4-3634169e862b','6bea6f33-0f5d-4598-9e70-8793ad59a30e','282ce2f2-a69e-44c2-a5cd-6406e63f3a17']
});
const p=OWNER_RUNTIME;
export function assertOwnerRuntimeIdentity(active){
 assert(p.deployments.includes(active?.id),'Unknown owner runtime deployment');
 assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}],'Owner runtime moved or split');
}
export function assertOwnerRuntimeEvidence(active,version,module,timeline){
 assertOwnerRuntimeIdentity(active);
 assert.equal(version?.id,p.version);
 assert.equal(version.metadata?.created_on,p.createdOn);
 assert.equal(version.metadata?.source,'wrangler');
 assert.equal(version.resources?.script?.etag,p.etag,'Immutable owner version fingerprint changed');
 assert.deepEqual(module,{module:p.module,bytes:p.bytes,sha256:p.sha256},'Fresh reconstruction differs from captured serving module');
 // The content endpoint returns latest upload despite its version query.
 // At capture time this immutable version was the latest upload; verify that
 // chronology rather than attributing today's latest content to serving traffic.
 const before=timeline.filter(x=>x.metadata?.created_on<=p.captureAt).sort((a,b)=>b.metadata.created_on.localeCompare(a.metadata.created_on));
 assert.equal(before[0]?.id,p.version,'Capture attribution is not evidenced by provider history');
 assert.equal(before[0]?.number,3917);
 return {kind:p.kind,deployment:active.id,version:p.version,reconstruction:p.reconstruction,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,captureAt:p.captureAt};
}
export function assertOwnerStartingPoint(record,active){
 assertOwnerRuntimeIdentity(active);
 assert.equal(record?.decision,'retain');assert.equal(record.from,p.version);assert.equal(record.to,p.version);
 for(const name of ['run','verifiedRun','ownedProof'])assert.equal(record[name],null,'Captured runtime is not a CI deployment');
 assert.equal(record.dataChanged,false);assert.equal(record.customerRecordsRead,0);assert.equal(record.technicalRecovery,undefined,'Conflicting recovery evidence');
 const expected={kind:p.kind,deployment:active.id,version:p.version,reconstruction:p.reconstruction,tree:p.tree,module:p.module,bytes:p.bytes,sha256:p.sha256,etag:p.etag,captureAt:p.captureAt};
 assert.deepEqual(record.ownerCapturedProof,expected);
 return {kind:p.kind,source:null,run:null,version:p.version,reconstruction:p.reconstruction,deployment:active.id};
}
export function rebuildOwnerRuntime(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',p.reconstruction,'HEAD');
 assert.equal(git('rev-parse',p.reconstruction+'^{tree}'),p.tree);
 const dir=mkdtempSync(join(tmpdir(),'shift-captured-runtime-'));let attached=false;
 try{
  execFileSync('git',['worktree','add','--detach',dir,p.reconstruction],{stdio:'pipe',timeout:120000,maxBuffer:4*1024*1024});attached=true;
  // Physical dependency paths are required for identical unminified module bytes.
  cpSync(realpathSync(resolve('node_modules')),join(dir,'node_modules'),{recursive:true,dereference:false});
  execFileSync(process.execPath,[join(dir,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config',join(dir,'wrangler.jsonc'),'--outdir',join(dir,'build')],{cwd:dir,stdio:'pipe',timeout:120000,maxBuffer:4*1024*1024});
  const bytes=readFileSync(join(dir,'build/worker.js'));
  return {module:p.module,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 }finally{try{if(attached)execFileSync('git',['worktree','remove','--force',dir],{stdio:'pipe'});}finally{rmSync(dir,{recursive:true,force:true});}}
}
export async function verifyOwnerRuntime(active,version,{token=process.env.CLOUDFLARE_API_TOKEN,fetcher=fetch,rebuild=rebuildOwnerRuntime}={}){
 assertOwnerRuntimeIdentity(active);assert(typeof token==='string'&&token.trim(),'Provider read access required');
 const r=await fetcher('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core/versions?per_page=50',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 assert(r.ok,'Provider version history unavailable');
 const json=await r.json();assert.equal(json.success,true);assert(Array.isArray(json.result?.items));
 return assertOwnerRuntimeEvidence(active,version,rebuild(),json.result.items);
}
