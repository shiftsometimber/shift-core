// Invoked immediately before transport for event-linked drafts only.
// Existing independently approved manual drafts retain their current path.
export async function eventDeliveryEligibility(DB,payload,draftId,recipient,now=new Date()){
 try{return await checkEvent(DB,payload,draftId,recipient,now)}catch{return{eligible:false,reason:'event_source_unavailable'}}
}
async function checkEvent(DB,payload,draftId,recipient,now){
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
 if(item.source==='partner_notification_outbox'){
  if(item.recipient_kind!=='member'||recipient.user_id!==item.recipient_user_id)return{eligible:false,reason:'recipient_changed'};
  const source=await DB.prepare("SELECT o.id FROM partner_notification_outbox o JOIN partner_audit a ON a.id=o.event_id WHERE o.id=? AND o.member_id=? AND o.status='draft' AND o.template='order_status_update'").bind(item.source_id,recipient.user_id).first();
  const user=await DB.prepare('SELECT u.id FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=? AND lower(u.email)=lower(?) AND a.email_verified=1').bind(recipient.user_id,recipient.email).first();
  return{eligible:!!source&&!!user,reason:source&&user?null:'event_no_longer_eligible'};
 }
 if(item.source==='clinical_case_outbox'){
  const source=await DB.prepare("SELECT recipient_user_id,recipient_kind,status FROM clinical_case_outbox WHERE id=?").bind(item.source_id).first();
  if(!source||source.status!=='pending'||source.recipient_user_id!==item.recipient_user_id)return{eligible:false,reason:'event_no_longer_eligible'};
  const clinical=await clinicalEventEligibility(DB,item,now);if(!clinical.eligible)return clinical;
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

// Only reference/permission fields are read; no assessment answers or evidence.
export async function clinicalEventEligibility(DB,item,now=new Date()){
 try{
  const row=await DB.prepare("SELECT o.recipient_user_id,o.recipient_kind,o.template,e.record_id,r.user_id,r.review_sharing,s.status FROM clinical_case_outbox o JOIN clinical_case_events e ON e.id=o.event_id JOIN clinical_member_records r ON r.id=e.record_id JOIN clinical_case_state s ON s.record_id=r.id WHERE o.id=? AND o.status='pending'").bind(item.source_id).first();
  if(!row||Number(row.review_sharing)!==1||row.recipient_user_id!==item.recipient_user_id)return{eligible:false,reason:'clinical_consent_or_event_changed'};
  if(item.recipient_kind==='member')return{eligible:row.recipient_kind==='member'&&row.user_id===item.recipient_user_id&&(row.template!=='member_action_needed'||row.status==='needs_information'),reason:'clinical_action_no_longer_required'};
  if(item.recipient_kind!=='hq_user'||row.recipient_kind!=='hq'||!['awaiting_review','in_review','needs_information'].includes(row.status))return{eligible:false,reason:'clinical_action_no_longer_required'};
  const assigned=await DB.prepare("SELECT a.hq_user_id FROM clinical_case_assignments a JOIN clinical_hq_staff h ON h.user_id=a.hq_user_id WHERE a.record_id=? AND a.hq_user_id=? AND a.active=1 AND a.expires_at>? AND h.active=1 AND h.role='clinician' AND h.expires_at>? AND h.verified_by IS NOT NULL AND trim(h.verified_by)<>'' AND h.registration_body IS NOT NULL AND trim(h.registration_body)<>'' AND h.registration_number IS NOT NULL AND trim(h.registration_number)<>''").bind(row.record_id,item.recipient_user_id,now.toISOString(),now.toISOString()).first();
  return{eligible:!!assigned,reason:'clinical_assignment_no_longer_active'};
 }catch{return{eligible:false,reason:'clinical_source_unavailable'}}
}

export async function intentSourceEligibility(DB,item,now=new Date()){
 try{
  if(item.source==='clinical_case_outbox')return await clinicalEventEligibility(DB,item,now);
  const queries={partner_notification_outbox:"SELECT o.id FROM partner_notification_outbox o JOIN partner_audit a ON a.id=o.event_id WHERE o.id=? AND o.member_id=? AND o.status='draft' AND o.template='order_status_update'",data_requests:"SELECT id FROM data_requests WHERE id=? AND request_type='deletion' AND status NOT IN ('completed','cancelled')",support_tickets:"SELECT id FROM support_tickets WHERE id=? AND priority IN ('urgent','high') AND status NOT IN ('closed','resolved')",integration_webhooks:"SELECT id FROM integration_webhooks WHERE id=? AND signature_valid=1 AND processing_error IS NOT NULL AND trim(processing_error)<>''"};
  if(!queries[item.source])return{eligible:null,reason:'source_contract_unavailable'};
  const row=await DB.prepare(queries[item.source]).bind(item.source_id,...(item.source==='partner_notification_outbox'?[item.recipient_user_id]:[])).first();return{eligible:!!row,reason:row?null:'event_no_longer_eligible'};
 }catch{return{eligible:null,reason:'source_unavailable'}}
}
