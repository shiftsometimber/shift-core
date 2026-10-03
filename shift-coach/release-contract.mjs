import {DEVICE_HEALTH_DELTA,validateDeviceHealthSource} from '../release/device-health-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const COACH_BASE='afa730029198f39b60f6ea82d6469e5681d93575';
// Exact already-merged article repair helpers, composed without changing their source.
export const COACH_ADDITIONS=new Set([".github/workflows/evidence-article-repair-snapshot.yml",".github/workflows/evidence-based-article-live-release.yml","babylove/repair-evidence-based-article.mjs","shift-coach/knowledge.mjs","release/query-log-redaction.mjs","release/device-health-scope.mjs","tests/device-health-release.test.mjs",".github/workflows/ai-lossless-proof.yml","release/runtime-rollback-guard.mjs","release/member-runtime-deploy.mjs","tests/general-analytics-privacy.test.mjs","tests/runtime-rollback-guard.test.mjs",".github/workflows/online-privacy-recovery-proof.yml","scripts/article-image-policy.mjs","tests/article-image-policy.test.mjs","shift-coach/home-font-prior-subset.mjs","shift-coach/cancelled-release-recovery.mjs","shift-coach/cancelled-release-recovery.test.mjs","shift-coach/recover-cancelled-release.mjs","shift-coach/public-font-browser-proof.mjs","shift-coach/home-font-subset.mjs","shift-coach/public-font-delivery.mjs","shift-coach/public-font-delivery.test.mjs","shift-coach/progression.mjs", "shift-coach/support.mjs", "shift-coach/adapt.mjs", "shift-coach/browser-proof.mjs", "shift-coach/clock.mjs", "shift-coach/continue.mjs", "shift-coach/follow-up.mjs", "shift-coach/followup-view.mjs", "shift-coach/full-page-proof.mjs", "shift-coach/phantom-members.mjs", "shift-coach/privacy-purpose-review.md", "shift-coach/integration.test.mjs", "shift-coach/life-back.mjs", "shift-coach/memory.mjs", "shift-coach/night-job.mjs", "shift-coach/permissions.mjs", "shift-coach/planning.mjs", "shift-coach/presentation.mjs", "shift-coach/privacy.mjs", "shift-coach/routes.mjs", "shift-coach/safety.mjs", "shift-coach/scope.mjs", "shift-coach/store.mjs", "shift-coach/test-fixture.mjs", "shift-coach/today.mjs", "shift-coach/ui.mjs", "shift-coach/voice.mjs", "shift-coach/worker.mjs", "shift-coach/workerd-proof.cjs", "shift-coach/README.md", "shift-coach/launch-assessment.json", "shift-coach/release-contract.mjs", "shift-coach/release-manifest.json", "shift-coach/release.test.mjs", "wrangler.coaching.jsonc", ".github/workflows/shift-coach-integration.yml"]);
export const COACH_BACKEND_PATHS=new Set(["babylove/dynamic-public.mjs","babylove/dynamic-public.test.mjs","ask-timber-v1.js","tests/ai-fast-stream.test.mjs","member-experience/ai-site-knowledge.mjs","tests/ai-site-knowledge.test.mjs","babylove/release-quality.test.mjs","tests/catalogue-publication-client.test.mjs","tests/member-details-release.test.mjs","product-analytics-v1.js","tests/my-timber-analytics-privacy.test.mjs","release/member-details-rollback.mjs","scripts/verify-article-quality.mjs","release/member-details-preservation.mjs","release/home-banner-live.cjs","continuity-measurement/scorecard.mjs", "member-experience/tests/continuity-measurement.test.mjs", "scripts/verify-public-continuity-live.mjs", "wrangler.jsonc", ".github/workflows/cloudflare-production-promote.yml", "release/app-scope.mjs", "release/app-preflight.mjs", "release/growth-scope.mjs", "release/growth-adopt-deployment.mjs", "release/shift-ai-scope.mjs", "scripts/b1-release-scope.mjs", "tests/b1-release-scope.test.mjs", "tests/shift-ai-release.test.mjs", "release/home-banner-scope.mjs", "release/app-member-live.mjs", "release/member-acceptance-scope.mjs", "release/app-manifest.json", "release/watch-registry-wave-scope.mjs", "release/app-client-proof.mjs", "tests/app-client-proof.test.mjs"]);
// Finite, separately approved editorial payload. Every byte is pinned below.
export const COACH_COMPOSED_BOOK_ADDITIONS=new Set([".github/workflows/book-voice-live-audit.yml", ".github/workflows/book-voice-preview.yml", "book-voice.mjs", "editorial/book-voice/SAMPLES.md", "editorial/book-voice/VOICE.md", "editorial/book-voice/edits.json", "editorial/book-voice/live.cjs", "editorial/book-voice/payload.json", "preview/book-voice/host.mjs", "preview/book-voice/member-host.mjs", "preview/book-voice/provision.mjs", "preview/book-voice/verify.cjs", "preview/book-voice/worker.mjs", "release/book-voice-scope.mjs", "tests/book-voice-release.test.mjs", "tests/book-voice.test.mjs"]);
export const COACH_COMPOSED_BOOK_CHANGES=new Set(["member-experience/public-preservation.mjs", "member-experience/verify-production-member.mjs", "public-startup-stability.mjs", "release/growth-preflight.mjs"]);
// Exact audit corrections, pinned by the release manifest and app hashes.
export const COACH_AUDIT_CHANGES=new Set(['frontend/member/whole-man-intent-os-v1.js','release/app-preflight.mjs','tests/testosterone-public.test.mjs','public-navigation-policy.mjs','tests/public-ticker-contrast-safety.test.mjs','shift-health-public-content.mjs','frontend/member/shift-health-catalogue-v1.js']);
export const COACH_PATHS=new Set([...COACH_ADDITIONS,...COACH_BACKEND_PATHS,...COACH_COMPOSED_BOOK_ADDITIONS,...COACH_COMPOSED_BOOK_CHANGES,...COACH_AUDIT_CHANGES]);
export function assertCoachingChangedPath(status,path){
 const health=DEVICE_HEALTH_DELTA.find(([,p])=>p===path);
 if(health){assert.equal(status,health[0],'Unexpected native health composition status: '+path);return;}
 if(WATCH_COMPOSED_CHANGES.has(path)||WATCH_COMPOSED_ADDITIONS.has(path)){assert.equal(status,WATCH_COMPOSED_ADDITIONS.has(path)?'A':'M','Unexpected Watch composition status: '+path);return;}
 const added=COACH_ADDITIONS.has(path)||COACH_COMPOSED_BOOK_ADDITIONS.has(path);
 assert(added||COACH_BACKEND_PATHS.has(path)||COACH_COMPOSED_BOOK_CHANGES.has(path)||COACH_AUDIT_CHANGES.has(path),'Unlisted coaching release change: '+path);
 assert.equal(status,added?'A':'M','Unexpected change status: '+path);
}
// Preserve the exact reviewed VK3019 and AT673 summaries alongside current coaching.
export const WATCH_CURRENT_BASE='6601ecf56c7d30564b551c5ef90a2ad169b4c4d5';
export const WATCH_COMPOSED_CHANGES=new Set(['medicines-watch/README.md','medicines-watch/data.mjs','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/product-renewal.test.mjs','medicines-watch/source-review.test.mjs']);
export const WATCH_COMPOSED_ADDITIONS=new Set(['medicines-watch/reviews/2026-10-02-authorised-glimr-copd.json','medicines-watch/reviews/2026-10-02-authorised-specialist-registry-followup.json','medicines-watch/reviews/2026-10-02-authorised-switching-studies.json','medicines-watch/reviews/2026-10-02-authorised-na931.json','medicines-watch/reviews/2026-10-03-authorised-amylin-metabolic-followup.json','medicines-watch/reviews/2026-10-03-authorised-azd1043.json','medicines-watch/reviews/2026-10-03-authorised-azd6234-selene.json','medicines-watch/reviews/2026-10-03-authorised-wve007.json','medicines-watch/reviews/2026-10-03-authorised-specialist-registry-wave.json','medicines-watch/reviews/2026-10-03-authorised-lean-mass-energy-followup.json','medicines-watch/reviews/2026-10-03-authorised-foundayo-predicted-risk.json','medicines-watch/reviews/2026-10-03-authorised-wegovy-mash-correction.json','medicines-watch/reviews/2026-10-03-authorised-vk3019-at673.json']);
export const WATCH_CURRENT_PATHS=new Set(['medicines-watch/README.md','medicines-watch/discovery.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-enobosarm-semaglutide.json','medicines-watch/reviews/2026-10-02-authorised-semaglutide-specialist-trials.json',...WATCH_COMPOSED_ADDITIONS]);
const oldEntry='"main": "worker-entry-v6.js"',newEntry='"main": "shift-coach/worker.mjs"';
export function withoutCoachEntrypoint(source){return source.replace(newEntry,oldEntry);}
export function assertCoachingConfiguration(current,previous){
 assert.equal((current.match(/"main"\s*:/g)||[]).length,1,'Exactly one entrypoint required');
 assert(current.includes(newEntry),'Coaching must use the normal production entrypoint');
 assert.equal(withoutCoachEntrypoint(current),previous,'Unrelated production configuration changed');
}
// Historical comparisons still verify the reviewed old bytes; the exact new bytes
// are independently pinned by validateCoachingSource below. No generic exclusion.
export function coachingHistoricalRef(ref,path){
 // These two metadata files compose the separately approved book-copy gate.
 // Their complete current bytes remain required by the coaching pin and app hashes.
 const composedBookGates=new Set(['release/growth-scope.mjs','release/home-banner-scope.mjs']);
 return ref==='HEAD'&&COACH_BACKEND_PATHS.has(path)&&!composedBookGates.has(path)?COACH_BASE:ref;
}
export function validateCoachingSource(read,manifest){
 assert.equal(manifest.recordedMain,COACH_BASE);
 assert.match(manifest.applicationCommit,/^[a-f0-9]{40}$/,'Recorded coaching application source required');
 assert.deepEqual(manifest.pinnedPaths,[...COACH_PATHS].filter(p=>p!=='shift-coach/release-manifest.json').sort(),'Exact coaching path list required');
 for(const p of manifest.pinnedPaths)assert.equal(read('HEAD',p),read(manifest.applicationCommit,p),'Coaching release source drift: '+p);
 for(const p of WATCH_CURRENT_PATHS)assert.equal(read('HEAD',p),read(WATCH_CURRENT_BASE,p),'Current Watch source drift: '+p);
 return {recordedMain:COACH_BASE,applicationCommit:manifest.applicationCommit,paths:manifest.pinnedPaths.length};
}
export function assertLaunchDecisions(manifest){
 const receipt=(key)=>{const d=manifest.decisions?.[key];assert(d?.approved===true,'Launch decision not approved: '+key);for(const field of ['decidedBy','decidedAt','evidence'])assert(typeof d[field]==='string'&&d[field].trim(),'Decision evidence absent: '+key+'.'+field);return d;};
 for(const key of ['boundedScope','privacyAssessment','intendedPurpose','productionLaunch'])receipt(key);
 if(manifest.decisions?.independentAcceptance?.approved===true)receipt('independentAcceptance');
 else{
  // An owner-authorised engineering release is explicitly distinguishable from
  // an independent review. It only covers the exact pinned application payload.
  const owner=receipt('ownerAcceptance');
  assert.equal(owner.engineeringVerified,true,'Owner acceptance needs engineering verification');
  assert.equal(owner.independentReviewCompleted,false,'Do not present owner acceptance as independent review');
  assert.match(owner.applicationCommit||'',/^[a-f0-9]{40}$/,'Owner acceptance source required');
  assert.equal(owner.applicationCommit,manifest.applicationCommit,'Owner acceptance does not cover this payload');
  assert(typeof owner.verificationEvidence==='string'&&owner.verificationEvidence.trim(),'Owner verification evidence absent');
 }
 assert.equal(manifest.completeV2,false,'This contract covers the bounded in-app coach; full v2 needs its own evidence');
 return true;
}
export function verifyCoachingRelease({requireLaunch=false}={}){
 validateDeviceHealthSource();
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 const manifest=JSON.parse(readFileSync(new URL('./release-manifest.json',import.meta.url),'utf8'));
 git('merge-base','--is-ancestor',COACH_BASE,'HEAD');git('merge-base','--is-ancestor',WATCH_CURRENT_BASE,'HEAD');git('merge-base','--is-ancestor',manifest.applicationCommit,'HEAD');
 const proof=validateCoachingSource((ref,p)=>git('rev-parse',ref+':'+p),manifest);
 assertCoachingConfiguration(readFileSync('wrangler.jsonc','utf8'),execFileSync('git',['show',COACH_BASE+':wrangler.jsonc'],{encoding:'utf8'}));
 if(requireLaunch)assertLaunchDecisions(manifest);
 return {...proof,completeV2:false,productionLaunchApproved:manifest.decisions.productionLaunch.approved,requireLaunch};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(verifyCoachingRelease({requireLaunch:process.argv.includes('--require-launch')})));
