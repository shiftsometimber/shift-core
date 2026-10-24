// Read-only projection of retained delivery evidence. Never a retry/send API.
export function deliveryState(raw, providerId) {
 const state=String(raw||'').toLowerCase();
 if(['suppressed','cancelled','canceled','revoked','expired','skipped'].includes(state))return 'suppressed';
 if(['failed','error','rejected','bounced'].includes(state))return 'failed';
 if(['unknown','uncertain','sending','in_flight'].includes(state))return 'unknown';
 if(['draft','awaiting_review','held','awaiting_approval','prepared'].includes(state))return 'awaiting_approval';
 if(['pending','queued','scheduled','approved'].includes(state))return 'queued';
 // A read/open marker or a provider HTTP acceptance is not inbox/device proof.
 if(['accepted','provider_accepted'].includes(state))return 'provider_accepted';
 if(['sent','delivered','read'].includes(state))return providerId?'provider_accepted':'attempted';
 if(['attempted','claimed','processing'].includes(state))return 'attempted';
 return 'unknown';
}
const sources=[
 ['auth_delivery_events',`SELECT 'auth:'||id reference,event_type trigger,user_id member_id,status raw_state,provider_id,created_at occurred_at,error_code FROM auth_delivery_events`],
 ['member_signup_alerts',`SELECT 'signup:'||user_id reference,'registration_operator' trigger,user_id member_id,state raw_state,provider_id,updated_at occurred_at,last_error error_code FROM member_signup_alerts`],
 ['hq_comms_recipients',`SELECT 'communications:'||r.draft_id||':'||COALESCE(r.user_id,'external') reference,'hq_service_update' trigger,r.email private_key,r.user_id member_id,CASE WHEN d.status='cancelled' THEN 'cancelled' WHEN d.status IN ('draft','held') AND r.status='pending' THEN 'awaiting_approval' ELSE r.status END raw_state,r.provider_id,COALESCE(r.at,d.created_at) occurred_at,r.error_code,r.draft_id draft_id FROM hq_comms_recipients r JOIN hq_comms_drafts d ON d.id=r.draft_id`],
 ['hq_comms_push_receipts',`SELECT 'communications-push:'||draft_id reference,endpoint private_key,'hq_service_push' trigger,NULL member_id,status raw_state,NULL provider_id,at occurred_at,NULL error_code FROM hq_comms_push_receipts`],
 ['message_outbox',`SELECT 'legacy:'||id reference,COALESCE(CAST(template_id AS TEXT),'legacy_message') trigger,user_id member_id,status raw_state,provider_message_id provider_id,COALESCE(sent_at,updated_at,created_at) occurred_at,NULL error_code FROM message_outbox`],
 ['hq_outbox',`SELECT 'hq-outbox:'||id reference,'hq_outbox' trigger,user_id member_id,status raw_state,NULL provider_id,COALESCE(sent_at,updated_at,created_at) occurred_at,NULL error_code FROM hq_outbox`],
 ['fit_reminder_deliveries',`SELECT 'fit:'||id reference,'fit_reminder' trigger,user_id member_id,status raw_state,NULL provider_id,COALESCE(sent_at,created_at) occurred_at,NULL error_code FROM fit_reminder_deliveries`],
 // Device endpoints and keys must never be returned in management output.
 ['my_timber_support_deliveries',`SELECT 'support-reminder:'||reminder_id reference,'saved_support_reminder' trigger,endpoint private_key,NULL member_id,status raw_state,NULL provider_id,at occurred_at,NULL error_code FROM my_timber_support_deliveries`],
 ['hq_notification_intents',`SELECT event_key reference,template trigger,recipient_user_id member_id,CASE WHEN state='prepared' THEN 'awaiting_approval' ELSE state END raw_state,NULL provider_id,updated_at occurred_at,NULL error_code,draft_id FROM hq_notification_intents WHERE draft_id IS NULL`]
];
export async function deliveryHistory(DB,now=new Date(),days=30){
 const since=new Date(now.getTime()-days*86400000).toISOString(),until=now.toISOString();
 const tables=new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));
 const records=[],coverage=[];
 for(const [name,sql] of sources){
  if(!tables.has(name)){coverage.push({source:name,status:'unavailable',reason:'source_not_installed'});continue}
  try{
   const rows=(await DB.prepare(`SELECT * FROM (${sql}) WHERE julianday(occurred_at)>=julianday(?) AND julianday(occurred_at)<=julianday(?) ORDER BY julianday(occurred_at) DESC LIMIT 101`).bind(since,until).all()).results;
   coverage.push({source:name,status:'available',returned:Math.min(rows.length,100),truncated:rows.length>100});
   for(const original of rows.slice(0,100)){const {private_key,...row}=original;if(private_key){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(private_key));row.reference+=':'+Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')}records.push({...row,source:name,state:deliveryState(row.raw_state,row.provider_id),actualReceipt:'not_established'})}
  }catch{coverage.push({source:name,status:'unavailable',reason:'source_query_failed'})}
 }
 // Standalone commissioning proofs cannot be joined to arbitrary member sends.
 let commissioningProofs={status:'unavailable',records:[]};
 if(tables.has('hq_comms_delivery_proofs'))try{commissioningProofs={status:'available',records:(await DB.prepare('SELECT proof_key,state,provider_id,at,scope FROM hq_comms_delivery_proofs WHERE julianday(at)>=julianday(?) AND julianday(at)<=julianday(?) ORDER BY at DESC LIMIT 100').bind(since,until).all()).results}}catch{}
 records.sort((a,b)=>Date.parse(b.occurred_at)-Date.parse(a.occurred_at));
 return {window:{since,until,days},records,coverage,commissioningProofs,readOnly:true,actualReceipt:'No correlated inbox or physical-device receipt is established by this projection.',limitations:['Up to 100 records per source; truncation is explicit.','Queues and recipient records can describe the same event; do not sum these rows as unique messages.','Historical direct order sends have no installed receipt table; absence of a record is not evidence of non-delivery.','Missing sources are unavailable, never zero. Unknown sends must be reconciled before retry.']};
}
