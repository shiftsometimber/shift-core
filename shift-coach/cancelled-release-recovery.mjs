import {SUPPORT_RUNTIME,assertSupportStartingPoint} from '../release/live-support-runtime.mjs';
import {assertOwnerStartingPoint} from '../release/owner-captured-runtime.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
// Finite owner-authorised local release: hosted proof is NOT a deployment.
// Its separately recorded live receipt and exact active deployment are required.
export const catalogueRuntime=Object.freeze({run:37453081278,job:112234026421,source:'91b625b0e1e272cdc2e767fa4f4b9fdd06186854',version:'d5b99766-5d14-4002-bd96-18a512d41c19',deployment:'585674f7-ad7d-4cca-a6fc-64ab74da7244'});
export const catalogueRollback=Object.freeze({run:37462426049,job:112265226356,source:'0180d98d6226ca62fabe49f1d1aba3feaa93ec84',deployment:'2a6754ac-33f2-4b5a-b7f7-d128e5555308',failedDeployment:'3fc1e26c-4850-41ce-8af2-6dfb8c47a0e4',failedVersion:'b2f93373-f722-4125-b856-30f577652022'});
export function verifiedCatalogueRollback(active,run,job,logs,receipt){
 const p=catalogueRollback,c=catalogueRuntime,o=receipt?.owned,b=receipt?.rollback,i=receipt?.independentObservation;
 return active?.id===p.deployment&&active.versions?.length===1&&active.versions[0].version_id===c.version&&active.versions[0].percentage===100
  &&run?.id===p.run&&run.head_sha===p.source&&run.status==='completed'&&run.conclusion==='failure'&&run.run_attempt===1&&run.event==='push'&&run.head_branch==='main'&&run.path==='.github/workflows/cloudflare-production-promote.yml'
  &&job?.id===p.job&&job.run_id===p.run&&job.name==='promote'&&job.conclusion==='failure'
  &&job.steps?.some(s=>s.number===68&&s.name==='Measure and retain live homepage mobile speed'&&s.conclusion==='failure')&&job.steps?.some(s=>s.number===107&&s.name==='Restore the captured runtime if a post-deployment gate failed'&&s.conclusion==='success')
  &&receipt?.kind==='verified_restore_of_catalogue_baseline'&&receipt.failedRun===p.run&&receipt.failedJob===p.job
  &&receipt.artifact?.id===11413731078&&receipt.artifact.sha256==='47fad39017565b610e9fc19551750154e3782fc83f20ba75f0f7e801fb715761'
  &&o?.kind==='owned_runtime_deployment'&&o.source===p.source&&String(o.run)===String(p.run)&&o.deploymentId===p.failedDeployment&&o.versionId===p.failedVersion&&o.previousDeploymentId==='69dbd197-28d2-4e7f-a643-83fb96ce0552'&&o.previousVersionId===c.version&&o.dataRestored===false
  &&b?.deployment===p.deployment&&b.restoredVersion===c.version&&b.dataRestored===false&&i?.deployment===p.deployment&&i.version===c.version&&i.percentage===100
  &&typeof logs==='string'&&logs.includes(JSON.stringify(o))&&logs.includes('SUCCESS')&&logs.includes('Worker Version '+c.version+' has been deployed to 100% of traffic.');
}
export async function verifyCatalogueBaseline(active,get,getLogs,liveReceipt,rollbackReceipt){
 const p=catalogueRuntime,run=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+'/jobs'),job=jobs.jobs?.find(j=>j.id===p.job);
 if(verifiedCatalogueRuntime(active,run,job,liveReceipt))return true;
 if(active?.id!==catalogueRollback.deployment)return false;
 // Require the original successful proof/live receipt independently of the failed release.
 if(!verifiedCatalogueRuntime({...active,id:p.deployment},run,job,liveReceipt))return false;
 const failed=await get('/actions/runs/'+catalogueRollback.run),failedJobs=await get('/actions/runs/'+catalogueRollback.run+'/jobs');
 return verifiedCatalogueRollback(active,failed,failedJobs.jobs?.find(j=>j.id===catalogueRollback.job),await getLogs(catalogueRollback.job),rollbackReceipt);
}
export function verifiedCatalogueRuntime(active,run,job,receipt){
 const p=catalogueRuntime;
 return active?.id===p.deployment&&active?.versions?.length===1&&active.versions[0].percentage===100&&active.versions[0].version_id===p.version
  &&run?.id===p.run&&run.head_sha===p.source&&run.status==='completed'&&run.conclusion==='success'&&run.event==='push'&&run.head_branch==='release/catalogue-benefits-20261006'&&run.path==='.github/workflows/catalogue-benefits-proof.yml'
  &&job?.id===p.job&&job.run_id===p.run&&job.name==='proof'&&job.conclusion==='success'
  &&receipt?.kind==='owner_authorized_catalogue_copy_release'&&receipt.source===p.source&&receipt.deploymentId===p.deployment&&receipt.versionId===p.version&&receipt.percentage===100
  &&receipt.hostedProof?.run===p.run&&receipt.hostedProof?.job===p.job&&receipt.hostedProof?.conclusion==='success'&&receipt.liveProof?.allExact===true&&receipt.productionDatabaseWrites===0&&receipt.assetChanges===0;
}
export const recovery=Object.freeze({
 run:37512509413,
 source:'36301f661e9a2e220c15e7f1ccf070612186242b',
 unverified:'81f4a3a8-9b25-4bb5-bd0d-1e870cfc0206',
 unverifiedDeployment:'ec4aeeed-9656-4bc0-8e9d-6d751d6fac77',
 verified:'35e9b183-12c6-4a22-a68b-1a9ee3c8cef4',
 verifiedDeployment:'3f64ff03-76c6-4aaf-bc66-f4c3865711d9',
 verifiedRun:37510903784,
 verifiedSource:'ddde14b19d6ef79547e27afb4ed76bf1f4e39f05'
});
export const articleRuntime=Object.freeze({run:37147521854,source:'f5184e4ffefd6bc2eb105e86e7107e5c61f00327',version:'b25b6adb-1fc3-473e-97b7-88bfe3c27a48',workflow:'.github/workflows/evidence-based-article-live-release.yml'});
export function recoveryDecision(active,failed,verified){
 assert.equal(active.versions?.length,1);assert.equal(active.versions[0].percentage,100);
 assert.equal(verified.id,recovery.verifiedRun);assert.equal(verified.head_sha,recovery.verifiedSource);assert.equal(verified.status,'completed');assert.equal(verified.conclusion,'success');assert.equal(verified.event,'push');assert.equal(verified.head_branch,'main');assert.equal(verified.path,'.github/workflows/cloudflare-production-promote.yml');
 const current=active.versions[0].version_id;
 if(current===recovery.verified)return 'retain';
 assert.equal(current,recovery.unverified,'Unknown runtime: recovery is not authorised');
 assert.equal(active.id,recovery.unverifiedDeployment,'Only the exact cancelled deployment may be recovered');
 assert.equal(failed.id,recovery.run);assert.equal(failed.head_sha,recovery.source);assert.equal(failed.run_attempt,1);assert.equal(failed.status,'completed');assert.equal(failed.conclusion,'cancelled','Only the evidenced cancelled release may be recovered');assert.equal(failed.event,'push');assert.equal(failed.head_branch,'main');assert.equal(failed.path,'.github/workflows/cloudflare-production-promote.yml');
 return 'restore';
}

// A later successful release can be retained using its exact owned-deployment
// receipt. This never grants restoration authority for an unknown runtime.
export function verifiedOwnedRuntime(active,run,job,receipt){
 const exactRecordedManualRelease=run?.id===recordedMedicinesWatchRuntime.run&&run?.head_sha===recordedMedicinesWatchRuntime.source;
 const expectedEvent=exactRecordedManualRelease?recordedMedicinesWatchRuntime.event:'push';
 if(run?.conclusion!=='success'||run?.status!=='completed'||run?.event!==expectedEvent||run?.head_branch!=='main'||run?.path!=='.github/workflows/cloudflare-production-promote.yml')return false;
 if(job?.name!=='promote'||job?.conclusion!=='success'||job?.run_id!==run.id)return false;
 if(!/^[a-f0-9]{40}$/.test(run.head_sha||'')||receipt?.kind!=='owned_runtime_deployment'||receipt?.source!==run.head_sha||String(receipt?.run)!==String(run.id))return false;
 if(active?.id!==receipt.deploymentId||active?.versions?.length!==1||active.versions[0].percentage!==100||receipt.versionId!==active.versions[0].version_id)return false;
 return /^[a-f0-9-]{36}$/.test(receipt.versionId)&&/^[a-f0-9-]{36}$/.test(receipt.deploymentId);
}

// The bounded evidence-article workflow also deploys the complete Worker. Its
// successful run is finite and exact, so recognise only that recorded runtime.
export function verifiedArticleRuntime(active,run,job){
 if(active?.versions?.length!==1||active.versions[0].percentage!==100||active.versions[0].version_id!==articleRuntime.version)return false;
 return run?.id===articleRuntime.run&&run?.head_sha===articleRuntime.source&&run?.status==='completed'&&run?.conclusion==='success'&&run?.event==='push'&&run?.head_branch==='main'&&run?.path===articleRuntime.workflow&&job?.name==='release'&&job?.conclusion==='success'&&job?.run_id===run.id;
}

// Carry the earlier same-job recovery proof forward without reverting its
// verified newer runtime to the historical fallback pointer.
export function verifiedStartingPoint(record,active){
 if(record?.restoredToolRuntimeProof){
  const r=record.restoredToolRuntimeProof;assert.deepEqual(r,toolRollbackProof());assertToolRollbackDeployment(active);
  assert.equal(record.decision,'retain');assert.equal(record.dataChanged,false);assert.equal(record.customerRecordsRead,0);assert.equal(record.ownedProof,null);
  assert.equal(record.run,restoredToolRuntime.run);assert.equal(record.from,r.version);assert.equal(record.to,r.version);assert.equal(record.verifiedRun,r.verifiedRun);
  return {source:r.verifiedSource,version:r.version,run:r.verifiedRun};
 }

 if(record?.restoredLaterRuntimeProof){
  const p=restoredLaterRuntime,r=record.restoredLaterRuntimeProof;
  assert.deepEqual(r,{...p,verifiedRun:laterUnattributedRuntimeRecovery.verifiedRun,verifiedSource:laterUnattributedRuntimeRecovery.verifiedSource,verifiedVersion:laterUnattributedRuntimeRecovery.verifiedVersion});
  assert.equal(record.decision,'retain');assert.equal(record.dataChanged,false);assert.equal(record.customerRecordsRead,0);assert.equal(record.ownedProof,null);
  assert.equal(record.run,p.run);assert.equal(record.from,r.verifiedVersion);assert.equal(record.to,r.verifiedVersion);assert.equal(record.verifiedRun,r.verifiedRun);
  assertRestoredLaterDeployment(active);
  return {source:r.verifiedSource,version:r.verifiedVersion,run:r.verifiedRun};
 }
 if(record?.ownerCapturedProof)return record.ownerCapturedProof.kind===SUPPORT_RUNTIME.kind?assertSupportStartingPoint(record,active):assertOwnerStartingPoint(record,active);
 assert(['retain','restore'].includes(record?.decision),'Recovery decision absent');
 assert.equal(record.dataChanged,false);
 if(record.technicalRecovery){
  const p=technicalRecovery;assert.equal(record.decision,'restore');assert.equal(record.run,p.run);assert.equal(record.from,p.version);assert.equal(record.to,p.verifiedVersion);assert.equal(record.verifiedRun,p.verifiedRun);assert.equal(record.customerRecordsRead,0);assert.equal(record.ownedProof,null);
  assert.deepEqual(record.technicalRecovery,{run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment});
  assert.equal(active?.versions?.length,1);assert.equal(active.versions[0].percentage,100);assert.equal(active.versions[0].version_id,p.verifiedVersion,'Runtime moved since exact cancelled SEO recovery');
  return{source:p.verifiedSource,version:p.verifiedVersion,run:p.verifiedRun};
 }
 if(record.unattributedRuntimeRecovery){
  const p=unattributedRuntimeRecovery;assert.equal(record.decision,'restore');assert.equal(record.run,p.run);assert.equal(record.from,p.version);assert.equal(record.to,p.verifiedVersion);assert.equal(record.verifiedRun,p.verifiedRun);assert.equal(record.customerRecordsRead,0);assert.equal(record.ownedProof,null);
  assert.deepEqual(record.unattributedRuntimeRecovery,{run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment,contentEtag:p.etag,moduleSha256:p.sha256});
  assert.equal(active?.versions?.length,1);assert.equal(active.versions[0].percentage,100);assert.equal(active.versions[0].version_id,p.verifiedVersion,'Runtime moved since exact unattributed-runtime recovery');
  return{source:p.verifiedSource,version:p.verifiedVersion,run:p.verifiedRun};
 }
 if(record.laterUnattributedRuntimeRecovery){
  const p=laterUnattributedRuntimeRecovery;assert.equal(record.decision,'restore');assert.equal(record.run,p.run);assert.equal(record.from,p.version);assert.equal(record.to,p.verifiedVersion);assert.equal(record.verifiedRun,p.verifiedRun);assert.equal(record.customerRecordsRead,0);assert.equal(record.ownedProof,null);
  assert.deepEqual(record.laterUnattributedRuntimeRecovery,{run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment,contentEtag:p.etag,moduleSha256:p.sha256});
  assert.equal(active?.versions?.length,1);assert.equal(active.versions[0].percentage,100);assert.equal(active.versions[0].version_id,p.verifiedVersion,'Runtime moved since exact later unattributed-runtime recovery');
  return{source:p.verifiedSource,version:p.verifiedVersion,run:p.verifiedRun};
 }
 assert.equal(record.run,recovery.run);
 assert.equal(active?.versions?.length,1);assert.equal(active.versions[0].percentage,100);
 assert.equal(active.versions[0].version_id,record.to,'Runtime moved since recovery verification');
 if(record.ownedProof){
  const p=record.ownedProof;assert.equal(record.decision,'retain');assert.equal(record.from,record.to);
  assert.equal(p.version,record.to);assert.equal(p.run,record.verifiedRun);
  assert.match(p.source,/^[a-f0-9]{40}$/);assert.match(p.version,/^[a-f0-9-]{36}$/);assert(Number.isSafeInteger(p.run)&&p.run>0);
  return{source:p.source,version:p.version,run:p.run};
 }
 assert.equal(record.to,recovery.verified);assert.equal(record.verifiedRun,recovery.verifiedRun);
 assert.equal(record.from,record.decision==='restore'?recovery.unverified:recovery.verified);
 return{source:recovery.verifiedSource,version:recovery.verified,run:recovery.verifiedRun};
}

// Search the promotion workflow directly. Unrelated successful workflows must
// never push the current owned runtime beyond a repository-wide page limit.
// This exact successful Watch deployment supersedes the preceding image runtime.
export const recordedImageRuntime=Object.freeze({run:37336998330,source:'9d2b9e146063d634ac7ce058258c00dd7d804d2c',version:'f81ab965-f6aa-4655-be7d-b29f4ac29d67'});
export const recordedSeoRuntime=Object.freeze({run:37592938543,source:'a5cca19e89abc04ac8ecb063fcafb4f66004f504',version:'d8f51d84-d973-40ad-9097-c112935d8cb8'});
// This exact successful Watch release is the current production baseline. Pin
// its run because the bounded recent-run search can legitimately omit it.
// The promote job and owned-deployment receipt are still fetched and verified
// independently before the runtime may be retained.
export const recordedMedicinesWatchRuntime=Object.freeze({run:37870273259,source:'8198d99b9f570087e63864e481278b8a2459bfdd',version:'48eb4d71-cb90-4132-bb16-4768132d61d5',deployment:'3515e037-1915-476a-9f6b-6b41bbf5e061',event:'workflow_dispatch'});
export async function recentSuccessfulPromotions(get,active){
 const pinned=active?.versions?.length===1&&active.versions[0].percentage===100
  ?[recordedImageRuntime,recordedSeoRuntime,recordedMedicinesWatchRuntime].find(p=>p.version===active.versions[0].version_id&&(!p.deployment||p.deployment===active.id)):null;
 const recorded=pinned?await get('/actions/runs/'+pinned.run):null;
 if(recorded){assert.equal(recorded.id,pinned.run);assert.equal(recorded.head_sha,pinned.source);assert.equal(recorded.conclusion,'success');assert.equal(recorded.status,'completed');assert.equal(recorded.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(recorded.event,pinned.event||'push');assert.equal(recorded.head_branch,'main');}
 const result=await get('/actions/workflows/cloudflare-production-promote.yml/runs?branch=main&event=push&status=success&per_page=100');
 return [...(recorded?[recorded]:[]),...(result.workflow_runs||[]).filter(run=>run.path==='.github/workflows/cloudflare-production-promote.yml'&&run.id!==recorded?.id).slice(0,5)];
}

// Only this cancelled SEO deployment may be restored. A cancelled run is never
// promoted to verified status; its captured predecessor must have succeeded.
export const technicalRecovery=Object.freeze({run:37512509413,job:112437645245,source:'36301f661e9a2e220c15e7f1ccf070612186242b',deployment:'ec4aeeed-9656-4bc0-8e9d-6d751d6fac77',version:'81f4a3a8-9b25-4bb5-bd0d-1e870cfc0206',verifiedRun:37510903784,verifiedJob:112431598699,verifiedSource:'ddde14b19d6ef79547e27afb4ed76bf1f4e39f05',verifiedDeployment:'3f64ff03-76c6-4aaf-bc66-f4c3865711d9',verifiedVersion:'35e9b183-12c6-4a22-a68b-1a9ee3c8cef4'});
const ownedFrom=logs=>String(logs).split('\n').flatMap(line=>{const at=line.indexOf('{"kind":"owned_runtime_deployment"');if(at<0)return[];try{return[JSON.parse(line.slice(at))]}catch{return[]}});
export function verifiedTechnicalCancelledRecovery(active,failed,job,failedLogs,verified,verifiedJob,verifiedLogs){
 const p=technicalRecovery;
 if(active?.id!==p.deployment||active.versions?.length!==1||active.versions[0].percentage!==100||active.versions[0].version_id!==p.version)return false;
 if(failed?.id!==p.run||failed.head_sha!==p.source||failed.run_attempt!==1||failed.status!=='completed'||failed.conclusion!=='cancelled'||failed.event!=='push'||failed.head_branch!=='main'||failed.path!=='.github/workflows/cloudflare-production-promote.yml')return false;
 if(job?.id!==p.job||job.run_id!==p.run||job.name!=='promote'||job.conclusion!=='cancelled'||job.status!=='completed')return false;
 for(const [number,name,conclusion] of [[60,'Deploy current main to production','success'],[86,'Prove exact member scripts and authentication on live traffic','cancelled'],[107,'Restore the captured runtime if a post-deployment gate failed','skipped']])if(!job.steps?.some(s=>s.number===number&&s.name===name&&s.conclusion===conclusion))return false;
 if(verified?.id!==p.verifiedRun||verified.head_sha!==p.verifiedSource||verified.run_attempt!==1||verifiedJob?.id!==p.verifiedJob)return false;
 const predecessor={id:p.verifiedDeployment,versions:[{version_id:p.verifiedVersion,percentage:100}]};
 const successful=ownedFrom(verifiedLogs).filter(o=>o.deploymentId===p.verifiedDeployment&&verifiedOwnedRuntime(predecessor,verified,verifiedJob,o));
 const cancelled=ownedFrom(failedLogs).filter(o=>o.source===p.source&&String(o.run)===String(p.run)&&o.deploymentId===p.deployment&&o.versionId===p.version&&o.previousDeploymentId===p.verifiedDeployment&&o.previousVersionId===p.verifiedVersion&&o.dataRestored===false);
 return successful.length===1&&cancelled.length===1;
}
export async function verifyTechnicalCancelledRuntime(active,get,getLogs){
 const p=technicalRecovery;
 const failed=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+'/jobs?filter=latest&per_page=100');
 const verified=await get('/actions/runs/'+p.verifiedRun),verifiedJobs=await get('/actions/runs/'+p.verifiedRun+'/jobs?filter=latest&per_page=100');
 const job=jobs.jobs?.find(j=>j.id===p.job),verifiedJob=verifiedJobs.jobs?.find(j=>j.id===p.verifiedJob);
 assert(verifiedTechnicalCancelledRecovery(active,failed,job,await getLogs(p.job),verified,verifiedJob,await getLogs(p.verifiedJob)),'Exact cancelled SEO runtime and successful captured predecessor evidence required');
 return{run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment};
}

// An independently observed local Worker upload replaced the last successful
// owned release without an owned-deployment receipt. Restore only this exact
// byte-for-byte runtime to the exact successful predecessor. The observation
// workflow was read-only and compared the serving module with four candidate
// main commits; it is evidence of the unknown runtime, never ownership of it.
export const unattributedRuntimeRecovery=Object.freeze({
 run:37902092425,job:113726783130,source:'a48535f1f7609ca8c5541e6e9f44f6c7171d3cd6',branch:'verification/tablet-runtime-capture-20261009',
 deployment:'c8f76e11-a35b-4c92-aff9-c4e961fee078',version:'5e823edb-c7b0-49a0-92b3-2ec9e88db1af',createdOn:'2026-10-09T07:51:41.933502Z',etag:'267d563e7f18fdf07e7ff0960e28b8dc93b86ea54914b4a27faa1336086e8ec2',module:'worker.js',bytes:13961108,sha256:'1c8c2461424f3479191e17fd6248ca0b382028a4f0abf5e1633a964c5f9609e8',
 verifiedRun:37895305149,verifiedJob:113705612697,verifiedSource:'793b5135ce7bcdb42d77597b238c769c32a7dc67',verifiedDeployment:'5777f172-381d-49b8-a750-046ad60eb676',verifiedVersion:'fd7939d8-6387-48fa-adc8-714e6f8bea8d'
});
const unattributedCandidates=Object.freeze([
 {source:'92a5b8d280b090e609b8f14ed5adf5393bc355f0',bytes:14038047,sha256:'b8f39440e5eb7861283ccbe36a3d7b6d4cc3d66c431db0618f925526516e0a37'},
 {source:'793b5135ce7bcdb42d77597b238c769c32a7dc67',bytes:14039164,sha256:'088fc19b89d39354078d878ca3f55252f743c3b97a97ce6e197a3e7f73eb0453'},
 {source:'3df83d33f1bc26e3119dfeba2cbc54b10cedafdb',bytes:14084893,sha256:'4338571040fd895a9eb7ed8b8576205f06bbc2134f08c2c674c07de6bf254be1'},
 {source:'0d68bce77505ef4fa77412929ff6d4d2dc0a65e7',bytes:14084878,sha256:'90fe8a2c7b97d7a829aabcf540e1a01f4feb3ea22ae7aff7b0191712625e12e8'}
]);
export function verifiedUnattributedRuntimeRecovery(active,version,providerVersion,modules,observed,observedJob,observedLogs,verified,verifiedJob,verifiedLogs){
 const p=unattributedRuntimeRecovery;
 if(active?.id!==p.deployment||active.versions?.length!==1||active.versions[0].percentage!==100||active.versions[0].version_id!==p.version)return false;
 if(version?.id!==p.version||version.metadata?.created_on!==p.createdOn||version.metadata?.source!=='wrangler')return false;
 if(version.annotations?.['workers/triggered_by']!=='version_upload'||version.annotations?.['workers/tag']||version.annotations?.['workers/message'])return false;
 if(providerVersion?.id!==p.version||providerVersion.metadata?.created_on!==p.createdOn||providerVersion.resources?.script?.etag!==p.etag)return false;
 if(JSON.stringify(modules)!==JSON.stringify([{module:p.module,bytes:p.bytes,sha256:p.sha256}]))return false;
 if(observed?.id!==p.run||observed.head_sha!==p.source||observed.run_attempt!==1||observed.status!=='completed'||observed.conclusion!=='success'||observed.event!=='push'||observed.head_branch!==p.branch||observed.path!=='.github/workflows/tablet-runtime-attribution.yml')return false;
 if(observedJob?.id!==p.job||observedJob.run_id!==p.run||observedJob.name!=='capture'||observedJob.status!=='completed'||observedJob.conclusion!=='success'||!observedJob.steps?.some(s=>s.number===5&&s.name==='Attribute active runtime without changing it'&&s.conclusion==='success'))return false;
 const observation={kind:'tablet_runtime_attribution',deployment:p.deployment,version:p.version,createdOn:p.createdOn,etag:p.etag,modules:[{module:p.module,bytes:p.bytes,sha256:p.sha256}]};
 if(typeof observedLogs!=='string'||!observedLogs.includes(JSON.stringify(observation))||!observedLogs.includes('PASS read-only runtime attribution; no deployment or data change'))return false;
 for(const c of unattributedCandidates)if(!observedLogs.includes(JSON.stringify({kind:'tablet_runtime_candidate',...c,matches:false})))return false;
 if(verified?.id!==p.verifiedRun||verified.head_sha!==p.verifiedSource||verified.run_attempt!==1)return false;
 if(verifiedJob?.id!==p.verifiedJob||verifiedJob.run_id!==p.verifiedRun||verifiedJob.name!=='promote'||verifiedJob.status!=='completed'||verifiedJob.conclusion!=='success')return false;
 for(const [number,name,conclusion] of [[60,'Deploy current main to production','success'],[89,'Prove Medicines Watch and its source checks on live traffic','success'],[108,'Restore the captured runtime if a post-deployment gate failed','skipped']])if(!verifiedJob.steps?.some(s=>s.number===number&&s.name===name&&s.conclusion===conclusion))return false;
 const predecessor={id:p.verifiedDeployment,versions:[{version_id:p.verifiedVersion,percentage:100}]};
 const receipts=ownedFrom(verifiedLogs).filter(o=>o.deploymentId===p.verifiedDeployment&&o.versionId===p.verifiedVersion&&o.previousDeploymentId==='df3c3764-7fd3-41c8-87ef-e82736af27b6'&&o.previousVersionId==='584de8a4-1c0c-416d-b3b6-9d44743dd58f'&&o.dataRestored===false&&verifiedOwnedRuntime(predecessor,verified,verifiedJob,o));
 return receipts.length===1;
}
export async function verifyUnattributedRuntime(active,version,providerVersion,modules,get,getLogs){
 const p=unattributedRuntimeRecovery;
 const observed=await get('/actions/runs/'+p.run),observedJobs=await get('/actions/runs/'+p.run+'/jobs?filter=latest&per_page=100');
 const verified=await get('/actions/runs/'+p.verifiedRun),verifiedJobs=await get('/actions/runs/'+p.verifiedRun+'/jobs?filter=latest&per_page=100');
 const observedJob=observedJobs.jobs?.find(j=>j.id===p.job),verifiedJob=verifiedJobs.jobs?.find(j=>j.id===p.verifiedJob);
 assert(verifiedUnattributedRuntimeRecovery(active,version,providerVersion,modules,observed,observedJob,await getLogs(p.job),verified,verifiedJob,await getLogs(p.verifiedJob)),'Exact unattributed runtime, read-only attribution and successful predecessor evidence required');
 return{run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment,contentEtag:p.etag,moduleSha256:p.sha256};
}

// A second local version upload superseded the first unattributed runtime while
// its finite recovery was under review. It also lacks an owned deployment
// receipt and matches none of the reviewed candidate bundles. This separate
// receipt authorises restoration only from its exact deployment, version and
// module hash to the same last successful owned production version.
export const laterUnattributedRuntimeRecovery=Object.freeze({
 run:37908130882,job:113746468183,source:'2c7725de55c9720df9b84d82d906ea9f3578569b',branch:'verification/tablet-runtime-capture-20261009',
 deployment:'20ea6330-06d4-4901-a246-e6b8d795754f',version:'94ff9122-2828-455b-8609-eb308cd2e3b0',createdOn:'2026-10-09T08:18:39.149861Z',etag:'1a916e249be6a646f620f037bb4e8604adb20a5fe5188fa7d164c55c59e5274f',message:'Exact approved tablet wording; retain byte-proved serving source and customer data',module:'worker.js',bytes:13971681,sha256:'7bc41301b96e31a8b2d6c51bc7b2ee5e8ee4af3e27ee145a65033e01031e8ada',
 verifiedRun:37895305149,verifiedJob:113705612697,verifiedSource:'793b5135ce7bcdb42d77597b238c769c32a7dc67',verifiedDeployment:'5777f172-381d-49b8-a750-046ad60eb676',verifiedVersion:'fd7939d8-6387-48fa-adc8-714e6f8bea8d'
});
const laterUnattributedCandidates=Object.freeze([
 {source:'92a5b8d280b090e609b8f14ed5adf5393bc355f0',bytes:14038047,sha256:'b8f39440e5eb7861283ccbe36a3d7b6d4cc3d66c431db0618f925526516e0a37'},
 {source:'793b5135ce7bcdb42d77597b238c769c32a7dc67',bytes:14039164,sha256:'088fc19b89d39354078d878ca3f55252f743c3b97a97ce6e197a3e7f73eb0453'},
 {source:'3df83d33f1bc26e3119dfeba2cbc54b10cedafdb',bytes:14084893,sha256:'4338571040fd895a9eb7ed8b8576205f06bbc2134f08c2c674c07de6bf254be1'},
 {source:'0d68bce77505ef4fa77412929ff6d4d2dc0a65e7',bytes:14084878,sha256:'90fe8a2c7b97d7a829aabcf540e1a01f4feb3ea22ae7aff7b0191712625e12e8'},
 {source:'59ddd4353fd337631478c3a2704017e1556cf987',bytes:14084878,sha256:'90fe8a2c7b97d7a829aabcf540e1a01f4feb3ea22ae7aff7b0191712625e12e8'}
]);
export function verifiedLaterUnattributedRuntimeRecovery(active,version,providerVersion,modules,observed,observedJob,observedLogs,verified,verifiedJob,verifiedLogs){
 const p=laterUnattributedRuntimeRecovery;
 if(active?.id!==p.deployment||active.versions?.length!==1||active.versions[0].percentage!==100||active.versions[0].version_id!==p.version)return false;
 if(version?.id!==p.version||version.metadata?.created_on!==p.createdOn||version.metadata?.source!=='wrangler')return false;
 if(version.annotations?.['workers/triggered_by']!=='version_upload'||version.annotations?.['workers/tag']||version.annotations?.['workers/message']!==p.message)return false;
 if(providerVersion?.id!==p.version||providerVersion.metadata?.created_on!==p.createdOn||providerVersion.resources?.script?.etag!==p.etag)return false;
 if(JSON.stringify(modules)!==JSON.stringify([{module:p.module,bytes:p.bytes,sha256:p.sha256}]))return false;
 if(observed?.id!==p.run||observed.head_sha!==p.source||observed.run_attempt!==1||observed.status!=='completed'||observed.conclusion!=='success'||observed.event!=='push'||observed.head_branch!==p.branch||observed.path!=='.github/workflows/tablet-runtime-attribution.yml')return false;
 if(observedJob?.id!==p.job||observedJob.run_id!==p.run||observedJob.name!=='capture'||observedJob.status!=='completed'||observedJob.conclusion!=='success'||!observedJob.steps?.some(s=>s.number===5&&s.name==='Attribute active runtime without changing it'&&s.conclusion==='success'))return false;
 const observation={kind:'tablet_runtime_attribution',deployment:p.deployment,version:p.version,createdOn:p.createdOn,etag:p.etag,modules:[{module:p.module,bytes:p.bytes,sha256:p.sha256}]};
 if(typeof observedLogs!=='string'||!observedLogs.includes(JSON.stringify(observation))||!observedLogs.includes('PASS read-only runtime attribution; no deployment or data change'))return false;
 for(const c of laterUnattributedCandidates)if(!observedLogs.includes(JSON.stringify({kind:'tablet_runtime_candidate',...c,matches:false})))return false;
 if(verified?.id!==p.verifiedRun||verified.head_sha!==p.verifiedSource||verified.run_attempt!==1)return false;
 if(verifiedJob?.id!==p.verifiedJob||verifiedJob.run_id!==p.verifiedRun||verifiedJob.name!=='promote'||verifiedJob.status!=='completed'||verifiedJob.conclusion!=='success')return false;
 for(const [number,name,conclusion] of [[60,'Deploy current main to production','success'],[89,'Prove Medicines Watch and its source checks on live traffic','success'],[108,'Restore the captured runtime if a post-deployment gate failed','skipped']])if(!verifiedJob.steps?.some(s=>s.number===number&&s.name===name&&s.conclusion===conclusion))return false;
 const predecessor={id:p.verifiedDeployment,versions:[{version_id:p.verifiedVersion,percentage:100}]};
 const receipts=ownedFrom(verifiedLogs).filter(o=>o.deploymentId===p.verifiedDeployment&&o.versionId===p.verifiedVersion&&o.previousDeploymentId==='df3c3764-7fd3-41c8-87ef-e82736af27b6'&&o.previousVersionId==='584de8a4-1c0c-416d-b3b6-9d44743dd58f'&&o.dataRestored===false&&verifiedOwnedRuntime(predecessor,verified,verifiedJob,o));
 return receipts.length===1;
}
export async function verifyLaterUnattributedRuntime(active,version,providerVersion,modules,get,getLogs){
 const p=laterUnattributedRuntimeRecovery;
 const observed=await get('/actions/runs/'+p.run),observedJobs=await get('/actions/runs/'+p.run+'/jobs?filter=latest&per_page=100');
 const verified=await get('/actions/runs/'+p.verifiedRun),verifiedJobs=await get('/actions/runs/'+p.verifiedRun+'/jobs?filter=latest&per_page=100');
 const observedJob=observedJobs.jobs?.find(j=>j.id===p.job),verifiedJob=verifiedJobs.jobs?.find(j=>j.id===p.verifiedJob);
 assert(verifiedLaterUnattributedRuntimeRecovery(active,version,providerVersion,modules,observed,observedJob,await getLogs(p.job),verified,verifiedJob,await getLogs(p.verifiedJob)),'Exact later unattributed runtime, read-only attribution and successful predecessor evidence required');
 return{run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment,contentEtag:p.etag,moduleSha256:p.sha256};
}

// Retain this exact restoration only. The failed recovery job is never treated
// as a successful release, and this grants no upload or rollback authority.
export const restoredLaterRuntime=Object.freeze({run:37914338433,job:113766865055,source:'5a5d7c997db4b2874f25fbb445c9033d86d2a515',deployment:'19c317f4-0058-4497-86a8-596db6de90a9',createdOn:'2026-10-09T09:58:06.04406Z'});
function assertRestoredLaterDeployment(active){
 const p=restoredLaterRuntime;
 assert.equal(active?.id,p.deployment);assert.equal(active.source,'wrangler');assert.equal(active.created_on,p.createdOn);
 assert.deepEqual(active.versions,[{version_id:laterUnattributedRuntimeRecovery.verifiedVersion,percentage:100}]);
 assert.equal(active.annotations?.['workers/message'],'Restore exact successful predecessor of unattributed runtime observed by read-only run 37908130882; no data rollback');
 assert.equal(active.annotations?.['workers/triggered_by'],'deployment');
}
export function verifiedRestoredLaterRuntime(active,version,run,job,logs,verified,verifiedJob,verifiedLogs){
 const p=restoredLaterRuntime,q=laterUnattributedRuntimeRecovery;
 try{assertRestoredLaterDeployment(active)}catch{return false}
 if(version?.id!==q.verifiedVersion||version.metadata?.created_on!=='2026-10-09T07:07:16.10051Z'||version.metadata?.source!=='wrangler'||version.annotations?.['workers/triggered_by']!=='version_upload'||version.annotations?.['workers/tag']||version.annotations?.['workers/message'])return false;
 if(run?.id!==p.run||run.head_sha!==p.source||run.run_attempt!==1||run.status!=='completed'||run.conclusion!=='failure'||run.event!=='push'||run.head_branch!=='main'||run.path!=='.github/workflows/cloudflare-production-promote.yml')return false;
 if(job?.id!==p.job||job.run_id!==p.run||job.name!=='promote'||job.status!=='completed'||job.conclusion!=='failure')return false;
 for(const [number,name,conclusion] of [[10,'Recover only the evidenced cancelled runtime to the last verified release','success'],[15,'Verify acquisition consent and same-account activation join','failure'],[62,'Deploy current main to production','skipped']])if(!job.steps?.some(s=>s.number===number&&s.name===name&&s.conclusion===conclusion))return false;
 const observation={kind:'runtime_recovery_observation',deploymentId:q.deployment,activeVersion:q.version,release:p.source,version:{kind:'runtime_recovery_version_observation',id:q.version,createdOn:q.createdOn,source:'wrangler',triggeredBy:'version_upload',tag:null,message:q.message}};
 if(typeof logs!=='string'||!logs.includes(JSON.stringify(observation))||!logs.includes('Current Version ID: '+q.verifiedVersion)||!logs.includes('PASS exact cancelled-release recovery: restore verified runtime; no data rollback'))return false;
 if(ownedFrom(logs).length!==0)return false;
 if(verified?.id!==q.verifiedRun||verified.head_sha!==q.verifiedSource||verified.run_attempt!==1||verifiedJob?.id!==q.verifiedJob||verifiedJob.status!=='completed')return false;
 const predecessor={id:q.verifiedDeployment,versions:[{version_id:q.verifiedVersion,percentage:100}]};
 return ownedFrom(verifiedLogs).filter(r=>r.dataRestored===false&&verifiedOwnedRuntime(predecessor,verified,verifiedJob,r)).length===1;
}
export async function verifyRestoredLaterRuntime(active,version,get,getLogs){
 const p=restoredLaterRuntime,q=laterUnattributedRuntimeRecovery;
 const run=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+'/jobs?filter=latest&per_page=100');
 const verified=await get('/actions/runs/'+q.verifiedRun),verifiedJobs=await get('/actions/runs/'+q.verifiedRun+'/jobs?filter=latest&per_page=100');
 assert(verifiedRestoredLaterRuntime(active,version,run,jobs.jobs?.find(j=>j.id===p.job),await getLogs(p.job),verified,verifiedJobs.jobs?.find(j=>j.id===q.verifiedJob),await getLogs(q.verifiedJob)),'Exact restoration and original successful owned release evidence required');
 return {...p,verifiedRun:q.verifiedRun,verifiedSource:q.verifiedSource,verifiedVersion:q.verifiedVersion};
}

// Retain only this exact owner-authorised local tablet release. Hosted source
// proofs alone are never treated as deployment evidence.
export const tabletRuntime=Object.freeze({run:37531933891,job:112503200497,source:'25ead1b54126e5596db11845efbcf3b888fc5a31',version:'2dd57a8f-8597-4f5c-ab5b-86d6e037a8f7',deployment:'b6fa58e8-4953-46ca-8983-06dff8a53fd2',previousRun:37525779266,previousSource:'4460ea56f931da4003ace68d5d404831c47e08f7',previousVersion:'33da329f-98ae-46ce-8090-150ad06b7ea9',previousDeployment:'f07a6f14-c7e7-497f-b7e5-23b6540ca42c',reviewRun:37531509514,reviewJob:112501762193,reviewSource:'a9707c463f7681d49068fa0319418e5630510ba9'});
export const TABLET_RUNTIME_RECEIPT='docs/seo/tablet-runtime-receipt-20261006.json';
const TABLET_RECEIPT_SHA256='8b0f7c50b619abeaa284d70e76de58e66ef95523ff654e06ea9baabb7e611b2d';
export async function verifyTabletRuntime(active,version,text,get,getLogs){
 const p=tabletRuntime;
 assert.equal(createHash('sha256').update(text).digest('hex'),TABLET_RECEIPT_SHA256,'Exact recorded tablet deployment and live receipt required');
 const receipt=JSON.parse(text),d=receipt.deployment,l=receipt.liveProof;
 assert.equal(receipt.kind,'owner_authorised_isolated_tablet_runtime');
 assert.deepEqual(d,{at:'2026-10-06T21:11:33.552Z',source:p.source,isolatedBase:p.previousSource,hostedProof:p.reviewRun,previousDeployment:p.previousDeployment,previousVersion:p.previousVersion,deployment:p.deployment,version:p.version,databaseWrites:false,clinicalReview:false});
 assert.equal(receipt.independentClinicalAcceptance,false);
 if(active?.id===tabletRollback.deployment){
  const failed=await get('/actions/runs/'+tabletRollback.run),failedJobs=await get('/actions/runs/'+tabletRollback.run+'/jobs?filter=latest&per_page=100');
  assert(verifiedTabletRollback(active,failed,failedJobs.jobs?.find(j=>j.id===tabletRollback.job),await getLogs(tabletRollback.job)),'Exact failed release and restoration evidence required');
 }else{
  assert.equal(active?.id,p.deployment);assert.equal(active.source,'wrangler');assert.equal(active.created_on,'2026-10-06T21:11:22.219924Z');
 }
 assert.deepEqual(active.versions,[{version_id:p.version,percentage:100}]);
 assert.equal(version?.id,p.version);assert.equal(version.metadata?.created_on,'2026-10-06T21:11:18.582505Z');assert.equal(version.metadata?.source,'wrangler');
 assert.equal(version.annotations?.['workers/message'],'Tablet guidance source '+p.source+'; hosted proof '+p.reviewRun);
 assert.equal(version.annotations?.['workers/triggered_by'],'version_upload');
 assert.equal(l.mode,'live');assert.equal(l.pass,true);assert.deepEqual(l.failures,[]);assert.equal(l.pages.length,8);assert.equal(l.links.length,12);assert.equal(l.protected.length,8);
 assert(l.links.every(x=>x.status===200));assert(l.protected.every(x=>x.unchanged===true));assert.equal(l.checkedAt,'2026-10-06T21:11:45.412Z');
 assert.equal(l.protected.find(x=>x.path==='/')?.sha256,'a6aa39f2d44093d8174967b3d7b335ffa3da2ebf5dbff9c1ddb6cd378695e369');
 assert.equal(l.protected.find(x=>x.path==='/start-here')?.sha256,'4ed4845f845239307ec66120c571d17a0c4fd348f7bb51d02fcd81d5f46fd6ab');
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 for(const ref of [p.previousSource,p.reviewSource,p.source])git('merge-base','--is-ancestor',ref,'HEAD');
 assert.equal(git('diff','--name-only',p.reviewSource,p.source),'shift-coach/release-manifest.json');
 assert.equal(git('rev-parse',p.source+':wrangler.jsonc'),git('rev-parse',p.previousSource+':wrangler.jsonc'));
 for(const [runId,jobId,source] of [[p.run,p.job,p.source],[p.reviewRun,p.reviewJob,p.reviewSource]]){
  const run=await get('/actions/runs/'+runId),jobs=await get('/actions/runs/'+runId+'/jobs?filter=latest&per_page=100'),job=jobs.jobs?.find(x=>x.id===jobId);
  assert.equal(run.id,runId);assert.equal(run.head_sha,source);assert.equal(run.path,'.github/workflows/practical-guides-proof.yml');assert.equal(run.head_branch,'codex/tablet-guidance-20261006');assert.equal(run.status,'completed');assert.equal(run.conclusion,'success');
  assert.equal(job?.run_id,runId);assert.equal(job?.name,'verify');assert.equal(job?.status,'completed');assert.equal(job?.conclusion,'success');
 }
 const previous=await get('/actions/runs/'+p.previousRun),jobs=await get('/actions/runs/'+p.previousRun+'/jobs?filter=latest&per_page=100');
 assert.equal(previous.head_sha,p.previousSource);
 const predecessor={id:p.previousDeployment,versions:[{version_id:p.previousVersion,percentage:100}]};
 const evidence=[];
 for(const job of (jobs.jobs||[]).filter(j=>j.name==='promote'&&j.conclusion==='success')){
  for(const o of ownedFrom(await getLogs(job.id)))if(o.deploymentId===p.previousDeployment&&o.dataRestored===false&&verifiedOwnedRuntime(predecessor,previous,job,o))evidence.push(o);
 }
 assert.equal(evidence.length,1,'Exact successful tablet predecessor deployment required');
 return{run:p.run,source:p.source,version:p.version,deployment:active.id,evidenceKind:'exact-hosted-source-proofs-plus-recorded-local-deployment-and-live-receipt'};
}

// Exact restoration observed in the signed deployment API and artifact
// 11447910447 (SHA256 4725c10d8eb322c3f72fe40a97fc470bf9d576366c3cc14012add9e5b6dcd54a).
// A failed run is evidence of restoration only, never a successful release.
export const tabletRollback=Object.freeze({run:37536864936,job:112520112417,source:'23a737dbaa76a9619bea8b5c235e7c3e581c7c04',deployment:'00a7550b-4805-490b-a19f-1eef2435ded4',createdOn:'2026-10-06T22:03:11.002439Z'});
export function verifiedTabletRollback(active,run,job,logs){
 const p=tabletRollback,t=tabletRuntime;
 const owned={kind:'owned_runtime_deployment',at:'2026-10-06T22:00:56.998Z',source:p.source,run:String(p.run),deploymentId:'8d9879e1-d7ff-4daf-92d0-7aff65bb417a',versionId:'6ac4410b-288a-470b-bc80-3537cab41ea6',previousDeploymentId:t.deployment,previousVersionId:t.version,dataRestored:false};
 if(active?.id!==p.deployment||active.source!=='wrangler'||active.created_on!==p.createdOn||active.versions?.length!==1||active.versions[0].version_id!==t.version||active.versions[0].percentage!==100)return false;
 if(active.annotations?.['workers/message']!=='Owned release failed post-deployment checks; restore captured runtime and preserve current data')return false;
 if(run?.id!==p.run||run.head_sha!==p.source||run.run_attempt!==1||run.status!=='completed'||run.conclusion!=='failure'||run.event!=='push'||run.head_branch!=='main'||run.path!=='.github/workflows/cloudflare-production-promote.yml')return false;
 if(job?.id!==p.job||job.run_id!==p.run||job.name!=='promote'||job.status!=='completed'||job.conclusion!=='failure')return false;
 for(const [number,name,conclusion] of [[60,'Deploy current main to production','success'],[74,'Verify the reconciled oral semaglutide guide','failure'],[107,'Restore the captured runtime if a post-deployment gate failed','success']])if(!job.steps?.some(s=>s.number===number&&s.name===name&&s.conclusion===conclusion))return false;
 return ownedFrom(logs).filter(o=>JSON.stringify(o)===JSON.stringify(owned)).length===1
  &&String(logs).includes('catalogue_stale_main_rejected')
  &&String(logs).includes('Worker Version '+t.version+' has been deployed to 100% of traffic.');
}

// One exact rollback by the guarded tool release. Retention only, never a
// successful-release claim for that failed run or authority to restore another version.
export const restoredToolRuntime=Object.freeze({run:37919061119,job:113783602718,source:'f2836dc942ef1fcee0d49a686b117bd687be3531',deployment:'55dd384e-226a-4f19-b989-322dcdee7888',createdOn:'2026-10-09T11:05:31.78167Z',failedDeployment:'06d47989-47c8-4064-9eb7-865acad0151d',failedVersion:'9ed844dd-918d-4c6f-8da9-2b97047253e9'});
const toolRollbackProof=()=>({...restoredToolRuntime,priorRestoration:restoredLaterRuntime.deployment,version:laterUnattributedRuntimeRecovery.verifiedVersion,verifiedRun:laterUnattributedRuntimeRecovery.verifiedRun,verifiedSource:laterUnattributedRuntimeRecovery.verifiedSource});
function assertToolRollbackDeployment(active){
 const p=restoredToolRuntime;assert.equal(active?.id,p.deployment);assert.equal(active.source,'wrangler');assert.equal(active.created_on,p.createdOn);
 assert.deepEqual(active.versions,[{version_id:laterUnattributedRuntimeRecovery.verifiedVersion,percentage:100}]);
 assert.equal(active.annotations?.['workers/triggered_by'],'deployment');assert.equal(active.annotations?.['workers/message'],'Owned release failed post-deployment checks; restore captured runtime and preserve current data');
}
export function verifiedToolRollback(active,version,run,job,logs,priorProof){
 const p=restoredToolRuntime,q=laterUnattributedRuntimeRecovery;
 try{assertToolRollbackDeployment(active);assert.deepEqual(priorProof,{...restoredLaterRuntime,verifiedRun:q.verifiedRun,verifiedSource:q.verifiedSource,verifiedVersion:q.verifiedVersion})}catch{return false}
 if(version?.id!==q.verifiedVersion||version.metadata?.created_on!=='2026-10-09T07:07:16.10051Z'||version.metadata?.source!=='wrangler'||version.annotations?.['workers/triggered_by']!=='version_upload'||version.annotations?.['workers/tag']||version.annotations?.['workers/message'])return false;
 if(run?.id!==p.run||run.head_sha!==p.source||run.run_attempt!==1||run.status!=='completed'||run.conclusion!=='failure'||run.event!=='push'||run.head_branch!=='main'||run.path!=='.github/workflows/cloudflare-production-promote.yml')return false;
 if(job?.id!==p.job||job.run_id!==p.run||job.name!=='promote'||job.status!=='completed'||job.conclusion!=='failure')return false;
 for(const [number,name,conclusion]of [[63,'Deploy current main to production','success'],[68,'Verify calculator journeys and specific tool guidance live','failure'],[84,'Verify live My Treatment delivery and private APIs','skipped'],[114,'Restore the captured runtime if a post-deployment gate failed','success'],[115,'Verify nine public tool pages after owned rollback','success']])if(!job.steps?.some(s=>s.number===number&&s.name===name&&s.conclusion===conclusion))return false;
 const owned={kind:'owned_runtime_deployment',at:'2026-10-09T11:04:09.351Z',source:p.source,run:String(p.run),deploymentId:p.failedDeployment,versionId:p.failedVersion,previousDeploymentId:restoredLaterRuntime.deployment,previousVersionId:q.verifiedVersion,dataRestored:false};
 try{assert.deepEqual(ownedFrom(logs),[owned])}catch{return false}
 if(!String(logs).includes('Current Version ID: '+q.verifiedVersion))return false;
 const reports=String(logs).split('\n').flatMap(line=>{const at=line.indexOf('{"kind":"guarded_release_verification"');if(at<0)return [];try{return [JSON.parse(line.slice(at))]}catch{return []}});
 if(reports.length!==2)return false;
 return reports.every(r=>r.source===p.source&&String(r.run)===String(p.run)&&r.workflowStatus==='failure'&&r.releaseVerified===false&&r.status==='failed'&&r.deployedVersion===p.failedVersion&&r.deployChecks?.deployed?.deploymentId===p.failedDeployment&&r.deployChecks.deployed.versionId===p.failedVersion&&r.rollbackChecks?.source===p.source&&String(r.rollbackChecks.run)===String(p.run)&&r.rollbackChecks.stage==='rollback'&&r.rollbackChecks.status==='passed'&&r.rollbackChecks.toolChecksVerified===true&&r.rollbackChecks.expected?.deploymentId===restoredLaterRuntime.deployment&&r.rollbackChecks.expected.versionId===q.verifiedVersion&&r.rollbackChecks.expected.checkSource===p.source&&r.rollbackChecks.deployed?.deploymentId===p.deployment&&r.rollbackChecks.deployed.versionId===q.verifiedVersion&&r.rollbackChecks.deployed.percentage===100&&r.rollbackChecks.afterChecks?.deploymentId===p.deployment&&r.rollbackChecks.afterChecks.versionId===q.verifiedVersion&&r.rollbackChecks.afterChecks.percentage===100);
}
export async function verifyToolRollback(active,version,get,getLogs){
 const p=restoredToolRuntime;
 const prior={id:restoredLaterRuntime.deployment,source:'wrangler',created_on:restoredLaterRuntime.createdOn,versions:[{version_id:laterUnattributedRuntimeRecovery.verifiedVersion,percentage:100}],annotations:{'workers/message':'Restore exact successful predecessor of unattributed runtime observed by read-only run 37908130882; no data rollback','workers/triggered_by':'deployment'}};
 const priorProof=await verifyRestoredLaterRuntime(prior,version,get,getLogs);
 const run=await get('/actions/runs/'+p.run),jobs=await get('/actions/runs/'+p.run+'/jobs?filter=latest&per_page=100');
 assert(verifiedToolRollback(active,version,run,jobs.jobs?.find(j=>j.id===p.job),await getLogs(p.job),priorProof),'Exact failed tool release, owned rollback and original successful predecessor evidence required');
 return toolRollbackProof();
}
