import test from 'node:test';import assert from 'node:assert/strict';
import {verifyReloadOriginalAttempt,RELOAD_ORIGINAL_BASE as base,RELOAD_ORIGINAL_SOURCE as source,RELOAD_ORIGINAL_PATHS as paths,RELOAD_ORIGINAL_MAINTENANCE as maintenancePaths} from '../release/approved-runtime-composition.mjs';
const m='a'.repeat(40),head='b'.repeat(40);
const record=()=>({proof:'EXACT_RELOAD_ORIGINAL_ATTEMPT_V1',base,source,paths,maintenancePaths,maintenanceSource:m,run:37763695261,attempt:1,job:113266037954,publicCopyChanged:false,runtimeChanged:false,medicalContentChanged:false,customerDataChanged:false,currentLiveChecksChanged:false});
const opts=()=>({head,read:(_r,p)=>p,diff:(a)=>a===base?paths:a===source?maintenancePaths:['release/approved-runtime-composition.json'],ancestor:()=>{}});
test('only finite original-attempt verification source passes',()=>verifyReloadOriginalAttempt(record(),opts()));
test('every raw payload and verifier byte is checked before historical mapping',()=>{for(const dirty of [...paths,...maintenancePaths])assert.throws(()=>verifyReloadOriginalAttempt(record(),{...opts(),read:(r,p)=>r==='HEAD'&&p===dirty?'dirty':p}));});
test('different attempts, expanded paths, weakened current checks and unrelated changes fail',()=>{
 for(const patch of [{attempt:2},{job:113543764401},{currentLiveChecksChanged:true},{runtimeChanged:true},{paths:[...paths,'worker.js']}])assert.throws(()=>verifyReloadOriginalAttempt({...record(),...patch},opts()));
 assert.throws(()=>verifyReloadOriginalAttempt(record(),{...opts(),diff:()=>['extra']}));
 assert.throws(()=>verifyReloadOriginalAttempt(record(),{...opts(),ancestor:()=>{throw Error('missing ancestry')}}));
});