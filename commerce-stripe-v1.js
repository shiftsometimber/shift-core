const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']);
const SIZES=new Set(['XS','S','M','L','XL','XXL','3XL','4XL','5XL']);
const SHIRT_SKU='SST-TEE-BLACK-V1';
const SHIRT_PRICE=1000;
const DELIVERY_PRICE=299;
const CURRENCY='gbp';

function json(data,status=200,headers={}){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
}

function corsHeaders(request){
  const origin=request.headers.get('Origin')||'';
  return ALLOWED_ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{};
}

function clean(value,max=300){return String(value??'').trim().slice(0,max)}
function now(){return new Date().toISOString()}
function orderNumber(){return `SST-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`}
function siteUrl(env){return String(env.PUBLIC_SITE_URL||'https://shiftsometimber.co.uk').replace(/\/$/,'')}
async function smallJson(request,maxBytes=8192){
  const declared=Number(request.headers.get('content-length')||0);if(declared>maxBytes)return null;
  const text=await request.text();if(new TextEncoder().encode(text).length>maxBytes)return null;
  try{return JSON.parse(text)}catch{return null}
}

async function ensureCommerceSchema(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS commerce_order_details (
      order_id INTEGER PRIMARY KEY,
      size TEXT NOT NULL,
      delivery_pence INTEGER NOT NULL DEFAULT 0,
      stripe_checkout_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      stripe_payment_status TEXT NOT NULL DEFAULT 'pending',
      shipping_name TEXT,
      shipping_address_json TEXT,
      last_stripe_event_type TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS stripe_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stripe_event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,
      processing_error TEXT
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_commerce_checkout_session ON commerce_order_details(stripe_checkout_session_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_commerce_payment_intent ON commerce_order_details(stripe_payment_intent_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_stripe_events_received ON stripe_events(received_at)'),
    env.DB.prepare(`INSERT INTO products(name,sku,product_type,price_pence,status,description,created_at,updated_at)
      VALUES('Shift Some Timber T-shirt',?,'physical',?,'active','Shift Some Timber branded T-shirt. Sizes XS to 5XL.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(sku) DO UPDATE SET name=excluded.name,product_type=excluded.product_type,price_pence=excluded.price_pence,status=excluded.status,description=excluded.description,updated_at=CURRENT_TIMESTAMP`).bind(SHIRT_SKU,SHIRT_PRICE)
  ]);
}

function stripeForm(order,size,quantity,env){
  const form=new URLSearchParams();
  const put=(key,value)=>form.append(key,String(value));
  put('mode','payment');
  put('managed_payments[enabled]','false');
  put('payment_method_types[0]','card');
  put('success_url',`${siteUrl(env)}/order-success.html?session_id={CHECKOUT_SESSION_ID}`);
  put('cancel_url',`${siteUrl(env)}/shop.html?checkout=cancelled`);
  put('client_reference_id',order.order_number);
  put('customer_creation','always');
  put('billing_address_collection','required');
  put('shipping_address_collection[allowed_countries][0]','GB');
  put('phone_number_collection[enabled]','true');
  put('submit_type','pay');
  put('metadata[order_number]',order.order_number);
  put('metadata[sku]',SHIRT_SKU);
  put('metadata[size]',size);
  put('payment_intent_data[metadata][order_number]',order.order_number);
  put('line_items[0][price_data][currency]',CURRENCY);
  put('line_items[0][price_data][unit_amount]',SHIRT_PRICE);
  put('line_items[0][price_data][product_data][name]','Shift Some Timber T-shirt');
  put('line_items[0][price_data][product_data][description]',`Size ${size}`);
  put('line_items[0][quantity]',quantity);
  put('shipping_options[0][shipping_rate_data][type]','fixed_amount');
  put('shipping_options[0][shipping_rate_data][fixed_amount][amount]',DELIVERY_PRICE);
  put('shipping_options[0][shipping_rate_data][fixed_amount][currency]',CURRENCY);
  put('shipping_options[0][shipping_rate_data][display_name]','UK delivery');
  return form;
}

async function createCheckout(request,env){
  if(!env.STRIPE_SECRET_KEY)return json({ok:false,error:'payments_not_configured'},503,corsHeaders(request));
  const stripeMode=String(env.STRIPE_MODE||'test').toLowerCase();
  if(stripeMode==='test'&&!String(env.STRIPE_SECRET_KEY).startsWith('sk_test_'))return json({ok:false,error:'stripe_mode_mismatch'},503,corsHeaders(request));
  if(stripeMode==='live'&&!String(env.STRIPE_SECRET_KEY).startsWith('sk_live_'))return json({ok:false,error:'stripe_mode_mismatch'},503,corsHeaders(request));
  const body=await smallJson(request);
  const size=clean(body?.size,5).toUpperCase();
  const quantity=Number(body?.quantity??1);
  if(!SIZES.has(size)||!Number.isInteger(quantity)||quantity<1||quantity>5)return json({ok:false,error:'invalid_product_selection'},400,corsHeaders(request));

  await ensureCommerceSchema(env);
  const product=await env.DB.prepare('SELECT id FROM products WHERE sku=? AND status=?').bind(SHIRT_SKU,'active').first();
  if(!product)return json({ok:false,error:'product_unavailable'},409,corsHeaders(request));

  const createdAt=now(),number=orderNumber(),subtotal=SHIRT_PRICE*quantity,total=subtotal+DELIVERY_PRICE;
  const inserted=await env.DB.prepare(`INSERT INTO orders(order_number,product_id,quantity,subtotal_pence,total_pence,currency,status,payment_status,notes,created_at,updated_at) VALUES(?,?,?,?,?,'GBP','new','pending',?,?,?)`)
    .bind(number,product.id,quantity,subtotal,total,JSON.stringify({size,channel:'stripe_checkout'}),createdAt,createdAt).run();
  const orderId=inserted.meta.last_row_id;
  await env.DB.prepare(`INSERT INTO commerce_order_details(order_id,size,delivery_pence,created_at,updated_at) VALUES(?,?,?,?,?)`)
    .bind(orderId,size,DELIVERY_PRICE,createdAt,createdAt).run();

  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{
    method:'POST',
    headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':number},
    body:stripeForm({order_number:number},size,quantity,env)
  });
  const session=await response.json().catch(()=>null);
  if(!response.ok||!session?.id||!session?.url){
    await env.DB.prepare(`UPDATE orders SET status='cancelled',payment_status='failed',updated_at=? WHERE id=?`).bind(now(),orderId).run();
    console.error('stripe_checkout_create_failed',{orderNumber:number,status:response.status,type:session?.error?.type||'unknown'});
    const diagnostic=stripeMode==='test'?{stripeCode:clean(session?.error?.code||session?.error?.type,100),stripeParam:clean(session?.error?.param,160),stripeMessage:clean(session?.error?.message,300)}:undefined;
    return json({ok:false,error:'checkout_unavailable',...(diagnostic?{diagnostic}:{})},502,corsHeaders(request));
  }
  await env.DB.prepare(`UPDATE commerce_order_details SET stripe_checkout_session_id=?,updated_at=? WHERE order_id=?`).bind(session.id,now(),orderId).run();
  return json({ok:true,checkoutUrl:session.url,orderNumber:number},201,corsHeaders(request));
}

function hexToBytes(value){
  if(!/^[a-f0-9]{64}$/i.test(value))return null;
  return Uint8Array.from(value.match(/.{2}/g),byte=>Number.parseInt(byte,16));
}

function safeEqual(a,b){
  if(!a||!b||a.length!==b.length)return false;
  let different=0;for(let i=0;i<a.length;i++)different|=a[i]^b[i];return different===0;
}

export async function validStripeSignature(payload,header,secret,clockSeconds=Math.floor(Date.now()/1000)){
  const parts=String(header||'').split(',').map(part=>part.split('=',2));
  const timestamp=Number(parts.find(([key])=>key==='t')?.[1]||0);
  const signatures=parts.filter(([key])=>key==='v1').map(([,value])=>hexToBytes(value)).filter(Boolean);
  if(!timestamp||Math.abs(clockSeconds-timestamp)>300||!signatures.length)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const expected=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some(signature=>safeEqual(signature,expected));
}

async function completeOrder(env,session,eventType,ctx){
  const number=clean(session?.metadata?.order_number||session?.client_reference_id,80);
  if(!number)return;
  const order=await env.DB.prepare(`SELECT o.*,p.name product_name,d.size FROM orders o JOIN products p ON p.id=o.product_id LEFT JOIN commerce_order_details d ON d.order_id=o.id WHERE o.order_number=?`).bind(number).first();
  if(!order)return;
  if(order.payment_status==='paid')return;
  const details=session.customer_details||{},shipping=session.shipping_details||session.collected_information?.shipping_details||{};
  const email=clean(details.email,320),name=clean(details.name||shipping.name,200),updatedAt=now();
  await env.DB.batch([
    env.DB.prepare(`UPDATE orders SET customer_email=?,customer_name=?,status='paid',payment_status='paid',updated_at=? WHERE id=?`).bind(email,name,updatedAt,order.id),
    env.DB.prepare(`UPDATE commerce_order_details SET stripe_payment_intent_id=?,shipping_name=?,shipping_address_json=?,stripe_payment_status='paid',last_stripe_event_type=?,updated_at=? WHERE order_id=?`).bind(clean(session.payment_intent,200),clean(shipping.name||name,200),JSON.stringify(shipping.address||details.address||{}),eventType,updatedAt,order.id)
  ]);
  if(ctx?.waitUntil)ctx.waitUntil(sendOrderEmails(env,{...order,customer_email:email,customer_name:name}).catch(error=>console.error('order_email_failed',{orderNumber:number,message:error?.message})));
}

async function failOrder(env,event,eventType){
  const object=event.data?.object||{},number=clean(object?.metadata?.order_number||object?.client_reference_id,80);
  if(!number)return;
  const status=eventType==='checkout.session.expired'?'cancelled':'new';
  await env.DB.prepare(`UPDATE orders SET status=?,payment_status='failed',updated_at=? WHERE order_number=? AND payment_status<>'paid'`).bind(status,now(),number).run();
}

async function webhook(request,env,ctx){
  if(!env.STRIPE_WEBHOOK_SECRET)return json({ok:false,error:'webhook_not_configured'},503);
  const declared=Number(request.headers.get('content-length')||0);if(declared>1_000_000)return json({ok:false,error:'payload_too_large'},413);
  const payload=await request.text();
  if(new TextEncoder().encode(payload).length>1_000_000)return json({ok:false,error:'payload_too_large'},413);
  const valid=await validStripeSignature(payload,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET);
  if(!valid)return json({ok:false,error:'invalid_signature'},400);
  const event=JSON.parse(payload),receivedAt=now();
  const result=await env.DB.prepare(`INSERT OR IGNORE INTO stripe_events(stripe_event_id,event_type,payload,received_at) VALUES(?,?,?,?)`).bind(clean(event.id,200),clean(event.type,100),payload,receivedAt).run();
  if(!result.meta.changes)return json({ok:true,duplicate:true});
  try{
    if(event.type==='checkout.session.completed'&&event.data?.object?.payment_status==='paid')await completeOrder(env,event.data.object,event.type,ctx);
    else if(event.type==='checkout.session.async_payment_succeeded')await completeOrder(env,event.data?.object||{},event.type,ctx);
    else if(['checkout.session.async_payment_failed','checkout.session.expired','payment_intent.payment_failed'].includes(event.type))await failOrder(env,event,event.type);
    await env.DB.prepare(`UPDATE stripe_events SET processed_at=? WHERE stripe_event_id=?`).bind(now(),event.id).run();
  }catch(error){
    await env.DB.prepare(`UPDATE stripe_events SET processing_error=? WHERE stripe_event_id=?`).bind(clean(error?.message,1000),event.id).run();
    console.error('stripe_webhook_processing_failed',{eventId:event.id,type:event.type,message:error?.message});
    return json({ok:false,error:'processing_failed'},500);
  }
  return json({ok:true});
}

async function orderStatus(request,env){
  const sessionId=clean(new URL(request.url).searchParams.get('session_id'),200);
  if(!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId))return json({ok:false,error:'invalid_session'},400,corsHeaders(request));
  const order=await env.DB.prepare(`SELECT o.order_number,o.status,o.payment_status FROM commerce_order_details d JOIN orders o ON o.id=d.order_id WHERE d.stripe_checkout_session_id=?`).bind(sessionId).first();
  if(!order)return json({ok:false,error:'order_not_found'},404,corsHeaders(request));
  return json({ok:true,orderNumber:order.order_number,status:order.status,paymentStatus:order.payment_status},200,corsHeaders(request));
}

function escapeHtml(value){return clean(value,500).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

async function sendOrderEmails(env,order){
  if(!env.EMAIL)return;
  const from={email:String(env.AUTH_EMAIL_FROM||'welcome@shiftsometimber.co.uk'),name:'Shift Some Timber'};
  const admin=String(env.ORDER_NOTIFICATION_EMAIL||'orders@shiftsometimber.co.uk');
  const customer=order.customer_email;
  const summary=`${order.product_name} · Size ${order.size} · Quantity ${order.quantity} · £${(order.total_pence/100).toFixed(2)}`;
  const work=[];
  if(customer)work.push(env.EMAIL.send({from,to:customer,subject:`Order confirmed — ${order.order_number}`,html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1>Nice one. Your order is confirmed.</h1><p>Order <strong>${escapeHtml(order.order_number)}</strong></p><p>${escapeHtml(summary)}</p><p>We will email you again when it is dispatched.</p><p>Shift Some Timber</p></div>`,text:`Your order ${order.order_number} is confirmed. ${summary}. We will email you again when it is dispatched.`}));
  work.push(env.EMAIL.send({from,to:admin,subject:`New paid order — ${order.order_number}`,html:`<div style="font-family:Arial,sans-serif"><h1>New paid order</h1><p><strong>${escapeHtml(order.order_number)}</strong></p><p>${escapeHtml(summary)}</p><p>Customer: ${escapeHtml(order.customer_name)} · ${escapeHtml(customer)}</p></div>`,text:`New paid order ${order.order_number}. ${summary}. Customer: ${order.customer_name} ${customer}` }));
  await Promise.all(work);
}

export async function commerceStripeRoutes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(request.method==='OPTIONS'&&path==='/v1/commerce/checkout')return new Response(null,{status:204,headers:corsHeaders(request)});
  if(request.method==='GET'&&path==='/v1/commerce/catalogue')return json({ok:true,product:commerceCatalogue},200,corsHeaders(request));
  if(request.method==='GET'&&path==='/v1/commerce/order-status')return orderStatus(request,env);
  if(request.method==='POST'&&path==='/v1/commerce/checkout')return createCheckout(request,env);
  if(request.method==='POST'&&path==='/v1/commerce/stripe/webhook')return webhook(request,env,ctx);
  return null;
}

export const commerceCatalogue={sku:SHIRT_SKU,name:'Shift Some Timber T-shirt',pricePence:SHIRT_PRICE,deliveryPence:DELIVERY_PRICE,sizes:[...SIZES]};
