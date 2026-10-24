// Read-only adapter for the central Communications worker. This module is not a sender.
// Call only after that worker has matched notificationEvent, draft ID and prepared intent.
export async function careChannelEligibility(DB,item,payload,draftId,recipient){
 try{
  if(item.source!=='clinical_notification_channels'||item.recipient_kind!=='member')return{eligible:false,reason:'care_source_changed'};
  const channel=payload.channel==='email'?'email':payload.channel==='notification'?'app':null;
  if(!channel||recipient.user_id!==item.recipient_user_id)return{eligible:false,reason:'care_recipient_or_channel_changed'};
  const row=await DB.prepare("SELECT e.member_id,e.record_id,c.status,c.draft_id FROM clinical_notification_events e JOIN clinical_notification_channels c ON c.event_id=e.id JOIN clinical_member_records r ON r.id=e.record_id AND r.user_id=e.member_id WHERE e.id=? AND c.channel=? AND c.draft_id=? AND e.member_id=?").bind(item.source_id,channel,draftId,item.recipient_user_id).first();
  if(!row||row.status!=='prepared')return{eligible:false,reason:'care_event_no_longer_eligible'};
  const member=await DB.prepare('SELECT u.id FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=? AND lower(u.email)=lower(?) AND a.email_verified=1').bind(row.member_id,recipient.email).first();
  return{eligible:!!member,reason:member?null:'care_member_no_longer_verified'};
 }catch{return{eligible:null,reason:'care_channel_source_unavailable'}}
}
// Use at intent-review time, before recipient/draft details are available.
export async function careIntentEligibility(DB,item){
 try{const row=await DB.prepare("SELECT c.event_id FROM clinical_notification_channels c JOIN clinical_notification_events e ON e.id=c.event_id JOIN clinical_member_records r ON r.id=e.record_id AND r.user_id=e.member_id WHERE c.event_id=? AND c.draft_id=? AND c.status='prepared' AND e.member_id=?").bind(item.source_id,item.draft_id,item.recipient_user_id).first();return{eligible:!!row,reason:row?null:'care_event_no_longer_eligible'};}catch{return{eligible:null,reason:'care_channel_source_unavailable'}}
}
