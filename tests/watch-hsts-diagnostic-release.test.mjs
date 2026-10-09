import test from 'node:test';import assert from 'node:assert/strict';
import {WATCH_HSTS_DIAGNOSTIC_BASE,WATCH_HSTS_DIAGNOSTIC_PATHS,RECONCILIATION_MANIFEST,verifyWatchHstsDiagnostic} from '../release/approved-runtime-composition.mjs';

function fixture(){const source='d'.repeat(40),head='e'.repeat(40),c={proof:'EXACT_WATCH_HSTS_DIAGNOSTIC_V1',base:WATCH_HSTS_DIAGNOSTIC_BASE,source,paths:WATCH_HSTS_DIAGNOSTIC_PATHS,runtimeChanged:false,readOnlyHeadersChanged:false,publicCopyChanged:false,medicalEvidenceChanged:false,clinicalApprovalChanged:false,catalogueCountChanged:false,ukAuthorisationChanged:false,nhsAccessChanged:false,supplyChanged:false,customerDataChanged:false,checkoutChanged:false,myTimberChanged:false};return {c,o:{head,ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:[RECONCILIATION_MANIFEST],read:(ref,path)=>'diagnostic:'+path}};}
test('Watch HSTS diagnostic compatibility is one finite non-runtime layer',()=>{const {c,o}=fixture();assert.equal(verifyWatchHstsDiagnostic(c,o),c);});
test('Watch HSTS diagnostic compatibility rejects scope, drift and boundary changes',()=>{
 {const {c,o}=fixture();o.diff=(a,b)=>a===c.base?[...c.paths,'worker-entry-v6.js']:[RECONCILIATION_MANIFEST];assert.throws(()=>verifyWatchHstsDiagnostic(c,o),/Unrelated Watch HSTS diagnostic source/);}
 {const {c,o}=fixture(),read=o.read;o.read=(ref,path)=>ref==='HEAD'&&path===c.paths[0]?'changed':read(ref,path);assert.throws(()=>verifyWatchHstsDiagnostic(c,o),/source drift/);}
 for(const flag of ['runtimeChanged','readOnlyHeadersChanged','publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifyWatchHstsDiagnostic(c,o));}
});
