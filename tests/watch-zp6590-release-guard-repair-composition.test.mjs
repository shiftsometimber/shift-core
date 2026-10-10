import test from 'node:test';
import assert from 'node:assert/strict';
import {
 verifyWatchZp6590ReleaseGuardRepair,
 WATCH_ZP6590_RELEASE_GUARD_BASE as base,
 WATCH_ZP6590_RELEASE_GUARD_SOURCE as source,
 WATCH_ZP6590_RELEASE_GUARD_PATHS as paths,
 WATCH_ZP6590_RELEASE_GUARD_MAINTENANCE as maintenance,
 RECONCILIATION_MANIFEST as manifest
} from '../release/approved-runtime-composition.mjs';

const flags=['productionMutated','publicCopyChanged','medicalContentChanged','evidenceReviewChanged','queueLogicChanged','monitorBaselinesChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_ZP6590_RELEASE_GUARD_REPAIR_V1',base,source,maintenanceSource:'a'.repeat(40),paths:[...paths],maintenancePaths:[...maintenance],failedRun:38085522316,failedJob:114311137380,failedStep:13,zp6590VerificationPending:true,zp6590CheckDelayed:true,...Object.fromEntries(flags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchZp6590ReleaseGuardRepair:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});

test('ZP6590 release-guard repair accepts only the failed assertion label integration',()=>verifyWatchZp6590ReleaseGuardRepair(receipt(),options()));
test('ZP6590 release-guard repair preserves evidence, queue, monitoring and publication boundaries',()=>{
 for(const patch of [{source:'f'.repeat(40)},{failedRun:1},{failedJob:1},{failedStep:12},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},...flags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchZp6590ReleaseGuardRepair({...receipt(),...patch},options()));
});
test('ZP6590 release-guard repair rejects unrelated payload and maintenance files',()=>{
 for(const bad of [['checkout.mjs'],['release/approved-runtime-composition.mjs','tests/other.test.mjs'],[]])assert.throws(()=>verifyWatchZp6590ReleaseGuardRepair(receipt(),{...options(),diff:(a,b)=>a===base?bad:a===source?[...maintenance]:[manifest]}));
});
