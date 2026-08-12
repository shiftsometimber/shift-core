import {normaliseHealthMot,motProgressSignals} from './health-mot-model-v1.js';

const PROGRESS_COLUMNS={weight_kg:'weight_kg',waist_cm:'waist_cm',systolic:'systolic',diastolic:'diastolic',resting_hr:'resting_hr'};

export async function ingestHealthMot(env,{userId,payload,source={}}){
  if(!userId)throw new Error('user_required');
  const uid=Number(userId),mot=normaliseHealthMot(payload,source);await ensure(env.DB);
  const duplicate=mot.source.externalRef?await env.DB.prepare(`SELECT id,payload_json,created_at FROM health_mot_results WHERE user_id=? AND provider=? AND external_ref=? ORDER BY id DESC LIMIT 1`).bind(uid,mot.source.provider,mot.source.externalRef).first():null;
  if(duplicate){const stored=JSON.parse(duplicate.payload_json),signals=motProgressSignals(stored);return{id:Number(duplicate.id),mot:stored,progressSignals:signals,progressEntryId:await linkedProgressId(env.DB,duplicate.id),duplicate:true};}

  const r=await env.DB.prepare(`INSERT INTO health_mot_results(user_id,schema_version,payload_json,provider,external_ref,collected_at,created_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(uid,mot.schema,JSON.stringify(mot),mot.source.provider,mot.source.externalRef,mot.collectedAt).run();
  const id=Number(r?.meta?.last_row_id||0),progressSignals=motProgressSignals(mot),progressEntryId=await persistProgressSignals(env.DB,{userId:uid,motId:id,mot,signals:progressSignals});
  return{id,mot,progressSignals,progressEntryId,duplicate:false};
}

export async function latestHealthMot(DB,userId){await ensure(DB);const r=await DB.prepare(`SELECT id,payload_json,created_at FROM health_mot_results WHERE user_id=? ORDER BY id DESC LIMIT 1`).bind(Number(userId)).first();return r?{id:r.id,...JSON.parse(r.payload_json),storedAt:r.created_at}:null}

export async function healthMotProgressView(DB,userId){
  await ensure(DB);const latest=await latestHealthMot(DB,userId);if(!latest)return{latest:null,progressEntry:null};
  const progressEntry=await DB.prepare(`SELECT id,recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,source,created_at FROM progress_entries WHERE user_id=? AND source=? ORDER BY id DESC LIMIT 1`).bind(Number(userId),progressSource(latest.id)).first().catch(()=>null);
  return{latest,progressEntry:progressEntry||null};
}

async function persistProgressSignals(DB,{userId,motId,mot,signals}){
  if(!signals.length)return null;
  const values={};for(const signal of signals){const column=PROGRESS_COLUMNS[signal.code];if(column&&Number.isFinite(Number(signal.value)))values[column]=Number(signal.value)}
  if(!Object.keys(values).length)return null;
  const recordedOn=normaliseDate(mot.collectedAt)||new Date().toISOString().slice(0,10),source=progressSource(motId);
  const existing=await DB.prepare('SELECT id FROM progress_entries WHERE user_id=? AND source=? LIMIT 1').bind(userId,source).first().catch(()=>null);if(existing?.id)return Number(existing.id);
  const r=await DB.prepare(`INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,notes,source,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(userId,recordedOn,values.weight_kg??null,values.waist_cm??null,values.systolic??null,values.diastolic??null,values.resting_hr??null,'Imported from a partner-neutral Shift MOT result. Clinical interpretation remains outside automatic Progress ingestion.',source).run();
  return Number(r?.meta?.last_row_id||0)||null;
}
async function linkedProgressId(DB,motId){const r=await DB.prepare('SELECT id FROM progress_entries WHERE source=? ORDER BY id DESC LIMIT 1').bind(progressSource(motId)).first().catch(()=>null);return r?.id?Number(r.id):null}
function progressSource(motId){return `health_mot:${Number(motId)}`}
function normaliseDate(value){const t=Date.parse(String(value||''));return Number.isFinite(t)?new Date(t).toISOString().slice(0,10):null}

async function ensure(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS health_mot_results(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,schema_version TEXT NOT NULL,payload_json TEXT NOT NULL,provider TEXT NOT NULL,external_ref TEXT,collected_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS idx_health_mot_user ON health_mot_results(user_id,id);CREATE UNIQUE INDEX IF NOT EXISTS idx_health_mot_external ON health_mot_results(user_id,provider,external_ref) WHERE external_ref IS NOT NULL;`)}
