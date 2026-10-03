import test from 'node:test';
import assert from 'node:assert/strict';
import {DEVICE_HEALTH_BASE,DEVICE_HEALTH_CANDIDATE,DEVICE_HEALTH_PURPOSE_SOURCE,DEVICE_HEALTH_PURPOSE_PROOF_SOURCE,DEVICE_HEALTH_DELTA,DEVICE_HEALTH_PATHS,assertDeviceHealthDelta,assertDeviceHealthSource,historicalDeviceHealthRef,verifyDeviceHealthProof} from '../release/device-health-scope.mjs';
test('health payload rejects unlisted files, missing paths and changed native/backend bytes',()=>{
 assertDeviceHealthDelta(DEVICE_HEALTH_DELTA);
 assert.throws(()=>assertDeviceHealthDelta([...DEVICE_HEALTH_DELTA,['M','wrangler.jsonc']]));
 assert.throws(()=>assertDeviceHealthDelta(DEVICE_HEALTH_DELTA.slice(1)));
 assertDeviceHealthSource((ref,path)=>'blob:'+path);
 for(const changed of ['member-experience/device-health.mjs','my-timber-app/ios/Sources/HealthBridge.swift','my-timber-app/android/app/src/main/java/uk/co/shiftsometimber/mytimber/HealthBridge.kt'])assert.throws(()=>assertDeviceHealthSource((ref,path)=>(ref==='HEAD'&&path===changed?'drift:':'blob:')+path));
 assert(!DEVICE_HEALTH_PATHS.has('wrangler.jsonc'));
});
test('historical comparison is finite and does not substitute another supplied source',()=>{
 assert.equal(historicalDeviceHealthRef('HEAD','member-experience/entry.mjs'),DEVICE_HEALTH_BASE);
 assert.equal(historicalDeviceHealthRef('HEAD','worker-entry-v6.js'),'HEAD');
 assert.equal(historicalDeviceHealthRef('HEAD','member-experience/device-health.mjs'),'HEAD');
 assert.equal(historicalDeviceHealthRef('supplied','member-experience/entry.mjs'),'supplied');
});
const fixture=async path=>path.includes('/check-runs')?{check_runs:['integration-gate','preservation','route-sweep'].map(name=>({name,status:'completed',conclusion:'success'}))}:{head_sha:/37111296181|37111296102/.test(path)?DEVICE_HEALTH_PURPOSE_PROOF_SOURCE:DEVICE_HEALTH_CANDIDATE,path:/37108547157|37111296181/.test(path)?'.github/workflows/native-health-bridge-proof.yml':'.github/workflows/my-timber-app-preview.yml',status:'completed',conclusion:'success'};
test('purpose-string reconciliation is pinned to one exact native metadata file',()=>{
 const read=(ref,path)=>path==='my-timber-app/ios/project.yml'?(ref==='HEAD'||ref===DEVICE_HEALTH_PURPOSE_SOURCE?'purpose-blob':'old-project'):'blob:'+path;
 assertDeviceHealthSource(read);
 assert.throws(()=>assertDeviceHealthSource((ref,path)=>ref==='HEAD'&&path==='my-timber-app/ios/project.yml'?'drift':read(ref,path)));
 assert.throws(()=>assertDeviceHealthSource((ref,path)=>ref==='HEAD'&&path==='my-timber-app/ios/HealthKit.entitlements'?'drift':read(ref,path)));
});
test('release proof binds successful browser/privacy and both native builds to exact source',async()=>{
 assert.equal((await verifyDeviceHealthProof(fixture)).physicalAcceptance,false);
 for(const field of ['head_sha','path','status','conclusion'])await assert.rejects(verifyDeviceHealthProof(async path=>{const value=await fixture(path);return path.includes('/check-runs')?value:{...value,[field]:'incorrect'};}));
 await assert.rejects(verifyDeviceHealthProof(async path=>path.includes('/check-runs')?{check_runs:[{name:'integration-gate',status:'completed',conclusion:'failure'}]}:fixture(path)));
});
