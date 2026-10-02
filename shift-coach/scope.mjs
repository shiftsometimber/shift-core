import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const base='7a02f42a58a7992ce4728d9fd91808f2654f7cdf';
export const additions=new Set([
 'adapt.mjs','browser-proof.mjs','clock.mjs','continue.mjs','follow-up.mjs','followup-view.mjs','integration.test.mjs','life-back.mjs','memory.mjs','night-job.mjs','permissions.mjs','planning.mjs','presentation.mjs','privacy.mjs','routes.mjs','safety.mjs','scope.mjs','store.mjs','test-fixture.mjs','today.mjs','ui.mjs','voice.mjs','worker.mjs','workerd-proof.cjs','README.md','launch-assessment.json'
].map(p=>'shift-coach/'+p).concat(['wrangler.coaching.jsonc','.github/workflows/shift-coach-integration.yml']));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('merge-base','--is-ancestor',base,'HEAD');
const tracked=git('diff','--name-status',base).split('\n').filter(Boolean);
for(const line of tracked){const [status,path]=line.split('\t');assert.equal(status,'A','Existing source changed: '+path);assert(additions.has(path),'Unlisted addition: '+path);}
// Also check local untracked feature files before the candidate is committed.
for(const path of git('ls-files','--others','--exclude-standard','shift-coach','wrangler.coaching.jsonc','.github/workflows/shift-coach-integration.yml').split('\n').filter(Boolean))assert(additions.has(path),'Unlisted local addition: '+path);
assert.equal(readFileSync('wrangler.coaching.jsonc','utf8'),readFileSync('wrangler.jsonc','utf8').replace('"main": "worker-entry-v6.js"','"main": "shift-coach/worker.mjs"'));
console.log(JSON.stringify({base,changedExistingFiles:0,listedAdditions:additions.size,entrypointOnlyConfiguration:true,productionActivated:false}));
