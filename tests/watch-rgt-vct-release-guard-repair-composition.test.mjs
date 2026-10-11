import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchRgtVctReleaseGuardRepair,verifyReconciledRelease,WATCH_RGT_VCT_RELEASE_GUARD_REPAIR_BASE as base,WATCH_RGT_VCT_RELEASE_GUARD_REPAIR_SOURCE as source,WATCH_RGT_VCT_RELEASE_GUARD_REPAIR_PATHS as paths,WATCH_RGT_VCT_RELEASE_GUARD_REPAIR_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_RGT_VCT_RELEASE_GUARD_REPAIR_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1318,integrationIssue:1065,failedRun:38117053153,failureGate:'Programme day preview',repair:'recognise exact RGT/VCT source-renewal drift label',...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchRgtVctReleaseGuardRepair:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('RGT/VCT release-guard repair is finite and does not alter factual evidence',()=>{
 verifyWatchRgtVctReleaseGuardRepair(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{failedRun:1},{failureGate:'other'},{repair:'other'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchRgtVctReleaseGuardRepair({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchRgtVctReleaseGuardRepair(receipt(),o));}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchRgtVctReleaseGuardRepair(receipt(),o));
});

test('repair source and maintenance blobs remain byte-pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchRgtVctReleaseGuardRepair(receipt(),o),/source drift/);}
});

test('real composition retains reviewed Watch counts after the guard repair',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchRgtVctReleaseGuardRepair.source,source);
 assert.equal(c.watchRgtVctSourceRenewal.sourceReviewsApplied,6);
 assert.equal(c.watchRgtVctSourceRenewal.configuredSourceFactualReviewNeeded,0);
 assert.equal(c.watchRgtVctSourceRenewal.programmeSummaryFactualReviewNeeded,66);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
