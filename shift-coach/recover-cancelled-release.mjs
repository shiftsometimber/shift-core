import {SITEWIDE_VERSION,verifySitewideRuntime} from '../release/sitewide-seo-scope.mjs';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tabletRuntime,TABLET_RUNTIME_RECEIPT,verifyTabletRuntime,technicalRecovery,verifyTechnicalCancelledRuntime,catalogueRuntime,verifyCatalogueBaseline,articleRuntime,recovery,recoveryDecision,verifiedArticleRuntime,verifiedOwnedRuntime,recentSuccessfulPromotions} from './cancelled-release-recovery.mjs';import {verifyCoachingRelease} from './release-contract.mjs';
assert.equal(process.env.GITHUB_REF,'refs/heads/main');verifyCoachingRelease({requireLaunch:true});
const get=async path=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core'+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json();};
const main=await get('/git/refs/heads/main');assert.equal(main.object.sha,process.env.GITHUB_SHA,'Do not recover from a stale release');
const wrangler=(...args)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.jsonc'],{encoding:'utf8',maxBuffer:4*1024*1024});
const active=()=>JSON.parse(wrangler('deployments','list','--json')).toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
const verified=await get('/actions/runs/'+recovery.verifiedRun),failed=await get('/actions/runs/'+recovery.run),before=active();
const activeVersion=before.versions?.[0]?.version_id;
const version=JSON.parse(wrangler('versions','view',activeVersion,'--json'));
const versionObservation={kind:'runtime_recovery_version_observation',id:version.id,createdOn:version.metadata?.created_on,source:version.metadata?.source,triggeredBy:version.annotations?.['workers/triggered_by']||null,tag:version.annotations?.['workers/tag']||null,message:version.annotations?.['workers/message']||null};
console.log(JSON.stringify({kind:'runtime_recovery_observation',deploymentId:before.id,activeVersion,release:process.env.GITHUB_SHA,version:versionObservation}));
let decision,ownedProof,technicalProof;
if(activeVersion===technicalRecovery.version){
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact cancelled SEO recovery logs unavailable');return r.text();};
 technicalProof=await verifyTechnicalCancelledRuntime(before,get,getLogs);decision='restore';
}
else 
if([recovery.verified,recovery.unverified].includes(before.versions?.[0]?.version_id))decision=recoveryDecision(before,failed,verified);
else{
 if(activeVersion===tabletRuntime.version){
  const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact tablet predecessor logs unavailable');return r.text();};
  ownedProof=await verifyTabletRuntime(before,version,readFileSync(TABLET_RUNTIME_RECEIPT,'utf8'),get,getLogs);
 }
 if(activeVersion===SITEWIDE_VERSION){
  const c=JSON.parse(readFileSync('shift-coach/release-manifest.json','utf8')).sitewideSeoComposition;
  const receiptText=readFileSync('docs/seo-sitewide-live-receipt-20261006.json','utf8');
  const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact SEO proof logs unavailable');return r.text();};
  ownedProof=await verifySitewideRuntime(before,c,receiptText,get,getLogs);
 }
 if(activeVersion===catalogueRuntime.version){
  const receipt=JSON.parse(readFileSync('docs/catalogue-benefits-live-receipt-20261006.json','utf8'));
  const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact rollback job logs unavailable');return r.text();};
  if(await verifyCatalogueBaseline(before,get,getLogs,receipt,JSON.parse(readFileSync('docs/catalogue-runtime-rollback-37462426049.json','utf8'))))ownedProof={run:catalogueRuntime.run,source:catalogueRuntime.source,version:catalogueRuntime.version,deployment:before.id,evidenceKind:'original-hosted-proof-plus-independent-live-receipt-and-exact-rollback'};
 }
 if(before.versions?.[0]?.version_id===articleRuntime.version){
  const run=await get('/actions/runs/'+articleRuntime.run),jobs=await get('/actions/runs/'+articleRuntime.run+'/jobs');
  const job=(jobs.jobs||[]).find(j=>j.name==='release'&&j.conclusion==='success');
  if(verifiedArticleRuntime(before,run,job))ownedProof={run:run.id,source:run.head_sha,version:articleRuntime.version};
 }
 const runs=ownedProof?[]:await recentSuccessfulPromotions(get,before);
 for(const run of runs){
  if(ownedProof)break;
  const jobs=await get('/actions/runs/'+run.id+'/jobs');
  for(const job of (jobs.jobs||[]).filter(j=>j.name==='promote'&&j.conclusion==='success')){
   const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+job.id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Verified promotion logs unavailable');
   const logs=await r.text();
   for(const line of logs.split('\n')){
    const start=line.indexOf('{"kind":"owned_runtime_deployment"');if(start<0)continue;
    let receipt;try{receipt=JSON.parse(line.slice(start))}catch{continue}
    if(verifiedOwnedRuntime(before,run,job,receipt)){ownedProof={run:run.id,source:run.head_sha,version:receipt.versionId};break;}
   }
  }
 }
 assert(ownedProof,'Unknown runtime has no exact successful owned-deployment proof; stop without rollback');
 decision='retain';
}

if(decision==='restore'){
 if(technicalProof){
  const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Runtime moved before exact SEO recovery');
  console.log(wrangler('rollback',technicalRecovery.verifiedVersion,'--message','Restore exact successful predecessor of cancelled SEO run 37512509413; no data rollback'));
  const after=active();assert.equal(after.versions?.length,1);assert.equal(after.versions[0].percentage,100);assert.equal(after.versions[0].version_id,technicalRecovery.verifiedVersion,'SEO recovery did not restore the exact successful predecessor');
 }else{
 console.log(wrangler('rollback',recovery.verified,'--message','Restore verified runtime after evidenced cancelled production run '+recovery.run));
 assert.equal(recoveryDecision(active(),failed,verified),'retain','Recovery did not restore the verified runtime');
 }
}
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/cancelled-release-recovery.json',JSON.stringify({at:new Date().toISOString(),decision,run:technicalProof?technicalRecovery.run:recovery.run,from:before.versions[0].version_id,to:technicalProof?technicalRecovery.verifiedVersion:ownedProof?.version||recovery.verified,verifiedRun:technicalProof?technicalRecovery.verifiedRun:ownedProof?.run||recovery.verifiedRun,ownedProof:ownedProof||null,...(technicalProof?{technicalRecovery:technicalProof}:{}),customerRecordsRead:0,dataChanged:false},null,2));
console.log('PASS exact cancelled-release recovery: '+decision+' verified runtime; no data rollback');
