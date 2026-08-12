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
  constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec('PRAGMA foreign_keys = ON')}
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
CREATE TABLE radar_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,action TEXT NOT NULL,detail_json TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
const env={DB,ADMIN_API_KEY:'b06-commissioning-admin-key',AI:{},EMAIL:{}};
const origin='https://hq.shiftsometimber.co.uk';
const req=(path,{method='GET',body,headers={}}={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,{method,headers:{Origin:origin,...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
const read=async r=>{const text=await r.text();try{return JSON.parse(text)}catch{return{text}}};
const call=async(path,opts={})=>{const response=await hq.fetch(req(path,opts),env,{});return{response,body:await read(response.clone())}};

let mode='green';const realFetch=globalThis.fetch;
globalThis.fetch=async input=>{
  const url=String(input instanceof Request?input.url:input),service=url.includes('/health')?'core':url.includes('/v1/radar/ticker')?'radar':'public';
  if(mode==='red'&&service==='core')return new Response('down',{status:503});
  if(mode==='amber'&&service==='core')await new Promise(r=>setTimeout(r,850));
  return new Response(service==='radar'?JSON.stringify({ok:true,items:[]}):'ok',{status:200,headers:{'content-type':service==='radar'?'application/json':'text/plain'}});
};

try{
  // Exercise the real additive Core schema before HQ bootstrap.
  let x=await call('/health');assert.equal(x.response.status,200);
  await DB.prepare(`INSERT INTO radar_audit(action,created_at) VALUES('scan',CURRENT_TIMESTAMP)`).run();

  // Anonymous visitors cannot inspect operational attention.
  x=await call('/v1/hq/attention');assert.equal(x.response.status,401);assert.equal(x.body.ok,false);

  // Bootstrap is separately admin-key protected; the fire drill itself uses a normal HQ owner session.
  const email='commissioning-owner@shift.test',password='Shift-B06-Operator-2026!';
  x=await call('/v1/hq/auth/bootstrap',{method:'POST',headers:{'x-shift-admin-key':env.ADMIN_API_KEY},body:{email,name:'Commissioning Operator',password}});
  assert.equal(x.response.status,201,JSON.stringify(x.body));
  x=await call('/v1/hq/auth/login',{method:'POST',body:{email,password}});assert.equal(x.response.status,200,JSON.stringify(x.body));
  const cookie=(x.response.headers.get('set-cookie')||'').split(';')[0];assert.match(cookie,/^sst_hq_session=/);assert.equal(x.body.user.role,'owner');
  const auth={Cookie:cookie};

  // Authorised operator sees healthy baseline through the actual HQ attention route.
  x=await call('/v1/hq/attention',{headers:auth});assert.equal(x.response.status,200);assert.equal(x.body.status,'GREEN');assert.equal(x.body.attention.length,0);

  // Controlled latency becomes actionable AMBER, visible to the logged-in operator.
  mode='amber';
  x=await call('/v1/hq/attention',{headers:auth});assert.equal(x.body.status,'AMBER');
  const latency=x.body.attention.find(a=>a.code==='core_latency');assert.ok(latency?.nextAction);assert.match(latency.nextAction,/Inspect/i);

  // Controlled core outage becomes actionable RED. Nothing in production is deliberately broken.
  mode='red';
  x=await call('/v1/hq/attention',{headers:auth});assert.equal(x.body.status,'RED');
  const outage=x.body.attention.find(a=>a.code==='core_failure_rate');assert.ok(outage?.nextAction);assert.match(outage.nextAction,/Inspect/i);
  const watch=await call('/v1/hq/watchtower',{headers:auth});assert.equal(watch.response.status,200);assert.equal(watch.body.status,'RED');assert.ok(watch.body.platform.probes.some(p=>p.service==='core'&&p.ok===false&&p.status===503));

  // Recovery is observable but the outage remains retained in operational history.
  mode='green';
  const restored=await call('/v1/hq/watchtower',{headers:auth});assert.equal(restored.response.status,200);assert.ok(restored.body.platform.probes.every(p=>p.ok));
  const history=await DB.prepare(`SELECT service,ok,status,error,checked_at FROM watchtower_probe_history WHERE service='core' ORDER BY id`).all();
  assert.ok(history.results.length>=5);assert.ok(history.results.some(p=>Number(p.ok)===0&&Number(p.status)===503));assert.equal(Number(history.results.at(-1).ok),1);

  // Once the retained trend window has genuinely elapsed, the same authorised HQ route returns healthy.
  await DB.prepare(`UPDATE watchtower_probe_history SET checked_at=datetime('now','-25 hours')`).run();
  x=await call('/v1/hq/attention',{headers:auth});assert.equal(x.body.status,'GREEN');assert.equal(x.body.attention.length,0);

  const audit=await DB.prepare(`SELECT action,entity_type,entity_id FROM hq_audit ORDER BY id`).all();
  assert.ok(audit.results.some(a=>a.action==='hq.bootstrap'));
  assert.ok(audit.results.some(a=>a.action==='hq.login'));
  const sessions=await DB.prepare(`SELECT COUNT(*) c FROM hq_sessions WHERE revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP`).first();assert.equal(Number(sessions.c),1);

  console.log(JSON.stringify({anonymousDenied:true,operator:{email,role:'owner',session:true},journey:['GREEN','AMBER','RED','RECOVERED','GREEN'],amber:{alert:latency.code,nextAction:latency.nextAction},red:{alert:outage.code,nextAction:outage.nextAction},retainedCoreSamples:history.results.length,auditActions:audit.results.map(a=>a.action),productionDependencyBroken:false},null,2));
  console.log('PASS B06 authorised HQ operator fire drill: anonymous denied -> owner login -> GREEN -> actionable AMBER -> actionable RED -> retained incident evidence -> healthy recovery through real HQ attention/Watchtower routes.');
}finally{globalThis.fetch=realFetch;}
