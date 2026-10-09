import assert from 'node:assert/strict';
import {readdirSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/workers/scripts/shift-core';
const token=process.env.CLOUDFLARE_API_TOKEN;assert(token);
const files=[];function walk(p){for(const d of readdirSync(p,{withFileTypes:true})){const n=p+'/'+d.name;if(d.isDirectory())walk(n);else if(n.endsWith('.json'))files.push(n)}}walk('owned-release');
const receipts=[];function scan(v){if(!v||typeof v!=='object')return;if(v.kind==='owned_runtime_deployment')receipts.push(v);for(const x of Object.values(v))if(typeof x==='object')scan(x)}
for(const f of files){try{scan(JSON.parse(readFileSync(f)))}catch{}}
const receipt=receipts.find(x=>String(x.run)===process.env.ACCEPTANCE_RUN&&x.source===process.env.ACCEPTANCE_SOURCE);
assert(receipt,'Exact owned deployment receipt missing');
const r=await fetch(root+'/deployments',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const j=await r.json();assert(r.ok&&j.success,'Provider GET failed');
const active=j.result.deployments[0];console.log(JSON.stringify({providerObservationAt:new Date().toISOString(),activeDeploymentId:active.id,activeVersions:active.versions}));assert.equal(active.versions.length,1);assert.equal(active.versions[0].version_id,receipt.versionId);assert.equal(active.versions[0].percentage,100);
mkdirSync('runtime-acceptance-evidence',{recursive:true});
const report={at:new Date().toISOString(),source:receipt.source,run:receipt.run,originalOwnedDeploymentId:receipt.deploymentId,rollbackReceiptRun:'37985093872',deploymentId:active.id,versionId:receipt.versionId,percentage:100,providerRequests:'GET only',pass:true};
writeFileSync('runtime-acceptance-evidence/'+(process.argv[2]||'before')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
