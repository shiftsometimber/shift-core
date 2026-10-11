import test from 'node:test';
import assert from 'node:assert/strict';
import {
 verifyWatchProgrammeSummaryQueueGuardRepair,
 WATCH_PROGRAMME_SUMMARY_QUEUE_GUARD_BASE as base,
 WATCH_PROGRAMME_SUMMARY_QUEUE_GUARD_SOURCE as source,
 WATCH_PROGRAMME_SUMMARY_QUEUE_GUARD_PATHS as paths,
 WATCH_PROGRAMME_SUMMARY_QUEUE_GUARD_MAINTENANCE as maintenance,
 RECONCILIATION_MANIFEST as manifest
} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_PROGRAMME_SUMMARY_QUEUE_GUARD_REPAIR_V1',base,source,maintenanceSource:'a'.repeat(40),paths:[...paths],maintenancePaths:[...maintenance],approvedPR:1316,integrationIssue:1065,failedRun:38113247981,failedJob:114392980271,failedStep:4,releaseReachedProduction:false,failureGate:'Programme day preview composition meta-test',failureCause:'byte-pin matcher did not recognise programme-summary queue maintenance drift wording',...Object.fromEntries(flags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchProgrammeSummaryQueueGuardRepair:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});

test('programme-summary queue guard repair accepts only the finite matcher update',()=>verifyWatchProgrammeSummaryQueueGuardRepair(receipt(),options()));
test('programme-summary queue guard repair preserves evidence, reviews, queue and release authority',()=>{
 for(const patch of [{source:'f'.repeat(40)},{approvedPR:1},{failedRun:1},{failedJob:1},{failedStep:5},{releaseReachedProduction:true},...flags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchProgrammeSummaryQueueGuardRepair({...receipt(),...patch},options()));
});
test('programme-summary queue guard repair rejects unrelated payload and maintenance files',()=>{
 for(const bad of [['checkout.mjs'],['release/approved-runtime-composition.mjs','tests/other.test.mjs'],[]])assert.throws(()=>verifyWatchProgrammeSummaryQueueGuardRepair(receipt(),{...options(),diff:(a,b)=>a===base?bad:a===source?[...maintenance]:[manifest]}));
});
