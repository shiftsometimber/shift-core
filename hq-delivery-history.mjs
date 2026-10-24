// Read-only delivery projection and explicit retained-proof import. Never a retry/send API.
export const receiptObservationDDL=`CREATE TABLE IF NOT EXISTS hq_notification_receipt_observations(id TEXT PRIMARY KEY,proof_key TEXT NOT NULL,provider_id TEXT NOT NULL,evidence_kind TEXT NOT NULL CHECK(evidence_kind='inbox_observed'),observed_at TEXT NOT NULL,mailbox_received_at TEXT NOT NULL,source_ref TEXT NOT NULL,scope TEXT NOT NULL)`;
export async function retainInboxObservation(DB,evidence){
 if(evidence.evidenceKind!=='inbox_observed'||!/^gmail:[a-f0-9]+$/.test(evidence.sourceRef)||!Number.isFinite(Date.parse(evidence.observedAt))||!Number.isFinite(Date.parse(evidence.mailboxReceivedAt)))throw Error('invalid_receipt_observation');
 await DB.prepare(receiptObservationDDL).run();
 const proof=await DB.prepare('SELECT proof_key FROM hq_comms_delivery_proofs WHERE proof_key=? AND provider_id=?').bind(evidence.proofKey,evidence.providerId).first();if(!proof)throw Error('receipt_does_not_match_retained_proof');
 await DB.prepare('INSERT OR IGNORE INTO hq_notification_receipt_observations(id,proof_key,provider_id,evidence_kind,observed_at,mailbox_received_at,source_ref,scope) VALUES(?,?,?,?,?,?,?,?)').bind(evidence.sourceRef,evidence.proofKey,evidence.providerId,evidence.evidenceKind,evidence.observedAt,evidence.mailboxReceivedAt,evidence.sourceRef,evidence.scope).run();
}
export function deliveryState(raw, providerId) {
 const state=String(raw||'').toLowerCase();
 if(['suppressed','cancelled','canceled','revoked','expired','skipped','superseded'].includes(state))return 'suppressed';
 if(['failed','error','rejected','bounced','binding_missing','configuration_missing'].includes(state))return 'failed';
 if(['unknown','uncertain','sending','in_flight'].includes(state))return 'unknown';
 if(['draft','awaiting_review','held','awaiting_approval','prepared'].includes(state))return 'awaiting_approval';
 if(state==='available_in_app')return 'available_in_app';
 if(['pending','queued','scheduled','approved'].includes(state))return 'queued';
 // A read/open marker or a provider HTTP acceptance is not inbox/device proof.
 if(['accepted','provider_accepted'].includes(state))return 'provider_accepted';
 if(['sent','delivered','read'].includes(state))return providerId?'provider_accepted':'attempted';
 if(['attempted','claimed','processing'].includes(state))return 'attempted';
 return 'unknown';
}
const sources=[
 ['auth_delivery_events',`SELECT 'auth:'||id reference,event_type trigger,user_id member_id,status raw_state,provider_id,created_at occurred_at,error_code FROM auth_delivery_events`],
 ['clinical_notification_channels',`SELECT 'clinical-channel:'||c.event_id||':'||c.channel reference,e.kind trigger,e.member_id member_id,c.status raw_state,c.provider_reference provider_id,c.updated_at occurred_at,NULL error_code,c.channel,'clinical:'||e.id event_reference FROM clinical_notification_channels c JOIN clinical_notification_events e ON e.id=c.event_id WHERE c.draft_id IS NULL`],
 ['commerce_service_delivery',`SELECT r.event_key reference,'shop_'||r.event_type trigger,o.user_id member_id,r.status raw_state,r.provider_id,r.updated_at occurred_at,r.error_code,'shop:'||o.order_number event_reference,r.template_version,r.payload_hash,'email' channel FROM commerce_service_delivery r JOIN orders o ON o.id=r.order_id`],
 ['commerce_receipt_delivery',`SELECT 'shop-receipt:'||r.order_id||':'||r.recipient_role reference,'shop_payment_receipt' trigger,o.user_id member_id,r.state raw_state,r.provider_id,r.updated_at occurred_at,r.last_error error_code,'shop:'||o.order_number event_reference FROM commerce_receipt_delivery r JOIN orders o ON o.id=r.order_id`],
 ['member_signup_alerts',`SELECT 'signup:'||user_id reference,'registration_operator' trigger,user_id member_id,state raw_state,provider_id,updated_at occurred_at,last_error error_code FROM member_signup_alerts`],
 ['hq_comms_recipients',`SELECT 'communications:'||r.draft_id||':'||COALESCE(r.user_id,'external') reference,'hq_service_update' trigger,r.email private_key,r.user_id member_id,CASE WHEN d.status IN ('cancelled','expired') THEN 'cancelled' WHEN d.status IN ('draft','held') AND r.status='pending' THEN 'awaiting_approval' ELSE r.status END raw_state,r.provider_id,COALESCE(r.at,d.created_at) occurred_at,r.error_code,r.read_at in_app_opened_at,r.at attempt_recorded_at,r.draft_id draft_id,d.hash approval_hash,d.approved_at,d.approved_by,json_extract(d.payload_json,'$.channel') channel,json_extract(d.payload_json,'$.notificationEvent') event_reference FROM hq_comms_recipients r JOIN hq_comms_drafts d ON d.id=r.draft_id`],
 ['hq_comms_push_receipts',`SELECT 'communications-push:'||draft_id reference,endpoint private_key,'hq_service_push' trigger,NULL member_id,status raw_state,NULL provider_id,at occurred_at,NULL error_code FROM hq_comms_push_receipts`],
 ['message_outbox',`SELECT 'legacy:'||id reference,COALESCE(CAST(template_id AS TEXT),'legacy_message') trigger,user_id member_id,status raw_state,provider_message_id provider_id,COALESCE(sent_at,updated_at,created_at) occurred_at,NULL error_code FROM message_outbox`],
 ['hq_outbox',`SELECT 'hq-outbox:'||id reference,'hq_outbox' trigger,user_id member_id,status raw_state,NULL provider_id,COALESCE(sent_at,updated_at,created_at) occurred_at,NULL error_code FROM hq_outbox`],
 ['fit_reminder_deliveries',`SELECT 'fit:'||id reference,'fit_reminder' trigger,user_id member_id,status raw_state,NULL provider_id,COALESCE(sent_at,created_at) occurred_at,NULL error_code FROM fit_reminder_deliveries`],
 // Device endpoints and keys must never be returned in management output.
 ['my_timber_support_delivery_history',`SELECT 'support-history:'||reminder_id||':'||endpoint_hash reference,'saved_support_reminder' trigger,user_id member_id,status raw_state,NULL provider_id,at occurred_at,NULL error_code FROM my_timber_support_delivery_history`],
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
   for(const original of rows.slice(0,100)){const {private_key,...row}=original;if(private_key){if(name==='hq_comms_recipients'&&private_key.includes('@'))row.recipient_label=private_key[0]+'***@'+private_key.split('@').at(-1);const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(private_key));row.reference+=':'+Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')}records.push({...row,source:name,state:deliveryState(row.raw_state,row.provider_id),actualReceipt:'not_established'})}
  }catch{coverage.push({source:name,status:'unavailable',reason:'source_query_failed'})}
 }
 // Standalone commissioning proofs cannot be joined to arbitrary member sends.
 let commissioningProofs={status:'unavailable',records:[]};
 if(tables.has('hq_comms_delivery_proofs'))try{commissioningProofs={status:'available',records:(await DB.prepare('SELECT proof_key,state,provider_id,at,scope FROM hq_comms_delivery_proofs WHERE julianday(at)>=julianday(?) AND julianday(at)<=julianday(?) ORDER BY at DESC LIMIT 100').bind(since,until).all()).results}}catch{}
 if(tables.has('hq_notification_receipt_observations'))for(const proof of commissioningProofs.records)try{proof.receiptObservations=(await DB.prepare('SELECT evidence_kind,observed_at,mailbox_received_at,source_ref,scope FROM hq_notification_receipt_observations WHERE proof_key=? AND provider_id=?').bind(proof.proof_key,proof.provider_id).all()).results}catch{proof.receiptObservationsUnavailable=true}
 records.sort((a,b)=>Date.parse(b.occurred_at)-Date.parse(a.occurred_at));
 return {window:{since,until,days},records,coverage,commissioningProofs,readOnly:true,actualReceipt:'No correlated inbox or physical-device receipt is established for these delivery rows. Retained commissioning-proof observations are separate.',limitations:['Up to 100 records per source; truncation is explicit.','Queues and recipient records can describe the same event; do not sum these rows as unique messages.','Support history retains minimal delivery evidence across reminder completion/replacement; explicit withdrawal/erasure clears that member’s history. Legacy current-device rows may overlap.',
'Shop payment receipts retain per-order recipient claims. New dispatch/refund attempts use commerce_service_delivery after the guarded Core release. Historical absence is not evidence of non-delivery.','Missing sources are unavailable, never zero. Unknown sends must be reconciled before retry.']};
}
