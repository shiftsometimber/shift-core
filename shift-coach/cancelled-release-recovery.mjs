import assert from 'node:assert/strict';
export const recovery=Object.freeze({run:37047576206,source:'32a51925c6a7676887a3a59b042c15a8272ccc3c',unverified:'7204ee91-dc82-4f3f-90ce-ead305baf9ae',verified:'82df9eb3-dc35-492a-8c62-081c8482c178',verifiedRun:37053664919,verifiedSource:'0d6075c5b9a01d2c8b0986f8f9a14ab1882cb1e6'});
export function recoveryDecision(active,failed,verified){
 assert.equal(active.versions?.length,1);assert.equal(active.versions[0].percentage,100);
 assert.equal(verified.id,recovery.verifiedRun);assert.equal(verified.head_sha,recovery.verifiedSource);assert.equal(verified.conclusion,'success');
 const current=active.versions[0].version_id;
 if(current===recovery.verified)return 'retain';
 assert.equal(current,recovery.unverified,'Unknown runtime: recovery is not authorised');
 assert.equal(failed.id,recovery.run);assert.equal(failed.head_sha,recovery.source);assert.equal(failed.run_attempt,1);assert.equal(failed.conclusion,'cancelled','Only the evidenced cancelled release may be recovered');
 return 'restore';
}
