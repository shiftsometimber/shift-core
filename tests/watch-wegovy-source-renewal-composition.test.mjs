import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchWegovySourceRenewal,verifyReconciledRelease,WATCH_WEGOVY_RENEWAL_BASE as base,WATCH_WEGOVY_RENEWAL_SOURCE as source,WATCH_WEGOVY_RENEWAL_PATHS as paths,WATCH_WEGOVY_RENEWAL_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['medicineWordingChanged','medicineReviewAdvanced','humanEfficacyClaimed','humanSafetyClaimed','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','reviewDatesRenewedByHttp','monitorBaselinesChanged','queueLogicChanged','delayedSourceStatesChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_WEGOVY_SOURCE_RENEWAL_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1301,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,sourceReviews:2,programmes:116,configuredSources:199,manualEvidenceUrls:96,preservedSourceReviews:35,factualReviewNeeded:0,verificationPending:1,delayedSources:2,...Object.fromEntries(flags.map(flag=>[flag,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('Wegovy renewal binds exactly two source reviews and preserves queue uncertainty',()=>{
 verifyWatchWegovySourceRenewal(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{sourceReviews:0},{programmes:0},{configuredSources:0},{manualEvidenceUrls:0},{preservedSourceReviews:0},{factualReviewNeeded:1},{verificationPending:0},{delayedSources:0},{clinicalApproval:true},{publicationStatus:'draft'},...flags.map(flag=>({[flag]:true}))])assert.throws(()=>verifyWatchWegovySourceRenewal({...receipt(),...patch},options()));
});

test('every renewal boundary rejects unrelated files and source drift',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchWegovySourceRenewal(receipt(),o));}
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchWegovySourceRenewal(receipt(),o),/drift/);}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchWegovySourceRenewal(receipt(),o));
});

test('real composition preserves the prior 35 reviews and delayed-source distinctions',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchWegovySourceRenewal.source,source);assert.equal(c.watchWegovySourceRenewal.preservedSourceReviews,35);assert.equal(c.watchWegovySourceRenewal.verificationPending,1);assert.equal(c.watchWegovySourceRenewal.delayedSources,2);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/drift/);
});
