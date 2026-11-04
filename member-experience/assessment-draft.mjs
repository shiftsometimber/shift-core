import {authenticateMember} from '../member-state-fast-v1.js';
import {adultServiceEligibility,medicineBmiCriteria} from '../medicine-commerce-v1.js';

// These are the existing intake fields, before provider submission or payment.
// The draft lives in the existing private Journey store so the current account
// export and health/account erasure paths include it. Never put it in a plan,
// recommendation, recap, share card or the native boot payload.
const path='/v1/my-timber/assessment-draft',key='$.myJourney.privateAssessment';
export const assessmentFields=['dateOfBirth','heightCm','weightKg','weightRelatedCondition','conditions','medicines','insulinUse','previousTreatment','previousMedicine','previousDose','lastDoseDate','patientFirstName','patientLastName','patientPhone','patientAddress1','patientAddress2','patientTown','patientPostcode','gpName','gpPractice','gpAddress','gpPostcode'];
const required=['dateOfBirth','heightCm','weightKg','weightRelatedCondition','conditions','medicines','insulinUse','previousTreatment','patientFirstName','patientLastName','patientPhone','patientAddress1','patientTown','patientPostcode','gpName','gpPractice','gpAddress','gpPostcode'];
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'};
const reply=(body,status=200)=>Response.json(body,{status,headers});
const parse=value=>{try{return JSON.parse(value||'null')}catch{return null}};
export function validateAssessmentAnswers(input,complete=false,at=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!assessmentFields.includes(k)))throw Error('Unknown assessment field. Reload the current questionnaire.');
 const answers={};for(const [k,v]of Object.entries(input)){const max=['conditions','medicines','gpAddress'].includes(k)?1000:200;if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))throw Error('Check the length and format of your answers.');answers[k]=v.trim();}
 if(answers.dateOfBirth){const age=adultServiceEligibility(answers.dateOfBirth,at);if(age)throw Object.assign(Error(age.message),{status:age.status});}
 for(const [k,min,max]of [['heightCm',100,250],['weightKg',30,400]])if(answers[k]&&(!Number.isFinite(Number(answers[k]))||Number(answers[k])<min||Number(answers[k])>max))throw Error('Check your height and weight.');
 for(const k of ['weightRelatedCondition','insulinUse','previousTreatment'])if(answers[k]&&!['yes','no'].includes(answers[k]))throw Error('Choose Yes or No for each required answer.');
 if(answers.previousTreatment==='no'){answers.previousMedicine='';answers.previousDose='';answers.lastDoseDate='';}
 if(complete){if(required.some(k=>!answers[k]))throw Error('Complete the required health, contact and GP questions.');if(answers.previousTreatment==='yes'&&['previousMedicine','previousDose','lastDoseDate'].some(k=>!answers[k]))throw Error('Complete your previous treatment details.');}
 if(answers.lastDoseDate){const date=new Date(answers.lastDoseDate+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(answers.lastDoseDate)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==answers.lastDoseDate||date.getTime()>at.getTime())throw Error('Enter a real last dose date that is not in the future.');}
 return answers;
}
export async function assessmentDraftRoute(request,env,publicFetch=fetch){
 const u=new URL(request.url);if(![path,path+'/options',path+'/history-options'].includes(u.pathname))return null;
 if(!['GET','PUT','DELETE'].includes(request.method))return reply({error:'method_not_allowed'},405);
 if(request.headers.get('Sec-Fetch-Site')==='cross-site'||request.headers.get('Origin')&&request.headers.get('Origin')!==u.origin||request.method!=='GET'&&request.headers.get('Origin')!==u.origin)return reply({error:'origin_not_allowed'},403);
 let auth;try{auth=await authenticateMember(request,env)}catch{return reply({error:'account_unavailable'},503)}if(auth.response)return reply({error:'authentication_required'},401);
 const userId=auth.userId,at=new Date().toISOString();
 const read=async()=>{const row=await env.DB.prepare("SELECT json_extract(preferences,?) AS draft FROM member_state WHERE user_id=?").bind(key,userId).first();return parse(row?.draft)};
 const epoch=async()=>Number((await env.DB.prepare("SELECT MAX(id) AS id FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking'").bind(userId).first())?.id||0);
 if(u.pathname===path+'/history-options'){
  if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
  const d=await read();if(!d?.saveConsent||!d?.answers?.dateOfBirth||adultServiceEligibility(d.answers.dateOfBirth))return reply({error:'assessment_required',message:'Start your private questionnaire before choosing previous treatment.'},403);
  let response;try{response=await publicFetch(new Request('https://api.shiftsometimber.co.uk/v1/catalogue/medicines',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)}));if(!response.ok)throw Error();}catch{return reply({error:'catalogue_unavailable',message:'The medicine choices could not load. Try again, or use Other to record exactly what you took.'},503);}
  const source=await response.json(),products=(source.products||[]).filter(p=>typeof p.name==='string').map(p=>({name:p.name,doses:[...new Set((p.variants||[]).map(v=>String(v.strengthLabel||'').split(' · ')[0].trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'en-GB',{numeric:true}))})).sort((a,b)=>a.name.localeCompare(b.name,'en-GB'));
  return reply({accountId:userId,source:'existing /v1/catalogue/medicines',purpose:'previous treatment only; not a treatment offer',products});
 }
 if(u.pathname===path+'/options'){
  if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
  if((await read())?.status!=='questions_complete')return reply({error:'questions_required',message:'Complete your health questions before viewing treatment options.'},403);
  // This existing public catalogue is anonymous, including on the test site.
  // No test member, medical answer, cookie or payment data goes to production.
  let source;try{source=await publicFetch(new Request('https://api.shiftsometimber.co.uk/v1/catalogue/medicines',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)}));}catch{return reply({error:'catalogue_unavailable',message:'The current treatment catalogue could not load. Your answers are saved.'},503);}
  if(!source.ok)return reply({error:'catalogue_unavailable',message:'The current treatment catalogue could not load. Your answers are saved.'},503);
  const catalogue=await source.json();return reply({accountId:userId,paymentAvailable:false,source:'existing /v1/catalogue/medicines',products:(catalogue.products||[]).map(p=>({name:p.name,form:p.form,variants:(p.variants||[]).map(v=>({id:v.id,strengthLabel:v.strengthLabel,pricePence:v.pricePence,status:v.status}))}))});
 }
 if(request.method==='GET')return reply({accountId:userId,draft:await read(),privacyEpoch:await epoch(),bmiRules:{general:medicineBmiCriteria({name:'Mounjaro'}),orlistat:medicineBmiCriteria({name:'Orlistat'})},contact:{patientFirstName:auth.user.first_name||'',patientLastName:auth.user.last_name||''}});
 if(request.method==='DELETE'){const body=await request.json().catch(()=>null);if(String(body?.expectedAccount)!==String(userId))return reply({error:'account_changed'},409);await env.DB.prepare('UPDATE member_state SET preferences=json_remove(preferences,?),updated_at=? WHERE user_id=?').bind(key,at,userId).run();return reply({ok:true,accountId:userId,deleted:true});}
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'json_required'},415);
 const raw=await request.text();if(new TextEncoder().encode(raw).length>16000)return reply({error:'assessment_too_large'},413);
 let body;try{body=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
 const allowed=['expectedAccount','revision','privacyEpoch','operationId','step','answers','consents','saveConsent','complete'];
 if(!body||Object.keys(body).some(k=>!allowed.includes(k))||String(body.expectedAccount)!==String(userId))return reply({error:'account_changed',message:'Your account changed. Reopen the questionnaire.'},409);
 if(body.saveConsent!==true)return reply({error:'assessment_consent_required',message:'Agree to saving your private answers before continuing.'},409);
 if(!Number.isInteger(body.revision)||body.revision<0||!Number.isInteger(body.privacyEpoch)||!Number.isInteger(body.step)||body.step<1||body.step>10||typeof body.operationId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(body.operationId))return reply({error:'invalid_draft'},400);
 const complete=body.complete===true,consents=body.consents||{};
 if(Object.keys(consents).some(k=>!['gpContactConsent','imageConsent','answersConfirmed'].includes(k))||Object.values(consents).some(v=>typeof v!=='boolean'))return reply({error:'invalid_consent'},400);
 if(complete&&['gpContactConsent','answersConfirmed'].some(k=>consents[k]!==true))return reply({error:'confirmation_required',message:'Review and confirm your answers and permissions.'},400);
 let answers;try{answers=validateAssessmentAnswers(body.answers,complete,new Date(at))}catch(e){return reply({error:'invalid_answers',message:e.message},e.status||400)}
 const previous=await read();if(previous?.operationId===body.operationId)return reply({ok:true,accountId:userId,draft:previous,privacyEpoch:await epoch()});
 const draft={questionnaireVersion:2,revision:body.revision+1,step:body.step,answers,consents,status:complete?'questions_complete':'draft',savedAt:at,saveConsent:{version:'assessment-draft/2026-11-04',grantedAt:previous?.saveConsent?.grantedAt||at},operationId:body.operationId};
 // CAS + a live session + an unchanged privacy epoch, in the actual SQL write.
 // A second device or a late request after account/health erasure cannot restore
 // stale answers, and this touches no food, pile, programme or treatment state.
 const sql="INSERT INTO member_state(user_id,preferences,updated_at) SELECT ?,json_object('myJourney',json_object('privateAssessment',json(?))),? WHERE EXISTS(SELECT 1 FROM user_sessions WHERE id=? AND user_id=? AND revoked_at IS NULL AND expires_at>?) AND COALESCE((SELECT MAX(id) FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking'),0)=? AND COALESCE((SELECT json_extract(preferences,'$.myJourney.privateAssessment.revision') FROM member_state WHERE user_id=?),0)=? ON CONFLICT(user_id) DO UPDATE SET preferences=json_set(COALESCE(member_state.preferences,'{}'),'$.myJourney.privateAssessment',json(?)),updated_at=excluded.updated_at WHERE COALESCE(json_extract(member_state.preferences,'$.myJourney.privateAssessment.revision'),0)=?";
 const result=await env.DB.prepare(sql).bind(userId,JSON.stringify(draft),at,auth.user.session_id,userId,at,userId,body.privacyEpoch,userId,body.revision,JSON.stringify(draft),body.revision).run();
 if(result.meta?.changes!==1)return reply({error:'draft_changed',message:'Your answers or privacy settings changed on another device. Reopen the saved questionnaire before continuing.'},409);
 return reply({ok:true,accountId:userId,draft,privacyEpoch:body.privacyEpoch},201);
}
