import test from 'node:test';import assert from 'node:assert/strict';
import {WATCH_RUNTIME_BASELINE_BASE,WATCH_RUNTIME_BASELINE_SOURCE,WATCH_RUNTIME_BASELINE_PATHS,WATCH_RUNTIME_BASELINE_MAINTENANCE,RECONCILIATION_MANIFEST,verifyWatchRuntimeBaseline} from '../release/approved-runtime-composition.mjs';

function fixture(){
 const maintenanceSource='b'.repeat(40),head='c'.repeat(40);
 const c={proof:'EXACT_WATCH_RUNTIME_BASELINE_V1',base:WATCH_RUNTIME_BASELINE_BASE,source:WATCH_RUNTIME_BASELINE_SOURCE,maintenanceSource,paths:WATCH_RUNTIME_BASELINE_PATHS,maintenancePaths:WATCH_RUNTIME_BASELINE_MAINTENANCE,recoveryVerifierChanged:true,currentDeploymentRun:37870273259,currentDeploymentId:'3515e037-1915-476a-9f6b-6b41bbf5e061',currentVersionId:'48eb4d71-cb90-4132-bb16-4768132d61d5',runtimeChanged:false,publicCopyChanged:false,medicalEvidenceChanged:false,clinicalApprovalChanged:false,customerDataChanged:false,checkoutChanged:false,myTimberChanged:false,rollbackAuthorityBroadened:false};
 const payload=new Set(c.paths);
 const content=(ref,path)=>path==='shift-coach/cancelled-release-recovery.mjs'&&ref!==c.base?'export const recordedMedicinesWatchRuntime=true; if(active?.id!==receipt.deploymentId)return false;':path==='.github/workflows/cloudflare-production-promote.yml'?'guarded workflow':'unchanged';
 return {c,o:{head,ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST],read:(ref,path)=>ref==='HEAD'?(payload.has(path)?'source:'+path:'maintenance:'+path):ref===c.source?'source:'+path:'maintenance:'+path,content}};
}

test('Watch recovery baseline is one finite verifier-only amendment',()=>{const {c,o}=fixture();assert.equal(verifyWatchRuntimeBaseline(c,o),c);});
test('Watch recovery baseline rejects unrelated scope, drift and broadened authority',()=>{
 {const {c,o}=fixture();o.diff=(a,b)=>a===c.base?[...c.paths,'worker-entry-v6.js']:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST];assert.throws(()=>verifyWatchRuntimeBaseline(c,o),/Unrelated Watch runtime baseline source/);}
 {const {c,o}=fixture(),read=o.read;o.read=(ref,path)=>ref==='HEAD'&&path===c.paths[0]?'changed':read(ref,path);assert.throws(()=>verifyWatchRuntimeBaseline(c,o),/source drift/);}
 for(const flag of ['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','customerDataChanged','checkoutChanged','myTimberChanged','rollbackAuthorityBroadened']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifyWatchRuntimeBaseline(c,o));}
});
