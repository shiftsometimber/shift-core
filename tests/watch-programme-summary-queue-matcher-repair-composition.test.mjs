import test from 'node:test';
import assert from 'node:assert/strict';
import {
 verifyWatchProgrammeSummaryQueueMatcherRepair,
 WATCH_PROGRAMME_SUMMARY_QUEUE_MATCHER_BASE as base,
 WATCH_PROGRAMME_SUMMARY_QUEUE_MATCHER_PATHS as paths,
 WATCH_PROGRAMME_SUMMARY_QUEUE_MATCHER_MAINTENANCE as maintenance,
 RECONCILIATION_MANIFEST as manifest
} from '../release/approved-runtime-composition.mjs';

const source='749d23f6d8ebfa933c9ef49e63ca344c6986202d';
const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_PROGRAMME_SUMMARY_QUEUE_MATCHER_REPAIR_V1',base,source,maintenanceSource:'a'.repeat(40),paths:[...paths],maintenancePaths:[...maintenance],approvedPR:1316,integrationIssue:1065,failedRun:38113438635,failedJob:114393529381,failedStep:4,releaseReachedProduction:false,failureGate:'Programme day preview composition meta-test',failureCause:'outer guard source-drift label was not covered by the finite byte-pin matcher',...Object.fromEntries(flags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchProgrammeSummaryQueueMatcherRepair:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});

test('programme-summary queue matcher repair accepts only the finite verifier update',()=>verifyWatchProgrammeSummaryQueueMatcherRepair(receipt(),options()));
test('programme-summary queue matcher repair preserves evidence, reviews, queues and release authority',()=>{
 for(const patch of [{source:'f'.repeat(40)},{approvedPR:1},{failedRun:1},{failedJob:1},{failedStep:5},{releaseReachedProduction:true},...flags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchProgrammeSummaryQueueMatcherRepair({...receipt(),...patch},options()));
});
test('programme-summary queue matcher repair rejects unrelated payload and maintenance files',()=>{
 for(const bad of [['checkout.mjs'],['tests/other.test.mjs'],[]])assert.throws(()=>verifyWatchProgrammeSummaryQueueMatcherRepair(receipt(),{...options(),diff:(a,b)=>a===base?bad:a===source?[...maintenance]:[manifest]}));
});
