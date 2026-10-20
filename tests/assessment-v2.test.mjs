import assert from 'node:assert/strict';
import test from 'node:test';
import {QUESTIONS,QUESTIONNAIRE_VERSION,validateAssessment} from '../assessment-v2/schema.mjs';
import {preferenceRefundNotice,withPrescribingTerms} from '../assessment-v2/prescribing-terms.mjs';
const valid=()=>({version:QUESTIONNAIRE_VERSION,prescribingAcknowledged:true,answers:Object.fromEntries(QUESTIONS.map(q=>[q.id,q.options?(q.options.includes('No')?'No':q.options[0]):q.type==='date'?'2026-10-19':'Test answer']))});
test('uncertainty requires relevant clinical detail and inactive answers are excluded',()=>{
 const p=valid();p.answers.pancreas='Not sure';p.answers.pancreasDetails='';assert.equal(validateAssessment(p).field,'pancreasDetails');
 p.answers.pancreasDetails='Awaiting records';assert.equal(validateAssessment(p).value.answers.pancreasDetails,'Awaiting records');
 p.answers.pancreas='No';assert.equal(validateAssessment(p).value.answers.pancreasDetails,undefined);
});
test('switch, restart and repeat each require their actual treatment history',()=>{
 for(const path of ['Switching provider or medicine','Restarting after a break','Repeat treatment']){const p=valid();p.answers.requestPath=path;p.answers.doseHistory='';assert.equal(validateAssessment(p).field,'doseHistory');}
 const p=valid();p.answers.requestPath='Repeat treatment';p.answers.repeatChanges='';assert.equal(validateAssessment(p).field,'repeatChanges');
});
test('unknown version, invalid dates, oversize and unacknowledged prescribing are rejected',()=>{
 const p=valid();p.version='old';assert(validateAssessment(p).error);p.version=QUESTIONNAIRE_VERSION;
 p.answers.heightMeasuredAt='2026-02-30';assert.equal(validateAssessment(p).error,'invalid_assessment_date');p.answers.heightMeasuredAt='2026-10-19';
 p.answers.medicineList='x'.repeat(4001);assert.equal(validateAssessment(p).error,'assessment_answer_too_long');p.answers.medicineList='None';
 p.prescribingAcknowledged=false;assert.equal(validateAssessment(p).error,'prescribing_acknowledgement_required');
});
test('customer terms state current service facts without unfinished fee instructions',()=>{
 const html='<main><h1>Existing terms</h1><p>Existing statutory protections.</p></main>';
 for(const path of ['/terms','/terms-of-sale','/refunds']){const result=withPrescribingTerms(html,path);assert(result.includes('Existing statutory protections'));assert.match(result,/payments are currently closed/);assert.match(result,/statutory rights are unaffected/);assert.doesNotMatch(result,/fee.*(?:must|agreed before)|until the named providers|Before treatment ordering opens/);assert.equal(withPrescribingTerms(result,path),result);}
 assert.equal(withPrescribingTerms(html,'/'),html);assert.match(preferenceRefundNotice,/prescriber/);assert.doesNotMatch(preferenceRefundNotice,/fee/);
});
