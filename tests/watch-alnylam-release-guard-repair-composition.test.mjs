import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchAlnylamReleaseGuardRepair,verifyReconciledRelease,WATCH_ALNYLAM_RELEASE_GUARD_REPAIR_BASE as base,WATCH_ALNYLAM_RELEASE_GUARD_REPAIR_SOURCE as source,WATCH_ALNYLAM_RELEASE_GUARD_REPAIR_PATHS as paths,WATCH_ALNYLAM_RELEASE_GUARD_REPAIR_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';

const flags=['medicalEvidenceChanged','reviewDatesChanged','programmeWordingChanged','queueLogicChanged','healthResponseChanged','monitorBaselinesChanged','verificationPendingChanged','delayedStatusChanged','memberTreatmentChanged','homepageChanged','startHereChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged','checkoutChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_ALNYLAM_RELEASE_GUARD_REPAIR_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1327,integrationIssue:1065,failedRun:38158492201,failureGate:'Verify B1 release scope before any production mutation',releaseReachedProduction:false,repair:'recognise exact Alnylam RNAi discovery drift label',...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{prior:true}:{prior:true,watchAlnylamReleaseGuardRepair:{}}),diff:a=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});

test('Alnylam release-guard repair is finite and preserves all factual and runtime boundaries',()=>{
 verifyWatchAlnylamReleaseGuardRepair(receipt(),options());
 const patches=[{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{failedRun:1},{failureGate:'other'},{releaseReachedProduction:true},{repair:'other'},{paths:[...paths,'worker.js']},{maintenancePaths:[...maintenance,'medicines-watch/monitor.mjs']},{maintenanceSource:'not-a-sha'},...flags.map(k=>({[k]:true}))];
 for(const patch of patches)assert.throws(()=>verifyWatchAlnylamReleaseGuardRepair({...receipt(),...patch},options()));
});

test('Alnylam repair boundaries, ancestry and every source drift fail closed',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),d=o.diff;o.diff=(a,b)=>a===boundary?[...d(a,b),'worker.js']:d(a,b);assert.throws(()=>verifyWatchAlnylamReleaseGuardRepair(receipt(),o),/Unrelated|Unreviewed/);}
 const ancestry=options();ancestry.ancestor=()=>{throw Error('not an ancestor');};assert.throws(()=>verifyWatchAlnylamReleaseGuardRepair(receipt(),ancestry),/not an ancestor/);
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchAlnylamReleaseGuardRepair(receipt(),o),/source drift/);}
 const changed=options();changed.content=ref=>JSON.stringify(ref===base?{prior:true}:{prior:false,watchAlnylamReleaseGuardRepair:{}});assert.throws(()=>verifyWatchAlnylamReleaseGuardRepair(receipt(),changed),/Prior release receipts/);
});

test('real composition preserves the Alnylam publication counters and pending-delayed distinction',()=>{
 const current=verifyReconciledRelease();assert.equal(current.watchAlnylamReleaseGuardRepair.source,source);
 assert.equal(current.watchAlnylamRnaiDiscovery.programmesAfter,118);assert.equal(current.watchAlnylamRnaiDiscovery.configuredSources,202);assert.equal(current.watchAlnylamRnaiDiscovery.manualEvidenceAfter,101);
 assert.equal(current.watchAlnylamRnaiDiscovery.preservedSourceReviews,35);assert.equal(current.watchAlnylamRnaiDiscovery.programmeSummaryFactualReviewNeeded,66);
 assert.equal(current.watchAlnylamRnaiDiscovery.verificationPending,1);assert.equal(current.watchAlnylamRnaiDiscovery.delayedSources,2);assert.equal(current.watchAlnylamRnaiDiscovery.zp6590VerificationPending,true);assert.equal(current.watchAlnylamRnaiDiscovery.zp6590CheckDelayed,true);
 const prior=JSON.parse(read(base,manifest)),retained=structuredClone(current);for(const key of Object.keys(retained))if(!(key in prior))delete retained[key];assert.deepEqual(retained,prior);
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
});

test('Alnylam inner verifier, negative drift tests and monitor logic remain immutable',()=>{
 const functionBody=(ref,name)=>{const text=read(ref,'release/approved-runtime-composition.mjs'),start=text.indexOf('export function '+name+'(');assert(start>=0);return text.slice(start,text.indexOf('\n}\n',start)+3);};
 assert.equal(functionBody('HEAD','verifyWatchAlnylamRnaiDiscovery'),functionBody(base,'verifyWatchAlnylamRnaiDiscovery'));
 for(const path of ['medicines-watch/monitor.mjs','medicines-watch/evidence-desk.mjs','.github/workflows/cloudflare-production-promote.yml','tests/late-watch-composition.test.mjs'])assert.equal(read('HEAD',path),read(base,path));
 const current=verifyReconciledRelease(),registered=current.watchRibupatideLy4329090.maintenanceSource;
 assert.equal(read('HEAD','tests/watch-alnylam-rnai-discovery-composition.test.mjs'),read(registered,'tests/watch-alnylam-rnai-discovery-composition.test.mjs'));
});
