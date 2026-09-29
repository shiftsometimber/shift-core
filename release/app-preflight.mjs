import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {writeFileSync,mkdirSync} from 'node:fs';
import {APP_APPROVED,APP_PATHS,validateAppSource} from './app-scope.mjs';
validateAppSource();
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
async function get(path){const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json()}
const approved=await get('/actions/runs/36571351912');assert.equal(approved.head_sha,APP_APPROVED);assert.equal(approved.conclusion,'success');
assert.equal(approved.path,'.github/workflows/app-layout-preview.yml');
git('merge-base','--is-ancestor',APP_APPROVED,'HEAD');
const releaseMetadata=new Set(['release/app-manifest.json','release/app-scope.mjs','release/app-preflight.mjs','release/growth-adopt-deployment.mjs','scripts/b1-release-scope.mjs','tests/b1-release-scope.test.mjs']);
// Owner authorised PR #850 on 29 September; bind its exact reviewed delta separately from the app preview.
const watchCommit='c5b9e804605a241ad0f1c0fefefaf14994cffba7';
const watchPaths=new Set(["medicines-watch/data.mjs","medicines-watch/reviews/2026-09-29-foundayo-nice-schedule.json","medicines-watch/source-review.test.mjs","scripts/b1-release-scope.mjs","tests/b1-release-scope.test.mjs"]);
git('merge-base','--is-ancestor',watchCommit,'HEAD');
const expansionCommit='583c34e85cf5347df0a44026eaac92d61a986ad5';
const expansionPaths=new Set(["medicines-watch/README.md", "medicines-watch/data.mjs", "medicines-watch/discovery.mjs", "medicines-watch/industry-page.mjs", "medicines-watch/industry.mjs", "medicines-watch/industry.test.mjs", "medicines-watch/page.mjs", "medicines-watch/reviews/2026-09-29-industry-expansion.json", "medicines-watch/verify-live-sources.test.mjs", "medicines-watch/verify-live.mjs", ".github/workflows/cloudflare-production-promote.yml"]);
git('merge-base','--is-ancestor',expansionCommit,'HEAD');
for(const p of APP_PATHS){if(!releaseMetadata.has(p))assert.equal(git('rev-parse',(expansionPaths.has(p)?expansionCommit:watchPaths.has(p)?watchCommit:APP_APPROVED)+':'+p),git('rev-parse','HEAD:'+p),'Approved preview/source changed: '+p)}
const candidate=approved;
const checks=(await get('/commits/'+candidate.head_sha+'/check-runs?per_page=100')).check_runs;
for(const n of ['integration-gate','preservation','route-sweep'])assert(checks.some(c=>c.name===n&&c.conclusion==='success'),'Missing candidate check '+n);
for(const c of checks)assert(c.status==='completed'&&['success','skipped','neutral'].includes(c.conclusion),'Unpassed candidate check '+c.name);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/app-approval.json',JSON.stringify({approved:APP_APPROVED,preview:candidate.head_sha,run:candidate.id,ownerApproval:'29 September 2026: Sort please; repair duplicated consent notices and verify the single parent consent owner in app and website panels',checks:checks.map(c=>({name:c.name,conclusion:c.conclusion}))},null,2));
