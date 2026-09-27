import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import core from '../worker.js';
import legacyAI from '../shift-ai.js';
import {myJourneyRoutes} from '../my-journey-v1.js';

class Statement {
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){return this.db.sqlite.prepare(this.sql).get(...this.args)||null}
  async all(){return {results:this.db.sqlite.prepare(this.sql).all(...this.args)}}
  async run(){const r=this.db.sqlite.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}
}
class D1 {
  constructor(){this.sqlite=new DatabaseSync(':memory:')}
  prepare(sql){return new Statement(this,sql)}
  async exec(sql){this.sqlite.exec(sql)}
  async batch(statements){this.sqlite.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());this.sqlite.exec('COMMIT');return rows}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
}

// Bootstrap the actual legacy core once, then reproduce that database schema for
// independent tests. No route replacement or source-extracted implementation.
const bootstrap=new D1();
bootstrap.sqlite.exec(`
 CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER,last_login_at TEXT);
 CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
 CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT,updated_at TEXT);
 CREATE TABLE cases(id INTEGER PRIMARY KEY,user_id INTEGER);
 CREATE TABLE pharmacy_orders(id INTEGER PRIMARY KEY,user_id INTEGER);
`);
// Readiness no longer bootstraps or inspects member tables. Exercise the normal
// guarded core path for this isolated fixture, retaining anonymous denial.
const bootResponse=await core.fetch(new Request('https://api.shiftsometimber.co.uk/v1/me'),{DB:bootstrap});
assert.equal(bootResponse.status,401,'real legacy core must initialise and deny anonymous access');
const schema=bootstrap.sqlite.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END,name").all().map(r=>r.sql+';').join('\n');
bootstrap.sqlite.close();
const OLD='2026-01-01T12:00:00.000Z',WITHDRAW='2026-02-01T12:00:00.000Z',BETWEEN='2026-03-01T12:00:00.000Z',DELETE='2026-04-01T12:00:00.000Z',FRESH='2026-05-01T12:00:00.000Z';
const sha=v=>createHash('sha256').update(v).digest('hex');
const ratings={energy:60,sleep:60,confidence:60,movement:60,clothes:60,personal:60};
const prefs=()=>({myJourney:{setup:{why:'PRIVATE_SETUP_WHY',paused:false},weight:{currentKg:123.45}},lifeBack:{progress:{goalId:'synthetic-goal',goal:'PRIVATE_LIFE_BACK_GOAL',entries:[{id:'synthetic-entry',goalId:'synthetic-goal',at:OLD,ratings,win:'PRIVATE_LIFE_BACK_WIN'}]}},unrelatedLegacy:{healthNote:'PRIVATE_LEGACY_PREFERENCE'}});

function fixture(t){
 const DB=new D1();DB.sqlite.exec(schema);t.after(()=>DB.sqlite.close());
 DB.sqlite.exec(`
  CREATE TABLE shift_ai_conversations(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,direction TEXT,mode TEXT,body TEXT,model TEXT,created_at TEXT);
  CREATE TABLE shift_ai_member_memory(user_id INTEGER,memory_key TEXT,memory_value TEXT,updated_at TEXT);
  CREATE TABLE shift_ai_memory_v2(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,memory_key TEXT,category TEXT,memory_value TEXT,confidence REAL,source TEXT,created_at TEXT,updated_at TEXT,UNIQUE(user_id,memory_key));
  CREATE TABLE shift_ai_privacy_settings(user_id INTEGER PRIMARY KEY,auto_memory INTEGER,proactive_insights INTEGER,proactive_cooldown_hours INTEGER,updated_at TEXT);
  CREATE TABLE shift_plans(id INTEGER PRIMARY KEY,user_id INTEGER,plan_type TEXT,starts_on TEXT,ends_on TEXT,status TEXT,plan_json TEXT,created_at TEXT);
  CREATE TABLE product_feedback(user_id INTEGER,product TEXT,entity_id TEXT,sentiment TEXT,reason TEXT,context_json TEXT,scope TEXT,expires_at TEXT,favourite INTEGER,updated_at TEXT);
  INSERT INTO users VALUES(1,'PRIVATE_EMAIL@example.test','Synthetic','Member','PRIVATE_PHONE','PRIVATE_DOB','PRIVATE_POSTCODE','2026-01-01','2026-01-01');
  INSERT INTO user_auth VALUES(1,1,'2026-01-01');
  INSERT INTO member_status VALUES(1,'member','active','synthetic','2026-01-01','2026-01-01');
  INSERT INTO shift_ai_privacy_settings VALUES(1,0,0,48,'2026-01-01');
 `);
 DB.sqlite.prepare('INSERT INTO user_sessions VALUES(1,1,?,?,NULL,NULL)').run(sha('synthetic-legacy-session'),'2099-01-01T00:00:00Z');
 DB.sqlite.prepare('INSERT INTO member_state(user_id,preferences) VALUES(1,?)').run(JSON.stringify(prefs()));
 consent(DB,true,OLD);
 DB.sqlite.prepare('INSERT INTO progress_entries(user_id,recorded_on,weight_kg,source) VALUES(1,?,?,?)').run('2026-01-01',123.45,'PRIVATE_PROGRESS_SOURCE');
 DB.sqlite.prepare('INSERT INTO shift_plans VALUES(1,1,?,?,?,?,?,?)').run('fit','2026-01-01',null,'active',JSON.stringify({label:'PRIVATE_OLD_PLAN'}),OLD);
 DB.sqlite.prepare("INSERT INTO product_feedback VALUES(1,'grub','PRIVATE_FEEDBACK','nay','PRIVATE_REASON','{}','permanent',NULL,0,?)").run(OLD);
 remember(DB,'PRIVATE_OLD',OLD);
 const calls=[],env={DB,AI:{run:async(model,options)=>{calls.push(options);return {response:'Synthetic response from allowed context.'}}}};
 return {DB,env,calls};
}
function consent(DB,granted,at){DB.sqlite.prepare("INSERT INTO consents(user_id,consent_type,granted,created_at) VALUES(1,'my_shift_health_tracking',?,?)").run(granted?1:0,at)}
function remember(DB,label,at){
 DB.sqlite.prepare("INSERT INTO shift_ai_conversations(user_id,direction,mode,body,created_at) VALUES(1,'assistant','coach',?,?)").run(label+'_DIALOGUE',at);
 DB.sqlite.prepare('INSERT INTO shift_ai_member_memory VALUES(1,?,?,?)').run(label.toLowerCase(),label+'_EXPLICIT_NOTE',at);
 DB.sqlite.prepare("INSERT INTO shift_ai_memory_v2(user_id,memory_key,category,memory_value,confidence,source,created_at,updated_at) VALUES(1,?,'goal',?,1,'synthetic',?,?)").run(label.toLowerCase(),label+'_INTELLIGENT_MEMORY',at,at);
}
const request=(path='/v1/shift-ai/chat',method='POST')=>new Request('https://api.shiftsometimber.co.uk'+path,{method,headers:{Cookie:'sst_session=synthetic-legacy-session',Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify({message:'What is my next useful step?'})}:{})});
async function chat(env,calls){
 const response=await legacyAI.fetch(request(),env),body=await response.json();
 assert.equal(response.status,200,JSON.stringify(body));assert.equal(calls.length,1,'one real chat generation; automatic memory disabled in fixture');
 return {body,prompt:calls[0].messages.map(m=>m.content).join('\n'),messages:calls[0].messages};
}
function assertPrivateSuppressed(prompt){
 assert.doesNotMatch(prompt,/PRIVATE_OLD|PRIVATE_PROGRESS_SOURCE|123\.45|PRIVATE_LIFE_BACK|PRIVATE_SETUP_WHY|PRIVATE_OLD_PLAN|PRIVATE_FEEDBACK|PRIVATE_REASON|PRIVATE_LEGACY_PREFERENCE/);
 assert.doesNotMatch(prompt,/PRIVATE_EMAIL|PRIVATE_DOB|PRIVATE_POSTCODE|PRIVATE_PHONE/);
}

test('legacy chat with withdrawn tracking suppresses progress, goals, plans, feedback, notes, memories and history',async t=>{
 const {DB,env,calls}=fixture(t);consent(DB,false,WITHDRAW);
 const result=await chat(env,calls);assertPrivateSuppressed(result.prompt);
 assert.equal(result.body.journeyUsed,false);assert.equal(result.body.memoryUsed,false);assert.equal(result.body.feedbackUsed,false);assert.equal(result.body.activePlansUsed,false);
 assert.equal(result.messages.length,2);
});

test('legacy chat with paused Journey suppresses optional records even with active consent',async t=>{
 const {DB,env,calls}=fixture(t),p=prefs();p.myJourney.setup.paused=true;
 DB.sqlite.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify(p));
 const result=await chat(env,calls);assertPrivateSuppressed(result.prompt);assert.equal(result.body.journeyUsed,false);assert.equal(result.messages.length,2);
});

test('withdrawn then re-enabled tracking excludes pre-withdrawal dialogue and both memory stores',async t=>{
 const {DB,env,calls}=fixture(t);consent(DB,false,WITHDRAW);consent(DB,true,BETWEEN);
 // This is the persisted state after optional-health erasure. Legacy copies
 // intentionally remain to prove they cannot sneak back into the prompt.
 DB.sqlite.prepare("UPDATE member_state SET preferences='{}' WHERE user_id=1").run();
 DB.sqlite.prepare('DELETE FROM progress_entries WHERE user_id=1').run();
 remember(DB,'FRESH_ALLOWED',FRESH);
 const result=await chat(env,calls);assertPrivateSuppressed(result.prompt);
 for(const suffix of ['DIALOGUE','EXPLICIT_NOTE','INTELLIGENT_MEMORY'])assert(result.prompt.includes('FRESH_ALLOWED_'+suffix));
 assert.equal(result.body.memoryUsed,true);assert.equal(result.body.journeyUsed,true);assert.equal(result.body.activePlansUsed,false);
});

test('actual My Journey deletion fences old copies without requiring a consent withdrawal; newer audit wins',async t=>{
 const {DB,env,calls}=fixture(t);consent(DB,false,WITHDRAW);consent(DB,true,BETWEEN);remember(DB,'PRIVATE_BETWEEN',BETWEEN);
 const deletion=await myJourneyRoutes(request('/v1/journey','DELETE'),env);assert.equal(deletion.status,200);
 const audit=DB.sqlite.prepare("SELECT id FROM audit_log WHERE user_id=1 AND action='my_journey.delete'").get();assert(audit,'the real delete route must record its privacy boundary');
 // Fix the event clock to compare independently ordered stored timestamps.
 DB.sqlite.prepare('UPDATE audit_log SET created_at=? WHERE id=?').run(DELETE,audit.id);
 // Real deletion removes only progress derived from Journey. Seed was a
 // separate progress record: keep that outside this historical-copy assertion.
 DB.sqlite.prepare('DELETE FROM progress_entries WHERE user_id=1').run();
 remember(DB,'FRESH_AFTER_DELETE',FRESH);
 const result=await chat(env,calls);assertPrivateSuppressed(result.prompt);assert.doesNotMatch(result.prompt,/PRIVATE_BETWEEN/);
 for(const suffix of ['DIALOGUE','EXPLICIT_NOTE','INTELLIGENT_MEMORY'])assert(result.prompt.includes('FRESH_AFTER_DELETE_'+suffix));
 assert.equal(result.body.journeyUsed,true);assert.equal(DB.sqlite.prepare("SELECT granted FROM consents WHERE user_id=1 ORDER BY id DESC LIMIT 1").get().granted,1);
});
