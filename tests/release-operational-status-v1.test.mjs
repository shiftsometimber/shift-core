import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOperationalStatus,ENGINEERING_PROOFS,EXTERNAL_EVIDENCE} from '../release-operational-status-v1.js';

const NOW='2026-08-23T10:00:00.000Z';
const engineering=Object.fromEntries(ENGINEERING_PROOFS.map(key=>[key,'verified']));
const external=Object.fromEntries(EXTERNAL_EVIDENCE.map(key=>[key,{state:'verified',reference:`evidence:${key}:42`,verifiedAt:'2026-08-22T10:00:00.000Z'}]));
const approvals={commercial:'verified',clinical:'verified',production:'verified'};

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

test('complete current evidence and approvals still require explicit sale authorisation',()=>{
  const status=buildOperationalStatus({now:NOW,engineering,external,approvals});
  assert.equal(status.release.candidate,'ready');
  assert.equal(status.release.commercial,'ready');
  assert.equal(status.productionDeploy.state,'permitted');
  assert.equal(status.medicinePurchase.state,'blocked');
});

test('sale enablement is possible only through the exact explicit control token',()=>{
  const typo=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseAuthorization:'enable'});
  const exact=buildOperationalStatus({now:NOW,engineering,external,approvals,releaseAuthorization:'SHIFT_MEDICINE_SALE_ENABLE'});
  assert.equal(typo.medicinePurchase.state,'blocked');
  assert.equal(exact.medicinePurchase.state,'enabled');
});
