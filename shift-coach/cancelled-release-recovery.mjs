import assert from 'node:assert/strict';
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
export async function recentSuccessfulPromotions(get){
 const result=await get('/actions/workflows/cloudflare-production-promote.yml/runs?branch=main&event=push&status=success&per_page=100');
 return (result.workflow_runs||[]).filter(run=>run.path==='.github/workflows/cloudflare-production-promote.yml').slice(0,5);
}
