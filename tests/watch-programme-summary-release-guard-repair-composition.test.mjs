import test from 'node:test';
import assert from 'node:assert/strict';
import {
 verifyWatchProgrammeSummaryReleaseGuardRepair,
 WATCH_PROGRAMME_SUMMARY_RELEASE_GUARD_BASE as base,
 WATCH_PROGRAMME_SUMMARY_RELEASE_GUARD_SOURCE as source,
 WATCH_PROGRAMME_SUMMARY_RELEASE_GUARD_PATHS as paths,
 WATCH_PROGRAMME_SUMMARY_RELEASE_GUARD_MAINTENANCE as maintenance,
 RECONCILIATION_MANIFEST as manifest
} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_PROGRAMME_SUMMARY_RELEASE_GUARD_REPAIR_V1',base,source,maintenanceSource:'a'.repeat(40),paths:[...paths],maintenancePaths:[...maintenance],approvedPR:1317,integrationIssue:1065,failedRun:38114045551,failedJob:114395315656,failedStep:13,releaseReachedProduction:false,failureGate:'Verify B1 release scope before any production mutation',failureCause:'release meta-test did not recognise programme-summary queue source drift wording',...Object.fromEntries(flags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchProgrammeSummaryReleaseGuardRepair:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});

test('programme-summary release guard repair accepts only the finite failed assertion update',()=>verifyWatchProgrammeSummaryReleaseGuardRepair(receipt(),options()));
test('programme-summary release guard repair preserves evidence, reviews, queue and authority boundaries',()=>{
 for(const patch of [{source:'f'.repeat(40)},{approvedPR:1},{failedRun:1},{failedJob:1},{failedStep:12},{releaseReachedProduction:true},...flags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchProgrammeSummaryReleaseGuardRepair({...receipt(),...patch},options()));
});
test('programme-summary release guard repair rejects unrelated payload and maintenance files',()=>{
 for(const bad of [['checkout.mjs'],['release/approved-runtime-composition.mjs','tests/other.test.mjs'],[]])assert.throws(()=>verifyWatchProgrammeSummaryReleaseGuardRepair(receipt(),{...options(),diff:(a,b)=>a===base?bad:a===source?[...maintenance]:[manifest]}));
});
