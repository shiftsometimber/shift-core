import assert from 'node:assert/strict';
// Finite owner-authorised local release: hosted proof is NOT a deployment.
// Its separately recorded live receipt and exact active deployment are required.
export const catalogueRuntime=Object.freeze({run:37453081278,job:112234026421,source:'91b625b0e1e272cdc2e767fa4f4b9fdd06186854',version:'d5b99766-5d14-4002-bd96-18a512d41c19',deployment:'585674f7-ad7d-4cca-a6fc-64ab74da7244'});
export function verifiedCatalogueRuntime(active,run,job,receipt){
 const p=catalogueRuntime;
 return active?.id===p.deployment&&active?.versions?.length===1&&active.versions[0].percentage===100&&active.versions[0].version_id===p.version
  &&run?.id===p.run&&run.head_sha===p.source&&run.status==='completed'&&run.conclusion==='success'&&run.event==='push'&&run.head_branch==='release/catalogue-benefits-20261006'&&run.path==='.github/workflows/catalogue-benefits-proof.yml'
  &&job?.id===p.job&&job.run_id===p.run&&job.name==='proof'&&job.conclusion==='success'
  &&receipt?.kind==='owner_authorized_catalogue_copy_release'&&receipt.source===p.source&&receipt.deploymentId===p.deployment&&receipt.versionId===p.version&&receipt.percentage===100
  &&receipt.hostedProof?.run===p.run&&receipt.hostedProof?.job===p.job&&receipt.hostedProof?.conclusion==='success'&&receipt.liveProof?.allExact===true&&receipt.productionDatabaseWrites===0&&receipt.assetChanges===0;
}
export const recovery=Object.freeze({run:37047576206,source:'32a51925c6a7676887a3a59b042c15a8272ccc3c',unverified:'7204ee91-dc82-4f3f-90ce-ead305baf9ae',verified:'dee23ccf-be93-4aed-be76-02b724a4c470',verifiedRun:37081219787,verifiedSource:'4350e9a51fece40f5a260da0a847af2a7829c764'});
export const articleRuntime=Object.freeze({run:37147521854,source:'f5184e4ffefd6bc2eb105e86e7107e5c61f00327',version:'b25b6adb-1fc3-473e-97b7-88bfe3c27a48',workflow:'.github/workflows/evidence-based-article-live-release.yml'});
export function recoveryDecision(active,failed,verified){
 assert.equal(active.versions?.length,1);assert.equal(active.versions[0].percentage,100);
 assert.equal(verified.id,recovery.verifiedRun);assert.equal(verified.head_sha,recovery.verifiedSource);assert.equal(verified.conclusion,'success');
 const current=active.versions[0].version_id;
 if(current===recovery.verified)return 'retain';
 assert.equal(current,recovery.unverified,'Unknown runtime: recovery is not authorised');
 assert.equal(failed.id,recovery.run);assert.equal(failed.head_sha,recovery.source);assert.equal(failed.run_attempt,1);assert.equal(failed.conclusion,'cancelled','Only the evidenced cancelled release may be recovered');
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
 assert.equal(record.run,recovery.run);assert.equal(record.dataChanged,false);
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
