import {MEMBER_FOCUS_PATHS} from './member-focus-scope.mjs';
import {APP_BASE} from './app-scope.mjs';
import './app-preflight.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {GROWTH_PREVIEW,GROWTH_PINNED_PATHS,validateGrowthSource} from './growth-scope.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const repo='https://api.github.com/repos/shiftsometimber/shift-core';
async function get(path){const r=await fetch(repo+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'GitHub verification '+r.status);return r.json()}
validateGrowthSource();
const original=await get('/actions/runs/36430493215');assert.equal(original.head_sha,GROWTH_PREVIEW);assert.equal(original.conclusion,'success');
const runs=(await get('/actions/runs?branch=release%2Fgrowth-continuity-20260928&event=push&per_page=20')).workflow_runs;
let candidate;
for(const run of runs.filter(r=>r.path==='.github/workflows/growth-member-preview.yml'&&r.conclusion==='success')){
 try{git('merge-base','--is-ancestor',run.head_sha,'HEAD');for(const path of ['member-experience/life-back/next-shift.mjs','preview/growth-member/continuity-journey.mjs','preview/growth-member/public-copy.mjs','growth-member-public.mjs','worker-entry-v6.js','member-experience/entry.mjs','member-experience/member-details.mjs','member-experience/member-email-client.mjs'])assert.equal(git('rev-parse',run.head_sha+':'+path),git('rev-parse',(path==='growth-member-public.mjs'?APP_BASE:MEMBER_FOCUS_PATHS.includes(path)?'ccebd8b125c0072fd8e7f62dddc250e257c12a15':'HEAD')+':'+path));candidate=run;break}catch{}
}
assert(candidate,'No successful source-identical integrated preview');
const checks=(await get('/commits/'+candidate.head_sha+'/check-runs?per_page=100')).check_runs;
for(const name of ['integration-gate','preservation','route-sweep'])assert(checks.some(c=>c.name===name&&c.conclusion==='success'),'Required candidate check: '+name);
for(const check of checks)assert(check.status==='completed'&&['success','skipped','neutral'].includes(check.conclusion),'Candidate check not passed: '+check.name+' '+check.status+'/'+check.conclusion);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/growth-preflight.json',JSON.stringify({approvedPreview:GROWTH_PREVIEW,approvedPreviewRun:original.id,integratedPreview:candidate.head_sha,integratedPreviewRun:candidate.id,release:git('rev-parse','HEAD'),checks:checks.map(c=>({name:c.name,conclusion:c.conclusion,url:c.html_url})),ownerApproval:'28 September 2026: Happy for you to go live and with earlier update to preview as well',checkedAt:new Date().toISOString()},null,2));
console.log('PASS exact reviewed payload, identical successful integration preview and all candidate checks');
