import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{withJoinedSuccessorQualification}from'../../release/my-timber-joined-look-scope-20261024.mjs';
test('final support continuation authenticates current full forum and retains all three earlier receipts',()=>withJoinedSuccessorQualification(p=>{
 assert.equal(p.supportContinuation,'f5ce4ddf3e3c03b982d76a99b394335b252bb74c');assert(p.currentFactsAuthenticated);assert.equal(p.currentReaderAuthenticated,false);assert.equal(p.productionDeployed,false);
 for(const f of ['member-experience/shed-full-community.mjs','member-experience/shed-pilot-access.mjs','release/cloudflare-route-coverage.mjs','medicines-watch/scheduler.test.mjs'])assert(p.paths.includes(f),f);
 for(const[file,ref]of[['release/my-timber-support-20261027.json',p.supportContinuation],['release/my-timber-loop-20261026.json',p.supportPredecessor],['release/my-timber-joined-look-20261024.json',p.retainedPredecessor]])assert(readFileSync(file).equals(execFileSync('git',['show',ref+':'+file])),file+' remains byte identical');p.assertOwnedBytes();
}));
test('a projected current value still requires the complete authenticated actual input',()=>withJoinedSuccessorQualification(p=>{
 const file='member-experience/entry.mjs',actual=readFileSync(file),bad=Buffer.from(actual);bad[0]^=1;
 assert.throws(()=>p.restoreFile(file,bad),/actual current bytes/);assert.equal(p.comparisonValue(file,bad),bad);p.assertCurrent();
}));
