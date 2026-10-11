import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyWatchTaldefgrobepAttainGuardRepair,WATCH_TALDEFGROBEP_ATTAIN_GUARD_BASE as base,WATCH_TALDEFGROBEP_ATTAIN_GUARD_SOURCE as source,WATCH_TALDEFGROBEP_ATTAIN_GUARD_PATHS as paths,WATCH_TALDEFGROBEP_ATTAIN_GUARD_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged','checkoutChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_TALDEFGROBEP_ATTAIN_GUARD_REPAIR_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),integrationIssue:1065,failureGate:'exact current Watch files remain pinned',releaseReachedProduction:false,repair:'recognise exact taldefgrobep/ATTAIN-MAINTAIN renewal drift label',...Object.fromEntries(flags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchTaldefgrobepAttainGuardRepair:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('outer release-meta repair is finite and changes no Watch or runtime facts',()=>{
 verifyWatchTaldefgrobepAttainGuardRepair(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{integrationIssue:1},{failureGate:'other'},{releaseReachedProduction:true},{repair:'other'},...flags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchTaldefgrobepAttainGuardRepair({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchTaldefgrobepAttainGuardRepair(receipt(),o));}
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchTaldefgrobepAttainGuardRepair(receipt(),o),/Taldefgrobep\/ATTAIN-MAINTAIN guard repair/);}
});
