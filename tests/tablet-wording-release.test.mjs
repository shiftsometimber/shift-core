import test from 'node:test';import assert from 'node:assert/strict';
import {verifyTabletWordingExtension,TABLET_WORDING_BASE,TABLET_WORDING_SOURCE,TABLET_WORDING_RUN,TABLET_WORDING_PAYLOAD,TABLET_WORDING_MAINTENANCE,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const maintenance='1'.repeat(40),head='2'.repeat(40);
const receipt=()=>({proof:'EXACT_TABLET_WORDING_V1',base:TABLET_WORDING_BASE,source:TABLET_WORDING_SOURCE,proofRun:TABLET_WORDING_RUN,approval:'tighten this',payloadPaths:TABLET_WORDING_PAYLOAD,maintenancePaths:TABLET_WORDING_MAINTENANCE,maintenanceSource:maintenance,homepageChanged:false,orderingOpened:false,pricesChanged:false});
const deps=()=>({head,ancestor:()=>{},diff:(a)=>a===TABLET_WORDING_BASE?TABLET_WORDING_PAYLOAD:a===TABLET_WORDING_SOURCE?TABLET_WORDING_MAINTENANCE:[RECONCILIATION_MANIFEST],read:(ref,path)=>path+':'+(ref==='HEAD'?(TABLET_WORDING_PAYLOAD.includes(path)?TABLET_WORDING_SOURCE:maintenance):ref)});
test('finite tablet receipt requires exact payload and maintenance bytes',()=>{assert.deepEqual(verifyTabletWordingExtension(receipt(),deps()),receipt());});
test('rejects broader edits, missing approval and altered source',()=>{
 for(const change of [{homepageChanged:true},{pricesChanged:true},{orderingOpened:true},{approval:'assumed'},{source:'3'.repeat(40)},{proofRun:1},{payloadPaths:[...TABLET_WORDING_PAYLOAD,'worker.js']}])assert.throws(()=>verifyTabletWordingExtension({...receipt(),...change},deps()));
 const extra=deps();extra.diff=()=>[...TABLET_WORDING_PAYLOAD,'worker.js'];assert.throws(()=>verifyTabletWordingExtension(receipt(),extra));
 const drift=deps();drift.read=(ref,path)=>ref+path;assert.throws(()=>verifyTabletWordingExtension(receipt(),drift));
});
