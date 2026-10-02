import test from 'node:test';
import assert from 'node:assert/strict';
import {insulinEligibility,bmiEligibility} from '../medicine-commerce-v1.js';
import {repairOrderGuidance,repairOrderControllerGuidance,repairIntegratedGuidance,repairSideEffectGuidance,repairCentreGuidance,CENTRE_GUIDANCE_REPLACEMENTS,INSULIN_GATE,HYDRATION_SECTION} from '../public-treatment-guidance.mjs';
import {preserveTreatmentCentreAccuracy} from '../public-promise-preservation.mjs';
test('SHIFT insulin policy is an injection service gate, with no blanket medical prohibition',()=>{
 assert.equal(insulinEligibility('injection','yes').error,'insulin_service_exclusion');
 for(const value of [undefined,'','NO',false])assert.equal(insulinEligibility('injection',value).error,'insulin_answer_required');
 assert.equal(insulinEligibility('injection','no'),null);
 assert.equal(insulinEligibility('tablet','yes'),null);
 assert.equal(insulinEligibility('unknown','no').error,'medicine_form_unconfirmed');
 assert.match(INSULIN_GATE,/new and repeat orders/);assert.match(INSULIN_GATE,/Do not stop or reduce insulin/);assert.match(INSULIN_GATE,/href="\/shift-health"/);
});
test('BMI gate respects exact unrounded boundary, qualifying condition and medicine-specific criteria',()=>{
 const item={name:'Mounjaro'},at=bmi=>({heightCm:200,weightKg:bmi*4});
 assert.equal(bmiEligibility(item,at(30)),null);
 assert.equal(bmiEligibility(item,{...at(27),weightRelatedCondition:'yes'}),null);
 assert.equal(bmiEligibility(item,{...at(29.9),weightRelatedCondition:'no'}).error,'bmi_service_exclusion');
 assert.equal(bmiEligibility(item,{...at(27),weightRelatedCondition:''}).error,'weight_related_condition_required');
 assert.equal(bmiEligibility(item,{...at(26.999),weightRelatedCondition:'yes'}).error,'bmi_service_exclusion');
 assert.equal(bmiEligibility({name:'Orlistat'},{...at(27.5),weightRelatedCondition:'yes'}).error,'bmi_service_exclusion');
 assert.equal(bmiEligibility(item,{heightCm:0,weightKg:80}).error,'bmi_details_required');
});
test('information-page correction is idempotent, retains prices, stock and JS hooks',()=>{
 const original='<head></head>Based on your answers, this could perhaps work for you…<section class="op-bmi-gate" data-bmi-result>£169.00 · no stock</section>';
 const changed=repairOrderGuidance(original);assert.equal(repairOrderGuidance(changed),changed);assert.match(changed,/Understand the treatment options/);assert.match(changed,/data-insulin-use required/);assert.match(changed,/£169.00 · no stock/);assert.match(changed,/op-positive-outlook.*display:none/);
 const controller="  function populateOptions(){return 1}\nfunction product(){return {form:'injection'}}\nconst next=$('[data-op-next]'),ready=bmiCanContinue;\nfunction show(n){step=n}\n";
 const script=repairOrderControllerGuidance(controller);assert.equal(repairOrderControllerGuidance(script),script);assert.match(script,/bmiCanContinue&&insulinCheckPassed/);assert.match(script,/if\(n>0&&\(!bmiCanContinue/);new Function(script);
 const integrated=repairIntegratedGuidance('const orderingOpen=false;const x=JSON.stringify({variantId:Number(option.value),verificationToken:verification.token});');assert.equal(repairIntegratedGuidance(integrated),integrated);assert.match(integrated,/const orderingOpen=false/);assert.match(integrated,/SHIFT_SERVICE_ELIGIBILITY/);new Function(integrated);
});
test('Centre fingerprint removes only exact reviewed wording and exposes unrelated drift',()=>{
 const source=CENTRE_GUIDANCE_REPLACEMENTS.map(([before])=>'<p>'+before+'</p>').join('')+'£169.00';
 const changed=repairCentreGuidance(source);assert.equal(repairCentreGuidance(changed),changed);
 assert.equal(preserveTreatmentCentreAccuracy('/treatment-centre',Buffer.from(changed)).toString(),source);
 assert.notEqual(preserveTreatmentCentreAccuracy('/treatment-centre',Buffer.from(changed.replace('£169.00','£170.00'))).toString(),source);
});
test('hydration advice keeps product-specific care and explains when salt replacement matters',()=>{
 const html='<section class="cluster-section"><h2>Missed dose, changed day or not sure what to do?</h2>Existing instructions</section>';
 const changed=repairSideEffectGuidance(html);assert.equal(repairSideEffectGuidance(changed),changed);assert.match(changed,/Existing instructions/);assert.match(HYDRATION_SECTION,/Vomiting or diarrhoea/);assert.match(HYDRATION_SECTION,/Ask a pharmacist/);assert.match(HYDRATION_SECTION,/no general requirement/);assert.match(HYDRATION_SECTION,/pancreatitis/);
});
