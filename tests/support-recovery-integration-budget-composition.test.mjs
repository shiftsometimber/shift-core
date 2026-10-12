import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifySupportRecoveryIntegrationBudget as verify,verifyReconciledRelease,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
const r={
  "proof": "EXACT_SUPPORT_RECOVERY_INTEGRATION_BUDGET_20261012",
  "base": "e33d2d554af1a2d279f722bf9c7d8bf2ea2f4b7c",
  "source": "3f47b52d7656f05a136c03f7d05071fc826e7b16",
  "paths": [
    ".github/workflows/shift-coach-integration.yml"
  ],
  "maintenancePaths": [
    "release/approved-runtime-composition.mjs",
    "tests/support-recovery-integration-budget-composition.test.mjs"
  ],
  "maintenanceSource": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "integrationIssue": 1065,
  "publicationStatus": "staged_master_ci_budget_repair",
  "failedWorkflowRun": 38278150805,
  "failedJob": 114908583075,
  "failedHead": "e33d2d554af1a2d279f722bf9c7d8bf2ea2f4b7c",
  "observedJobConclusion": "cancelled",
  "cancellationAnnotation": "The job has exceeded the maximum execution time of 30m0s",
  "priorJobMinutes": 30,
  "jobMinutes": 60,
  "runtimeChanged": false,
  "browserAssertionsChanged": false,
  "testScopeChanged": false,
  "productPerformanceThresholdsChanged": false,
  "workflowTriggersChanged": false,
  "workflowPermissionsChanged": false,
  "productionWorkflowChanged": false,
  "homepageChanged": false,
  "medicalEvidenceChanged": false,
  "clinicalGatesChanged": false,
  "memberDataChanged": false,
  "checkoutChanged": false,
  "externalCommunicationsSent": false,
  "genericAdoptionAllowed": false,
  "deploymentAuthorityBroadened": false,
  "rollbackAuthorityBroadened": false,
  "existingGatesWeakened": false
};
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===r.base?{retained:'same'}:{retained:'same',supportRecoveryIntegrationBudget:{}}),diff:(a,b)=>a===r.base?r.paths:a===r.source?r.maintenancePaths:[manifest]});
test('integration budget repair retains exact cancellation, execution bounds and original controls',()=>{
 verify(r,options());
 for(const patch of [{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{maintenanceSource:'invalid'},{integrationIssue:1},{publicationStatus:'approved_production'},{failedWorkflowRun:1},{failedJob:1},{failedHead:'f'.repeat(40)},{observedJobConclusion:'success'},{cancellationAnnotation:'unknown'},{priorJobMinutes:20},{jobMinutes:90},{paths:[...r.paths,'worker.js']},{maintenancePaths:[...r.maintenancePaths,'worker.js']},...["runtimeChanged", "browserAssertionsChanged", "testScopeChanged", "productPerformanceThresholdsChanged", "workflowTriggersChanged", "workflowPermissionsChanged", "productionWorkflowChanged", "homepageChanged", "medicalEvidenceChanged", "clinicalGatesChanged", "memberDataChanged", "checkoutChanged", "externalCommunicationsSent", "genericAdoptionAllowed", "deploymentAuthorityBroadened", "rollbackAuthorityBroadened", "existingGatesWeakened"].map(k=>({[k]:true}))])assert.throws(()=>verify({...r,...patch},options()));
});
test('integration budget repair rejects source drift, unregistered scope, missing ancestry and receipt changes',()=>{
 for(const path of [...r.paths,...r.maintenancePaths]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verify(r,o),/source drift/);}
 for(const boundary of [r.base,r.source,r.maintenanceSource]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verify(r,o),/Unrelated|Unreviewed/);}
 const a=options();a.ancestor=()=>{throw Error('not an ancestor');};assert.throws(()=>verify(r,a),/not an ancestor/);
 const c=options();c.content=ref=>JSON.stringify(ref===r.base?{retained:'same'}:{retained:'changed',supportRecoveryIntegrationBudget:{}});assert.throws(()=>verify(r,c),/Prior release receipts/);
});
test('actual workflow changes only its execution budget and preserves every runtime and browser assertion',()=>{
 const before=read(r.base,r.paths[0]),after=read('HEAD',r.paths[0]);
 assert.equal((before.match(/timeout-minutes: 30/g)||[]).length,1);
 assert.equal(after,before.replace('timeout-minutes: 30','timeout-minutes: 60'));
 for(const path of ['.github/workflows/cloudflare-production-promote.yml','shift-coach/scope.mjs','release/fit-300-scope.mjs','shift-coach/full-page-proof.mjs','shift-coach/browser-proof.mjs','shift-coach/member-record-browser.mjs','shift-coach/public-trust-browser.mjs','tests/tablet-routine-browser.mjs','frontend/member/turnstile-auth-v1.js','shift-coach/public-trust-repair.mjs','shift-coach/support-content-20261010.mjs','worker.js'])assert.equal(read('HEAD',path),read(r.base,path));
});
test('actual budget composition preserves all prior receipts and historical verifier bodies',()=>{
 const current=verifyReconciledRelease();assert.equal(current.supportRecoveryIntegrationBudget.source,r.source);
 const prior=JSON.parse(read(r.base,manifest)),retained=structuredClone(current);delete retained.supportRecoveryIntegrationBudget;assert.deepEqual(retained,prior);
 for(const path of [...r.paths,...r.maintenancePaths])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
 const before=read(r.base,'release/approved-runtime-composition.mjs'),after=read('HEAD','release/approved-runtime-composition.mjs');
 const body=(t,name)=>{const start=t.indexOf('export function '+name+'(');return t.slice(start,t.indexOf('\n}\n',start)+3);};
 for(const match of before.matchAll(/export function (\w+)\(/g))if(match[1]!=='verifyReconciledRelease')assert.equal(body(after,match[1]),body(before,match[1]),match[1]);
});
