import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SITEWIDE_BRANCH,SITEWIDE_WORKFLOW,SITEWIDE_VERSION,SITEWIDE_DEPLOYMENT,assertSitewideLiveReceipt,sitewideProofMarker,verifySitewideRuntime} from '../release/sitewide-seo-scope.mjs';
const receiptText=readFileSync('docs/seo-sitewide-live-receipt-20261006.json','utf8'),r=JSON.parse(receiptText);
const c=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).sitewideSeoComposition;
test('manual SEO receipt requires all eight owned and thirteen protected complete document checks',()=>{
 assert.doesNotThrow(()=>assertSitewideLiveReceipt(r));
 for(const change of [{source:'a'.repeat(40)},{version:'unknown'},{deployment:'unknown'},{trafficPercentage:99},{sitemapChanged:true},{homepageChanged:true},{startHereChanged:true},{d1Writes:1},{bindingsChanged:['DB']},{tests:{pass:40,fail:1}},{fullHandler:r.fullHandler.slice(1)},{liveProof:{...r.liveProof,pass:false}},{liveLayouts:r.liveLayouts.slice(1)}])assert.throws(()=>assertSitewideLiveReceipt({...r,...change}));
});
test('runtime adoption requires matching successful independent hosted proof and exact live deployment',async()=>{
 const p={run:123,job:456,source:'a'.repeat(40)},composition={...c,hostedProof:p};
 const run={id:p.run,head_sha:p.source,path:SITEWIDE_WORKFLOW,head_branch:SITEWIDE_BRANCH,event:'push',status:'completed',conclusion:'success'};
 const job={id:p.job,name:'verify',status:'completed',conclusion:'success'};
 const active={id:SITEWIDE_DEPLOYMENT,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]};
 const get=async path=>path.endsWith('/jobs')?{jobs:[job]}:run;
 const logs=async()=>new Date().toISOString()+' SITEWIDE_SEO_PROOF '+JSON.stringify(sitewideProofMarker(receiptText));
 assert.equal((await verifySitewideRuntime(active,composition,receiptText,get,logs)).version,SITEWIDE_VERSION);
 for(const change of [{id:'another'},{versions:[{version_id:'unknown',percentage:100}]},{versions:[{version_id:SITEWIDE_VERSION,percentage:50}]},{versions:[...active.versions,{version_id:'unknown',percentage:0}]}])await assert.rejects(()=>verifySitewideRuntime({...active,...change},composition,receiptText,get,logs));
 for(const change of [{id:1},{head_sha:'b'.repeat(40)},{path:'.github/workflows/cloudflare-production-promote.yml'},{head_branch:'main'},{event:'pull_request'},{status:'in_progress'},{conclusion:'failure'}])await assert.rejects(()=>verifySitewideRuntime(active,composition,receiptText,async path=>path.endsWith('/jobs')?{jobs:[job]}:{...run,...change},logs));
 for(const change of [{id:1},{name:'promote'},{status:'in_progress'},{conclusion:'failure'}])await assert.rejects(()=>verifySitewideRuntime(active,composition,receiptText,async path=>path.endsWith('/jobs')?{jobs:[{...job,...change}]}:run,logs));
 await assert.rejects(()=>verifySitewideRuntime(active,composition,receiptText,get,async()=>''),/marker absent/);
 await assert.rejects(()=>verifySitewideRuntime(active,{...composition,hostedProof:null},receiptText,get,logs),/hosted SEO proof required/);
});
test('only the exact owned failed release and proven rollback may retain the same SEO version',async()=>{
 const {SITEWIDE_ROLLBACK:p,verifySitewideRollback}=await import('../release/sitewide-seo-scope.mjs');
 const active={id:p.deployment,created_on:p.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]};
 const run={id:p.run,head_sha:p.source,path:'.github/workflows/cloudflare-production-promote.yml',head_branch:'main',event:'push',status:'completed',conclusion:'failure'};
 const job={id:p.job,run_id:p.run,name:'promote',status:'completed',conclusion:'failure'};
 const receipt={kind:'owned_runtime_deployment',source:p.source,run:String(p.run),deploymentId:p.failedDeployment,versionId:p.failedVersion,previousDeploymentId:SITEWIDE_DEPLOYMENT,previousVersionId:SITEWIDE_VERSION,dataRestored:false};
 const logs=JSON.stringify(receipt)+'\nWorker Version '+SITEWIDE_VERSION+' has been deployed to 100% of traffic.\nCurrent Version ID: '+SITEWIDE_VERSION;
 const get=async path=>path.endsWith('/jobs')?{jobs:[job]}:run;
 assert.equal((await verifySitewideRollback(active,get,async()=>logs)).deployment,p.deployment);
 for(const patch of [{id:'unknown'},{created_on:'2026-10-06T13:28:50Z'},{versions:[{version_id:SITEWIDE_VERSION,percentage:99}]}])await assert.rejects(()=>verifySitewideRollback({...active,...patch},get,async()=>logs));
 for(const patch of [{head_sha:'a'.repeat(40)},{conclusion:'success'},{head_branch:'other'},{event:'workflow_dispatch'}])await assert.rejects(()=>verifySitewideRollback(active,async path=>path.endsWith('/jobs')?{jobs:[job]}:{...run,...patch},async()=>logs));
 for(const patch of [{run_id:1},{name:'verify'},{conclusion:'success'}])await assert.rejects(()=>verifySitewideRollback(active,async path=>path.endsWith('/jobs')?{jobs:[{...job,...patch}]}:run,async()=>logs));
 for(const patch of [{previousVersionId:'unknown'},{source:'a'.repeat(40)},{dataRestored:true},{deploymentId:'unknown'}])await assert.rejects(()=>verifySitewideRollback(active,get,async()=>logs.replace(JSON.stringify(receipt),JSON.stringify({...receipt,...patch}))));
 await assert.rejects(()=>verifySitewideRollback(active,get,async()=>JSON.stringify(receipt)),/rollback absent/);
});
