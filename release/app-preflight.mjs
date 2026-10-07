import {metricsPreflightPath,verifyMetricsConnection} from './metrics-connection-scope.mjs';
import {verifySixTopicSeoProof} from './six-topic-seo-scope.mjs';
import {FIT300_PATHS,READONLY_ORGANIC_PATHS} from './fit-300-scope.mjs';
import {RECIPE_IMAGE_PATHS,validateRecipeImages} from './recipe-image-scope.mjs';
import {DEVICE_HEALTH_PATHS,historicalDeviceHealthRef,validateDeviceHealthSource,verifyDeviceHealthProof} from './device-health-scope.mjs';
import {COACH_BASE,COACH_PATHS,WATCH_CURRENT_PATHS,WATCH_CURRENT_BASE,watchCurrentSource,coachingHistoricalRef,withoutCoachEntrypoint,verifyCoachingRelease} from '../shift-coach/release-contract.mjs';
import {WATCH_REGISTRY_WAVE_COMMIT,WATCH_REGISTRY_WAVE_PATHS,verifyWatchRegistryWaveProof} from './watch-registry-wave-scope.mjs';
import {TREATMENT_GUIDANCE_PREVIEW,TREATMENT_GUIDANCE_PATHS,treatmentGuidanceRef,verifyTreatmentGuidanceProof} from './treatment-guidance-scope.mjs';
import {PUBLIC_WORDING_PREVIEW,PUBLIC_WORDING_PATHS,verifyPublicWordingProof} from './public-wording-scope.mjs';
import {verifyMemberAcceptanceProof} from './member-acceptance-scope.mjs';
import {MEMBER_DESIGN_PATHS,MEMBER_LAYOUT_PATHS,verifyMemberDesignProof} from './member-design-scope.mjs';
import {FOOTER_PATHS,historicalFooterRef,verifyFooterProof} from './footer-scope.mjs';
import {HOME_BANNER_PATHS,HOME_BANNER_PREVIEW,HOME_BANNER_RUN,CREAM_PREVIEW,CREAM_RUN,FOOTER_PREVIEW,FOOTER_RUN} from './home-banner-scope.mjs';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {writeFileSync,mkdirSync} from 'node:fs';
import {PWA_DISMISS_APPROVED,PWA_DISMISS_PATHS,APP_APPROVED,APP_PATHS,ARTICLE_REPAIR_PATHS,ARTICLE_REPAIR_SOURCE,validateAppSource} from './app-scope.mjs';
verifyMetricsConnection();
validateAppSource();
validateRecipeImages();
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
async function get(path){const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json()}
await verifySixTopicSeoProof(get);
await verifyDeviceHealthProof(get);
await verifyPublicWordingProof(get);
await verifyWatchRegistryWaveProof(get);
await verifyTreatmentGuidanceProof(get);
const sharedFooterProof=await verifyFooterProof(get);
const memberDesignProof=await verifyMemberDesignProof(get);
const memberAcceptanceProof=await verifyMemberAcceptanceProof(get);
const pwaDismissApproval=await get('/actions/runs/36780636646');assert.equal(pwaDismissApproval.head_sha,PWA_DISMISS_APPROVED);assert.equal(pwaDismissApproval.conclusion,'success');
const footerApproval=await get('/actions/runs/'+FOOTER_RUN);assert.equal(footerApproval.head_sha,FOOTER_PREVIEW);assert.equal(footerApproval.conclusion,'success');assert.equal(footerApproval.path,'.github/workflows/home-banner-preview.yml');
const creamApproval=await get('/actions/runs/'+CREAM_RUN);assert.equal(creamApproval.head_sha,CREAM_PREVIEW);assert.equal(creamApproval.conclusion,'success');assert.equal(creamApproval.path,'.github/workflows/home-banner-preview.yml');
const compactApproval=await get('/actions/runs/36777397194');assert.equal(compactApproval.head_sha,'2a26480aaadcbd7177d2671d21de35b4028de2d8');assert.equal(compactApproval.conclusion,'success');
const bannerApproval=await get('/actions/runs/'+HOME_BANNER_RUN);assert.equal(bannerApproval.head_sha,HOME_BANNER_PREVIEW);assert.equal(bannerApproval.conclusion,'success');assert.equal(bannerApproval.path,'.github/workflows/home-banner-preview.yml');
// Require the successful production-font integration preview as well as the owner's signed-off design.
const integratedBanner=await get('/actions/runs/36695679627');assert.equal(integratedBanner.head_sha,'a0c199af934192b73cafa53b0d2d372fa100da1b');assert.equal(integratedBanner.conclusion,'success');assert.equal(integratedBanner.path,'.github/workflows/home-banner-preview.yml');
const approved=await get('/actions/runs/36636511091');assert.equal(approved.head_sha,APP_APPROVED);assert.equal(approved.conclusion,'success');
assert.equal(approved.path,'.github/workflows/app-layout-preview.yml');
git('merge-base','--is-ancestor',APP_APPROVED,'HEAD');
const releaseMetadata=new Set(['.github/workflows/babylove-mounjaro-876303-live.yml','release/watch-registry-wave-scope.mjs','tests/checkout-recovery.test.mjs','member-experience/tests/lookup-continuation.test.mjs','release/treatment-guidance-scope.mjs','release/public-wording-scope.mjs',"rendered-member-acceptance-support.mjs","tests/rendered-member-acceptance-support.test.mjs","health-passport/production-browser.mjs","my-timber-final-production.mjs",".github/workflows/rendered-member-production-acceptance.yml",".github/workflows/my-timber-final-production.yml","g2-014-progress-picture-premium-production.mjs","my-timber-final-source-gate.mjs","release/member-acceptance-scope.mjs",'rendered-member-acceptance-support.mjs','tests/rendered-member-acceptance-support.test.mjs','.github/workflows/continuity-live-acceptance.yml','release/member-design-scope.mjs','tests/member-design-release.test.mjs','.github/workflows/member-design-release-proof.yml','release/app-manifest.json','release/app-scope.mjs','release/app-preflight.mjs','release/app-index-freshness.mjs','tests/app-index-freshness.test.mjs','release/app-live-http.mjs','release/app-member-live.mjs','release/app-client-proof.mjs','tests/app-client-proof.test.mjs','release/growth-scope.mjs','release/growth-preflight.mjs','release/member-focus-scope.mjs','tests/member-focus-release.test.mjs','release/growth-adopt-deployment.mjs','scripts/b1-release-scope.mjs','tests/b1-release-scope.test.mjs','member-experience/public-preservation.mjs','member-experience/verify-production-member.mjs','docs/content-review/2026-10-03-public-copy-preview.json','docs/content-review/2026-10-03-public-copy-residual.json']);
// Owner authorised PR #850 on 29 September; bind its exact reviewed delta separately from the app preview.
const watchCommit='c5b9e804605a241ad0f1c0fefefaf14994cffba7';
const watchPaths=new Set(["medicines-watch/data.mjs","medicines-watch/reviews/2026-09-29-foundayo-nice-schedule.json","medicines-watch/source-review.test.mjs","scripts/b1-release-scope.mjs","tests/b1-release-scope.test.mjs"]);
git('merge-base','--is-ancestor',watchCommit,'HEAD');
const expansionCommit='d1634452499a0c480190bbed7947368260a6acb6';
const expansionPaths=new Set(["medicines-watch/reviews/2026-09-30-berobenatide-vesper6.json", "medicines-watch/reviews/2026-10-01-eloratzp-phase2b.json", "medicines-watch/reviews/2026-10-01-kainetic-enrolment.json", "medicines-watch/reviews/2026-10-01-macupatide-discovery.json", "medicines-watch/reviews/2026-10-01-mounjaro-nhs-renewal.json", "medicines-watch/reviews/2026-09-30-bi3034701-discovery.json", "medicines-watch/reviews/2026-09-30-authorised-bi3034701.json", "medicines-watch/source-review.test.mjs", "medicines-watch/reviews/2026-09-30-globenewswire-access-repair.json", "medicines-watch/reviews/2026-09-30-overdue-source-renewal.json", "medicines-watch/reviews/2026-09-30-source-warning-repairs.json", "medicines-watch/reviews/2026-09-30-authorised-continuing-discovery.json", "medicines-watch/reviews/2026-09-30-emugrobart-petrelintide-discovery.json", "medicines-watch/reviews/2026-09-30-env308-discovery.json", "medicines-watch/reviews/2026-09-30-hrs1596-discovery.json", "medicines-watch/README.md", "medicines-watch/data.mjs", "medicines-watch/discovery.mjs", "medicines-watch/industry-page.mjs", "medicines-watch/industry.mjs", "medicines-watch/industry.test.mjs", "medicines-watch/knowledge.mjs", "medicines-watch/knowledge.test.mjs", "medicines-watch/page.mjs", "medicines-watch/product-renewal.test.mjs", "medicines-watch/reviews/2026-09-29-industry-expansion.json", "medicines-watch/reviews/2026-09-30-discovery-proposals.json", "medicines-watch/reviews/2026-09-30-discovery-review.md", "medicines-watch/reviews/2026-09-30-reviewed-expansion.json", "medicines-watch/verify-live-sources.test.mjs", "medicines-watch/verify-live.mjs", ".github/workflows/cloudflare-production-promote.yml", "medicines-watch/reviews/2026-09-30-abbv295-discovery.json", "medicines-watch/reviews/2026-09-30-asc36-discovery.json", "medicines-watch/reviews/2026-09-30-eloratzp-na931-discovery.json", "medicines-watch/reviews/2026-10-01-ascletis-injectable-discovery.json", "medicines-watch/reviews/2026-10-01-authorised-evening-updates.json", "medicines-watch/reviews/2026-10-01-cagrisema-easd.json", "medicines-watch/reviews/2026-10-01-embraze-fetch-observation.json", "medicines-watch/reviews/2026-10-01-evening-easd-discovery.json", "medicines-watch/reviews/2026-10-01-monitor-discovery-pass.json", "medicines-watch/reviews/2026-10-01-non-incretin-discovery.json", "medicines-watch/reviews/2026-10-01-publication-verification.json"]);
git('merge-base','--is-ancestor',expansionCommit,'HEAD');
const broaderDiscoveryCommit='24f869d714702a0dc4f75849f22700eb6fbc078e';
const broaderDiscoveryPaths=new Set(['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-01-authorised-broader-discovery.json']);
git('merge-base','--is-ancestor',broaderDiscoveryCommit,'HEAD');
const synt101CorrectionCommit='e8cbe2238687bd9b9da8a5d694b5b7a73976c1d7';
const synt101CorrectionPaths=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-01-synt101-mad-correction.json']);
git('merge-base','--is-ancestor',synt101CorrectionCommit,'HEAD');
const internationalOmissionsCommit='874a3b1bc3013de9442dbedbf1398c275fc13f6c';
const internationalOmissionsPaths=new Set(['medicines-watch/README.md','medicines-watch/industry-page.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-international-omissions.json']);
git('merge-base','--is-ancestor',internationalOmissionsCommit,'HEAD');
const expandedDiscoveryCommit='cd65000cd120d6de8496b7edbea27e333d5042a3';
const expandedDiscoveryPaths=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-expanded-discovery.json']);
git('merge-base','--is-ancestor',expandedDiscoveryCommit,'HEAD');
const ubt251Commit='3414d2340f92275daa46948fb9f73d7fad26e36a';
const ubt251Paths=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-ubt251.json']);
git('merge-base','--is-ancestor',ubt251Commit,'HEAD');
const sgb7342Commit='b46a594bb884105a51797f66adbb7653c7979e3f';
const sgb7342Paths=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-sgb7342.json']);
git('merge-base','--is-ancestor',sgb7342Commit,'HEAD');
const abbvAsc30Commit='2e7d9aecaf30ee266311102c87273cb1d9f19d82';
const abbvAsc30Paths=new Set(['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json']);
git('merge-base','--is-ancestor',abbvAsc30Commit,'HEAD');
// Exact owner-authorised source-monitor repair in PR #933; preserve all other reviewed source.
const sourceRepairCommit='f27a1c8b574b30c435a0eae6c367d0b32aa39fb4';
const sourceRepairPaths=new Set(["medicines-watch/README.md","medicines-watch/industry.mjs","medicines-watch/monitor.mjs","medicines-watch/monitor.test.mjs","medicines-watch/reviews/2026-10-02-source-monitor-repairs.json"]);
git('merge-base','--is-ancestor',sourceRepairCommit,'HEAD');
// Exact evidence-backed registry omissions merged in PR #936; no UK authorisation, access, supply or clinical approval inferred.
const registryOmissionsCommit='42525e4c5e93076b1cfc57ce415b248eac82ee63';
const registryOmissionsPaths=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-registry-omissions.json']);
git('merge-base','--is-ancestor',registryOmissionsCommit,'HEAD');
// Exact Pfizer PDF monitor repair merged in PR #939; monitoring evidence only, not clinical approval.
const pfizerPdfRepairCommit='5f1c8e6d9b4c7a8656854e4807a4aebd97b39e50';
const pfizerPdfRepairPaths=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/monitor.mjs','medicines-watch/monitor.test.mjs','medicines-watch/reviews/2026-10-02-pfizer-pdf-monitor-repair.json']);
git('merge-base','--is-ancestor',pfizerPdfRepairCommit,'HEAD');
// Exact evidence-bounded enobosarm/semaglutide research addition merged in PR #942.
const enobosarmSemaglutideCommit='3c1704b23955fb4abf57e1b05bc56464d10ed08c';
const enobosarmSemaglutidePaths=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-enobosarm-semaglutide.json']);
git('merge-base','--is-ancestor',enobosarmSemaglutideCommit,'HEAD');
// Exact manifest-pinned repair for the production-only missing embedded consent loader.
// Retain exact current-main native/app-review and login work; this web release does not submit native apps.
const retainedCurrentMain=new Set([".github/workflows/master-integration-gate.yml",".github/workflows/my-timber-app-preview.yml","frontend/member/my-timber-preview.html","my-timber-app/RELEASE-AUDIT-2026-10-01.md","my-timber-app/android/app/build.gradle","my-timber-app/android/app/src/main/java/uk/co/shiftsometimber/mytimber/MainActivity.java","my-timber-app/contract.json","my-timber-app/ios/Sources/MyTimberViewController.swift","my-timber-app/ios/project.yml","my-timber-app/tests/apple-review-live.mjs","my-timber-app/tests/source.test.mjs","tests/member-auth-ui-v2.test.mjs"]);
const retainedMain='b23010cfca99b3ab05377062ad5b16984711111c';
git('merge-base','--is-ancestor',retainedMain,'HEAD');
const panelConsentRepair=new Set(['app-layout-live.mjs','tests/app-layout-live.test.mjs']);
const myHealthPlanPaths=new Set(['frontend/member/whole-man-intent-os-v1.js','tests/my-health-plan-v2.test.mjs','member-experience/dashboard-tools.mjs','member-experience/tests/dashboard-tools.test.mjs']);
for(const p of APP_PATHS){if(metricsPreflightPath(p))continue;if(!FIT300_PATHS.has(p)&&!READONLY_ORGANIC_PATHS.has(p)&&!RECIPE_IMAGE_PATHS.has(p)&&!myHealthPlanPaths.has(p)&&!DEVICE_HEALTH_PATHS.has(p)&&!COACH_PATHS.has(p)&&!MEMBER_DESIGN_PATHS.includes(p)&&!MEMBER_LAYOUT_PATHS.includes(p)&&!FOOTER_PATHS.has(p)&&!PWA_DISMISS_PATHS.includes(p)&&!releaseMetadata.has(p)&&!panelConsentRepair.has(p)&&!HOME_BANNER_PATHS.has(p))assert.equal(git('rev-parse',(ARTICLE_REPAIR_PATHS.has(p)?ARTICLE_REPAIR_SOURCE:WATCH_CURRENT_PATHS.has(p)?watchCurrentSource(p):TREATMENT_GUIDANCE_PATHS.includes(p)?treatmentGuidanceRef(p):WATCH_REGISTRY_WAVE_PATHS.includes(p)?WATCH_REGISTRY_WAVE_COMMIT:PUBLIC_WORDING_PATHS.includes(p)?PUBLIC_WORDING_PREVIEW:retainedCurrentMain.has(p)?retainedMain:enobosarmSemaglutidePaths.has(p)?enobosarmSemaglutideCommit:pfizerPdfRepairPaths.has(p)?pfizerPdfRepairCommit:registryOmissionsPaths.has(p)?registryOmissionsCommit:sourceRepairPaths.has(p)?sourceRepairCommit:abbvAsc30Paths.has(p)?abbvAsc30Commit:sgb7342Paths.has(p)?sgb7342Commit:ubt251Paths.has(p)?ubt251Commit:expandedDiscoveryPaths.has(p)?expandedDiscoveryCommit:internationalOmissionsPaths.has(p)?internationalOmissionsCommit:synt101CorrectionPaths.has(p)?synt101CorrectionCommit:broaderDiscoveryPaths.has(p)?broaderDiscoveryCommit:expansionPaths.has(p)?expansionCommit:watchPaths.has(p)?watchCommit:APP_APPROVED)+':'+p),git('rev-parse',historicalFooterRef('HEAD',p)+':'+p),'Approved preview/source changed: '+p)}
const candidate=approved;
const checks=(await get('/commits/'+candidate.head_sha+'/check-runs?per_page=100')).check_runs;
for(const n of ['integration-gate','preservation','route-sweep'])assert(checks.some(c=>c.name===n&&c.conclusion==='success'),'Missing candidate check '+n);
for(const c of checks)assert(c.status==='completed'&&['success','skipped','neutral'].includes(c.conclusion),'Unpassed candidate check '+c.name);
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/app-approval.json',JSON.stringify({approved:APP_APPROVED,preview:candidate.head_sha,run:candidate.id,ownerApproval:'30 September 2026: Go live - release the reviewed personal Today, first-week guidance and member-feedback repairs',checks:checks.map(c=>({name:c.name,conclusion:c.conclusion}))},null,2));
