// Draft coverage for pharmacy review. This is not a prescribing protocol.
// Question wording is original; sources identify topics, not approval of this questionnaire.
const pil='https://www.medicines.org.uk/emc/product/15481/pil';
const wegovy='https://www.medicines.org.uk/emc/product/13799/pil';
const gphc='https://www.pharmacyregulation.org/patients-and-public/standards-you-can-expect-using-pharmacy-services/weight-loss-medications-faq';
const question=(id,group,label,source,options=['no','yes','unsure'])=>({id,group,label,source,options,detailsFor:['yes','unsure','discuss']});
export const draftQuestionnaire={version:'shift-injection-intake-draft-2026-09-13',status:'draft',approvedBy:null,approvedAt:null,medicines:['Mounjaro','Wegovy injection'],questions:[
 question('weightHistory','Weight and wellbeing','Have you had unexplained weight loss, or concerns about previous weight-loss treatment?',gphc),
 question('eatingDisorder','Weight and wellbeing','Have you ever had an eating disorder, received support for one, or been concerned about your eating behaviours?',gphc,['no','yes','unsure','discuss']),
 question('bodyImage','Weight and wellbeing','Do concerns about your body shape or weight significantly affect your daily life or how you eat?',gphc,['no','yes','unsure','discuss']),
 question('mentalHealth','Mental health','Do you have any current or previous mental health conditions, or receive treatment or support for your mental health?',gphc,['no','yes','unsure','discuss']),
 question('mentalHealthChange','Mental health','Have you recently had a significant change in your mood, mental health treatment or support needs?',gphc,['no','yes','unsure','discuss']),
 question('immediateDanger','Mental health','Are you currently at risk of harming yourself, or unable to keep yourself safe?',gphc,['no','yes','unsure']),
 question('diabetes','Physical health','Have you been diagnosed with diabetes or prediabetes?',pil),
 question('lowBloodSugar','Physical health','Have you had episodes of low blood sugar, or do you take insulin or a sulphonylurea such as gliclazide?',pil),
 question('pancreatitis','Physical health','Have you ever had pancreatitis (inflammation of the pancreas)?',pil),
 question('digestion','Physical health','Do you have severe digestive problems, delayed stomach emptying or gastroparesis?',pil),
 question('gallbladder','Physical health','Have you had gallstones, gallbladder inflammation or other gallbladder problems?',pil),
 question('kidneyLiver','Physical health','Do you have a kidney or liver condition, or recent problems with dehydration?',pil),
 question('eyes','Physical health','Do you have diabetic eye disease or any new or worsening problems with your vision?',wegovy),
 question('weightConditions','Physical health','Do you have a weight-related condition, such as high blood pressure, sleep apnoea or cardiovascular disease?',pil),
 question('reaction','Medicines and treatment','Have you had an allergic or serious adverse reaction to a weight-loss medicine or its ingredients?',pil),
 question('otherWeightMedicine','Medicines and treatment','Are you currently using another weight-loss medicine, injection or product?',pil),
 question('surgery','Medicines and treatment','Are you awaiting surgery or a procedure involving anaesthesia or deep sedation?',pil),
 question('pregnancy','Medicines and treatment','If relevant to you, are you pregnant, could you be pregnant, planning pregnancy or breastfeeding?',pil,['not_applicable','no','yes','unsure']),
 question('oralContraception','Medicines and treatment','If relevant to you, do you use an oral contraceptive?',pil,['not_applicable','no','yes','unsure'])
]};
export function clinicalPolicy(env){try{const p=JSON.parse(env.PATIENT_CLINICAL_POLICY_JSON||'null');if(p&&Array.isArray(p.questions)&&p.questions.length)return p}catch{}return draftQuestionnaire}
export function policyApproved(env,medicine){const p=clinicalPolicy(env);return p.status==='approved'&&Boolean(p.approvedBy&&p.approvedAt&&p.version)&&Array.isArray(p.medicines)&&p.medicines.includes(medicine)}
export function clinicalAnswers(input,policy,complete=false){const answers={};for(const q of policy.questions){const v=input?.[q.id]||{};answers[q.id]={answer:String(v.answer||'').slice(0,30),details:String(v.details||'').trim().slice(0,3000)};if(complete){if(!q.options.includes(answers[q.id].answer))throw new Error(`Answer: ${q.label}`);if(q.detailsFor?.includes(answers[q.id].answer)&&q.id!=='immediateDanger'&&!answers[q.id].details)throw new Error(`Add details or ask to discuss: ${q.label}`)}}return answers}
export function needsUrgentHelp(answers){return ['yes','unsure'].includes(answers?.immediateDanger?.answer)}
