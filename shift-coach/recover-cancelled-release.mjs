import {SUPPORT_RUNTIME,verifySupportRuntime} from '../release/live-support-runtime.mjs';
import {OWNER_RUNTIME,verifyOwnerRuntime} from '../release/owner-captured-runtime.mjs';
import {SITEWIDE_VERSION,verifySitewideRuntime} from '../release/sitewide-seo-scope.mjs';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {restoredMaleObesitySupportRuntime,restoredMaleObesityRuntime,verifyMaleObesityRollback,restoredContinuityRuntime,verifyContinuityRollback,restoredPassportRuntime,verifyPassportRollback,restoredToolRuntime,verifyToolRollback,restoredLaterRuntime,verifyRestoredLaterRuntime,tabletRuntime,TABLET_RUNTIME_RECEIPT,verifyTabletRuntime,technicalRecovery,verifyTechnicalCancelledRuntime,unattributedRuntimeRecovery,verifyUnattributedRuntime,laterUnattributedRuntimeRecovery,verifyLaterUnattributedRuntime,catalogueRuntime,verifyCatalogueBaseline,articleRuntime,recovery,recoveryDecision,verifiedArticleRuntime,verifiedOwnedRuntime,recentSuccessfulPromotions} from './cancelled-release-recovery.mjs';import {verifyCoachingRelease} from './release-contract.mjs';
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
let restoredMaleObesityRuntimeProof,decision,ownedProof,technicalProof,unattributedProof,laterUnattributedProof,ownerCapturedProof,restoredLaterRuntimeProof,restoredToolRuntimeProof,restoredPassportRuntimeProof,restoredContinuityRuntimeProof;
if([restoredMaleObesityRuntime.deployment,restoredMaleObesitySupportRuntime.deployment].includes(before.id)){
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact owned rollback logs unavailable');return r.text();};
 restoredMaleObesityRuntimeProof=await verifyMaleObesityRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredContinuityRuntime.deployment){
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact owned rollback logs unavailable');return r.text();};
 restoredContinuityRuntimeProof=await verifyContinuityRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredPassportRuntime.deployment){
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact owned rollback logs unavailable');return r.text();};
 restoredPassportRuntimeProof=await verifyPassportRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredToolRuntime.deployment){
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact owned rollback logs unavailable');return r.text();};
 restoredToolRuntimeProof=await verifyToolRollback(before,version,get,getLogs);const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during exact owned rollback verification');decision='retain';
}
else if(before.id===restoredLaterRuntime.deployment){
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact restoration logs unavailable');return r.text();};
 restoredLaterRuntimeProof=await verifyRestoredLaterRuntime(before,version,get,getLogs);
 const unchanged=active();assert.deepEqual(unchanged,before,'Runtime moved during restoration ownership verification');
 decision='retain';
}
else if(activeVersion===technicalRecovery.version){
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact cancelled SEO recovery logs unavailable');return r.text();};
 technicalProof=await verifyTechnicalCancelledRuntime(before,get,getLogs);decision='restore';
}
else if([unattributedRuntimeRecovery.version,laterUnattributedRuntimeRecovery.version].includes(activeVersion)){
 const accountApi='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID;
 const providerGet=async url=>{const r=await fetch(url,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Provider read failed '+new URL(url).pathname+' HTTP '+r.status);return r;};
 const providerVersion=(await (await providerGet(accountApi+'/workers/scripts/shift-core/versions/'+activeVersion)).json()).result;
 const exact=(await (await providerGet(accountApi+'/workers/workers/shift-core/versions/'+activeVersion+'?include=modules')).json()).result;
 assert.equal(exact.id,activeVersion,'Specific-version API returned the wrong runtime');assert(Array.isArray(exact.modules)&&exact.modules.length>0,'Specific-version API returned no modules');
 const modules=exact.modules.map(file=>{assert.equal(typeof file.name,'string');assert.equal(typeof file.content_base64,'string');const bytes=Buffer.from(file.content_base64,'base64');return{module:file.name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}});
 const getLogs=async id=>{const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/jobs/'+id+'/logs',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok,'Exact unattributed-runtime evidence logs unavailable');return r.text();};
 if(activeVersion===laterUnattributedRuntimeRecovery.version)laterUnattributedProof=await verifyLaterUnattributedRuntime(before,version,providerVersion,modules,get,getLogs);
 else unattributedProof=await verifyUnattributedRuntime(before,version,providerVersion,modules,get,getLogs);
 decision='restore';
}
else if(activeVersion===SUPPORT_RUNTIME.version){
 ownerCapturedProof=await verifySupportRuntime(before,version);
 const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Serving support runtime moved during read-only reconstruction');
 decision='retain';
}
else if(activeVersion===OWNER_RUNTIME.version){
 ownerCapturedProof=await verifyOwnerRuntime(before,version);
 const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Owner runtime moved during read-only reconstruction');
 decision='retain';
}
else if([recovery.verified,recovery.unverified].includes(before.versions?.[0]?.version_id))decision=recoveryDecision(before,failed,verified);
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
 if(laterUnattributedProof||unattributedProof){
  const p=laterUnattributedProof?laterUnattributedRuntimeRecovery:unattributedRuntimeRecovery;
  const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Runtime moved before exact unattributed-runtime recovery');
  console.log(wrangler('rollback',p.verifiedVersion,'--message','Restore exact successful predecessor of unattributed runtime observed by read-only run '+p.run+'; no data rollback'));
  const after=active();assert.equal(after.versions?.length,1);assert.equal(after.versions[0].percentage,100);assert.equal(after.versions[0].version_id,p.verifiedVersion,'Unattributed-runtime recovery did not restore the exact successful predecessor');
 }else if(technicalProof){
  const unchanged=active();assert.deepEqual({id:unchanged.id,versions:unchanged.versions},{id:before.id,versions:before.versions},'Runtime moved before exact SEO recovery');
  console.log(wrangler('rollback',technicalRecovery.verifiedVersion,'--message','Restore exact successful predecessor of cancelled SEO run 37512509413; no data rollback'));
  const after=active();assert.equal(after.versions?.length,1);assert.equal(after.versions[0].percentage,100);assert.equal(after.versions[0].version_id,technicalRecovery.verifiedVersion,'SEO recovery did not restore the exact successful predecessor');
 }else{
 console.log(wrangler('rollback',recovery.verified,'--message','Restore verified runtime after evidenced cancelled production run '+recovery.run));
 assert.equal(recoveryDecision(active(),failed,verified),'retain','Recovery did not restore the verified runtime');
 }
}
mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/cancelled-release-recovery.json',JSON.stringify({at:new Date().toISOString(),decision,run:restoredMaleObesityRuntimeProof?restoredMaleObesityRuntimeProof.run:restoredContinuityRuntimeProof?restoredContinuityRuntime.run:restoredPassportRuntimeProof?restoredPassportRuntime.run:restoredToolRuntimeProof?restoredToolRuntime.run:restoredLaterRuntimeProof?restoredLaterRuntime.run:ownerCapturedProof?null:laterUnattributedProof?laterUnattributedRuntimeRecovery.run:unattributedProof?unattributedRuntimeRecovery.run:technicalProof?technicalRecovery.run:recovery.run,from:before.versions[0].version_id,to:restoredMaleObesityRuntimeProof?restoredMaleObesityRuntimeProof.version:restoredContinuityRuntimeProof?restoredContinuityRuntimeProof.version:restoredPassportRuntimeProof?restoredPassportRuntimeProof.version:restoredToolRuntimeProof?restoredToolRuntimeProof.version:restoredLaterRuntimeProof?restoredLaterRuntimeProof.verifiedVersion:ownerCapturedProof?ownerCapturedProof.version:laterUnattributedProof?laterUnattributedRuntimeRecovery.verifiedVersion:unattributedProof?unattributedRuntimeRecovery.verifiedVersion:technicalProof?technicalRecovery.verifiedVersion:ownedProof?.version||recovery.verified,verifiedRun:restoredMaleObesityRuntimeProof?restoredMaleObesityRuntimeProof.verifiedRun:restoredContinuityRuntimeProof?restoredContinuityRuntimeProof.verifiedRun:restoredPassportRuntimeProof?restoredPassportRuntimeProof.verifiedRun:restoredToolRuntimeProof?restoredToolRuntimeProof.verifiedRun:restoredLaterRuntimeProof?restoredLaterRuntimeProof.verifiedRun:ownerCapturedProof?null:laterUnattributedProof?laterUnattributedRuntimeRecovery.verifiedRun:unattributedProof?unattributedRuntimeRecovery.verifiedRun:technicalProof?technicalRecovery.verifiedRun:ownedProof?.run||recovery.verifiedRun,ownedProof:ownedProof||null,...(restoredMaleObesityRuntimeProof?{restoredMaleObesityRuntimeProof}:{}),...(ownerCapturedProof?{ownerCapturedProof}:{}),...(restoredLaterRuntimeProof?{restoredLaterRuntimeProof}:{}),...(restoredToolRuntimeProof?{restoredToolRuntimeProof}:{}),...(restoredPassportRuntimeProof?{restoredPassportRuntimeProof}:{}),...(restoredContinuityRuntimeProof?{restoredContinuityRuntimeProof}:{}),...(technicalProof?{technicalRecovery:technicalProof}:{}),...(unattributedProof?{unattributedRuntimeRecovery:unattributedProof}:{}),...(laterUnattributedProof?{laterUnattributedRuntimeRecovery:laterUnattributedProof}:{}),customerRecordsRead:0,dataChanged:false},null,2));
console.log('PASS exact cancelled-release recovery: '+decision+' verified runtime; no data rollback');
