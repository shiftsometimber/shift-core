import test from 'node:test';import assert from 'node:assert/strict';
import {PUBLIC_TOOL_PROOF_RETRY_BASE as base,PUBLIC_TOOL_PROOF_RETRY_PATHS as paths,verifyPublicToolProofRetry} from '../release/approved-runtime-composition.mjs';
const source='a'.repeat(40),head='b'.repeat(40);
const record=()=>({proof:'EXACT_PUBLIC_TOOL_PROOF_RETRY_V1',base,source,paths:[...paths],publicCopyChanged:false,aiRuntimeChanged:false,customerDataChanged:false});
const options=()=>({head,read:(_r,p)=>p,diff:(a)=>a===base?[...paths]:['release/approved-runtime-composition.json'],ancestor:()=>{}});
test('only the exact finite verification layer over the approved Programme release passes',()=>verifyPublicToolProofRetry(record(),options()));
test('all raw current source blobs are checked before any historical mapping',()=>{for(const dirty of paths)assert.throws(()=>verifyPublicToolProofRetry(record(),{...options(),read:(r,p)=>r==='HEAD'&&p===dirty?'dirty':p}));});
test('extra files, missing ancestry, changed receipt and later changes fail closed',()=>{
 for(const patch of [{base:'unknown'},{paths:[...paths,'ask-timber-v1.js']},{aiRuntimeChanged:true},{publicCopyChanged:true},{customerDataChanged:true}])assert.throws(()=>verifyPublicToolProofRetry({...record(),...patch},options()));
 assert.throws(()=>verifyPublicToolProofRetry(record(),{...options(),ancestor:()=>{throw Error('not ancestor')}}));
 assert.throws(()=>verifyPublicToolProofRetry(record(),{...options(),diff:()=>[...paths,'extra']}));
 assert.throws(()=>verifyPublicToolProofRetry(record(),{...options(),diff:(a)=>a===base?paths:['release/approved-runtime-composition.json','extra']}));
});

import {verifyProgrammeDayPreflightExtension,PROGRAMME_PREFLIGHT_BASE,PROGRAMME_PREFLIGHT_SOURCE,PROGRAMME_PREFLIGHT_PAYLOAD,PROGRAMME_PREFLIGHT_MAINTENANCE} from '../release/approved-runtime-composition.mjs';
test('Programme preflight drift retains the shared release rejection contract',()=>{
 const c={proof:'EXACT_PROGRAMME_PREFLIGHT_V1',base:PROGRAMME_PREFLIGHT_BASE,payloadSource:PROGRAMME_PREFLIGHT_SOURCE,maintenanceSource:source,payloadPaths:PROGRAMME_PREFLIGHT_PAYLOAD,maintenancePaths:PROGRAMME_PREFLIGHT_MAINTENANCE};
 const opts={head,read:(_r,p)=>p,diff:(a)=>a===c.base?c.payloadPaths:a===c.payloadSource?c.maintenancePaths:['release/approved-runtime-composition.json'],ancestor:()=>{}};
 for(const dirty of [...c.payloadPaths,...c.maintenancePaths])assert.throws(()=>verifyProgrammeDayPreflightExtension(c,{...opts,read:(r,p)=>r==='HEAD'&&p===dirty?'drift':p}),/Approved composition (?:source \/ boundary|maintenance source) drift/);
});