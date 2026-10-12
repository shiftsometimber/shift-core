import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyWatchAsc36SourceRenewal,verifyReconciledRelease,WATCH_ASC36_SOURCE_RENEWAL_BASE as base,WATCH_ASC36_SOURCE_RENEWAL_SOURCE as source,WATCH_ASC36_SOURCE_RENEWAL_PATHS as paths,WATCH_ASC36_SOURCE_RENEWAL_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const falseFlags=['programmeWordingChanged','programmeReviewDatesChanged','configuredSourceCountChanged','monitorLogicChanged','healthResponseChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','memberTreatmentChanged','homepageChanged','startHereChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged','checkoutChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_ASC36_SOURCE_RENEWAL_20261012',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),integrationIssue:1065,publicationStatus:'owner_authorised_factual_source_renewal',clinicalApproval:null,industryComplete:false,reviewedAt:'2026-10-12T11:55:30Z',sourceReviewsApplied:1,programmeReviewsApplied:0,sourceId:'ascletis-asc36-oral-phase1-20260908',reviewedFingerprint:'bb52bfb18d82adf8113eee808450543f5927d46dc5fda65e90d203c9564a4f39',priorCompletedReviews:40,completedReviewsAfter:41,programmesAfter:119,configuredSources:204,manualEvidenceAfter:102,configuredSourceReviewQueue:0,programmeSummaryFactualReviewNeeded:70,successesSeeded:false,zp6590VerificationPending:true,zp6590CheckDelayed:true,monitoringFinished:false,...Object.fromEntries(falseFlags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchAsc36SourceRenewal:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('ASC36 source-renewal composition is finite and preserves every boundary',()=>{
 verifyWatchAsc36SourceRenewal(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{integrationIssue:1},{publicationStatus:'other'},{clinicalApproval:true},{industryComplete:true},{reviewedAt:'wrong'},{sourceReviewsApplied:0},{programmeReviewsApplied:1},{sourceId:'wrong'},{reviewedFingerprint:'wrong'},{priorCompletedReviews:39},{completedReviewsAfter:40},{programmesAfter:120},{configuredSources:203},{manualEvidenceAfter:101},{configuredSourceReviewQueue:1},{programmeSummaryFactualReviewNeeded:69},{successesSeeded:true},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},{monitoringFinished:true},...falseFlags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchAsc36SourceRenewal({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'checkout.mjs']:diff(a,b);assert.throws(()=>verifyWatchAsc36SourceRenewal(receipt(),o));}
});

test('every ASC36 source-renewal payload and maintenance byte remains pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchAsc36SourceRenewal(receipt(),o),/(?:Approved backlog source drift: medicines-watch\/ASC36 source-renewal payload|Backlog maintenance source drift: medicines-watch\/ASC36 source-renewal maintenance)/);}
});

test('current reconciliation requires the registered ASC36 source-renewal chain',()=>assert(verifyReconciledRelease()));
