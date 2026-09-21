// Isolated preview only. This module is never imported by production.
import {ensureOrderReferenceRegistry} from '../../order-reference-v1.js';
import {commerceStripeRoutes} from '../../commerce-stripe-v1.js';
import {acquireCheckoutAttempt,prepareCheckoutAttempt} from '../../checkout-attempt-v1.mjs';
const assert=(condition,message)=>{if(!condition)throw Error(message)};
export async function launchPaymentProbe(request,env){
 const u=new URL(request.url);
 if(u.pathname!=='/__preview/launch/payment-proof')return null;
 if(env.LAUNCH_REPAIR_PREVIEW!=='true'||env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!/^shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT||0)||request.method!=='POST'||!env.LAUNCH_PROOF_KEY||request.headers.get('X-Preview-Proof')!==env.LAUNCH_PROOF_KEY)return new Response('Not available',{status:404});
 const {at}=await request.json();assert(Number.isInteger(at)&&at>=0&&at<8,'Bounded failure index required');
 const id=Date.now()*1000+Math.floor(Math.random()*1000),number='PREVIEW-RECOVERY-'+id,stamp=new Date().toISOString(),DB=env.DB;
 // All identifiers and rows are fictional, inside the existing isolated DB only.
 await DB.exec(`CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,name TEXT,sku TEXT UNIQUE,product_type TEXT,price_pence INTEGER,status TEXT,description TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY,order_number TEXT UNIQUE,user_id INTEGER,customer_email TEXT,customer_name TEXT,product_id INTEGER,quantity INTEGER,subtotal_pence INTEGER,total_pence INTEGER,currency TEXT,status TEXT,payment_status TEXT,notes TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS commerce_order_details(order_id INTEGER PRIMARY KEY,size TEXT,delivery_pence INTEGER,stripe_checkout_session_id TEXT,stripe_payment_intent_id TEXT,shipping_name TEXT,shipping_address_json TEXT,stripe_payment_status TEXT,last_stripe_event_type TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS commerce_order_items(id INTEGER PRIMARY KEY,order_id INTEGER,product_id INTEGER,sku TEXT,product_name TEXT,colour TEXT,size TEXT,quantity INTEGER,unit_price_pence INTEGER,created_at TEXT);
 CREATE TABLE IF NOT EXISTS commerce_inventory(product_id INTEGER,size TEXT,stock_on_hand INTEGER,reserved INTEGER,active INTEGER,updated_at TEXT,PRIMARY KEY(product_id,size));
 CREATE TABLE IF NOT EXISTS stripe_events(stripe_event_id TEXT UNIQUE,event_type TEXT,payload TEXT,received_at TEXT,processed_at TEXT,processing_error TEXT);
 CREATE TABLE IF NOT EXISTS preview_checkout_projection(attempt_id TEXT PRIMARY KEY,marker TEXT);`);
 await ensureOrderReferenceRegistry(DB);
 await DB.batch([
  DB.prepare("INSERT INTO order_reference_registry(order_number,channel,status,created_at,updated_at) VALUES(?,'apparel','pending',?,?)").bind(number,stamp,stamp),
  DB.prepare("INSERT INTO products(id,name,sku,product_type,price_pence,status) VALUES(?,'Fictional recovery shirt',?,'physical',1000,'active')").bind(id,number),
  DB.prepare("INSERT INTO orders(id,order_number,product_id,quantity,customer_email,customer_name,status,payment_status,subtotal_pence,total_pence) VALUES(?,?,?,1,'fictional@example.invalid','Fictional','new','pending',1000,1299)").bind(id,number,id),
  DB.prepare("INSERT INTO commerce_order_details(order_id,size) VALUES(?,'L')").bind(id),
  DB.prepare("INSERT INTO commerce_inventory(product_id,size,stock_on_hand,reserved,active) VALUES(?,'L',10,2,1)").bind(id)
 ]);
 const wrap=(sql,args=[])=>({sql,args,bind(...next){return wrap(sql,next)},run(){return DB.prepare(sql).bind(...args).run()},first(){return DB.prepare(sql).bind(...args).first()},all(){return DB.prepare(sql).bind(...args).all()}});
 let fail=true;
 const intercepted={exec:sql=>DB.exec(sql),prepare:sql=>wrap(sql),batch:statements=>{
  const actual=statements.map(s=>DB.prepare(s.sql).bind(...s.args));
  if(fail&&statements.some(s=>s.sql.startsWith('UPDATE commerce_inventory'))){fail=false;actual.splice(at,0,DB.prepare('INSERT INTO preview_failure_table_that_does_not_exist(value) VALUES(1)'))}
  return DB.batch(actual);
 }};
 const secret='preview-only-'+crypto.randomUUID();
 async function send(eventId,type='checkout.session.completed'){
  const payload=JSON.stringify({id:eventId,type,livemode:false,data:{object:{metadata:{order_number:number},payment_status:'paid',payment_intent:'pi_preview_only'}}}),t=Math.floor(Date.now()/1000),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']),digest=[...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+payload)))].map(x=>x.toString(16).padStart(2,'0')).join('');
  return commerceStripeRoutes(new Request('https://example.invalid/v1/commerce/stripe/webhook',{method:'POST',headers:{'stripe-signature':`t=${t},v1=${digest}`},body:payload}),{DB:intercepted,STRIPE_WEBHOOK_SECRET:secret,STRIPE_MODE:'test'},{});
 }
 const event='evt_preview_'+id;assert((await send(event)).status===500,'Injected D1 failure must not acknowledge success');
 assert((await DB.prepare('SELECT payment_status FROM orders WHERE id=?').bind(id).first()).payment_status==='pending','D1 order rollback');
 assert((await DB.prepare("SELECT stock_on_hand FROM commerce_inventory WHERE product_id=? AND size='L'").bind(id).first()).stock_on_hand===10,'D1 stock rollback');
 assert((await send(event)).status===200,'Same-event recovery');
 await Promise.all([send(event+'_a'),send(event+'_b')]);await send(event+'_expired','checkout.session.expired');
 const inventory=await DB.prepare("SELECT stock_on_hand,reserved FROM commerce_inventory WHERE product_id=? AND size='L'").bind(id).first();assert(inventory.stock_on_hand===9&&inventory.reserved===1,'Exactly one D1 settlement');
 assert((await DB.prepare('SELECT status FROM order_reference_registry WHERE order_number=?').bind(number).first()).status==='paid','D1 reference agrees with paid order');
 const receipts=await DB.prepare('SELECT state FROM commerce_receipt_delivery WHERE order_id=?').bind(id).all();assert(receipts.results.length===2&&receipts.results.every(x=>x.state==='pending'),'Missing delivery binding is durably visible');
 const acquired=await acquireCheckoutAttempt(DB,{userId:id,channel:'apparel',selection:{fictional:id}}),attempt=acquired.attempt;
 const prepare=()=>prepareCheckoutAttempt(DB,attempt,{availableSql:'1=1',form:'mode=payment&metadata%5Bfixture%5D=fictional',statements:guard=>[DB.prepare(`INSERT INTO preview_checkout_projection(attempt_id,marker) SELECT ?,'fictional' WHERE ${guard}`).bind(attempt.id)]});
 await Promise.all([prepare(),prepare()]);
 assert((await DB.prepare('SELECT COUNT(*) count FROM preview_checkout_projection WHERE attempt_id=?').bind(attempt.id).first()).count===1,'Concurrent D1 preparation happens once');
 return Response.json({ok:true,at,realIsolatedD1:true,providerCalls:0,emailsSent:0,productionWrites:0,checks:['transaction rollback','same callback redelivery','concurrent distinct success','late failure protection','durable missing-binding receipts','concurrent checkout preparation'],inventory},{headers:{'Cache-Control':'no-store'}});
}
