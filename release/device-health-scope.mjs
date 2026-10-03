// Owner-authorised foreground imports; exact tested bytes, no physical-device pass inferred.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const DEVICE_HEALTH_BASE='3a427a6883d25c10b7dd807f505d4b3e7432b8ae';
export const DEVICE_HEALTH_CANDIDATE='ff5f570b9e80856b558ee1e28a9db33ebda5d505';
export const DEVICE_HEALTH_DELTA=[
  [
    "A",
    ".github/workflows/native-health-bridge-proof.yml"
  ],
  [
    "A",
    "member-experience/device-health-client.mjs"
  ],
  [
    "A",
    "member-experience/device-health.mjs"
  ],
  [
    "M",
    "member-experience/entry.mjs"
  ],
  [
    "M",
    "member-experience/health-routes.mjs"
  ],
  [
    "A",
    "member-experience/tests/device-health.test.mjs"
  ],
  [
    "M",
    "member-state-fast-v1.js"
  ],
  [
    "A",
    "my-timber-app/HEALTH-INTEGRATION.md"
  ],
  [
    "M",
    "my-timber-app/README.md"
  ],
  [
    "M",
    "my-timber-app/RELEASE-GATES.md"
  ],
  [
    "M",
    "my-timber-app/android/app/build.gradle"
  ],
  [
    "M",
    "my-timber-app/android/app/src/main/AndroidManifest.xml"
  ],
  [
    "A",
    "my-timber-app/android/app/src/main/java/uk/co/shiftsometimber/mytimber/HealthBridge.kt"
  ],
  [
    "M",
    "my-timber-app/android/app/src/main/java/uk/co/shiftsometimber/mytimber/MainActivity.java"
  ],
  [
    "A",
    "my-timber-app/android/app/src/main/java/uk/co/shiftsometimber/mytimber/PermissionsRationaleActivity.java"
  ],
  [
    "M",
    "my-timber-app/android/build.gradle"
  ],
  [
    "A",
    "my-timber-app/android/gradle.properties"
  ],
  [
    "M",
    "my-timber-app/contract.json"
  ],
  [
    "A",
    "my-timber-app/ios/HealthKit.entitlements"
  ],
  [
    "A",
    "my-timber-app/ios/Sources/HealthBridge.swift"
  ],
  [
    "M",
    "my-timber-app/ios/Sources/MyTimberViewController.swift"
  ],
  [
    "M",
    "my-timber-app/ios/project.yml"
  ],
  [
    "M",
    "my-timber-app/scripts/prepare.py"
  ],
  [
    "A",
    "my-timber-app/shared/native-health.js"
  ],
  [
    "A",
    "my-timber-app/tests/health-bridge.test.mjs"
  ],
  [
    "A",
    "my-timber-app/tests/health-browser-proof.mjs"
  ],
  [
    "M",
    "my-timber-app/tests/source.test.mjs"
  ],
  [
    "M",
    "privacy-health-erasure-route-v1.js"
  ]
];
export const DEVICE_HEALTH_PATHS=new Set(DEVICE_HEALTH_DELTA.map(([,path])=>path));
const historicalPaths=new Set([...DEVICE_HEALTH_DELTA.filter(([status])=>status==='M').map(([,path])=>path),'release/growth-scope.mjs','release/growth-preflight.mjs']);
// Current payload is separately pinned below; metadata is pinned by the coaching contract.
export function historicalDeviceHealthRef(ref,path){return ref==='HEAD'&&historicalPaths.has(path)?DEVICE_HEALTH_BASE:ref;}
export function assertDeviceHealthDelta(delta){assert.deepEqual(delta,DEVICE_HEALTH_DELTA,'Unexpected native health payload change');}
export function assertDeviceHealthSource(read){
 for(const path of DEVICE_HEALTH_PATHS)assert.equal(read('HEAD',path),read(DEVICE_HEALTH_CANDIDATE,path),'Native health source drift: '+path);
}
export function validateDeviceHealthSource(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',DEVICE_HEALTH_BASE,DEVICE_HEALTH_CANDIDATE);
 git('merge-base','--is-ancestor',DEVICE_HEALTH_CANDIDATE,'HEAD');
 assertDeviceHealthDelta(git('diff','--name-status',DEVICE_HEALTH_BASE,DEVICE_HEALTH_CANDIDATE).split('\n').filter(Boolean).map(line=>line.split('\t')));
 assertDeviceHealthSource((ref,path)=>git('rev-parse',ref+':'+path));
 return {candidate:DEVICE_HEALTH_CANDIDATE,paths:DEVICE_HEALTH_PATHS.size,physicalAcceptance:false};
}
export async function verifyDeviceHealthProof(get){
 const runs=[['.github/workflows/native-health-bridge-proof.yml',37108547157],['.github/workflows/my-timber-app-preview.yml',37108547184]];
 const receipts=[];
 for(const [path,id] of runs){const run=await get('/actions/runs/'+id);assert.equal(run.head_sha,DEVICE_HEALTH_CANDIDATE);assert.equal(run.path,path);assert.equal(run.status,'completed');assert.equal(run.conclusion,'success','Native health proof must pass');receipts.push({id,path,head:run.head_sha});}
 const checks=(await get('/commits/'+DEVICE_HEALTH_CANDIDATE+'/check-runs?per_page=100')).check_runs;
 for(const name of ['integration-gate','preservation','route-sweep'])assert(checks.some(c=>c.name===name&&c.conclusion==='success'),'Missing health candidate check '+name);
 assert(checks.length>0&&checks.every(c=>c.status==='completed'&&['success','skipped','neutral'].includes(c.conclusion)),'Unpassed native health candidate checks');
 return {candidate:DEVICE_HEALTH_CANDIDATE,receipts,physicalAcceptance:false};
}
