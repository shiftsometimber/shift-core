import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {medicineCommerceRoutes,reconcileExpiredReservations} from '../medicine-commerce-v1.js';

class D1Statement {
  constructor(database,sql){this.database=database;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){return this.database.prepare(this.sql).get(...this.args)||null}
  async all(){return{success:true,results:this.database.prepare(this.sql).all(...this.args)}}
  async run(){const result=this.database.prepare(this.sql).run(...this.args);return{success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid||0)}}}
}

class D1TestDatabase {
  constructor(){this.database=new DatabaseSync(':memory:')}
  prepare(sql){return new D1Statement(this.database,sql)}
  async batch(statements){const results=[];this.database.exec('BEGIN');try{for(const statement of statements)results.push(await statement.run());this.database.exec('COMMIT');return results}catch(error){this.database.exec('ROLLBACK');throw error}}
  async exec(sql){this.database.exec(sql);return{success:true}}
  close(){this.database.close()}
}

const sha=value=>createHash('sha256').update(value).digest('hex');
const memberRequest=(path,init={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,{
  ...init,
  headers:{Origin:'https://shiftsometimber.co.uk',Cookie:'sst_session=e2e-member-session',...(init.headers||{})},
});
const partnerRequest=(path,body)=>new Request(`https://api.shiftsometimber.co.uk${path}`,{
  method:'POST',headers:{authorization:'Bearer pharmacy-e2e-secret','content-type':'application/json'},body:JSON.stringify(body),
});

async function setup(){
  const DB=new D1TestDatabase();
  await DB.exec(`
    CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT NOT NULL,first_name TEXT,last_name TEXT);
    CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE user_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,revoked_at TEXT);
    CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT NOT NULL DEFAULT '{}');
    CREATE TABLE audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,action TEXT NOT NULL,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT NOT NULL);
    CREATE TABLE medicine_products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,active_ingredient TEXT NOT NULL,form TEXT NOT NULL,status TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE medicine_variants(id INTEGER PRIMARY KEY AUTOINCREMENT,medicine_id INTEGER NOT NULL,strength_label TEXT NOT NULL,cost_pence INTEGER NOT NULL DEFAULT 0,selling_price_pence INTEGER NOT NULL DEFAULT 0,target_margin_bps INTEGER NOT NULL DEFAULT 6000,status TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(medicine_id,strength_label));
    CREATE TABLE medicine_inventory(variant_id INTEGER PRIMARY KEY,stock_on_hand INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE commerce_discount_codes(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT UNIQUE,discount_type TEXT,discount_value INTEGER,active INTEGER,starts_at TEXT,ends_at TEXT,usage_limit INTEGER,usage_count INTEGER DEFAULT 0,minimum_subtotal_pence INTEGER DEFAULT 0,eligible_products_json TEXT DEFAULT '[]');
    INSERT INTO users VALUES(42,'member@example.test','Test','Member');
    INSERT INTO user_auth VALUES(42,1);
    INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(42,'${sha('e2e-member-session')}','2099-01-01T00:00:00.000Z');
    INSERT INTO member_state(user_id,preferences) VALUES(42,'{}');
    INSERT INTO medicine_products(id,name,active_ingredient,form,status,description,sort_order) VALUES
      (1,'Mounjaro','tirzepatide','injection','available','E2E test medicine',10),
      (2,'Foundayo','orforglipron','tablet','available','Provisional record',20);
    INSERT INTO medicine_variants(id,medicine_id,strength_label,cost_pence,selling_price_pence,target_margin_bps,status,sort_order) VALUES
      (11,1,'2.5 mg',6760,16900,6000,'available',1),
      (21,2,'0.8 mg',5160,12900,6000,'available',1);
    INSERT INTO medicine_inventory VALUES(11,1,0,CURRENT_TIMESTAMP),(21,9,0,CURRENT_TIMESTAMP);
    ALTER TABLE medicine_products ADD COLUMN partner TEXT;
    ALTER TABLE medicine_products ADD COLUMN sellable INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE medicine_products ADD COLUMN availability_state TEXT NOT NULL DEFAULT 'unavailable';
    ALTER TABLE medicine_variants ADD COLUMN partner TEXT;
    ALTER TABLE medicine_variants ADD COLUMN sellable INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE medicine_variants ADD COLUMN availability_state TEXT NOT NULL DEFAULT 'unavailable';
    UPDATE medicine_products SET partner='TEST_PHARMACY',sellable=1,availability_state='available' WHERE id=1;
    UPDATE medicine_variants SET partner='TEST_PHARMACY',sellable=1,availability_state='available' WHERE id=11;
  `);
  const foundayoLock=await readFile(new URL('../migrations/019_foundayo_option_stock_lock.sql',import.meta.url),'utf8');
  await DB.exec(foundayoLock);
  return DB;
}

import {commerceStripeRoutes} from '../commerce-stripe-v1.js';
import {acquireCheckoutAttempt,prepareCheckoutAttempt,requestCheckoutSession} from '../checkout-attempt-v1.mjs';
async function fixture(channel){
 const DB=await setup();
 await DB.exec(`CREATE TABLE products(id INTEGER PRIMARY KEY,name TEXT,sku TEXT UNIQUE,product_type TEXT,price_pence INTEGER,status TEXT,description TEXT,created_at TEXT,updated_at TEXT);CREATE TABLE orders(id INTEGER PRIMARY KEY,order_number TEXT UNIQUE,user_id INTEGER,customer_email TEXT,customer_name TEXT,product_id INTEGER,quantity INTEGER,subtotal_pence INTEGER,total_pence INTEGER,currency TEXT,status TEXT,payment_status TEXT,notes TEXT,created_at TEXT,updated_at TEXT);`);
 const env={DB,STRIPE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fictional',PUBLIC_SITE_URL:'https://shiftsometimber.co.uk'};
 // Bootstrap medicine schema through a harmless catalogue read, then fixture consent.
 await medicineCommerceRoutes(memberRequest('/v1/catalogue/medicines'),env,{});
 await DB.prepare('INSERT INTO medicine_prepay_verifications(token_hash,user_id,variant_id,partner_reference,expires_at) VALUES(?,42,11,?,?)').bind(sha('fictional-verification'),'fixture-partner','2099-01-01T00:00:00Z').run();
 await DB.prepare("INSERT INTO medicine_clinical_intakes(user_id,variant_id,public_reference,partner_reference,status,gp_contact_consent,consent_version,evidence_manifest_json,provider_patient_reference) VALUES(42,11,'SCI-00000000-0000-4000-8000-000000000042','fixture-partner','verified',1,'synthetic-existing-consent','{}','fixture-patient')").run();
 const input=channel==='medicine'?{variantId:11,verificationToken:'fictional-verification',insulinUse:'no',eligibility:{heightCm:180,weightKg:100,weightRelatedCondition:'no'}}:{size:'L',quantity:1};
 const route=channel==='medicine'?medicineCommerceRoutes:commerceStripeRoutes;
 const path=channel==='medicine'?'/v1/commerce/medicine-checkout':'/v1/commerce/checkout';
 const call=async(body=input,cookie='e2e-member-session')=>{const r=await route(memberRequest(path,{method:'POST',headers:{'content-type':'application/json',Cookie:'sst_session='+cookie},body:JSON.stringify(body)}),env,{});return {status:r.status,body:await r.json()}};
 return {DB,env,call,input};
}

import {ensureExtras} from './schema.mjs';
function insertOffer(DB){DB.database.exec(`INSERT INTO supplement_checkout_offers(id,name,pack_label,supplier_sku,price_pence,delivery_group,delivery_label,delivery_pence,delivery_scope,stock_quantity,labels_verified,fulfilment_verified,active,valid_until) VALUES('whey','Test protein','Confirmed test pack','TEST',2000,'olivit','Supplements delivery',500,'GB_ALL',10,1,1,1,'2099-01-01T00:00:00Z')`);}
test('mixed checkout charges one medicine plus several extras, uses one reference and reuses ambiguous payment',async()=>{
 const f=await fixture('medicine');await ensureExtras(f.DB);insertOffer(f.DB);f.env.SUPPLEMENTS_CHECKOUT_ENABLED='true';const old=globalThis.fetch,seen=[];let first=true;
 globalThis.fetch=async(url,init)=>{seen.push({key:init.headers['Idempotency-Key'],body:String(init.body)});if(first){first=false;throw Error('provider accepted then disconnected');}return Response.json({id:'cs_test_mixed',url:'https://checkout.stripe.com/c/pay/cs_test_mixed'});};
 try{const input={...f.input,extras:[{id:'whey',quantity:2,revision:1}]};assert.equal((await f.call(input)).status,503);const result=await f.call(input);assert.equal(result.status,201,JSON.stringify(result));assert.equal(result.body.totalPence,21400);assert.deepEqual(seen[0],seen[1]);const form=new URLSearchParams(seen[1].body);assert.equal(form.get('line_items[0][price_data][unit_amount]'),'16900');assert.equal(form.get('line_items[1][quantity]'),'2');assert.equal(form.get('line_items[2][price_data][unit_amount]'),'500');assert.equal((await f.DB.prepare('SELECT total_pence FROM medicine_orders').first()).total_pence,16900);assert.equal((await f.DB.prepare('SELECT total_pence FROM supplement_checkout_orders').first()).total_pence,4500);assert.equal((await f.DB.prepare('SELECT reserved FROM supplement_checkout_offers').first()).reserved,2);assert.equal((await f.DB.prepare('SELECT used_at FROM medicine_prepay_verifications').first()).used_at!==null,true);assert.equal((await f.call({...input,extras:[]})).status,409);}finally{globalThis.fetch=old;f.DB.close();}
});
test('extras cannot bypass verification and invalid extras cannot consume medicine stock or verification',async()=>{
 const f=await fixture('medicine');await ensureExtras(f.DB);insertOffer(f.DB);f.env.SUPPLEMENTS_CHECKOUT_ENABLED='true';
 try{assert.equal((await f.call({...f.input,verificationToken:'',extras:[{id:'whey',quantity:1,revision:1}]})).status,409);assert.equal((await f.DB.prepare('SELECT reserved FROM medicine_inventory WHERE variant_id=11').first()).reserved,0);const result=await f.call({...f.input,extras:[{id:'whey',quantity:1,revision:99}]});assert.equal(result.status,409);assert.equal(result.body.error,'extra_changed');assert.equal((await f.DB.prepare('SELECT used_at FROM medicine_prepay_verifications').first()).used_at,null);assert.equal((await f.DB.prepare('SELECT reserved FROM medicine_inventory WHERE variant_id=11').first()).reserved,0);}finally{f.DB.close();}
});
test('confirmed expiry releases medicine and extras together once',async()=>{
 const f=await fixture('medicine');await ensureExtras(f.DB);insertOffer(f.DB);f.env.SUPPLEMENTS_CHECKOUT_ENABLED='true';const old=globalThis.fetch;
 try{globalThis.fetch=async()=>Response.json({id:'cs_test_mixed_expiry',url:'https://checkout.stripe.com/c/pay/cs_test_mixed_expiry'});await f.call({...f.input,extras:[{id:'whey',quantity:2,revision:1}]});await f.DB.exec("UPDATE medicine_orders SET created_at='2020-01-01T00:00:00Z'");globalThis.fetch=async()=>Response.json({id:'cs_test_mixed_expiry',status:'expired',payment_status:'unpaid'});assert.equal(await reconcileExpiredReservations(f.env),1);assert.equal(await reconcileExpiredReservations(f.env),0);assert.equal((await f.DB.prepare('SELECT reserved FROM supplement_checkout_offers').first()).reserved,0);assert.equal((await f.DB.prepare('SELECT reserved FROM medicine_inventory WHERE variant_id=11').first()).reserved,0);}finally{globalThis.fetch=old;f.DB.close();}
});
test('mixed paid webhooks commit medicine and supplements once; a declined payment attempt does not release the basket',async()=>{
 const f=await fixture('medicine');await ensureExtras(f.DB);insertOffer(f.DB);f.env.SUPPLEMENTS_CHECKOUT_ENABLED='true';f.env.STRIPE_WEBHOOK_SECRET='synthetic-webhook-secret';const old=globalThis.fetch,notifications=[];
 globalThis.fetch=async url=>{if(String(url)==='https://api.stripe.com/v1/checkout/sessions')return Response.json({id:'cs_test_paid_mixed',url:'https://checkout.stripe.com/c/pay/cs_test_paid_mixed'});throw Error('No external messages or other requests allowed in this fixture');};
 try{
  const order=await f.call({...f.input,extras:[{id:'whey',quantity:2,revision:1}]});assert.equal(order.status,201);
  const send=async(type,id)=>{const timestamp=Math.floor(Date.now()/1000),payload=JSON.stringify({id,type,data:{object:{id:type==='payment_intent.payment_failed'?'pi_test_declined':'cs_test_paid_mixed',metadata:{order_type:'medicine',order_number:order.body.orderNumber},payment_status:'paid',amount_total:21400,currency:'gbp',shipping_details:{name:'Synthetic recipient',address:{country:'GB',line1:'Test address',postal_code:'AA1 1AA'}}}}}),signature=createHmac('sha256',f.env.STRIPE_WEBHOOK_SECRET).update(timestamp+'.'+payload).digest('hex');return medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/commerce/stripe/webhook',{method:'POST',headers:{'stripe-signature':'t='+timestamp+',v1='+signature},body:payload}),f.env,{waitUntil:promise=>notifications.push(promise.catch(()=>{}))});};
  assert.equal((await send('payment_intent.payment_failed','evt_declined')).status,200);assert.equal((await f.DB.prepare('SELECT reserved FROM supplement_checkout_offers').first()).reserved,2);
  assert.equal((await send('checkout.session.completed','evt_paid_1')).status,200);assert.equal((await send('checkout.session.async_payment_succeeded','evt_paid_2')).status,200);
  assert.equal((await f.DB.prepare('SELECT stock_quantity FROM supplement_checkout_offers').first()).stock_quantity,8);assert.equal((await f.DB.prepare('SELECT stock_on_hand FROM medicine_inventory WHERE variant_id=11').first()).stock_on_hand,0);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM supplement_fulfilment_queue').first()).n,1);assert.equal((await f.DB.prepare('SELECT clinical_status FROM medicine_orders').first()).clinical_status,'assessment_pending');await Promise.allSettled(notifications);
 }finally{globalThis.fetch=old;f.DB.close();}
});
