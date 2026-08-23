import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTreatmentIntake} from '../treatment-catalogue-intake-v1.js';

const valid=()=>({
  supplier:{externalKey:'pharmacy-one',legalName:'Pharmacy One Ltd',status:'review',companyNumber:'12345678'},
  sourceReference:'signed-rate-card-v1',
  rows:[{rowKey:'sem-tablet-1.5-new',family:'semaglutide',formulation:'daily_tablet',strength:'1.5 mg',offerType:'new_customer',supplierSku:'SEM15',unitCostPence:7100,dispensingCostPence:900,deliveryCostPence:350,paymentCostPence:180,stockState:'confirmed',stockReference:'partner-feed-22',stockObservedAt:'2026-08-23T08:00:00Z',evidenceReference:'rate-card-row-1'}]
});

test('a real partner cost and stock row is structurally ready for dry-run',()=>{
  const result=validateTreatmentIntake(valid());assert.equal(result.ok,true);assert.equal(result.rows[0].ok,true);assert.equal(result.supplier.status,'review');
});
test('supplier approval cannot be imported through bulk intake',()=>{
  const payload=valid();payload.supplier.status='approved';const result=validateTreatmentIntake(payload);
  assert.equal(result.ok,false);assert.ok(result.errors.some(x=>x.code==='approval_not_importable'));
});
test('confirmed stock requires an attributable reference and observation timestamp',()=>{
  const payload=valid();payload.rows[0].stockReference='';payload.rows[0].stockObservedAt='';const result=validateTreatmentIntake(payload);
  assert.equal(result.ok,false);assert.ok(result.rows[0].errors.some(x=>x.code==='confirmed_stock_evidence_required'));
});
test('invalid money and duplicate row identities are rejected per row',()=>{
  const payload=valid();payload.rows.push({...payload.rows[0],unitCostPence:-1});const result=validateTreatmentIntake(payload);
  assert.equal(result.ok,false);assert.ok(result.rows[1].errors.some(x=>x.code==='duplicate'));assert.ok(result.rows[1].errors.some(x=>x.code==='non_negative_integer_required'));
});
test('activation and claims fields are ignored by the accepted contract',()=>{
  const payload=valid();payload.rows[0].commercialState='approved';payload.rows[0].ctaState='enabled';payload.rows[0].claimsState='approved';
  const result=validateTreatmentIntake(payload);assert.equal(result.ok,true);assert.equal('commercialState' in result.rows[0],false);assert.equal('claimsState' in result.rows[0],false);
});
