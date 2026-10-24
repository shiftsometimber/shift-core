// Join the existing owner-review pipeline. No sender, new schedule or auto-approval.
export function orderNotificationReviewStatements(env,order,event){
 if(env.PARTNER_NOTIFICATION_REVIEW_ENABLED!=='true')return[];
 const q=(s,...a)=>env.DB.prepare(s).bind(...a),link="'/member/treatment-records?record='||r.id";
 return[
  q("UPDATE clinical_case_outbox SET status='superseded' WHERE recipient_kind='member' AND recipient_user_id=? AND status='pending' AND event_id IN (SELECT id FROM partner_audit WHERE entity_type='order' AND entity_id=? AND id<>?) AND EXISTS(SELECT 1 FROM partner_audit WHERE id=?)",order.memberId,order.orderNumber,event.id,event.id),
  q("INSERT OR IGNORE INTO clinical_case_outbox SELECT ?,?,?, 'member',?,"+link+",'pending',? FROM clinical_member_records r WHERE r.order_number=? AND r.user_id=? AND EXISTS(SELECT 1 FROM partner_audit WHERE id=?) ORDER BY r.updated_at DESC LIMIT 1",'partner:'+event.id,event.id,order.memberId,order.status==='query'&&!order.memberReply?'member_action_needed':'member_case_update',event.at,order.orderNumber,order.memberId,event.id),
  q("UPDATE partner_notification_outbox SET status='review_only' WHERE event_id=? AND EXISTS(SELECT 1 FROM clinical_case_outbox WHERE id=? AND status='pending')",event.id,'partner:'+event.id)
 ];
}
export function supersedeAnsweredQueryStatement(env,order,eventId){
 if(env.PARTNER_NOTIFICATION_REVIEW_ENABLED!=='true')return[];
 return[env.DB.prepare("UPDATE clinical_case_outbox SET status='superseded' WHERE recipient_kind='member' AND recipient_user_id=? AND event_id=? AND status='pending' AND EXISTS(SELECT 1 FROM partner_audit WHERE id=?)").bind(order.memberId,order.queryId,eventId)];
}
