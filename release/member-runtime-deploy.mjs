import {ensureQueryRedaction} from './query-log-redaction.mjs';
// Record the version returned by this exact CLI invocation. A subsequent
// deployment must never be mistaken for this release's failed runtime.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {latestDeployment} from './runtime-rollback-guard.mjs';
assert.equal(process.env.GITHUB_REF,'refs/heads/main');
assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
assert.match(process.env.GITHUB_RUN_ID||'',/^\d+$/);
const cli=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4e6});
const before=latestDeployment(JSON.parse(readFileSync('deployment-before.json')));
const active=latestDeployment(JSON.parse(cli('deployments','list','--json')));
assert.equal(active.id,before.id,'Runtime moved since capture; stop stale release');
mkdirSync('b1-runtime-release',{recursive:true});
const output=cli('deploy');writeFileSync('b1-runtime-release/runtime-deploy.log',output);
const matches=[...output.matchAll(/Current Version ID:\s*([a-f0-9-]{36})/g)];
assert.equal(matches.length,1,'CLI did not return one owned version; operator reconciliation required');
const versionId=matches[0][1],list=JSON.parse(cli('deployments','list','--json'));
const owned=list.filter(d=>d.versions?.length===1&&d.versions[0].percentage===100&&d.versions[0].version_id===versionId);
assert.equal(owned.length,1,'Owned deployment cannot be uniquely identified');
const receipt={kind:'owned_runtime_deployment',at:new Date().toISOString(),source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,deploymentId:owned[0].id,versionId,previousDeploymentId:before.id,previousVersionId:before.versions[0].version_id,dataRestored:false};
writeFileSync('b1-runtime-release/owned-runtime-deployment.json',JSON.stringify(receipt,null,2));
assert.equal(latestDeployment(list).id,receipt.deploymentId,'Another deployment followed this release; stop verification');
console.log(JSON.stringify(receipt));

const logPrivacy=await ensureQueryRedaction({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN});
writeFileSync('b1-runtime-release/query-log-redaction.json',JSON.stringify(logPrivacy,null,2));
console.log(JSON.stringify(logPrivacy));
