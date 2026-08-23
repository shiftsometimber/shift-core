import test from 'node:test';
import assert from 'node:assert/strict';
import {groupTreatmentCatalogue,treatmentPathwayPolicy} from '../treatment-pathway-v1.js';

test('live catalogue rows retain hierarchy and force every strength closed',()=>{
  const result=groupTreatmentCatalogue([
    {id:1,family_key:'semaglutide',family_governance_state:'tbc',formulation_key:'daily_tablet',route:'oral',routine:'daily',formulation_governance_state:'tbc',strength_label:'1.5 mg',proposed_price_pence:12900,cost_status:'tbc',stock_state:'tbc',claims_state:'tbc',cta_state:'enabled',offers:'new_customer:tbc:blocked'},
    {id:2,family_key:'semaglutide',family_governance_state:'tbc',formulation_key:'daily_tablet',route:'oral',routine:'daily',formulation_governance_state:'tbc',strength_label:'4 mg',proposed_price_pence:15900,cost_status:'tbc',stock_state:'tbc',claims_state:'tbc',cta_state:'enabled',offers:'switcher:tbc:blocked'}
  ]);
  assert.equal(result.length,1);assert.equal(result[0].formulations.length,1);assert.equal(result[0].formulations[0].strengths.length,2);
  assert.ok(result[0].formulations[0].strengths.every(item=>item.ctaState==='blocked'&&item.priceStatus==='unpublished'));
  assert.ok(result[0].formulations[0].strengths.every(item=>!Object.hasOwn(item,'proposedPricePence')&&item.costStatus==='unpublished'));
});

test('pathway session is short-lived and sale state is fail-closed',()=>{
  assert.equal(treatmentPathwayPolicy.saleState,'blocked');assert.equal(treatmentPathwayPolicy.ttlSeconds,7200);
});
