import assert from 'node:assert/strict';
export const recovery=Object.freeze({run:37047576206,source:'32a51925c6a7676887a3a59b042c15a8272ccc3c',unverified:'7204ee91-dc82-4f3f-90ce-ead305baf9ae',verified:'dee23ccf-be93-4aed-be76-02b724a4c470',verifiedRun:37081219787,verifiedSource:'4350e9a51fece40f5a260da0a847af2a7829c764'});
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
