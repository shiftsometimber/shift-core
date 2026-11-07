import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { prepareKnowledgePackage, verifyKnowledgePackage, hash } from './patch.mjs';
import { captureLive, verifyRestored } from './live.mjs';

const main = '854a520dc71fa4d0df803e98f88e64adc37b0cce';
const candidate = '552f42029d47f007f4cef8a089fa3a473450b74f';
const releaseBranch = 'refs/heads/release/knowledge-cards-preflight-20261107';
const candidateBranch = 'refs/heads/fix/babylove-legacy-knowledge-cards-20261107';
const beforeVersion = '36d0c04b-bb34-4c05-81ac-27e20a958756';
const beforeDeployment = '9e15801e-59a9-4bd6-b8d9-13a3adcf76a7';
const servingHash = 'd309d370d7f4b049c90928d54b678c9a355050e8b9bd3b58eb38502f1d24a2d4';
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token, GITHUB_REF: ref, GITHUB_RUN_ID: run } = process.env;
assert(account && token && run);
assert.equal(ref, releaseBranch);
assert.equal(process.env.GITHUB_REPOSITORY, 'shiftsometimber/shift-core');
assert.equal(process.env.GITHUB_ACTOR_ID, '315011648');
const remote = () => Object.fromEntries(execFileSync('git',['ls-remote','origin','refs/heads/main',candidateBranch],{
  encoding:'utf8',timeout:30000
}).trim().split('\n').map(line=>line.split(/\s+/).reverse()));
function sourceLease() {
  const branches = remote();
  assert.equal(branches['refs/heads/main'], main, 'Current main changed');
  assert.equal(branches[candidateBranch], candidate, 'Approved Knowledge candidate changed');
}
async function get(path) {
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{
    headers: { Authorization: 'Bearer '+token }, signal: AbortSignal.timeout(90000)
  });
  const body = await res.json();
  assert(res.ok && body.success, 'Provider GET returned '+res.status+' ('+(body.errors||[]).map(e=>e.code)+')');
  return body.result;
}
async function activeLease() {
  const { deployments } = await get('/workers/scripts/shift-core/deployments');
  const latest=deployments.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
  assert.equal(latest.id,beforeDeployment,'Serving deployment changed');
  assert.deepEqual(latest.versions.map(({version_id,percentage})=>({version_id,percentage})),[
    {version_id:beforeVersion,percentage:100}
  ]);
}
sourceLease();
await activeLease();
const version = await get('/workers/workers/shift-core/versions/'+beforeVersion+'?include=modules');
assert.equal(version.id,beforeVersion);
assert.equal(version.modules.length,99);
const before = readFileSync(new URL('./before.js',import.meta.url));
const after = readFileSync(new URL('./after.js',import.meta.url));
assert.equal(hash(before),'7997d6fbb4f14e5f55d7491020cfd846f76ddf5d6e9577775012f7649f320333');
assert.equal(hash(after),'a506b0cafa2a3f752e7d1d0fafbd0298765f6f1b9301bff9f3c3af86a003d953');
const planned = prepareKnowledgePackage(version,before,after);
assert.equal(planned.proof.beforeSHA256,servingHash);
const syntaxPath='/tmp/knowledge-card-serving-candidate.mjs';
writeFileSync(syntaxPath,Buffer.from(planned.modules.find(m=>m.name==='worker.js').content_base64,'base64'),{mode:0o600});
execFileSync(process.execPath,['--check',syntaxPath],{stdio:'pipe',timeout:60000});
const projectedProof = verifyKnowledgePackage(version,{...version,modules:planned.modules},planned);
const publicBefore = await captureLive();
await verifyRestored(publicBefore);
sourceLease();
await activeLease();
const receipt = {main,candidate,run,beforeDeployment,beforeVersion,providerCapture:true,projectedProof,publicBefore,providerWrites:false};
mkdirSync('knowledge-cards-preflight-proof',{recursive:true});
writeFileSync('knowledge-cards-preflight-proof/qualification.json',JSON.stringify(receipt,null,2));
console.log('KNOWLEDGE_PACKAGE_QUALIFIED '+JSON.stringify({main,candidate,run,beforeDeployment,beforeVersion,projectedProof}));
