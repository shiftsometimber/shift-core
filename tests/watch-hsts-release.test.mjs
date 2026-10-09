import test from 'node:test';import assert from 'node:assert/strict';
import {WATCH_HSTS_BASE,WATCH_HSTS_PATHS,WATCH_HSTS_MAINTENANCE,RECONCILIATION_MANIFEST,verifyWatchHsts} from '../release/approved-runtime-composition.mjs';

function fixture(){
 const source='a'.repeat(40),maintenanceSource='b'.repeat(40),head='c'.repeat(40);
 const c={proof:'EXACT_WATCH_HSTS_V1',base:WATCH_HSTS_BASE,source,maintenanceSource,paths:WATCH_HSTS_PATHS,maintenancePaths:WATCH_HSTS_MAINTENANCE,runtimeChanged:true,readOnlyHeadersChanged:true,publicCopyChanged:false,medicalEvidenceChanged:false,clinicalApprovalChanged:false,catalogueCountChanged:false,ukAuthorisationChanged:false,nhsAccessChanged:false,supplyChanged:false,customerDataChanged:false,checkoutChanged:false,myTimberChanged:false};
 const payload=new Set(c.paths),maintenance=new Set(c.maintenancePaths);
 return {c,o:{head,ancestor:()=>{},diff:(a,b)=>a===c.base?c.paths:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST],read:(ref,path)=>ref==='HEAD'?(payload.has(path)?'source:'+path:'maintenance:'+path):ref===c.source?'source:'+path:'maintenance:'+path,content:(ref,path)=>path==='medicines-watch/page.mjs'?(ref===c.base?'export const oldWatch=true;':"headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload');"):path==='.github/workflows/cloudflare-production-promote.yml'?'guarded workflow':'unchanged'}};
}

test('Watch HSTS restoration is one finite read-only runtime amendment',()=>{const {c,o}=fixture();assert.equal(verifyWatchHsts(c,o),c);});
test('Watch HSTS restoration rejects unrelated files, drift and changed medical boundaries',()=>{
 {const {c,o}=fixture();o.diff=(a,b)=>a===c.base?[...c.paths,'worker-entry-v6.js']:a===c.source?c.maintenancePaths:[RECONCILIATION_MANIFEST];assert.throws(()=>verifyWatchHsts(c,o),/Unrelated Watch HSTS source/);}
 {const {c,o}=fixture(),read=o.read;o.read=(ref,path)=>ref==='HEAD'&&path===c.paths[0]?'changed':read(ref,path);assert.throws(()=>verifyWatchHsts(c,o),/source drift/);}
 for(const flag of ['publicCopyChanged','medicalEvidenceChanged','clinicalApprovalChanged','catalogueCountChanged','ukAuthorisationChanged','nhsAccessChanged','supplyChanged','customerDataChanged','checkoutChanged','myTimberChanged']){const {c,o}=fixture();c[flag]=true;assert.throws(()=>verifyWatchHsts(c,o));}
});
