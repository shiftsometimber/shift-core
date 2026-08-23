import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOperationalStatus,ENGINEERING_PROOFS,EXTERNAL_EVIDENCE} from '../release-operational-status-v1.js';

const NOW='2026-08-23T10:00:00.000Z';
const COMMIT='0123456789abcdef0123456789abcdef01234567';
const CANDIDATE_DIGEST='c'.repeat(64);
const engineering=Object.fromEntries(ENGINEERING_PROOFS.map(key=>[key,'verified']));
const external=Object.fromEntries(EXTERNAL_EVIDENCE.map(key=>[key,{state:'verified',reference:`evidence:${key}:42`,verifiedAt:'2026-08-22T10:00:00.000Z'}]));
const approvals={
  commercial:{state:'verified',actor:'commercial-owner',approvedAt:'2026-08-23T08:00:00.000Z',targetCommit:COMMIT,candidateDigest:CANDIDATE_DIGEST},
  clinical:{state:'verified',actor:'clinical-owner',approvedAt:'2026-08-23T08:10:00.000Z',targetCommit:COMMIT,candidateDigest:CANDIDATE_DIGEST},
  production:{state:'verified',actor:'release-owner',approvedAt:'2026-08-23T08:20:00.000Z',targetCommit:COMMIT,candidateDigest:CANDIDATE_DIGEST}
};
const candidateEvidence={targetCommit:COMMIT,digest:CANDIDATE_DIGEST,generatedAt:'2026-08-23T09:15:00.000Z',proofs:ENGINEERING_PROOFS.map((key,index)=>({key,state:'verified',commit:COMMIT,artifactReference:`artifact:${key}:42`,artifactDigest:String(index+1).repeat(64)}))};
const releaseControl={targetCommit:COMMIT,evidenceCommit:COMMIT,candidateEvidence,rollback:{commit:COMMIT,reference:'artifact:rollback:42',verifiedAt:'2026-08-23T09:00:00.000Z'}};

test('empty or malformed input fails every release boundary closed',()=>{
  const status=buildOperationalStatus({now:NOW,engineering:{catalogue_foundations:'green'},external:{stock:{state:'verified'}}});
  assert.equal(status.engineering.status,'blocked');
  assert.equal(status.external.status,'blocked');
  assert.equal(status.release.candidate,'blocked');
  assert.equal(status.productionDeploy.state,'blocked');
  assert.deepEqual(status.medicinePurchase,{state:'blocked',reason:'fail_closed'});
});

test('engineering complete makes a merge candidate but cannot unlock commerce',()=>{
  const status=buildOperationalStatus({now:NOW,engineering});
  assert.equal(status.release.candidate,'ready');
  assert.equal(status.release.commercial,'blocked');
  assert.equal(status.productionDeploy.state,'blocked');
  assert.equal(status.medicinePurchase.state,'blocked');
});

test('external evidence requires a reference, timestamp and freshness',()=>{
  const stale={...external,stock:{state:'verified',reference:'stock:old',verifiedAt:'2025-01-01T00:00:00.000Z'}};
  const status=buildOperationalStatus({now:NOW,engineering,external:stale,approvals,releaseAuthorization:'SHIFT_MEDICINE_SALE_ENABLE'});
  assert.equal(status.external.evidence.stock,'blocked');
  assert.equal(status.release.commercial,'blocked');
  assert.equal(status.medicinePurchase.state,'blocked');
});

test('every external domain independently keeps commercial release and medicine purchase blocked',()=>{
  for(const key of EXTERNAL_EVIDENCE){
    const incomplete={...external,[key]:{state:'tbc'}};
    const status=buildOperationalStatus({now:NOW,engineering,external:incomplete,approvals,releaseControl,productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE',releaseAuthorization:'SHIFT_MEDICINE_SALE_ENABLE'});
    assert.equal(status.external.evidence[key],'blocked',key);
    assert.equal(status.release.commercial,'blocked',key);
    assert.equal(status.medicinePurchase.state,'blocked',key);
  }
});

test('future-dated external evidence fails closed',()=>{
  const future={...external,stock:{state:'verified',reference:'stock:future',verifiedAt:'2026-08-24T10:00:00.000Z'}};
  const status=buildOperationalStatus({now:NOW,engineering,external:future,approvals,releaseControl,productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE',releaseAuthorization:'SHIFT_MEDICINE_SALE_ENABLE'});
  assert.equal(status.external.evidence.stock,'blocked');
  assert.equal(status.medicinePurchase.state,'blocked');
});

test('complete current evidence, bound separated approvals and rollback still require explicit production and sale authorisation',()=>{
  const status=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseControl});
  assert.equal(status.release.candidate,'ready');
  assert.equal(status.release.commercial,'ready');
  assert.equal(status.productionDeploy.state,'blocked');
  assert.equal(status.medicinePurchase.state,'blocked');
});

test('sale enablement is possible only through both exact explicit control tokens',()=>{
  const typo=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseControl,productionAuthorization:'enable',releaseAuthorization:'enable'});
  const productionOnly=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseControl,productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE'});
  const exact=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseControl,productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE',releaseAuthorization:'SHIFT_MEDICINE_SALE_ENABLE'});
  assert.equal(typo.medicinePurchase.state,'blocked');
  assert.equal(productionOnly.productionDeploy.state,'permitted');
  assert.equal(productionOnly.medicinePurchase.state,'blocked');
  assert.equal(exact.medicinePurchase.state,'enabled');
});

test('evidence from a different commit blocks deployment and medicine purchase',()=>{
  const mismatched={...releaseControl,evidenceCommit:'fedcba9876543210fedcba9876543210fedcba98'};
  const status=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseControl:mismatched,productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE',releaseAuthorization:'SHIFT_MEDICINE_SALE_ENABLE'});
  assert.equal(status.releaseControl.commitBinding,'blocked');
  assert.equal(status.productionDeploy.state,'blocked');
  assert.equal(status.medicinePurchase.state,'blocked');
});

test('one person cannot provide multiple independent approvals',()=>{
  const duplicated={...approvals,clinical:{...approvals.clinical,actor:'commercial-owner'}};
  const status=buildOperationalStatus({now:NOW,engineering,external,approvals:duplicated,releaseControl,productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE',releaseAuthorization:'SHIFT_MEDICINE_SALE_ENABLE'});
  assert.equal(status.approvals.separation,'blocked');
  assert.equal(status.productionDeploy.state,'blocked');
  assert.equal(status.medicinePurchase.state,'blocked');
});

test('candidate evidence requires the exact proof set, artifact digests and target commit binding',()=>{
  const cases=[
    {...candidateEvidence,proofs:candidateEvidence.proofs.slice(1)},
    {...candidateEvidence,proofs:candidateEvidence.proofs.map((row,index)=>index?row:{...row,artifactDigest:'bad'})},
    {...candidateEvidence,proofs:candidateEvidence.proofs.map((row,index)=>index?row:{...row,commit:'fedcba9876543210fedcba9876543210fedcba98'})},
    {...candidateEvidence,generatedAt:'2025-01-01T00:00:00.000Z'}
  ];
  for(const candidate of cases){
    const status=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseControl:{...releaseControl,candidateEvidence:candidate},productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE'});
    assert.equal(status.releaseControl.candidateEvidence.state,'blocked');
    assert.equal(status.productionDeploy.state,'blocked');
  }
});

test('approvals cannot be replayed against another candidate digest or commit',()=>{
  const replayed={...approvals,commercial:{...approvals.commercial,candidateDigest:'d'.repeat(64)}};
  const status=buildOperationalStatus({now:NOW,engineering,external,approvals:replayed,releaseControl,productionAuthorization:'SHIFT_PRODUCTION_DEPLOY_ENABLE'});
  assert.equal(status.approvals.commercial,'blocked');
  assert.equal(status.productionDeploy.state,'blocked');
});

test('missing, stale or wrong-commit rollback proof blocks deployment',()=>{
  for(const rollback of [
    undefined,
    {commit:COMMIT,reference:'artifact:old',verifiedAt:'2025-01-01T00:00:00.000Z'},
    {commit:'fedcba9876543210fedcba9876543210fedcba98',reference:'artifact:wrong',verifiedAt:'2026-08-23T09:00:00.000Z'}
  ]){
    const status=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseControl:{...releaseControl,rollback}});
    assert.equal(status.releaseControl.rollback.state,'blocked');
    assert.equal(status.productionDeploy.state,'blocked');
    assert.equal(status.medicinePurchase.state,'blocked');
  }
});
