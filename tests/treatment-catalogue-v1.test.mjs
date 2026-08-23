import test from 'node:test';
import assert from 'node:assert/strict';
import {medicineRegisterSummary,PROPOSED_TREATMENT_STRENGTHS} from '../treatment-catalogue-v1.js';

test('proposed medicine register contains the complete working ladder',()=>{
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.length,15);
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.filter(x=>x[0]==='tirzepatide').length,6);
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.filter(x=>x[1]==='weekly_injection'&&x[0]==='semaglutide').length,5);
  assert.equal(PROPOSED_TREATMENT_STRENGTHS.filter(x=>x[1]==='daily_tablet').length,4);
});

test('all medicine records start blocked with TBC evidence fields and 60 percent target GM',()=>{
  for(const row of medicineRegisterSummary()){
    assert.equal(row.targetGmBps,6000);assert.equal(row.costStatus,'tbc');assert.equal(row.supplierStatus,'tbc');
    assert.equal(row.leadTimeStatus,'tbc');assert.equal(row.pAndPStatus,'tbc');assert.equal(row.ctaState,'blocked');
  }
});
