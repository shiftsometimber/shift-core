import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchSrsd384Renewal,verifyReconciledRelease,WATCH_SRSD384_RENEWAL_BASE as base,WATCH_SRSD384_RENEWAL_SOURCE as source,WATCH_SRSD384_RENEWAL_PATHS as paths,WATCH_SRSD384_RENEWAL_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';

const flags=['programmeWordingChanged','programmeCountChanged','configuredSourceCountChanged','registryStatusChanged','sponsorClaimChanged','resultsClaimed','ukAuthorisationClaimed','nhsAccessClaimed','supplyClaimed','reviewDatesRenewedByHttp','monitorBaselinesChanged','queueLogicChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_SRSD384_RENEWAL_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1313,integrationIssue:1065,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,industryComplete:false,sourceReviewsApplied:1,existingKaileraReviewsConnected:2,programmesAfter:116,configuredSources:202,trialRecordsAfter:137,factualReviewNeeded:0,verificationPending:1,delayedSources:1,zp6590VerificationPending:true,zp6590CheckDelayed:true,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref)=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchSrsd384Renewal:{}}),diff:(a)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});

test('SRSD384 renewal receipt is finite and preserves unresolved evidence boundaries',()=>{
 verifyWatchSrsd384Renewal(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{sourceReviewsApplied:0},{existingKaileraReviewsConnected:0},{programmesAfter:0},{configuredSources:0},{trialRecordsAfter:0},{factualReviewNeeded:1},{verificationPending:0},{delayedSources:0},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},{clinicalApproval:true},{industryComplete:true},{publicationStatus:'draft'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchSrsd384Renewal({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchSrsd384Renewal(receipt(),o));}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchSrsd384Renewal(receipt(),o));
});

test('every reviewed payload and release-maintenance blob stays pinned',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchSrsd384Renewal(receipt(),o),/source drift/);}
});

test('real composition preserves ZP6590 pending-delayed and the repaired zero-review queue',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchSrsd384Renewal.source,source);assert.equal(c.watchSrsd384Renewal.factualReviewNeeded,0);assert.equal(c.watchSrsd384Renewal.verificationPending,1);assert.equal(c.watchSrsd384Renewal.delayedSources,1);assert.equal(c.watchSrsd384Renewal.zp6590VerificationPending,true);assert.equal(c.watchSrsd384Renewal.zp6590CheckDelayed,true);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
