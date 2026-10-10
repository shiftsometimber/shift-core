import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchAscletisOralPortfolio,verifyReconciledRelease,WATCH_ASCLETIS_ORAL_BASE as base,WATCH_ASCLETIS_ORAL_SOURCE as source,WATCH_ASCLETIS_ORAL_PATHS as paths,WATCH_ASCLETIS_ORAL_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const flags=['humanEfficacyClaimed','humanSafetyClaimed','ukAuthorisationClaimed','nhsAccessClaimed','supplyClaimed','reviewDatesRenewedByHttp','monitorBaselinesChanged','queueLogicChanged','memberTreatmentChanged','homepageChanged','startHereChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_ASCLETIS_ORAL_PORTFOLIO_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1300,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,programmesReviewed:4,programmesAfter:116,manualEvidenceAfter:96,configuredSources:199,preservedSourceReviews:35,factualReviewNeeded:0,verificationPending:1,delayedSources:1,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[RECONCILIATION_MANIFEST]});
test('Ascletis oral portfolio requires the exact bounded payload and preserves evidence uncertainty',()=>{
 verifyWatchAscletisOralPortfolio(receipt(),options());
 for(const patch of [{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{programmesReviewed:0},{programmesAfter:0},{manualEvidenceAfter:0},{configuredSources:0},{preservedSourceReviews:0},{factualReviewNeeded:1},{verificationPending:0},{delayedSources:0},{clinicalApproval:true},{publicationStatus:'draft'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyWatchAscletisOralPortfolio({...receipt(),...patch},options()));
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyWatchAscletisOralPortfolio(receipt(),o));}
 const o=options();o.ancestor=()=>{throw Error('unrelated history')};assert.throws(()=>verifyWatchAscletisOralPortfolio(receipt(),o));
});
test('every current factual and maintenance blob must match its pinned source',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(r,p)=>r==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchAscletisOralPortfolio(receipt(),o),/source drift/);}
});
test('real composition retains the prior source reviews and delayed ZP6590 distinction',()=>{
 const c=verifyReconciledRelease();assert.equal(c.watchAscletisOralPortfolio.source,source);assert.equal(c.watchAscletisOralPortfolio.preservedSourceReviews,35);assert.equal(c.watchAscletisOralPortfolio.factualReviewNeeded,0);assert.equal(c.watchAscletisOralPortfolio.verificationPending,1);assert.equal(c.watchAscletisOralPortfolio.delayedSources,1);
 const read=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});
