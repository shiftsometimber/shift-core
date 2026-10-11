import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchRgtVctDriftCategoryOverlap,verifyReconciledRelease,WATCH_RGT_VCT_DRIFT_CATEGORY_OVERLAP_BASE as base,WATCH_RGT_VCT_DRIFT_CATEGORY_OVERLAP_SOURCE as source,WATCH_RGT_VCT_DRIFT_CATEGORY_OVERLAP_PATHS as paths,WATCH_RGT_VCT_DRIFT_CATEGORY_OVERLAP_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_RGT_VCT_DRIFT_CATEGORY_OVERLAP_REPAIR_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1318,integrationIssue:1065,failedRun:38117465443,failureGate:'Medicines Watch checks',repair:'pin overlapping shared verifier to preceding maintenance source',...Object.fromEntries(flags.map(k=>[k,false]))});
const sourceDoc={proof:'EXACT_WATCH_RGT_VCT_DRIFT_CATEGORY_OVERLAP_REPAIR_SOURCE_V1',base,approvedPR:1318,integrationIssue:1065};
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref,path)=>path===paths[0]?JSON.stringify(sourceDoc):JSON.stringify(ref===base?{prior:true}:{prior:true,watchRgtVctDriftCategoryOverlapRepair:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('disjoint overlap repair pins one source receipt and finite maintenance',()=>{
 verifyWatchRgtVctDriftCategoryOverlap(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{failedRun:1},{failureGate:'other'},{repair:'other'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchRgtVctDriftCategoryOverlap({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchRgtVctDriftCategoryOverlap(receipt(),o));}
});

test('overlap repair rejects source, maintenance and receipt drift',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchRgtVctDriftCategoryOverlap(receipt(),o),/Backlog maintenance source drift/);}
 const o=options();o.content=(ref,path)=>path===paths[0]?JSON.stringify({...sourceDoc,approvedPR:1}):JSON.stringify(ref===base?{prior:true}:{prior:true,watchRgtVctDriftCategoryOverlapRepair:{}});assert.throws(()=>verifyWatchRgtVctDriftCategoryOverlap(receipt(),o));
});

test('real composition preserves source and programme queues plus ZP pending-delayed',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchRgtVctDriftCategoryOverlapRepair.source,source);
 assert.equal(c.watchRgtVctSourceRenewal.configuredSourceFactualReviewNeeded,0);
 assert.equal(c.watchRgtVctSourceRenewal.programmeSummaryFactualReviewNeeded,66);
 assert.equal(c.watchRgtVctSourceRenewal.zp6590VerificationPending,true);
 assert.equal(c.watchRgtVctSourceRenewal.zp6590CheckDelayed,true);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/Backlog maintenance source drift/);
});
