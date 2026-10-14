import {combinedPositiveHistoricalRead} from '../release/combined-finite-scope-20261014.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyWatchAlnylamLaterReviewTestRepair as verify,verifyReconciledRelease,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
const r={
  "proof": "EXACT_WATCH_ALNYLAM_LATER_REVIEW_TEST_REPAIR_20261012",
  "base": "6ca3e8ca2a6eca7fbfa0ee485121a086a6f17d19",
  "source": "29fd4812df4394d344b6d0df321aab9672a0e4e2",
  "paths": [
    "tests/watch-alnylam-rnai-discovery-composition.test.mjs",
    "tests/watch-alnylam-release-guard-repair-composition.test.mjs"
  ],
  "maintenancePaths": [
    "release/approved-runtime-composition.mjs",
    "tests/watch-alnylam-later-review-test-repair-composition.test.mjs"
  ],
  "maintenanceSource": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "integrationIssue": 1065,
  "publicationStatus": "staged_master_test_repair",
  "repair": "compare historical Alnylam paths with exact later reviewed sources",
  "baselineFailureReproduced": true,
  "runtimeChanged": false,
  "medicalEvidenceChanged": false,
  "reviewDatesChanged": false,
  "programmeWordingChanged": false,
  "monitorLogicChanged": false,
  "queueLogicChanged": false,
  "healthResponseChanged": false,
  "homepageChanged": false,
  "primaryNavigationChanged": false,
  "memberDataChanged": false,
  "checkoutChanged": false,
  "externalCommunicationsSent": false,
  "genericAdoptionAllowed": false,
  "deploymentAuthorityBroadened": false,
  "rollbackAuthorityBroadened": false,
  "existingGatesWeakened": false
};
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===r.base?{retained:'same'}:{retained:'same',watchAlnylamLaterReviewTestRepair:{}}),diff:(a,b)=>a===r.base?r.paths:a===r.source?r.maintenancePaths:[manifest]});
test('Alnylam later-review test repair retains finite boundaries and all original controls',()=>{
 verify(r,options());
 for(const patch of [{proof:'other'},{base:'f'.repeat(40)},{source:'f'.repeat(40)},{maintenanceSource:'invalid'},{integrationIssue:1},{publicationStatus:'approved_production'},{runtimeChanged:true},{baselineFailureReproduced:false},{paths:[...r.paths,'worker.js']},{maintenancePaths:[...r.maintenancePaths,'worker.js']},...["medicalEvidenceChanged", "reviewDatesChanged", "programmeWordingChanged", "monitorLogicChanged", "queueLogicChanged", "healthResponseChanged", "homepageChanged", "primaryNavigationChanged", "memberDataChanged", "checkoutChanged", "externalCommunicationsSent", "genericAdoptionAllowed", "deploymentAuthorityBroadened", "rollbackAuthorityBroadened", "existingGatesWeakened"].map(k=>({[k]:true}))])assert.throws(()=>verify({...r,...patch},options()));
});
test('Alnylam later-review repair rejects source drift, boundary drift, missing ancestry and receipt rewrites',()=>{
 for(const path of [...r.paths,...r.maintenancePaths]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verify(r,o),/source drift/);}
 for(const boundary of [r.base,r.source,r.maintenanceSource]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verify(r,o),/Unrelated|Unreviewed/);}
 const a=options();a.ancestor=()=>{throw Error('not an ancestor');};assert.throws(()=>verify(r,a),/not an ancestor/);
 const c=options();c.content=ref=>JSON.stringify(ref===r.base?{retained:'same'}:{retained:'changed',watchAlnylamLaterReviewTestRepair:{}});assert.throws(()=>verify(r,c),/Prior release receipts/);
});
test('actual later-review repair keeps medical source, previous receipts and every historical verifier body unchanged',()=>{
 const current=verifyReconciledRelease();assert.equal(current.watchAlnylamLaterReviewTestRepair.source,r.source);
 const prior=JSON.parse(read(r.base,manifest)),retained=structuredClone(current);for(const key of Object.keys(retained))if(!(key in prior))delete retained[key];assert.deepEqual(retained,prior);
 for(const path of [...r.paths,...r.maintenancePaths])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'drift':read(ref,p)),/source drift/);
 const positiveRead=combinedPositiveHistoricalRead(read);
 for(const path of ['worker.js','medicines-watch/README.md','medicines-watch/industry.mjs','medicines-watch/credibility.mjs','medicines-watch/monitor.mjs','.github/workflows/cloudflare-production-promote.yml'])assert.equal(positiveRead('HEAD',path),read(r.base,path));
 const before=read(r.base,'release/approved-runtime-composition.mjs'),after=read('HEAD','release/approved-runtime-composition.mjs');
 for(const match of before.matchAll(/export function (\w+)\(/g))if(match[1]!=='verifyReconciledRelease'){
  const body=t=>{const start=t.indexOf('export function '+match[1]+'(');return t.slice(start,t.indexOf('\n}\n',start)+3);};assert.equal(body(after),body(before));
 }
});
