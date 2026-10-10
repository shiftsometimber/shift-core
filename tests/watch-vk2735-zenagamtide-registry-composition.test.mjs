import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchVk2735ZenagamtideRegistry,verifyReconciledRelease,WATCH_VK2735_ZENAGAMTIDE_BASE as base,WATCH_VK2735_ZENAGAMTIDE_SOURCE as source,WATCH_VK2735_ZENAGAMTIDE_PATHS as paths,WATCH_VK2735_ZENAGAMTIDE_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const flags=['resultsClaimed','phase3StartClaimed','switchingGuidanceClaimed','ukAuthorisationClaimed','nhsAccessClaimed','supplyClaimed','reviewDatesRenewedByHttp','monitorBaselinesChanged','queueLogicChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_VK2735_ZENAGAMTIDE_REGISTRY_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1312,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,industryComplete:false,sourceReviews:3,programmesAfter:116,configuredSources:202,trialRecordsAfter:137,preservedSourceReviews:35,factualReviewNeeded:0,verificationPending:1,delayedSources:1,automatedMonitorChanges:true,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchVk2735ZenagamtideRegistry:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});
test('VK2735 and zenagamtide registry receipt is exact and preserves evidence boundaries',()=>{
 verifyWatchVk2735ZenagamtideRegistry(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{sourceReviews:0},{programmesAfter:0},{configuredSources:0},{trialRecordsAfter:0},{preservedSourceReviews:0},{factualReviewNeeded:1},{verificationPending:0},{delayedSources:0},{automatedMonitorChanges:false},{clinicalApproval:true},{industryComplete:true},{publicationStatus:'draft'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchVk2735ZenagamtideRegistry({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchVk2735ZenagamtideRegistry(receipt(),o));}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchVk2735ZenagamtideRegistry(receipt(),o));
});
test('every current registry and maintenance blob must match its pinned source',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(r,p)=>r==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchVk2735ZenagamtideRegistry(receipt(),o),/source drift/);}
});
test('real composition preserves the 35 reviewed sources and pending-delayed ZP6590',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchVk2735ZenagamtideRegistry.source,source);assert.equal(c.watchVk2735ZenagamtideRegistry.preservedSourceReviews,35);assert.equal(c.watchVk2735ZenagamtideRegistry.factualReviewNeeded,0);assert.equal(c.watchVk2735ZenagamtideRegistry.verificationPending,1);assert.equal(c.watchVk2735ZenagamtideRegistry.delayedSources,1);
 const read=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
