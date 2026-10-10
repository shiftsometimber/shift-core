import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchOfficialAlternatives,verifyReconciledRelease,WATCH_OFFICIAL_ALTERNATIVES_BASE as base,WATCH_OFFICIAL_ALTERNATIVES_SOURCE as source,WATCH_OFFICIAL_ALTERNATIVES_PATHS as paths,WATCH_OFFICIAL_ALTERNATIVES_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const flags=['humanEfficacyClaimed','humanSafetyClaimed','ukAuthorisationClaimed','nhsAccessClaimed','supplyClaimed','reviewDatesRenewedByHttp','monitorBaselinesChanged','queueLogicChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_OFFICIAL_ALTERNATIVES_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1299,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,sourceReviews:12,entriesUpdated:2,manualEvidenceAdded:4,configuredSources:199,preservedSourceReviews:35,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});
test('official alternatives require exact payload and finite maintenance; uncertainty and prior reviews are retained',()=>{
 verifyWatchOfficialAlternatives(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{sourceReviews:0},{entriesUpdated:0},{manualEvidenceAdded:0},{configuredSources:0},{preservedSourceReviews:0},{clinicalApproval:true},{publicationStatus:'draft'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchOfficialAlternatives({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchOfficialAlternatives(receipt(),o));}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchOfficialAlternatives(receipt(),o));
});
test('every current factual and maintenance blob must match the pinned source',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(r,p)=>r==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchOfficialAlternatives(receipt(),o),/source drift/);}
});
test('real composition retains fresh-reader validation and the completed source backlog',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchOfficialAlternatives.source,source);assert.equal(c.watchBacklogUpdate.sourceReviews,35);assert.equal(c.watchPendingDelayedQueueRepair.approvedPR,1294);
 const read=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
