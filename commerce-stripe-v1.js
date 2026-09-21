import {ensureCheckoutAttempts,acquireCheckoutAttempt,prepareCheckoutAttempt,requestCheckoutSession,checkoutProblem} from './checkout-attempt-v1.mjs';
import {reserveOrderReference,attachOrderReference,updateOrderReferenceStatus,ensureOrderReferenceRegistry} from './order-reference-v1.js';

const ALLOWED_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']);
const APPAREL_SIZES=['XS','S','M','L','XL','XXL','3XL','4XL','5XL'];
const SIZES=new Set(APPAREL_SIZES);
const COLOURS=new Set(['Black','Cream','Ash Green']);
const SHIRT_SKU='SST-TEE-BLACK-V1';
const SHIRT_PRICE=1000;
const DELIVERY_PRICE=299;
const CURRENCY='gbp';
const TIMBER_PRODUCTS=[
  ['SST-HEAVY-TEE','Heavyweight Tee','tees','tee','Black','A proper mid-heavyweight everyday tee. Clean, soft and built to last.',0],
  ['SST-PERF-TEE','Performance Tee','tees','tee','Ash Green','Lighter, breathable kit for training, walking and everything between.',0],
  ['SST-CLASSIC-TEE','Classic Tee','tees','tee','Cream','Understated everyday cotton with the Shift roundel kept deliberately quiet.',0],
  ['SST-HOODIE','Shift Hoodie','layers','hoodie','Ash Green','Heavyweight comfort, clean lines and the layer you will keep reaching for.',0],
  ['SST-VEST','Training Vest','tees','vest','Cream','A comfortable performance vest for warmer sessions and hard graft.',0],
  ['SST-QUARTER-ZIP','Quarter Zip','layers','zip','Black','A smart training layer that works just as well away from the gym.',0],
  ['SST-POLO','Performance Polo','layers','polo','Cream','A proper polo without the golf-club committee meeting energy.',0],
  ['SST-JOGGERS','Shift Joggers','bottoms','joggers','Ash Green','Soft, tapered and made for moving or doing absolutely nothing.',0],
  ['SST-SHORTS','Training Shorts','bottoms','shorts','Black','No-fuss training shorts with enough room to actually move.',0],
  ['SST-GUTS-TEE','Guts Gone Tee','tees','statement','Cream','Strong words. A reminder of what you are building and what you have shifted.',0],
  ['SST-GUTS-HOODIE','Guts Gone Statement Hoodie','layers','statement-hoodie','Ash Green','The Guts Gone message on a premium heavyweight hoodie.',0],
  ['SST-CAP','Shift Cap','accessories','cap','Black','Low-key Shift branding. High-level bad-hair-day management.',1],
  ['SST-CREW-SOCKS','Crew Socks','accessories','crew-socks','Cream','Premium ribbed crew socks, finished with the Shift mark.',0,['S','M','L']],
  ['SST-GYM-BAG','Gym Bag','equipment','bag','Ash Green','Kit in. Excuses out. A durable everyday training bag.',1],
  ['SST-BOTTLE','Water Bottle','equipment','bottle','Cream','Hydration without an inspirational quote down the side.',1],
  ['SST-SHAKER','Shift Shaker','equipment','shaker','Black','A straightforward, leak-resistant shaker with no gimmicks.',1]
].map((row,index)=>({sku:row[0],name:row[1],category:row[2],imageKey:row[3],featuredColour:row[4],description:row[5],oneSize:Boolean(row[6]),pricePence:1000,sortOrder:index+1,colours:[...COLOURS],sizes:row[7]||(row[6]?['One size']:APPAREL_SIZES)}));

function json(data,status=200,headers={}){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
}

function corsHeaders(request){
  const origin=request.headers.get('Origin')||'';
  return ALLOWED_ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{};
}

function clean(value,max=300){return String(value??'').trim().slice(0,max)}
function now(){return new Date().toISOString()}
function siteUrl(env){return String(env.PUBLIC_SITE_URL||'https://shiftsometimber.co.uk').replace(/\/$/,'')}
function sessionToken(request){const match=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)sst_session=([^;]+)/);return match?decodeURIComponent(match[1]):null}
async function sha256(value){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value))));return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
async function requireMember(request,env){
  const token=sessionToken(request);if(!token)return null;
  const row=await env.DB.prepare(`SELECT u.id,u.email,u.first_name,u.last_name,a.email_verified,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN user_auth a ON a.user_id=u.id WHERE s.token_hash=?`).bind(await sha256(token)).first();
  if(!row||row.revoked_at||new Date(row.expires_at).getTime()<=Date.now())return null;
  return row;
}
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
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS commerce_inventory (
      product_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      stock_on_hand INTEGER,
      reserved INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(product_id,size),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS commerce_refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      stripe_refund_id TEXT NOT NULL UNIQUE,
      amount_pence INTEGER NOT NULL,
      reason TEXT,
      environment TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS commerce_product_details (
      product_id INTEGER PRIMARY KEY,
      category TEXT NOT NULL,
      image_key TEXT NOT NULL,
      featured_colour TEXT NOT NULL,
      colours_json TEXT NOT NULL,
      sizes_json TEXT NOT NULL,
      one_size INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS commerce_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sku TEXT NOT NULL,
      product_name TEXT NOT NULL,
      colour TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_pence INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_commerce_checkout_session ON commerce_order_details(stripe_checkout_session_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_commerce_payment_intent ON commerce_order_details(stripe_payment_intent_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_stripe_events_received ON stripe_events(received_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_commerce_order_items_order ON commerce_order_items(order_id)'),
    env.DB.prepare(`INSERT INTO products(name,sku,product_type,price_pence,status,description,created_at,updated_at)
      VALUES('Shift Some Timber T-shirt',?,'physical',?,'active','Shift Some Timber branded T-shirt. Sizes XS to 5XL.',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(sku) DO UPDATE SET name=excluded.name,product_type=excluded.product_type,price_pence=excluded.price_pence,status=excluded.status,description=excluded.description,updated_at=CURRENT_TIMESTAMP`).bind(SHIRT_SKU,SHIRT_PRICE)
  ]);
  const product=await env.DB.prepare('SELECT id FROM products WHERE sku=?').bind(SHIRT_SKU).first();
  if(product)await env.DB.batch([...SIZES].map(size=>env.DB.prepare(`INSERT OR IGNORE INTO commerce_inventory(product_id,size,stock_on_hand,reserved,active,updated_at) VALUES(?,?,NULL,0,1,?)`).bind(product.id,size,now())));
  for(const item of TIMBER_PRODUCTS){
    await env.DB.prepare(`INSERT INTO products(name,sku,product_type,price_pence,status,description,created_at,updated_at)
      VALUES(?,?,'physical',?,'active',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(sku) DO NOTHING`).bind(item.name,item.sku,item.pricePence,item.description).run();
    const row=await env.DB.prepare('SELECT id FROM products WHERE sku=?').bind(item.sku).first();
    if(!row)continue;
    await env.DB.prepare(`INSERT INTO commerce_product_details(product_id,category,image_key,featured_colour,colours_json,sizes_json,one_size,sort_order,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(product_id) DO NOTHING`).bind(row.id,item.category,item.imageKey,item.featuredColour,JSON.stringify(item.colours),JSON.stringify(item.sizes),item.oneSize?1:0,item.sortOrder,now()).run();
    await env.DB.batch(item.sizes.flatMap(size=>item.colours.map(colour=>env.DB.prepare(`INSERT OR IGNORE INTO commerce_inventory(product_id,size,stock_on_hand,reserved,active,updated_at) VALUES(?,?,NULL,0,1,?)`).bind(row.id,`${size}|${colour}`,now()))));
  }
}

async function reserveStock(env,productId,size,quantity){
  const result=await env.DB.prepare(`UPDATE commerce_inventory SET reserved=reserved+?,updated_at=? WHERE product_id=? AND size=? AND active=1 AND (stock_on_hand IS NULL OR stock_on_hand-reserved>=?)`).bind(quantity,now(),productId,size,quantity).run();
  return Number(result.meta?.changes||0)===1;
}
async function releaseStock(env,productId,size,quantity){await env.DB.prepare(`UPDATE commerce_inventory SET reserved=MAX(0,reserved-?),updated_at=? WHERE product_id=? AND size=?`).bind(quantity,now(),productId,size).run()}
async function commitStock(env,productId,size,quantity){await env.DB.prepare(`UPDATE commerce_inventory SET reserved=MAX(0,reserved-?),stock_on_hand=CASE WHEN stock_on_hand IS NULL THEN NULL ELSE MAX(0,stock_on_hand-?) END,updated_at=? WHERE product_id=? AND size=?`).bind(quantity,quantity,now(),productId,size).run()}

export function trackingUrl(carrier,reference){
  if(!clean(reference,200))return null;const key=clean(carrier,100).toLowerCase();
  const urls=key.includes('royal mail')?'https://www.royalmail.com/track-your-item':key.includes('dpd')?'https://track.dpd.co.uk':key.includes('evri')?'https://www.evri.com/track-a-parcel':key.includes('ups')?'https://www.ups.com/track':key.includes('dhl')?'https://www.dhl.com/gb-en/home/tracking.html':key.includes('yodel')?'https://www.yodel.co.uk/track':null;
  return urls;
}

function stripeForm(order,items,member,env){
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
  put('metadata[item_count]',items.length);
  put('metadata[user_id]',member.id);
  put('payment_intent_data[metadata][order_number]',order.order_number);
  put('customer_email',member.email);
  items.forEach((item,index)=>{
    put(`line_items[${index}][price_data][currency]`,CURRENCY);
    put(`line_items[${index}][price_data][unit_amount]`,item.price_pence);
    put(`line_items[${index}][price_data][product_data][name]`,item.name);
    put(`line_items[${index}][price_data][product_data][description]`,`${item.colour} · ${item.size}`);
    put(`line_items[${index}][quantity]`,item.quantity);
  });
  put('shipping_options[0][shipping_rate_data][type]','fixed_amount');
  put('shipping_options[0][shipping_rate_data][fixed_amount][amount]',DELIVERY_PRICE);
  put('shipping_options[0][shipping_rate_data][fixed_amount][currency]',CURRENCY);
  put('shipping_options[0][shipping_rate_data][display_name]','UK delivery');
  return form;
}

async function createCheckout(request,env){
  const member=await requireMember(request,env);
  if(!member)return json({ok:false,error:'account_required',message:'Create or sign in to your My Shift account before ordering.'},401,corsHeaders(request));
  if(!env.STRIPE_SECRET_KEY)return json({ok:false,error:'payments_not_configured'},503,corsHeaders(request));
  const stripeMode=String(env.STRIPE_MODE||'test').toLowerCase();
  if(stripeMode==='test'&&!String(env.STRIPE_SECRET_KEY).startsWith('sk_test_'))return json({ok:false,error:'stripe_mode_mismatch'},503,corsHeaders(request));
  if(stripeMode==='live'&&!String(env.STRIPE_SECRET_KEY).startsWith('sk_live_'))return json({ok:false,error:'stripe_mode_mismatch'},503,corsHeaders(request));
  await ensureCommerceSchema(env);
  const body=await smallJson(request,16_384);
  const requested=Array.isArray(body?.items)?body.items:(body?.size?[{sku:SHIRT_SKU,size:body.size,colour:'Black',quantity:body.quantity??1}]:[]);
  if(!requested.length||requested.length>20)return json({ok:false,error:'invalid_cart'},400,corsHeaders(request));
  const items=[];
  for(const raw of requested){
    const sku=clean(raw?.sku,80).toUpperCase(),colour=clean(raw?.colour||'Black',30),quantity=Number(raw?.quantity??1);
    let size=clean(raw?.size,20);if(size!=='One size')size=size.toUpperCase();
    if(!sku||!COLOURS.has(colour)||!Number.isInteger(quantity)||quantity<1||quantity>9)return json({ok:false,error:'invalid_product_selection'},400,corsHeaders(request));
    const product=await env.DB.prepare(`SELECT p.id,p.name,p.sku,p.price_pence,p.status,d.sizes_json,d.colours_json FROM products p LEFT JOIN commerce_product_details d ON d.product_id=p.id WHERE p.sku=?`).bind(sku).first();
    if(!product||product.status!=='active')return json({ok:false,error:'product_unavailable',sku},409,corsHeaders(request));
    const sizes=parseJson(product.sizes_json),colours=parseJson(product.colours_json);
    const allowedSizes=Array.isArray(sizes)?sizes:(sku===SHIRT_SKU?APPAREL_SIZES:[]),allowedColours=Array.isArray(colours)?colours:['Black'];
    if(!allowedSizes.includes(size)||!allowedColours.includes(colour))return json({ok:false,error:'invalid_variant',sku},400,corsHeaders(request));
    items.push({...product,size,colour,quantity,inventoryKey:sku===SHIRT_SKU?size:`${size}|${colour}`});
  }
  // Aggregate repeated cart lines before checking/reserving their stock.
  const combined=new Map();
  for(const item of items){const k=item.id+':'+item.inventoryKey;const existing=combined.get(k);if(existing)existing.quantity+=item.quantity;else combined.set(k,{...item})}
  const cart=[...combined.values()].sort((a,b)=>(a.sku+a.inventoryKey).localeCompare(b.sku+b.inventoryKey));
  if(cart.some(i=>i.quantity>9))return json({ok:false,error:'invalid_quantity'},400,corsHeaders(request));
  const acquired=await acquireCheckoutAttempt(env.DB,{userId:member.id,channel:'apparel',selection:cart.map(i=>({sku:i.sku,size:i.size,colour:i.colour,quantity:i.quantity}))});
  if(acquired.conflict)return json(checkoutProblem({error:'checkout_selection_conflict'}),409,corsHeaders(request));
  let attempt=acquired.attempt;
  const number=attempt.order_number,createdAt=now(),subtotal=cart.reduce((sum,item)=>sum+Number(item.price_pence)*item.quantity,0),total=subtotal+DELIVERY_PRICE,totalQuantity=cart.reduce((sum,item)=>sum+item.quantity,0),first=cart[0];
  const memberName=clean([member.first_name,member.last_name].filter(Boolean).join(' '),200);
  if(attempt.state==='preparing'){
    await ensureOrderReferenceRegistry(env.DB);
    const availableSql=cart.map(()=>`EXISTS(SELECT 1 FROM commerce_inventory WHERE product_id=? AND size=? AND active=1 AND (stock_on_hand IS NULL OR stock_on_hand-reserved>=?))`).join(' AND ');
    attempt=await prepareCheckoutAttempt(env.DB,attempt,{availableSql,availableArgs:cart.flatMap(i=>[i.id,i.inventoryKey,i.quantity]),form:stripeForm({order_number:number},cart,member,env),statements:guard=>[
      env.DB.prepare(`INSERT INTO orders(order_number,user_id,customer_email,customer_name,product_id,quantity,subtotal_pence,total_pence,currency,status,payment_status,notes,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,'GBP','new','pending',?,?,? WHERE ${guard}`).bind(number,member.id,member.email,memberName,first.id,totalQuantity,subtotal,total,JSON.stringify({channel:'stripe_checkout',itemCount:cart.length}),createdAt,createdAt),
      env.DB.prepare(`INSERT INTO order_reference_registry(order_number,channel,user_id,source_table,source_id,status,created_at,updated_at) SELECT ?,'apparel',?,'orders',(SELECT id FROM orders WHERE order_number=?),'pending',?,? WHERE ${guard}`).bind(number,member.id,number,createdAt,createdAt),
      env.DB.prepare(`INSERT INTO commerce_order_details(order_id,size,delivery_pence,created_at,updated_at) SELECT (SELECT id FROM orders WHERE order_number=?),?,?,?,? WHERE ${guard}`).bind(number,cart.length===1?first.size:'Multiple',DELIVERY_PRICE,createdAt,createdAt),
      ...cart.flatMap(item=>[
        env.DB.prepare(`INSERT INTO commerce_order_items(order_id,product_id,sku,product_name,colour,size,quantity,unit_price_pence,created_at) SELECT (SELECT id FROM orders WHERE order_number=?),?,?,?,?,?,?,?,? WHERE ${guard}`).bind(number,item.id,item.sku,item.name,item.colour,item.size,item.quantity,item.price_pence,createdAt),
        env.DB.prepare(`UPDATE commerce_inventory SET reserved=reserved+?,updated_at=? WHERE product_id=? AND size=? AND ${guard}`).bind(item.quantity,createdAt,item.id,item.inventoryKey)
      ])
    ]});
    if(attempt.state==='preparing'){
      await env.DB.prepare("UPDATE checkout_attempts SET active=0,state='unavailable',updated_at=? WHERE id=? AND state='preparing'").bind(now(),attempt.id).run();
      return json({ok:false,error:'out_of_stock',message:'This selection is currently out of stock.'},409,corsHeaders(request));
    }
  }
  const session=await requestCheckoutSession(env,attempt);
  if(!session.ok)return json(checkoutProblem(session),session.status,corsHeaders(request));
  await env.DB.prepare('UPDATE commerce_order_details SET stripe_checkout_session_id=?,updated_at=? WHERE order_id=(SELECT id FROM orders WHERE order_number=?)').bind(session.id,now(),number).run();
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

// A receipt is separate from settlement. Unknown provider acceptance must never
// trigger an automatic resend. Operators reconcile sending/uncertain records.
async function ensureReceiptSchema(env){
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS commerce_receipt_delivery (
    order_id INTEGER NOT NULL, recipient_role TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending', provider_id TEXT, last_error TEXT,
    updated_at TEXT NOT NULL, PRIMARY KEY(order_id,recipient_role)
  )`);
}
async function deliverReceipt(env,order,role,message){
  if(!env.EMAIL){
    await env.DB.prepare("UPDATE commerce_receipt_delivery SET last_error='email_binding_unavailable',updated_at=? WHERE order_id=? AND recipient_role=? AND state='pending'").bind(now(),order.id,role).run();
    return;
  }
  const claim=await env.DB.prepare("UPDATE commerce_receipt_delivery SET state='sending',last_error=NULL,updated_at=? WHERE order_id=? AND recipient_role=? AND state='pending'").bind(now(),order.id,role).run();
  if(Number(claim.meta?.changes)!==1)return;
  try{
    const accepted=await env.EMAIL.send(message);
    await env.DB.prepare("UPDATE commerce_receipt_delivery SET state='accepted',provider_id=?,updated_at=? WHERE order_id=? AND recipient_role=? AND state='sending'").bind(clean(accepted?.id||accepted?.messageId,200)||null,now(),order.id,role).run();
  }catch(error){
    await env.DB.prepare("UPDATE commerce_receipt_delivery SET state='uncertain',last_error='provider_acceptance_requires_reconciliation',updated_at=? WHERE order_id=? AND recipient_role=? AND state='sending'").bind(now(),order.id,role).run().catch(()=>{});
    console.error('order_receipt_requires_reconciliation',{orderNumber:order.order_number,role});
  }
}
async function settleShopEvent(env,event){
  const session=event.data?.object||{},number=clean(session.metadata?.order_number||session.client_reference_id,80);
  const paid=['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&session.payment_status==='paid';
  const failed=['checkout.session.async_payment_failed','checkout.session.expired','payment_intent.payment_failed'].includes(event.type);
  if(!paid&&!failed){
    await env.DB.prepare('UPDATE stripe_events SET processed_at=?,processing_error=NULL WHERE stripe_event_id=?').bind(now(),event.id).run();
    return null;
  }
  const order=number?await env.DB.prepare(`SELECT o.*,p.name product_name,d.size FROM orders o JOIN products p ON p.id=o.product_id LEFT JOIN commerce_order_details d ON d.order_id=o.id WHERE o.order_number=?`).bind(number).first():null;
  if(!order)throw Error('shop_order_not_found');
  await ensureOrderReferenceRegistry(env.DB);
  await ensureReceiptSchema(env);
  await ensureCheckoutAttempts(env.DB);
  const rows=await env.DB.prepare('SELECT product_id,sku,product_name,colour,size,quantity,unit_price_pence FROM commerce_order_items WHERE order_id=? ORDER BY id').bind(order.id).all();
  const items=rows.results?.length?rows.results:[{product_id:order.product_id,sku:SHIRT_SKU,size:order.size,quantity:order.quantity,product_name:order.product_name}];
  const stamp=now(),statements=[];
  const payable="payment_status IN ('pending','failed')";
  const reserved="payment_status='pending'";
  for(const item of items){
    const inventoryKey=item.sku===SHIRT_SKU?item.size:`${item.size}|${item.colour}`,quantity=Number(item.quantity||1);
    statements.push(paid?
      env.DB.prepare(`UPDATE commerce_inventory SET stock_on_hand=CASE WHEN stock_on_hand IS NULL THEN NULL ELSE MAX(0,stock_on_hand-?) END,reserved=MAX(0,reserved-CASE WHEN EXISTS(SELECT 1 FROM orders WHERE id=? AND ${reserved}) THEN ? ELSE 0 END),updated_at=? WHERE product_id=? AND size=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND ${payable})`).bind(quantity,order.id,quantity,stamp,item.product_id,inventoryKey,order.id):
      env.DB.prepare(`UPDATE commerce_inventory SET reserved=MAX(0,reserved-?),updated_at=? WHERE product_id=? AND size=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND ${reserved})`).bind(quantity,stamp,item.product_id,inventoryKey,order.id));
  }
  const condition=paid?payable:reserved;
  statements.push(env.DB.prepare(`UPDATE order_reference_registry SET status=?,updated_at=? WHERE order_number=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND ${condition})`).bind(paid?'paid':'failed',stamp,number,order.id));
  const details=session.customer_details||{},shipping=session.shipping_details||session.collected_information?.shipping_details||{};
  const email=clean(details.email||order.customer_email,320),name=clean(details.name||shipping.name||order.customer_name,200);
  if(paid){
    statements.push(env.DB.prepare(`UPDATE commerce_order_details SET stripe_payment_intent_id=?,shipping_name=?,shipping_address_json=?,stripe_payment_status='paid',last_stripe_event_type=?,updated_at=? WHERE order_id=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND ${payable})`).bind(clean(session.payment_intent,200),clean(shipping.name||name,200),JSON.stringify(shipping.address||details.address||{}),event.type,stamp,order.id,order.id));
    for(const role of ['customer','operator'])statements.push(env.DB.prepare(`INSERT OR IGNORE INTO commerce_receipt_delivery(order_id,recipient_role,state,updated_at) SELECT ?,?,'pending',? WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND ${payable})`).bind(order.id,role,stamp,order.id));
    statements.push(env.DB.prepare(`UPDATE orders SET customer_email=?,customer_name=?,status='paid',payment_status='paid',updated_at=? WHERE id=? AND ${payable}`).bind(email,name,stamp,order.id));
  }else{
    statements.push(env.DB.prepare(`UPDATE commerce_order_details SET stripe_payment_status='failed',last_stripe_event_type=?,updated_at=? WHERE order_id=? AND EXISTS(SELECT 1 FROM orders WHERE id=? AND ${reserved})`).bind(event.type,stamp,order.id,order.id));
    statements.push(env.DB.prepare(`UPDATE orders SET status=?,payment_status='failed',updated_at=? WHERE id=? AND ${reserved}`).bind(event.type==='checkout.session.expired'?'cancelled':'new',stamp,order.id));
  }
  if(paid||event.type==='checkout.session.expired')statements.push(env.DB.prepare("UPDATE checkout_attempts SET state=?,active=0,updated_at=? WHERE order_number=?").bind(paid?'paid':'expired',stamp,number));
  statements.push(env.DB.prepare('UPDATE stripe_events SET processed_at=?,processing_error=NULL WHERE stripe_event_id=?').bind(stamp,event.id));
  await env.DB.batch(statements);
  return paid?{...order,customer_email:email,customer_name:name,product_name:items.length===1?items[0].product_name:`${items.length} Timber Mill items`,size:items.map(item=>`${item.product_name} · ${item.colour||''} · ${item.size} × ${item.quantity}`).join('; ')}:null;
}
async function webhook(request,env,ctx){
  if(!env.STRIPE_WEBHOOK_SECRET)return json({ok:false,error:'webhook_not_configured'},503);
  if(Number(request.headers.get('content-length')||0)>1_000_000)return json({ok:false,error:'payload_too_large'},413);
  const payload=await request.text();
  if(new TextEncoder().encode(payload).length>1_000_000)return json({ok:false,error:'payload_too_large'},413);
  if(!await validStripeSignature(payload,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET))return json({ok:false,error:'invalid_signature'},400);
  let event;try{event=JSON.parse(payload)}catch{return json({ok:false,error:'invalid_event'},400)}
  if(!event?.id||!event?.type||!event?.data?.object)return json({ok:false,error:'invalid_event'},400);
  if(typeof event.livemode==='boolean'&&event.livemode!==(String(env.STRIPE_MODE||'test').toLowerCase()==='live'))return json({ok:false,error:'stripe_mode_mismatch'},400);
  const result=await env.DB.prepare('INSERT OR IGNORE INTO stripe_events(stripe_event_id,event_type,payload,received_at) VALUES(?,?,?,?)').bind(clean(event.id,200),clean(event.type,100),payload,now()).run();
  if(!Number(result.meta?.changes)){
    const previous=await env.DB.prepare('SELECT processed_at FROM stripe_events WHERE stripe_event_id=?').bind(event.id).first();
    if(previous?.processed_at)return json({ok:true,duplicate:true});
  }
  try{
    const order=await settleShopEvent(env,event);
    if(order){const work=sendOrderEmails(env,order).catch(()=>console.error('order_receipt_pending',{orderNumber:order.order_number}));if(ctx?.waitUntil)ctx.waitUntil(work);else await work;}
  }catch(error){
    await env.DB.prepare('UPDATE stripe_events SET processing_error=? WHERE stripe_event_id=? AND processed_at IS NULL').bind(clean(error?.message,1000),event.id).run().catch(()=>{});
    console.error('stripe_webhook_processing_failed',{eventId:event.id,type:event.type});
    return json({ok:false,error:'processing_failed'},500);
  }
  return json({ok:true});
}

async function orderStatus(request,env){
  const sessionId=clean(new URL(request.url).searchParams.get('session_id'),200);
  if(!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId))return json({ok:false,error:'invalid_session'},400,corsHeaders(request));
  // The Stripe Checkout session id is a high-entropy capability returned only
  // to the successful browser. Expose no customer or delivery data here: just
  // enough to render the post-payment confirmation reliably when mobile Safari
  // withholds the API session cookie after returning from stripe.com.
  const order=await env.DB.prepare(`SELECT o.order_number,o.status,o.payment_status FROM commerce_order_details d JOIN orders o ON o.id=d.order_id WHERE d.stripe_checkout_session_id=?`).bind(sessionId).first();
  if(!order)return json({ok:false,error:'order_not_found'},404,corsHeaders(request));
  return json({ok:true,orderNumber:order.order_number,status:order.status,paymentStatus:order.payment_status},200,corsHeaders(request));
}

async function memberOrders(request,env){
  const member=await requireMember(request,env);if(!member)return json({ok:false,error:'account_required'},401,corsHeaders(request));
  if(Number(member.email_verified||0)===1)await env.DB.prepare(`UPDATE orders SET user_id=?,updated_at=? WHERE user_id IS NULL AND lower(customer_email)=lower(?)`).bind(member.id,now(),member.email).run();
  const {results}=await env.DB.prepare(`SELECT o.order_number,o.quantity,o.subtotal_pence,o.total_pence,o.currency,o.status,o.payment_status,o.notes,o.created_at,o.updated_at,p.name product_name,p.sku,d.size,d.delivery_pence,d.shipping_name,d.shipping_address_json,d.stripe_payment_intent_id FROM orders o LEFT JOIN products p ON p.id=o.product_id LEFT JOIN commerce_order_details d ON d.order_id=o.id WHERE o.user_id=? ORDER BY o.id DESC LIMIT 100`).bind(member.id).all();
  const orders=[];
  for(const order of results||[]){
    const row=await env.DB.prepare(`SELECT sku,product_name,colour,size,quantity,unit_price_pence FROM commerce_order_items WHERE order_id=(SELECT id FROM orders WHERE order_number=?) ORDER BY id`).bind(order.order_number).all();
    const notes=parseJson(order.notes);orders.push({...order,items:row.results||[],shipping_address:parseJson(order.shipping_address_json),carrier:notes.carrier||'',tracking_reference:notes.trackingReference||'',tracking_url:trackingUrl(notes.carrier,notes.trackingReference)});
  }
  return json({ok:true,orders},200,corsHeaders(request));
}
function parseJson(value){try{return JSON.parse(value||'{}')}catch{return {}}}

function escapeHtml(value){return clean(value,500).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

async function sendOrderEmails(env,order){
  const admin=String(env.ORDER_NOTIFICATION_EMAIL||env.ADMIN_NOTIFICATION_EMAIL||'orders@shiftsometimber.co.uk');
  const customer=order.customer_email;
  const summary=`${order.product_name} · Size ${order.size} · Quantity ${order.quantity} · £${(order.total_pence/100).toFixed(2)}`;
  const customerFrom={email:'orders@shiftsometimber.co.uk',name:'Shift Some Timber Orders'};
  const adminFrom={email:String(env.ADMIN_EMAIL_FROM||'hq@shiftsometimber.co.uk'),name:'Shift HQ'};
  const shell=(preheader,title,body)=>`<!doctype html><html><body style="margin:0;background:#050505;color:#E7E3DA;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div><div style="max-width:640px;margin:0 auto;padding:32px 20px"><div style="padding:8px 0 22px;border-bottom:2px solid #707762"><img src="https://shiftsometimber.co.uk/assets/start-here-approved-logo.png?v=1" width="560" alt="Shift Some Timber — Helping ordinary blokes feel like themselves again" style="display:block;width:100%;max-width:560px;height:auto;border:0"><div style="display:none;color:#E7E3DA;font-size:20px;font-weight:900">SHIFT SOME TIMBER</div></div><div style="padding:34px 0"><p style="margin:0 0 10px;color:#707762;font-size:12px;font-weight:900;letter-spacing:.14em">SHIFT ORDER</p><h1 style="margin:0 0 24px;color:#E7E3DA;font-size:36px;line-height:1.05">${escapeHtml(title)}</h1>${body}</div><div style="padding-top:20px;border-top:1px solid #707762;color:#aaa69d;font-size:12px;line-height:1.6">Shift Some Timber Ltd · Company no. 17393135<br>Questions? Email <a style="color:#E7E3DA" href="mailto:orders@shiftsometimber.co.uk">orders@shiftsometimber.co.uk</a><br>This transactional email was sent because an order was placed with Shift Some Timber.</div></div></body></html>`;
  const work=[];
  if(customer){
    const subtotal=(order.subtotal_pence/100).toFixed(2),delivery=((order.total_pence-order.subtotal_pence)/100).toFixed(2),total=(order.total_pence/100).toFixed(2);
    const body=`<p style="margin:0 0 24px;color:#E7E3DA;line-height:1.7">Hi ${escapeHtml(order.customer_name||'there')}, your payment has gone through and we’ve got your order. Here’s everything in one place.</p><div style="padding:22px;border:1px solid #707762;border-radius:16px;background:#707762;color:#050505"><p style="margin:0 0 12px;color:#050505;font-weight:700">Order reference</p><p style="margin:0 0 22px;color:#050505;font-size:22px;font-weight:900">${escapeHtml(order.order_number)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;color:#050505;font-size:15px;line-height:1.6"><tr><td style="padding:5px 0;font-weight:800">${escapeHtml(order.product_name)}</td><td align="right" style="padding:5px 0;font-weight:800">£${subtotal}</td></tr><tr><td style="padding:5px 0">Size ${escapeHtml(order.size)} · Quantity ${order.quantity}</td><td></td></tr><tr><td style="padding:12px 0 5px;border-top:1px solid #050505">UK delivery</td><td align="right" style="padding:12px 0 5px;border-top:1px solid #050505">£${delivery}</td></tr><tr><td style="padding:12px 0 0;border-top:2px solid #050505;font-size:18px;font-weight:900">Total paid</td><td align="right" style="padding:12px 0 0;border-top:2px solid #050505;font-size:18px;font-weight:900">£${total}</td></tr></table></div><div style="margin-top:26px;padding:22px;border:1px solid #707762;border-radius:16px;background:#10110e"><h2 style="margin:0 0 14px;color:#E7E3DA;font-size:21px">What happens next?</h2><p style="margin:0 0 10px;color:#E7E3DA;line-height:1.7"><strong style="color:#707762">1.</strong> We prepare and check your order.</p><p style="margin:0 0 10px;color:#E7E3DA;line-height:1.7"><strong style="color:#707762">2.</strong> We’ll email you when it has been dispatched.</p><p style="margin:0;color:#E7E3DA;line-height:1.7"><strong style="color:#707762">3.</strong> Questions or changes? Reply to this email or contact orders@shiftsometimber.co.uk.</p></div><p style="margin:28px 0 12px;color:#E7E3DA;font-weight:800">Keep up with Shift</p><p style="margin:0 0 22px;color:#aaa69d;line-height:1.6">Real talk, useful updates and the occasional reminder that none of us has to be perfect.</p><div><a href="https://instagram.com/ShiftSomeTimber" style="display:inline-block;margin:0 8px 8px 0;padding:11px 16px;border-radius:999px;background:#707762;color:#050505;text-decoration:none;font-weight:900">Instagram</a><a href="https://facebook.com/ShiftSomeTimber" style="display:inline-block;margin:0 8px 8px 0;padding:11px 16px;border-radius:999px;background:#707762;color:#050505;text-decoration:none;font-weight:900">Facebook</a><a href="https://x.com/ShiftSomeTimber" style="display:inline-block;margin:0 0 8px;padding:11px 16px;border-radius:999px;background:#707762;color:#050505;text-decoration:none;font-weight:900">X</a></div>`;
    work.push(deliverReceipt(env,order,'customer',{from:customerFrom,to:customer,subject:`Your Shift order is confirmed · ${order.order_number}`,html:shell(`Payment confirmed for ${order.order_number}`,'Nice one. Your order is confirmed.',body),text:`Shift Some Timber order confirmation\n\nOrder ${order.order_number}\n${summary}\n\nPayment confirmed. We will email you again when your order is dispatched.\n\nQuestions: orders@shiftsometimber.co.uk\nShift Some Timber Ltd · Company no. 17393135`}));
  }
  const adminBody=`<div style="padding:22px;border:1px solid #707762;border-radius:16px;background:#10110e"><p style="margin:0 0 12px;color:#E7E3DA;font-size:22px;font-weight:900">${escapeHtml(order.order_number)}</p><p style="margin:0 0 18px;color:#E7E3DA;line-height:1.7">${escapeHtml(summary)}</p><p style="margin:0;color:#E7E3DA;line-height:1.7">Customer: ${escapeHtml(order.customer_name)}<br>${escapeHtml(customer)}</p></div>`;
  work.push(deliverReceipt(env,order,'operator',{from:adminFrom,to:admin,subject:`ST INTERNAL — NEW ORDER — ${order.order_number}`,html:shell(`New paid shop order ${order.order_number}`,'New paid order.',adminBody),text:`New paid Shift shop order\n\n${order.order_number}\n${summary}\nCustomer: ${order.customer_name} · ${customer}` }));
  await Promise.all(work);
}

export async function commerceStripeRoutes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(request.method==='OPTIONS'&&path==='/v1/commerce/checkout')return new Response(null,{status:204,headers:corsHeaders(request)});
  if(request.method==='GET'&&path==='/v1/commerce/catalogue'){
    if(!env.DB)return json({ok:true,mode:'test',deliveryPence:DELIVERY_PRICE,product:commerceCatalogue,products:TIMBER_PRODUCTS},200,corsHeaders(request));
    await ensureCommerceSchema(env);
    const {results}=await env.DB.prepare(`SELECT p.id,p.name,p.sku,p.price_pence,p.status,p.description,d.category,d.image_key,d.featured_colour,d.colours_json,d.sizes_json,d.one_size,d.sort_order FROM products p JOIN commerce_product_details d ON d.product_id=p.id WHERE p.product_type='physical' ORDER BY d.sort_order,p.id`).all();
    const products=[];
    for(const product of results||[]){
      const stock=await env.DB.prepare('SELECT size,stock_on_hand,reserved,active FROM commerce_inventory WHERE product_id=? ORDER BY size').bind(product.id).all();
      products.push({id:product.id,sku:product.sku,name:product.name,pricePence:product.price_pence,status:product.status,description:product.description,category:product.category,imageKey:product.image_key,featuredColour:product.featured_colour,colours:parseJson(product.colours_json),sizes:parseJson(product.sizes_json),oneSize:Boolean(product.one_size),availability:Object.fromEntries((stock.results||[]).map(row=>[row.size,{available:Number(row.active)===1&&(row.stock_on_hand===null||Number(row.stock_on_hand)>Number(row.reserved)),remaining:row.stock_on_hand===null?null:Math.max(0,Number(row.stock_on_hand)-Number(row.reserved))}]))});
    }
    return json({ok:true,mode:String(env.STRIPE_MODE||'test').toLowerCase(),deliveryPence:DELIVERY_PRICE,product:commerceCatalogue,products},200,corsHeaders(request));
  }
  if(request.method==='GET'&&path==='/v1/commerce/orders')return memberOrders(request,env);
  if(request.method==='GET'&&path==='/v1/commerce/order-status')return orderStatus(request,env);
  if(request.method==='POST'&&path==='/v1/commerce/checkout')return createCheckout(request,env);
  if(request.method==='POST'&&path==='/v1/commerce/stripe/webhook')return webhook(request,env,ctx);
  return null;
}

export const commerceCatalogue={sku:SHIRT_SKU,name:'Shift Some Timber T-shirt',pricePence:SHIRT_PRICE,deliveryPence:DELIVERY_PRICE,sizes:[...SIZES]};

// Called only after existing HQ commerce permission checks.
export async function shopRecoveryStatus(env){
 const exists=async name=>Boolean(await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(name).first());
 const receipts=await exists('commerce_receipt_delivery')?await env.DB.prepare("SELECT o.order_number,r.recipient_role,r.state,r.provider_id,r.last_error,r.updated_at FROM commerce_receipt_delivery r JOIN orders o ON o.id=r.order_id WHERE r.state<>'accepted' ORDER BY r.updated_at LIMIT 100").all():{results:[]};
 const attempts=await exists('checkout_attempts')?await env.DB.prepare('SELECT order_number,channel,state,last_error,created_at,updated_at FROM checkout_attempts WHERE active=1 ORDER BY created_at LIMIT 100').all():{results:[]};
 const events=await exists('stripe_events')?await env.DB.prepare('SELECT stripe_event_id,event_type,received_at,processing_error FROM stripe_events WHERE processed_at IS NULL ORDER BY received_at LIMIT 100').all():{results:[]};
 return {receipts:receipts.results||[],attempts:attempts.results||[],events:events.results||[],limitPerQueue:100,oldestFirst:true,receiptAcceptanceIsNotDelivery:true,uncertainReceiptsRequireProviderReconciliation:true};
}
export async function retryPendingShopReceipts(env,orderId){
 const order=await env.DB.prepare("SELECT o.*,p.name product_name,d.size FROM orders o JOIN products p ON p.id=o.product_id LEFT JOIN commerce_order_details d ON d.order_id=o.id WHERE o.id=? AND o.payment_status='paid'").bind(orderId).first();
 if(!order)return false;
 await ensureReceiptSchema(env);
 const {results=[]}=await env.DB.prepare('SELECT product_name,colour,size,quantity FROM commerce_order_items WHERE order_id=? ORDER BY id').bind(order.id).all();
 if(results.length){order.product_name=results.length===1?results[0].product_name:`${results.length} Timber Mill items`;order.size=results.map(i=>`${i.product_name} · ${i.colour} · ${i.size} × ${i.quantity}`).join('; ')}
 await sendOrderEmails(env,order);
 return true;
}
