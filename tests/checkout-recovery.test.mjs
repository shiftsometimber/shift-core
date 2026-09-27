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
 const input=channel==='medicine'?{variantId:11,verificationToken:'fictional-verification'}:{size:'L',quantity:1};
 const route=channel==='medicine'?medicineCommerceRoutes:commerceStripeRoutes;
 const path=channel==='medicine'?'/v1/commerce/medicine-checkout':'/v1/commerce/checkout';
 const call=async(body=input,cookie='e2e-member-session')=>{const r=await route(memberRequest(path,{method:'POST',headers:{'content-type':'application/json',Cookie:'sst_session='+cookie},body:JSON.stringify(body)}),env,{});return {status:r.status,body:await r.json()}};
 return {DB,env,call,input};
}
for(const channel of ['apparel','medicine']){
 test(channel+': provider accepts then response is lost; retry recovers same request and reservation',async()=>{
  const f=await fixture(channel),old=globalThis.fetch,seen=[];let fail=true;
  globalThis.fetch=async(url,init)=>{assert.equal(String(url),'https://api.stripe.com/v1/checkout/sessions');seen.push({key:init.headers['Idempotency-Key'],body:String(init.body)});if(fail){fail=false;throw Error('accepted then disconnected')}return Response.json({id:'cs_test_recovered',url:'https://checkout.stripe.test/recovered'})};
  try{assert.equal((await f.call()).status,503);const retry=await f.call();assert.equal(retry.status,201);assert.equal(seen.length,2);assert.deepEqual(seen[0],seen[1]);const table=channel==='medicine'?'medicine_orders':'orders';assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM '+table).first()).n,1);assert.equal((await f.call()).body.orderNumber,retry.body.orderNumber);assert.equal(seen.length,2);assert.equal((await f.call(f.input,'wrong-account')).status,401)}finally{globalThis.fetch=old;f.DB.close()}
 });
 test(channel+': parallel clicks create one order and use one provider identity',async()=>{
  const f=await fixture(channel),old=globalThis.fetch,keys=[];globalThis.fetch=async(url,init)=>{keys.push(init.headers['Idempotency-Key']);return Response.json({id:'cs_test_parallel',url:'https://checkout.stripe.test/parallel'})};
  try{const rows=await Promise.all([f.call(),f.call(),f.call()]);assert.ok(rows.every(r=>[201,409].includes(r.status)));assert.equal(new Set(keys).size,1);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM '+(channel==='medicine'?'medicine_orders':'orders')).first()).n,1)}finally{globalThis.fetch=old;f.DB.close()}
 });
 test(channel+': interrupted preparation rolls back and retry prepares only once',async()=>{
  const f=await fixture(channel),oldFetch=globalThis.fetch,oldBatch=f.DB.batch.bind(f.DB);let failed=false;
  f.DB.batch=async statements=>{if(!failed&&statements.some(s=>s.sql.includes("state='building'"))){failed=true;f.DB.database.exec('BEGIN');try{for(let i=0;i<3;i++)await statements[i].run();throw Error('partial preparation')}finally{f.DB.database.exec('ROLLBACK')}}return oldBatch(statements)};
  globalThis.fetch=async()=>Response.json({id:'cs_test_prepared',url:'https://checkout.stripe.test/prepared'});
  try{await assert.rejects(()=>f.call(),/partial preparation/);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM '+(channel==='medicine'?'medicine_orders':'orders')).first()).n,0);assert.equal((await f.call()).status,201);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM '+(channel==='medicine'?'medicine_orders':'orders')).first()).n,1)}finally{globalThis.fetch=oldFetch;f.DB.close()}
 });
}
test('unknown attempts older than the provider idempotency window never issue a new request',async()=>{const f=await fixture('medicine'),old=globalThis.fetch;globalThis.fetch=async()=>{throw Error('network unknown')};try{await f.call();await f.DB.exec("UPDATE checkout_attempts SET created_at='2020-01-01T00:00:00Z'");let sent=false;globalThis.fetch=async()=>{sent=true;throw Error('must not send')};const result=await f.call();assert.equal(result.status,409);assert.equal(result.body.error,'checkout_requires_reconciliation');assert.equal(sent,false)}finally{globalThis.fetch=old;f.DB.close()}});
test('medicine stock is retained during outages and only released after confirmed expiry, atomically',async()=>{const f=await fixture('medicine'),old=globalThis.fetch;try{globalThis.fetch=async()=>Response.json({id:'cs_test_expiry',url:'https://checkout.stripe.test/expiry'});await f.call();await f.DB.exec("UPDATE medicine_orders SET created_at='2020-01-01T00:00:00Z'");globalThis.fetch=async()=>{throw Error('timeout')};assert.equal(await reconcileExpiredReservations(f.env),0);assert.equal((await f.DB.prepare('SELECT reserved FROM medicine_inventory WHERE variant_id=11').first()).reserved,1);globalThis.fetch=async()=>Response.json({id:'cs_test_expiry',status:'expired',payment_status:'unpaid'});assert.equal(await reconcileExpiredReservations(f.env),1);assert.equal(await reconcileExpiredReservations(f.env),0);assert.equal((await f.DB.prepare('SELECT reserved FROM medicine_inventory WHERE variant_id=11').first()).reserved,0)}finally{globalThis.fetch=old;f.DB.close()}});
