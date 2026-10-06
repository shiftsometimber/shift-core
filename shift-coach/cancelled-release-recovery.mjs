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
 if(run?.conclusion!=='success'||run?.status!=='completed'||run?.event!=='push'||run?.head_branch!=='main'||run?.path!=='.github/workflows/cloudflare-production-promote.yml')return false;
 if(job?.name!=='promote'||job?.conclusion!=='success'||job?.run_id!==run.id)return false;
 if(!/^[a-f0-9]{40}$/.test(run.head_sha||'')||receipt?.kind!=='owned_runtime_deployment'||receipt?.source!==run.head_sha||String(receipt?.run)!==String(run.id))return false;
 if(active?.versions?.length!==1||active.versions[0].percentage!==100||receipt.versionId!==active.versions[0].version_id)return false;
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
 assert(['retain','restore'].includes(record?.decision),'Recovery decision absent');
 assert.equal(record.dataChanged,false);
 if(record.technicalRecovery){
  const p=technicalRecovery;assert.equal(record.decision,'restore');assert.equal(record.run,p.run);assert.equal(record.from,p.version);assert.equal(record.to,p.verifiedVersion);assert.equal(record.verifiedRun,p.verifiedRun);assert.equal(record.customerRecordsRead,0);assert.equal(record.ownedProof,null);
  assert.deepEqual(record.technicalRecovery,{run:p.run,source:p.source,version:p.version,deployment:p.deployment,verifiedRun:p.verifiedRun,verifiedSource:p.verifiedSource,verifiedVersion:p.verifiedVersion,verifiedDeployment:p.verifiedDeployment});
  assert.equal(active?.versions?.length,1);assert.equal(active.versions[0].percentage,100);assert.equal(active.versions[0].version_id,p.verifiedVersion,'Runtime moved since exact cancelled SEO recovery');
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
export async function recentSuccessfulPromotions(get,active){
 const recorded=active?.versions?.length===1&&active.versions[0].percentage===100&&active.versions[0].version_id===recordedImageRuntime.version
  ?await get('/actions/runs/'+recordedImageRuntime.run):null;
 if(recorded){assert.equal(recorded.id,recordedImageRuntime.run);assert.equal(recorded.head_sha,recordedImageRuntime.source);assert.equal(recorded.conclusion,'success');assert.equal(recorded.status,'completed');assert.equal(recorded.path,'.github/workflows/cloudflare-production-promote.yml');assert.equal(recorded.event,'push');assert.equal(recorded.head_branch,'main');}
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

// Retain only this exact owner-authorised local tablet release. Hosted source
// proofs alone are never treated as deployment evidence.
export const tabletRuntime=Object.freeze({run:37531933891,job:112503200497,source:'25ead1b54126e5596db11845efbcf3b888fc5a31',version:'2dd57a8f-8597-4f5c-ab5b-86d6e037a8f7',deployment:'b6fa58e8-4953-46ca-8983-06dff8a53fd2',previousRun:37525779266,previousSource:'4460ea56f931da4003ace68d5d404831c47e08f7',previousVersion:'33da329f-98ae-46ce-8090-150ad06b7ea9',previousDeployment:'f07a6f14-c7e7-497f-b7e5-23b6540ca42c',reviewRun:37531509514,reviewJob:112501762193,reviewSource:'a9707c463f7681d49068fa0319418e5630510ba9'});

export const tabletOwnedRollback=Object.freeze({run:37536864936,job:112520112417,source:'23a737dbaa76a9619bea8b5c235e7c3e581c7c04',failedDeployment:'8d9879e1-d7ff-4daf-92d0-7aff65bb417a',failedVersion:'6ac4410b-288a-470b-bc80-3537cab41ea6',deployment:'00a7550b-4805-490b-a19f-1eef2435ded4',artifact:11447910447,digest:'sha256:4725c10d8eb322c3f72fe40a97fc470bf9d576366c3cc14012add9e5b6dcd54a'});
// This failed promotion restored its captured, independently verified tablet
// version. The failed candidate itself never becomes an approved runtime.
export function verifiedTabletOwnedRollback(active,run,job,logs,artifact){
 const p=tabletOwnedRollback,t=tabletRuntime;
 if(active?.id!==p.deployment||JSON.stringify(active.versions)!==JSON.stringify([{version_id:t.version,percentage:100}]))return false;
 if(run?.id!==p.run||run.head_sha!==p.source||run.run_attempt!==1||run.status!=='completed'||run.conclusion!=='failure'||run.event!=='push'||run.head_branch!=='main'||run.path!=='.github/workflows/cloudflare-production-promote.yml')return false;
 if(job?.id!==p.job||job.run_id!==p.run||job.name!=='promote'||job.status!=='completed'||job.conclusion!=='failure')return false;
 for(const [number,name] of [[50,'Capture current Worker deployment for rollback'],[60,'Deploy current main to production'],[107,'Restore the captured runtime if a post-deployment gate failed']])if(!job.steps?.some(s=>s.number===number&&s.name===name&&s.conclusion==='success'))return false;
 const owned=ownedFrom(logs);
 if(owned.length!==1)return false;
 const o=owned[0];if(o.source!==p.source||String(o.run)!==String(p.run)||o.deploymentId!==p.failedDeployment||o.versionId!==p.failedVersion||o.previousDeploymentId!==t.deployment||o.previousVersionId!==t.version||o.dataRestored!==false)return false;
 if(!String(logs).includes('SUCCESS  Worker Version '+t.version+' has been deployed to 100% of traffic.'))return false;
 return artifact?.id===p.artifact&&artifact.name==='b1-runtime-release-'+p.run&&artifact.digest===p.digest&&artifact.size_in_bytes===4291476&&artifact.workflow_run?.id===p.run&&artifact.workflow_run.head_sha===p.source&&artifact.workflow_run.head_branch==='main';
}

export const TABLET_RUNTIME_RECEIPT='docs/seo/tablet-runtime-receipt-20261006.json';
const TABLET_RECEIPT_SHA256='8b0f7c50b619abeaa284d70e76de58e66ef95523ff654e06ea9baabb7e611b2d';
export async function verifyTabletRuntime(active,version,text,get,getLogs){
 const p=tabletRuntime;
 assert.equal(createHash('sha256').update(text).digest('hex'),TABLET_RECEIPT_SHA256,'Exact recorded tablet deployment and live receipt required');
 const receipt=JSON.parse(text),d=receipt.deployment,l=receipt.liveProof;
 assert.equal(receipt.kind,'owner_authorised_isolated_tablet_runtime');
 assert.deepEqual(d,{at:'2026-10-06T21:11:33.552Z',source:p.source,isolatedBase:p.previousSource,hostedProof:p.reviewRun,previousDeployment:p.previousDeployment,previousVersion:p.previousVersion,deployment:p.deployment,version:p.version,databaseWrites:false,clinicalReview:false});
 assert.equal(receipt.independentClinicalAcceptance,false);
 if(active?.id===tabletOwnedRollback.deployment){
  const r=tabletOwnedRollback,run=await get('/actions/runs/'+r.run),jobs=await get('/actions/runs/'+r.run+'/jobs?filter=latest&per_page=100'),artifacts=await get('/actions/runs/'+r.run+'/artifacts?per_page=100');
  assert(verifiedTabletOwnedRollback(active,run,jobs.jobs?.find(j=>j.id===r.job),await getLogs(r.job),artifacts.artifacts?.find(a=>a.id===r.artifact)),'Exact owned tablet rollback and immutable captured runtime artifact required');
 }else{assert.equal(active?.id,p.deployment);assert.equal(active.source,'wrangler');assert.equal(active.created_on,'2026-10-06T21:11:22.219924Z');}
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
