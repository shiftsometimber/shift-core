import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchTwoSourceReleaseGuardRepair,verifyReconciledRelease,WATCH_TWO_SOURCE_RELEASE_GUARD_REPAIR_BASE as base,WATCH_TWO_SOURCE_RELEASE_GUARD_REPAIR_SOURCE as source,WATCH_TWO_SOURCE_RELEASE_GUARD_REPAIR_PATHS as paths,WATCH_TWO_SOURCE_RELEASE_GUARD_REPAIR_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_TWO_SOURCE_RELEASE_GUARD_REPAIR_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1321,integrationIssue:1065,failedRun:38122695667,failureGate:'Verify B1 release scope before any production mutation',releaseReachedProduction:false,repair:'recognise exact two-source freshness payload drift label',...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchTwoSourceFreshnessReleaseGuardRepair:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('two-source release-guard repair is finite and does not alter factual evidence',()=>{
 verifyWatchTwoSourceReleaseGuardRepair(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{failedRun:1},{failureGate:'other'},{releaseReachedProduction:true},{repair:'other'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchTwoSourceReleaseGuardRepair({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchTwoSourceReleaseGuardRepair(receipt(),o));}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchTwoSourceReleaseGuardRepair(receipt(),o));
});

test('repair source and maintenance blobs remain byte-pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchTwoSourceReleaseGuardRepair(receipt(),o),/source drift/);}
});

test('real composition retains reviewed Watch counts and pending-delayed distinction',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchTwoSourceFreshnessReleaseGuardRepair.source,source);
 assert.equal(c.watchTwoSourceFreshness.sourceReviewsApplied,2);
 assert.equal(c.watchTwoSourceFreshness.preservedSourceReviews,35);
 assert.equal(c.watchTwoSourceFreshness.configuredSourceFactualReviewNeeded,0);
 assert.equal(c.watchTwoSourceFreshness.programmeSummaryFactualReviewNeeded,66);
 assert.equal(c.watchTwoSourceFreshness.verificationPending,1);
 assert.equal(c.watchTwoSourceFreshness.delayedSources,1);
 assert.equal(c.watchTwoSourceFreshness.zp6590VerificationPending,true);
 assert.equal(c.watchTwoSourceFreshness.zp6590CheckDelayed,true);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
