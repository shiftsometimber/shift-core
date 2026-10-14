import {combinedPositiveHistoricalRead} from '../release/combined-finite-scope-20261014.mjs';
import {myTimberHistoricalFile} from '../release/my-timber-progress-journey-scope.mjs';
import {myTimberHistoricalRecord} from '../release/my-timber-progress-journey-scope.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifySupportRecoveryHistoricalScope as verify,verifyReconciledRelease,reconciliationPath,COMPOSITION_BASE,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
import {fit300HistoricalGitArgs} from '../release/fit-300-scope.mjs';
const r={
  "proof": "EXACT_SUPPORT_RECOVERY_HISTORICAL_SCOPE_20261012",
  "base": "03490ebe9294d1ca069351244d5fdb2f9dc59785",
  "source": "9ebb818260f24bc21008953d1a336812058574bb",
  "paths": [
    "release/fit-300-scope.mjs"
  ],
  "maintenancePaths": [
    "release/approved-runtime-composition.mjs",
    "tests/support-recovery-historical-scope-composition.test.mjs"
  ],
  "maintenanceSource": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "integrationIssue": 1065,
  "publicationStatus": "staged_master_scope_repair",
  "failedWorkflowRun": 38275467124,
  "failedJob": 114899734173,
  "historicalDiffOnly": true,
  "runtimeChanged": false,
  "medicalEvidenceChanged": false,
  "reviewDatesChanged": false,
  "monitorLogicChanged": false,
  "homepageChanged": false,
  "primaryNavigationChanged": false,
  "memberDataChanged": false,
  "checkoutChanged": false,
  "mailRoutingChanged": false,
  "externalCommunicationsSent": false,
  "genericAdoptionAllowed": false,
  "deploymentAuthorityBroadened": false,
  "rollbackAuthorityBroadened": false,
  "existingGatesWeakened": false
};
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===r.base?{retained:'same'}:{retained:'same',supportRecoveryHistoricalScope:{}}),diff:(a,b)=>a===r.base?r.paths:a===r.source?r.maintenancePaths:[manifest]});
test('support historical-scope repair retains exact boundaries and all controls',()=>{
 verify(r,options());
 for(const patch of [{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{maintenanceSource:'invalid'},{integrationIssue:1},{publicationStatus:'approved_production'},{failedWorkflowRun:1},{failedJob:1},{historicalDiffOnly:false},{paths:[...r.paths,'worker.js']},{maintenancePaths:[...r.maintenancePaths,'worker.js']},...["runtimeChanged", "medicalEvidenceChanged", "reviewDatesChanged", "monitorLogicChanged", "homepageChanged", "primaryNavigationChanged", "memberDataChanged", "checkoutChanged", "mailRoutingChanged", "externalCommunicationsSent", "genericAdoptionAllowed", "deploymentAuthorityBroadened", "rollbackAuthorityBroadened", "existingGatesWeakened"].map(k=>({[k]:true}))])assert.throws(()=>verify({...r,...patch},options()));
});
test('support historical-scope repair rejects source drift, unrelated changes, ancestry and receipt rewrites',()=>{
 for(const path of [...r.paths,...r.maintenancePaths]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verify(r,o),/source drift/);}
 for(const boundary of [r.base,r.source,r.maintenanceSource]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verify(r,o),/Unrelated|Unreviewed/);}
 const a=options();a.ancestor=()=>{throw Error('not an ancestor');};assert.throws(()=>verify(r,a),/not an ancestor/);
 const c=options();c.content=ref=>JSON.stringify(ref===r.base?{retained:'same'}:{retained:'changed',supportRecoveryHistoricalScope:{}});assert.throws(()=>verify(r,c),/Prior release receipts/);
});
test('Fit adapter exposes the verified historical head only for legacy HEAD name diffs',()=>{
 verifyReconciledRelease();
 assert.deepEqual(fit300HistoricalGitArgs(['diff','--name-only','historic-base','HEAD','--','asset.js']),['diff','--name-only','historic-base',COMPOSITION_BASE,'--','asset.js']);
 for(const a of [['diff','--name-only','base',r.source],['diff','--name-status','base','HEAD'],['rev-parse','HEAD:worker.js'],['show','HEAD:worker.js']])assert.deepEqual(fit300HistoricalGitArgs(a),a);
 for(const p of [...r.paths,...r.maintenancePaths,'tests/watch-alnylam-later-review-test-repair-composition.test.mjs','tests/support-recovery-20261011.test.mjs'])assert.equal(reconciliationPath(p),true);
 for(const p of ['shift-coach/unapproved-runtime.mjs','migrations/unapproved.sql'])assert.equal(reconciliationPath(p),false);
});
test('actual scope repair preserves the complete prior receipts and all original verifier bodies',()=>{
 const current=myTimberHistoricalRecord(verifyReconciledRelease());assert.equal(current.supportRecoveryHistoricalScope.source,r.source);
 const prior=JSON.parse(read(r.base,manifest)),retained=structuredClone(current);delete retained.supportRecoveryHistoricalScope;delete retained.supportRecoveryIntegrationBudget;delete retained.supportRecoveryIntegrationBudgetTestRepair;assert.deepEqual(retained,prior);
 for(const path of [...r.paths,...r.maintenancePaths])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
 const positiveRead=combinedPositiveHistoricalRead(read);
 for(const path of ['worker.js','shift-coach/scope.mjs','shift-coach/public-trust-repair.mjs','shift-coach/support-content-20261010.mjs','frontend/member/turnstile-auth-v1.js','medicines-watch/README.md','medicines-watch/industry.mjs','.github/workflows/cloudflare-production-promote.yml'])assert.equal(positiveRead('HEAD',path),read(r.base,path));
 const body=(t,name)=>{const start=t.indexOf('export function '+name+'(');return t.slice(start,t.indexOf('\n}\n',start)+3);};
 for(const path of ['release/approved-runtime-composition.mjs','release/fit-300-scope.mjs']){
  const before=read(r.base,path),after=path==='release/approved-runtime-composition.mjs'?myTimberHistoricalFile(path,read('HEAD',path)):read('HEAD',path);
  for(const match of before.matchAll(/export function (\w+)\(/g))if(match[1]!=='verifyReconciledRelease')assert.equal(body(after,match[1]),body(before,match[1]),match[1]);
 }
});
