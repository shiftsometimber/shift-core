import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {writeFileSync,mkdirSync} from 'node:fs';
import {APP_APPROVED,APP_PATHS,validateAppSource} from './app-scope.mjs';
validateAppSource();
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
async function get(path){const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json()}
const approved=await get('/actions/runs/36488479110');assert.equal(approved.head_sha,APP_APPROVED);assert.equal(approved.conclusion,'success');
const runs=(await get('/actions/runs?branch=release%2Fapp-layout-20260928&event=push&per_page=30')).workflow_runs;
let candidate;
for(const r of runs.filter(r=>r.path==='.github/workflows/app-layout-preview.yml'&&r.conclusion==='success')){try{git('merge-base','--is-ancestor',r.head_sha,'HEAD');for(const p of APP_PATHS)assert.equal(git('rev-parse',r.head_sha+':'+p),git('rev-parse','HEAD:'+p));candidate=r;break}catch{}}
assert(candidate,'No source-identical successful app and website inline preview');
const checks=(await get('/commits/'+candidate.head_sha+'/check-runs?per_page=100')).check_runs;
for(const n of ['integration-gate','preservation','route-sweep'])assert(checks.some(c=>c.name===n&&c.conclusion==='success'),'Missing candidate check '+n);
for(const c of checks)assert(c.status==='completed'&&['success','skipped','neutral'].includes(c.conclusion),'Unpassed candidate check '+c.name);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/app-approval.json',JSON.stringify({approved:APP_APPROVED,preview:candidate.head_sha,run:candidate.id,ownerApproval:'28 September 2026: happy for it to go live, protect main website; add same switching view to main website',checks:checks.map(c=>({name:c.name,conclusion:c.conclusion}))},null,2));
