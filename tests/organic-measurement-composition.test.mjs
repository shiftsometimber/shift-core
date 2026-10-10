import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyOrganicMeasurement,verifyReconciledRelease,ORGANIC_MEASUREMENT_BASE as base,ORGANIC_MEASUREMENT_SOURCE as source,ORGANIC_MEASUREMENT_PATHS as paths,ORGANIC_MEASUREMENT_MAINTENANCE as maintenance,RECONCILIATION_MANIFEST as manifest} from '../release/approved-runtime-composition.mjs';
const flags=['runtimeChanged','analyticsChanged','consentChanged','privateDataRead','homepageChanged','medicalClaimsChanged','externalCommunicationsSent','genericAdoptionAllowed','deploymentAuthorityBroadened','rollbackAuthorityBroadened','existingGatesWeakened'];
const receipt=()=>({proof:'EXACT_ORGANIC_MEASUREMENT_INTEGRATION_V1',base,source,paths:[...paths],maintenancePaths:[...maintenance],maintenanceSource:'a'.repeat(40),approvedPR:1280,integrationIssue:1065,pageClickAttribution:'unresolved',pageCTRUsable:false,outcomeClaimsAllowed:false,...Object.fromEntries(flags.map(k=>[k,false]))});
const options=()=>({head:'b'.repeat(40),read:()=> 'same',ancestor:()=>{},content:ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'same',organicMeasurementIntegration:{}}),diff:(a,b)=>a===base?[...paths]:a===source?[...maintenance]:[manifest]});
test('reporting receipt binds exact authorised files and preserves unresolved attribution',()=>verifyOrganicMeasurement(receipt(),options()));
test('reporting integration rejects broadened authority, claims and source identity',()=>{
 for(const patch of [{source:'f'.repeat(40)},{base:'f'.repeat(40)},{approvedPR:1},{integrationIssue:1},{pageCTRUsable:true},{outcomeClaimsAllowed:true},{pageClickAttribution:'resolved'},...flags.map(k=>({[k]:true}))])assert.throws(()=>verifyOrganicMeasurement({...receipt(),...patch},options()));
});
test('every reporting boundary rejects unrelated files and existing receipt changes',()=>{
 for(const boundary of [base,source,'a'.repeat(40)]){const o=options(),diff=o.diff;o.diff=(a,b)=>a===boundary?[...diff(a,b),'worker.js']:diff(a,b);assert.throws(()=>verifyOrganicMeasurement(receipt(),o));}
 const o=options();o.content=ref=>JSON.stringify(ref===base?{retained:'same'}:{retained:'changed',organicMeasurementIntegration:{}});assert.throws(()=>verifyOrganicMeasurement(receipt(),o),/Prior release receipts/);
});
test('reporting and maintenance source drift cannot be hidden by historical mapping',()=>{
 for(const path of [...paths,...maintenance]){const o=options();o.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'same';assert.throws(()=>verifyOrganicMeasurement(receipt(),o),/source drift/);}
});
test('real reconciled source retains the prior runtime and detects reporting drift',()=>{
 const c=verifyReconciledRelease();assert.equal(c.organicMeasurementIntegration.source,source);
 const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:4e6});
 assert.throws(()=>verifyReconciledRelease((ref,path)=>ref==='HEAD'&&path===paths[4]?'drift':read(ref,path)),/Reporting source drift/);
});
