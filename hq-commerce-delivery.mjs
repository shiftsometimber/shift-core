// Existing shop service mail only. This module creates no triggers or new content.
export const commerceDeliveryDDL=`CREATE TABLE IF NOT EXISTS commerce_service_delivery(event_key TEXT PRIMARY KEY,order_id INTEGER NOT NULL,event_type TEXT NOT NULL,recipient_hash TEXT NOT NULL,template_version TEXT NOT NULL,payload_hash TEXT NOT NULL,status TEXT NOT NULL,provider_id TEXT,error_code TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`;
const digest=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function sendTrackedCommerceEmail(env,{order,type,message,now=new Date()}){
 if(!['dispatch','refund'].includes(type)||!Number.isSafeInteger(order.id)||order.id<1)throw Error('commerce_delivery_reference_required');
 const DB=env.DB,at=now.toISOString(),key='shop:'+order.id+':'+type;
 await DB.prepare(commerceDeliveryDDL).run();
 const current=await DB.prepare('SELECT id,user_id,customer_email,status,payment_status FROM orders WHERE id=?').bind(order.id).first();
 const recipient=String(message.to||'').trim().toLowerCase();
 let eligible=!!current&&String(current.customer_email||'').trim().toLowerCase()===recipient&&(type==='dispatch'?['dispatched','fulfilled'].includes(current.status):current.payment_status==='refunded');
 if(eligible&&current.user_id!=null)eligible=!!await DB.prepare('SELECT id FROM users WHERE id=? AND lower(email)=?').bind(current.user_id,recipient).first();
 await DB.prepare("INSERT OR IGNORE INTO commerce_service_delivery(event_key,order_id,event_type,recipient_hash,template_version,payload_hash,status,error_code,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(key,order.id,type,await digest(recipient),'shop-'+type+'-v1',await digest(JSON.stringify(message)),eligible?'queued':'suppressed',eligible?null:'recipient_or_order_changed',at,at).run();
 if(!eligible){await DB.prepare("UPDATE commerce_service_delivery SET status='suppressed',error_code='recipient_or_order_changed',updated_at=? WHERE event_key=? AND status='queued'").bind(at,key).run();return{status:'suppressed',sent:false}}
 if(!env.EMAIL){await DB.prepare("UPDATE commerce_service_delivery SET error_code='email_binding_unavailable',updated_at=? WHERE event_key=? AND status='queued'").bind(at,key).run();return{status:'queued',sent:false}}
 const claim=await DB.prepare("UPDATE commerce_service_delivery SET status='attempted',error_code=NULL,updated_at=? WHERE event_key=? AND status='queued' AND recipient_hash=? AND payload_hash=?").bind(at,key,await digest(recipient),await digest(JSON.stringify(message))).run();
 if(Number(claim.meta.changes)!==1){const existing=await DB.prepare('SELECT status,provider_id FROM commerce_service_delivery WHERE event_key=?').bind(key).first();return{status:existing?.status||'unknown',providerId:existing?.provider_id||null,sent:false,duplicatePrevented:true}}
 // Query again after claim, immediately before the external request.
 const live=await DB.prepare('SELECT customer_email,user_id,status,payment_status FROM orders WHERE id=?').bind(order.id).first();
 const identity=live?.user_id==null||!!await DB.prepare('SELECT id FROM users WHERE id=? AND lower(email)=?').bind(live.user_id,recipient).first();
 if(!live||String(live.customer_email||'').toLowerCase()!==recipient||!identity||(type==='dispatch'?!['dispatched','fulfilled'].includes(live.status):live.payment_status!=='refunded')){await DB.prepare("UPDATE commerce_service_delivery SET status='suppressed',error_code='recipient_or_order_changed',updated_at=? WHERE event_key=?").bind(at,key).run();return{status:'suppressed',sent:false}}
 try{
  const result=await env.EMAIL.send(message),providerId=result?.messageId||result?.id||null;
  // Provider acceptance remains acceptance even if evidence persistence fails.
  try{await DB.prepare("UPDATE commerce_service_delivery SET status='provider_accepted',provider_id=?,updated_at=? WHERE event_key=?").bind(providerId,new Date().toISOString(),key).run();return{status:'provider_accepted',providerId,sent:true,auditRecorded:true}}
  catch{return{status:'provider_accepted',providerId,sent:true,auditRecorded:false}}
 }catch{await DB.prepare("UPDATE commerce_service_delivery SET status='unknown',error_code='provider_acceptance_requires_reconciliation',updated_at=? WHERE event_key=? AND status='attempted'").bind(new Date().toISOString(),key).run().catch(()=>{});return{status:'unknown',sent:false}}
}
