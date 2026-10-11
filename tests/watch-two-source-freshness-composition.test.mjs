import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchTwoSourceFreshness,verifyReconciledRelease,WATCH_TWO_SOURCE_FRESHNESS_BASE as base,WATCH_TWO_SOURCE_FRESHNESS_SOURCE as source,WATCH_TWO_SOURCE_FRESHNESS_PATHS as paths,WATCH_TWO_SOURCE_FRESHNESS_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['programmeWordingChanged','programmeReviewDatesChanged','configuredSourceCountChanged','programmeCountChanged','registryLifecycleChanged','resultsClaimed','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','reviewDatesRenewedByHttp','monitorBaselinesChanged','queueLogicChanged','healthResponseChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_TWO_SOURCE_FRESHNESS_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1320,integrationIssue:1065,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,industryComplete:false,sourceReviewsApplied:2,preservedSourceReviews:35,programmesAfter:116,configuredSources:202,configuredSourceFactualReviewNeeded:0,programmeSummaryFactualReviewNeeded:66,verificationPending:1,delayedSources:1,zp6590VerificationPending:true,zp6590CheckDelayed:true,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchTwoSourceFreshness:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('two-source freshness review is finite and preserves all factual boundaries',()=>{
 verifyWatchTwoSourceFreshness(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{publicationStatus:'other'},{clinicalApproval:'claimed'},{industryComplete:true},{sourceReviewsApplied:1},{preservedSourceReviews:34},{programmesAfter:115},{configuredSources:201},{configuredSourceFactualReviewNeeded:1},{programmeSummaryFactualReviewNeeded:65},{verificationPending:0},{delayedSources:0},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchTwoSourceFreshness({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchTwoSourceFreshness(receipt(),o));}
});

test('two-source review and release maintenance blobs remain byte-pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchTwoSourceFreshness(receipt(),o),/Backlog maintenance source drift/);}
});

test('real composition retains both reviews, separate queue, and ZP pending-delayed',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchTwoSourceFreshness.source,source);
 assert.equal(c.watchTwoSourceFreshness.sourceReviewsApplied,2);
 assert.equal(c.watchTwoSourceFreshness.preservedSourceReviews,35);
 assert.equal(c.watchTwoSourceFreshness.configuredSourceFactualReviewNeeded,0);
 assert.equal(c.watchTwoSourceFreshness.programmeSummaryFactualReviewNeeded,66);
 assert.equal(c.watchTwoSourceFreshness.zp6590VerificationPending,true);
 assert.equal(c.watchTwoSourceFreshness.zp6590CheckDelayed,true);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/Backlog maintenance source drift/);
});
