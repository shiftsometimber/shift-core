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

import {verifyTabletClientExtension,TABLET_CLIENT_BASE,TABLET_CLIENT_SOURCE,TABLET_CLIENT_RUN,TABLET_CLIENT_PAYLOAD,TABLET_CLIENT_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
const clientReceipt=()=>({proof:'EXACT_TABLET_CLIENT_V1',base:TABLET_CLIENT_BASE,source:TABLET_CLIENT_SOURCE,proofRun:TABLET_CLIENT_RUN,approval:'tighten this',payloadPaths:TABLET_CLIENT_PAYLOAD,maintenancePaths:TABLET_CLIENT_MAINTENANCE,maintenanceSource:maintenance,homepageChanged:false,orderingOpened:false,pricesChanged:false});
const clientDeps=()=>({head,ancestor:()=>{},diff:a=>a===TABLET_CLIENT_BASE?TABLET_CLIENT_PAYLOAD:a===TABLET_CLIENT_SOURCE?TABLET_CLIENT_MAINTENANCE:[RECONCILIATION_MANIFEST],read:(ref,path)=>path+':'+(ref==='HEAD'?(TABLET_CLIENT_PAYLOAD.includes(path)?TABLET_CLIENT_SOURCE:maintenance):ref)});
test('results-script follow-through requires its exact source and maintenance',()=>{const c=clientReceipt();assert.equal(verifyTabletClientExtension(c,clientDeps()),c);});
test('results-script follow-through rejects scope and source changes',()=>{for(const change of [{homepageChanged:true},{orderingOpened:true},{pricesChanged:true},{source:'3'.repeat(40)},{proofRun:1},{approval:'assumed'},{payloadPaths:[...TABLET_CLIENT_PAYLOAD,'worker.js']}])assert.throws(()=>verifyTabletClientExtension({...clientReceipt(),...change},clientDeps()));const d=clientDeps();d.read=(ref,path)=>ref+path;assert.throws(()=>verifyTabletClientExtension(clientReceipt(),d));});
