import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchRgtVctDriftCategoryRepair,verifyReconciledRelease,WATCH_RGT_VCT_DRIFT_CATEGORY_REPAIR_BASE as base,WATCH_RGT_VCT_DRIFT_CATEGORY_REPAIR_SOURCE as source,WATCH_RGT_VCT_DRIFT_CATEGORY_REPAIR_PATHS as paths,WATCH_RGT_VCT_DRIFT_CATEGORY_REPAIR_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_RGT_VCT_DRIFT_CATEGORY_REPAIR_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1318,integrationIssue:1065,failedRun:38117296398,failureGate:'Programme day preview',repair:'retain shared fail-closed drift category',...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchRgtVctDriftCategoryRepair:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('RGT/VCT drift-category repair is finite and changes no evidence or runtime',()=>{
 verifyWatchRgtVctDriftCategoryRepair(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{failedRun:1},{failureGate:'other'},{repair:'other'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchRgtVctDriftCategoryRepair({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchRgtVctDriftCategoryRepair(receipt(),o));}
});

test('drift-category repair source and maintenance remain byte-pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchRgtVctDriftCategoryRepair(receipt(),o),/Backlog maintenance source drift/);}
});

test('real composition retains both factual queues and the pending-delayed ZP boundary',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchRgtVctDriftCategoryRepair.source,source);
 assert.equal(c.watchRgtVctSourceRenewal.configuredSourceFactualReviewNeeded,0);
 assert.equal(c.watchRgtVctSourceRenewal.programmeSummaryFactualReviewNeeded,66);
 assert.equal(c.watchRgtVctSourceRenewal.zp6590VerificationPending,true);
 assert.equal(c.watchRgtVctSourceRenewal.zp6590CheckDelayed,true);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/Backlog maintenance source drift/);
});
