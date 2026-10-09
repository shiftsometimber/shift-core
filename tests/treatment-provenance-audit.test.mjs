import test from 'node:test';
import assert from 'node:assert/strict';
import {assessProvenance,OBSERVED_RUNTIME as p,SOURCE_SNAPSHOT as s} from '../release/treatment-provenance-audit.mjs';

function evidence() {
  const active={id:p.deployment,created_on:p.deployedAt,versions:[{version_id:p.version,percentage:100}]};
  const activeVersion={id:p.version,number:p.number,metadata:{created_on:p.createdAt,source:'wrangler'},resources:{script:{etag:p.etag},bindings:[]}};
  const uploadVersion={id:'c8761ea1-2a34-4c78-b714-b4008c7dd371',number:3983,metadata:{created_on:'2026-10-09T08:53:24.602562Z',source:'wrangler'},resources:{script:{etag:'56f33896203d0ff2978b99e1d60474b274981797434a51ed0cc0151bd50764fb'},bindings:[{name:'MY_TREATMENT_ENABLED',text:'true'}]}};
  return {before:[active],after:[structuredClone(active)],activeVersion,uploadVersion,
    latestBefore:[uploadVersion,activeVersion],latestAfter:[uploadVersion,activeVersion],
    modules:[{module:s.module,bytes:s.bytes,sha256:s.sha256}],reconstruction:{module:s.module,bytes:s.bytes,sha256:s.sha256}};
}
test('a newer upload never proves older serving bytes, even if its body matches the local receipt',()=>{
  const report=assessProvenance(evidence());
  assert.equal(report.auditComplete,true);assert.equal(report.sourceRebuildMatchesLocalReceipt,true);
  assert.equal(report.contentAttributableToActive,false);assert.equal(report.independentLiveModuleMatch,null);
  assert.equal(report.active.treatmentEnabled,false);assert.equal(report.latestUpload.treatmentEnabled,true);
  assert.equal(report.ownershipEstablished,false);assert.equal(report.productionActions,0);
});
test('a matching provider fingerprint and module remain evidence, without granting deployment ownership',()=>{
  const data=evidence();data.uploadVersion.resources.script.etag=p.etag;
  const report=assessProvenance(data);assert.equal(report.independentLiveModuleMatch,true);
  assert.equal(report.ownedGuardedDeploymentReceipt,null);assert.equal(report.ownershipEstablished,false);assert.equal(report.productionPauseRetained,true);
});
test('an attributed module mismatch is explicit',()=>{
  const data=evidence();data.uploadVersion.resources.script.etag=p.etag;data.modules[0].sha256='0'.repeat(64);
  const report=assessProvenance(data);assert.equal(report.independentLiveModuleMatch,false);assert.match(report.blocker,/differs/);
});
test('deployment races, split traffic, changed fingerprints and failed reconstructions fail closed',()=>{
  for(const mutate of [
    d=>{d.after[0].id='11111111-1111-1111-1111-111111111111';},
    d=>{d.before[0].versions[0].percentage=50;},
    d=>{d.activeVersion.resources.script.etag='0'.repeat(64);},
    d=>{d.activeVersion.number++;},
    d=>{d.before[0].id='11111111-1111-1111-1111-111111111111';d.after[0]=structuredClone(d.before[0]);},
    d=>{d.reconstruction.bytes++;}
  ]) {const data=evidence();mutate(data);assert.throws(()=>assessProvenance(data));}
});
test('a latest-upload race or invalid chronology rejects content attribution',()=>{
  const data=evidence();data.latestAfter=[{...data.uploadVersion,id:'11111111-1111-1111-1111-111111111111'}];
  assert.throws(()=>assessProvenance(data),/Latest upload moved/);
  const bad=evidence();bad.latestAfter=[{...bad.uploadVersion,metadata:{created_on:'invalid'}}];assert.throws(()=>assessProvenance(bad),/chronology/);
});
