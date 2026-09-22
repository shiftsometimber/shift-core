// Restore only the exact deployment captured immediately before this release.
// All current D1/member/order/password/consent records remain in place.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
assert.equal(process.env.GITHUB_REF,'refs/heads/main');
const list=JSON.parse(readFileSync('deployment-before.json'));
assert(Array.isArray(list)&&list.length);
const before=list.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
assert.equal(before.versions.length,1);assert.equal(before.versions[0].percentage,100);
const id=before.versions[0].version_id;assert(/^[a-f0-9-]{36}$/.test(id));
execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','rollback',id,'--config','wrangler.jsonc','--message','Guarded PR790 post-release failure; restore previous runtime and preserve all current data'],{stdio:'inherit'});
const after=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deployments','list','--config','wrangler.jsonc','--json'],{encoding:'utf8'})).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
assert.equal(after.versions.length,1);assert.equal(after.versions[0].version_id,id);assert.equal(after.versions[0].percentage,100);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/rollback.json',JSON.stringify({at:new Date().toISOString(),restoredVersion:id,deployment:after.id,dataRestored:false,reason:'Post-deployment gate failed; release remains failed.'},null,2));
