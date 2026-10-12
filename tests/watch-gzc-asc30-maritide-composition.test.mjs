import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyWatchGzcAsc30Maritide,verifyReconciledRelease,WATCH_GZC_ASC30_MARITIDE_BASE as base,WATCH_GZC_ASC30_MARITIDE_SOURCE as source,WATCH_GZC_ASC30_MARITIDE_PATHS as paths,WATCH_GZC_ASC30_MARITIDE_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const falseFlags=['resultsClaimedFromRegistry','comparativeResultClaimed','monitorLogicChanged','healthResponseChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','memberTreatmentChanged','homepageChanged','startHereChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged','checkoutChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const ids=['ganlee-gzc8072-20260907','registry-nct07784699','ascletis-asc30-aurora-first-dose-20260830','registry-nct07743463','registry-nct07743450','registry-nct07866066'];
const fingerprints=['1ed471c800e14e097582461b9dfe58f79cbc64579edb69597ba0601db45c6a73','eb71180cf8a8d8066ef1cf769e1218856ec76be8046b9b2eae6715aa03e1b0a1','3a6d993aa33d6ce54cf0862534214ca8e54c88791723666c2582fccbf0046617','d1eb3187dbcc3ce406ea09e1b99305327237e85020f5b9490268779048a2ac99','acea4e5a0322dfda5ff5ab12d08d2e207071811da2543fa116c148c906f997c4','3366f89ab798b87ac4c6392bd2f594a98efba557fe237c39f6a6e5b58d871271'];
const receipt=()=>({proof:'EXACT_WATCH_GZC_ASC30_MARITIDE_20261012',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),integrationIssue:1065,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,industryComplete:false,reviewedAt:'2026-10-12T05:02:00Z',sourceReviewsApplied:6,programmeReviewsApplied:3,sourceIds:ids,reviewedFingerprints:fingerprints,priorCompletedReviews:38,completedReviewsAfter:39,programmesAfter:119,configuredSources:204,manualEvidenceAfter:102,configuredSourceReviewQueue:0,programmeSummaryFactualReviewNeeded:68,newConfiguredSourceAdded:true,zp6590VerificationPending:true,zp6590CheckDelayed:true,monitoringFinished:false,...Object.fromEntries(falseFlags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchGzcAsc30Maritide:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('GZC8072 ASC30 renewal and MariTide discovery composition is finite',()=>{
 verifyWatchGzcAsc30Maritide(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{integrationIssue:1},{publicationStatus:'other'},{clinicalApproval:true},{industryComplete:true},{reviewedAt:'wrong'},{sourceReviewsApplied:5},{programmeReviewsApplied:2},{sourceIds:['wrong']},{reviewedFingerprints:['wrong']},{priorCompletedReviews:37},{completedReviewsAfter:38},{programmesAfter:120},{configuredSources:203},{manualEvidenceAfter:101},{configuredSourceReviewQueue:1},{programmeSummaryFactualReviewNeeded:67},{newConfiguredSourceAdded:false},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},{monitoringFinished:true},...falseFlags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchGzcAsc30Maritide({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'checkout.mjs']:diff(a,b);assert.throws(()=>verifyWatchGzcAsc30Maritide(receipt(),o));}
});

test('every GZC8072 ASC30 MariTide payload and maintenance byte remains pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchGzcAsc30Maritide(receipt(),o),/(?:Approved backlog source drift: medicines-watch\/GZC8072 ASC30 MariTide payload|Backlog maintenance source drift: medicines-watch\/GZC8072 ASC30 MariTide maintenance)/);}
});

test('current reconciliation requires the registered GZC8072 ASC30 MariTide chain',()=>assert(verifyReconciledRelease()));
