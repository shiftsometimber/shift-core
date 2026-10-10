import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyObesityHubTransport,verifyReconciledRelease,OBESITY_HUB_TRANSPORT_BASE as base,OBESITY_HUB_TRANSPORT_SOURCE as source,OBESITY_HUB_TRANSPORT_PATHS as paths,OBESITY_HUB_TRANSPORT_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
const flags=['homepageChanged','startHereChanged','sharedNavigationChanged','memberDataChanged','checkoutChanged','analyticsChanged','consentChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_OBESITY_HUB_TRANSPORT_20261010',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),integrationIssue:1065,publicationStatus:'authorised_by_Matt_20261010',priorPreviewRun:38058282091,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',obesityHubTransport:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
test('Hub-v2 bounded transport and rollback chain receipt binds exact authorised files and preserves unresolved attribution',()=>verifyObesityHubTransport(receipt(),options()));
test('Hub-v2 bounded transport and rollback chain integration rejects broadened authority, claims and source identity',()=>{
 for(const patch of [{source:'f'.repeat(40)},{base:'f'.repeat(40)},{integrationIssue:1},{publicationStatus:'preview_only'},{priorPreviewRun:1},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyObesityHubTransport({...receipt(),...patch},options()));
});
test('every Hub-v2 bounded transport and rollback chain boundary rejects unrelated files and existing receipt changes',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyObesityHubTransport(receipt(),o));}
 const o=options();o.content=ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'changed',obesityHubTransport:{}});assert.throws(()=>verifyObesityHubTransport(receipt(),o),/Prior release receipts/);
});
test('Hub-v2 bounded transport and rollback chain and maintenance source drift cannot be hidden by historical mapping',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyObesityHubTransport(receipt(),o),/source drift/);}
});
test('real reconciled source retains the prior runtime and detects Hub-v2 bounded transport and rollback chain drift',()=>{
 const c=verifyReconciledRelease();assert.equal(c.obesityHubTransport.source,source);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 assert.throws(()=>verifyReconciledRelease((ref,path)=>ref==='HEAD'&&path===paths[0]?'drift':read(ref,path)),/Hub-v2 bounded transport and rollback chain source drift/);
});
