import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchAzelapragRenewal,verifyReconciledRelease,WATCH_AZELAPRAG_RENEWAL_BASE as base,WATCH_AZELAPRAG_RENEWAL_SOURCE as source,WATCH_AZELAPRAG_RENEWAL_PATHS as paths,WATCH_AZELAPRAG_RENEWAL_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';

const flags=['programmeWordingChanged','configuredSourceCountChanged','programmeCountChanged','registryLifecycleChanged','resultsClaimed','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','reviewDatesRenewedByHttp','monitorBaselinesChanged','monitorLogicChanged','queueLogicChanged','healthResponseChanged','memberTreatmentChanged','homepageChanged','startHereChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged','checkoutChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const fingerprints=['0080170ec76c06b5c251ad17226440a7807402e108d6ed1c995fe9fc0c07aba5','c7e60ac3b739c60de594cfaae6772d270457b3749e561c92ee777353d04093f1'];
const receipt=()=>({proof:'EXACT_WATCH_AZELAPRAG_RENEWAL_20261011',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1325,integrationIssue:1065,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,industryComplete:false,sourceReviewsApplied:2,programmeReviewDatesRenewed:1,reviewedAt:'2026-10-11T13:10:56Z',secFilingPublishedAt:'2025-03-20',unchangedFingerprints:[...fingerprints],preservedSourceReviews:35,programmesAfter:116,configuredSources:202,configuredSourceFactualReviewNeeded:0,programmeSummaryFactualReviewNeeded:66,verificationPending:1,delayedSources:1,zp6590VerificationPending:true,zp6590CheckDelayed:true,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchAzelapragRenewal:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});

test('azelaprag composition accepts only the reviewed identities, counters and finite authorisation',()=>{
 verifyWatchAzelapragRenewal(receipt(),options());
 const patches=[{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{publicationStatus:'clinical_approval'},{clinicalApproval:'approved'},{industryComplete:true},{sourceReviewsApplied:3},{programmeReviewDatesRenewed:2},{reviewedAt:'2026-10-12T00:00:00Z'},{secFilingPublishedAt:null},{unchangedFingerprints:['changed',fingerprints[1]]},{preservedSourceReviews:34},{programmesAfter:117},{configuredSources:203},{configuredSourceFactualReviewNeeded:1},{programmeSummaryFactualReviewNeeded:65},{verificationPending:0},{delayedSources:0},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},{paths:[...paths,'worker.js']},{maintenancePaths:[...maintenance,'monitor.mjs']},{maintenanceSource:'not-a-sha'},...flags.map(k=>({[k]:true}))];
 for(const patch of patches)assert.throws(()=>verifyWatchAzelapragRenewal({...receipt(),...patch},options()));
});

test('all azelaprag boundaries, ancestry and fresh-reader drift fail closed',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){
  const o=options(),d=o.diff;o.diff=(a,b)=>a===boundary?[...d(a,b),'worker.js']:d(a,b);
  assert.throws(()=>verifyWatchAzelapragRenewal(receipt(),o),/Unrelated|Unreviewed/);
 }
 const o=options();o.ancestor=()=>{throw Error('not an ancestor');};assert.throws(()=>verifyWatchAzelapragRenewal(receipt(),o),/not an ancestor/);
 for(const path of [...paths,...maintenance]){
  const o=options();verifyWatchAzelapragRenewal(receipt(),o);o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';
  assert.throws(()=>verifyWatchAzelapragRenewal(receipt(),o),/source drift/);
 }
 const changed=options();changed.content=ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'changed',watchAzelapragRenewal:{}});
 assert.throws(()=>verifyWatchAzelapragRenewal(receipt(),changed),/Prior release receipts/);
});

test('real azelaprag composition preserves every earlier receipt and rejects all supplied HEAD drift',()=>{
 const current=verifyReconciledRelease();assert.equal(current.watchAzelapragRenewal.source,source);
 const prior=JSON.parse(read(base,manifest)),retained=structuredClone(current);delete retained.watchAlnylamRnaiDiscovery;delete retained.watchAzelapragRenewal;assert.deepEqual(retained,prior);
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
 for(const path of paths)assert.equal(read('HEAD',path),read(source,path));
});

test('keyboard-settle verifier, all prior drift tests and live browser acceptance remain immutable',()=>{
 const functionBody=(ref,name)=>{const text=read(ref,'release/approved-runtime-composition.mjs'),start=text.indexOf('export function '+name+'(');assert(start>=0);return text.slice(start,text.indexOf('\n}\n',start)+3);};
 for(const name of ['verifyWaistKeyboardSettle','verifyWaistRollbackRetention','verifyWaistReadingStrip','verifyWatchTwoSourceFreshness','verifyWatchTwoSourceReleaseGuardRepair'])assert.equal(functionBody('HEAD',name),functionBody(base,name));
 for(const path of ['scripts/verify-tool-calculators-browser.cjs','tests/late-watch-composition.test.mjs','tests/waist-keyboard-settle-composition.test.mjs','tests/waist-rollback-composition.test.mjs','tests/waist-reading-strip-composition.test.mjs','tests/watch-two-source-freshness-composition.test.mjs','shift-coach/release.test.mjs','medicines-watch/monitor.mjs','medicines-watch/evidence-desk.mjs'])assert.equal(read('HEAD',path),read(base,path));
 const reviewPaths=execFileSync('git',['ls-tree','-r','--name-only',base,'--','medicines-watch/reviews'],{encoding:'utf8'}).trim().split('\n');
 for(const path of reviewPaths)assert.equal(read('HEAD',path),read(base,path),'Prior dated review receipt changed: '+path);
 const factual=JSON.parse(read('HEAD',paths[4]));assert.equal(factual.reviewedAt,'2026-10-11T13:10:56Z');
 assert.deepEqual([factual.sources[0].reviewedFingerprint,factual.registrySources[0].reviewedFingerprint],fingerprints);
 assert.deepEqual([factual.sources[0].previousReviewedFingerprint,factual.registrySources[0].previousReviewedFingerprint],fingerprints);
 assert.equal(factual.programme.additionalEvidence[1].sourcePublishedAt,'2025-03-20');
 assert.deepEqual(factual.remainingObstacles[0].state,['verification_pending','check_delayed']);assert.equal(factual.clinicalApproval,null);
});
