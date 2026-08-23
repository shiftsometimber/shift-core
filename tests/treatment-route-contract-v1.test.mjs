import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceRoute,buildCommercialRouteResult} from '../treatment-route-contract-v1.js';

test('route advances one coherent section at a time without collecting contact details',()=>{
  let state={step:'adult',answers:{}};
  for(const answer of [{adult:true},{heightCm:173,weightKg:102},{relevantCondition:'unsure'},{previousTreatment:false},{preference:'daily_tablet'}]){const next=advanceRoute(state,answer);assert.equal(next.ok,true);state=next}
  assert.equal(state.step,'result');assert.equal('email' in state.answers,false);assert.equal(state.answers.preference,'daily_tablet');
});
test('switcher detail and last-dose timing are mandatory',()=>{
  const bad=advanceRoute({step:'previous_treatment_detail',answers:{}},{medicine:'Example',strength:'5 mg'});assert.equal(bad.ok,false);
  const good=advanceRoute({step:'previous_treatment_detail',answers:{}},{medicine:'Example',strength:'5 mg',lastDoseTiming:'8_14'});assert.equal(good.step,'preference');
});
test('result never states clinical eligibility and only consumes governed catalogue entries',()=>{
  const result=buildCommercialRouteResult({step:'result',answers:{preference:'daily_tablet'}},[
    {id:1,formulation:'daily_tablet',routine:'daily',proposedPricePence:12900,availability:'information_only',ctaState:'blocked',governanceState:'approved',claimsState:'approved'},
    {id:2,formulation:'weekly_injection',routine:'weekly',proposedPricePence:9900,availability:'available',ctaState:'enabled',governanceState:'approved',claimsState:'approved'},
    {id:3,formulation:'daily_tablet',routine:'daily',proposedPricePence:1,availability:'available',ctaState:'enabled',governanceState:'tbc',claimsState:'tbc'}
  ]);
  assert.equal(result.clinicalEligibilityDetermined,false);assert.equal(result.routes.length,1);assert.equal(result.nextAction,'view_information');assert.match(result.wording,/qualified clinician/i);
});
