import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchAlnylamRnaiDiscovery,verifyReconciledRelease,WATCH_ALNYLAM_RNAI_BASE as base,WATCH_ALNYLAM_RNAI_SOURCE as source,WATCH_ALNYLAM_RNAI_PATHS as paths,WATCH_ALNYLAM_RNAI_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';

const flags=['monitorBaselinesChanged','monitorLogicChanged','queueLogicChanged','healthResponseChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','clinicalApprovalChanged','memberTreatmentChanged','homepageChanged','startHereChanged','sharedNavigationChanged','calculatorChanged','analyticsChanged','consentChanged','checkoutChanged','customerDataChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_WATCH_ALNYLAM_RNAI_DISCOVERY_20261011',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1326,integrationIssue:1065,publicationStatus:'owner_authorised_factual_publication',clinicalApproval:null,industryComplete:false,reviewedAt:'2026-10-11T16:47:11Z',programmeIds:['aln2232','aln6222'],programmesBefore:116,programmesAfter:118,configuredSources:202,manualEvidenceBefore:96,manualEvidenceAfter:101,preservedSourceReviews:35,programmeSummaryFactualReviewNeeded:66,verificationPending:1,delayedSources:2,zp6590VerificationPending:true,zp6590CheckDelayed:true,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',watchAlnylamRnaiDiscovery:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});

test('Alnylam RNAi composition accepts only the reviewed programmes, counters and finite authorisation',()=>{
 verifyWatchAlnylamRnaiDiscovery(receipt(),options());
 const patches=[{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{publicationStatus:'clinical_approval'},{clinicalApproval:'approved'},{industryComplete:true},{reviewedAt:'2026-10-12T00:00:00Z'},{programmeIds:['aln2232']},{programmesBefore:115},{programmesAfter:119},{configuredSources:203},{manualEvidenceBefore:95},{manualEvidenceAfter:102},{preservedSourceReviews:34},{programmeSummaryFactualReviewNeeded:67},{verificationPending:0},{delayedSources:1},{zp6590VerificationPending:false},{zp6590CheckDelayed:false},{paths:[...paths,'worker.js']},{maintenancePaths:[...maintenance,'monitor.mjs']},{maintenanceSource:'not-a-sha'},...flags.map(k=>({[k]:true}))];
 for(const patch of patches)assert.throws(()=>verifyWatchAlnylamRnaiDiscovery({...receipt(),...patch},options()));
});

test('Alnylam RNAi boundaries, ancestry and every source drift fail closed',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),d=o.diff;o.diff=(a,b)=>a===boundary?[...d(a,b),'worker.js']:d(a,b);assert.throws(()=>verifyWatchAlnylamRnaiDiscovery(receipt(),o),/Unrelated|Unreviewed/);}
 const ancestry=options();ancestry.ancestor=()=>{throw Error('not an ancestor');};assert.throws(()=>verifyWatchAlnylamRnaiDiscovery(receipt(),ancestry),/not an ancestor/);
 for(const path of [...paths,...maintenance]){const o=options();verifyWatchAlnylamRnaiDiscovery(receipt(),o);o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyWatchAlnylamRnaiDiscovery(receipt(),o),/source drift/);}
 const changed=options();changed.content=ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'changed',watchAlnylamRnaiDiscovery:{}});assert.throws(()=>verifyWatchAlnylamRnaiDiscovery(receipt(),changed),/Prior release receipts/);
});

test('real Alnylam RNAi composition preserves earlier receipts and manual-evidence boundaries',()=>{
 const current=verifyReconciledRelease();assert.equal(current.watchAlnylamRnaiDiscovery.source,source);
 const prior=JSON.parse(read(base,manifest)),retained=structuredClone(current);delete retained.watchAlnylamRnaiDiscovery;assert.deepEqual(retained,prior);
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
 const factual=JSON.parse(read('HEAD','medicines-watch/reviews/2026-10-11-authorised-alnylam-rnai-discovery.json'));
 assert.equal(factual.automatedMonitorChanges,false);assert.equal(factual.clinicalApproval,null);assert.equal(factual.entries.length,2);
 assert.deepEqual(factual.remainingObstacles.find(item=>item.id==='zealand-zp6590-pipeline').state,['verification_pending','check_delayed']);
 assert.deepEqual(factual.remainingObstacles.find(item=>item.id==='alnylam-registry-api').state,['manual_follow_up']);
 for(const path of paths)assert.equal(read('HEAD',path),read(source,path));
});

test('prior composition verifiers and runtime monitor logic remain immutable',()=>{
 const functionBody=(ref,name)=>{const text=read(ref,'release/approved-runtime-composition.mjs'),start=text.indexOf('export function '+name+'(');assert(start>=0);return text.slice(start,text.indexOf('\n}\n',start)+3);};
 for(const name of ['verifyWatchAzelapragRenewal','verifyWaistKeyboardSettle','verifyWaistRollbackRetention','verifyWaistReadingStrip','verifyWatchTwoSourceFreshness','verifyWatchTwoSourceReleaseGuardRepair'])assert.equal(functionBody('HEAD',name),functionBody(base,name));
 for(const path of ['medicines-watch/monitor.mjs','medicines-watch/evidence-desk.mjs','.github/workflows/cloudflare-production-promote.yml','tests/late-watch-composition.test.mjs'])assert.equal(read('HEAD',path),read(base,path));
});
