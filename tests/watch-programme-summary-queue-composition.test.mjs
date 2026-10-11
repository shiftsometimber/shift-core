import test from 'node:test';
import assert from 'node:assert/strict';
import {
 verifyWatchProgrammeSummaryQueue,
 WATCH_PROGRAMME_SUMMARY_QUEUE_BASE as base,
 WATCH_PROGRAMME_SUMMARY_QUEUE_SOURCE as source,
 WATCH_PROGRAMME_SUMMARY_QUEUE_PATHS as paths,
 WATCH_PROGRAMME_SUMMARY_QUEUE_MAINTENANCE as maintenance,
 RECONCILIATION_MANIFEST as manifest
} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','configuredSourceQueueSemanticsChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_PROGRAMME_SUMMARY_QUEUE_V1',base,source,maintenanceSource:'a'.repeat(40),paths:[...paths],maintenancePaths:[...maintenance],approvedPR:1315,integrationIssue:1065,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,observedConfiguredSourceFactualReviewCount:0,observedProgrammeSummaryReviewCount:58,widerProgrammeCount:110,queuesSeparated:true,sevenDayRuleReused:true,unchangedCheckDoesNotRenew:true,industryComplete:false,zp6590PendingDelayedPreserved:true,...Object.fromEntries(flags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchProgrammeSummaryQueue:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});

test('programme-summary queue receipt accepts only the bounded disclosure correction',()=>verifyWatchProgrammeSummaryQueue(receipt(),options()));
test('programme-summary queue receipt preserves reviews, evidence, monitor and ZP6590 boundaries',()=>{
 for(const patch of [{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{clinicalApproval:'approved'},{observedConfiguredSourceFactualReviewCount:1},{observedProgrammeSummaryReviewCount:0},{widerProgrammeCount:109},{queuesSeparated:false},{sevenDayRuleReused:false},{unchangedCheckDoesNotRenew:false},{industryComplete:true},{zp6590PendingDelayedPreserved:false},...flags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchProgrammeSummaryQueue({...receipt(),...patch},options()));
});
test('programme-summary queue receipt rejects unrelated payload, maintenance and receipt drift',()=>{
 for(const bad of [['checkout.mjs'],['release/approved-runtime-composition.mjs','tests/other.test.mjs'],[]])assert.throws(()=>verifyWatchProgrammeSummaryQueue(receipt(),{...options(),diff:(a,b)=>a===base?bad:a===source?[...maintenance]:[manifest]}));
 assert.throws(()=>verifyWatchProgrammeSummaryQueue(receipt(),{...options(),content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'changed',watchProgrammeSummaryQueue:{}})}));
});
