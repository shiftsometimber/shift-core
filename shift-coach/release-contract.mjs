import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const COACH_BASE='afa730029198f39b60f6ea82d6469e5681d93575';
export const COACH_ADDITIONS=new Set(["shift-coach/adapt.mjs", "shift-coach/browser-proof.mjs", "shift-coach/clock.mjs", "shift-coach/continue.mjs", "shift-coach/follow-up.mjs", "shift-coach/followup-view.mjs", "shift-coach/full-page-proof.mjs", "shift-coach/privacy-purpose-review.md", "shift-coach/integration.test.mjs", "shift-coach/life-back.mjs", "shift-coach/memory.mjs", "shift-coach/night-job.mjs", "shift-coach/permissions.mjs", "shift-coach/planning.mjs", "shift-coach/presentation.mjs", "shift-coach/privacy.mjs", "shift-coach/routes.mjs", "shift-coach/safety.mjs", "shift-coach/scope.mjs", "shift-coach/store.mjs", "shift-coach/test-fixture.mjs", "shift-coach/today.mjs", "shift-coach/ui.mjs", "shift-coach/voice.mjs", "shift-coach/worker.mjs", "shift-coach/workerd-proof.cjs", "shift-coach/README.md", "shift-coach/launch-assessment.json", "shift-coach/release-contract.mjs", "shift-coach/release-manifest.json", "shift-coach/release.test.mjs", "wrangler.coaching.jsonc", ".github/workflows/shift-coach-integration.yml"]);
export const COACH_BACKEND_PATHS=new Set(["wrangler.jsonc", ".github/workflows/cloudflare-production-promote.yml", "release/app-scope.mjs", "release/app-preflight.mjs", "release/growth-scope.mjs", "release/growth-adopt-deployment.mjs", "release/shift-ai-scope.mjs", "scripts/b1-release-scope.mjs", "tests/shift-ai-release.test.mjs", "release/home-banner-scope.mjs", "release/app-member-live.mjs", "release/member-acceptance-scope.mjs", "release/app-manifest.json", "release/watch-registry-wave-scope.mjs"]);
export const COACH_PATHS=new Set([...COACH_ADDITIONS,...COACH_BACKEND_PATHS]);
export const WATCH_CURRENT_PATHS=new Set(['medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-02-authorised-enobosarm-semaglutide.json','medicines-watch/reviews/2026-10-02-authorised-semaglutide-specialist-trials.json']);
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
 for(const p of WATCH_CURRENT_PATHS)assert.equal(read('HEAD',p),read(COACH_BASE,p),'Current Watch source drift: '+p);
 return {recordedMain:COACH_BASE,applicationCommit:manifest.applicationCommit,paths:manifest.pinnedPaths.length};
}
export function assertLaunchDecisions(manifest){
 const required=['boundedScope','privacyAssessment','intendedPurpose','independentAcceptance','productionLaunch'];
 for(const key of required){const d=manifest.decisions?.[key];assert(d?.approved===true,'Launch decision not approved: '+key);for(const field of ['decidedBy','decidedAt','evidence'])assert(typeof d[field]==='string'&&d[field].trim(),'Decision evidence absent: '+key+'.'+field);}
 assert.equal(manifest.completeV2,false,'This contract covers the bounded in-app coach; full v2 needs its own evidence');
 return true;
}
export function verifyCoachingRelease({requireLaunch=false}={}){
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 const manifest=JSON.parse(readFileSync(new URL('./release-manifest.json',import.meta.url),'utf8'));
 git('merge-base','--is-ancestor',COACH_BASE,'HEAD');git('merge-base','--is-ancestor',manifest.applicationCommit,'HEAD');
 const proof=validateCoachingSource((ref,p)=>git('rev-parse',ref+':'+p),manifest);
 assertCoachingConfiguration(readFileSync('wrangler.jsonc','utf8'),execFileSync('git',['show',COACH_BASE+':wrangler.jsonc'],{encoding:'utf8'}));
 if(requireLaunch)assertLaunchDecisions(manifest);
 return {...proof,completeV2:false,productionLaunchApproved:manifest.decisions.productionLaunch.approved,requireLaunch};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(verifyCoachingRelease({requireLaunch:process.argv.includes('--require-launch')})));
