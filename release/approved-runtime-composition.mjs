import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';

export const COMPOSITION_BASE='e9d8ca70c6cd969bbd02caee31deb1f8b12bb67f';
export const COMPOSITION_SOURCE='63993a0ce480a4aa5c7a1d47017c682dccc837f1';
export const SUPPORT_SOURCE='ec3b9bcc2e4909087246fc343dcaad35141de576';
export const HQ_SOURCE='5e2a6bbe7714fe098eebfa22bc7acbe9e3d2d5c2';
export const COMPOSITION_PATHS=[
'.github/workflows/hq-management-release.yml','HQ-MANAGEMENT-RELEASE.md',
'continuity-measurement/scorecard.mjs','docs/AFTER-TREATMENT-EVIDENCE-BOUNDARIES-2026-10-07.md',
'frontend/member/member-product-v33d.js','frontend/member/member-shell-v33g.js',
'frontend/member/my-timber-preview.html','frontend/member/my-timber-v11.js',
'hq-ai-v2.js','hq-management-acceptance.mjs','hq-management-api.mjs',
'hq-management-browser-acceptance.mjs','hq-management-deploy.mjs','hq-management-entry.mjs',
'hq-management-gateway-acceptance.mjs','hq-management-public-preservation.mjs','hq-management-release-gate.mjs',
'member-experience/ai-site-knowledge.mjs','member-experience/entry.mjs',
'member-experience/tests/continuity-measurement.test.mjs','member-experience/tests/shared-arrival.test.mjs',
'my-timber-navigation-gate.mjs','product-analytics-v1.js','public-continuity.mjs',
'public-promise-accuracy-v1.mjs','public-seo-discovery.mjs','shift-coach/memory.mjs','shift-coach/ui.mjs',
'tests/ai-site-knowledge.test.mjs','tests/my-timber-analytics-privacy.test.mjs',
'tests/promise-accuracy.test.mjs','tests/public-continuity.test.mjs','tests/public-seo-discovery.test.mjs',
'worker-entry-v6.js','worker.js','wrangler.hq-management.jsonc'];
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sorted=xs=>[...xs].sort();
export function verifyComposedRuntime({head=git('rev-parse','HEAD'),read=(ref,path)=>git('rev-parse',ref+':'+path),diff=(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b)}={}){
 // The composition is a concrete immutable tree, not an expanded allowlist.
 assert.match(head,/^[a-f0-9]{40}$/);
 for(const ref of [COMPOSITION_BASE,SUPPORT_SOURCE,HQ_SOURCE,COMPOSITION_SOURCE])ancestor(ref,head);
 assert.deepEqual(sorted(diff(COMPOSITION_BASE,COMPOSITION_SOURCE)),sorted(COMPOSITION_PATHS),'Unreviewed composition path set');
 // This foundational check accepts no later file changes. A separate reviewed
 // maintenance receipt is required before connecting it to production guards.
 assert.deepEqual(sorted(diff(COMPOSITION_SOURCE,head)),[],'Unreviewed changes after approved composition');
 for(const path of COMPOSITION_PATHS)assert.equal(read(head,path),read(COMPOSITION_SOURCE,path),'Approved composition source drift: '+path);
 for(const path of ['wrangler.jsonc','package.json','package-lock.json',
 '.github/workflows/cloudflare-production-promote.yml','acquisition-activation/consent.mjs',
 'activation-measurement/assets.mjs','shift-coach/worker.mjs','shift-coach/release-manifest.json',
 'public-seo-context.mjs','public-seo-organic-links.mjs','public-seo-organic-link-data.mjs'])
 assert.equal(read(head,path),read(COMPOSITION_BASE,path),'Approved composition protected boundary drift: '+path);
 return {source:COMPOSITION_SOURCE,base:COMPOSITION_BASE,head,paths:COMPOSITION_PATHS.length};
}

export const RELOAD_VERIFIER='8d84eb29eb74c3f156ce0ee815cc2d1c644be1e9';
export const RELOAD_RUN=37763695261;
export const RELOAD_PAYLOAD=['rendered-member-acceptance-support.mjs','tests/rendered-member-acceptance-support.test.mjs','tests/member-reload-browser.test.mjs'];
export const RECONCILIATION_MANIFEST='release/approved-runtime-composition.json';
export const RECONCILIATION_MAINTENANCE=[
 'release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs',
 'release/organic-followthrough-scope.mjs','release/seo-link-repairs-scope.mjs',
 'release/seo-growth-scope.mjs','release/app-scope.mjs',
 'scripts/b1-release-scope.mjs','tests/organic-followthrough-release.test.mjs','release/device-health-scope.mjs','release/footer-scope.mjs','tests/seo-growth-release.test.mjs','release/owner-captured-runtime.mjs','tests/owner-captured-runtime.test.mjs','shift-coach/cancelled-release-recovery.mjs','shift-coach/recover-cancelled-release.mjs','release/growth-adopt-deployment.mjs','release/member-acceptance-scope.mjs','shift-coach/scope.mjs','shift-me-source-gate.mjs','release/metrics-connection-scope.mjs','release/seo-context-scope.mjs','release/seo-discovery-scope.mjs','release/seo-follow-through-scope.mjs','release/fit-300-scope.mjs','tests/production-completion-release.test.mjs','.github/workflows/cloudflare-production-promote.yml','.github/workflows/online-privacy-recovery-proof.yml','.github/workflows/shift-coach-integration.yml','.github/workflows/organic-followthrough-proof.yml','.github/workflows/seo-link-repairs-proof.yml','.github/workflows/seo-growth-proof.yml','acquisition-activation/metrics-release.test.mjs','shift-coach/release.test.mjs','tests/growth-release.test.mjs','shift-coach/browser-proof.mjs','shift-coach/full-page-proof.mjs','shift-coach/phantom-members.mjs','shift-coach/browser-journey-support.mjs','release/watch-registry-wave-scope.mjs','release/sitewide-seo-scope.mjs','release/treatment-guidance-scope.mjs',...RELOAD_PAYLOAD];
// A finite factual amendment after the independently checked runtime composition.
// Neither its exact eight-file source nor its hosted proof can be replaced by a
// matching path prefix, later commit, successful HTTP check or editorial authority.
export const WATCH_FACTUAL_UPDATE_BASE='56bba771e9a4006b788bd8fb40358baa3d737dd0';
export const WATCH_FACTUAL_UPDATE_SOURCE='66236803a719f13d212ad27d032c87e699c9418c';
export const WATCH_FACTUAL_UPDATE_RUN=37797195698;
export const WATCH_FACTUAL_UPDATE_PATHS=['medicines-watch/README.md','medicines-watch/credibility.mjs','medicines-watch/credibility.test.mjs','medicines-watch/evidence-desk.test.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/knowledge.test.mjs','medicines-watch/reviews/2026-10-08-authorised-zupreme-lifecycle-update.json'];
export const WATCH_FACTUAL_UPDATE_MAINTENANCE=['release/approved-runtime-composition.mjs','release/watch-registry-wave-scope.mjs','tests/approved-runtime-composition.test.mjs','shift-coach/release.test.mjs'];
export function assertWatchFactualUpdateProof(proof){
 assert.equal(proof.id,WATCH_FACTUAL_UPDATE_RUN);assert.equal(proof.head_sha,WATCH_FACTUAL_UPDATE_SOURCE);
 assert.equal(proof.path,'.github/workflows/medicines-watch-check.yml');assert.equal(proof.event,'pull_request');
 assert.equal(proof.head_branch,'review/watch-zupreme-lifecycle-20261008');
 assert.equal(proof.status,'completed');assert.equal(proof.conclusion,'success');return proof;
}
export async function verifyWatchFactualUpdateProof(get){return assertWatchFactualUpdateProof(await get('/actions/runs/'+WATCH_FACTUAL_UPDATE_RUN));}
// Exact receipt retrieval repair: later reruns cannot replace the accepted attempt.
export const RELOAD_ATTEMPT_BASE='afe0b80d3e7d7f813c53a659c619ba13b86f6ae4';
export const RELOAD_ATTEMPT_PATHS=['release/member-acceptance-scope.mjs','tests/reload-proof-attempt.test.mjs','release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs','.github/workflows/cloudflare-production-promote.yml','release/watch-observation-seed.mjs','tests/watch-observation-seed.test.mjs'];
const RELOAD_ATTEMPT_SET=new Set(RELOAD_ATTEMPT_PATHS);
export function verifyReloadAttemptExtension(c,{head,read,diff,ancestor}){
 assert(c,'Exact reload-attempt receipt repair required');assert.equal(c.proof,'EXACT_RELOAD_ATTEMPT_RECEIPT_V1');assert.equal(c.base,RELOAD_ATTEMPT_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,RELOAD_ATTEMPT_PATHS);
 for(const flag of ['runtimeChanged','customerDataChanged','acceptanceAssertionsWeakened'])assert.equal(c[flag],false);
 ancestor(c.base,c.source);ancestor(c.source,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated reload-attempt receipt repair source');
 assert.deepEqual(sorted(diff(c.source,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after reload-attempt receipt repair');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition maintenance source drift: Serving rollback NHS article oral canonical source drift / Reload-attempt receipt source drift: '+path);
 return c;
}

export const LOGOUT_ADOPTION_BASE='b5bd9e34e4869d398884b5317c9234e00d53b6dc';
export const LOGOUT_NAVIGATION_SOURCE='5a478068f8169aba4bd1ed098cb6e43d8096d569';
export const LOGOUT_NAVIGATION_RUN=37847675774;
export const LOGOUT_NAVIGATION_JOB=113552515994;
export const LOGOUT_ADOPTION_PATHS=['health-passport/production-browser.mjs','tests/member-reload-browser.test.mjs','release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs','release/member-acceptance-scope.mjs','tests/reload-proof-attempt.test.mjs'];
const LOGOUT_ADOPTION_SET=new Set(LOGOUT_ADOPTION_PATHS);
const LOGOUT_OLD="await page.locator('[data-member-logout]').click();await page.waitForFunction";
const LOGOUT_NEW="await page.locator('[data-member-logout]').click();await page.waitForURL(url=>url.origin===site&&url.pathname==='/member-login',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForFunction";
export function assertLogoutBoundary(before,after){
 assert.equal(before.split(LOGOUT_OLD).length,2,'Exactly one actual logout boundary required');
 assert.equal(after,before.replace(LOGOUT_OLD,LOGOUT_NEW),'Logout verification may only await the real sign-in document; retain every privacy assertion');
}
export function verifyLogoutAdoption(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_LOGOUT_NAVIGATION_V1');assert.equal(c.base,LOGOUT_ADOPTION_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,LOGOUT_ADOPTION_PATHS);
 for(const flag of ['runtimeChanged','customerDataChanged','acceptanceAssertionsWeakened'])assert.equal(c[flag],false);
 ancestor(c.base,c.source);ancestor(c.source,head);ancestor(RELOAD_VERIFIER,LOGOUT_NAVIGATION_SOURCE);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated logout verification source');
 assert.deepEqual(sorted(diff(c.source,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after logout verification');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition maintenance source drift: Serving rollback NHS article oral canonical source drift / Logout navigation source drift: '+path);
 assertLogoutBoundary(content(c.base,'health-passport/production-browser.mjs'),content('HEAD','health-passport/production-browser.mjs'));
 assertLogoutBoundary(content(RELOAD_VERIFIER,'health-passport/production-browser.mjs'),content(LOGOUT_NAVIGATION_SOURCE,'health-passport/production-browser.mjs'));
 assert.equal(read('HEAD','tests/member-reload-browser.test.mjs'),read(LOGOUT_NAVIGATION_SOURCE,'tests/member-reload-browser.test.mjs'));
 return c;
}
export function assertLogoutNavigationReceipt(run,job){
 assert.equal(run?.id,LOGOUT_NAVIGATION_RUN);assert.equal(run.run_attempt,1);assert.equal(run.head_sha,LOGOUT_NAVIGATION_SOURCE);
 assert.equal(run.path,'.github/workflows/my-timber-final-production.yml');assert.equal(run.head_branch,'fix/member-reload-navigation-20261007');assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 assert.equal(job?.id,LOGOUT_NAVIGATION_JOB);assert.equal(job.run_id,LOGOUT_NAVIGATION_RUN);assert.equal(job.run_attempt,1);assert.equal(job.name,'reload-navigation-diagnostics');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');
 for(const number of [8,9,11,12,14,15]){const step=job.steps?.find(s=>s.number===number);assert.equal(step?.status,'completed','Every complete logout/member round is required');assert.equal(step?.conclusion,'success','Every complete logout/member round is required');}
 return {id:run.id,sha:run.head_sha,path:run.path,conclusion:run.conclusion,attempt:1,rounds:3};
}

// Finite engineering amendment: bounded read-only GitHub transport recovery.
export const PROOF_TRANSPORT_BASE='476a151c2c0d4aa28e098205d1b0bda64410a783';
export const PROOF_TRANSPORT_SOURCE='d601b545686a74dfe51c6f57a5712b11fba510f9';
export const PROOF_TRANSPORT_PATHS=['release/growth-preflight.mjs','release/github-proof-get.mjs','tests/github-proof-get.test.mjs'];
export const PROOF_TRANSPORT_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs'];
export const RECONCILIATION_PATHS=new Set([...COMPOSITION_PATHS,...RECONCILIATION_MAINTENANCE,RECONCILIATION_MANIFEST,...WATCH_FACTUAL_UPDATE_PATHS,...WATCH_FACTUAL_UPDATE_MAINTENANCE,...PROOF_TRANSPORT_PATHS,...PROOF_TRANSPORT_MAINTENANCE]);
for(const path of RELOAD_ATTEMPT_PATHS)RECONCILIATION_PATHS.add(path);
for(const path of LOGOUT_ADOPTION_PATHS)RECONCILIATION_PATHS.add(path);
export const PUBLIC_TOOL_BASE='e8592710a52bc0c7a551798bf426d32e59409caf';
export const PUBLIC_TOOL_SOURCE='3ba486a87df2ee859fcd579263b5211f338fbf04';
export const PUBLIC_TOOL_PAYLOAD=['public-tool-delivery.mjs','shift-coach/worker.mjs','tests/public-tool-delivery.test.mjs','member-experience/entry.mjs','member-experience/tests/shared-arrival.test.mjs','public-continuity.mjs','tests/public-continuity.test.mjs'];
export const PUBLIC_TOOL_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/public-tool-release.test.mjs','release/live-support-runtime.mjs','tests/live-support-runtime.test.mjs','shift-coach/recover-cancelled-release.mjs','shift-coach/cancelled-release-recovery.mjs','release/growth-adopt-deployment.mjs'];
const publicToolImmutableFacts=new Map();
const publicToolImmutableGit=(...args)=>{const key=JSON.stringify([process.cwd(),...args]);if(!publicToolImmutableFacts.has(key))publicToolImmutableFacts.set(key,git(...args));return publicToolImmutableFacts.get(key);};
const PUBLIC_TOOL_PATHS=new Set([...PUBLIC_TOOL_PAYLOAD,...PUBLIC_TOOL_MAINTENANCE]);
for(const path of PUBLIC_TOOL_PATHS)RECONCILIATION_PATHS.add(path);
export function verifyPublicToolExtension(c,{head,read,diff,ancestor}={}){
 assert(c,'Exact public-tool extension receipt required');
 assert.equal(c.proof,'EXACT_PUBLIC_TOOL_DELIVERY_V1');
 assert.equal(c.base,PUBLIC_TOOL_BASE);assert.equal(c.payloadSource,PUBLIC_TOOL_SOURCE);
 assert.equal(c.supportSnapshotSource,'e7c78344694a0101a8105004356b96d3a2066197');
 assert.deepEqual(c.payloadPaths,PUBLIC_TOOL_PAYLOAD);assert.deepEqual(c.maintenancePaths,PUBLIC_TOOL_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.match(head,/^[a-f0-9]{40}$/);
 assert.equal(c.publicCopyChanged,false);assert.equal(c.ratingsInvented,false);
 assert.equal(c.homepageChanged,false);assert.equal(c.privateCacheChanged,false);
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource,c.supportSnapshotSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.payloadSource)),sorted(PUBLIC_TOOL_PAYLOAD),'Unrelated public-tool payload change');
 assert.deepEqual(sorted(diff(c.payloadSource,c.maintenanceSource)),sorted(PUBLIC_TOOL_MAINTENANCE),'Unrelated public-tool verifier change');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after public-tool receipt');
 for(const path of PUBLIC_TOOL_PAYLOAD)assert.equal(read('HEAD',path),read(c.payloadSource,path),'Approved composition source / boundary drift: Public-tool payload source drift: '+path);
 for(const path of PUBLIC_TOOL_MAINTENANCE)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Public-tool maintenance source drift: '+path);
 for(const path of ['member-experience/entry.mjs','member-experience/tests/shared-arrival.test.mjs','public-continuity.mjs','tests/public-continuity.test.mjs'])assert.equal(read(c.payloadSource,path),read(c.supportSnapshotSource,path),'Captured serving support source drift: '+path);
 return c;
}
// Preserve the exact approved Programme release while repairing verification only.
export const PUBLIC_TOOL_PROOF_RETRY_BASE='36dd6f16835d1de68523437224b7c87dabe305e7';
export const PUBLIC_TOOL_PROOF_RETRY_PATHS=['release/approved-runtime-composition.mjs','release/live-support-runtime.mjs','tests/live-support-runtime.test.mjs','release/ai-response-proof.mjs','release/shift-ai-live.mjs','tests/ai-response-retry.test.mjs','tests/public-tool-proof-retry.test.mjs'];
const PUBLIC_TOOL_PROOF_RETRY_SET=new Set(PUBLIC_TOOL_PROOF_RETRY_PATHS);
for(const path of PUBLIC_TOOL_PROOF_RETRY_PATHS)RECONCILIATION_PATHS.add(path);
export function verifyPublicToolProofRetry(c,{head,read,diff,ancestor}){
 assert(c,'Public-tool proof retry receipt required');assert.equal(c.proof,'EXACT_PUBLIC_TOOL_PROOF_RETRY_V1');assert.equal(c.base,PUBLIC_TOOL_PROOF_RETRY_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,PUBLIC_TOOL_PROOF_RETRY_PATHS);
 assert.equal(c.publicCopyChanged,false);assert.equal(c.aiRuntimeChanged,false);assert.equal(c.customerDataChanged,false);
 ancestor(c.base,c.source);ancestor(c.source,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(PUBLIC_TOOL_PROOF_RETRY_PATHS),'Unrelated public-tool proof retry source');
 assert.deepEqual(sorted(diff(c.source,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after public-tool proof retry');
 for(const path of PUBLIC_TOOL_PROOF_RETRY_PATHS)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition maintenance source drift: Public-tool proof retry source drift: '+path);
}


// Finite repair of the approved canonical anchor inserted after the earlier link pass.
export const ORAL_CANONICAL_BASE='6752fd02823377b9faf4b1a81a83d7b0a26ba79b';
export const ORAL_CANONICAL_SOURCE='3ba744802b9334370e1c0124edfb8cb4cf1e142c';
export const ORAL_CANONICAL_PATHS=["public-practical-guides.mjs","tests/practical-guides.test.mjs","release/live-support-runtime.mjs","tests/live-support-runtime.test.mjs"];
export const ORAL_CANONICAL_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs','.github/workflows/practical-guides-proof.yml','scripts/verify-practical-guides-handler.mjs','release/six-topic-seo-scope.mjs','scripts/verify-practical-guides.mjs'];
const ORAL_CANONICAL_SET=new Set([...ORAL_CANONICAL_PATHS,...ORAL_CANONICAL_MAINTENANCE]);
for(const path of ORAL_CANONICAL_SET)RECONCILIATION_PATHS.add(path);
export function verifyOralCanonicalRepair(c,{head,read,diff,ancestor}){
 assert(c);assert.equal(c.proof,'EXACT_ORAL_CANONICAL_REPAIR_V1');
 assert.equal(c.base,ORAL_CANONICAL_BASE);assert.equal(c.source,ORAL_CANONICAL_SOURCE);
 assert.deepEqual(c.paths,ORAL_CANONICAL_PATHS);assert.deepEqual(c.maintenancePaths,ORAL_CANONICAL_MAINTENANCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.equal(c.runtimeChanged,true);assert.equal(c.approvedAnchorChanged,true);
 for(const flag of ['publicCopyChanged','medicalContentChanged','customerDataChanged'])assert.equal(c[flag],false);
 for(const ref of [c.base,c.source,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated oral canonical repair payload');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated oral canonical repair reconciliation');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after oral canonical repair');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition maintenance source drift: Serving rollback NHS article oral canonical source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Serving rollback NHS article oral canonical maintenance source drift: '+path);
}

// Exact verifier reconciliation after run 37833478472 rejected the already-approved
// NHS continuity panel/date and safely restored the independently verified runtime.
export const NHS_ARTICLE_PROOF_BASE='535da9c06fe4ad30375387293ea25f62277e45f6';
export const NHS_ARTICLE_PROOF_SOURCE='342ad2d537a89f4a915038381000343bcdb06443';
export const NHS_ARTICLE_PROOF_PATHS=["release/seo794-preservation.mjs","editorial/five-articles/proof.mjs","tests/seo794-preservation.test.mjs","release/live-support-runtime.mjs","tests/live-support-runtime.test.mjs"];
export const NHS_ARTICLE_PROOF_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs'];
const NHS_ARTICLE_PROOF_SET=new Set([...NHS_ARTICLE_PROOF_PATHS,...NHS_ARTICLE_PROOF_MAINTENANCE]);
for(const path of NHS_ARTICLE_PROOF_SET)RECONCILIATION_PATHS.add(path);
export function verifyNhsArticleProofRefresh(c,{head,read,diff,ancestor}){
 assert(c,'Exact NHS article proof refresh receipt required');
 assert.equal(c.proof,'EXACT_NHS_ARTICLE_PROOF_REFRESH_V1');
 assert.equal(c.base,NHS_ARTICLE_PROOF_BASE);assert.equal(c.source,NHS_ARTICLE_PROOF_SOURCE);
 assert.deepEqual(c.paths,NHS_ARTICLE_PROOF_PATHS);assert.deepEqual(c.maintenancePaths,NHS_ARTICLE_PROOF_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 for(const flag of ['publicCopyChanged','runtimeChanged','medicalContentChanged','customerDataChanged'])assert.equal(c[flag],false);
 for(const ref of [c.base,c.source,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated NHS article proof source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated NHS article proof reconciliation');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after NHS article proof refresh');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition maintenance source drift: Serving rollback NHS article source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Serving rollback NHS article maintenance source drift: '+path);
}

// Finite runtime-receipt refresh after the failed release safety rollback.
export const SUPPORT_ROLLBACK_BASE='166c04ab20ec379826bfa1da625d38c98125d376';
export const SUPPORT_ROLLBACK_SOURCE='5f3909796e24f865a9d459be8749dde6a88a1a40';
export const SUPPORT_ROLLBACK_PATHS=['release/live-support-runtime.mjs','tests/live-support-runtime.test.mjs'];
export const SUPPORT_ROLLBACK_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs'];
const SUPPORT_ROLLBACK_SET=new Set([...SUPPORT_ROLLBACK_PATHS,...SUPPORT_ROLLBACK_MAINTENANCE]);
for(const path of SUPPORT_ROLLBACK_SET)RECONCILIATION_PATHS.add(path);
export function verifySupportRollbackRefresh(c,{head,read,diff,ancestor}){
 assert(c,'Exact serving rollback refresh receipt required');
 assert.equal(c.proof,'EXACT_SUPPORT_ROLLBACK_REFRESH_V1');
 assert.equal(c.base,SUPPORT_ROLLBACK_BASE);assert.equal(c.source,SUPPORT_ROLLBACK_SOURCE);
 assert.deepEqual(c.paths,SUPPORT_ROLLBACK_PATHS);assert.deepEqual(c.maintenancePaths,SUPPORT_ROLLBACK_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.equal(c.publicCopyChanged,false);assert.equal(c.runtimeChanged,false);assert.equal(c.medicalContentChanged,false);assert.equal(c.customerDataChanged,false);
 for(const ref of [c.base,c.source,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(SUPPORT_ROLLBACK_PATHS),'Unrelated serving rollback refresh source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(SUPPORT_ROLLBACK_MAINTENANCE),'Unrelated serving rollback refresh reconciliation');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after serving rollback refresh');
 for(const path of SUPPORT_ROLLBACK_PATHS)assert.equal(read('HEAD',path),read(c.source,path),'Serving rollback source drift: '+path);
 for(const path of SUPPORT_ROLLBACK_MAINTENANCE)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Serving rollback maintenance source drift: '+path);
}

// Finite verifier-only repair after an owner-confirmed current-main production dispatch.
// The exact two-file source and two-file reconciliation are immutable; this does
// not approve article copy, runtime behaviour, customer data or medical content.
export const ORAL_LIVE_DISPATCH_BASE='9ecf2fe50774412c82f473975e4b650518428a90';
export const ORAL_LIVE_DISPATCH_SOURCE='fac81ea46b9c49adcbae5b9f4910de3632f1992a';
export const ORAL_LIVE_DISPATCH_PATHS=['babylove/release-quality.test.mjs','babylove/verify-oral-live.mjs'];
export const ORAL_LIVE_DISPATCH_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/approved-runtime-composition.test.mjs'];
const ORAL_LIVE_DISPATCH_SET=new Set([...ORAL_LIVE_DISPATCH_PATHS,...ORAL_LIVE_DISPATCH_MAINTENANCE]);
for(const path of ORAL_LIVE_DISPATCH_SET)RECONCILIATION_PATHS.add(path);
export function verifyOralLiveDispatchGuard(c,{head,read,diff,ancestor}){
 assert(c,'Exact oral live dispatch guard receipt required');
 assert.equal(c.proof,'EXACT_ORAL_LIVE_DISPATCH_GUARD_V1');
 assert.equal(c.base,ORAL_LIVE_DISPATCH_BASE);assert.equal(c.source,ORAL_LIVE_DISPATCH_SOURCE);
 assert.deepEqual(c.paths,ORAL_LIVE_DISPATCH_PATHS);assert.deepEqual(c.maintenancePaths,ORAL_LIVE_DISPATCH_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.equal(c.publicCopyChanged,false);assert.equal(c.runtimeChanged,false);assert.equal(c.medicalContentChanged,false);assert.equal(c.customerDataChanged,false);
 for(const ref of [c.base,c.source,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(ORAL_LIVE_DISPATCH_PATHS),'Unrelated oral live dispatch guard source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(ORAL_LIVE_DISPATCH_MAINTENANCE),'Unrelated oral live dispatch guard reconciliation');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after oral live dispatch guard');
 for(const path of ORAL_LIVE_DISPATCH_PATHS)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Oral dispatch source drift: '+path);
 for(const path of ORAL_LIVE_DISPATCH_MAINTENANCE)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Oral dispatch maintenance source drift: '+path);
}

// Owner's 8 October Go authorises this finite Programme demonstration.
export const PROGRAMME_DAY_BASE='d2ff6e0ef00d0a1a3907d9184afd64a3aa40c374';
export const PROGRAMME_DAY_SOURCE='0fe0bc85717b60bdcf7b0a75c9e96b2c3644409a';
export const PROGRAMME_DAY_PAYLOAD=['.github/workflows/programme-day-preview.yml','growth-member-public.mjs','programme-day.mjs','release/growth-preservation.mjs','scripts/verify-programme-day.cjs','tests/programme-day.test.mjs','tests/growth-release.test.mjs'];
export const PROGRAMME_DAY_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/programme-day-release.test.mjs'];
const PROGRAMME_DAY_PATHS=new Set([...PROGRAMME_DAY_PAYLOAD,...PROGRAMME_DAY_MAINTENANCE]);
for(const path of PROGRAMME_DAY_PATHS)RECONCILIATION_PATHS.add(path);
export function verifyProgrammeDayExtension(c,{head,read,diff,ancestor}){
 assert(c,'Programme day receipt required');assert.equal(c.proof,'EXACT_PROGRAMME_DAY_V1');
 assert.equal(c.base,PROGRAMME_DAY_BASE);assert.equal(c.payloadSource,PROGRAMME_DAY_SOURCE);
 assert.deepEqual(c.payloadPaths,PROGRAMME_DAY_PAYLOAD);assert.deepEqual(c.maintenancePaths,PROGRAMME_DAY_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.equal(c.approval,'Go');
 assert.equal(c.homepageChanged,false);assert.equal(c.clinicalAvailabilityChanged,false);assert.equal(c.memberBehaviourChanged,false);
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.payloadSource)),sorted(PROGRAMME_DAY_PAYLOAD),'Unrelated Programme payload change');
 assert.deepEqual(sorted(diff(c.payloadSource,c.maintenanceSource)),sorted(PROGRAMME_DAY_MAINTENANCE),'Unrelated Programme verifier change');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Programme receipt');
 for(const path of PROGRAMME_DAY_PAYLOAD)assert.equal(read('HEAD',path),read(c.payloadSource,path),'Approved composition source / boundary drift: Programme payload source drift: '+path);
 for(const path of PROGRAMME_DAY_MAINTENANCE)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Programme verifier source drift: '+path);
 return c;
}
export const PROGRAMME_PREFLIGHT_BASE='f7999b2be44afd6e6e506762afa860efe5e4e242';
export const PROGRAMME_PREFLIGHT_SOURCE='33aaaa2f87790b165d4c4ff7a0612ee9d247bdc1';
export const PROGRAMME_PREFLIGHT_PAYLOAD=['release/growth-preflight.mjs','.github/workflows/programme-day-preview.yml','tests/programme-day-release.test.mjs'];
export const PROGRAMME_PREFLIGHT_MAINTENANCE=['release/approved-runtime-composition.mjs'];
const PROGRAMME_PREFLIGHT_PATHS=new Set([...PROGRAMME_PREFLIGHT_PAYLOAD,...PROGRAMME_PREFLIGHT_MAINTENANCE]);
for(const path of PROGRAMME_PREFLIGHT_PATHS)RECONCILIATION_PATHS.add(path);
export function verifyProgrammeDayPreflightExtension(c,{head,read,diff,ancestor}){
 assert(c);assert.equal(c.proof,'EXACT_PROGRAMME_PREFLIGHT_V1');assert.equal(c.base,PROGRAMME_PREFLIGHT_BASE);assert.equal(c.payloadSource,PROGRAMME_PREFLIGHT_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.payloadPaths,PROGRAMME_PREFLIGHT_PAYLOAD);assert.deepEqual(c.maintenancePaths,PROGRAMME_PREFLIGHT_MAINTENANCE);
 for(const ref of [c.base,c.payloadSource,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff(c.base,c.payloadSource)),sorted(c.payloadPaths));assert.deepEqual(sorted(diff(c.payloadSource,c.maintenanceSource)),sorted(c.maintenancePaths));assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST]);
 for(const path of c.payloadPaths)assert.equal(read('HEAD',path),read(c.payloadSource,path),'Approved composition maintenance source drift: Programme preflight source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Programme preflight verifier source drift: '+path);return c;
}
export const SERVING_SEO_BASE='a5e75ea0da68823c786316e7fe6a9e4762ed00f9';
export const SERVING_SEO_SOURCE='2a26d8e252c2f2c2221103b5f72c15ec1730db89';
export const SERVING_SEO_CAPTURE='fa481b8193551cea1b8a7fe496ebc0cf70aa0a74';
export const SERVING_SEO_CAPTURE_PATHS=['public-continuity.mjs','public-seo-closeout.mjs','tests/public-seo-closeout.test.mjs','worker-entry-v6.js'];
export const SERVING_SEO_PATHS=[...SERVING_SEO_CAPTURE_PATHS,'release/live-support-runtime.mjs','tests/live-support-runtime.test.mjs'];
export const SERVING_SEO_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/serving-seo-runtime-release.test.mjs','tests/approved-runtime-composition.test.mjs','.github/workflows/practical-guides-proof.yml','scripts/verify-practical-guides-handler.mjs','scripts/verify-practical-guides.mjs'];
const SERVING_SEO_SET=new Set([...SERVING_SEO_PATHS,...SERVING_SEO_MAINTENANCE]);for(const path of SERVING_SEO_SET)RECONCILIATION_PATHS.add(path);
export function verifyServingSeoCapture(c,{head,read,diff,ancestor}){
 assert(c);assert.equal(c.proof,'EXACT_SERVING_SEO_CAPTURE_V1');assert.equal(c.base,SERVING_SEO_BASE);assert.equal(c.source,SERVING_SEO_SOURCE);assert.equal(c.capture,SERVING_SEO_CAPTURE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 assert.deepEqual(c.paths,SERVING_SEO_PATHS);assert.deepEqual(c.maintenancePaths,SERVING_SEO_MAINTENANCE);
 assert.equal(c.preserveServingSeo,true);for(const flag of ['homepageChanged','clinicalAvailabilityChanged','customerDataChanged','stockChanged','memberBehaviourChanged'])assert.equal(c[flag],false);
 for(const ref of [c.base,c.source,c.capture,c.maintenanceSource])ancestor(ref,head);
 assert.deepEqual(sorted(diff('e7c78344694a0101a8105004356b96d3a2066197',c.capture)),sorted(SERVING_SEO_CAPTURE_PATHS),'Unrelated serving capture change');
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated serving SEO source change');assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths));assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST]);
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Serving SEO source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Serving SEO verifier drift: '+path);
 for(const path of SERVING_SEO_CAPTURE_PATHS)assert.equal(read(c.source,path),read(c.capture,path),'Captured serving SEO source differs: '+path);
}

export const PROGRAMME_CLOSEOUT_BASE='fa5d9bc37b2f88006e6f16498144b27ff10bd17e';
export const PROGRAMME_CLOSEOUT_SOURCE='40d37937248d94b32b63e0fd9b5d3afd8693ba3f';
export const PROGRAMME_CLOSEOUT_PATHS=['release/live-support-runtime.mjs','tests/live-support-runtime.test.mjs','scripts/verify-public-continuity-live.mjs','release/public-continuity-body-proof.mjs','tests/programme-day-continuity-body.test.mjs','.github/workflows/cloudflare-production-promote.yml'];
export const PROGRAMME_CLOSEOUT_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/programme-day-closeout-release.test.mjs'];
const PROGRAMME_CLOSEOUT_SET=new Set([...PROGRAMME_CLOSEOUT_PATHS,...PROGRAMME_CLOSEOUT_MAINTENANCE]);
for(const path of PROGRAMME_CLOSEOUT_SET)RECONCILIATION_PATHS.add(path);
export const PROGRAMME_LIVE_GATE='      - name: Verify approved Programme day and catalogue artwork live\n        run: PROGRAMME_DAY_LIVE=true PLAYWRIGHT_MODULE="$RUNNER_TEMP/heading-tools/node_modules/playwright" node scripts/verify-programme-day.cjs\n';
export function withoutProgrammeLiveGate(workflow){
 assert.equal(workflow.split(PROGRAMME_LIVE_GATE).length,2,'Exactly one approved live Programme gate required');
 return workflow.replace(PROGRAMME_LIVE_GATE,'');
}
export function verifyProgrammeCloseout(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_PROGRAMME_LIVE_CLOSEOUT_V1');assert.equal(c.base,PROGRAMME_CLOSEOUT_BASE);assert.equal(c.source,PROGRAMME_CLOSEOUT_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,PROGRAMME_CLOSEOUT_PATHS);assert.deepEqual(c.maintenancePaths,PROGRAMME_CLOSEOUT_MAINTENANCE);
 for(const flag of ['runtimeChanged','publicCopyChanged','clinicalAvailabilityChanged','customerDataChanged','stockChanged','memberBehaviourChanged','privacyAssertionsWeakened'])assert.equal(c[flag],false);
 assert.equal(c.liveProgrammeVerificationAdded,true);assert.equal(c.approvedCopyComparisonFixed,true);assert.equal(c.rollbackReceiptRun,37853151026);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated Programme closeout source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated Programme closeout maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Programme closeout');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Serving SEO source drift / Programme closeout source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Serving SEO verifier drift / Programme closeout verifier drift: '+path);
 const workflow='.github/workflows/cloudflare-production-promote.yml';
 assert.equal(withoutProgrammeLiveGate(content(c.source,workflow)),content(c.base,workflow),'Only the additional exact Programme live gate may change production workflow');
 return c;
}


export const NEWS_SECURITY_BASE='160fc4fe35ee98c9713cf5fadb7936baa16d2845';
export const NEWS_SECURITY_SOURCE='14918e97959d669248efd82c2896de59a3a47e25';
export const NEWS_SECURITY_PATHS=['radar-news-pages-v1.js','tests/programme-day-news-security.test.mjs','release/live-support-runtime.mjs','tests/live-support-runtime.test.mjs'];
export const NEWS_SECURITY_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/programme-day-news-security-release.test.mjs'];
const NEWS_SECURITY_SET=new Set([...NEWS_SECURITY_PATHS,...NEWS_SECURITY_MAINTENANCE]);
for(const path of NEWS_SECURITY_SET)RECONCILIATION_PATHS.add(path);
export function withoutNewsSecurityPolicy(source){
 const line="import {withArticleResponsePolicy} from './babylove/response-policy.mjs';\n";
 const wrapper='return withArticleResponsePolicy(new Response(body,{status,headers}));';
 assert(source.startsWith(line),'Exact shared policy import required');
 assert.equal(source.split(wrapper).length,2,'Exactly one shared response policy wrapper required');
 return source.slice(line.length).replace(wrapper,'return new Response(body,{status,headers});');
}
export function verifyNewsSecurity(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_NEWS_SECURITY_POLICY_V1');assert.equal(c.base,NEWS_SECURITY_BASE);assert.equal(c.source,NEWS_SECURITY_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,NEWS_SECURITY_PATHS);assert.deepEqual(c.maintenancePaths,NEWS_SECURITY_MAINTENANCE);
 for(const flag of ['publicCopyChanged','clinicalAvailabilityChanged','customerDataChanged','stockChanged','memberBehaviourChanged','privacyAssertionsWeakened'])assert.equal(c[flag],false);
 assert.equal(c.runtimeChanged,true);assert.equal(c.existingSecurityPolicyApplied,true);assert.equal(c.rollbackReceiptRun,37857802619);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated news security source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated news security maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after news security');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Serving SEO source drift / Programme closeout source drift / news security source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Serving SEO verifier drift / Programme closeout verifier drift / news security verifier drift: '+path);
 assert.equal(withoutNewsSecurityPolicy(content(c.source,'radar-news-pages-v1.js')),content(c.base,'radar-news-pages-v1.js'),'Only the existing shared security policy may change newsroom rendering');
 assert.equal(content(c.source,'.github/workflows/cloudflare-production-promote.yml'),content(c.base,'.github/workflows/cloudflare-production-promote.yml'),'Production gates must remain unchanged');
 return c;
}

export const WATCH_OWNED_DISPATCH_BASE='acaf0ffd09393e299c91664bf62693504131836d';
export const WATCH_OWNED_DISPATCH_SOURCE='377b817984d9469ef5e305434e1b64cdf71633d7';
export const WATCH_OWNED_DISPATCH_PATHS=['shift-coach/cancelled-release-recovery.mjs','shift-coach/cancelled-release-recovery.test.mjs'];
export const WATCH_OWNED_DISPATCH_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/watch-owned-dispatch-release.test.mjs'];
const WATCH_OWNED_DISPATCH_SET=new Set([...WATCH_OWNED_DISPATCH_PATHS,...WATCH_OWNED_DISPATCH_MAINTENANCE]);
for(const path of WATCH_OWNED_DISPATCH_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchOwnedDispatch(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_OWNED_DISPATCH_V1');assert.equal(c.base,WATCH_OWNED_DISPATCH_BASE);assert.equal(c.source,WATCH_OWNED_DISPATCH_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,WATCH_OWNED_DISPATCH_PATHS);assert.deepEqual(c.maintenancePaths,WATCH_OWNED_DISPATCH_MAINTENANCE);
 assert.equal(c.pinnedRun,37870273259);assert.equal(c.pinnedEvent,'workflow_dispatch');assert.equal(c.finalOwnershipVerifierChanged,true);
 for(const flag of ['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','customerDataChanged','checkoutChanged','myTimberChanged','rollbackAuthorityBroadened'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated Watch owned dispatch source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated Watch owned dispatch maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Watch owned dispatch');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved Watch owned dispatch source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved Watch owned dispatch source drift / maintenance: '+path);
 const verifier=content(c.source,'shift-coach/cancelled-release-recovery.mjs');
 assert.match(verifier,/exactRecordedManualRelease/);assert.match(verifier,/run\?\.event!==expectedEvent/);
 assert.equal(content(c.source,'.github/workflows/cloudflare-production-promote.yml'),content(c.base,'.github/workflows/cloudflare-production-promote.yml'),'Guarded production workflow must remain byte-for-byte unchanged');
 return c;
}

export const WATCH_RUNTIME_DISPATCH_BASE='c7c52acfd2adc2226adc5fad43f4e5c326e788b6';
export const WATCH_RUNTIME_DISPATCH_SOURCE='326572c4e265542b7a8146cf30294b3aa5b56146';
export const WATCH_RUNTIME_DISPATCH_PATHS=['shift-coach/cancelled-release-recovery.mjs','shift-coach/cancelled-release-recovery.test.mjs'];
export const WATCH_RUNTIME_DISPATCH_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/watch-runtime-dispatch-release.test.mjs'];
const WATCH_RUNTIME_DISPATCH_SET=new Set([...WATCH_RUNTIME_DISPATCH_PATHS,...WATCH_RUNTIME_DISPATCH_MAINTENANCE]);
for(const path of WATCH_RUNTIME_DISPATCH_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchRuntimeDispatch(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_RUNTIME_DISPATCH_V1');assert.equal(c.base,WATCH_RUNTIME_DISPATCH_BASE);assert.equal(c.source,WATCH_RUNTIME_DISPATCH_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,WATCH_RUNTIME_DISPATCH_PATHS);assert.deepEqual(c.maintenancePaths,WATCH_RUNTIME_DISPATCH_MAINTENANCE);
 assert.equal(c.pinnedRun,37870273259);assert.equal(c.pinnedEvent,'workflow_dispatch');assert.equal(c.recoveryVerifierChanged,true);
 for(const flag of ['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','customerDataChanged','checkoutChanged','myTimberChanged','rollbackAuthorityBroadened'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated Watch runtime dispatch source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated Watch runtime dispatch maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Watch runtime dispatch');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved Watch runtime dispatch source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved Watch runtime dispatch source drift / maintenance: '+path);
 const verifier=content(c.source,'shift-coach/cancelled-release-recovery.mjs');
 assert.match(verifier,/event:'workflow_dispatch'/);assert.match(verifier,/recorded\.event,pinned\.event\|\|'push'/);
 assert.equal(content(c.source,'.github/workflows/cloudflare-production-promote.yml'),content(c.base,'.github/workflows/cloudflare-production-promote.yml'),'Guarded production workflow must remain byte-for-byte unchanged');
 return c;
}

export const WATCH_RUNTIME_BASELINE_BASE='8d1b328c0a5f7169e646ed23d30f79ce7562c8c8';
export const WATCH_RUNTIME_BASELINE_SOURCE='ba232820de4bf508691f66915eb6e970e68ca313';
export const WATCH_RUNTIME_BASELINE_PATHS=['shift-coach/cancelled-release-recovery.mjs','shift-coach/cancelled-release-recovery.test.mjs'];
export const WATCH_RUNTIME_BASELINE_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/watch-runtime-baseline-release.test.mjs'];
const WATCH_RUNTIME_BASELINE_SET=new Set([...WATCH_RUNTIME_BASELINE_PATHS,...WATCH_RUNTIME_BASELINE_MAINTENANCE]);
for(const path of WATCH_RUNTIME_BASELINE_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchRuntimeBaseline(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_RUNTIME_BASELINE_V1');assert.equal(c.base,WATCH_RUNTIME_BASELINE_BASE);assert.equal(c.source,WATCH_RUNTIME_BASELINE_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,WATCH_RUNTIME_BASELINE_PATHS);assert.deepEqual(c.maintenancePaths,WATCH_RUNTIME_BASELINE_MAINTENANCE);
 assert.equal(c.recoveryVerifierChanged,true);assert.equal(c.currentDeploymentRun,37870273259);assert.equal(c.currentDeploymentId,'3515e037-1915-476a-9f6b-6b41bbf5e061');assert.equal(c.currentVersionId,'48eb4d71-cb90-4132-bb16-4768132d61d5');
 for(const flag of ['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','customerDataChanged','checkoutChanged','myTimberChanged','rollbackAuthorityBroadened'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated Watch runtime baseline source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated Watch runtime baseline maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Watch runtime baseline');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved Watch runtime baseline source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved Watch runtime baseline source drift / maintenance: '+path);
 const verifier=content(c.source,'shift-coach/cancelled-release-recovery.mjs');
 assert.match(verifier,/recordedMedicinesWatchRuntime/);assert.match(verifier,/active\?\.id!==receipt\.deploymentId/);
 assert.equal(content(c.source,'.github/workflows/cloudflare-production-promote.yml'),content(c.base,'.github/workflows/cloudflare-production-promote.yml'),'Guarded production workflow must remain byte-for-byte unchanged');
 return c;
}

export const SHARED_FOOTER_COMPOSITION_BASE='c37c770929f7f595def20f23b6092015b820dfff';
export const SHARED_FOOTER_COMPOSITION_PATHS=['tests/shared-footer.test.mjs'];
export const SHARED_FOOTER_COMPOSITION_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/shared-footer-composition-release.test.mjs'];
const SHARED_FOOTER_COMPOSITION_SET=new Set([...SHARED_FOOTER_COMPOSITION_PATHS,...SHARED_FOOTER_COMPOSITION_MAINTENANCE]);
for(const path of SHARED_FOOTER_COMPOSITION_SET)RECONCILIATION_PATHS.add(path);
export function verifySharedFooterComposition(c,{head,read,diff,ancestor}){
 assert(c);assert.equal(c.proof,'EXACT_SHARED_FOOTER_COMPOSITION_V1');assert.equal(c.base,SHARED_FOOTER_COMPOSITION_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,SHARED_FOOTER_COMPOSITION_PATHS);assert.deepEqual(c.maintenancePaths,SHARED_FOOTER_COMPOSITION_MAINTENANCE);
 for(const flag of ['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','customerDataChanged','checkoutChanged','myTimberChanged','privacyAssertionsWeakened'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated shared footer composition source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated shared footer composition maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after shared footer composition reconciliation');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved shared footer composition source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved shared footer composition maintenance source drift: '+path);
 return c;
}

export const WATCH_HSTS_PUBLIC_WORDING_BASE='961fa36a0dfb26a0ed3d4a43cb23a2c278270b75';
export const WATCH_HSTS_PUBLIC_WORDING_PATHS=['release/public-wording-scope.mjs','scripts/b1-release-scope.mjs','tests/b1-release-scope.test.mjs','shift-coach/release.test.mjs'];
export const WATCH_HSTS_PUBLIC_WORDING_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/watch-hsts-public-wording-release.test.mjs','shift-coach/release-contract.mjs'];
const WATCH_HSTS_PUBLIC_WORDING_SET=new Set([...WATCH_HSTS_PUBLIC_WORDING_PATHS,...WATCH_HSTS_PUBLIC_WORDING_MAINTENANCE]);
for(const path of WATCH_HSTS_PUBLIC_WORDING_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchHstsPublicWording(c,{head,read,diff,ancestor}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_HSTS_PUBLIC_WORDING_V1');assert.equal(c.base,WATCH_HSTS_PUBLIC_WORDING_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,WATCH_HSTS_PUBLIC_WORDING_PATHS);assert.deepEqual(c.maintenancePaths,WATCH_HSTS_PUBLIC_WORDING_MAINTENANCE);
 for(const flag of ['runtimeChanged','readOnlyHeadersChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged','privacyAssertionsWeakened'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated Watch HSTS public wording source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated Watch HSTS public wording maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Watch HSTS public wording reconciliation');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved Watch HSTS public wording source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved Watch HSTS public wording maintenance source drift: '+path);
 return c;
}

export const WATCH_HSTS_DIAGNOSTIC_BASE='c13d835552eb97dff903758b00609e73b5e50a88';
export const WATCH_HSTS_DIAGNOSTIC_PATHS=['release/approved-runtime-composition.mjs','tests/watch-hsts-diagnostic-release.test.mjs'];
const WATCH_HSTS_DIAGNOSTIC_SET=new Set(WATCH_HSTS_DIAGNOSTIC_PATHS);
for(const path of WATCH_HSTS_DIAGNOSTIC_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchHstsDiagnostic(c,{head,read,diff,ancestor}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_HSTS_DIAGNOSTIC_V1');assert.equal(c.base,WATCH_HSTS_DIAGNOSTIC_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,WATCH_HSTS_DIAGNOSTIC_PATHS);
 for(const flag of ['runtimeChanged','readOnlyHeadersChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated Watch HSTS diagnostic source');
 assert.deepEqual(sorted(diff(c.source,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Watch HSTS diagnostic');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved Watch HSTS diagnostic source drift: '+path);
 return c;
}

export const WATCH_HSTS_BASE='8198d99b9f570087e63864e481278b8a2459bfdd';
export const WATCH_HSTS_PATHS=['medicines-watch/page.mjs','medicines-watch/page.test.mjs'];
export const WATCH_HSTS_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/watch-hsts-release.test.mjs'];
const WATCH_HSTS_SET=new Set([...WATCH_HSTS_PATHS,...WATCH_HSTS_MAINTENANCE]);
for(const path of WATCH_HSTS_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchHsts(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_HSTS_V1');assert.equal(c.base,WATCH_HSTS_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,WATCH_HSTS_PATHS);assert.deepEqual(c.maintenancePaths,WATCH_HSTS_MAINTENANCE);
 assert.equal(c.runtimeChanged,true);assert.equal(c.readOnlyHeadersChanged,true);
 for(const flag of ['publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated Watch HSTS source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated Watch HSTS maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after Watch HSTS');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Watch HSTS source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved Watch HSTS maintenance source drift: '+path);
 assert.doesNotMatch(content(c.base,'medicines-watch/page.mjs'),/Strict-Transport-Security/);
 assert.match(content(c.source,'medicines-watch/page.mjs'),/Strict-Transport-Security/);
 assert.equal(content(c.source,'.github/workflows/cloudflare-production-promote.yml'),content(c.base,'.github/workflows/cloudflare-production-promote.yml'),'Guarded production workflow must remain unchanged');
 return c;
}

export const WATCH_BELIEVE_DIAGNOSTIC_BASE='8f05352def20c636aeb43ba2e7814d3255898d20';
export const WATCH_BELIEVE_DIAGNOSTIC_PATHS=['release/approved-runtime-composition.mjs','tests/watch-believe-release.test.mjs'];
const WATCH_BELIEVE_DIAGNOSTIC_SET=new Set(WATCH_BELIEVE_DIAGNOSTIC_PATHS);
for(const path of WATCH_BELIEVE_DIAGNOSTIC_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchBelieveDiagnostic(c,{head,read,diff,ancestor}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_BELIEVE_DIAGNOSTIC_V1');assert.equal(c.base,WATCH_BELIEVE_DIAGNOSTIC_BASE);assert.match(c.source,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,WATCH_BELIEVE_DIAGNOSTIC_PATHS);
 for(const flag of ['medicalEvidenceChanged','runtimeChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated BELIEVE diagnostic source');
 assert.deepEqual(sorted(diff(c.source,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after BELIEVE diagnostic');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved BELIEVE diagnostic source drift: '+path);
 return c;
}

export const WATCH_BELIEVE_BASE='79dfc433a3a5775f0277206ff7134d0900a8c6ae';
export const WATCH_BELIEVE_SOURCE='532cd3534527a0e4d83b651894a7a7a13b8a66b2';
export const WATCH_BELIEVE_PROOF_RUN=37866621755;
export const WATCH_BELIEVE_PATHS=['medicines-watch/README.md','medicines-watch/credibility.mjs','medicines-watch/credibility.test.mjs','medicines-watch/evidence-desk.test.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-09-authorised-bimagrumab-semaglutide.json'];
export const WATCH_BELIEVE_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/watch-believe-release.test.mjs'];
const WATCH_BELIEVE_SET=new Set([...WATCH_BELIEVE_PATHS,...WATCH_BELIEVE_MAINTENANCE]);
for(const path of WATCH_BELIEVE_SET)RECONCILIATION_PATHS.add(path);
export function verifyWatchBelieveEvidence(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_WATCH_BELIEVE_EVIDENCE_V1');assert.equal(c.base,WATCH_BELIEVE_BASE);assert.equal(c.source,WATCH_BELIEVE_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.equal(c.proofRun,WATCH_BELIEVE_PROOF_RUN);assert.deepEqual(c.paths,WATCH_BELIEVE_PATHS);assert.deepEqual(c.maintenancePaths,WATCH_BELIEVE_MAINTENANCE);
 assert.equal(c.medicalEvidenceChanged,true);assert.equal(c.editorialAuthorisationRecorded,true);assert.equal(c.configuredSourcesAdded,1);
 for(const flag of ['runtimeChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged'])assert.equal(c[flag],false);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated BELIEVE evidence source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated BELIEVE evidence maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after BELIEVE evidence');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved factual Watch source drift / BELIEVE evidence: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved BELIEVE evidence source drift / verifier drift: '+path);
 const receipt=JSON.parse(content(c.source,'medicines-watch/reviews/2026-10-09-authorised-bimagrumab-semaglutide.json'));
 assert.equal(receipt.publicationStatus,'owner_authorised_factual_publication');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 assert.equal(receipt.registrySources.length,1);assert.equal(receipt.registrySources[0].nctId,'NCT05616013');assert.equal(receipt.registrySources[0].lifecycle.hasResults,true);
 for(const path of ['.github/workflows/cloudflare-production-promote.yml','worker-entry-v6.js','wrangler.jsonc'])assert.equal(content(c.source,path),content(c.base,path),'Production runtime and guarded workflow must remain unchanged: '+path);
 return c;
}


export const MEMBER_PROOF_RETRY_BASE='5f046576b17ecf5fad5aa5be6d6eab1699f38e86';
export const MEMBER_PROOF_RETRY_SOURCE='6808493eeca7b747e61668d4e2b0c5f29adffb87';
export const MEMBER_PROOF_RETRY_PATHS=['release/public-proof-fetch.mjs','tests/programme-day-public-proof-fetch.test.mjs','member-experience/verify-production-member.mjs','release/live-support-runtime.mjs','tests/live-support-runtime.test.mjs'];
export const MEMBER_PROOF_RETRY_MAINTENANCE=['release/approved-runtime-composition.mjs','tests/programme-day-member-proof-retry-release.test.mjs'];
const MEMBER_PROOF_RETRY_SET=new Set([...MEMBER_PROOF_RETRY_PATHS,...MEMBER_PROOF_RETRY_MAINTENANCE]);
for(const path of MEMBER_PROOF_RETRY_SET)RECONCILIATION_PATHS.add(path);
export function withoutMemberProofTransport(source){
 const line="import {fetchPublicProof as fetch} from '../release/public-proof-fetch.mjs';\n";
 assert(source.startsWith(line),'Exact proof transport import required');
 assert.equal(source.split(line).length,2,'Exactly one proof transport import required');
 return source.slice(line.length);
}
export function verifyMemberProofRetry(c,{head,read,diff,ancestor,content=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'})}){
 assert(c);assert.equal(c.proof,'EXACT_MEMBER_PROOF_TRANSPORT_RETRY_V1');assert.equal(c.base,MEMBER_PROOF_RETRY_BASE);assert.equal(c.source,MEMBER_PROOF_RETRY_SOURCE);assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);assert.deepEqual(c.paths,MEMBER_PROOF_RETRY_PATHS);assert.deepEqual(c.maintenancePaths,MEMBER_PROOF_RETRY_MAINTENANCE);
 for(const flag of ['runtimeChanged','publicCopyChanged','clinicalAvailabilityChanged','customerDataChanged','stockChanged','memberBehaviourChanged','privacyAssertionsWeakened'])assert.equal(c[flag],false);
 assert.equal(c.readOnlyTransportRetryAdded,true);assert.equal(c.rollbackReceiptRun,37860725562);
 for(const sha of [c.base,c.source,c.maintenanceSource])ancestor(sha,head);
 assert.deepEqual(sorted(diff(c.base,c.source)),sorted(c.paths),'Unrelated member proof source');
 assert.deepEqual(sorted(diff(c.source,c.maintenanceSource)),sorted(c.maintenancePaths),'Unrelated member proof maintenance');
 assert.deepEqual(sorted(diff(c.maintenanceSource,head)),[RECONCILIATION_MANIFEST],'Unreviewed changes after member proof');
 for(const path of c.paths)assert.equal(read('HEAD',path),read(c.source,path),'Approved composition source / boundary drift: Serving SEO source drift / Programme closeout source drift / news security source drift / member proof source drift: '+path);
 for(const path of c.maintenancePaths)assert.equal(read('HEAD',path),read(c.maintenanceSource,path),'Approved composition maintenance source drift: Serving SEO verifier drift / Programme closeout verifier drift / news security verifier drift / member proof verifier drift: '+path);
 assert.equal(withoutMemberProofTransport(content(c.source,'member-experience/verify-production-member.mjs')),content(c.base,'member-experience/verify-production-member.mjs'),'Every existing asset and authentication assertion must remain byte-for-byte intact');
 for(const path of ['.github/workflows/cloudflare-production-promote.yml','radar-news-pages-v1.js','worker-entry-v6.js'])assert.equal(content(c.source,path),content(c.base,path),'Production gates and runtime must remain unchanged: '+path);
 return c;
}

const recordPath=new URL('./approved-runtime-composition.json',import.meta.url);
export function reconciliationRecord(){return existsSync(recordPath)?JSON.parse(readFileSync(recordPath)):null;}
export function assertProductionProofBudget(before,current){
 const marker='    timeout-minutes: 25\n    env:\n      CLOUDFLARE_ACCOUNT_ID';
 assert.equal(before.split(marker).length,2,'Exact original production time budget required');
 let expected=before.replace(marker,marker.replace('25','60'));
 for(const file of ['medicines-watch-observations.sql','medicines-watch-expansion-observations.sql']){
  const original='npx wrangler d1 execute DB --remote --config wrangler.jsonc --file "$RUNNER_TEMP/'+file+'"';
  const online='node release/watch-observation-seed.mjs "$RUNNER_TEMP/'+file+'"';
  expected=expected.replace(original,online);
 }
 assert.equal(current,expected,'Only the production verification time budget and exact online observation transport may change');
}
let productionProofBefore;
const verifiedImmutableStructures=new Set();

// Synchronous test verification can reuse only actual immutable Git history.
// Current HEAD and tracked working bytes are checked at both scope boundaries.
// This never caches caller-supplied source readers or validation outcomes.
let immutableHistoryScope=null;
const immutableHistoryResults=new Map();
export function withImmutableHistoryVerification(callback){
 if(immutableHistoryScope)return callback();
 const cwd=process.cwd(),head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.equal(execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim(),'','Immutable history verification requires clean tracked source');
 immutableHistoryScope={cwd,head};
 try{const value=callback();assert(!value||typeof value.then!=='function','Immutable history verification must be synchronous');return value;}
 finally{
  immutableHistoryScope=null;
  assert.equal(process.cwd(),cwd,'Verification working directory changed');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),head,'Source HEAD changed during immutable history verification');
  assert.equal(execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim(),'','Working source changed during immutable history verification');
 }
}
export function immutableHistoryExecFileSync(bin,args,options){
 const scope=immutableHistoryScope;
 if(!scope||bin!=='git'||!Array.isArray(args)||args.some(x=>typeof x!=='string')||options?.cwd&&options.cwd!==scope.cwd||options?.env||options?.shell)return execFileSync(bin,args,options);
 const pinned=args.map(x=>x==='HEAD'?scope.head:x.startsWith('HEAD:')?scope.head+x.slice(4):x==='HEAD^{commit}'?scope.head+'^{commit}':x);
 const commit=x=>/^[a-f0-9]{40}$/.test(x),blob=x=>/^[a-f0-9]{40}:[^\0]+$/.test(x);
 const immutable=pinned.length===4&&pinned[0]==='merge-base'&&pinned[1]==='--is-ancestor'&&commit(pinned[2])&&commit(pinned[3])
  ||pinned.length===4&&pinned[0]==='diff'&&['--name-only','--name-status'].includes(pinned[1])&&commit(pinned[2])&&commit(pinned[3])
  ||pinned.length===2&&['show','rev-parse'].includes(pinned[0])&&blob(pinned[1])
  ||pinned.length===3&&pinned[0]==='cat-file'&&pinned[1]==='-e'&&(/^[a-f0-9]{40}\^\{commit\}$/.test(pinned[2])||blob(pinned[2]));
 if(!immutable)return execFileSync(bin,args,options);
 const key=JSON.stringify([scope.cwd,scope.head,pinned,options||null]);
 if(!immutableHistoryResults.has(key))immutableHistoryResults.set(key,execFileSync(bin,pinned,options));
 const result=immutableHistoryResults.get(key);return Buffer.isBuffer(result)?Buffer.from(result):result;
}

const defaultReconciliationRead=(ref,path)=>git('rev-parse',ref+':'+path);
const immutableCompositionBlobs=new Map();
export function verifyReconciledRelease(read=defaultReconciliationRead){
 const c=reconciliationRecord();if(!c)return null;
 assert.equal(c.proof,'EXACT_APPROVED_RUNTIME_COMPOSITION_V1');
 assert.equal(c.base,COMPOSITION_BASE);assert.equal(c.source,COMPOSITION_SOURCE);
 assert.deepEqual(c.maintenancePaths,RECONCILIATION_MAINTENANCE);
 assert.match(c.maintenanceSource,/^[a-f0-9]{40}$/);
 const watch=c.watchFactualUpdate;assert(watch,'Exact factual Watch amendment receipt required');
 assert.equal(watch.base,WATCH_FACTUAL_UPDATE_BASE);assert.equal(watch.source,WATCH_FACTUAL_UPDATE_SOURCE);
 assert.equal(watch.proofRun,WATCH_FACTUAL_UPDATE_RUN);assert.deepEqual(watch.paths,WATCH_FACTUAL_UPDATE_PATHS);
 assert.deepEqual(watch.maintenancePaths,WATCH_FACTUAL_UPDATE_MAINTENANCE);assert.match(watch.maintenanceSource,/^[a-f0-9]{40}$/);
 const transport=c.proofTransportUpdate;assert(transport,'Exact GitHub proof transport amendment required');
 assert.equal(transport.base,PROOF_TRANSPORT_BASE);assert.equal(transport.source,PROOF_TRANSPORT_SOURCE);
 assert.deepEqual(transport.paths,PROOF_TRANSPORT_PATHS);assert.deepEqual(transport.maintenancePaths,PROOF_TRANSPORT_MAINTENANCE);assert.match(transport.maintenanceSource,/^[a-f0-9]{40}$/);
 const head=git('rev-parse','HEAD');
 // Only actual Git objects at resolved immutable commit IDs are cacheable.
 // Supplied readers are always invoked again, even after a successful proof.
 const readBlob=read===defaultReconciliationRead?(ref,path)=>{
  const commit=ref==='HEAD'?head:ref;assert.match(commit,/^[a-f0-9]{40}$/);
  const key=JSON.stringify([process.cwd(),commit,path]);
  if(!immutableCompositionBlobs.has(key))immutableCompositionBlobs.set(key,defaultReconciliationRead(commit,path));
  return immutableCompositionBlobs.get(key);
 }:read;
 const ownedDispatch=c.watchOwnedDispatch;
 if(ownedDispatch)verifyWatchOwnedDispatch(ownedDispatch,{head,read:readBlob,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const ownedDispatchHead=ownedDispatch?ownedDispatch.base:head;
 const ownedDispatchRead=(ref,path)=>readBlob(ownedDispatch&&ref==='HEAD'&&WATCH_OWNED_DISPATCH_SET.has(path)?ownedDispatch.base:ref,path);
 const runtimeDispatch=c.watchRuntimeDispatch;
 if(runtimeDispatch)verifyWatchRuntimeDispatch(runtimeDispatch,{head:ownedDispatchHead,read:ownedDispatchRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const runtimeDispatchHead=runtimeDispatch?runtimeDispatch.base:head;
 const runtimeDispatchRead=(ref,path)=>ownedDispatchRead(runtimeDispatch&&ref==='HEAD'&&WATCH_RUNTIME_DISPATCH_SET.has(path)?runtimeDispatch.base:ref,path);
 const runtimeBaseline=c.watchRuntimeBaseline;
 if(runtimeBaseline)verifyWatchRuntimeBaseline(runtimeBaseline,{head:runtimeDispatchHead,read:runtimeDispatchRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const runtimeBaselineHead=runtimeBaseline?runtimeBaseline.base:head;
 const runtimeBaselineRead=(ref,path)=>runtimeDispatchRead(runtimeBaseline&&ref==='HEAD'&&WATCH_RUNTIME_BASELINE_SET.has(path)?runtimeBaseline.base:ref,path);
 const footerComposition=c.sharedFooterCompositionProof;
 if(footerComposition)verifySharedFooterComposition(footerComposition,{head:runtimeBaselineHead,read:runtimeBaselineRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const footerCompositionHead=footerComposition?footerComposition.base:runtimeBaselineHead;
 const footerCompositionRead=(ref,path)=>runtimeBaselineRead(footerComposition&&ref==='HEAD'&&SHARED_FOOTER_COMPOSITION_SET.has(path)?footerComposition.base:ref,path);
 const hstsPublicWording=c.watchHstsPublicWording;
 if(hstsPublicWording)verifyWatchHstsPublicWording(hstsPublicWording,{head:footerCompositionHead,read:footerCompositionRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const hstsPublicWordingHead=hstsPublicWording?hstsPublicWording.base:footerCompositionHead;
 const hstsPublicWordingRead=(ref,path)=>footerCompositionRead(hstsPublicWording&&ref==='HEAD'&&WATCH_HSTS_PUBLIC_WORDING_SET.has(path)?hstsPublicWording.base:ref,path);
 const hstsDiagnostic=c.watchHstsDiagnostic;
 if(hstsDiagnostic)verifyWatchHstsDiagnostic(hstsDiagnostic,{head:hstsPublicWordingHead,read:hstsPublicWordingRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const hstsDiagnosticHead=hstsDiagnostic?hstsDiagnostic.base:hstsPublicWordingHead;
 const hstsDiagnosticRead=(ref,path)=>hstsPublicWordingRead(hstsDiagnostic&&ref==='HEAD'&&WATCH_HSTS_DIAGNOSTIC_SET.has(path)?hstsDiagnostic.base:ref,path);
 const hsts=c.watchHsts;
 if(hsts)verifyWatchHsts(hsts,{head:hstsDiagnosticHead,read:hstsDiagnosticRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const hstsHead=hsts?hsts.base:hstsDiagnosticHead;
 const hstsRead=(ref,path)=>hstsDiagnosticRead(hsts&&ref==='HEAD'&&WATCH_HSTS_SET.has(path)?hsts.base:ref,path);
 const diagnostic=c.watchBelieveDiagnostic;
 if(diagnostic)verifyWatchBelieveDiagnostic(diagnostic,{head:hstsHead,read:hstsRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const diagnosticHead=diagnostic?diagnostic.base:hstsHead;
 const diagnosticRead=(ref,path)=>hstsRead(diagnostic&&ref==='HEAD'&&WATCH_BELIEVE_DIAGNOSTIC_SET.has(path)?diagnostic.base:ref,path);
 const believe=c.watchBelieveEvidence;
 if(believe)verifyWatchBelieveEvidence(believe,{head:diagnosticHead,read:diagnosticRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const believeHead=believe?believe.base:diagnosticHead;
 const believeRead=(ref,path)=>diagnosticRead(believe&&ref==='HEAD'&&WATCH_BELIEVE_SET.has(path)?believe.base:ref,path);
 const memberRetry=c.memberProofTransportRetry;
 if(memberRetry)verifyMemberProofRetry(memberRetry,{head:believeHead,read:believeRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const memberRetryHead=memberRetry?memberRetry.base:believeHead;
 const memberRetryRead=(ref,path)=>believeRead(memberRetry&&ref==='HEAD'&&MEMBER_PROOF_RETRY_SET.has(path)?memberRetry.base:ref,path);
 const news=c.newsSecurityPolicy;
 if(news)verifyNewsSecurity(news,{head:memberRetryHead,read:memberRetryRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const newsHead=news?news.base:memberRetryHead;
 const newsRead=(ref,path)=>memberRetryRead(news&&ref==='HEAD'&&NEWS_SECURITY_SET.has(path)?news.base:ref,path);
 const closeout=c.programmeLiveCloseout;
 if(closeout)verifyProgrammeCloseout(closeout,{head:newsHead,read:newsRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const closeoutHead=closeout?closeout.base:newsHead;
 const closeoutRead=(ref,path)=>newsRead(closeout&&ref==='HEAD'&&PROGRAMME_CLOSEOUT_SET.has(path)?closeout.base:ref,path);
 const serving=c.servingSeoCapture;
 if(serving)verifyServingSeoCapture(serving,{head:closeoutHead,read:closeoutRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const servingHead=serving?serving.base:closeoutHead;
 const servingRead=(ref,path)=>closeoutRead(serving&&ref==='HEAD'&&SERVING_SEO_SET.has(path)?serving.base:ref,path);
 const logout=c.logoutNavigationAdoption;
 if(logout)verifyLogoutAdoption(logout,{head:servingHead,read:servingRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const logoutHead=logout?logout.base:servingHead;
 const logoutRead=(ref,path)=>servingRead(logout&&ref==='HEAD'&&LOGOUT_ADOPTION_SET.has(path)?logout.base:ref,path);
 const attempt=c.reloadAttemptProof;
 if(attempt)verifyReloadAttemptExtension(attempt,{head:logoutHead,read:logoutRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const attemptHead=attempt?attempt.base:logoutHead;
 const attemptRead=(ref,path)=>logoutRead(attempt&&ref==='HEAD'&&RELOAD_ATTEMPT_SET.has(path)?attempt.base:ref,path);
 const anchor=c.oralCanonicalRepair;
 if(anchor)verifyOralCanonicalRepair(anchor,{head:attemptHead,read:attemptRead,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const anchorHead=anchor?anchor.base:attemptHead;
 const anchorRead=(ref,path)=>attemptRead(anchor&&ref==='HEAD'&&ORAL_CANONICAL_SET.has(path)?anchor.base:ref,path);
 const nhs=c.nhsArticleProofRefresh;
 if(nhs)verifyNhsArticleProofRefresh(nhs,{head:anchorHead,read:anchorRead,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const nhsHead=nhs?nhs.base:anchorHead;
 const nhsRead=(ref,path)=>anchorRead(nhs&&ref==='HEAD'&&NHS_ARTICLE_PROOF_SET.has(path)?nhs.base:ref,path);
 // Validate the exact current serving rollback receipt before older views.
 const supportRollback=c.supportRollbackRefresh;
 if(supportRollback)verifySupportRollbackRefresh(supportRollback,{head:nhsHead,read:nhsRead,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const supportHead=supportRollback?supportRollback.base:nhsHead;
 const supportRead=(ref,path)=>nhsRead(supportRollback&&ref==='HEAD'&&SUPPORT_ROLLBACK_SET.has(path)?supportRollback.base:ref,path);
 // Validate raw retry bytes before exposing the exact prior approved release.
 const oral=c.oralLiveDispatchGuard;
 if(oral)verifyOralLiveDispatchGuard(oral,{head:supportHead,read:supportRead,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const oralHead=oral?oral.base:supportHead;
 const oralRead=(ref,path)=>supportRead(oral&&ref==='HEAD'&&ORAL_LIVE_DISPATCH_SET.has(path)?oral.base:ref,path);
 const retry=c.publicToolProofRetry;
 if(retry)verifyPublicToolProofRetry(retry,{head:oralHead,read:oralRead,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const retryHead=retry?retry.base:oralHead;
 const retryRead=(ref,path)=>oralRead(retry&&ref==='HEAD'&&PUBLIC_TOOL_PROOF_RETRY_SET.has(path)?retry.base:ref,path);
 // Validate the finite Programme amendment before exposing the previous release.
 const preflight=c.programmeDayPreflight;
 if(preflight)verifyProgrammeDayPreflightExtension(preflight,{head:retryHead,read:retryRead,diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const currentHead=preflight?preflight.base:retryHead;
 const currentRead=(ref,path)=>retryRead(preflight&&ref==='HEAD'&&PROGRAMME_PREFLIGHT_PATHS.has(path)?preflight.base:ref,path);
 const day=c.programmeDay;
 if(day)verifyProgrammeDayExtension(day,{head:currentHead,read:currentRead,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const previousHead=day?day.base:currentHead;
 const priorRead=(ref,path)=>currentRead(day&&ref==='HEAD'&&PROGRAMME_DAY_PATHS.has(path)?day.base:ref,path);
 // Validate all new raw HEAD bytes before exposing any older historical view.
 const extension=c.publicToolDelivery;
 if(extension)verifyPublicToolExtension(extension,{head:previousHead,read:priorRead,
  diff:(a,b)=>publicToolImmutableGit('diff','--name-only',a,b).split('\n').filter(Boolean),
  ancestor:(a,b)=>publicToolImmutableGit('merge-base','--is-ancestor',a,b)});
 const compositionHead=extension?extension.base:previousHead;
 const compositionBlob=(path)=>extension&&PUBLIC_TOOL_PATHS.has(path)?priorRead(extension.base,path):priorRead('HEAD',path);
 // Cache only Git graph facts for resolved immutable commits and this exact
 // receipt. Supplied readers, current bytes and working-tree checks stay fresh.
 const structureKey=JSON.stringify([process.cwd(),head,c]);
 if(!verifiedImmutableStructures.has(structureKey)){
  for(const ref of [COMPOSITION_BASE,SUPPORT_SOURCE,HQ_SOURCE,COMPOSITION_SOURCE,c.maintenanceSource,RELOAD_VERIFIER,WATCH_FACTUAL_UPDATE_BASE,WATCH_FACTUAL_UPDATE_SOURCE,watch.maintenanceSource,PROOF_TRANSPORT_BASE,PROOF_TRANSPORT_SOURCE,transport.maintenanceSource])git('merge-base','--is-ancestor',ref,head);
  const diff=(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean).sort();
  assert.deepEqual(diff(COMPOSITION_BASE,COMPOSITION_SOURCE),sorted(COMPOSITION_PATHS));
  assert.deepEqual(diff(COMPOSITION_SOURCE,c.maintenanceSource).filter(p=>p!==RECONCILIATION_MANIFEST),sorted(RECONCILIATION_MAINTENANCE));
  assert.deepEqual(diff(c.maintenanceSource,WATCH_FACTUAL_UPDATE_BASE),[RECONCILIATION_MANIFEST]);
  assert.deepEqual(diff(WATCH_FACTUAL_UPDATE_BASE,WATCH_FACTUAL_UPDATE_SOURCE),sorted(WATCH_FACTUAL_UPDATE_PATHS),'Exact eight-file factual Watch source required');
  assert.deepEqual(diff(WATCH_FACTUAL_UPDATE_SOURCE,watch.maintenanceSource),sorted(WATCH_FACTUAL_UPDATE_MAINTENANCE),'Exact four-file Watch reconciliation required');
  assert.deepEqual(diff(watch.maintenanceSource,PROOF_TRANSPORT_BASE),[RECONCILIATION_MANIFEST],'Unreviewed changes after factual Watch reconciliation');
  assert.deepEqual(diff(PROOF_TRANSPORT_BASE,PROOF_TRANSPORT_SOURCE),sorted(PROOF_TRANSPORT_PATHS),'Exact three-file transport amendment required');
  assert.deepEqual(diff(PROOF_TRANSPORT_SOURCE,transport.maintenanceSource),sorted(PROOF_TRANSPORT_MAINTENANCE),'Exact two-file transport reconciliation required');
  assert.deepEqual(diff(transport.maintenanceSource,compositionHead),[RECONCILIATION_MANIFEST],'Unreviewed changes after transport reconciliation');
  verifiedImmutableStructures.add(structureKey);
 }
 // Verify current bytes before exposing historical views to older guards.
 for(const path of COMPOSITION_PATHS)assert.equal(compositionBlob(path),readBlob(COMPOSITION_SOURCE,path),'Approved composition source / boundary drift: '+path);
 for(const path of RECONCILIATION_MAINTENANCE)assert.equal(compositionBlob(path),readBlob(PROOF_TRANSPORT_MAINTENANCE.includes(path)?transport.maintenanceSource:WATCH_FACTUAL_UPDATE_MAINTENANCE.includes(path)?watch.maintenanceSource:c.maintenanceSource,path),'Approved composition maintenance source drift: '+path);
 for(const path of WATCH_FACTUAL_UPDATE_MAINTENANCE)assert.equal(compositionBlob(path),readBlob(PROOF_TRANSPORT_MAINTENANCE.includes(path)?transport.maintenanceSource:watch.maintenanceSource,path),'Approved factual Watch maintenance source drift: '+path);
 for(const path of WATCH_FACTUAL_UPDATE_PATHS)assert.equal(compositionBlob(path),readBlob(WATCH_FACTUAL_UPDATE_SOURCE,path),'Approved factual Watch source drift: '+path);
 for(const path of PROOF_TRANSPORT_PATHS)assert.equal(compositionBlob(path),readBlob(PROOF_TRANSPORT_SOURCE,path),'Approved composition maintenance source drift: '+path);
 for(const path of PROOF_TRANSPORT_MAINTENANCE)assert.equal(compositionBlob(path),readBlob(transport.maintenanceSource,path),'Approved composition maintenance source drift: '+path);
 for(const path of RELOAD_PAYLOAD)assert.equal(compositionBlob(path),readBlob(RELOAD_VERIFIER,path),'Independent reload harness source drift: '+path);
 productionProofBefore??=execFileSync('git',['show',COMPOSITION_BASE+':.github/workflows/cloudflare-production-promote.yml'],{encoding:'utf8'});
 assertProductionProofBudget(productionProofBefore,closeout?withoutProgrammeLiveGate(readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8')):readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8'));
 assert.equal(git('diff','--name-only'),'','Working source changed during composition verification');
 assert.equal(git('rev-parse','HEAD'),head,'Source HEAD changed during composition verification');
 return c;
}
const mappedCompositionReaders=new WeakSet();
export function reconciliationMarkHistoricalReader(read){mappedCompositionReaders.add(read);return read;}
let verifiedHead=null;const existsAtBase=new Map();
function ensureReconciliation(){
 if(!reconciliationRecord())return false;
 // A synchronous historical test scope captures HEAD and rejects a move at
 // its end. Outside that scope, every public lookup still resolves HEAD afresh.
 const head=immutableHistoryScope?.head??git('rev-parse','HEAD');
 if(verifiedHead!==head){verifyReconciledRelease();verifiedHead=head;}
 return true;
}
function checkedHistoricalRef(ref,path){
 if(ref!=='HEAD'||!RECONCILIATION_PATHS.has(path))return ref;
 if(!existsAtBase.has(path)){try{execFileSync('git',['cat-file','-e',COMPOSITION_BASE+':'+path],{stdio:'ignore'});existsAtBase.set(path,true);}catch{existsAtBase.set(path,false);}}
 return existsAtBase.get(path)?COMPOSITION_BASE:ref;
}
export function reconciliationHistoricalRef(ref,path){
 if(ref!=='HEAD'||!RECONCILIATION_PATHS.has(path)||!ensureReconciliation())return ref;
 return checkedHistoricalRef(ref,path);
}
export function reconciliationHistoricalRead(read,verifyReader=false){
 if(!ensureReconciliation()||mappedCompositionReaders.has(read))return read;if(verifyReader)verifyReconciledRelease(read);
 // This synchronous validation reader is created only after the actual HEAD and
 // all current source blobs pass. Its immutable base map needs no per-blob Git
 // subprocess. Fresh readers still recheck current source before this mapping.
 return reconciliationMarkHistoricalReader((ref,path)=>read(checkedHistoricalRef(ref,path),path));
}
export function reconciliationGitArgs(args){
 if(!['show','rev-parse'].includes(args[0])||!args[1]?.startsWith('HEAD:'))return args;
 const path=args[1].slice(5),ref=reconciliationHistoricalRef('HEAD',path);
 return [args[0],ref+':'+path,...args.slice(2)];
}
export function reconciliationHead(){return ensureReconciliation()?COMPOSITION_BASE:git('rev-parse','HEAD');}
export function reconciliationPath(path){return RECONCILIATION_PATHS.has(path)&&ensureReconciliation();}
export function reconciliationChangedPath(status,path){
 if(!reconciliationPath(path))return false;
 if(!existsAtBase.has(path)){try{execFileSync('git',['cat-file','-e',COMPOSITION_BASE+':'+path],{stdio:'ignore'});existsAtBase.set(path,true);}catch{existsAtBase.set(path,false);}}
 // Source changes retain their exact add/modify semantics. Existing verifier
 // maintenance may have been added historically and modified subsequently.
 const allowed=existsAtBase.get(path)?(WATCH_HSTS_SET.has(path)||LOGOUT_ADOPTION_SET.has(path)||RELOAD_ATTEMPT_SET.has(path)||ORAL_CANONICAL_SET.has(path)||NHS_ARTICLE_PROOF_SET.has(path)||SUPPORT_ROLLBACK_SET.has(path)||ORAL_LIVE_DISPATCH_SET.has(path)||PUBLIC_TOOL_PROOF_RETRY_SET.has(path)||PUBLIC_TOOL_MAINTENANCE.includes(path)||RECONCILIATION_MAINTENANCE.includes(path)||WATCH_FACTUAL_UPDATE_PATHS.includes(path)||PROOF_TRANSPORT_PATHS.includes(path)?['A','M']:['M']):['A'];
 assert(allowed.includes(status),'Unexpected approved composition file status: '+status+' '+path);
 return true;
}


export function assertReconciledReloadReceipt(run,job){
 assert.equal(run?.id,RELOAD_RUN);assert.equal(run.run_attempt,1);assert.equal(run.head_sha,RELOAD_VERIFIER);
 assert.equal(run.path,'.github/workflows/my-timber-final-production.yml');assert.equal(run.head_branch,'fix/member-reload-navigation-20261007');assert.equal(run.event,'push');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
 assert.equal(job?.id,113266037954);assert.equal(job.run_attempt,1);assert.equal(job.run_id,RELOAD_RUN);assert.equal(job.name,'reload-navigation-diagnostics');assert.equal(job.status,'completed');assert.equal(job.conclusion,'success');
 for(const number of [8,9,11,12,14,15])assert(job.steps?.some(s=>s.number===number&&s.status==='completed'&&s.conclusion==='success'),'Every complete live journey round must pass');
 return {id:run.id,sha:run.head_sha,path:run.path,conclusion:run.conclusion,scope:'Three complete live save, reload, privacy, Today, Grub and Fit journey rounds'};
}
