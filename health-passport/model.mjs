// Optional personal record, not clinical decision support.
export const VERSION = 'health-passport/v1';
export const DRAFT_TTL_MS = 30 * 60 * 1000;
export const ANSWER_OPTIONS = Object.freeze({
  why: ['Lose weight', 'Feel more energy', 'Health worries', 'Confidence', 'Feel like myself again'],
  med: ['Jabs', 'Tablets', 'Either', 'No medication'],
  access: ['NHS', 'Private', 'Both'],
  budget: ['£0 / NHS', 'Under £100', '£100–£150', '£150–£200', '£200+'],
});
export const fail = (code, message, status=400) => Object.assign(new Error(message), {code,status});
export const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const readJSON = (value, fallback=null) => {try{return JSON.parse(value)}catch{return fallback}};
export const finite = value => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
export function key(value){if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(value))throw fail('invalid_request_key','Reload the form before saving.');return value}
function only(value,keys){if(!object(value)||Object.keys(value).some(k=>!keys.includes(k)))throw fail('invalid_record','This record contains unsupported fields.');}
function text(value,max,required=false){if(typeof value!=='string')value='';value=value.trim();if(value.length>max||(required&&!value))throw fail('invalid_record','Check the required fields and their lengths.');return value;}
function day(value,optional=false,now=Date.now()){
 if(optional&&(value===''||value==null))return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value||value<'1900-01-01'||value>new Date(now).toISOString().slice(0,10))throw fail('invalid_date','Use a valid date that is not in the future.');
 return value;
}
export function normaliseAnswers(answers){
 only(answers,Object.keys(ANSWER_OPTIONS));const next={};
 for(const [name,allowed] of Object.entries(ANSWER_OPTIONS)){
  const values=answers[name];if(!Array.isArray(values)||!values.length||values.length>(name==='why'?5:1)||values.some(v=>!allowed.includes(v))||new Set(values).size!==values.length)throw fail('invalid_start_here','Complete the four Start Here choices before saving.');
  next[name]=allowed.filter(v=>values.includes(v));
 }
 return next;
}
export function normaliseDraft(input,now=Date.now()){
 only(input,['version','id','createdAt','expiresAt','answers']);
 const created=Date.parse(input.createdAt),expires=Date.parse(input.expiresAt);
 if(input.version!==1||!Number.isFinite(created)||!Number.isFinite(expires)||created>now+60000||created<now-DRAFT_TTL_MS||expires<=now||expires>created+DRAFT_TTL_MS||expires<=created)throw fail('start_here_expired','These Start Here answers have expired. Please choose them again.',409);
 return {version:1,id:key(input.id),createdAt:new Date(created).toISOString(),expiresAt:new Date(expires).toISOString(),answers:normaliseAnswers(input.answers)};
}
export function normaliseTreatment(input,now=Date.now()){
 only(input,['medicine','dose','provider','startedOn','endedOn','status','note']);
 if(!['current','paused','stopped','previous'].includes(input.status))throw fail('invalid_treatment_status','Choose the status that describes your own record.');
 const startedOn=day(input.startedOn,true,now),endedOn=day(input.endedOn,true,now);
 if(endedOn&&startedOn&&endedOn<startedOn)throw fail('invalid_date','The end date cannot be before the start date.');
 if(input.status==='current'&&endedOn)throw fail('invalid_date','A current treatment cannot have an end date.');
 return {medicine:text(input.medicine,100,true),dose:text(input.dose,80),provider:text(input.provider,120),startedOn,endedOn,status:input.status,note:text(input.note,600)};
}
export function recordPayload(type,input,now=Date.now()){
 if(type==='start_here')return normaliseDraft(input,now);
 if(type==='treatment')return normaliseTreatment(input,now);
 throw fail('invalid_record_type','Choose a supported personal record.');
}
export function baselineFromJourney(journey={}){
 const s=journey.setup||{},w=journey.weight||{},wa=journey.waist||{};
 return {source:'my_journey',recordedOn:s.startDate||null,updatedAt:journey.updatedAt||null,heightCm:finite(s.heightCm),startWeightKg:finite(w.startKg),currentWeightKg:finite(w.currentKg),targetWeightKg:finite(w.targetKg),startWaistCm:finite(wa.startCm),currentWaistCm:finite(wa.currentCm),units:s.units||'kg',reason:typeof s.why==='string'?s.why:'',route:s.route||null};
}
