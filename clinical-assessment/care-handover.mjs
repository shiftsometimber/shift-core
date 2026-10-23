// A recording contract, not clinical eligibility or dosing guidance.
export const CARE_HANDOVER_VERSION='shift-care-handover-v1';
export const careFields=[
 ['consultationMode','Consultation mode',['Video','In person','Secure two-way consultation with corroborating records']],
 ['consultedOn','Consultation date','date'],
 ['identityReference','Identity check method and evidence reference','text'],
 ['measurementSource','Independent measurement verification',['Video consultation','In-person measurement','Clinical records','Another healthcare provider']],
 ['verifiedOn','Verification date','date'],
 ['verificationReference','Measurement source reference and findings','text'],
 ['historyReference','Medical history and medicines reconciliation source and findings','text'],
 ['eligibilityReason','Eligibility and benefit-risk reasoning against the clinical protocol','text'],
 ['medicationEvidence','Current treatment dose, last dose, supply evidence and restart or switching plan','text'],
 ['gpPlan','GP communication plan',['Notify verified GP','Sharing declined','No GP']],
 ['gpReference','Verified GP route reference or refusal and clinical justification','text'],
 ['medicine','Proposed medicine','text'],['dose','Proposed strength and dose','text'],
 ['directions','Proposed directions and route','text'],['quantity','Proposed quantity','text'],
 ['protocolReference','Clinician-approved protocol reference and version','text'],
 ['followUpDate','Next review date','date'],['followUpOwner','Who owns the next review','text'],
 ['monitoringPlan','Monitoring, escalation and repeat treatment plan','text']
];
export const careChecks=[['historyReviewed','History, allergies, interactions and current medicines reviewed'],['safeguardingReviewed','Capacity, safeguarding and eating-disorder concerns considered and resolved or escalated'],['informationDiscussed','Treatment options, material risks, practical use and questions discussed'],['safetyNetProvided','Medicine-specific safety advice and urgent contact arrangements provided']];
const validDate=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function validateCareHandover(input,today=new Date().toISOString().slice(0,10)){
 const fail=k=>{throw Object.assign(Error('handover_required_'+k),{status:422});};
 if(!input||input.version!==CARE_HANDOVER_VERSION)fail('version');const out={version:CARE_HANDOVER_VERSION};
 for(const [id,,type]of careFields){const v=input[id];if(typeof v!=='string'||!v.trim()||v.length>4000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))fail(id);if(Array.isArray(type)&&!type.includes(v))fail(id);if(type==='date'&&!validDate(v))fail(id);out[id]=v.trim();}
 for(const [id]of careChecks){if(input[id]!==true)fail(id);out[id]=true;}
 if(out.consultedOn>today||out.verifiedOn>today)fail('future_verification');if(out.followUpDate<=out.consultedOn||out.followUpDate<=today)fail('follow_up_date');
 return out;
}
