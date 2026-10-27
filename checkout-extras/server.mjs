import {BasketError,selection,quoteBasket,sellable,appendExtras} from './model.mjs';
import {ensureExtras} from './schema.mjs';
import {acquireCheckoutAttempt,prepareCheckoutAttempt,requestCheckoutSession,checkoutProblem} from '../checkout-attempt-v1.mjs';
import {ensureOrderReferenceRegistry} from '../order-reference-v1.js';
const enabled=env=>env.SUPPLEMENTS_CHECKOUT_ENABLED==='true';
export async function offersFor(env){
 if(!enabled(env))return [];
 await ensureExtras(env.DB);return (await env.DB.prepare('SELECT * FROM supplement_checkout_offers ORDER BY id').all()).results||[];
}
export async function quoteExtras(env,lines){return quoteBasket(lines,await offersFor(env),{enabled:enabled(env)});}
export async function recommendations(env){
 // General merchandising only: no answers, symptoms, dose or clinical data.
 const rows=(await env.DB.prepare("SELECT id,name,brand,shift_says FROM supplement_products WHERE visibility='proposed' AND checkout_recommendation=1 ORDER BY checkout_priority,id LIMIT 2").all()).results||[];
 const offers=await offersFor(env);
 return rows.map(p=>{const offer=offers.find(o=>o.id===p.id),available=sellable(offer,enabled(env));return {id:p.id,name:p.name,brand:p.brand,shiftSays:p.shift_says,url:'/shift-health/supplements-nutrition?product='+encodeURIComponent(p.id),image:'/shift-health/assets/'+p.id+'.webp',available,...(available?{pack:offer.pack_label,unitPence:offer.price_pence,deliveryPence:offer.delivery_pence,revision:offer.revision}:{})};});
}
export function extraGuards(quote){
 const sql=[],args=[];
 for(const item of quote.items){sql.push("EXISTS(SELECT 1 FROM supplement_checkout_offers WHERE id=? AND revision=? AND active=1 AND labels_verified=1 AND fulfilment_verified=1 AND delivery_scope='GB_ALL' AND stock_quantity-reserved>=? AND julianday(valid_until)>julianday('now'))");args.push(item.id,item.revision,item.quantity);}
 return {sql:sql.length?sql.join(' AND '):'1=1',args};
}
export function reserveExtras(DB,quote,number,userId,channel,guard){
 if(!quote.items.length)return [];
 return [DB.prepare(`INSERT INTO supplement_checkout_orders(order_number,user_id,channel,quote_json,total_pence) SELECT ?,?,?,?,? WHERE ${guard}`).bind(number,userId,channel,JSON.stringify(quote),quote.totalPence),...quote.items.map(p=>DB.prepare(`UPDATE supplement_checkout_offers SET reserved=reserved+? WHERE id=? AND ${guard}`).bind(p.quantity,p.id))];
}
// Added to the SAME D1 transaction as the existing medicine settlement.
// No supplier API call is made until a verified paid event is recorded.
export async function settlementExtras(DB,number,{paid=false,failed=false,session}){
 if(!paid&&!failed)return [];
 const order=await DB.prepare('SELECT * FROM supplement_checkout_orders WHERE order_number=?').bind(number).first();
 if(!order)return [];
 if(order.stripe_session_id&&order.stripe_session_id!==session.id)throw new BasketError('payment_mismatch','Payment session does not match this order.',503);
 const quote=JSON.parse(order.quote_json),pending="status IN ('pending','checkout_open')",payable="status IN ('pending','checkout_open','failed','expired')",statements=[];
 const shipping=session.collected_information?.shipping_details||session.shipping_details||null;
 const shippingJSON=JSON.stringify(shipping);
 if(paid){
  // All authorised GB delivery destinations have a confirmed all-GB tariff.
  // An address must exist before this order may enter the supplier queue.
  for(const p of quote.items)statements.push(DB.prepare(`UPDATE supplement_checkout_offers SET stock_quantity=stock_quantity-?,reserved=MAX(0,reserved-CASE WHEN EXISTS(SELECT 1 FROM supplement_checkout_orders WHERE order_number=? AND ${pending}) THEN ? ELSE 0 END) WHERE id=? AND EXISTS(SELECT 1 FROM supplement_checkout_orders WHERE order_number=? AND ${payable})`).bind(p.quantity,number,p.quantity,p.id,number));
  if(shipping?.address?.country==='GB')statements.push(DB.prepare(`INSERT OR IGNORE INTO supplement_fulfilment_queue(order_number,user_id,quote_json,shipping_json) SELECT order_number,user_id,quote_json,? FROM supplement_checkout_orders WHERE order_number=? AND ${payable}`).bind(shippingJSON,number));
  statements.push(DB.prepare(`UPDATE supplement_checkout_orders SET status=?,stripe_session_id=?,shipping_json=?,updated_at=CURRENT_TIMESTAMP WHERE order_number=? AND ${payable}`).bind(shipping?.address?.country==='GB'?'paid':'paid_address_review',session.id,shippingJSON,number));
 }else if(failed){
  for(const p of quote.items)statements.push(DB.prepare(`UPDATE supplement_checkout_offers SET reserved=MAX(0,reserved-?) WHERE id=? AND EXISTS(SELECT 1 FROM supplement_checkout_orders WHERE order_number=? AND ${pending})`).bind(p.quantity,p.id,number));
  statements.push(DB.prepare(`UPDATE supplement_checkout_orders SET status='failed',updated_at=CURRENT_TIMESTAMP WHERE order_number=? AND ${pending}`).bind(number));
 }
 return statements;
}
export async function extrasRoutes(request,env,helpers){
 const path=new URL(request.url).pathname;
 if(!['/v1/commerce/basket-quote','/v1/commerce/supplements-checkout','/v1/commerce/supplements-order-status'].includes(path))return null;
 const {member,json,cors,body,siteUrl,sha256}=helpers,headers=cors(request),origin=request.headers.get('Origin');
 if(!['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(origin))return json({ok:false,error:'origin_not_allowed'},403);
 if(path==='/v1/commerce/supplements-order-status'&&request.method==='GET'){
  const user=await member(request,env);if(!user)return json({ok:false,error:'account_required'},401,headers);
  const session=new URL(request.url).searchParams.get('session_id');if(!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(session||''))return json({ok:false,error:'invalid_session'},400,headers);
  const order=await env.DB.prepare('SELECT order_number,status,total_pence FROM supplement_checkout_orders WHERE stripe_session_id=? AND user_id=?').bind(session,user.id).first();
  return order?json({ok:true,orderNumber:order.order_number,paymentStatus:['paid','paid_address_review'].includes(order.status)?'paid':order.status,totalPence:order.total_pence},200,headers):json({ok:false,error:'not_found'},404,headers);
 }
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405,headers);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({ok:false,error:'json_required'},415,headers);
 const user=await member(request,env);if(!user)return json({ok:false,error:'account_required'},401,headers);
 try{
  const input=await body(request);if(!input||!Object.hasOwn(input,'items'))throw new BasketError('invalid_basket','Check the basket.',400);
  const accountReference=await sha256('basket-owner:'+user.id);
  if(input.accountReference&&input.accountReference!==accountReference)return json({ok:false,error:'account_changed',message:'Your account changed. Reload before checking out.'},409,headers);
  const lines=selection(input.items);let quote;
  if(path.endsWith('basket-quote')){
   quote=await quoteExtras(env,lines);let treatment=null;
   if(input.treatmentVariantId!==undefined){
    if(!Number.isSafeInteger(input.treatmentVariantId)||input.treatmentVariantId<1)throw new BasketError('invalid_variant','Check your treatment selection.',400);
    const selected=await env.DB.prepare('SELECT v.id,v.selling_price_pence,m.name,v.strength_label FROM medicine_variants v JOIN medicine_products m ON m.id=v.medicine_id WHERE v.id=?').bind(input.treatmentVariantId).first();
    if(!selected||!Number.isSafeInteger(selected.selling_price_pence)||selected.selling_price_pence<0)throw new BasketError('treatment_price_unavailable','Your treatment price could not be checked.');
    treatment={variantId:selected.id,label:selected.name+' · '+selected.strength_label,totalPence:selected.selling_price_pence};
   }
   const recs=await recommendations(env);const products=(await offersFor(env)).filter(p=>sellable(p,enabled(env))).map(p=>({id:p.id,name:p.name,pack:p.pack_label,unitPence:p.price_pence,deliveryPence:p.delivery_pence,revision:p.revision}));return json({ok:true,accountReference,treatment,quote:{...quote,items:quote.items.map(({sku,...item})=>item)},recommendations:recs,products,purchasingEnabled:enabled(env)},200,headers);
  }
  if(input.accountReference!==accountReference)return json({ok:false,error:'account_changed',message:'Check the basket in your current account.'},409,headers);
  if(!enabled(env))throw new BasketError('extras_not_open','Supplement ordering is not open yet.');
  if(!lines.length)throw new BasketError('empty_basket','Add a product before checking out.',400);
  if(user.email_verified!==1)return json({ok:false,error:'email_verification_required'},403,headers);
  if(!env.STRIPE_SECRET_KEY||!['test','live'].includes(env.STRIPE_MODE)||!String(env.STRIPE_SECRET_KEY).startsWith(env.STRIPE_MODE==='live'?'sk_live_':'sk_test_'))return json({ok:false,error:'payments_not_configured'},503,headers);
  const acquired=await acquireCheckoutAttempt(env.DB,{userId:user.id,channel:'supplements',selection:lines});
  if(acquired.conflict)return json(checkoutProblem({error:'checkout_selection_conflict'}),409,headers);
  let attempt=acquired.attempt;
  if(attempt.state==='preparing'){
   try{quote=await quoteExtras(env,lines);}catch(error){await env.DB.prepare("UPDATE checkout_attempts SET active=0,state='unavailable' WHERE id=? AND state='preparing'").bind(attempt.id).run();throw error;}
   const form=appendExtras(new URLSearchParams({mode:'payment',expires_at:String(Math.floor(Date.now()/1000)+1800),success_url:siteUrl(env)+'/shift-health/supplements-nutrition?supplements_session={CHECKOUT_SESSION_ID}',cancel_url:siteUrl(env)+'/shift-health/supplements-nutrition?checkout=cancelled',customer_email:user.email,billing_address_collection:'required',client_reference_id:attempt.order_number,'metadata[order_type]':'supplements','metadata[order_number]':attempt.order_number,'metadata[user_id]':String(user.id),'payment_intent_data[metadata][order_type]':'supplements','payment_intent_data[metadata][order_number]':attempt.order_number}),quote,0);
   const guard=extraGuards(quote);await ensureOrderReferenceRegistry(env.DB);
   attempt=await prepareCheckoutAttempt(env.DB,attempt,{availableSql:guard.sql,availableArgs:guard.args,form,statements:g=>[...reserveExtras(env.DB,quote,attempt.order_number,user.id,'supplements',g),env.DB.prepare(`INSERT INTO order_reference_registry(order_number,channel,user_id,source_table,source_id,status,created_at,updated_at) SELECT ?,'other',?,'supplement_checkout_orders',(SELECT id FROM supplement_checkout_orders WHERE order_number=?),'pending',?,? WHERE ${g}`).bind(attempt.order_number,user.id,attempt.order_number,new Date().toISOString(),new Date().toISOString())]});
   if(attempt.state==='preparing'){
    await env.DB.prepare("UPDATE checkout_attempts SET active=0,state='unavailable' WHERE id=? AND state='preparing'").bind(attempt.id).run();throw new BasketError('extra_stock_changed','Stock or prices changed. Review your basket.');
   }
  }
  const session=await requestCheckoutSession(env,attempt);if(!session.ok)return json(checkoutProblem(session),session.status,headers);
  await env.DB.prepare("UPDATE supplement_checkout_orders SET stripe_session_id=?,status=CASE WHEN status='pending' THEN 'checkout_open' ELSE status END WHERE order_number=?").bind(session.id,attempt.order_number).run();
  const stored=await env.DB.prepare('SELECT total_pence FROM supplement_checkout_orders WHERE order_number=? AND user_id=?').bind(attempt.order_number,user.id).first();
  return json({ok:true,checkoutUrl:session.url,orderNumber:attempt.order_number,totalPence:stored.total_pence},201,headers);
 }catch(error){if(error instanceof BasketError)return json({ok:false,error:error.code,message:error.message},error.status,headers);throw error;}
}
export async function supplementsWebhook(request,env,{validSignature,json}){
 const payload=await request.clone().text(),event=JSON.parse(payload||'null'),session=event?.data?.object;
 if(session?.metadata?.order_type!=='supplements')return null;
 if(!env.STRIPE_WEBHOOK_SECRET||!await validSignature(payload,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET))return json({ok:false,error:'invalid_signature'},400);
 await ensureExtras(env.DB);
 const number=String(session.metadata.order_number||''),order=await env.DB.prepare('SELECT * FROM supplement_checkout_orders WHERE order_number=?').bind(number).first();
 if(!order)return json({ok:false,error:'order_not_found'},503);
 const paid=['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&session.payment_status==='paid',failed=['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type);
 if(paid&&(session.amount_total!==order.total_pence||session.currency!=='gbp'))return json({ok:false,error:'payment_amount_mismatch'},503);
 if(!paid&&!failed)return json({ok:true});
 // Paid/failed state predicates make concurrent distinct webhook events idempotent.
 await env.DB.batch([...(await settlementExtras(env.DB,number,{paid,failed,session})),env.DB.prepare("UPDATE checkout_attempts SET active=0,state=? WHERE order_number=?").bind(paid?'paid':'expired',number),env.DB.prepare("UPDATE order_reference_registry SET status=?,updated_at=CURRENT_TIMESTAMP WHERE order_number=? AND status IN ('pending','checkout_open','failed','expired')").bind(paid?'paid':'failed',number),env.DB.prepare('INSERT OR IGNORE INTO supplement_checkout_events(event_id) VALUES(?)').bind(event.id)]);
 return json({ok:true});
}
