import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {latestDeployment} from './runtime-rollback-guard.mjs';

// Evidence only. This module is deliberately not imported by the production
// ownership/recovery code and cannot upload, deploy, roll back or adopt a Worker.
export const SOURCE_SNAPSHOT = Object.freeze({
  commit: '98fd41248afed00bd35f37d60765a62fddd0c9d4',
  originalLocalCommit: '5f2515e0008f53bf2ceb82a44be03b257bcde9f8',
  tree: '5caaad9deab19a19292ccb8101dea5f90c19aa86',
  module: 'worker.js', bytes: 13971681,
  sha256: '7bc41301b96e31a8b2d6c51bc7b2ee5e8ee4af3e27ee145a65033e01031e8ada'
});
export const OBSERVED_RUNTIME = Object.freeze({
  deployment: '20ea6330-06d4-4901-a246-e6b8d795754f',
  deployedAt: '2026-10-09T08:18:42.639505Z',
  version: '94ff9122-2828-455b-8609-eb308cd2e3b0', number: 3980,
  createdAt: '2026-10-09T08:18:39.149861Z',
  etag: '1a916e249be6a646f620f037bb4e8604adb20a5fe5188fa7d164c55c59e5274f'
});
const fingerprint = bytes => ({module: 'worker.js', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')});
const latestVersion = list => {
  assert(Array.isArray(list) && list.length, 'Version inventory absent');
  assert(list.every(v => Number.isFinite(Date.parse(v.metadata?.created_on))), 'Invalid version chronology');
  return [...list].sort((a,b) => Date.parse(b.metadata.created_on)-Date.parse(a.metadata.created_on))[0];
};
const identity = deployment => ({id: deployment.id, versions: deployment.versions});
const cleanVersion = v => ({id:v.id, number:v.number, createdAt:v.metadata?.created_on,
  source:v.metadata?.source, etag:v.resources?.script?.etag,
  treatmentEnabled:v.resources?.bindings?.some(b=>b.name==='MY_TREATMENT_ENABLED' && b.text==='true') || false});

export function assessProvenance({before, after, activeVersion, latestBefore, latestAfter, uploadVersion, modules, reconstruction}) {
  const p=OBSERVED_RUNTIME, source=SOURCE_SNAPSHOT;
  const active=latestDeployment(before), final=latestDeployment(after);
  assert.deepEqual(identity(final), identity(active), 'Serving deployment moved during audit');
  assert.equal(active.id,p.deployment,'Unrecognised serving deployment; collect new evidence');
  assert.equal(active.created_on,p.deployedAt);
  assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}]);
  assert.equal(activeVersion.id,p.version); assert.equal(activeVersion.number,p.number);
  assert.equal(activeVersion.metadata?.created_on,p.createdAt);
  assert.equal(activeVersion.metadata?.source,'wrangler');
  assert.equal(activeVersion.resources?.script?.etag,p.etag,'Serving fingerprint changed');
  const first=latestVersion(latestBefore), last=latestVersion(latestAfter);
  assert.equal(last.id,first.id,'Latest upload moved while content was read');
  assert.equal(uploadVersion.id,first.id); assert.equal(uploadVersion.number,first.number);
  assert.equal(uploadVersion.metadata?.created_on,first.metadata.created_on);
  assert.match(uploadVersion.resources?.script?.etag || '',/^[a-f0-9]{64}$/);
  assert.equal(modules.length,1,'Unexpected Worker module inventory');
  assert.equal(modules[0].module,'worker.js');
  assert(Number.isSafeInteger(modules[0].bytes) && modules[0].bytes>0);
  assert.match(modules[0].sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(reconstruction,{module:source.module,bytes:source.bytes,sha256:source.sha256},'Source snapshot does not rebuild to the recorded receipt');
  // /content/v2 returns latest uploaded content. A different immutable code
  // fingerprint cannot establish the older active version's module bytes.
  const attributable=uploadVersion.resources.script.etag===activeVersion.resources.script.etag;
  const matches=attributable && JSON.stringify(modules[0])===JSON.stringify(reconstruction);
  return {kind:'paused_treatment_provenance_audit_v1',auditComplete:true,
    snapshot:source,active:{deployment:active.id,deployedAt:active.created_on,...cleanVersion(activeVersion)},
    latestUpload:cleanVersion(uploadVersion),latestUploadModules:modules,
    sourceRebuildMatchesLocalReceipt:true,contentAttributableToActive:attributable,
    independentLiveModuleMatch:attributable?matches:null,
    ownedGuardedDeploymentReceipt:null,ownershipEstablished:false,
    productionPauseRetained:true,productionActions:0,customerRecordsRead:0,
    blocker:matches?'A matched source fingerprint is evidence only; existing guarded ownership/recovery verification is still required.':
      attributable?'The attributed serving module differs from the preserved source.':
        'The content endpoint returned a newer upload with a different fingerprint; serving bytes remain independently unproved.'};
}

export function rebuildSnapshot() {
  const p=SOURCE_SNAPSHOT;
  const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
  assert.equal(git('rev-parse',p.commit+'^{tree}'),p.tree,'Snapshot tree differs from original local source');
  const dir=mkdtempSync(join(tmpdir(),'treatment-source-audit-'));let attached=false;
  try {
    execFileSync('git',['worktree','add','--detach',dir,p.commit],{stdio:'pipe'});attached=true;
    cpSync(realpathSync(resolve('node_modules')),join(dir,'node_modules'),{recursive:true,dereference:false});
    execFileSync(process.execPath,[join(dir,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config',join(dir,'wrangler.jsonc'),'--outdir',join(dir,'build')],{cwd:dir,stdio:'pipe',timeout:120000,maxBuffer:4*1024*1024});
    return fingerprint(readFileSync(join(dir,'build/worker.js')));
  } finally {
    if(attached)execFileSync('git',['worktree','remove','--force',dir],{stdio:'pipe'});
    rmSync(dir,{recursive:true,force:true});
  }
}

export async function collectProvenance({fetcher=fetch,rebuild=rebuildSnapshot,token=process.env.CLOUDFLARE_API_TOKEN}={}) {
  assert(typeof token==='string' && token.trim(),'Provider read access required');
  const base='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core';
  const get=async path=>{
    const r=await fetcher(base+path,{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
    assert(r.ok,'Provider read failed HTTP '+r.status); return r;
  };
  const json=async path=>{const d=await(await get(path)).json();assert.equal(d.success,true);return d.result;};
  const deployments=async()=>{const d=await json('/deployments');return Array.isArray(d)?d:d.deployments;};
  const before=await deployments(),active=latestDeployment(before);
  const activeVersion=await json('/versions/'+active.versions[0].version_id);
  const latestBefore=(await json('/versions?per_page=50')).items;
  const uploadVersion=await json('/versions/'+latestVersion(latestBefore).id);
  const form=await(await get('/content/v2')).formData(),modules=[];
  for(const [module,file] of form)if(typeof file!=='string') {
    const bytes=Buffer.from(await file.arrayBuffer());modules.push({...fingerprint(bytes),module});
  }
  const latestAfter=(await json('/versions?per_page=50')).items,after=await deployments();
  const reconstruction=rebuild();
  return assessProvenance({before,after,activeVersion,latestBefore,latestAfter,uploadVersion,modules,reconstruction});
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  mkdirSync('b1-runtime-release',{recursive:true});
  let report;
  try { report={at:new Date().toISOString(),verificationSource:process.env.GITHUB_SHA || null,...await collectProvenance()}; }
  catch(error) { report={kind:'paused_treatment_provenance_audit_v1',at:new Date().toISOString(),auditComplete:false,error:error.message,ownershipEstablished:false,productionPauseRetained:true,productionActions:0};process.exitCode=1; }
  writeFileSync('b1-runtime-release/treatment-provenance-audit.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}
