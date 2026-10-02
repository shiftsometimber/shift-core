import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const base='fff6a5cae91e9fdb8a778d6ccf8f6d363e34a21b';
export const additions=new Set([
 'adapt.mjs','browser-proof.mjs','clock.mjs','continue.mjs','follow-up.mjs','followup-view.mjs','full-page-proof.mjs','privacy-purpose-review.md','integration.test.mjs','life-back.mjs','memory.mjs','night-job.mjs','permissions.mjs','planning.mjs','presentation.mjs','privacy.mjs','routes.mjs','safety.mjs','scope.mjs','store.mjs','test-fixture.mjs','today.mjs','ui.mjs','voice.mjs','worker.mjs','workerd-proof.cjs','README.md','launch-assessment.json'
].map(p=>'shift-coach/'+p).concat(['wrangler.coaching.jsonc','.github/workflows/shift-coach-integration.yml']));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const candidate=process.env.SHIFT_COACH_SOURCE;
git('merge-base','--is-ancestor',base,candidate||'HEAD');
// PR CI tests the merge result, while scope is attributed to its exact head.
// Unrelated main commits are not represented as edits made by this candidate.
const tracked=git('diff','--name-status',base,...(candidate?[candidate]:[])).split('\n').filter(Boolean);
for(const line of tracked){const [status,path]=line.split('\t');assert.equal(status,'A','Existing source changed: '+path);assert(additions.has(path),'Unlisted addition: '+path);}
if(candidate)for(const path of additions)assert.equal(git('rev-parse',candidate+':'+path),git('rev-parse','HEAD:'+path),'Candidate addition changed in merge: '+path);
// Also check local untracked feature files before the candidate is committed.
for(const path of git('ls-files','--others','--exclude-standard','shift-coach','wrangler.coaching.jsonc','.github/workflows/shift-coach-integration.yml').split('\n').filter(Boolean))assert(additions.has(path),'Unlisted local addition: '+path);
assert.equal(readFileSync('wrangler.coaching.jsonc','utf8'),readFileSync('wrangler.jsonc','utf8').replace('"main": "worker-entry-v6.js"','"main": "shift-coach/worker.mjs"'));
console.log(JSON.stringify({base,changedExistingFiles:0,listedAdditions:additions.size,entrypointOnlyConfiguration:true,productionActivated:false}));
