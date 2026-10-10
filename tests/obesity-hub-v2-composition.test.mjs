import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyObesityHubV2,verifyReconciledRelease,OBESITY_HUB_V2_BASE as base,OBESITY_HUB_V2_SOURCE as source,OBESITY_HUB_V2_PATHS as paths,OBESITY_HUB_V2_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
const flags=['homepageChanged','startHereChanged','sharedNavigationChanged','memberDataChanged','checkoutChanged','analyticsChanged','consentChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_OBESITY_HUB_V2_20261010',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),integrationIssue:1065,publicationStatus:'authorised_by_Matt_20261010',priorPreviewRun:38058282091,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',obesityHubV2:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
test('Hub-v2 receipt binds exact authorised files and preserves unresolved attribution',()=>verifyObesityHubV2(receipt(),options()));
test('Hub-v2 integration rejects broadened authority, claims and source identity',()=>{
 for(const patch of [{source:'f'.repeat(40)},{base:'f'.repeat(40)},{integrationIssue:1},{publicationStatus:'preview_only'},{priorPreviewRun:1},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyObesityHubV2({...receipt(),...patch},options()));
});
test('every Hub-v2 boundary rejects unrelated files and existing receipt changes',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyObesityHubV2(receipt(),o));}
 const o=options();o.content=ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'changed',obesityHubV2:{}});assert.throws(()=>verifyObesityHubV2(receipt(),o),/Prior release receipts/);
});
test('Hub-v2 and maintenance source drift cannot be hidden by historical mapping',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyObesityHubV2(receipt(),o),/source drift/);}
});
test('real reconciled source retains the prior runtime and detects Hub-v2 drift',()=>{
 const c=verifyReconciledRelease();assert.equal(c.obesityHubV2.source,source);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 assert.throws(()=>verifyReconciledRelease((ref,path)=>ref==='HEAD'&&path===paths[4]?'drift':read(ref,path)),/Hub-v2 source drift/);
});
