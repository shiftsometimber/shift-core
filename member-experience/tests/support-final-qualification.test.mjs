import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{withJoinedSuccessorQualification}from'../../release/my-timber-joined-look-scope-20261024.mjs';
test('final live-service repair authenticates current source and four unchanged prior receipts',()=>withJoinedSuccessorQualification(p=>{
 assert.equal(p.supportFinalPredecessor,'847f0e8853101512f309c2ce329c06bf3b17063d');assert(p.currentFactsAuthenticated);assert.equal(p.currentReaderAuthenticated,false);assert.equal(p.productionDeployed,false);
 for(const f of ['scripts/activate-my-timber-member-service.py','member-experience/support-release-gate.mjs','docs/my-timber-v6-service-handover-20261027.md'])assert(p.paths.includes(f),f);
 for(const[file,ref]of[['release/my-timber-support-continuation-20261027.json',p.supportFinalPredecessor],['release/my-timber-support-20261027.json',p.supportContinuation],['release/my-timber-loop-20261026.json',p.supportPredecessor],['release/my-timber-joined-look-20261024.json',p.retainedPredecessor]])assert(readFileSync(file).equals(execFileSync('git',['show',ref+':'+file])),file+' remains byte identical');p.assertOwnedBytes();
}));
test('final projection cannot authenticate an altered current source buffer',()=>withJoinedSuccessorQualification(p=>{
 const file='frontend/member/my-timber-preview.html',actual=readFileSync(file),bad=Buffer.from(actual);bad[0]^=1;assert.throws(()=>p.restoreFile(file,bad),/actual current bytes/);assert.equal(p.comparisonValue(file,bad),bad);p.assertCurrent();
}));
