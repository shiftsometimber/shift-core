import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifySupportBudgetTestRepair as verify,verifyReconciledRelease,SUPPORT_BUDGET_TEST_REPAIR_BASE as base,SUPPORT_BUDGET_TEST_REPAIR_SOURCE as source,SUPPORT_BUDGET_TEST_REPAIR_PATHS as paths,SUPPORT_BUDGET_TEST_REPAIR_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
const flags=["runtimeChanged","workflowChanged","browserAssertionsChanged","productPerformanceThresholdsChanged","priorReceiptAssertionsRemoved","clinicalGatesChanged","homepageChanged","customerDataChanged","externalCommunicationsSent","genericAdoptionAllowed","deploymentAuthorityBroadened","rollbackAuthorityBroadened","existingGatesWeakened"];
const receipt=()=>({proof:'EXACT_SUPPORT_BUDGET_PRIOR_RECEIPT_TEST_REPAIR_20261012',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),integrationIssue:1065,publicationStatus:'staged_master_prior_receipt_test_repair',failedHead:base,failedTest:'actual scope repair preserves the complete prior receipts and all original verifier bodies',...Object.fromEntries(flags.map(k=>[k,false]))});
const fragments=[
 ['delete retained.supportRecoveryHistoricalScope;assert.deepEqual(retained,prior);','delete retained.supportRecoveryHistoricalScope;delete retained.supportRecoveryIntegrationBudget;delete retained.supportRecoveryIntegrationBudgetTestRepair;assert.deepEqual(retained,prior);'],
 ['delete retained.supportRecoveryIntegrationBudget;assert.deepEqual(retained,prior);','delete retained.supportRecoveryIntegrationBudget;delete retained.supportRecoveryIntegrationBudgetTestRepair;assert.deepEqual(retained,prior);']
];
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:(ref,path)=>path===manifest?JSON.stringify(ref===base?{retained:'same'}:{retained:'same',supportRecoveryIntegrationBudgetTestRepair:{}}):'prefix '+fragments[paths.indexOf(path)][ref===source?1:0]+' suffix',diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
test('prior-receipt test repair admits only exact named later receipts and no extra authority',()=>{
 verify(receipt(),options());
 for(const patch of [{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{failedHead:'f'.repeat(40)},{failedTest:'other'},{integrationIssue:1},{publicationStatus:'approved_production'},{maintenanceSource:'invalid'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verify({...receipt(),...patch},options()));
});
test('prior-receipt test repair rejects every raw drift, unknown path, ancestry loss and altered old receipt',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'changed':'same';assert.throws(()=>verify(receipt(),o),/source drift/);}
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),d=o.diff;o.diff=(a,b)=>a===boundary?[...d(a,b),'worker.js']:d(a,b);assert.throws(()=>verify(receipt(),o),/Unrelated|Unreviewed/);}
 const a=options();a.ancestor=()=>{throw Error('not ancestor');};assert.throws(()=>verify(receipt(),a),/not ancestor/);
 const o=options(),c=o.content;o.content=(ref,path)=>path===manifest&&ref!=='c0b39e7642d83ac9536830a24c2504998a316439'?JSON.stringify({retained:'changed',supportRecoveryIntegrationBudgetTestRepair:{}}):c(ref,path);assert.throws(()=>verify(receipt(),o),/Prior release receipts/);
});
test('prior-receipt test repair preserves every old assertion and rejects any different test edit',()=>{
 for(const path of paths){const o=options(),c=o.content;o.content=(ref,p)=>ref===source&&p===path?c(ref,p).replace('assert.deepEqual(retained,prior);',''):c(ref,p);assert.throws(()=>verify(receipt(),o),/Only the named verified later receipts/);}
});
test('actual repair retains all prior records, production controls and original verifier functions',()=>{
 const current=verifyReconciledRelease();assert.equal(current.supportRecoveryIntegrationBudgetTestRepair.source,source);
 const prior=JSON.parse(read(base,manifest)),retained=structuredClone(current);delete retained.supportRecoveryIntegrationBudgetTestRepair;assert.deepEqual(retained,prior);
 for(const path of [...paths,...maintenance])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
 for(const path of ['.github/workflows/shift-coach-integration.yml','.github/workflows/cloudflare-production-promote.yml','shift-coach/scope.mjs','release/fit-300-scope.mjs','shift-coach/full-page-proof.mjs','shift-coach/browser-proof.mjs','shift-coach/member-record-browser.mjs','shift-coach/public-trust-browser.mjs','tests/tablet-routine-browser.mjs','frontend/member/turnstile-auth-v1.js','shift-coach/public-trust-repair.mjs','shift-coach/support-content-20261010.mjs','worker.js','medicines-watch/README.md','medicines-watch/industry.mjs'])assert.equal(read('HEAD',path),read(base,path));
 const before=read(base,maintenance[0]),after=read('HEAD',maintenance[0]);
 const body=(t,name)=>{const start=t.indexOf('export function '+name+'(');return t.slice(start,t.indexOf('\n}\n',start)+3);};
 for(const match of before.matchAll(/export function (\w+)\(/g))if(match[1]!=='verifyReconciledRelease')assert.equal(body(after,match[1]),body(before,match[1]),match[1]);
});
