import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyWatchRhythmPdfAlternatives,verifyReconciledRelease,WATCH_RHYTHM_PDF_ALTERNATIVES_BASE as base,WATCH_RHYTHM_PDF_ALTERNATIVES_SOURCE as source,WATCH_RHYTHM_PDF_ALTERNATIVES_PATHS as paths,WATCH_RHYTHM_PDF_ALTERNATIVES_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const falseFlags=['programmeWordingChanged','programmeReviewDatesChanged','configuredSourceCountChanged','monitorLogicChanged','healthResponseChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','memberTreatmentChanged','homepageChanged','startHereChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged','checkoutChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const ids=['bivamelagon-rhythm-20250709','rm718-rhythm-20260804'];
const fingerprints=['9f0faf3cb0d4f6b24e93601eee0a6090ef2f604e8e22b3cc9315dd3e67343805','d10fbca2dfa163968fa0dd3fc406d5a15118fbe5b1d23339455e54ebb3805fa6'];
const receipt=()=>({proof:'EXACT_WATCH_RHYTHM_PDF_ALTERNATIVES_20261012',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),integrationIssue:1065,publicationStatus:'owner_authorised_source_monitor_repair',clinicalApproval:null,industryComplete:false,reviewedAt:'2026-10-12T10:36:09Z',sourceReviewsApplied:2,programmeReviewsApplied:0,sourceIds:ids,reviewedFingerprints:fingerprints,priorCompletedReviews:39,completedReviewsAfter:40,programmesAfter:119,configuredSources:204,manualEvidenceAfter:102,configuredSourceReviewQueue:0,programmeSummaryFactualReviewNeeded:69,successesSeeded:false,zp6590VerificationPending:true,zp6590CheckDelayed:true,monitoringFinished:false,...Object.fromEntries(falseFlags.map(key=>[key,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchRhythmPdfAlternatives:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('Rhythm PDF alternate-source composition is finite and preserves every boundary',()=>{
 verifyWatchRhythmPdfAlternatives(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{integrationIssue:1},{publicationStatus:'other'},{clinicalApproval:true},{industryComplete:true},{reviewedAt:'wrong'},{sourceReviewsApplied:1},{programmeReviewsApplied:1},{sourceIds:['wrong']},{reviewedFingerprints:['wrong']},{priorCompletedReviews:38},{completedReviewsAfter:39},{programmesAfter:120},{configuredSources:203},{manualEvidenceAfter:101},{configuredSourceReviewQueue:1},{programmeSummaryFactualReviewNeeded:68},{successesSeeded:true},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},{monitoringFinished:true},...falseFlags.map(key=>({[key]:true}))])assert.throws(()=>verifyWatchRhythmPdfAlternatives({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'checkout.mjs']:diff(a,b);assert.throws(()=>verifyWatchRhythmPdfAlternatives(receipt(),o));}
});

test('every Rhythm PDF alternate-source payload and maintenance byte remains pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchRhythmPdfAlternatives(receipt(),o),/(?:Approved backlog source drift: medicines-watch\/Rhythm PDF alternatives payload|Backlog maintenance source drift: medicines-watch\/Rhythm PDF alternatives maintenance)/);}
});

test('current reconciliation requires the registered Rhythm PDF alternate-source chain',()=>assert(verifyReconciledRelease()));
