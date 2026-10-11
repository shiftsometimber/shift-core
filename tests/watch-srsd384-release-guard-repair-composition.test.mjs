import test from 'node:test';
import assert from 'node:assert/strict';
import {
 verifyWatchSrsd384ReleaseGuardRepair,
 WATCH_SRSD384_RELEASE_GUARD_BASE as base,
 WATCH_SRSD384_RELEASE_GUARD_SOURCE as source,
 WATCH_SRSD384_RELEASE_GUARD_PATHS as paths,
 WATCH_SRSD384_RELEASE_GUARD_MAINTENANCE as maintenance,
 RECONCILIATION_MANIFEST as manifest
} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','queueLogicChanged','monitorBaselinesChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_SRSD384_RELEASE_GUARD_REPAIR_V1',base,source,maintenanceSource:'a'.repeat(40),paths:[...paths],maintenancePaths:[...maintenance],approvedPR:1314,integrationIssue:1065,failedRun:38105692270,failedJob:114370685366,failedStep:13,releaseReachedProduction:false,failureGate:'Verify B1 release scope before any production mutation',failureCause:'release meta-test did not recognise SRSD384 review-renewal source drift wording',...Object.fromEntries(flags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchSrsd384ReleaseGuardRepair:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});

test('SRSD384 release-guard repair accepts only the failed assertion-label integration',()=>verifyWatchSrsd384ReleaseGuardRepair(receipt(),options()));
test('SRSD384 release-guard repair preserves evidence, queue, monitoring and publication boundaries',()=>{
 for(const patch of [{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{failedRun:1},{failedJob:1},{failedStep:12},{releaseReachedProduction:true},...flags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchSrsd384ReleaseGuardRepair({...receipt(),...patch},options()));
});
test('SRSD384 release-guard repair rejects unrelated payload and maintenance files',()=>{
 for(const bad of [['checkout.mjs'],['release/approved-runtime-composition.mjs','tests/other.test.mjs'],[]])assert.throws(()=>verifyWatchSrsd384ReleaseGuardRepair(receipt(),{...options(),diff:(a,b)=>a===base?bad:a===source?[...maintenance]:[manifest]}));
});
