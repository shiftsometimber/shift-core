import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SITEWIDE_BRANCH,SITEWIDE_WORKFLOW,SITEWIDE_VERSION,SITEWIDE_DEPLOYMENT,SITEWIDE_ROLLBACK,assertSitewideLiveReceipt,sitewideProofMarker,verifySitewideRuntime} from '../release/sitewide-seo-scope.mjs';
const receiptText=readFileSync('docs/seo-sitewide-live-receipt-20261006.json','utf8'),r=JSON.parse(receiptText);
const c=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).sitewideSeoComposition;
test('manual SEO receipt requires all eight owned and thirteen protected complete document checks',()=>{
 assert.doesNotThrow(()=>assertSitewideLiveReceipt(r));
 for(const change of [{source:'a'.repeat(40)},{version:'unknown'},{deployment:'unknown'},{trafficPercentage:99},{sitemapChanged:true},{homepageChanged:true},{startHereChanged:true},{d1Writes:1},{bindingsChanged:['DB']},{tests:{pass:40,fail:1}},{fullHandler:r.fullHandler.slice(1)},{liveProof:{...r.liveProof,pass:false}},{liveLayouts:r.liveLayouts.slice(1)}])assert.throws(()=>assertSitewideLiveReceipt({...r,...change}));
});
test('runtime adoption accepts only the exact current deployment produced by the evidenced failed-release rollback',async()=>{
 const p={run:123,job:456,source:'a'.repeat(40)},composition={...c,hostedProof:p};
 const proofRun={id:p.run,head_sha:p.source,path:SITEWIDE_WORKFLOW,head_branch:SITEWIDE_BRANCH,event:'push',status:'completed',conclusion:'success'};
 const proofJob={id:p.job,name:'verify',status:'completed',conclusion:'success'};
 const rollbackRun={id:SITEWIDE_ROLLBACK.run,head_sha:SITEWIDE_ROLLBACK.source,path:'.github/workflows/cloudflare-production-promote.yml',head_branch:'main',event:'push',status:'completed',conclusion:'failure'};
 const rollbackJob={id:SITEWIDE_ROLLBACK.job,run_id:SITEWIDE_ROLLBACK.run,name:'promote',status:'completed',conclusion:'failure'};
 const active={id:SITEWIDE_ROLLBACK.deployment,created_on:SITEWIDE_ROLLBACK.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]};
 const get=async path=>path===`/actions/runs/${p.run}`?proofRun:path===`/actions/runs/${p.run}/jobs`?{jobs:[proofJob]}:path===`/actions/runs/${SITEWIDE_ROLLBACK.run}`?rollbackRun:{jobs:[rollbackJob]};
 const proofMarker='SITEWIDE_SEO_PROOF '+JSON.stringify(sitewideProofMarker(receiptText));
 const rollbackMarker=JSON.stringify({kind:'runtime_recovery_observation',deploymentId:SITEWIDE_DEPLOYMENT,activeVersion:SITEWIDE_VERSION,release:SITEWIDE_ROLLBACK.source,version:{}});
 const deployMarker=JSON.stringify({kind:'owned_runtime_deployment',source:SITEWIDE_ROLLBACK.source,run:String(SITEWIDE_ROLLBACK.run),deploymentId:SITEWIDE_ROLLBACK.failedDeployment,versionId:SITEWIDE_ROLLBACK.failedVersion,previousDeploymentId:SITEWIDE_DEPLOYMENT,previousVersionId:SITEWIDE_VERSION,dataRestored:false});
 const rollbackLogs=[rollbackMarker,deployMarker,'Worker Version '+SITEWIDE_VERSION+' has been deployed to 100% of traffic.','Current Version ID: '+SITEWIDE_VERSION].join('\n');
 const logs=async id=>id===p.job?proofMarker:rollbackLogs;
 const adopted=await verifySitewideRuntime(active,composition,receiptText,get,logs);assert.equal(adopted.deployment,SITEWIDE_ROLLBACK.deployment);assert.equal(adopted.run,p.run);assert.equal(adopted.source,p.source);
 for(const change of [{id:1},{head_sha:'b'.repeat(40)},{path:'.github/workflows/other.yml'},{head_branch:'other'},{event:'pull_request'},{status:'in_progress'},{conclusion:'success'}])await assert.rejects(()=>verifySitewideRuntime(active,composition,receiptText,async path=>path===`/actions/runs/${p.run}`?proofRun:path===`/actions/runs/${p.run}/jobs`?{jobs:[proofJob]}:path===`/actions/runs/${SITEWIDE_ROLLBACK.run}`?{...rollbackRun,...change}:{jobs:[rollbackJob]},logs));
 for(const change of [{id:1},{name:'other'},{status:'in_progress'},{conclusion:'success'}])await assert.rejects(()=>verifySitewideRuntime(active,composition,receiptText,async path=>path===`/actions/runs/${p.run}`?proofRun:path===`/actions/runs/${p.run}/jobs`?{jobs:[proofJob]}:path===`/actions/runs/${SITEWIDE_ROLLBACK.run}`?rollbackRun:{jobs:[{...rollbackJob,...change}]},logs));
 await assert.rejects(()=>verifySitewideRuntime(active,composition,receiptText,get,async id=>id===p.job?proofMarker:''),/observation absent/);
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
 const logs=JSON.stringify({kind:'runtime_recovery_observation',deploymentId:SITEWIDE_DEPLOYMENT,activeVersion:SITEWIDE_VERSION,release:p.source})+'\n'+JSON.stringify(receipt)+'\nWorker Version '+SITEWIDE_VERSION+' has been deployed to 100% of traffic.\nCurrent Version ID: '+SITEWIDE_VERSION;
 const get=async path=>path.endsWith('/jobs')?{jobs:[job]}:run;
 assert.equal((await verifySitewideRollback(active,get,async()=>logs)).deployment,p.deployment);
 for(const patch of [{id:'unknown'},{created_on:'2026-10-06T13:28:50Z'},{versions:[{version_id:SITEWIDE_VERSION,percentage:99}]}])await assert.rejects(()=>verifySitewideRollback({...active,...patch},get,async()=>logs));
 for(const patch of [{head_sha:'a'.repeat(40)},{conclusion:'success'},{head_branch:'other'},{event:'workflow_dispatch'}])await assert.rejects(()=>verifySitewideRollback(active,async path=>path.endsWith('/jobs')?{jobs:[job]}:{...run,...patch},async()=>logs));
 for(const patch of [{run_id:1},{name:'verify'},{conclusion:'success'}])await assert.rejects(()=>verifySitewideRollback(active,async path=>path.endsWith('/jobs')?{jobs:[{...job,...patch}]}:run,async()=>logs));
 for(const patch of [{previousVersionId:'unknown'},{source:'a'.repeat(40)},{dataRestored:true},{deploymentId:'unknown'}])await assert.rejects(()=>verifySitewideRollback(active,get,async()=>logs.replace(JSON.stringify(receipt),JSON.stringify({...receipt,...patch}))));
 await assert.rejects(()=>verifySitewideRollback(active,get,async()=>logs.split('\n')[0]+'\n'+JSON.stringify(receipt)),/rollback absent/);
});

test('fifth owned rollback requires the complete earlier chain and rejects altered evidence',async()=>{
 const {SITEWIDE_SECOND_ROLLBACK,SITEWIDE_THIRD_ROLLBACK,SITEWIDE_FOURTH_ROLLBACK,SITEWIDE_FIFTH_ROLLBACK,verifySitewideRollback}=await import('../release/sitewide-seo-scope.mjs');
 const chain=[SITEWIDE_ROLLBACK,SITEWIDE_SECOND_ROLLBACK,SITEWIDE_THIRD_ROLLBACK,SITEWIDE_FOURTH_ROLLBACK,SITEWIDE_FIFTH_ROLLBACK];
 const get=async path=>{
  const p=chain.find(x=>path.includes('/'+x.run));assert(p);
  return path.endsWith('/jobs')?{jobs:[{id:p.job,run_id:p.run,name:'promote',status:'completed',conclusion:'failure'}]}:{id:p.run,head_sha:p.source,path:'.github/workflows/cloudflare-production-promote.yml',head_branch:'main',event:'push',status:'completed',conclusion:'failure'};
 };
 const logs=async id=>{
  const i=chain.findIndex(x=>x.job===id),p=chain[i],previous=i?chain[i-1].deployment:SITEWIDE_DEPLOYMENT;
  return [
   JSON.stringify({kind:'runtime_recovery_observation',deploymentId:previous,activeVersion:SITEWIDE_VERSION,release:p.source}),
   JSON.stringify({kind:'owned_runtime_deployment',source:p.source,run:String(p.run),deploymentId:p.failedDeployment,versionId:p.failedVersion,previousDeploymentId:previous,previousVersionId:SITEWIDE_VERSION,dataRestored:false}),
   'Worker Version '+SITEWIDE_VERSION+' has been deployed to 100% of traffic.','Current Version ID: '+SITEWIDE_VERSION
  ].join('\n');
 };
 const p=SITEWIDE_FIFTH_ROLLBACK,active={id:p.deployment,created_on:p.createdOn,versions:[{version_id:SITEWIDE_VERSION,percentage:100}]},seen=[];
 assert.equal((await verifySitewideRollback(active,get,async id=>{seen.push(id);return logs(id)})).run,p.run);
 assert.deepEqual(seen,chain.map(x=>x.job));
 for(const patch of [{id:'unrecorded'},{created_on:'wrong'},{versions:[{version_id:SITEWIDE_VERSION,percentage:99}]}])await assert.rejects(()=>verifySitewideRollback({...active,...patch},get,logs));
 for(const bad of chain){
  await assert.rejects(()=>verifySitewideRollback(active,get,async id=>id===bad.job?'':logs(id)));
  await assert.rejects(()=>verifySitewideRollback(active,async path=>path==='/actions/runs/'+bad.run?{...await get(path),head_sha:'a'.repeat(40)}:get(path),logs));
 }
 await assert.rejects(()=>verifySitewideRollback(active,get,async id=>id===p.job?(await logs(id)).replace('"dataRestored":false','"dataRestored":true'):logs(id)));
});

test('live article checker retries dropped headers and bodies but fails persistent errors or incorrect content',async()=>{
 const {mkdtempSync,rmSync,writeFileSync:write}=await import('node:fs');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {spawnSync}=await import('node:child_process');
 const script=new URL('../scripts/verify-shift-take-live.mjs',import.meta.url).href;
 const html='<main data-shift-take><h2>SHIFT’s take</h2></main><script type="application/ld+json">'+JSON.stringify({'@type':'Article',datePublished:'2026-09-01T00:00:00.000Z'})+'</script>';
 for(const scenario of ['header','body','http','persistent','wrongContent']){
  const dir=mkdtempSync(join(tmpdir(),'shift-take-read-'));
  try{
   write(join(dir,'shift-take-archive-proof.json'),JSON.stringify({proof:[{path:'/news/test',firstPublished:'2026-09-01'}]}));
   const code=[
    'let calls=0;const scenario='+JSON.stringify(scenario)+',html='+JSON.stringify(html)+';',
    'globalThis.setTimeout=(fn)=>{queueMicrotask(fn);return 0;};',
    'globalThis.fetch=async()=>{calls++;',
    "if(scenario==='persistent'||scenario==='header'&&calls===1)throw new TypeError('fetch failed',{cause:{code:'ECONNRESET'}});",
    "if(scenario==='body'&&calls===1)return {ok:true,status:200,text:async()=>{throw new TypeError('terminated',{cause:{code:'ECONNRESET'}})}};",
    "return {ok:!(scenario==='http'&&calls===1),status:scenario==='http'&&calls===1?503:200,text:async()=>scenario==='wrongContent'?html.replace('data-shift-take','bad'):html};};",
    'try{await import('+JSON.stringify(script)+");console.log('RESULT '+JSON.stringify({ok:true,calls}));}",
    "catch(e){console.log('RESULT '+JSON.stringify({ok:false,calls,error:e.message}));}"
   ].join('\n');
   const child=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:dir,encoding:'utf8'});
   assert.equal(child.status,0,child.stderr);
   const result=JSON.parse(child.stdout.split('\n').find(x=>x.startsWith('RESULT ')).slice(7));
   assert.equal(result.ok,!['persistent','wrongContent'].includes(scenario),scenario);
   assert.equal(result.calls,scenario==='persistent'?3:scenario==='wrongContent'?1:2,scenario);
   if(result.ok)assert.equal(JSON.parse(readFileSync(join(dir,'shift-take-live-proof.json'),'utf8')).articles,1);
  }finally{rmSync(dir,{recursive:true,force:true});}
 }
});
