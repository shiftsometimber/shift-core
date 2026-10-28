import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {QUESTIONS,SECTIONS,QUESTIONNAIRE_VERSION,validateAssessment} from '../assessment-v2/schema.mjs';
import {preferenceRefundNotice,withPrescribingTerms} from '../assessment-v2/prescribing-terms.mjs';
const valid=()=>({version:QUESTIONNAIRE_VERSION,prescribingAcknowledged:true,answers:Object.fromEntries(QUESTIONS.map(q=>[q.id,q.type==='multi'?JSON.stringify(['None of the above']):q.options?(q.options.includes('No')?'No':q.options.includes('None of the above')?'None of the above':q.options[0]):q.type==='date'?'2026-10-19':'Test answer']))});
test('the compact form exactly preserves the 23 October questions and lists',async()=>{
 const reference=JSON.parse(await readFile(new URL('../assessment-v2/compact-v5-reference.json',import.meta.url),'utf8'));
 const restored=SECTIONS.map(s=>({...s,questions:s.questions.filter(q=>q.id!=='startingWeight')}));assert.deepEqual(restored,reference.sections);
 const ids=QUESTIONS.map(q=>q.id);for(const obsolete of ['heightMeasuredAt','weightMeasuredAt','measurementMethod','previousApproaches','weightHistory','pancreas','gallbladder','medicineList'])assert(!ids.includes(obsolete),obsolete);
 assert.equal(QUESTIONS.filter(q=>q.id==='medicalHistoryDetails').length,1);
 const p=valid();p.version='shift-assessment-v2-2026-10-20';assert.equal(validateAssessment(p).error,'assessment_version_required');
});
test('condition selection cannot combine None with a diagnosed condition or invent answers',()=>{
 const p=valid();p.answers.conditionList=JSON.stringify(['None of the above','Prediabetes']);assert.equal(validateAssessment(p).field,'conditionList');p.answers.conditionList=JSON.stringify(['invented']);assert.equal(validateAssessment(p).field,'conditionList');p.answers.conditionList=JSON.stringify(['Prediabetes','High cholesterol']);assert.deepEqual(JSON.parse(validateAssessment(p).value.answers.conditionList),['Prediabetes','High cholesterol']);
});
test('uncertainty requires relevant clinical detail and inactive answers are excluded',()=>{
 const p=valid();p.answers.medicalHistory='Not sure';p.answers.medicalHistoryDetails='';assert.equal(validateAssessment(p).field,'medicalHistoryDetails');
 p.answers.medicalHistoryDetails='Awaiting records';assert.equal(validateAssessment(p).value.answers.medicalHistoryDetails,'Awaiting records');
 p.answers.medicalHistory='None of the above';assert.equal(validateAssessment(p).value.answers.medicalHistoryDetails,undefined);
});
test('switch, restart and repeat each require their actual treatment history',()=>{
 for(const path of ['Switching provider or medicine','Restarting after a break','Repeat treatment']){const p=valid();p.answers.requestPath=path;p.answers.timeOnDose='';assert.equal(validateAssessment(p).field,'timeOnDose');}
 const p=valid();p.answers.requestPath='Repeat treatment';p.answers.sideEffects='Yes';p.answers.sideEffectsDetails='';assert.equal(validateAssessment(p).field,'sideEffectsDetails');
});
test('unknown version, invalid dates, oversize and unacknowledged prescribing are rejected',()=>{
 const p=valid();p.version='old';assert(validateAssessment(p).error);p.version=QUESTIONNAIRE_VERSION;
 p.answers.requestPath='Repeat treatment';p.answers.nextDoseDate='2026-02-30';assert.equal(validateAssessment(p).error,'invalid_assessment_date');p.answers.nextDoseDate='2026-10-19';
 p.answers.medicines1='I take other medication';p.answers.medicines1Details='x'.repeat(4001);assert.equal(validateAssessment(p).error,'assessment_answer_too_long');p.answers.medicines1='None of the above';
 p.prescribingAcknowledged=false;assert.equal(validateAssessment(p).error,'prescribing_acknowledgement_required');
});
test('customer terms state current service facts without unfinished fee instructions',()=>{
 const html='<main><h1>Existing terms</h1><p>Existing statutory protections.</p></main>';
 for(const path of ['/terms','/terms-of-sale','/refunds']){const result=withPrescribingTerms(html,path);assert(result.includes('Existing statutory protections'));assert.match(result,/payments are currently closed/);assert.match(result,/statutory rights are unaffected/);assert.doesNotMatch(result,/fee.*(?:must|agreed before)|until the named providers|Before treatment ordering opens/);assert.equal(withPrescribingTerms(result,path),result);}
 assert.equal(withPrescribingTerms(html,'/'),html);assert.match(preferenceRefundNotice,/prescriber/);assert.doesNotMatch(preferenceRefundNotice,/fee/);
});
