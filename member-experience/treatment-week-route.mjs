import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';
import {selectPatternSources} from './treatment-patterns.mjs';
import {buildRecordedWeek,DAY,WEEK_MEDICINES} from './treatment-week.mjs';
const parse=v=>{try{return typeof v==='string'?JSON.parse(v):v||{}}catch{return{}}};
const paused=p=>p?.myJourney?.setup?.paused===true;
const day=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
export async function readRecordedTreatmentWeek(env,userId,sources,now=Date.now()){
 sources=selectPatternSources(sources);
 if(env.MY_TIMBER_WEEK_VIEW_ENABLED!=='true'||env.MY_TREATMENT_ENABLED!=='true'&&env.MY_TREATMENT_PREVIEW_ENABLED!=='true')return{status:'not_enabled'};
 if(!await trackingConsent(env.DB,userId))return{status:'tracking_off'};
 const preferences=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first())?.preferences);
 if(paused(preferences))return{status:'paused'};
 const since=new Date(now-84*DAY).toISOString();
 const records=(await env.DB.prepare('SELECT id,medicine,status FROM member_treatment_records WHERE user_id=?').bind(userId).all()).results||[];
 const events=(await env.DB.prepare("SELECT e.id,e.treatment_id,e.kind,e.body_json,e.occurred_at,e.rowid AS sequence FROM member_treatment_events e INNER JOIN member_treatment_records t ON t.id=e.treatment_id AND t.user_id=e.user_id WHERE e.user_id=? AND e.kind IN ('dose_taken','checkin','note','paused','finished','resumed') AND julianday(e.occurred_at)>=julianday(?) AND julianday(e.occurred_at)<=julianday(?) ORDER BY e.occurred_at DESC,e.rowid DESC LIMIT 1001").bind(userId,since,new Date(now).toISOString()).all()).results||[];
 const context={sources,progress:[],food:[],exercises:[]};
 if(sources.includes('progress'))context.progress=(await env.DB.prepare('SELECT recorded_on,weight_kg,waist_cm,systolic,diastolic,steps,sleep_hours,mood_score FROM progress_entries WHERE user_id=? AND recorded_on>=? AND recorded_on<=? ORDER BY recorded_on DESC,id DESC LIMIT 1001').bind(userId,day(now-84*DAY),day(now)).all()).results||[];
 if(sources.includes('food')&&await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_food_entries'").first()){
  const food=(await env.DB.prepare('SELECT id,recorded_on,body_json FROM member_food_entries WHERE user_id=? AND recorded_on>=? AND recorded_on<=? ORDER BY recorded_on DESC,created_at DESC LIMIT 1001').bind(userId,day(now-84*DAY),day(now)).all()).results||[];
  context.food=food.map(r=>{const c=parse(r.body_json);return{id:r.id,on:r.recorded_on,food:typeof c.food==='string'?c.food.slice(0,500):null,proteinG:typeof c.proteinG==='number'&&Number.isFinite(c.proteinG)?c.proteinG:null,waterMl:typeof c.waterMl==='number'&&Number.isFinite(c.waterMl)?c.waterMl:null}});
 }
 if(sources.includes('fit'))context.exercises=Object.values(preferences.fitJourney?.entries||{}).filter(e=>e?.status==='done'&&typeof e.recordedOn==='string'&&e.recordedOn>=day(now-84*DAY)&&e.recordedOn<=day(now)).slice(0,1000).map(e=>({on:e.recordedOn,label:typeof e.name==='string'?e.name.slice(0,200):'Individual exercise marked done'}));
 // Check again after every owned read; withdrawn or paused data never escapes.
 if(!await trackingConsent(env.DB,userId))return{status:'tracking_off'};
 const latest=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first())?.preferences);
 if(paused(latest))return{status:'paused'};
 const limited=events.length>1000||context.progress.length>1000||context.food.length>1000;
 context.progress=context.progress.slice(0,1000);context.food=context.food.slice(0,1000);
 return{status:'available',week:{...buildRecordedWeek({records,events:events.slice(0,1000),now,limited}),curve:{status:'not_included',scope:'recorded_facts_only'},context}};
}
export async function requestRecordedTreatmentWeek(request,env,sources){
 if(request.method!=='GET')return{status:405,data:{error:'method_not_allowed'}};
 let selected;try{selected=selectPatternSources(sources)}catch{return{status:400,data:{error:'invalid_pattern_sources'}}}
 let auth;try{auth=await authenticateMember(request,env)}catch{return{status:503,data:{error:'authentication_unavailable'}}};
 if(auth.response)return{status:401,data:{error:'authentication_required'}};
 try{const result=await readRecordedTreatmentWeek(env,auth.userId,selected);return{status:result.status==='available'?200:result.status==='not_enabled'?404:409,data:result.status==='available'?{week:result.week}:{error:result.status}}}catch{return{status:503,data:{error:'recorded_week_unavailable'}}}
}

export async function requestTreatmentWeekNote(request,env){
 if(request.method!=='POST')return{status:405,data:{error:'method_not_allowed'}};
 if(env.MY_TIMBER_WEEK_VIEW_ENABLED!=='true')return{status:404,data:{error:'not_enabled'}};
 if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return{status:403,data:{error:'origin_not_allowed'}};
 let auth;try{auth=await authenticateMember(request,env)}catch{return{status:503,data:{error:'authentication_unavailable'}}};if(auth.response)return{status:401,data:{error:'authentication_required'}};
 try{
  if(!await trackingConsent(env.DB,auth.userId))return{status:409,data:{error:'tracking_off'}};
  const preferences=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first())?.preferences);if(paused(preferences))return{status:409,data:{error:'paused'}};
  const raw=await request.text();if(new TextEncoder().encode(raw).length>6500)return{status:413,data:{error:'too_large'}};
  let b;try{b=JSON.parse(raw)}catch{return{status:400,data:{error:'invalid_json'}}};
  if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['treatmentId','note','operationId','occurredAt'].includes(k))||typeof b.treatmentId!=='string'||!b.treatmentId||b.treatmentId.length>100||typeof b.operationId!=='string'||!b.operationId||b.operationId.length>100||typeof b.note!=='string'||!b.note.trim()||b.note.length>2000||typeof b.occurredAt!=='string'||!/Z$|[+-]\d{2}:\d{2}$/.test(b.occurredAt)||!Number.isFinite(Date.parse(b.occurredAt))||Date.parse(b.occurredAt)>Date.now()+60000)return{status:400,data:{error:'invalid_note'}};
  const record=await env.DB.prepare('SELECT id,medicine FROM member_treatment_records WHERE id=? AND user_id=?').bind(b.treatmentId,auth.userId).first();if(!record||!WEEK_MEDICINES.includes(record.medicine))return{status:404,data:{error:'treatment_not_found'}};
  const details=JSON.stringify({note:b.note.trim()}),match=p=>p&&p.user_id===auth.userId&&p.treatment_id===b.treatmentId&&p.kind==='note'&&p.body_json===details&&p.occurred_at===b.occurredAt;
  const previous=await env.DB.prepare('SELECT * FROM member_treatment_events WHERE id=?').bind(b.operationId).first();if(previous)return match(previous)?{status:200,data:{ok:true,id:previous.id,replayed:true}}:{status:409,data:{error:'operation_conflict'}};
  const inserted=await env.DB.prepare("INSERT OR IGNORE INTO member_treatment_events(id,user_id,treatment_id,kind,body_json,occurred_at,created_at) SELECT ?,?,?,'note',?,?,? WHERE EXISTS(SELECT 1 FROM member_treatment_records WHERE id=? AND user_id=?) AND COALESCE((SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1),0)=1 AND COALESCE(json_extract((SELECT preferences FROM member_state WHERE user_id=?),'$.myJourney.setup.paused'),0)!=1").bind(b.operationId,auth.userId,b.treatmentId,details,b.occurredAt,new Date().toISOString(),b.treatmentId,auth.userId,auth.userId,auth.userId).run();
  if(inserted.meta?.changes===1)return{status:201,data:{ok:true,id:b.operationId}};
  const raced=await env.DB.prepare('SELECT * FROM member_treatment_events WHERE id=?').bind(b.operationId).first();if(raced)return match(raced)?{status:200,data:{ok:true,id:raced.id,replayed:true}}:{status:409,data:{error:'operation_conflict'}};
  return{status:409,data:{error:'tracking_changed'}};
 }catch{return{status:503,data:{error:'note_unavailable'}}}
}
