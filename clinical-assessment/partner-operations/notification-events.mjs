// Canonical patient-facing events; never expose medical answers/private notes on lock screens.
export const NOTIFICATION_KINDS=new Set(['assessment_submitted','evidence_uploaded','review_started','evidence_reviewed','information_requested','clinical_decision','member_reply','app_updates_reviewed','prescription_received','fulfilment_accept','fulfilment_query','fulfilment_reject','fulfilment_prepare','fulfilment_dispatch','fulfilment_delivered','fulfilment_delivery_exception','fulfilment_returned','fulfilment_cancel','member_fulfilment_reply']);
const CHANNELS=['email','whatsapp','app'];
const q=(env,s,...a)=>env.DB.prepare(s).bind(...a);
export function notificationContent(kind){
 const titles={assessment_submitted:'Your assessment has been received',evidence_uploaded:'Your document has been received',review_started:'Your clinical review has started',evidence_reviewed:'Your document review has been updated',information_requested:'Action needed: check My Shift',clinical_decision:'Your clinical review has been updated',member_reply:'Your reply has been received',app_updates_reviewed:'Your shared updates have been reviewed',prescription_received:'Your prescription handover has been received',fulfilment_accept:'Your order is with the dispensing team',fulfilment_query:'Action needed: check My Shift',fulfilment_reject:'Your supply request has been updated',fulfilment_prepare:'Your order is being prepared',fulfilment_dispatch:'Your order has been dispatched',fulfilment_delivered:'A delivery update has been recorded',fulfilment_delivery_exception:'Action needed: check your delivery update',fulfilment_returned:'A return has been recorded',fulfilment_cancel:'Your supply request has been cancelled',member_fulfilment_reply:'Your reply has been received'};
 if(!NOTIFICATION_KINDS.has(kind))return null;
 return{title:titles[kind],body:'Sign in to My Shift to read the update, see the latest status and check whether anything is needed from you.'};
}
export function notificationEventStatements(env,record,event){
 if(env.NOTIFICATION_EVENTS_ENABLED!=='true')return[];const content=notificationContent(event.kind);if(!content)return[];
 if(!Number.isInteger(record.user_id)||record.user_id<1||!/^[a-f0-9-]{36}$/.test(record.id))throw Error('owned_notification_record_required');
 const sources={case:["EXISTS(SELECT 1 FROM clinical_case_events WHERE id=? AND record_id=?)",[event.sourceId,record.id]],evidence:["EXISTS(SELECT 1 FROM clinical_member_evidence WHERE id=? AND record_id=?)",[event.sourceId,record.id]],assessment:["EXISTS(SELECT 1 FROM clinical_member_versions WHERE record_id=? AND version=? AND submitted=1)",[record.id,event.sourceId]],partner:["EXISTS(SELECT 1 FROM partner_audit WHERE id=? AND entity_type='order' AND entity_id=?)",[event.sourceId,record.order_number]]};
 const guard=sources[event.source];if(!guard)throw Error('unsupported_notification_source');
 const id=event.id,link='/member/treatment-records?record='+record.id;
 const out=[q(env,'INSERT OR IGNORE INTO clinical_notification_events SELECT ?,?,?,?,?,?,?,?,? WHERE '+guard[0]+' AND EXISTS(SELECT 1 FROM clinical_member_records WHERE id=? AND user_id=?)',id,record.user_id,record.id,record.order_number||null,event.kind,content.title,content.body,link,event.at,...guard[1],record.id,record.user_id)];
 for(const channel of CHANNELS)out.push(q(env,"INSERT OR IGNORE INTO clinical_notification_channels SELECT ?,?,'awaiting_approval',NULL,NULL,? WHERE EXISTS(SELECT 1 FROM clinical_notification_events WHERE id=? AND member_id=? AND record_id=? AND kind=?)",id,channel,event.at,id,record.user_id,record.id,event.kind));
 out.push(q(env,"UPDATE clinical_case_outbox SET status='channel_review' WHERE event_id=? AND recipient_user_id=? AND recipient_kind='member' AND status='pending' AND EXISTS(SELECT 1 FROM clinical_notification_events WHERE id=? AND member_id=?)",event.sourceId,record.user_id,id,record.user_id));
 const previousKinds=['member_reply','clinical_decision'].includes(event.kind)?['information_requested']:(event.kind.startsWith('fulfilment_')||event.kind==='member_fulfilment_reply')?['fulfilment_query']:[];
 if(previousKinds.length){
  const previous="SELECT id FROM clinical_notification_events WHERE record_id=? AND member_id=? AND kind=? AND id<>? AND created_at<=? AND EXISTS(SELECT 1 FROM clinical_notification_events WHERE id=? AND record_id=? AND member_id=?)",args=[record.id,record.user_id,previousKinds[0],id,event.at,id,record.id,record.user_id];
  out.push(q(env,"UPDATE clinical_notification_channels SET status='superseded',updated_at=? WHERE status IN ('awaiting_approval','prepared') AND event_id IN ("+previous+")",event.at,...args));
  out.push(q(env,"UPDATE clinical_case_outbox SET status='superseded' WHERE status='pending' AND id IN (SELECT 'channel:'||id||':email' FROM ("+previous+") UNION ALL SELECT 'channel:'||id||':app' FROM ("+previous+"))",...args,...args));
 }
 return out;
}
export async function orderEventStatements(env,order,event){
 if(env.NOTIFICATION_EVENTS_ENABLED!=='true')return[];
 const record=await q(env,'SELECT id,user_id,order_number FROM clinical_member_records WHERE order_number=? AND user_id=? ORDER BY updated_at DESC LIMIT 1',order.orderNumber,order.memberId).first();
 if(!record)return[];
 return notificationEventStatements(env,record,{id:'partner:'+event.id,kind:event.action,source:'partner',sourceId:event.id,at:event.at});
}
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');
// Prepares ordinary drafts in the EXISTING communications system. Does not approve, schedule, publish or send.
export async function prepareEventChannels(env,eventId,actor,sessionGuard,date=new Date().toISOString()){
 if(env.NOTIFICATION_EVENTS_ENABLED!=='true')throw Object.assign(Error('notification_events_not_enabled'),{status:503});
 if(actor.role!=='owner'||!actor.mfa)throw Object.assign(Error('owner_mfa_required'),{status:403});
 const access=sessionGuard();if(!await q(env,'SELECT 1 ok WHERE '+access.sql,...access.args).first())throw Object.assign(Error('access_revoked'),{status:403});
 const event=await q(env,'SELECT * FROM clinical_notification_events WHERE id=?',eventId).first();if(!event)throw Object.assign(Error('notification_event_not_found'),{status:404});
 const recipient=await q(env,'SELECT u.id,u.email,a.email_verified FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?',event.member_id).first();if(!recipient||recipient.email_verified!==1)throw Object.assign(Error('verified_member_required'),{status:409});
 const drafts=[];
 for(const channel of ['email','app']){
  const id=crypto.randomUUID(),sourceId='channel:'+event.id+':'+channel,key='clinical:'+sourceId,payload={notificationEvent:key,channel:channel==='app'?'notification':'email',from:'hq@shiftsometimber.co.uk',replyTo:'hello@shiftsometimber.co.uk',cc:[],bcc:[],recipients:[{email:recipient.email.toLowerCase(),userId:recipient.id,name:'',accountVerified:true}],subject:event.title,body:event.body+'\n\nhttps://shiftsometimber.co.uk'+event.link,scheduledAt:date,attachment:null,push:channel==='app'?{title:'My Shift update',body:'You have an update. Sign in to read it securely.',url:'/member/notifications'}:null,serviceOnly:true};
  const hash=await digest(payload),g=sessionGuard();
  const result=await env.DB.batch([
   q(env,"UPDATE clinical_notification_channels SET status='prepared',draft_id=?,updated_at=? WHERE event_id=? AND channel=? AND status='awaiting_approval' AND "+g.sql+" AND EXISTS(SELECT 1 FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=? AND lower(u.email)=? AND a.email_verified=1)",id,date,event.id,channel,...g.args,recipient.id,recipient.email.toLowerCase()),
   q(env,"INSERT OR IGNORE INTO hq_notification_intents(event_key,source,source_id,occurred_at,recipient_kind,recipient_user_id,template,link,state,draft_id,created_at,updated_at) SELECT ?,'clinical_notification_channels',?,?,'member',?,'member_case_update',?,'prepared',?,?,? WHERE EXISTS(SELECT 1 FROM clinical_notification_channels WHERE event_id=? AND channel=? AND draft_id=?)",key,event.id,date,event.member_id,event.link,id,date,date,event.id,channel,id),
   q(env,"INSERT INTO hq_comms_drafts(id,hash,payload_json,status,scheduled_at,created_by,created_at) SELECT ?,?,?,'draft',?,?,? WHERE EXISTS(SELECT 1 FROM clinical_notification_channels WHERE event_id=? AND channel=? AND draft_id=?)",id,hash,JSON.stringify(payload),date,actor.id,date,event.id,channel,id),
   q(env,"INSERT INTO hq_comms_recipients(draft_id,email,user_id,status) SELECT ?,?,?,'pending' WHERE EXISTS(SELECT 1 FROM hq_comms_drafts WHERE id=?)",id,recipient.email.toLowerCase(),recipient.id,id),
   q(env,"INSERT INTO hq_comms_audit(draft_id,actor_id,action,at) SELECT ?,?,'event_channel_draft_prepared',? WHERE EXISTS(SELECT 1 FROM hq_comms_drafts WHERE id=?)",id,actor.id,date,id)
  ]);
  if(result[0].meta?.changes===1)drafts.push({id,channel,hash,payload,status:'draft',approvalRequired:true});
 }
 return{drafts,whatsapp:{status:'awaiting_approved_template_and_verified_opt_in',text:event.title+'. '+event.body+' https://shiftsometimber.co.uk'+event.link},sent:false,deliveryIntegration:'central_communications_adapter_release_required'};
}
