import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {COMPOSITION_BASE,verifyPublicToolExtension,verifyReconciledRelease,reconciliationHistoricalRead,reconciliationRecord,PUBLIC_TOOL_BASE,PUBLIC_TOOL_SOURCE,PUBLIC_TOOL_PAYLOAD,PUBLIC_TOOL_MAINTENANCE,RECONCILIATION_MANIFEST} from '../release/approved-runtime-composition.mjs';
const maintenance='a'.repeat(40),head='b'.repeat(40);
const receipt=()=>({proof:'EXACT_PUBLIC_TOOL_DELIVERY_V1',supportSnapshotSource:'e7c78344694a0101a8105004356b96d3a2066197',base:PUBLIC_TOOL_BASE,payloadSource:PUBLIC_TOOL_SOURCE,payloadPaths:[...PUBLIC_TOOL_PAYLOAD],maintenancePaths:[...PUBLIC_TOOL_MAINTENANCE],maintenanceSource:maintenance,publicCopyChanged:false,ratingsInvented:false,homepageChanged:false,privateCacheChanged:false});
const fixture=()=>({head,ancestor:()=>{},read:()=> 'same',diff:(a,b)=>a===PUBLIC_TOOL_BASE?[...PUBLIC_TOOL_PAYLOAD]:a===PUBLIC_TOOL_SOURCE?[...PUBLIC_TOOL_MAINTENANCE]:[RECONCILIATION_MANIFEST]});
test('only the finite tool payload and verifier receipt pass',()=>assert.equal(verifyPublicToolExtension(receipt(),fixture()).payloadSource,PUBLIC_TOOL_SOURCE));
test('every new payload and verifier blob is checked through a fresh raw reader',()=>{
 for(const path of [...PUBLIC_TOOL_PAYLOAD,...PUBLIC_TOOL_MAINTENANCE]){const f=fixture();f.read=(ref,p)=>ref==='HEAD'&&p===path?'changed':'same';assert.throws(()=>verifyPublicToolExtension(receipt(),f),/source drift/);}
});
test('unrelated source files or changes after the receipt are rejected',()=>{
 for(const phase of [PUBLIC_TOOL_BASE,PUBLIC_TOOL_SOURCE,maintenance]){const f=fixture(),original=f.diff;f.diff=(a,b)=>a===phase?[...original(a,b),'commerce-stripe-v1.js']:original(a,b);assert.throws(()=>verifyPublicToolExtension(receipt(),f),/Unrelated|Unreviewed/);}
});
test('different source identifiers, extra paths and altered scope statements are rejected',()=>{
 for(const patch of [{base:'c'.repeat(40)},{payloadSource:'c'.repeat(40)},{payloadPaths:[...PUBLIC_TOOL_PAYLOAD,'worker.js']},{maintenancePaths:[...PUBLIC_TOOL_MAINTENANCE,'wrangler.jsonc']},{publicCopyChanged:true},{ratingsInvented:true},{homepageChanged:true},{privateCacheChanged:true},{maintenanceSource:'HEAD'}])assert.throws(()=>verifyPublicToolExtension({...receipt(),...patch},fixture()));
 const f=fixture();f.ancestor=()=>{throw Error('Missing ancestor');};assert.throws(()=>verifyPublicToolExtension(receipt(),f),/ancestor/);
});
test('real receipt validates the current repair before mapping older worker guards',()=>{
 assert(verifyReconciledRelease().publicToolDelivery);
 const read=reconciliationHistoricalRead((ref,path)=>ref);
 assert.notEqual(read('HEAD','shift-coach/worker.mjs'),'HEAD');
 assert.equal(read('HEAD','wrangler.jsonc'),reconciliationRecord().myTreatment?COMPOSITION_BASE:'HEAD');
 for(const p of ['acquisition-activation/consent.mjs','commerce-stripe-v1.js'])assert.equal(read('HEAD',p),'HEAD');
 const c=reconciliationRecord().publicToolDelivery;
 const raw=(ref,path)=>execFileSync('git',['rev-parse',ref+':'+path],{encoding:'utf8'}).trim();
 for(const p of [...PUBLIC_TOOL_PAYLOAD,...PUBLIC_TOOL_MAINTENANCE])assert.throws(()=>verifyReconciledRelease((ref,path)=>ref==='HEAD'&&path===p?'changed':raw(ref,path)),/source drift/);
 assert.equal(c.payloadSource,PUBLIC_TOOL_SOURCE);
});
