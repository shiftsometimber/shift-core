import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAssessment,evidenceRequirements,missingEvidence,releaseReadiness} from '../clinical-assessment/assessment-v3.mjs';
const pack=JSON.parse(readFileSync(new URL('../clinical-assessment/questionnaire-v3.json',import.meta.url)));
function fixture(){const a={requestPath:'Starting treatment'};for(const q of pack.sections.flatMap(s=>s.questions)){if(q.type==='select')a[q.id]=q.options[0];else a[q.id]=q.type==='date'?'2026-10-20':'None';}a.requestPath='Starting treatment';return a;}
test('no and yes paths require different follow ups, without retaining stale hidden answers',()=>{
 const a=fixture();a.thyroidMen2='Yes';delete a.thyroidMen2Details;
 assert.ok(validateAssessment(pack,a).problems.some(p=>p.field==='thyroidMen2Details'));
 a.thyroidMen2='No';a.thyroidMen2Details='old answer';
 assert.equal(validateAssessment(pack,a).answers.thyroidMen2Details,undefined);
});
test('uncertainty requires detail and never grants clinical approval',()=>{const a=fixture();a.otherAllergies='Not sure';delete a.otherAllergiesDetails;const r=validateAssessment(pack,a);assert.equal(r.clinicalApproval,false);assert.ok(r.problems.some(p=>p.field==='otherAllergiesDetails'));});
test('full medicine history is preserved and oversize answers rejected without truncation',()=>{const a=fixture();a.medicineList='x'.repeat(15000);assert.equal(validateAssessment(pack,a).answers.medicineList.length,15000);a.medicineList='x'.repeat(20001);assert.ok(validateAssessment(pack,a).problems.some(p=>p.field==='medicineList'));});
test('invalid choice, malformed dates and unexpected fields are rejected',()=>{const a=fixture();a.diabetes='anything';a.weightMeasuredAt='2026-02-30';assert.equal(validateAssessment(pack,a).complete,false);assert.throws(()=>validateAssessment(pack,{...a,approved:true}),/unexpected_answer/);});
test('switching requires prescription and scales evidence; rejected uploads remain outstanding',()=>{assert.deepEqual(evidenceRequirements('Starting treatment'),['photo_id','front_photo','scale_photo']);assert.ok(evidenceRequirements('Switching provider or medicine').includes('prescription'));assert.ok(missingEvidence('Switching provider or medicine',[{kind:'prescription',state:'rejected'}]).includes('prescription'));});
test('completed collection cannot satisfy release acceptance',()=>{assert.equal(validateAssessment(pack,fixture()).complete,true);assert.equal(releaseReadiness().ready,false);assert.ok(releaseReadiness().missing.includes('private_storage_and_member_access_verified'));});
