import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchOverdueRenewal,verifyReconciledRelease,WATCH_OVERDUE_RENEWAL_BASE as base,WATCH_OVERDUE_RENEWAL_SOURCE as source,WATCH_OVERDUE_RENEWAL_PATHS as paths,WATCH_OVERDUE_RENEWAL_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
const flags=['httpSuccessTreatedAsReview','medicalClaimsChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','monitorBaselinesChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_OVERDUE_PRIMARY_REVIEW_RENEWAL_V1',base,source,maintenanceSource:'a'.repeat(40),paths:[...paths],maintenancePaths:[...maintenance],integrationIssue:1065,approvedPR:1307,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,sourceReviews:67,registryRecords:63,officialAccessSources:4,factualChanges:0,zp6590VerificationPending:true,zp6590CheckDelayed:true,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchOverduePrimaryReviewRenewal:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
test('overdue-review receipt binds exactly 63 registry and four official access reviews',()=>verifyWatchOverdueRenewal(receipt(),options()));
test('overdue-review receipt rejects broader authority, changed claims and false ZP6590 resolution',()=>{
 for(const patch of [{source:'f'.repeat(40)},{approvedPR:1},{clinicalApproval:true},{sourceReviews:0},{registryRecords:0},{officialAccessSources:0},{factualChanges:1},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchOverdueRenewal({...receipt(),...patch},options()));
});
test('overdue-review receipt rejects unrelated files and prior-ledger changes at every boundary',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchOverdueRenewal(receipt(),o));}
 const o=options();o.content=ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'changed',watchOverduePrimaryReviewRenewal:{}});assert.throws(()=>verifyWatchOverdueRenewal(receipt(),o),/Prior release receipts/);
});
test('overdue-review payload and maintenance cannot drift at HEAD',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchOverdueRenewal(receipt(),o),/source drift/);}
});
test('real composition retains prior receipts and detects every overdue-review drift',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchOverduePrimaryReviewRenewal.source,source);assert.equal(c.obesityHubTransport.source,'b3df285586189f1be6560cce7e42e0bdf77ca73b');
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 for(const path of new Set([...paths,...maintenance]))assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
