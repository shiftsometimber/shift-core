// Restore only the exact deployment captured immediately before this release.
// All current D1/member/order/password/consent records remain in place.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {latestDeployment,runtimeRollbackDecision} from './runtime-rollback-guard.mjs';
assert.equal(process.env.GITHUB_REF,'refs/heads/main');
const before=latestDeployment(JSON.parse(readFileSync('deployment-before.json')));
const receipt=JSON.parse(readFileSync('b1-runtime-release/owned-runtime-deployment.json'));
const active=latestDeployment(JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deployments','list','--config','wrangler.jsonc','--json'],{encoding:'utf8'})));
const decision=runtimeRollbackDecision({before,active,receipt,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID});
if(decision.action==='retain'){console.log(decision.reason);process.exit(0);}
const id=decision.versionId;
execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','rollback',id,'--config','wrangler.jsonc','--message','Owned release failed post-deployment checks; restore captured runtime and preserve current data'],{stdio:'inherit'});
const after=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deployments','list','--config','wrangler.jsonc','--json'],{encoding:'utf8'})).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
assert.equal(after.versions.length,1);assert.equal(after.versions[0].version_id,id);assert.equal(after.versions[0].percentage,100);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/rollback.json',JSON.stringify({at:new Date().toISOString(),restoredVersion:id,deployment:after.id,dataRestored:false,reason:'Post-deployment gate failed; release remains failed.'},null,2));
