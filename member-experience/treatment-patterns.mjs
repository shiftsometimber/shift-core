import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';
import {INJECTION_MEDICINES,INJECTION_SITES} from './treatment-detail.mjs';

export const PATTERN_SOURCES=['treatment','food','fit','progress'];
const DAY=86400000,WINDOW=2*DAY;
const parse=v=>{try{return typeof v==='string'?JSON.parse(v):v||{}}catch{return {}}};
const stamp=v=>typeof v==='string'?Date.parse(v):NaN;
const numeric=v=>typeof v==='number'&&Number.isFinite(v);
const day=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
const validDay=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(Date.parse(v)).toISOString().slice(0,10)===v;
const median=values=>{const a=[...values].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
export function selectPatternSources(value){
 if(!Array.isArray(value)||!value.length||value.length>4||value.some(v=>!PATTERN_SOURCES.includes(v))||new Set(value).size!==value.length||!value.includes('treatment'))throw Error('invalid_pattern_sources');
 return PATTERN_SOURCES.filter(v=>value.includes(v));
}

// Descriptive co-recording only. No symptom diagnosis, dose advice, prediction,
// statistical significance or causal attribution. Missing reports stay unknown.
export function buildTreatmentPatterns({records=[],events=[],progress=[],foodEntries=[],preferences={},sources=['treatment'],now=Date.now(),limited=false}){
 sources=selectPatternSources(sources);
 const since=now-84*DAY,selected=new Set(sources),owned=new Map(records.filter(r=>INJECTION_MEDICINES.includes(r.medicine)).map(r=>[r.id,r]));
 const rows=events.filter(e=>owned.has(e.treatment_id)&&Number.isFinite(stamp(e.occurred_at))&&stamp(e.occurred_at)<=now&&stamp(e.occurred_at)>=since).map(e=>({...e,details:parse(e.body_json??e.details)})).sort((a,b)=>stamp(a.occurred_at)-stamp(b.occurred_at)||Number(a.sequence||0)-Number(b.sequence||0));
 const doses=rows.filter(e=>e.kind==='dose_taken').map(e=>({id:e.id,treatmentId:e.treatment_id,medicine:owned.get(e.treatment_id).medicine,at:e.occurred_at,site:INJECTION_SITES.find(s=>s.value===e.details.injectionSite)?.label||null,dose:typeof e.details.doseStrength==='string'?e.details.doseStrength.slice(0,80):null,doseMeaning:typeof e.details.doseStrength==='string'?'Strength recorded by the member for this dose.':'Dose strength was not captured on this event; current prescription text is not a historical dose.'}));
 const checks=rows.filter(e=>e.kind==='checkin'&&e.details.checkin&&typeof e.details.checkin==='object').map(e=>({id:e.id,treatmentId:e.treatment_id,at:e.occurred_at,c:e.details.checkin}));
 const symptoms=checks.filter(e=>typeof e.c.sideEffects==='string'&&e.c.sideEffects.trim()&&(!Number.isFinite(stamp(e.c.symptomStartedAt))||stamp(e.c.symptomStartedAt)>=since)).map(e=>{const onset=stamp(e.c.symptomStartedAt),valid=Number.isFinite(onset)&&onset<=stamp(e.at)&&onset>=since;return{id:e.id,treatmentId:e.treatmentId,note:e.c.sideEffects.trim().slice(0,2000),impact:e.c.symptomImpact||null,at:valid?e.c.symptomStartedAt:e.at,loggedAt:e.at,timeBasis:valid?'reported_onset':'log_time_onset_unknown'}});
 const observations=[],windows=[];
 for(const [id,r]of owned){
  const ds=doses.filter(d=>d.treatmentId===id),eligible=ds.filter((d,i)=>stamp(d.at)+WINDOW<=now&&(!ds[i+1]||stamp(ds[i+1].at)>=stamp(d.at)+WINDOW));
  const hits=eligible.map(d=>({dose:d,symptoms:symptoms.filter(s=>s.treatmentId===id&&stamp(s.at)>=stamp(d.at)&&stamp(s.at)<stamp(d.at)+WINDOW)}));
  windows.push({treatmentId:id,medicine:r.medicine,completed48HourWindows:eligible.length,windowsWithSymptomEntries:hits.filter(h=>h.symptoms.length).length,unknownWindows:hits.filter(h=>!h.symptoms.length).length,meaning:'No symptom entry means unknown, not symptom-free. Overlapping or unfinished windows are excluded.'});
  if(eligible.length>=3&&hits.filter(h=>h.symptoms.length).length>=2){
   const matching=hits.filter(h=>h.symptoms.length),all=matching.flatMap(h=>h.symptoms),onset=all.every(s=>s.timeBasis==='reported_onset');
   observations.push({key:'jab_timing_'+id,kind:'recorded_timing',text:`${r.medicine}: ${onset?'Symptom starts were reported':'Symptom entries were dated'} within 48 hours after ${matching.length} of ${eligible.length} recorded jabs with completed observation windows.`,limitation:'Timing does not establish cause. Missing symptom logs are unknown; these are not measured symptom rates.',evidence:{doseIds:matching.map(h=>h.dose.id),symptomIds:all.map(s=>s.id),denominator:eligible.length,timeBasis:onset?'reported_onset':'mixed_or_log_time'}});
  }
 }
 const daily=new Map(),get=on=>{if(!daily.has(on))daily.set(on,{on});return daily.get(on)};
 for(const c of checks){const d=get(day(stamp(c.at)));if(['Low','Usual','High'].includes(c.c.energy))d.energy=c.c.energy;
  if(typeof c.c.sideEffects==='string'&&c.c.sideEffects.trim())get(day(stamp(c.c.symptomStartedAt)<=stamp(c.at)&&stamp(c.c.symptomStartedAt)>=since?stamp(c.c.symptomStartedAt):stamp(c.at))).symptoms=true;
  else if(c.c.sideEffects===''&&c.c.symptomImpact==='None'&&d.symptoms!==true)d.symptoms=false;
  if(selected.has('food')){if(numeric(c.c.proteinGrams)&&c.c.proteinGrams>=0&&c.c.proteinGrams<=500)d.proteinGrams=c.c.proteinGrams;if(typeof c.c.foodNote==='string'&&c.c.foodNote.trim())d.foodNote=c.c.foodNote.trim().slice(0,2000);}
 }
 if(selected.has('food'))for(const r of foodEntries){const c=parse(r.body_json),on=r.recorded_on;if(!validDay(on)||on<day(since)||on>day(now)||typeof c.food!=='string'||!c.food.trim())continue;const d=get(on);d.foodEaten=d.foodEaten||[];if(d.foodEaten.length<20)d.foodEaten.push({food:c.food.slice(0,500),...(numeric(c.proteinG)?{proteinG:c.proteinG}:{}),...(numeric(c.waterMl)?{waterMl:c.waterMl}:{})});}
 if(selected.has('progress'))for(const p of progress){if(!validDay(p.recorded_on)||p.recorded_on<day(since)||p.recorded_on>day(now))continue;const d=get(p.recorded_on);for(const [key,min,max]of [['steps',0,100000],['sleep_hours',0,24]])if(numeric(p[key])&&p[key]>=min&&p[key]<=max&&(key!=='protein_g'||selected.has('food')))d[key==='protein_g'?'proteinGrams':key]=p[key];}
 if(selected.has('fit'))for(const e of Object.values(preferences.fitJourney?.entries||{})){if(e?.status!=='done'||!validDay(e.recordedOn)||e.recordedOn<day(since)||e.recordedOn>day(now))continue;const d=get(e.recordedOn);d.exercisesDone=(d.exercisesDone||0)+1;}
 const contextDays=[...daily.values()].sort((a,b)=>a.on.localeCompare(b.on));
 const compare=(field,label,unit)=>{const paired=contextDays.filter(d=>numeric(d[field])&&typeof d.symptoms==='boolean'),yes=paired.filter(d=>d.symptoms),no=paired.filter(d=>!d.symptoms);if(paired.length<8||yes.length<3||no.length<3)return;
  const a=+median(yes.map(d=>d[field])).toFixed(1),b=+median(no.map(d=>d[field])).toFixed(1);if(a===b)return;
  observations.push({key:'co_recorded_'+field,kind:'descriptive_comparison',text:`${label}: median ${a} ${unit} on ${yes.length} days with symptom entries, compared with ${b} ${unit} on ${no.length} days with an explicit no-symptoms entry.`,limitation:'Only paired recorded days are compared. Logging, jab timing and other factors may explain the difference. This is not a proven correlation or cause.',evidence:{days:paired.map(d=>d.on),symptomDays:yes.length,noSymptomEntryDays:no.length,statistic:'median',field}});
 };
 if(selected.has('food'))compare('proteinGrams','Latest recorded protein snapshot','g');
 if(selected.has('fit'))compare('exercisesDone','Individual exercises marked done','exercises');
 if(selected.has('progress')){compare('steps','Recorded steps','steps');compare('sleep_hours','Recorded sleep','hours');}
 return{status:'available',contract:'member-recorded-patterns/v1',sources,window:{days:84,from:new Date(since).toISOString(),to:new Date(now).toISOString()},historyMayBeLimited:limited,doses,symptoms,windows,observations:observations.slice(0,6),contextDays,limitations:['Personal records, not a clinical assessment.','Planned Grub meals are excluded; food notes and protein snapshots are member reports, not verified full-day intake.','Fit counts are individual recorded exercises, not completed sessions. Missing activity is not zero.','No diagnosis, dose advice, prediction, causal claim or statistical significance.']};
}

export async function readTreatmentPatterns(env,userId,sources,now=Date.now()){
 sources=selectPatternSources(sources);if(env.MY_TREATMENT_ENABLED!=='true'&&env.MY_TREATMENT_PREVIEW_ENABLED!=='true')return{status:'not_enabled'};
 if(!await trackingConsent(env.DB,userId))return{status:'tracking_off'};
 const preferences=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first())?.preferences);
 if(preferences.myJourney?.setup?.paused===true)return{status:'paused'};
 const since=new Date(now-84*DAY).toISOString();
 const records=(await env.DB.prepare('SELECT id,medicine FROM member_treatment_records WHERE user_id=?').bind(userId).all()).results||[];
 const events=(await env.DB.prepare("SELECT e.id,e.treatment_id,e.kind,e.body_json,e.occurred_at,e.rowid AS sequence FROM member_treatment_events e INNER JOIN member_treatment_records t ON t.id=e.treatment_id AND t.user_id=e.user_id WHERE e.user_id=? AND e.kind IN ('dose_taken','checkin') AND julianday(e.occurred_at)>=julianday(?) AND julianday(e.occurred_at)<=julianday(?) ORDER BY e.occurred_at DESC,e.rowid DESC LIMIT 1001").bind(userId,since,new Date(now).toISOString()).all()).results||[];
 const progress=sources.includes('progress')?(await env.DB.prepare('SELECT recorded_on,steps,sleep_hours FROM progress_entries WHERE user_id=? AND recorded_on>=? AND recorded_on<=? ORDER BY recorded_on DESC,id DESC LIMIT 1001').bind(userId,day(now-84*DAY),day(now)).all()).results||[]:[];
 let foodEntries=[];if(sources.includes('food')&&await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_food_entries'").first())foodEntries=(await env.DB.prepare('SELECT recorded_on,body_json FROM member_food_entries WHERE user_id=? AND recorded_on>=? AND recorded_on<=? ORDER BY recorded_on,created_at LIMIT 1001').bind(userId,day(now-84*DAY),day(now)).all()).results||[];
 // A withdrawal racing the reads must suppress the derived output too.
 if(!await trackingConsent(env.DB,userId))return{status:'tracking_off'};
 const latest=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first())?.preferences);if(latest.myJourney?.setup?.paused===true)return{status:'paused'};
 return buildTreatmentPatterns({records,events:events.slice(0,1000),progress:progress.slice(0,1000).reverse(),foodEntries:foodEntries.slice(0,1000),preferences,sources,now,limited:events.length>1000||progress.length>1000||foodEntries.length>1000});
}
export async function requestTreatmentPatterns(request,env,sources){
 let selected;try{selected=selectPatternSources(sources)}catch{return{status:400,data:{error:'invalid_pattern_sources'}}}
 let auth;try{auth=await authenticateMember(request,env)}catch{return{status:503,data:{error:'authentication_unavailable'}}}
 if(auth.response)return{status:401,data:{error:'authentication_required'}};
 try{const patterns=await readTreatmentPatterns(env,auth.userId,selected);return{status:patterns.status==='available'?200:patterns.status==='not_enabled'?404:409,data:{patterns}}}catch{return{status:503,data:{error:'patterns_unavailable'}}}
}
export function patternAnswer(patterns){
 if(patterns.status!=='available')return 'Your optional pattern view is unavailable. Review your tracking choice or try again.';
 const lines=patterns.observations.map(o=>o.text);
 if(!lines.length)lines.push('There are not enough comparable recorded days or completed jab windows to describe a repeated pattern yet.');
 if(patterns.historyMayBeLimited)lines.push('This view has reached its history limit, so some records may be omitted.');
 lines.push('These are timings and comparisons in your saved records, not proof of cause. Missing logs remain unknown. Does that match how it felt?');
 return lines.join('\n\n');
}
