// Invoked immediately before transport for event-linked drafts only.
// Existing independently approved manual drafts retain their current path.
export async function eventDeliveryEligibility(DB,payload,draftId,recipient){
 try{return await checkEvent(DB,payload,draftId,recipient)}catch{return{eligible:false,reason:'event_source_unavailable'}}
}
async function checkEvent(DB,payload,draftId,recipient){
 if(!Object.prototype.hasOwnProperty.call(payload,'notificationEvent'))return{eligible:true};
 const key=payload.notificationEvent;
 if(typeof key!=='string'||key.length>180)return{eligible:false,reason:'invalid_event_reference'};
 const item=await DB.prepare("SELECT source,source_id,recipient_kind,recipient_user_id FROM hq_notification_intents WHERE event_key=? AND draft_id=? AND state='prepared'").bind(key,draftId).first();
 if(!item)return{eligible:false,reason:'event_not_prepared_for_draft'};
 const queries={
  data_requests:"SELECT id FROM data_requests WHERE id=? AND request_type='deletion' AND status NOT IN ('completed','cancelled')",
  support_tickets:"SELECT id FROM support_tickets WHERE id=? AND priority IN ('urgent','high') AND status NOT IN ('closed','resolved')",
  integration_webhooks:"SELECT id FROM integration_webhooks WHERE id=? AND signature_valid=1 AND processing_error IS NOT NULL AND trim(processing_error)<>''"
 };
 if(item.source==='clinical_case_outbox'){
  const source=await DB.prepare("SELECT recipient_user_id,recipient_kind,status FROM clinical_case_outbox WHERE id=?").bind(item.source_id).first();
  if(!source||source.status!=='pending'||source.recipient_user_id!==item.recipient_user_id)return{eligible:false,reason:'event_no_longer_eligible'};
  if(item.recipient_kind==='member'){
   if(source.recipient_kind!=='member'||recipient.user_id!==source.recipient_user_id)return{eligible:false,reason:'recipient_changed'};
   const user=await DB.prepare('SELECT u.id FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=? AND lower(u.email)=lower(?) AND a.email_verified=1').bind(recipient.user_id,recipient.email).first();
   return{eligible:!!user,reason:user?null:'member_no_longer_verified'};
  }
  if(item.recipient_kind==='hq_user'){
   if(source.recipient_kind!=='hq')return{eligible:false,reason:'recipient_changed'};
   const staff=await DB.prepare("SELECT id FROM hq_users WHERE id=? AND lower(email)=lower(?) AND status='active'").bind(source.recipient_user_id,recipient.email).first();
   return{eligible:!!staff,reason:staff?null:'staff_no_longer_active'};
  }
  return{eligible:false,reason:'recipient_kind_changed'};
 }
 if(item.recipient_kind!=='operations'||recipient.user_id!=null||String(recipient.email).toLowerCase()!=='matt@shiftsometimber.co.uk'||!queries[item.source])return{eligible:false,reason:'recipient_changed'};
 const active=await DB.prepare(queries[item.source]).bind(item.source_id).first();
 return{eligible:!!active,reason:active?null:'event_no_longer_eligible'};
}
