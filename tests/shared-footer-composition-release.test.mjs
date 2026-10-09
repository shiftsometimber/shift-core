import test from 'node:test';import assert from 'node:assert/strict';
import {SHARED_FOOTER_COMPOSITION_BASE,SHARED_FOOTER_COMPOSITION_PATHS,SHARED_FOOTER_COMPOSITION_MAINTENANCE,RECONCILIATION_MANIFEST,verifySharedFooterComposition} from '../release/approved-runtime-composition.mjs';

function fixture(){const source='d'.repeat(40),maintenanceSource='e'.repeat(40),head='f'.repeat(40),c={proof:'EXACT_SHARED_FOOTER_COMPOSITION_V1',base:SHARED_FOOTER_COMPOSITION_BASE,source,maintenanceSource,paths:SHARED_FOOTER_COMPOSITION_PATHS,maintenancePaths:SHARED_FOOTER_COMPOSITION_MAINTENANCE,runtimeChanged:false,publicCopyChanged:false,medicalEvidenceChanged:false,clinicalApprovalChanged:false,customerDataChanged:false,checkoutChanged:false,myTimberChanged:false,privacyAssertionsWeakened:false};return {c,o:{head,ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST],read:(ref,path)=>'composition:'+path}};}
test('shared footer composition reconciliation is test proof only',()=>{const {c,o}=fixture();assert.equal(verifySharedFooterComposition(c,o),c);});
test('shared footer composition reconciliation rejects unrelated files, drift and weakened boundaries',()=>{
 {const {c,o}=fixture();o.diff=(a,b)=>a===c.base?[...c.paths,'worker-entry-v6.js']:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST];assert.throws(()=>verifySharedFooterComposition(c,o),/Unrelated shared footer composition source/);}
 {const {c,o}=fixture(),read=o.read;o.read=(ref,path)=>ref==='HEAD'&&path===c.paths[0]?'changed':read(ref,path);assert.throws(()=>verifySharedFooterComposition(c,o),/source drift/);}
 for(const flag of ['runtimeChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','customerDataChanged','checkoutChanged','myTimberChanged','privacyAssertionsWeakened']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifySharedFooterComposition(c,o));}
});
