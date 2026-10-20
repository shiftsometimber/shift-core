// Versioned question set. Collects information; it makes no prescribing decision.
export const QUESTIONNAIRE_VERSION = 'shift-assessment-v2-2026-10-20';
const choice = (id,label,options,extra={}) => ({id,label,type:'select',options,...extra});
const text = (id,label,extra={}) => ({id,label,type:'textarea',...extra});
const date = (id,label,extra={}) => ({id,label,type:'date',...extra});
const history = (id,label) => [choice(id,label,['No','Yes','Not sure']),text(id+'Details','Please give details, dates, treatment, current symptoms and the clinician or team managing this.',{when:[id,['Yes','Not sure']]})];
export const SECTIONS = [
 {title:'Your request',questions:[
  choice('requestPath','Which best describes your request?',['Starting treatment','Switching provider or medicine','Restarting after a break','Repeat treatment']),
  choice('forMyself','Are you completing this assessment for yourself?',['Yes','No']),
  choice('inUK','Are you currently in the UK and able to receive care here?',['Yes','No','Not sure']),
  choice('preference','Do you have a treatment preference?',['I would like to discuss the options','I have a preference to discuss']),
  text('preferenceDetails','Which medicine or dose would you like to discuss, and why?',{when:['preference',['I have a preference to discuss']]}),
  text('goals','What would you like to achieve, and what support would help you?'),
 ]},
 {title:'Measurements and weight history',questions:[
  date('heightMeasuredAt','When was your height measured?'),date('weightMeasuredAt','When was your current weight measured?'),
  text('measurementMethod','How were your height and weight measured? Who measured them, and what evidence can you provide for an independent check?'),
  choice('weightChange','Have you had a recent unexpected or unintentional change in weight?',['No','Yes','Not sure']),
  text('weightChangeDetails','How much has your weight changed, over what period, and has a clinician investigated it?',{when:['weightChange',['Yes','Not sure']]}),
  text('previousApproaches','What have you already tried to manage your weight, for how long, and with what results?'),
  text('weightHistory','Tell us about your weight history, including your highest adult weight and any significant recent changes.'),
 ]},
 {title:'Diagnosed conditions related to weight',questions:[
  ...history('hypertension','Have you been diagnosed with high blood pressure?'),
  ...history('cholesterol','Have you been diagnosed with abnormal cholesterol or blood fats?'),
  ...history('sleepApnoea','Have you been diagnosed with obstructive sleep apnoea?'),
  ...history('cardiovascular','Have you had heart disease, a stroke or another cardiovascular condition?'),
  ...history('prediabetes','Have you been diagnosed with prediabetes?'),
  choice('diabetes','Have you been diagnosed with diabetes?',['No','Type 1','Type 2','Another type','Not sure']),
  text('diabetesDetails','Who manages your diabetes? Include treatment, recent HbA1c if known, low blood sugar episodes and any complications.',{when:['diabetes',['Type 1','Type 2','Another type','Not sure']]}),
 ]},
 {title:'Medical and surgical history',questions:[
  ...history('pancreas','Have you had pancreatitis or another pancreatic condition?'),
  ...history('gallbladder','Have you had gallstones or gallbladder disease?'),
  ...history('digestive','Have you had severe digestive problems, delayed stomach emptying (gastroparesis), bowel obstruction or persistent vomiting?'),
  ...history('kidney','Do you have kidney disease or ongoing kidney monitoring?'),
  ...history('liver','Do you have liver disease or ongoing liver monitoring?'),
  ...history('eyes','Do you have diabetic eye disease, a serious eye condition or recent changes to your vision?'),
  ...history('bariatric','Have you had, or are you planning, weight-loss surgery?'),
  ...history('procedure','Do you have an operation or procedure planned involving general anaesthesia or deep sedation?'),
  ...history('eatingDisorder','Have you ever had an eating disorder, disordered eating or received support for this?'),
  text('otherHistory','Tell us about any other medical conditions, operations, hospital admissions, ongoing investigations or mental health concerns relevant to your care. Enter “None” if there are none.'),
 ]},
 {title:'Medicines and allergies',questions:[
  ...history('allergies','Do you have any medicine allergies or previous serious reactions to a medicine or injection?'),
  text('medicineList','List every prescribed medicine, over-the-counter medicine, supplement and herbal product. Include name, strength, dose and frequency. Enter “None” if you take none.'),
  choice('otherWeightMedicine','Are you currently using another weight-management, GLP-1 or diabetes medicine, including supplies from another provider?',['No','Yes','Not sure']),
  text('otherWeightMedicineDetails','Give the medicine, dose, provider, start date and most recent dose. Include any medicines bought privately or online.',{when:['otherWeightMedicine',['Yes','Not sure']]}),
 ]},
 {title:'Pregnancy and reproductive health',questions:[
  choice('pregnancyPossible','Could you become pregnant?',['No','Yes','Not sure']),
  choice('pregnancyStatus','Are you pregnant, planning a pregnancy or breastfeeding?',['No','Pregnant','Planning a pregnancy','Breastfeeding','Not sure'],{when:['pregnancyPossible',['Yes','Not sure']]}),
  text('contraception','What contraception do you use, if any? Include oral contraceptives and any plans to change or stop contraception.',{when:['pregnancyPossible',['Yes','Not sure']]}),
 ]},
 {title:'Switching, restarting and repeat treatment',questions:[
  text('previousProvider','Who prescribed and dispensed your previous or current treatment?',{paths:['Switching provider or medicine','Restarting after a break','Repeat treatment']}),
  date('treatmentStartedAt','When did you start that treatment? If you do not know the date, use the treatment history box below.',{paths:['Switching provider or medicine','Restarting after a break','Repeat treatment'],optional:true}),
  text('startingWeight','What was your weight before starting treatment, and when was it measured?',{paths:['Switching provider or medicine','Restarting after a break','Repeat treatment']}),
  text('doseHistory','Tell us your actual dose history, time on the current dose, doses missed, breaks and dates. Include your most recent dose and any instructions from your previous clinician.',{paths:['Switching provider or medicine','Restarting after a break','Repeat treatment']}),
  text('treatmentEffects','What benefits and side effects have you experienced? Include severity, duration, whether they have resolved and any treatment or advice received.',{paths:['Switching provider or medicine','Restarting after a break','Repeat treatment']}),
  text('changeReason','Why are you switching or restarting, and why did you stop? What advice did your clinician give?',{paths:['Switching provider or medicine','Restarting after a break']}),
  text('dispensingEvidence','What evidence of your previous prescription, dispensing label and dose can you provide? The prescribing team may need to obtain or independently verify this.',{paths:['Switching provider or medicine','Restarting after a break','Repeat treatment']}),
  text('repeatChanges','Since your last assessment, have there been any new symptoms, conditions, medicines, hospital treatment or changes in pregnancy status? Include anything else that has changed. Enter “No changes” if none.',{paths:['Repeat treatment']}),
 ]},
 {title:'Current symptoms and support',questions:[
  choice('urgentSymptoms','Do you currently have severe, persistent stomach pain, sudden loss of vision, or a severe allergic reaction?',['No','Yes','Not sure']),
  text('urgentSymptomsDetails','Please describe your symptoms and any medical advice already sought. Do not wait for this form to be reviewed to seek medical help.',{when:['urgentSymptoms',['Yes','Not sure']]}),
  text('contactNeeds','How can the clinical team contact you safely? Tell us about communication, language or accessibility needs. Enter “No additional needs” if none.'),
  text('patientQuestions','What else should the prescriber know, or what would you like to ask? Enter “Nothing further” if none.'),
 ]},
];
export const QUESTIONS=SECTIONS.flatMap(s=>s.questions);
export function isActive(q,answers){return (!q.paths||q.paths.includes(answers.requestPath))&&(!q.when||q.when[1].includes(answers[q.when[0]]));}
export function validateAssessment(value,{today=new Date().toISOString().slice(0,10)}={}){
 if(!value||Object.keys(value).some(k=>!['version','answers','prescribingAcknowledged'].includes(k))||typeof value!=='object'||Array.isArray(value)||value.version!==QUESTIONNAIRE_VERSION||!value.answers||typeof value.answers!=='object'||Array.isArray(value.answers))return {error:'assessment_version_required',message:'Reload the current assessment before continuing.'};
 const allowed=new Set(QUESTIONS.map(q=>q.id));
 if(Object.keys(value.answers).some(k=>!allowed.has(k)))return {error:'unexpected_assessment_answer',message:'The assessment contains an unknown question.'};
 const answers={};
 for(const q of QUESTIONS){
  if(!isActive(q,value.answers))continue;
  const v=value.answers[q.id];
  if(v!==undefined&&typeof v!=='string')return {error:'invalid_assessment_answer',field:q.id,message:'Check this answer.'};
  const answer=(v||'').trim();
  if(!answer&&!q.optional)return {error:'assessment_answer_required',field:q.id,message:'Please answer: '+q.label};
  if(answer.length>4000)return {error:'assessment_answer_too_long',field:q.id,message:'This answer is over 4,000 characters. Do not omit relevant information; ask the clinical team for a secure way to provide it.'};
  if(q.options&&answer&&!q.options.includes(answer))return {error:'invalid_assessment_answer',field:q.id,message:'Choose one of the listed answers.'};
  if(q.type==='date'&&answer){const d=new Date(answer+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(answer)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==answer||answer>today||answer<'1900-01-01')return {error:'invalid_assessment_date',field:q.id,message:'Enter a real date that is not in the future.'};}
  answers[q.id]=answer;
 }
 if(value.prescribingAcknowledged!==true)return {error:'prescribing_acknowledgement_required',message:'Confirm you understand that a prescriber must approve any prescription.'};
 return {value:{version:QUESTIONNAIRE_VERSION,answers,prescribingAcknowledged:true}};
}
