import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { prepareKnowledgePackage, verifyKnowledgePackage, hash } from './patch.mjs';
import { captureLive, verifyLive, verifyRestored } from './live.mjs';
import { assetHash, verifyPreservedAssets } from '../../knowledge-health/release-assets.mjs';
import { routeOwner } from '../../knowledge-health/release-helpers.mjs';
import { latestDeployment, runtimeRollbackDecision } from '../runtime-rollback-guard.mjs';

const repository = 'shiftsometimber/shift-core';
const main = '854a520dc71fa4d0df803e98f88e64adc37b0cce';
const source = '552f42029d47f007f4cef8a089fa3a473450b74f';
const candidateRef = 'refs/heads/fix/babylove-legacy-knowledge-cards-20261107';
const releaseRef = 'refs/heads/release/knowledge-cards-preflight-20261107';
const originalId = '36d0c04b-bb34-4c05-81ac-27e20a958756';
const originalDeployment = '9e15801e-59a9-4bd6-b8d9-13a3adcf76a7';
const originalWorker = 'd309d370d7f4b049c90928d54b678c9a355050e8b9bd3b58eb38502f1d24a2d4';
const sourceAssets = '4957d521fc911271fb0854185a6a2c4fca498cdf';
const assetWitness = 'ecca19a78baadeb603a52fc298983b5f';
const olderAsset = 'f2d11dedaa8cfdcc4b52accdd824fc1b';
const host = 'shiftsometimber.co.uk';
const origin = 'https://' + host;
const worker = 'shift-core';
const runtime = '/accounts/' + process.env.CLOUDFLARE_ACCOUNT_ID + '/workers';
const deployPath = runtime + '/scripts/' + worker + '/deployments';
const versionPath = runtime + '/workers/' + worker + '/versions';
const settingsPath = runtime + '/scripts/' + worker + '/settings';
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token, GITHUB_RUN_ID: run } = process.env;
const proofDir = 'knowledge-cards-release-proof';
const operation = 'knowledge-cards-' + run;
const stageRun = '42384222346';
const capturedStageDir = 'previous-knowledge-stage/knowledge-cards-release-proof';
const capturedStage = name=>JSON.parse(readFileSync(capturedStageDir+'/'+name+'.json','utf8'));


assert(account && token);
assert.equal(process.env.GITHUB_REF, releaseRef);
assert.equal(process.env.GITHUB_REPOSITORY, repository);
assert.equal(process.env.GITHUB_ACTOR_ID, '315011648');
assert.match(run || '', /^\d+$/);
mkdirSync(proofDir,{recursive:true});
const save = (name,data)=>writeFileSync(proofDir+'/'+name+'.json',JSON.stringify(data,null,2));
const git = (...args)=>execFileSync('git',args,{encoding:'utf8',timeout:30000}).trim();

function sourceLease() {
  const branches = Object.fromEntries(git('ls-remote','origin','refs/heads/main',candidateRef)
    .split('\n').map(line=>line.split(/\s+/).reverse()));
  assert.equal(branches['refs/heads/main'],main,'Main moved before scoped release');
  assert.equal(branches[candidateRef],source,'Approved PR source changed');
  assert.equal(git('rev-parse','HEAD:frontend/member'),sourceAssets,'Asset tree differs from the pinned source');
}
async function cf(path,method='GET',body,bearer=token) {
  const request = {method,headers:{Authorization:'Bearer '+bearer},signal:AbortSignal.timeout(90000)};
  if (body instanceof FormData) request.body = body;
  else if (body !== undefined) {
    request.body = JSON.stringify(body);
    request.headers['Content-Type']='application/json';
  }
  const response=await fetch('https://api.cloudflare.com/client/v4'+path,request);
  const result=await response.json();
  assert(response.ok&&result.success, method+' '+path+' failed ('+response.status+' '+(result.errors||[]).map(error=>error.code).join(',')+')');
  if(path.endsWith('/assets-upload-session')) {
    assert.equal((result.result.buckets||[]).flat().length,0,'Existing native asset manifest must need zero asset bytes uploaded');
  }
  return result.result;
}
const active = async()=>latestDeployment((await cf(deployPath)).deployments);
const getVersion = id=>cf(versionPath+'/'+id+'?include=modules');
function originalLease(state) {
  assert.equal(state.id,originalDeployment,'Active Core deployment moved');
  assert.equal(state.versions[0].version_id,originalId,'Active Core version moved');
}
async function routes() {
  const zones = await cf('/zones?'+new URLSearchParams({name:host,account_id:account}));
  assert.equal(zones.length,1,'Expected one public zone');
  return (await cf('/zones/'+zones[0].id+'/workers/routes')).map(({id,pattern,script})=>({id,pattern,script}))
    .sort((a,b)=>a.id.localeCompare(b.id));
}
function settingsEqual(before,after) {
  const project=value=>{
    const clean=structuredClone(value);
    if(clean.annotations) {
      delete clean.annotations['workers/message'];
      delete clean.annotations['workers/tag'];
      if(!Object.keys(clean.annotations).length)delete clean.annotations;
    }
    return clean;
  };
  assert(isDeepStrictEqual(project(after),project(before)),'Serving settings changed');
}
async function verifyAssetWitness() {
  const name='frontend/member/my-timber-preview.html';
  assert.equal(assetHash(readFileSync(name),name),assetWitness,'Pinned member asset differs');
  const status=async etag=>{
    const r=await fetch(origin+'/my-timber-preview?knowledge-asset-proof='+run+'-'+etag,{
      method:'HEAD',redirect:'manual',headers:{'Cache-Control':'no-cache','If-None-Match':'"'+etag+'"'},
      signal:AbortSignal.timeout(30000)
    });
    return r.status;
  };
  const actual=await Promise.all([status(assetWitness),status(olderAsset)]);
  assert.deepEqual(actual,[304,200],'Active native asset does not match the pinned current tree');
  return {sourceAssets,assetWitness,matchingStatus:304,olderStatus:200};
}
const deploy = (id,message)=>cf(deployPath,'POST',{
  strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}
});

sourceLease();
const previous=await active();
originalLease(previous);
const [original,settings,routeTable,witness,publicBefore]=await Promise.all([
  getVersion(originalId),cf(settingsPath),routes(),verifyAssetWitness(),captureLive()
]);
assert.equal(routeOwner(routeTable,origin+'/knowledge')?.script,worker);
assert.equal(routeOwner(routeTable,origin+'/explore-knowledge')?.script,'shift-blog-publisher');
assert.equal(original.id,originalId);
assert.equal(original.modules.length,99);
assert(original.assets?.config && original.bindings.some(binding=>binding.name==='MEMBER_ASSETS'&&binding.type==='assets'));
const before=readFileSync(new URL('./before.js',import.meta.url));
const after=readFileSync(new URL('./after.js',import.meta.url));
assert.equal(hash(before),'7997d6fbb4f14e5f55d7491020cfd846f76ddf5d6e9577775012f7649f320333');
assert.equal(hash(after),'a506b0cafa2a3f752e7d1d0fafbd0298765f6f1b9301bff9f3c3af86a003d953');
const planned=prepareKnowledgePackage(original,before,after);
assert.equal(planned.proof.beforeSHA256,originalWorker);
const projected=verifyKnowledgePackage(original,{...original,modules:planned.modules},planned);
save('captured',{repository,source,main,run,previous,witness,publicBefore,projected});
console.log('KNOWLEDGE_CAPTURED '+JSON.stringify({source,run,originalId,originalDeployment,projected,witness}));

// The earlier run staged an exact version but stopped before promotion when
// script settings followed the newest upload. Reuse that owned version.
const previousCapture=capturedStage('captured');
const assetReceipt=capturedStage('assets');
assert.equal(previousCapture.run,stageRun);
assert.equal(previousCapture.source,source);
assert.equal(previousCapture.main,main);
assert.equal(previousCapture.previous.id,previous.id);
assert.equal(previousCapture.previous.versions[0].version_id,originalId);
assert.deepEqual(previousCapture.projected,projected);
assert.deepEqual(previousCapture.publicBefore.pages,publicBefore.pages);
assert.deepEqual(previousCapture.witness,witness);
assert.equal(assetReceipt.assetSource,main);
assert.equal(assetReceipt.uploaded,0);
assert.equal(assetReceipt.fileCount,5701);
assert.equal(assetReceipt.manifestSHA256,'3f2f9bdeafbf7660423811eeaacd037d94b6e2acf6d9ce16770d900477639d0a');
assert.equal(assetReceipt.preservedLiveTextAssets.length,102);
const assets={checks:assetReceipt.preservedLiveTextAssets};
save('assets',assetReceipt);

const staged=await cf(versionPath+'/latest');
assert.match(staged.id||'',/^[a-f0-9-]{36}$/);
assert.equal(staged.annotations?.['workers/tag'],'knowledge-cards-'+stageRun,'Latest staged version belongs to a different run');
assert.equal(staged.annotations?.['workers/message'],'Approved two Knowledge cards only; source '+source+'; run '+stageRun);
const readBack=await getVersion(staged.id);
assert.equal(readBack.id,staged.id);
const stagedProof=verifyKnowledgePackage(original,readBack,planned);
const byName=bindings=>bindings.toSorted((a,b)=>a.name.localeCompare(b.name));
assert(isDeepStrictEqual(byName(settings.bindings),byName(readBack.bindings)),'Latest script settings do not match the exact version bindings');
settingsEqual(settings,await cf(settingsPath));
assert.deepEqual(await routes(),routeTable,'Production route ownership changed after staging');
originalLease(await active());
await verifyRestored(publicBefore);
await verifyPreservedAssets(assets.checks);
await verifyAssetWitness();
sourceLease();
originalLease(await active());
save('staged',{id:staged.id,stageRun,stagedProof,assetCount:assets.checks.length});
console.log('KNOWLEDGE_STAGED '+JSON.stringify({id:staged.id,stagedProof}));

let receipt;
try {
  let promoted;
  try {
    promoted=await deploy(staged.id,'Approved two-card Knowledge release; '+operation+'; '+source);
  } catch(error) {
    const observed=await active();
    if(observed.versions[0].version_id!==staged.id)throw error;
    promoted=observed;
  }
  assert.match(promoted.id||'',/^[a-f0-9-]{36}$/);
  receipt={kind:'owned_runtime_deployment',source,run,versionId:staged.id,deploymentId:promoted.id};
  save('promotion',receipt);
  let verified;
  for(let attempt=0;attempt<5;attempt++) {
    const state=await active();
    assert.equal(state.id,receipt.deploymentId);
    assert.equal(state.versions[0].version_id,staged.id);
    try {
      verified=await verifyLive(publicBefore);
      break;
    } catch(error) {
      if(attempt===4)throw error;
      await new Promise(resolve=>setTimeout(resolve,5000));
    }
  }
  await verifyPreservedAssets(assets.checks);
  await verifyAssetWitness();
  const deployed=await getVersion(staged.id);
  const providerProof=verifyKnowledgePackage(original,deployed,planned);
  assert.equal(deployed.migration_tag,original.migration_tag);
  settingsEqual(settings,await cf(settingsPath));
  assert.deepEqual(await routes(),routeTable,'Production route ownership changed');
  const state=await active();
  assert.equal(state.id,receipt.deploymentId);
  assert.equal(state.versions[0].version_id,staged.id);
  const result={...receipt,verified,providerProof,rollbackVersion:originalId,nativeAssetChecks:assets.checks.length,assetWitness:witness};
  save('live-verification',result);
  console.log('KNOWLEDGE_LIVE_VERIFIED '+JSON.stringify({source,run,...receipt,positions:verified.positions,providerProof,rollbackVersion:originalId,nativeAssetChecks:assets.checks.length}));
} catch(error) {
  save('verification-failure',{source,run,name:error.name,message:error.message.split('\n')[0]});
  if(receipt) {
    const decision=runtimeRollbackDecision({before:previous,active:await active(),receipt,source,run});
    if(decision.action==='restore') {
      const rollback=await deploy(decision.versionId,'Restore predecessor for '+operation);
      const observed=await active();
      assert.equal(observed.id,rollback.id);
      assert.equal(observed.versions[0].version_id,originalId);
    }
    const restored=await verifyRestored(publicBefore);
    await verifyPreservedAssets(assets.checks);
    await verifyAssetWitness();
    save('rollback',{...decision,restored});
  }
  throw error;
}
