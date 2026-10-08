import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import hq from './hq-ai-v2.js';

class D1Statement{
  constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}
  bind(...params){return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v))}
  async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{last_row_id:Number(r.lastInsertRowid||0),changes:Number(r.changes||0)}}}
  async first(){return this.db.prepare(this.sql).get(...this.params)||null}
  async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}
  catch(fn){return this.run().catch(fn)}
}
class D1Database{
  constructor(){this.sqlite=new DatabaseSync(':memory:',{enableDoubleQuotedStringLiterals:true});this.sqlite.exec('PRAGMA foreign_keys = ON')}
  prepare(sql){return new D1Statement(this.sqlite,sql)}
  async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
  exec(sql){this.sqlite.exec(sql);return Promise.resolve({success:true})}
}

const DB=new D1Database();
// Core's additive schema intentionally assumes these foundational tables already exist in deployed D1.
// Mirror that deployed prerequisite rather than weakening the application schema or creating a test-only bypass.
DB.sqlite.exec(`
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_auth (user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER NOT NULL DEFAULT 0,email_verified_at TEXT,failed_login_attempts INTEGER NOT NULL DEFAULT 0,locked_until TEXT,last_login_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE member_status (user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,revoked_at TEXT,last_used_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE cases (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,reference TEXT,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE pharmacy_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,case_id INTEGER,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE shift_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,plan_type TEXT NOT NULL,starts_on TEXT,ends_on TEXT,status TEXT NOT NULL DEFAULT 'active',plan_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE radar_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER,action TEXT NOT NULL,detail_json TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE radar_events (id INTEGER PRIMARY KEY AUTOINCREMENT,event_key TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'detected',headline TEXT NOT NULL,content_package_json TEXT NOT NULL DEFAULT '{}',reviewed_at TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE radar_publication_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'queued',error_text TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT);
`);
const env={DB,ADMIN_API_KEY:'b06-commissioning-admin-key',AI:{},EMAIL:{}};
const origin='https://hq.shiftsometimber.co.uk';
const req=(path,{method='GET',body,headers={}}={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,{method,headers:{Origin:origin,...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
const read=async r=>{const text=await r.text();try{return JSON.parse(text)}catch{return{text}}};
const call=async(path,opts={})=>{const response=await hq.fetch(req(path,opts),env,{});return{response,body:await read(response.clone())}};

DB.sqlite.exec('CREATE TABLE assessments(id INTEGER PRIMARY KEY,user_id INTEGER,status TEXT,created_at TEXT)');
const assertStatus=(r,s)=>assert.equal(r.response.status,s,JSON.stringify(r.body));
const ownerEmail='owner@example.test',password='Local-Commissioning-Only-42';
let x=await call('/v1/hq/auth/bootstrap',{method:'POST',body:{name:'Test owner',email:ownerEmail,password},headers:{'X-Shift-Admin-Key':env.ADMIN_API_KEY}});assertStatus(x,201);
x=await call('/v1/hq/auth/login',{method:'POST',body:{email:ownerEmail,password}});assertStatus(x,200);const ownerCookie=x.response.headers.get('set-cookie').split(';')[0],ownerAuth={Cookie:ownerCookie};
await DB.prepare("INSERT INTO users(email,first_name,created_at) VALUES('member@actual.test','Private name','2026-10-07 12:00:00')").run();
await DB.prepare("INSERT INTO orders(order_number,total_pence,currency,status,payment_status,created_at) VALUES('LIVE-1',10000,'GBP','processing','paid','2026-10-06 12:00:00')").run();
await DB.prepare("INSERT INTO orders(order_number,total_pence,currency,status,payment_status,created_at) VALUES('TEST-1',99999,'GBP','processing','paid','2026-10-06 12:00:00')").run();
DB.sqlite.exec("CREATE TABLE commerce_order_details(order_id INTEGER PRIMARY KEY,stripe_checkout_session_id TEXT,size TEXT,delivery_pence INTEGER,shipping_name TEXT,shipping_address_json TEXT,stripe_payment_intent_id TEXT,stripe_payment_status TEXT)");
await DB.prepare("INSERT INTO commerce_order_details(order_id,stripe_checkout_session_id) VALUES(1,'cs_live_one')").run();await DB.prepare("INSERT INTO commerce_order_details(order_id,stripe_checkout_session_id) VALUES(2,'cs_test_one')").run();
await DB.prepare("INSERT INTO commerce_refunds(order_id,stripe_refund_id,amount_pence,environment,created_at) VALUES(1,'re_live_one',2000,'live','2026-10-07 12:00:00')").run();
x=await call('/v1/hq/management/report',{method:'OPTIONS'});assertStatus(x,204);
const query='?start=2026-10-01&end=2026-10-07&kind=management';
x=await call('/v1/hq/management/report'+query);assertStatus(x,401);
x=await call('/v1/hq/management/report'+query,{headers:ownerAuth});assertStatus(x,200);assert.equal(x.response.headers.get('Access-Control-Allow-Origin'),'https://hq.shiftsometimber.co.uk');const report=x.body;assert.equal(report.metrics.find(m=>m.key==='paid_value').value,10000);assert.equal(report.metrics.find(m=>m.key==='orders').value,1);assert.equal(report.metrics.find(m=>m.key==='refunds').value,2000);assert.equal(report.metrics.find(m=>m.key==='organic').value,null);assert.ok(!JSON.stringify(report).includes('Private name'));assert.ok(!JSON.stringify(report).includes('member@actual.test'));
for(const bad of ['?start=2026-02-30&end=2026-10-07','?start=2026-10-08&end=2026-10-07','?start=2026-10-01&end=2026-10-07&kind=bogus']){x=await call('/v1/hq/management/report'+bad,{headers:ownerAuth});assertStatus(x,400)}
x=await call('/v1/hq/management/export',{method:'POST',headers:ownerAuth,body:{kind:'sales',start:'2026-10-01',end:'2026-10-07',format:'pdf'}});assertStatus(x,200);assert.equal(x.body.auditRecorded,true);const exportAudit=await DB.prepare("SELECT * FROM hq_audit WHERE action='hq.report_export_prepared'").first();assert.equal(exportAudit.hq_user_id,1);
const originalPrepare=DB.prepare.bind(DB);DB.prepare=function(sql){if(sql.startsWith('INSERT INTO hq_audit'))throw Error('simulated audit failure');return originalPrepare(sql)};x=await call('/v1/hq/management/export',{method:'POST',headers:ownerAuth,body:{kind:'sales',start:'2026-10-01',end:'2026-10-07',format:'csv'}});assertStatus(x,503);assert.equal(x.body.error,'export_audit_unavailable');DB.prepare=originalPrepare;
const cookies={owner:ownerCookie};for(const role of ['admin','support','readonly','content']){x=await call('/v1/hq/users',{method:'POST',headers:ownerAuth,body:{name:'Test '+role,email:role+'@example.test',password,role}});assertStatus(x,201);x=await call('/v1/hq/auth/login',{method:'POST',body:{email:role+'@example.test',password}});assertStatus(x,200);cookies[role]=x.response.headers.get('set-cookie').split(';')[0];}
for(const role of ['support','readonly','content']){x=await call('/v1/hq/users',{headers:{Cookie:cookies[role]}});assertStatus(x,403);x=await call('/v1/hq/users/2',{method:'PATCH',headers:{Cookie:cookies[role]},body:{role:'owner'}});assertStatus(x,403);}
x=await call('/v1/hq/audit',{headers:{Cookie:cookies.support}});assertStatus(x,403);
x=await call('/v1/hq/management/report'+query,{headers:{Cookie:cookies.support}});assertStatus(x,200);assert.equal(x.body.metrics.find(m=>m.key==='paid_value').status,'unavailable');
x=await call('/v1/hq/users/1',{method:'PATCH',headers:ownerAuth,body:{status:'disabled'}});assertStatus(x,409);
x=await call('/v1/hq/users/1',{method:'PATCH',headers:{Cookie:cookies.admin},body:{status:'disabled'}});assertStatus(x,409);
const support=await DB.prepare("SELECT id FROM hq_users WHERE role='support'").first();x=await call('/v1/hq/users/'+support.id,{method:'PATCH',headers:ownerAuth,body:{status:'disabled'}});assertStatus(x,200);assert.equal(x.body.auditRecorded,true);x=await call('/v1/hq/me',{headers:{Cookie:cookies.support}});assertStatus(x,401);const changeAudit=await DB.prepare("SELECT * FROM hq_audit WHERE action='hq.user_updated' ORDER BY id DESC LIMIT 1").first();assert.equal(JSON.parse(changeAudit.metadata).before.status,'active');assert.equal(JSON.parse(changeAudit.metadata).after.status,'disabled');
// An audit failure must roll back the access change.
const readonly=await DB.prepare("SELECT id FROM hq_users WHERE role='readonly'").first();DB.sqlite.exec("CREATE TRIGGER fail_access_audit BEFORE INSERT ON hq_audit WHEN NEW.action='hq.user_updated' BEGIN SELECT RAISE(ABORT,'audit failed'); END");x=await call('/v1/hq/users/'+readonly.id,{method:'PATCH',headers:ownerAuth,body:{status:'disabled'}});assertStatus(x,503);assert.equal((await DB.prepare('SELECT status FROM hq_users WHERE id=?').bind(readonly.id).first()).status,'active');DB.sqlite.exec('DROP TRIGGER fail_access_audit');
const {reportWindow}=await import('./hq-management-api.mjs');assert.equal(reportWindow('2026-10-01','2026-10-07').since,'2026-09-30T23:00:00.000Z');assert.equal(reportWindow('2026-10-25','2026-10-25').until,'2026-10-26T00:00:00.000Z');
console.log('PASS: authenticated reporting, live/test separation, dates/DST, missing-data labels, role denials, export audit failure, staff audit rollback, disabled sessions, last owner protection.');
export {hq,env,DB,cookies,report};
