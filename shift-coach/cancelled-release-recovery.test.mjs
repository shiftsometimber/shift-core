import test from 'node:test';import assert from 'node:assert/strict';import {recovery,recoveryDecision} from './cancelled-release-recovery.mjs';
const active=id=>({versions:[{version_id:id,percentage:100}]}),failed={id:recovery.run,head_sha:recovery.source,run_attempt:1,conclusion:'cancelled'},verified={id:recovery.verifiedRun,head_sha:recovery.verifiedSource,conclusion:'success'};
test('recovery only restores the exact evidenced cancelled runtime to the verified source',()=>{
 assert.deepEqual({verified:recovery.verified,verifiedRun:recovery.verifiedRun,verifiedSource:recovery.verifiedSource},{verified:'908ab7b1-2cb1-4314-8ba2-4d6a75556480',verifiedRun:37056564459,verifiedSource:'9180930c9f7ff94c7c14bc77f6b0b4fa40fdf687'});
 assert.equal(recoveryDecision(active(recovery.unverified),failed,verified),'restore');assert.equal(recoveryDecision(active(recovery.verified),failed,verified),'retain');
 for(const change of [{conclusion:'success'},{head_sha:'f'.repeat(40)},{run_attempt:2},{id:1}])assert.throws(()=>recoveryDecision(active(recovery.unverified),{...failed,...change},verified));
 assert.throws(()=>recoveryDecision(active('unknown'),failed,verified));assert.throws(()=>recoveryDecision(active(recovery.unverified),failed,{...verified,conclusion:'failure'}));
 assert.throws(()=>recoveryDecision({versions:[{version_id:recovery.unverified,percentage:50}]},failed,verified));
});
