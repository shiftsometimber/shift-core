import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyPublicAnswersSourceArchive,verifyReconciledRelease,PUBLIC_ANSWERS_ARCHIVE_BASE as base,PUBLIC_ANSWERS_ARCHIVE_SOURCE as source,PUBLIC_ANSWERS_ARCHIVE_PATHS as paths,PUBLIC_ANSWERS_ARCHIVE_MAINTENANCE as maintenancePaths,PUBLIC_ANSWERS_ARCHIVE_PROTECTED as protectedPaths,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const maintenance='a'.repeat(40),head='b'.repeat(40);
const receipt=()=>({proof:'EXACT_SEPARATE_PUBLIC_ANSWERS_SOURCE_ARCHIVE_V1',base,source,paths,maintenancePaths,maintenanceSource:maintenance,coreRuntimeChanged:false,coreConfigurationChanged:false,publicAnswersWorkerDeploymentAuthorised:false,customerDataChanged:false,deploymentAuthorityBroadened:false,existingGatesWeakened:false,rollbackAuthorityBroadened:false});
const fixture=()=>({head,read:()=> 'unchanged',ancestor:()=>{},diff:(a,b)=>a===base?paths:a===source?maintenancePaths:[RECONCILIATION_MANIFEST]});
test('only the exact separate Worker source and bounded archive repair pass',()=>verifyPublicAnswersSourceArchive(receipt(),fixture()));
test('extra files in any phase and later unreviewed source are rejected',()=>{
 for(const phase of [base,source,maintenance]){const f=fixture(),original=f.diff;f.diff=(a,b)=>a===phase?[...original(a,b),'worker-entry-v6.js']:original(a,b);assert.throws(()=>verifyPublicAnswersSourceArchive(receipt(),f),/Unrelated|Unreviewed/);}
});
test('every archived/maintenance blob and protected core/ownership file remains exact',()=>{
 for(const path of [...paths,...maintenancePaths,...protectedPaths]){const f=fixture();f.read=(ref,p)=>ref==='HEAD'&&p===path?'drift':'unchanged';assert.throws(()=>verifyPublicAnswersSourceArchive(receipt(),f),/drift|changed/);}
 for(const path of protectedPaths){const f=fixture();f.read=(ref,p)=>ref===source&&p===path?'drift':'unchanged';assert.throws(()=>verifyPublicAnswersSourceArchive(receipt(),f),/changed/);}
});
test('archive proof cannot authorise another Worker, change private data, weaken gates or grant rollback',()=>{
 for(const key of ['coreRuntimeChanged','coreConfigurationChanged','publicAnswersWorkerDeploymentAuthorised','customerDataChanged','deploymentAuthorityBroadened','existingGatesWeakened','rollbackAuthorityBroadened'])assert.throws(()=>verifyPublicAnswersSourceArchive({...receipt(),[key]:true},fixture()));
 for(const key of ['base','source'])assert.throws(()=>verifyPublicAnswersSourceArchive({...receipt(),[key]:'c'.repeat(40)},fixture()));
});
test('actual immutable archive and all earlier receipts compose without accepting injected source drift',()=>{
 assert(verifyReconciledRelease().publicAnswersSourceArchive);
 const raw=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 for(const path of [...paths,...maintenancePaths])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'changed':raw(ref,p)),/archive .*drift/);
});
