import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {GROWTH_PREVIEW,GROWTH_PINNED_PATHS,validateGrowthSource} from './growth-scope.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const repo='https://api.github.com/repos/shiftsometimber/shift-core';
async function get(path){const r=await fetch(repo+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'GitHub verification '+r.status);return r.json()}
validateGrowthSource();
const original=await get('/actions/runs/36356094808');assert.equal(original.head_sha,GROWTH_PREVIEW);assert.equal(original.conclusion,'success');
const runs=(await get('/actions/runs?branch=release%2Fgrowth-member-20260928&event=push&per_page=20')).workflow_runs;
let candidate;
for(const run of runs.filter(r=>r.path==='.github/workflows/growth-member-preview.yml'&&r.conclusion==='success')){
 try{git('merge-base','--is-ancestor',run.head_sha,'HEAD');for(const path of GROWTH_PINNED_PATHS)assert.equal(git('rev-parse',run.head_sha+':'+path),git('rev-parse','HEAD:'+path));candidate=run;break}catch{}
}
assert(candidate,'No successful source-identical integrated preview');
const checks=(await get('/commits/'+candidate.head_sha+'/check-runs?per_page=100')).check_runs;
for(const name of ['integration-gate','preservation','route-sweep'])assert(checks.some(c=>c.name===name&&c.conclusion==='success'),'Required candidate check: '+name);
for(const check of checks)assert(check.status==='completed'&&['success','skipped','neutral'].includes(check.conclusion),'Candidate check not passed: '+check.name+' '+check.status+'/'+check.conclusion);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/growth-preflight.json',JSON.stringify({approvedPreview:GROWTH_PREVIEW,approvedPreviewRun:original.id,integratedPreview:candidate.head_sha,integratedPreviewRun:candidate.id,release:git('rev-parse','HEAD'),checks:checks.map(c=>({name:c.name,conclusion:c.conclusion,url:c.html_url})),ownerApproval:'28 September 2026 11:11 BST: It looks ok to me to deploy',checkedAt:new Date().toISOString()},null,2));
console.log('PASS exact reviewed payload, identical successful integration preview and all candidate checks');
