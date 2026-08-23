import test from 'node:test';
import assert from 'node:assert/strict';
import {medicineRegisterSummary,PROPOSED_TREATMENT_STRENGTHS,evaluateTreatmentReadiness} from '../treatment-catalogue-v1.js';

test('proposed medicine register contains the complete working ladder',()=>{
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.length,15);
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.filter(x=>x[0]==='tirzepatide').length,6);
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.filter(x=>x[1]==='weekly_injection'&&x[0]==='semaglutide').length,5);
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.filter(x=>x[1]==='daily_tablet').length,4);
});

test('treatment readiness reports every missing external dependency and blocks purchase',()=>{
  const gate=evaluateTreatmentReadiness({cost_status:'tbc',stock_state:'tbc',claims_state:'tbc',cta_state:'blocked'});
  assert.equal(gate.ok,false);assert.equal(gate.purchaseState,'blocked');
  assert.deepEqual(gate.blockers,['cost_unconfirmed','stock_unconfirmed','claims_unapproved','supplier_unapproved','availability_unconfirmed','commercial_not_approved','purchase_disabled']);
});

test('treatment readiness requires all seven independent approvals',()=>{
  const gate=evaluateTreatmentReadiness({cost_status:'confirmed',actual_cost_pence:9000,stock_state:'confirmed',stock_source:'supplier evidence',stock_confirmed_at:'2026-08-23',claims_state:'approved',content_version:'v1',clinical_review_date:'2026-08-23',partner_id:2,supplier_status:'approved',availability_state:'available',commercial_state:'approved',cta_state:'enabled'});
  assert.deepEqual(gate,{ok:true,blockers:[],purchaseState:'enabled'});
});

test('all medicine records start blocked with TBC evidence fields and 60 percent target GM',()=>{
  for(const row of medicineRegisterSummary()){
    assert.equal(row.targetGmBps,6000);assert.equal(row.costStatus,'tbc');assert.equal(row.supplierStatus,'tbc');
    assert.equal(row.leadTimeStatus,'tbc');assert.equal(row.pAndPStatus,'tbc');assert.equal(row.ctaState,'blocked');
  }
});
