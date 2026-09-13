// Explicit patient cancellation before clinical acceptance, or after decline.
// Stripe idempotency key is stable per order; pending is never labelled refunded.
export async function patientRefund(request,env,order,user){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
 await env.DB.exec("CREATE TABLE IF NOT EXISTS patient_refunds_v2(order_number TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'requested',stripe_refund_id TEXT,updated_at TEXT NOT NULL)");
 let refund=await env.DB.prepare('SELECT * FROM patient_refunds_v2 WHERE order_number=?').bind(order.order_number).first();
 if(refund?.status==='succeeded')return json({ok:true,status:'refunded',message:'Stripe has confirmed the refund. Your bank may take time to display it.'});
 if(!order.stripe_payment_intent_id||!env.STRIPE_SECRET_KEY)return json({error:'Refund service is not available. Please contact support with your order number.'},503);
 if(!refund){
  if(order.status!=='paid')return json({error:'This order is not eligible for a payment refund.'},409);
  const permitted=['assessment_pending','declined'].includes(order.clinical_status);
  if(!permitted)return json({error:'Please contact support to review cancellation of this order.'},409);
  // The same row lease prevents cancellation racing an active pharmacy transfer.
  const changed=await env.DB.prepare("UPDATE patient_intakes_v2 SET status='refund_pending',updated_at=? WHERE order_number=? AND (lease_until IS NULL OR lease_until<?) AND (status IN ('draft','queued') OR (?='declined' AND status='submitted'))").bind(new Date().toISOString(),order.order_number,new Date().toISOString(),order.clinical_status).run();
  if(!changed.meta.changes)return json({error:'The pharmacy is receiving or reviewing this assessment. Please contact support before cancelling.'},409);
  await env.DB.prepare("INSERT OR IGNORE INTO patient_refunds_v2(order_number,status,updated_at) VALUES(?,'requested',?)").bind(order.order_number,new Date().toISOString()).run();
  await env.DB.prepare("UPDATE medicine_orders SET clinical_status='refund_pending' WHERE order_number=?").bind(order.order_number).run();
 }
 try{
  const headers={authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'content-type':'application/x-www-form-urlencoded','idempotency-key':`patient-refund-v2:${order.order_number}`};
  const url=refund?.stripe_refund_id?`https://api.stripe.com/v1/refunds/${encodeURIComponent(refund.stripe_refund_id)}`:'https://api.stripe.com/v1/refunds';
  const r=await fetch(url,{method:refund?.stripe_refund_id?'GET':'POST',headers,...(refund?.stripe_refund_id?{}:{body:new URLSearchParams({payment_intent:order.stripe_payment_intent_id,amount:String(order.total_pence),'metadata[order_number]':order.order_number})}),signal:AbortSignal.timeout(15000)});
  const b=await r.json();if(!r.ok||!b.id)throw Error();
  if(b.payment_intent!==order.stripe_payment_intent_id||Number(b.amount)!==Number(order.total_pence)||b.currency!=='gbp')throw Error();
  const succeeded=b.status==='succeeded',status=succeeded?'refunded':'refund_pending';
  await env.DB.batch([env.DB.prepare('UPDATE patient_refunds_v2 SET status=?,stripe_refund_id=?,updated_at=? WHERE order_number=?').bind(b.status,b.id,new Date().toISOString(),order.order_number),env.DB.prepare('UPDATE medicine_orders SET clinical_status=?,status=CASE WHEN ? THEN \'refunded\' ELSE status END,updated_at=? WHERE order_number=?').bind(status,succeeded?1:0,new Date().toISOString(),order.order_number)]);
  await env.DB.prepare('INSERT INTO patient_intake_audit_v2(order_number,user_id,action,created_at) VALUES(?,?,?,?)').bind(order.order_number,user.id,`refund.${b.status}`,new Date().toISOString()).run();
  return json({ok:true,status,message:succeeded?'Stripe has confirmed the full treatment refund. Your bank may take time to display it.':['failed','canceled'].includes(b.status)?'The refund needs support attention. Contact us with your order number.':'Your refund is pending with Stripe. Check its status here; do not submit another payment.'});
 }catch{return json({ok:true,status:'refund_pending',message:'Your cancellation is recorded. Refund confirmation is not yet available. Retry here or contact support; no second payment is needed.'},202)}
}
