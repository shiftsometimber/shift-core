import test from 'node:test';import assert from 'node:assert/strict';
import {verifyServingSeoCapture,SERVING_SEO_BASE as base,SERVING_SEO_SOURCE as source,SERVING_SEO_CAPTURE as capture,SERVING_SEO_CAPTURE_PATHS as capturePaths,SERVING_SEO_PATHS as paths,SERVING_SEO_MAINTENANCE as maintenancePaths} from '../release/approved-runtime-composition.mjs';
const maintenanceSource='a'.repeat(40),head='b'.repeat(40);
const record=()=>({proof:'EXACT_SERVING_SEO_CAPTURE_V1',base,source,capture,paths,maintenancePaths,maintenanceSource,preserveServingSeo:true,homepageChanged:false,clinicalAvailabilityChanged:false,customerDataChanged:false,stockChanged:false,memberBehaviourChanged:false});
const opts=()=>({head,read:(_r,p)=>p,diff:(a)=>a==='e7c78344694a0101a8105004356b96d3a2066197'?capturePaths:a===base?paths:a===source?maintenancePaths:['release/approved-runtime-composition.json'],ancestor:()=>{}});
test('only exact captured serving SEO and finite source maintenance pass',()=>verifyServingSeoCapture(record(),opts()));
test('every current payload, verifier and captured source blob is checked before old mappings',()=>{for(const path of [...paths,...maintenancePaths])assert.throws(()=>verifyServingSeoCapture(record(),{...opts(),read:(r,p)=>r==='HEAD'&&p===path?'drift':p}));for(const path of capturePaths)assert.throws(()=>verifyServingSeoCapture(record(),{...opts(),read:(r,p)=>r===capture&&p===path?'drift':p}));});
test('extra paths, changed capture, homepage edits, data changes and missing ancestry are rejected',()=>{
 for(const patch of [{capture:'unknown'},{paths:[...paths,'worker.js']},{homepageChanged:true},{customerDataChanged:true},{stockChanged:true},{memberBehaviourChanged:true}])assert.throws(()=>verifyServingSeoCapture({...record(),...patch},opts()));
 assert.throws(()=>verifyServingSeoCapture(record(),{...opts(),diff:()=>['extra']}));
 assert.throws(()=>verifyServingSeoCapture(record(),{...opts(),ancestor:()=>{throw Error('missing ancestry')}}));
});