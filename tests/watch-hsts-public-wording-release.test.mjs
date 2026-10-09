import test from 'node:test';import assert from 'node:assert/strict';
import {WATCH_HSTS_PUBLIC_WORDING_BASE,WATCH_HSTS_PUBLIC_WORDING_PATHS,WATCH_HSTS_PUBLIC_WORDING_MAINTENANCE,RECONCILIATION_MANIFEST,verifyWatchHstsPublicWording} from '../release/approved-runtime-composition.mjs';

function fixture(){
 const source='a'.repeat(40),maintenanceSource='b'.repeat(40),head='c'.repeat(40);
 const c={proof:'EXACT_WATCH_HSTS_PUBLIC_WORDING_V1',base:WATCH_HSTS_PUBLIC_WORDING_BASE,source,maintenanceSource,paths:WATCH_HSTS_PUBLIC_WORDING_PATHS,maintenancePaths:WATCH_HSTS_PUBLIC_WORDING_MAINTENANCE,runtimeChanged:false,readOnlyHeadersChanged:false,publicCopyChanged:false,medicalEvidenceChanged:false,clinicalApprovalChanged:false,catalogueCountChanged:false,ukAuthorisationChanged:false,nhsAccessChanged:false,supplyChanged:false,customerDataChanged:false,checkoutChanged:false,myTimberChanged:false,privacyAssertionsWeakened:false};
 const payload=new Set(c.paths);
 return {c,o:{head,ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST],read:(ref,path)=>ref==='HEAD'?(payload.has(path)?'source:'+path:'maintenance:'+path):ref===c.source?'source:'+path:'maintenance:'+path}};
}

test('Watch HSTS public-wording reconciliation is release metadata only',()=>{const {c,o}=fixture();assert.equal(verifyWatchHstsPublicWording(c,o),c);});
test('Watch HSTS public-wording reconciliation rejects unrelated files, drift and changed boundaries',()=>{
 {const {c,o}=fixture();o.diff=(a,b)=>a===c.base?[...c.paths,'worker-entry-v6.js']:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST];assert.throws(()=>verifyWatchHstsPublicWording(c,o),/Unrelated Watch HSTS public wording source/);}
 {const {c,o}=fixture(),read=o.read;o.read=(ref,path)=>ref==='HEAD'&&path===c.paths[0]?'changed':read(ref,path);assert.throws(()=>verifyWatchHstsPublicWording(c,o),/source drift/);}
 for(const flag of ['runtimeChanged','readOnlyHeadersChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged','privacyAssertionsWeakened']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifyWatchHstsPublicWording(c,o));}
});
