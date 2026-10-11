import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchRgtVctSourceRenewal,verifyReconciledRelease,WATCH_RGT_VCT_RENEWAL_BASE as base,WATCH_RGT_VCT_RENEWAL_SOURCE as source,WATCH_RGT_VCT_RENEWAL_PATHS as paths,WATCH_RGT_VCT_RENEWAL_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['programmeWordingChanged','programmeReviewDatesChanged','programmeSummaryQueueChanged','configuredSourceCountChanged','registryLifecycleChanged','resultsClaimed','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','reviewDatesRenewedByHttp','monitorBaselinesChanged','queueLogicChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_RGT_VCT_SOURCE_RENEWAL_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1318,integrationIssue:1065,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,industryComplete:false,sourceReviewsApplied:6,programmesAfter:116,configuredSources:202,preservedSourceReviews:35,configuredSourceFactualReviewNeeded:0,programmeSummaryFactualReviewNeeded:66,verificationPending:1,delayedSources:1,zp6590VerificationPending:true,zp6590CheckDelayed:true,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchRgtVctSourceRenewal:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('RGT/VCT renewal receipt is finite and preserves unresolved evidence boundaries',()=>{
 verifyWatchRgtVctSourceRenewal(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{sourceReviewsApplied:0},{programmesAfter:0},{configuredSources:0},{preservedSourceReviews:0},{configuredSourceFactualReviewNeeded:1},{programmeSummaryFactualReviewNeeded:0},{verificationPending:0},{delayedSources:0},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},{clinicalApproval:true},{industryComplete:true},{publicationStatus:'draft'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchRgtVctSourceRenewal({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchRgtVctSourceRenewal(receipt(),o));}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchRgtVctSourceRenewal(receipt(),o));
});

test('every reviewed source payload and release-maintenance blob stays pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchRgtVctSourceRenewal(receipt(),o),/source drift/);}
});

test('real composition retains separate source and programme-summary counts',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchRgtVctSourceRenewal.source,source);assert.equal(c.watchRgtVctSourceRenewal.configuredSourceFactualReviewNeeded,0);assert.equal(c.watchRgtVctSourceRenewal.programmeSummaryFactualReviewNeeded,66);assert.equal(c.watchRgtVctSourceRenewal.verificationPending,1);assert.equal(c.watchRgtVctSourceRenewal.delayedSources,1);assert.equal(c.watchRgtVctSourceRenewal.zp6590VerificationPending,true);assert.equal(c.watchRgtVctSourceRenewal.zp6590CheckDelayed,true);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
