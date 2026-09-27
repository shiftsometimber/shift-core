import {VERSION,fail,recordPayload,key,readJSON,baselineFromJourney} from './model.mjs';
import {HEALTH_INTERESTS} from '../member-experience/health-interest-store.mjs';
const CONSENT="COALESCE((SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1),0)=1";
export async function consent(DB,uid){return Number((await DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(uid).first())?.granted)===1;}
const tables=async DB=>new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));
const decode=r=>({...r,payload:readJSON(r.payload_json),payload_json:undefined,request_key:undefined,user_id:undefined});
const rows=async(DB,sql,uid)=>(await DB.prepare(sql).bind(uid).all()).results||[];
async function schema(DB){const present=await tables(DB);if(!present.has('health_passport_records'))throw fail('passport_not_ready','Your Health Passport is not available yet. Your existing records have not changed.',503);return present;}
function audit(DB,uid,action,id,at){return DB.prepare("INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,?,'health_passport',?,'{}',? WHERE changes()=1").bind(uid,action,id,at)}
export async function saveRecord(DB,uid,type,input,requestKey,at=new Date().toISOString()){
 await schema(DB);const payload=recordPayload(type,input,Date.parse(at)),request=key(requestKey),serial=JSON.stringify(payload);
 const id=crypto.randomUUID();
 const sql=`INSERT INTO health_passport_records(id,user_id,record_type,request_key,payload_json,created_at,updated_at)
 SELECT ?,?,?,?,?,?,? WHERE ${CONSENT} AND (SELECT count(*) FROM health_passport_records WHERE user_id=?)<200
 ON CONFLICT(user_id,record_type,request_key) DO NOTHING`;
 const result=await DB.batch([DB.prepare(sql).bind(id,uid,type,request,serial,at,at,uid,uid),audit(DB,uid,'passport.add',id,at)]);
 const row=await DB.prepare('SELECT * FROM health_passport_records WHERE user_id=? AND record_type=? AND request_key=?').bind(uid,type,request).first();
 if(!row){if(!await consent(DB,uid))throw fail('health_consent_required','Optional health tracking is off. Review your choice before saving.',409);throw fail('passport_record_limit','The record limit has been reached. Export or remove an old personal entry before adding another.',409);}
 if(row.payload_json!==serial)throw fail('request_key_reused','This save has already been used for different answers. Reload before trying again.',409);
 // A replay after consent withdrawal must not claim a new successful save.
 if(!Number(result[0]?.meta?.changes)&&!await consent(DB,uid))throw fail('health_consent_required','Optional health tracking is off. No new record was saved.',409);
 return {record:decode(row),alreadySaved:!Number(result[0]?.meta?.changes)};
}
export async function updateRecord(DB,uid,id,input,revision,at=new Date().toISOString()){
 await schema(DB);if(!Number.isSafeInteger(revision)||revision<1)throw fail('revision_required','Reload the record before editing.');
 const row=await DB.prepare('SELECT record_type FROM health_passport_records WHERE id=? AND user_id=?').bind(id,uid).first();
 if(!row)throw fail('record_not_found','That personal record was not found.',404);
 if(row.record_type!=='treatment')throw fail('immutable_start_here','Start Here answers are dated snapshots. Make new choices rather than rewriting the old ones.',409);
 const serial=JSON.stringify(recordPayload('treatment',input,Date.parse(at)));
 const result=await DB.batch([DB.prepare(`UPDATE health_passport_records SET payload_json=?,revision=revision+1,updated_at=? WHERE id=? AND user_id=? AND revision=? AND ${CONSENT}`).bind(serial,at,id,uid,revision,uid),audit(DB,uid,'passport.update',id,at)]);
 if(result[0]?.meta?.changes!==1)throw fail(await consent(DB,uid)?'record_changed':'health_consent_required','The record changed or tracking was switched off. Reload before saving.',409);
 return decode(await DB.prepare('SELECT * FROM health_passport_records WHERE id=? AND user_id=?').bind(id,uid).first());
}
export async function removeRecord(DB,uid,id,revision,at=new Date().toISOString()){
 await schema(DB);if(!Number.isSafeInteger(revision)||revision<1)throw fail('revision_required','Reload the record before removing it.');
 const result=await DB.batch([DB.prepare('DELETE FROM health_passport_records WHERE id=? AND user_id=? AND revision=?').bind(id,uid,revision),audit(DB,uid,'passport.remove',id,at)]);
 if(result[0]?.meta?.changes!==1)throw fail('record_changed','The record was not found or has changed. Reload to check it.',409);
 return {removed:true};
}
export async function readPassport(DB,uid){
 const present=await schema(DB);
 const member=await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(uid).first();
 const preferences=readJSON(member?.preferences||'{}',{}),journey=preferences.myJourney||{};
 const records=(await rows(DB,'SELECT * FROM health_passport_records WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 200',uid)).map(decode);
 const measurements=present.has('progress_entries')?await rows(DB,'SELECT id,recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,source,created_at FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 100',uid):[];
 const mots=present.has('assessments')?(await rows(DB,'SELECT id,status,answers,outcome,created_at,updated_at FROM assessments WHERE user_id=? ORDER BY id DESC LIMIT 50',uid)).map(r=>({id:r.id,source:'member_health_mot',status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,answers:readJSON(r.answers,{}),outcome:readJSON(r.outcome,r.outcome),clinicalReview:'not_asserted'})):[];
 const results=present.has('health_mot_results')?(await rows(DB,'SELECT id,provider,collected_at,payload_json,created_at FROM health_mot_results WHERE user_id=? ORDER BY id DESC LIMIT 50',uid)).map(r=>({id:r.id,source:'provider_result',provider:r.provider,collectedAt:r.collected_at,storedAt:r.created_at,payload:readJSON(r.payload_json),clinicalReview:readJSON(r.payload_json)?.review?.state||'unreviewed'})):[];
 const orders=present.has('medicine_orders')?await rows(DB,'SELECT id,order_number,medicine_name,strength_label,status,clinical_status,created_at,updated_at FROM medicine_orders WHERE user_id=? ORDER BY id DESC LIMIT 50',uid):[];
 const context=present.has('shift_treatment_context')?await DB.prepare('SELECT medicine,route,dose,status,updated_at FROM shift_treatment_context WHERE user_id=?').bind(uid).first():null;
 return {version:VERSION,generatedAt:new Date().toISOString(),trackingConsent:await consent(DB,uid),baseline:baselineFromJourney(journey),priorities:(Array.isArray(journey.healthInterests)?journey.healthInterests:[]).filter(v=>HEALTH_INTERESTS.has(v)),records,measurements,mots,results,orders,currentTreatment:context,limits:{records:200,measurements:100,mots:50,results:50,orders:50},availableSources:{measurements:present.has('progress_entries'),mots:present.has('assessments'),results:present.has('health_mot_results'),orders:present.has('medicine_orders'),currentTreatment:present.has('shift_treatment_context')},clinicalMonitoring:false};
}
export async function exportPassport(DB,uid){
 const present=await tables(DB);
 if(!present.has('health_passport_records'))return null;
 return {version:VERSION,
 records:(await rows(DB,'SELECT * FROM health_passport_records WHERE user_id=? ORDER BY created_at,id',uid)).map(decode),
 providerResults:present.has('health_mot_results')?(await rows(DB,'SELECT id,provider,collected_at,payload_json,created_at FROM health_mot_results WHERE user_id=? ORDER BY id',uid)).map(r=>({...r,payload:readJSON(r.payload_json),payload_json:undefined})):[],
 medicineOrders:present.has('medicine_orders')?await rows(DB,'SELECT id,order_number,medicine_name,strength_label,status,clinical_status,created_at,updated_at FROM medicine_orders WHERE user_id=? ORDER BY id',uid):[],
 currentTreatment:present.has('shift_treatment_context')?await DB.prepare('SELECT medicine,route,dose,status,updated_at FROM shift_treatment_context WHERE user_id=?').bind(uid).first():null};
}
