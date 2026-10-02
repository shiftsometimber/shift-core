import test from 'node:test';import assert from 'node:assert/strict';import {recovery,recoveryDecision} from './cancelled-release-recovery.mjs';
const active=id=>({versions:[{version_id:id,percentage:100}]}),failed={id:recovery.run,head_sha:recovery.source,run_attempt:1,conclusion:'cancelled'},verified={id:recovery.verifiedRun,head_sha:recovery.verifiedSource,conclusion:'success'};
test('recovery only restores the exact evidenced cancelled runtime to the verified source',()=>{
 assert.equal(recoveryDecision(active(recovery.unverified),failed,verified),'restore');assert.equal(recoveryDecision(active(recovery.verified),failed,verified),'retain');
 for(const change of [{conclusion:'success'},{head_sha:'f'.repeat(40)},{run_attempt:2},{id:1}])assert.throws(()=>recoveryDecision(active(recovery.unverified),{...failed,...change},verified));
 assert.throws(()=>recoveryDecision(active('unknown'),failed,verified));assert.throws(()=>recoveryDecision(active(recovery.unverified),failed,{...verified,conclusion:'failure'}));
 assert.throws(()=>recoveryDecision({versions:[{version_id:recovery.unverified,percentage:50}]},failed,verified));
});
