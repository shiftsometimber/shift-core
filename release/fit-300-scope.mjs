import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {FIT_EXPANSION_SERVING_AUTHORITY} from '../fit-expansion-serving-manifest-v1.mjs';
import {validateSixTopicSeoSource} from './six-topic-seo-scope.mjs';

export const SEO_FIT_COMPOSITION_PATHS=['scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs','release/fit-300-scope.mjs','release/app-manifest.json','tests/six-topic-seo-release.test.mjs','release/app-preflight.mjs','shift-coach/scope.mjs'];
const SEO_COMPOSED_PATHS=new Set(['.github/workflows/cloudflare-production-promote.yml','.github/workflows/six-topic-seo-proof.yml','.github/workflows/practical-guides-proof.yml','docs/seo/2026-10-05-six-priorities.md','docs/seo/2026-10-06-practical-guides.md','member-experience/public-preservation.mjs','public-practical-guides.mjs','public-seo-closeout.mjs','release/app-manifest.json','release/app-preflight.mjs','release/book-voice-scope.mjs','release/six-topic-seo-preservation.mjs','release/six-topic-seo-scope.mjs','scripts/b1-release-scope.mjs','scripts/verify-practical-guides-handler.mjs','scripts/verify-practical-guides.mjs','scripts/verify-six-topic-seo.mjs','shift-coach/release-contract.mjs','shift-coach/release-manifest.json','tests/practical-guides.test.mjs','tests/public-seo-closeout.test.mjs','tests/six-topic-seo-release.test.mjs','shift-coach/scope.mjs']);
// Exact post-Fit Watch composition reviewed after Fit and SEO. The manifest itself
// is pinned separately so its final source pointer can name this application.
export const POST_FIT_WATCH_PATHS=new Set(['medicines-watch/README.md','medicines-watch/credibility.mjs','medicines-watch/credibility.test.mjs','medicines-watch/evidence-desk.test.mjs','medicines-watch/industry.mjs','medicines-watch/industry.test.mjs','medicines-watch/reviews/2026-10-05-authorised-710go.json','medicines-watch/reviews/2026-10-06-authorised-survodutide-synchronize-jp.json','medicines-watch/reviews/2026-10-06-authorised-core-trial-lifecycle.json','medicines-watch/reviews/2026-10-06-authorised-gub-ucn2-mbl949.json','medicines-watch/reviews/2026-10-06-authorised-at7687-at673-alias.json','release/app-manifest.json','release/app-scope.mjs','release/watch-registry-wave-scope.mjs','shift-coach/recover-cancelled-release.mjs','shift-coach/release-contract.mjs','tests/b1-release-scope.test.mjs']);
export function validateSeoFitComposition(composition,read){
 assert.equal(composition.proof,'SEO_FIT_EXACT_COMPOSITION_V1');
 assert.equal(composition.base,'82c433486152e61833639efeffc3bac7dbe1713e');
 assert.equal(composition.seoSource,'36749bd7c3e728ceb09a443366a7e2b933b7c144');
 assert.match(composition.source,/^[a-f0-9]{40}$/);
 assert.deepEqual(composition.paths,SEO_FIT_COMPOSITION_PATHS);
 for(const path of composition.paths)assert.equal(read('HEAD',path),read(composition.source,path),'Coaching release source drift (SEO/Fit composition): '+path);
}

// Exact runtime activation. No new prescriptions, catalogue writes or inferred
// trainer/clinical approval. Existing safety/equipment/dose checks remain intact.
export const IMAGE_VIEWER_PATHS=new Set(['shift-coach/member-image-viewer.mjs','tests/member-image-viewer.test.mjs','shift-coach/fit-active-edit.mjs','shift-coach/fit-active-edit.test.mjs','shift-coach/release-contract.mjs','release/fit-300-scope.mjs']);
export const FIT300_PATHS=new Set([...IMAGE_VIEWER_PATHS,'fit-expansion-serving-manifest-v1.mjs','release/fit-300-scope.mjs','release/fit-300-activation.json','tests/fit-expansion-publication.test.mjs','scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs','shift-coach/release-manifest.json']);
export const READONLY_ORGANIC_PATHS=new Set(['.github/workflows/organic-growth-content.yml','editorial/organic-growth-20261005/README.md','editorial/organic-growth-20261005/baseline.json','editorial/organic-growth-20261005/intent-map.json','editorial/organic-growth-20261005/nhs-weight-loss-drugs.json','editorial/organic-growth-20261005/publication.test.mjs','editorial/organic-growth-20261005/publish.mjs','editorial/organic-growth-20261005/release-receipt.json','editorial/organic-growth-20261005/wegovy-side-effects-timeline.json']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=b=>createHash('sha256').update(b).digest('hex');

export function validateFit300(){
 assert(existsSync('release/fit-300-activation.json'),'Exact Fit activation receipt required');
 const activation=JSON.parse(readFileSync('release/fit-300-activation.json'));
 const coach=JSON.parse(readFileSync('shift-coach/release-manifest.json'));
 for(const path of POST_FIT_WATCH_PATHS)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',coach.applicationCommit+':'+path),'Post-Fit Watch composition source drift: '+path);
 const composition=coach.seoFitComposition;
 if(composition){
  validateSeoFitComposition(composition,(ref,path)=>git('rev-parse',ref+':'+path));
  git('merge-base','--is-ancestor',composition.base,composition.source);git('merge-base','--is-ancestor',composition.source,'HEAD');
  git('merge-base','--is-ancestor',composition.seoSource,composition.source);
  validateSixTopicSeoSource((ref,path)=>git('rev-parse',ref+':'+path),composition.source);
 }
 assert.equal(activation.proof,'FIT_300_RUNTIME_ACTIVATION_V1');
 assert.equal(activation.base,'eecd31ba0f3eb06e8de829d3415d7f86e954a162');
 assert.match(activation.source,/^[a-f0-9]{40}$/);
 assert.equal(activation.ownerInstruction.quote,'Can’t we get the full 300');
 assert.equal(activation.ownerInstruction.actor,'Matt');
 assert.equal(activation.trainerAttestation,false);assert.equal(activation.clinicalAttestation,false);
 assert.equal(activation.databaseWrites,false);
 git('merge-base','--is-ancestor',activation.base,activation.source);git('merge-base','--is-ancestor',activation.source,'HEAD');
 const viewer=activation.imageViewerComposition;
 assert.equal(viewer?.proof,'MEMBER_IMAGE_VIEWER_RELEASE_V1');
 assert.equal(viewer.base,'4afdd2686d5a74dfeea9ca2d86aba71e62ed2320');
 assert.match(viewer.source,/^[a-f0-9]{40}$/);
 assert.equal(viewer.ownerInstruction.actor,'Matt');
 assert.equal(viewer.ownerInstruction.quote,'No good these pics on a mobile ….. it doesn’t let you click on them to enlarge ? So can’t view what it is ? Assume perhaps same for grub');
 git('merge-base','--is-ancestor',viewer.base,viewer.source);git('merge-base','--is-ancestor',viewer.source,'HEAD');
 const viewerChanges=git('diff','--name-only',viewer.base,'HEAD').split('\n').filter(Boolean);
 assert(viewerChanges.every(p=>IMAGE_VIEWER_PATHS.has(p)||POST_FIT_WATCH_PATHS.has(p)||(composition&&SEO_COMPOSED_PATHS.has(p))||['release/fit-300-activation.json','shift-coach/release-manifest.json'].includes(p)),'Unrelated image viewer release change');
 for(const p of IMAGE_VIEWER_PATHS)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',(composition?.paths.includes(p)?composition.source:viewer.source)+':'+p),'Image viewer source drift: '+p);
 const allowed=git('diff','--name-only',activation.base,'HEAD').split('\n').filter(Boolean);
 assert(allowed.every(p=>FIT300_PATHS.has(p)||POST_FIT_WATCH_PATHS.has(p)||(composition&&SEO_COMPOSED_PATHS.has(p))),'Unrelated change in Fit activation');
 for(const p of FIT300_PATHS)if(!['release/fit-300-activation.json','shift-coach/release-manifest.json'].includes(p)){
  const ref=composition?.paths.includes(p)?composition.source:IMAGE_VIEWER_PATHS.has(p)?viewer.source:activation.source;
  assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',ref+':'+p),'Fit payload source drift: '+p);
 }
 for(const p of READONLY_ORGANIC_PATHS)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',activation.base+':'+p),'Organic baseline source drift: '+p);
 const wire=JSON.parse(gunzipSync(readFileSync('evidence/fit-publication-2026-09-16/owner-release.json.gz')));
 assert.deepEqual(FIT_EXPANSION_SERVING_AUTHORITY,wire.manifest,'Only exact existing owner release may be activated');
 assert.equal(wire.manifest.canonical_movements,300);assert.equal(wire.manifest.served_count,2688);
 const art=JSON.parse(readFileSync('preview/fit-grub/v3/approval.json'));
 assert.equal(art.records.length,300);assert.equal(art.heldImages,0);
 for(const r of art.records){assert.equal(r.status,'approved');assert.equal(sha(readFileSync('frontend/member'+r.image)),r.sha256,'Approved artwork drift: '+r.id);}
 assert.deepEqual(coach.fitComposition,{proof:'FIT_300_BOUNDED_RELEASE_COMPOSITION_V1',source:activation.source,paths:['scripts/b1-release-scope.mjs','release/app-scope.mjs','shift-coach/release-contract.mjs']});
 const priorCoach=JSON.parse(execFileSync('git',['show',(composition?composition.seoSource:activation.base)+':shift-coach/release-manifest.json'],{encoding:'utf8'}));
 assert.deepEqual(coach.imageViewerComposition,{proof:'MEMBER_IMAGE_VIEWER_RELEASE_V1',source:viewer.source,paths:['shift-coach/fit-active-edit.mjs','shift-coach/fit-active-edit.test.mjs','shift-coach/release-contract.mjs']});
 // Preserve the complete prior coaching decision record while admitting only
 // the exact, non-clinical Watch review notes and the bounded source pin.
 // This deliberately avoids a generic "ignore manifest changes" escape hatch.
 const watchEvidenceSuffix=' 5 October: standing editorial authority applies to the source-limited 710GO research omission. Animal findings, missing registry evidence and direct HTTP403 remain visible; no clinical approval. Exact hosted Watch proof 37365867158 and earlier SEO proof remain mandatory before production.';
 const watchVerificationSuffix=' 710GO: 163 Watch tests and 53 focused release tests passed locally before final receipt reconciliation; exact mandatory hosted proof is not yet passed. No clinical or independent acceptance is asserted.';
 const synchronizeJpEvidence='6 October: standing editorial authority covers the bounded SYNCHRONIZE-JP factual addition. Sponsor-reported conference findings remain separate from the ClinicalTrials.gov record, which posts no results; direct sponsor retrieval returned HTTP403. No UK authorisation, NHS access, supply, approved dose, muscle-preservation or clinical-approval claim. Exact hosted Watch proof 37396065615 is mandatory before production.';
 const synchronizeJpVerification='164 Watch tests passed locally and exact source head 2dc54ba8bfcc4b757bd2e06bb3c240ae41313280 passed hosted Medicines Watch run 37396065615. Release reconciliation and actual live verification remain mandatory; no clinical or independent acceptance is asserted.';
 const coreTrialEvidence='6 October: standing editorial authority covers four primary registry lifecycle sources for the existing MariTide and enicepatide programmes. Recruitment, completion and planned outcomes remain status evidence because no registry results are posted. Trial arms do not establish approved regimens, UK authorisation, NICE/NHS access, supply or clinical approval. Exact hosted Watch proof 37401085371 is mandatory before production.';
 const coreTrialVerification='165 Watch tests passed locally and exact source head ae53c8cae276b2ccf293ae68219d26c0d5601295 passed hosted Medicines Watch run 37401085371. Master Integration and Whole-Estate gates also passed. Release reconciliation and actual live verification remain mandatory; no clinical or independent acceptance is asserted.';
 const gubMblEvidence='6 October: standing editorial authority covers the bounded GUB-UCN2 and MBL949 additions. GUB-UCN2 remains first-in-human research with planned muscle-function and incretin-combination endpoints, not demonstrated human benefit. MBL949 remains a terminated obesity programme and is not generalized to other GDF15 candidates. Neither entry establishes UK authorisation, NICE/NHS access, supply or clinical approval. Exact hosted Watch proof 37430844694 is mandatory before production.';
 const gubMblVerification='166 Watch tests passed locally and exact source head 4107f1d372ac68bcca352ab38e6000ce39415d5d passed hosted Medicines Watch run 37430844694. Master Integration run 37430844464 and Whole-Estate run 37430844416 also passed. Release reconciliation and actual live verification remain mandatory; no clinical or independent acceptance is asserted.';
 const at7687At673Evidence="6 October: standing editorial authority covers the bounded reconciliation of Antag Therapeutics' AT7687 sponsor name with ClinicalTrials.gov's AT673 name for the same NCT07724340 programme. The unresolved code discrepancy stays visible; this remains one programme, no results are posted, and no UK authorisation, NICE/NHS access, supply, approved regimen or clinical approval is claimed. Exact hosted Watch proof 37450158527 is mandatory before production.";
 const at7687At673Verification='167 Watch tests passed locally and exact source head c6bd125264b6490633441ed07e0a3e583e14a023 passed hosted Medicines Watch run 37450158527. Master Integration run 37450158602 and Whole-Estate run 37450158601 also passed. Production run 37450565976 stopped before mutation at the stale current-Watch source pin. This receipt reconciles that pin only; actual deployment and live verification remain mandatory, and no clinical or independent acceptance is asserted.';
 const expectedCoach=structuredClone(priorCoach);
 expectedCoach.applicationCommit=coach.applicationCommit;
 // The six exact practical-guide additions are independently source-pinned
 // above; retain the contract-derived sorted path list rather than weakening it.
 expectedCoach.pinnedPaths=coach.pinnedPaths;
 expectedCoach.decisions.ownerAcceptance.applicationCommit=coach.decisions.ownerAcceptance.applicationCommit;
 expectedCoach.decisions.productionLaunch.evidence+=watchEvidenceSuffix;
 expectedCoach.decisions.productionLaunch.currentSurvodutideEvidence=synchronizeJpEvidence;
 expectedCoach.decisions.productionLaunch.currentCoreTrialEvidence=coreTrialEvidence;
 expectedCoach.decisions.productionLaunch.currentGubUcn2Mbl949Evidence=gubMblEvidence;
 expectedCoach.decisions.productionLaunch.currentAt7687At673Evidence=at7687At673Evidence;
 expectedCoach.decisions.ownerAcceptance.verificationEvidence+=watchVerificationSuffix;
 expectedCoach.decisions.ownerAcceptance.currentSurvodutideVerificationEvidence=synchronizeJpVerification;
 expectedCoach.decisions.ownerAcceptance.currentCoreTrialVerificationEvidence=coreTrialVerification;
 expectedCoach.decisions.ownerAcceptance.currentGubUcn2Mbl949VerificationEvidence=gubMblVerification;
 expectedCoach.decisions.ownerAcceptance.currentAt7687At673VerificationEvidence=at7687At673Verification;
 const {fitComposition,seoFitComposition,imageViewerComposition,...unchanged}=coach;
 assert.deepEqual(unchanged,expectedCoach,'Existing coaching launch decisions changed outside the exact Watch receipt');
 return {movements:300,servedProtocols:2688,approvedImages:300,databaseWrites:false,existingLayoutPreserved:true,tapToEnlarge:true};
}
