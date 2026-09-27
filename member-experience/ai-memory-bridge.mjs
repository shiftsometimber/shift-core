import {authenticateMember} from '../member-state-fast-v1.js';
// Shared existing memory stores. All content remains member-private and untrusted.
const clean=(v,n=900)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
const secret=/password|passcode|api key|secret key|private key|card number|bank account|sort code|\bcvv\b/i;
const sessions=new WeakMap();
export function memoryAccess(journey){return sessions.get(journey)||null}
const latestConsent="(SELECT id FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)";
export async function attachConversationMemory(DB,userId,journey){
 if(journey.status!=='available')return journey;
 try{
  const consent=await DB.prepare("SELECT id,granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
  if(Number(consent?.granted)!==1)return journey;
  await DB.exec("CREATE TABLE IF NOT EXISTS shift_ai_privacy_settings (user_id INTEGER PRIMARY KEY, auto_memory INTEGER NOT NULL DEFAULT 1, proactive_insights INTEGER NOT NULL DEFAULT 1, proactive_cooldown_hours INTEGER NOT NULL DEFAULT 48, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS shift_ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,direction TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'coach',body TEXT NOT NULL,model TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_shift_ai_conversations_member ON shift_ai_conversations(user_id,id);");
  const privacy=await DB.prepare('SELECT auto_memory,updated_at FROM shift_ai_privacy_settings WHERE user_id=?').bind(userId).first();
  if(privacy&&Number(privacy.auto_memory)!==1){journey.conversationMemory={status:'off'};return journey;}
  const withdrawal=await DB.prepare("SELECT created_at FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' AND granted=0 ORDER BY id DESC LIMIT 1").bind(userId).first();
  const boundary=withdrawal?.created_at||'1970-01-01';
  if(!Number.isFinite(Date.parse(boundary)))return journey;
  const historyBoundary=privacy?.updated_at&&Date.parse(privacy.updated_at)>Date.parse(boundary)?privacy.updated_at:boundary;
  const rows=(await DB.prepare("SELECT direction,body,created_at FROM shift_ai_conversations WHERE user_id=? AND ((mode=? AND julianday(created_at)>julianday(?)) OR (mode NOT LIKE 'ask-timber:%' AND julianday(created_at)>julianday(?))) AND julianday(created_at)>=julianday('now','-30 days') ORDER BY id DESC LIMIT 6").bind(userId,'ask-timber:'+consent.id,privacy?.updated_at||'1970-01-01',historyBoundary).all()).results||[];
  let memories=[];
  try{memories=(await DB.prepare("SELECT memory_key,category,memory_value,source,updated_at FROM shift_ai_memory_v2 WHERE user_id=? AND julianday(updated_at)>julianday(?) AND confidence>=0.68 ORDER BY CASE WHEN source='member_correction' THEN 0 ELSE 1 END,updated_at DESC LIMIT 12").bind(userId,boundary).all()).results||[]}catch{/* Existing memory store may not have been used. */}
  journey.conversationMemory={status:'available',history:rows.reverse().filter(r=>!secret.test(r.body)).map(r=>({role:r.direction==='user'?'user':'assistant',text:clean(r.body,600),at:r.created_at})),preferences:memories.filter(r=>!secret.test(r.memory_value)).map(r=>({key:clean(r.memory_key,80),category:clean(r.category,60),value:clean(r.memory_value,300),source:clean(r.source,40),at:r.updated_at})),meaning:'Prior conversation is context, not verified evidence. Member corrections take priority.'};
  sessions.set(journey,{DB,userId,consentId:Number(consent.id),privacyVersion:privacy?.updated_at||null});
 }catch{journey.conversationMemory={status:'unavailable'}}
 return journey;
}
export async function saveConversationTurn(access,direction,body){
 if(!access||secret.test(body)||!String(body||'').trim())return false;
 const {DB,userId,consentId,privacyVersion}=access;
 try{
  const result=await DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at)
   SELECT ?,?,?,?,'context-pilot',? WHERE ${latestConsent}=?
   AND (SELECT granted FROM consents WHERE id=?)=1
   AND COALESCE((SELECT auto_memory FROM shift_ai_privacy_settings WHERE user_id=?),1)=1
   AND (SELECT updated_at FROM shift_ai_privacy_settings WHERE user_id=?) IS ?
   AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=?),0)=0`)
   .bind(userId,direction,'ask-timber:'+consentId,clean(body,direction==='user'?900:2800),new Date().toISOString(),userId,consentId,consentId,userId,userId,privacyVersion,userId).run();
  return Number(result.meta?.changes)===1;
 }catch{return false}
}
export async function memoryStillAllowed(access){
 if(!access)return true;
 const {DB,userId,consentId,privacyVersion}=access;
 try{
  const row=await DB.prepare(`SELECT 1 ok WHERE ${latestConsent}=? AND (SELECT granted FROM consents WHERE id=?)=1 AND COALESCE((SELECT auto_memory FROM shift_ai_privacy_settings WHERE user_id=?),1)=1 AND (SELECT updated_at FROM shift_ai_privacy_settings WHERE user_id=?) IS ? AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=?),0)=0`).bind(userId,consentId,consentId,userId,userId,privacyVersion,userId).first();
  return row?.ok===1;
 }catch{return false}
}

// Export the member's stored records even when memory has since been switched off.
export async function appendAiMemoryExport(request,env,response){
 if(new URL(request.url).pathname.replace(/\/+$/,'')!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 try{
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const read=async table=>{
   try{return (await env.DB.prepare(`SELECT * FROM ${table} WHERE user_id=?`).bind(auth.userId).all()).results||[]}
   catch(error){if(/no such table/i.test(String(error.message)))return [];throw error}
  };
  const [conversations,memories,privacy]=await Promise.all(['shift_ai_conversations','shift_ai_memory_v2','shift_ai_privacy_settings'].map(read));
  const data=await response.clone().json();data.aiMemory={conversations,memories,privacy:privacy[0]||null};
  const headers=new Headers(response.headers);headers.set('Cache-Control','no-store, private');headers.set('Vary','Cookie');headers.delete('Content-Length');
  return new Response(JSON.stringify(data),{status:response.status,headers});
 }catch{return Response.json({ok:false,error:'export_unavailable',message:'Your export could not include all saved AI conversations. Please retry.'},{status:503,headers:{'Cache-Control':'no-store, private'}})}
}
