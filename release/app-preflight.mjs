import {HOME_BANNER_PATHS,HOME_BANNER_PREVIEW,HOME_BANNER_RUN} from './home-banner-scope.mjs';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {writeFileSync,mkdirSync} from 'node:fs';
import {APP_APPROVED,APP_PATHS,validateAppSource} from './app-scope.mjs';
validateAppSource();
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
async function get(path){const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json()}
const bannerApproval=await get('/actions/runs/'+HOME_BANNER_RUN);assert.equal(bannerApproval.head_sha,HOME_BANNER_PREVIEW);assert.equal(bannerApproval.conclusion,'success');assert.equal(bannerApproval.path,'.github/workflows/home-banner-preview.yml');
// Require the successful production-font integration preview as well as the owner's signed-off design.
const integratedBanner=await get('/actions/runs/36695679627');assert.equal(integratedBanner.head_sha,'a0c199af934192b73cafa53b0d2d372fa100da1b');assert.equal(integratedBanner.conclusion,'success');assert.equal(integratedBanner.path,'.github/workflows/home-banner-preview.yml');
const approved=await get('/actions/runs/36636511091');assert.equal(approved.head_sha,APP_APPROVED);assert.equal(approved.conclusion,'success');
assert.equal(approved.path,'.github/workflows/app-layout-preview.yml');
git('merge-base','--is-ancestor',APP_APPROVED,'HEAD');
const releaseMetadata=new Set(['release/app-manifest.json','release/app-scope.mjs','release/app-preflight.mjs','release/app-index-freshness.mjs','tests/app-index-freshness.test.mjs','release/app-live-http.mjs','release/app-client-proof.mjs','tests/app-client-proof.test.mjs','release/growth-scope.mjs','release/growth-preflight.mjs','release/member-focus-scope.mjs','tests/member-focus-release.test.mjs','release/growth-adopt-deployment.mjs','scripts/b1-release-scope.mjs','tests/b1-release-scope.test.mjs']);
// Owner authorised PR #850 on 29 September; bind its exact reviewed delta separately from the app preview.
const watchCommit='c5b9e804605a241ad0f1c0fefefaf14994cffba7';
const watchPaths=new Set(["medicines-watch/data.mjs","medicines-watch/reviews/2026-09-29-foundayo-nice-schedule.json","medicines-watch/source-review.test.mjs","scripts/b1-release-scope.mjs","tests/b1-release-scope.test.mjs"]);
git('merge-base','--is-ancestor',watchCommit,'HEAD');
const expansionCommit='68f92f7828ebdcd0b87e85cd029c7ac4541e6143';
const expansionPaths=new Set(["medicines-watch/reviews/2026-09-30-authorised-continuing-discovery.json","medicines-watch/reviews/2026-09-30-emugrobart-petrelintide-discovery.json","medicines-watch/reviews/2026-09-30-env308-discovery.json","medicines-watch/reviews/2026-09-30-hrs1596-discovery.json","medicines-watch/README.md", "medicines-watch/data.mjs", "medicines-watch/discovery.mjs", "medicines-watch/industry-page.mjs", "medicines-watch/industry.mjs", "medicines-watch/industry.test.mjs", "medicines-watch/knowledge.mjs", "medicines-watch/knowledge.test.mjs", "medicines-watch/page.mjs", "medicines-watch/product-renewal.test.mjs", "medicines-watch/reviews/2026-09-29-industry-expansion.json", "medicines-watch/reviews/2026-09-30-discovery-proposals.json", "medicines-watch/reviews/2026-09-30-discovery-review.md", "medicines-watch/reviews/2026-09-30-reviewed-expansion.json", "medicines-watch/verify-live-sources.test.mjs", "medicines-watch/verify-live.mjs", ".github/workflows/cloudflare-production-promote.yml"]);
git('merge-base','--is-ancestor',expansionCommit,'HEAD');
// Exact manifest-pinned repair for the production-only missing embedded consent loader.
const panelConsentRepair=new Set(['app-layout-live.mjs','tests/app-layout-live.test.mjs']);
for(const p of APP_PATHS){if(!releaseMetadata.has(p)&&!panelConsentRepair.has(p)&&!HOME_BANNER_PATHS.has(p))assert.equal(git('rev-parse',(expansionPaths.has(p)?expansionCommit:watchPaths.has(p)?watchCommit:APP_APPROVED)+':'+p),git('rev-parse','HEAD:'+p),'Approved preview/source changed: '+p)}
const candidate=approved;
const checks=(await get('/commits/'+candidate.head_sha+'/check-runs?per_page=100')).check_runs;
for(const n of ['integration-gate','preservation','route-sweep'])assert(checks.some(c=>c.name===n&&c.conclusion==='success'),'Missing candidate check '+n);
for(const c of checks)assert(c.status==='completed'&&['success','skipped','neutral'].includes(c.conclusion),'Unpassed candidate check '+c.name);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/app-approval.json',JSON.stringify({approved:APP_APPROVED,preview:candidate.head_sha,run:candidate.id,ownerApproval:'30 September 2026: Go live - release the reviewed personal Today, first-week guidance and member-feedback repairs',checks:checks.map(c=>({name:c.name,conclusion:c.conclusion}))},null,2));
