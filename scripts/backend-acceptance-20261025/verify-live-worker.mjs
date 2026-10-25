import {verifyApprovedCompiledModules} from './compiled-module-identity-20261025.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const receiptFile=process.argv[2];assert(receiptFile,'Pass the existing guarded workflow owned-runtime-deployment.json');
const owned=JSON.parse(fs.readFileSync(receiptFile,'utf8'));
assert.equal(owned.kind,'owned_runtime_deployment');assert.match(owned.source,/^[a-f0-9]{40}$/);assert.match(owned.versionId,/^[a-f0-9-]{36}$/);assert.match(owned.deploymentId,/^[a-f0-9-]{36}$/);
assert.equal(process.env.VERIFIED_MY_TIMBER_DEPLOYMENT_SOURCE,owned.source,'Use only after the workflow has verified the owned merged source');
const cfg=fs.readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8');
const token=cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];assert(token,'Existing Wrangler read session unavailable');
const base='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core';
async function read(path){const r=await fetch(base+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});assert(r.ok,'Cloudflare read failed '+r.status);return r;}
async function active(){const d=await(await read('/deployments')).json();assert(d.success);const rows=d.result.deployments;assert(rows?.length);const x=[...rows].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];assert.equal(x.id,owned.deploymentId,'A different deployment owns production');assert.deepEqual(x.versions,[{version_id:owned.versionId,percentage:100}]);return x;}
await active();
const versionResponse=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/workers/shift-core/versions/'+owned.versionId+'?include=modules',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});
assert(versionResponse.ok,'Exact owned version content read failed '+versionResponse.status);const versionData=await versionResponse.json();assert(versionData.success);assert.equal(versionData.result.id,owned.versionId,'Downloaded content is not the owned version');
const scriptModules=versionData.result.modules?.filter(m=>/\.(?:mjs|js)$/.test(m.name));assert(scriptModules?.length,'Owned version script modules unavailable');const live=scriptModules.map(m=>{assert.equal(typeof m.content_base64,'string');return Buffer.from(m.content_base64,'base64').toString('utf8');}).join('');
await active();
const candidate=fs.readFileSync('/Users/shiftsometimberltd/SST/backend-consolidated-build-20261024/bundle-current/worker.js','utf8');
assert.equal(sha(candidate),'5e0a543df9348fe3f1a922c36a673e10f24e05ee2264d5e33e6038030ec47a37','Prepared candidate compilation changed');
const modules=verifyApprovedCompiledModules(live,candidate);
const deletionBoundary=[];for(const [origin,status]of [['https://shiftsometimber.co.uk',401],['https://foreign.example.invalid',403]]){const response=await fetch('https://api.shiftsometimber.co.uk/v1/privacy/account',{method:'DELETE',credentials:'omit',redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({confirmation:'DELETE_MY_ACCOUNT'}),signal:AbortSignal.timeout(30000)});assert.equal(response.status,status,'Anonymous account deletion boundary '+origin);deletionBoundary.push({origin,status:response.status,authenticated:false});}
await active();const proof={ok:true,deletionBoundary,at:new Date().toISOString(),source:owned.source,run:owned.run,versionId:owned.versionId,deploymentId:owned.deploymentId,liveWorkerSHA256:sha(live),candidateBundleSHA256:sha(candidate),exactBundleMatch:live===candidate,exactAffectedCompiledModules:modules,productionWrites:0,memberRowsRead:0,physicalDevice:false};
fs.writeFileSync(new URL('./live-worker-proof.json',import.meta.url),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
