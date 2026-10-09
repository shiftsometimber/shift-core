import test from 'node:test';import assert from 'node:assert/strict';
import {WATCH_OWNED_DISPATCH_BASE,WATCH_OWNED_DISPATCH_SOURCE,WATCH_OWNED_DISPATCH_PATHS,WATCH_OWNED_DISPATCH_MAINTENANCE,RECONCILIATION_MANIFEST,verifyWatchOwnedDispatch} from '../release/approved-runtime-composition.mjs';

function fixture(){
 const maintenanceSource='b'.repeat(40),head='c'.repeat(40);
 const c={proof:'EXACT_WATCH_OWNED_DISPATCH_V1',base:WATCH_OWNED_DISPATCH_BASE,source:WATCH_OWNED_DISPATCH_SOURCE,maintenanceSource,paths:WATCH_OWNED_DISPATCH_PATHS,maintenancePaths:WATCH_OWNED_DISPATCH_MAINTENANCE,pinnedRun:37870273259,pinnedEvent:'workflow_dispatch',finalOwnershipVerifierChanged:true,runtimeChanged:false,publicCopyChanged:false,medicalEvidenceChanged:false,clinicalApprovalChanged:false,customerDataChanged:false,checkoutChanged:false,myTimberChanged:false,rollbackAuthorityBroadened:false};
 const payload=new Set(c.paths);
 const content=(ref,path)=>path==='shift-coach/cancelled-release-recovery.mjs'&&ref!==c.base?'const exactRecordedManualRelease=true; if(run?.event!==expectedEvent)return false;':path==='.github/workflows/cloudflare-production-promote.yml'?'guarded workflow':'unchanged';
 return {c,o:{head,ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST],read:(ref,path)=>ref==='HEAD'?(payload.has(path)?'source:'+path:'maintenance:'+path):ref===c.source?'source:'+path:'maintenance:'+path,content}};
}

test('Watch final ownership dispatch repair is finite and verifier-only',()=>{const {c,o}=fixture();assert.equal(verifyWatchOwnedDispatch(c,o),c);});
test('Watch final ownership dispatch repair rejects scope, event and authority drift',()=>{
 {const {c,o}=fixture();o.diff=(a,b)=>a===c.base?[...c.paths,'worker-entry-v6.js']:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST];assert.throws(()=>verifyWatchOwnedDispatch(c,o),/Unrelated Watch owned dispatch source/);}
 {const {c,o}=fixture(),read=o.read;o.read=(ref,path)=>ref==='HEAD'&&path===c.paths[0]?'changed':read(ref,path);assert.throws(()=>verifyWatchOwnedDispatch(c,o),/source drift/);}
 {const {c,o}=fixture();c.pinnedEvent='push';assert.throws(()=>verifyWatchOwnedDispatch(c,o));}
 for(const flag of ['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','customerDataChanged','checkoutChanged','myTimberChanged','rollbackAuthorityBroadened']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifyWatchOwnedDispatch(c,o));}
});
