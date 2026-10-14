import {rootShareCompletionHistoricalFile} from '../release/root-share-completion-scope.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ROOT_SHARE_ROLLBACK as p,verifyRootShareRollbackEvidence as verify,decodeRootShareRollbackArtifact} from '../release/root-share-preview-rollback.mjs';
import {recovery,verifiedStartingPoint} from '../shift-coach/cancelled-release-recovery.mjs';
const fixture=()=>JSON.parse(readFileSync('docs/root-share-owned-rollback-20261013.json','utf8'));
test('actual exact successful predecessor and guarded rollback retain only the already restored version',()=>{
 const f=fixture(),proof=verify(f);assert.equal(proof.deployment,p.deployment);assert.equal(proof.run,p.verifiedRun);assert.equal(proof.source,p.verifiedSource);assert.equal(proof.newRollbackPerformed,false);assert.equal(proof.customerRecordsRead,0);assert.equal(proof.dataChanged,false);
 const record={decision:'retain',run:recovery.run,from:p.version,to:p.version,verifiedRun:p.verifiedRun,ownedProof:proof,dataChanged:false};assert.deepEqual(verifiedStartingPoint(record,f.active),{source:p.verifiedSource,version:p.version,run:p.verifiedRun});
});
test('unknown deployment/version, split traffic and changed provider identity fail closed',()=>{
 for(const change of [f=>f.active.id='unknown',f=>f.active.versions[0].version_id=p.failedVersion,f=>f.active.versions[0].percentage=50,f=>f.active.versions.push({...f.active.versions[0]}),f=>f.version.id=p.failedVersion,f=>f.version.metadata.created_on='unknown',f=>f.version.metadata.source='unknown',f=>f.version.annotations['workers/triggered_by']='unknown',f=>f.version.annotations['workers/tag']='claimed',f=>f.version.annotations['workers/message']='claimed']){const f=fixture();change(f);assert.throws(()=>verify(f));}
});
test('both original run/job identities, terminal conclusions and required gate outcomes are mandatory',()=>{
 for(const key of ['failedRun','verifiedRun'])for(const field of ['id','head_sha','status','conclusion','event','head_branch','run_attempt','path']){const f=fixture();f[key][field]='wrong';assert.throws(()=>verify(f));}
 for(const key of ['failedJob','verifiedJob'])for(const field of ['id','run_id','name','status','conclusion']){const f=fixture();f[key][field]='wrong';assert.throws(()=>verify(f));}
 for(const key of ['failedJob','verifiedJob']){const f=fixture();f[key].steps=[];assert.throws(()=>verify(f));}
});
test('ownership logs cannot be absent, duplicated, replaced or detached from the captured predecessor',()=>{
 for(const key of ['failedLogs','verifiedLogs'])for(const mode of ['missing','duplicate','version','source','deployment']){const f=fixture();f[key]=mode==='missing'?'':mode==='duplicate'?f[key]+'\n'+f[key]:f[key].replace(mode==='source'?(key==='failedLogs'?p.source:p.verifiedSource):mode==='deployment'?(key==='failedLogs'?p.failedDeployment:p.verifiedDeployment):p.version,'wrong');assert.throws(()=>verify(f));}
 for(const text of ['AssertionError [ERR_ASSERTION]',"'cache-control': 'no-store'",'Worker Version '+p.version+' has been deployed to 100% of traffic.']){const f=fixture();f.failedLogs=f.failedLogs.replaceAll(text,'absent');assert.throws(()=>verify(f));}
});
test('exact official artifact and its failed release/rollback records are required; failure is never promoted to success',()=>{
 for(const field of ['id','name','size_in_bytes','digest','expired']){const f=fixture();f.artifact[field]='wrong';assert.throws(()=>verify(f));}
 for(const field of ['id','head_sha']){const f=fixture();f.artifact.workflow_run[field]='wrong';assert.throws(()=>verify(f));}
 const changes=[f=>f.files.rollback.dataRestored=true,f=>f.files.rollback.deployment='wrong',f=>f.files.rollback.restoredVersion=p.failedVersion,f=>f.files.rollback.at='wrong',f=>f.files.owned.previousDeploymentId='wrong',f=>f.files.report.releaseVerified=true,f=>f.files.report.workflowStatus='success',f=>f.files.checks.status='failed',f=>f.files.checks.checks[0].passed=false,f=>f.files.checks.checks.pop(),f=>f.files.checks.afterChecks.percentage=50,f=>f.files.checks.expected.versionId=p.failedVersion,f=>f.files.checks.errors.push('failure')];
 for(const change of changes){const f=fixture();change(f);assert.throws(()=>verify(f));}
 assert.throws(()=>decodeRootShareRollbackArtifact(Buffer.from('wrong')));assert.throws(()=>decodeRootShareRollbackArtifact(Buffer.alloc(p.artifactBytes)),/immutable hosted artifact/);
});
test('the read-only exact branch is additive; every original recovery/rollback path remains byte-identical',()=>{
 let s=rootShareCompletionHistoricalFile('shift-coach/recover-cancelled-release.mjs',readFileSync('shift-coach/recover-cancelled-release.mjs','utf8'));const speedLine="import {ROOT_SHARE_SPEED_ROLLBACK,verifyRootShareSpeedRollback} from '../release/root-share-speed-rollback.mjs';\n";assert.equal(s.split(speedLine).length,2);s=s.replace(speedLine,'');const speedStart=s.indexOf('if(before.id===ROOT_SHARE_SPEED_ROLLBACK.deployment){'),speedEnd=s.indexOf('}else if(before.id===ROOT_SHARE_TRANSPORT_ROLLBACK.deployment){',speedStart);assert(speedStart>=0&&speedEnd>speedStart);const speedAddition=s.slice(speedStart,speedEnd+6);assert(!speedAddition.includes("wrangler('rollback'"));assert(speedAddition.includes("decision='retain'"));assert(speedAddition.includes("assert.deepEqual(unchanged,before"));s=s.slice(0,speedStart)+s.slice(speedEnd+6);const transportLine="import {ROOT_SHARE_TRANSPORT_ROLLBACK,verifyRootShareTransportRollback} from '../release/root-share-transport-rollback.mjs';\n";assert.equal(s.split(transportLine).length,2);s=s.replace(transportLine,'');const line="import {ROOT_SHARE_ROLLBACK,verifyRootShareRollback} from '../release/root-share-preview-rollback.mjs';\n";assert.equal(s.split(line).length,2);s=s.replace(line,'');const start=s.indexOf('if(before.id===ROOT_SHARE_TRANSPORT_ROLLBACK.deployment){'),end=s.indexOf('else if([restoredWaistReadingStripRuntime.deployment',start);assert(start>=0&&end>start);const addition=s.slice(start,end);assert(!addition.includes("wrangler('rollback'"));assert(addition.includes("decision='retain'"));assert(addition.includes("assert.deepEqual(unchanged,before"));s=s.slice(0,start)+s.slice(end+5);assert.equal(s,execFileSync('git',['show','c9756798dd271260c8812e419fae5f0d7c61e194:shift-coach/recover-cancelled-release.mjs'],{encoding:'utf8'}));
});
