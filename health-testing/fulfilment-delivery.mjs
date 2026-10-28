import {parseJSON,sha256} from './fulfilment-model.mjs';
import {catalogue,liveGuard,fresh} from './fulfilment-source.mjs';
import {reviewedEnvelope,londonSchedule,providerMessage,mailFail} from './fulfilment-mail-model.mjs';

const all=async(DB,sql,args=[])=>((await DB.prepare(sql).bind(...args).all()).results||[]);
const getMail=(DB,id)=>DB.prepare('SELECT * FROM testing_fulfilment_mail WHERE batch_id=?').bind(id).first();
const audit=(DB,id,event,actor,detail,now)=>DB.prepare('INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) VALUES(?,?,?,?,?)').bind(id,event,actor,JSON.stringify(detail),now);
export const deliveryProjection=row=>row?Object.fromEntries(Object.entries(row).filter(([key])=>!['envelope_json','lease_id','request_key','request_hash'].includes(key))):null;
export function mailAvailability(env){return {enabled:env.TESTING_FULFILMENT_MAIL_ENABLED==='true'&&typeof env.EMAIL?.send==='function',schedulerEnabled:env.TESTING_FULFILMENT_SCHEDULER_ENABLED==='true',timeZone:'Europe/London'};}
export async function deliveryReview(env,batch){
 const current=await reviewedEnvelope(batch),row=await getMail(env.DB,batch.id),availability=mailAvailability(env);
 return {...availability,envelope:row&&!['cancelled','blocked','failed'].includes(row.status)?parseJSON(row.envelope_json):current.envelope,reviewHash:current.reviewHash,delivery:deliveryProjection(row),canSend:availability.enabled&&batch.status==='prepared'&&(!row||['cancelled','blocked','failed'].includes(row.status))};
}
function assertReady(env,batch){
 if(!mailAvailability(env).enabled)throw mailFail('HQ email sending is not configured. No email was sent.',409,'mail_unavailable');
 if(batch.status!=='prepared')throw mailFail('Only an unsent prepared batch can be sent.',409,'batch_not_prepared');
 const config=parseJSON(batch.config_json);
 if(batch.mode==='live'&&(config.delivery_method!=='email'||!config.template_confirmed||!config.delivery_confirmed||!config.destination))throw mailFail('Confirm the partner email address and CSV template before sending.',409,'setup_incomplete');
}
export async function deliveryAction(env,batch,body,actor,nowMs=Date.now()){
 const DB=env.DB,now=new Date(nowMs).toISOString(),prior=await getMail(DB,batch.id);
 if(body.action==='cancel_schedule'){
  if(!prior||!['scheduled','queued'].includes(prior.status)||body.deliveryRevision!==prior.revision)throw mailFail('This scheduled email changed or is already sending. Refresh before cancelling.',409,'revision_conflict');
  const result=await DB.batch([DB.prepare("UPDATE testing_fulfilment_mail SET status='cancelled',revision=revision+1,updated_at=? WHERE batch_id=? AND revision=? AND status IN ('scheduled','queued')").bind(now,batch.id,prior.revision),DB.prepare("INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) SELECT ?,'email_schedule_cancelled',?,'{}',? WHERE changes()=1").bind(batch.id,actor,now)]);
  if(result[0].meta.changes!==1)throw mailFail('The email has started sending or changed. Refresh its status.',409,'revision_conflict');
  return deliveryReview(env,batch);
 }
 if(!['send_now','schedule','reschedule'].includes(body.action))throw mailFail('Choose Send now or Send later.');
 const key=String(body.requestKey||'');if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))throw mailFail('A unique send request is required.');
 const requestHash=await sha256(JSON.stringify({action:body.action,reviewHash:body.reviewHash,batchRevision:body.batchRevision,date:body.date||null,time:body.time||null,clockOccurrence:body.clockOccurrence||null}));
 if(prior?.request_key===key){if(requestHash!==prior.request_hash)throw mailFail('This send request belongs to a different review.',409,'idempotency_conflict');return {...await deliveryReview(env,batch),replayed:true};}
 assertReady(env,batch);await fresh(DB,batch);
 const {envelope,reviewHash}=await reviewedEnvelope(batch);
 if(body.confirmReviewed!==true||body.reviewHash!==reviewHash||body.batchRevision!==batch.revision)throw mailFail('Review the current recipient, email, orders and attachment before sending.',409,'review_required');
 if(envelope.to.length!==1)throw mailFail('The partner email address has not been confirmed.',409,'recipient_unconfirmed');
 const later=body.action!=='send_now';if(later&&!mailAvailability(env).schedulerEnabled)throw mailFail('Scheduled sending is not configured.',409,'scheduler_unavailable');
 const schedule=later?londonSchedule(body.date,body.time,nowMs,body.clockOccurrence):{utc:now,local:null};
 if(prior&&(!['scheduled','queued','cancelled','blocked','failed'].includes(prior.status)||body.deliveryRevision!==prior.revision))throw mailFail('This email is already sending, sent, or needs its outcome checked. Refresh its status.',409,'revision_conflict');
 const guard=batch.mode==='live'?liveGuard(parseJSON(batch.snapshot_json),batch.config_revision,batch.id):{sql:'1=1',args:[]};
 const values=[later?'scheduled':'queued',key,requestHash,reviewHash,JSON.stringify(envelope),schedule.utc,schedule.local,actor,now,now];
 const statement=prior?DB.prepare(`WITH catalogue AS (${catalogue}) UPDATE testing_fulfilment_mail SET status=?,request_key=?,request_hash=?,review_hash=?,envelope_json=?,send_at=?,scheduled_local=?,approved_by=?,approved_at=?,updated_at=?,revision=revision+1,failure_code=NULL,failure_message=NULL WHERE batch_id=? AND revision=? AND status IN ('scheduled','queued','cancelled','blocked','failed') AND EXISTS(SELECT 1 FROM testing_fulfilment_batches WHERE id=? AND status='prepared' AND revision=?) AND ${guard.sql}`).bind(...values,batch.id,prior.revision,batch.id,batch.revision,...guard.args):DB.prepare(`WITH catalogue AS (${catalogue}) INSERT INTO testing_fulfilment_mail(status,request_key,request_hash,review_hash,envelope_json,send_at,scheduled_local,approved_by,approved_at,updated_at,batch_id) SELECT ${values.map(()=>'?').join(',')},? WHERE EXISTS(SELECT 1 FROM testing_fulfilment_batches WHERE id=? AND status='prepared' AND revision=?) AND ${guard.sql}`).bind(...values,batch.id,batch.id,batch.revision,...guard.args);
 let result;try{result=await DB.batch([statement,DB.prepare('INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) SELECT ?,?,?,?,? WHERE changes()=1').bind(batch.id,later?'email_scheduled':'email_send_approved',actor,JSON.stringify({to:envelope.to,sendAt:schedule.utc,timeZone:'Europe/London',reviewHash}),now)]);}catch{const retry=await getMail(DB,batch.id);if(retry?.request_key===key&&retry.request_hash===requestHash)return {...await deliveryReview(env,batch),replayed:true};throw mailFail('Another send request changed this batch. Refresh its status.',409,'revision_conflict');}
 if(result[0].meta.changes!==1)throw mailFail('An order, setup or send request changed. Refresh and review again.',409,'selection_changed');
 if(!later)await processDelivery(env,batch.id,nowMs);
 return deliveryReview(env,await DB.prepare('SELECT * FROM testing_fulfilment_batches WHERE id=?').bind(batch.id).first());
}
async function stopDelivery(DB,row,status,code,message,now){
 return DB.batch([DB.prepare("UPDATE testing_fulfilment_mail SET status=?,failure_code=?,failure_message=?,updated_at=?,revision=revision+1 WHERE batch_id=? AND revision=? AND status IN ('queued','scheduled','sending')").bind(status,code,message,now,row.batch_id,row.revision),DB.prepare('INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) SELECT ?,?,?,?,? WHERE changes()=1').bind(row.batch_id,'email_'+status,'hq-mail-worker',JSON.stringify({code,message}),now)]);
}
export async function processDelivery(env,id,nowMs=Date.now()){
 if(!mailAvailability(env).enabled)return;
 const DB=env.DB,now=new Date(nowMs).toISOString();let row=await getMail(DB,id);
 if(!row||!['queued','scheduled'].includes(row.status)||row.send_at>now)return;
 const batch=await DB.prepare('SELECT * FROM testing_fulfilment_batches WHERE id=?').bind(id).first();
 try{assertReady(env,batch);await fresh(DB,batch);const current=await reviewedEnvelope(batch);if(current.reviewHash!==row.review_hash||JSON.stringify(current.envelope)!==row.envelope_json||await sha256(batch.csv_text)!==batch.csv_sha256)throw mailFail('The reviewed orders, recipient or attachment changed. Prepare and review a new batch.',409,'review_changed');}catch(error){await stopDelivery(DB,row,'blocked',error.code||'source_changed',error.message,now);return;}
 const guard=batch.mode==='live'?liveGuard(parseJSON(batch.snapshot_json),batch.config_revision,batch.id):{sql:'1=1',args:[]},lease=crypto.randomUUID();
 const claim=await DB.prepare(`WITH catalogue AS (${catalogue}) UPDATE testing_fulfilment_mail SET status='sending',lease_id=?,sending_started_at=?,updated_at=?,attempt_count=attempt_count+1,revision=revision+1 WHERE batch_id=? AND revision=? AND status IN ('queued','scheduled') AND send_at<=? AND EXISTS(SELECT 1 FROM testing_fulfilment_batches WHERE id=? AND status='prepared' AND revision=?) AND ${guard.sql}`).bind(lease,now,now,id,row.revision,now,id,batch.revision,...guard.args).run();
 if(claim.meta.changes!==1)return;
 row=await getMail(DB,id);
 let provider;
 try{provider=await env.EMAIL.send(providerMessage(batch,parseJSON(row.envelope_json)));}
 catch(error){
  const known=/^E_(VALIDATION_ERROR|FIELD_MISSING|TOO_MANY_RECIPIENTS|TOO_MANY_ATTACHMENTS|SENDER_NOT_VERIFIED|RECIPIENT_NOT_ALLOWED|RECIPIENT_SUPPRESSED|ACCOUNT_SUSPENDED|SENDER_DOMAIN_NOT_AVAILABLE|CONTENT_TOO_LARGE|DELIVERY_FAILED|RATE_LIMIT_EXCEEDED|DAILY_LIMIT_EXCEEDED|HEADER_[A-Z_]+)$/.test(String(error?.code||''));
  await stopDelivery(DB,row,known?'failed':'uncertain',known?error.code:'outcome_unknown',known?'The email service rejected this attempt. Check the issue before reviewing a retry.':'The email service outcome is unknown. Check the provider record before any resend.',now);return;
 }
 const providerId=provider?.messageId||provider?.id;
 if(!providerId){await stopDelivery(DB,row,'uncertain','receipt_missing','The email service did not return a message reference. Check its record before any resend.',now);return;}
 // A provider acceptance is never retried, even when recording its receipt fails.
 // The persisted sending state becomes uncertain on the next sweep instead.
 try{await DB.batch([
  DB.prepare("UPDATE testing_fulfilment_mail SET status='sent',provider_id=?,accepted_at=?,updated_at=?,revision=revision+1 WHERE batch_id=? AND status='sending' AND lease_id=?").bind(providerId,now,now,id,lease),
  DB.prepare("UPDATE testing_fulfilment_batches SET status='submitted',submitted_by=?,submitted_at=?,submission_reference=?,revision=revision+1 WHERE id=? AND status='prepared' AND EXISTS(SELECT 1 FROM testing_fulfilment_mail WHERE batch_id=? AND status='sent' AND lease_id=?)").bind(row.approved_by,now,providerId,id,id,lease),
  DB.prepare("INSERT INTO testing_fulfilment_events(batch_id,event,actor,detail_json,created_at) SELECT ?,'email_sent',?,?,? WHERE EXISTS(SELECT 1 FROM testing_fulfilment_mail WHERE batch_id=? AND status='sent' AND lease_id=?)").bind(id,row.approved_by,JSON.stringify({providerId,recipient:parseJSON(row.envelope_json).to,acceptedByService:true,inboxDeliveryVerified:false}),now,id,lease)
 ]);}catch{console.error('testing_email_receipt_recording_failed');}
}
export async function processDueDeliveries(env,nowMs=Date.now()){
 if(!mailAvailability(env).enabled||!mailAvailability(env).schedulerEnabled)return;
 const DB=env.DB,now=new Date(nowMs).toISOString(),cutoff=new Date(nowMs-10*60000).toISOString();
 const stale=await all(DB,"SELECT * FROM testing_fulfilment_mail WHERE status='sending' AND sending_started_at<? LIMIT 20",[cutoff]);
 for(const row of stale)await stopDelivery(DB,row,'uncertain','outcome_unknown','Sending stopped without a recorded receipt. Check the email provider before any resend.',now);
 const due=await all(DB,"SELECT batch_id FROM testing_fulfilment_mail WHERE status IN ('queued','scheduled') AND send_at<=? ORDER BY send_at LIMIT 10",[now]);
 for(const row of due)await processDelivery(env,row.batch_id,nowMs);
}
