import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyToolSchemaArchive,verifyReconciledRelease,TOOL_SCHEMA_ARCHIVE_BASE,TOOL_SCHEMA_ARCHIVE_SOURCE,TOOL_SCHEMA_ARCHIVE_PATHS,TOOL_SCHEMA_ARCHIVE_MAINTENANCE,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const maintenance='a'.repeat(40),head='b'.repeat(40);
const receipt=()=>({proof:'EXACT_TOOL_SCHEMA_EVIDENCE_ARCHIVE_V1',base:TOOL_SCHEMA_ARCHIVE_BASE,source:TOOL_SCHEMA_ARCHIVE_SOURCE,paths:[...TOOL_SCHEMA_ARCHIVE_PATHS],maintenancePaths:[...TOOL_SCHEMA_ARCHIVE_MAINTENANCE],maintenanceSource:maintenance,productionRepairPreviouslyDeployed:true,runtimeChanged:false,publicCopyChanged:false,homepageChanged:false,startHereChanged:false,customerDataChanged:false,deploymentAuthorityBroadened:false,existingGatesWeakened:false});
const fixture=()=>({head,ancestor:()=>{},read:()=> 'same',diff:(a,b)=>a===TOOL_SCHEMA_ARCHIVE_BASE?[...TOOL_SCHEMA_ARCHIVE_PATHS]:a===TOOL_SCHEMA_ARCHIVE_SOURCE?[...TOOL_SCHEMA_ARCHIVE_MAINTENANCE]:[RECONCILIATION_MANIFEST]});
test('only the exact source and evidence archive passes',()=>verifyToolSchemaArchive(receipt(),fixture()));
test('runtime, homepage, private-data and weaker-gate flags are rejected',()=>{
 for(const key of ['runtimeChanged','publicCopyChanged','homepageChanged','startHereChanged','customerDataChanged','deploymentAuthorityBroadened','existingGatesWeakened'])assert.throws(()=>verifyToolSchemaArchive({...receipt(),[key]:true},fixture()));
});
test('unrelated files and edits after the archive receipt are rejected',()=>{
 for(const phase of [TOOL_SCHEMA_ARCHIVE_BASE,TOOL_SCHEMA_ARCHIVE_SOURCE,maintenance]){const f=fixture(),original=f.diff;f.diff=(a,b)=>a===phase?[...original(a,b),'worker-entry-v6.js']:original(a,b);assert.throws(()=>verifyToolSchemaArchive(receipt(),f),/Unrelated|Unreviewed/);}
});
test('every archived and maintenance blob is pinned and supplied readers are rechecked',()=>{
 for(const path of [...TOOL_SCHEMA_ARCHIVE_PATHS,...TOOL_SCHEMA_ARCHIVE_MAINTENANCE]){const f=fixture();f.read=(ref,p)=>ref==='HEAD'&&p===path?'changed':'same';assert.throws(()=>verifyToolSchemaArchive(receipt(),f),/drift/);}
});
test('real archive and all prior runtime composition receipts pass together',()=>{
 assert(verifyReconciledRelease().toolSchemaArchive);
 const raw=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 for(const path of [...TOOL_SCHEMA_ARCHIVE_PATHS,...TOOL_SCHEMA_ARCHIVE_MAINTENANCE])assert.throws(()=>verifyReconciledRelease((ref,p)=>ref==='HEAD'&&p===path?'changed':raw(ref,p)),/archive .*drift/);
});
