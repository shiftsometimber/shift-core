import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from './worker.js';
import {ingestHealthMot,latestHealthMot,healthMotProgressView} from './health-mot-adapter-v1.js';
import {buildShiftBrainContext} from './shift-brain-v1.js';
import {memberDailyV3Routes} from './member-daily-v3.js';
import {memberDailyV2Routes} from './member-daily-v2.js';

class D1Statement{
  constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}
  bind(...params){return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v))}
  async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{last_row_id:Number(r.lastInsertRowid||0),changes:Number(r.changes||0)}}
  async first(){return this.db.prepare(this.sql).get(...this.params)||null}
  async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}
  catch(fn){return this.run().catch(fn)}
}
class D1Database{
  constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec('PRAGMA foreign_keys = ON')}
  prepare(sql){return new D1Statement(this.sqlite,sql)}
  async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
  exec(sql){return Promise.resolve(this.sqlite.exec(sql))}
}
const sha256=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const req=(path,options={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,options);
const json=async response=>JSON.parse(await response.text());

const DB=new D1Database();
DB.sqlite.exec(`
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_auth (user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER NOT NULL DEFAULT 0,email_verified_at TEXT,failed_login_attempts INTEGER NOT NULL DEFAULT 0,locked_until TEXT,last_login_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE member_status (user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,revoked_at TEXT,last_used_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE cases (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,reference TEXT,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE pharmacy_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,case_id INTEGER,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE shift_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,plan_type TEXT NOT NULL,starts_on TEXT,ends_on TEXT,status TEXT NOT NULL DEFAULT 'active',plan_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
const env={DB,AUTO_VERIFY_EMAIL:'true'};

// Build the same additive Core schema production uses.
let response=await worker.fetch(req('/health'),env,{});assert.equal(response.status,200);

await DB.prepare(`INSERT INTO users(email,first_name,last_name) VALUES(?,?,?)`).bind('mot-dave@shift.test','Dave','MOT').run();
await DB.prepare(`INSERT INTO users(email,first_name,last_name) VALUES(?,?,?)`).bind('mot-other@shift.test','Other','Member').run();
const dave=await DB.prepare('SELECT id FROM users WHERE email=?').bind('mot-dave@shift.test').first();
const other=await DB.prepare('SELECT id FROM users WHERE email=?').bind('mot-other@shift.test').first();
await DB.prepare(`INSERT OR IGNORE INTO member_status(user_id,lifecycle_stage,membership_status) VALUES(?,'active','programme')`).bind(dave.id).run();
await DB.prepare(`INSERT OR IGNORE INTO member_status(user_id,lifecycle_stage,membership_status) VALUES(?,'active','programme')`).bind(other.id).run();
await DB.prepare(`INSERT OR IGNORE INTO member_state(user_id) VALUES(?)`).bind(dave.id).run();
await DB.prepare(`INSERT OR IGNORE INTO member_state(user_id) VALUES(?)`).bind(other.id).run();
await DB.prepare(`INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,source) VALUES(?,?,?,?,?,?,?,?)`).bind(dave.id,'2026-08-01',114.3,108,136,91,72,'member').run();

const token='mot-stage-session',hash=await sha256(token),expires=new Date(Date.now()+3600_000).toISOString();
await DB.prepare(`INSERT INTO user_sessions(user_id,token_hash,expires_at,last_used_at) VALUES(?,?,?,?)`).bind(dave.id,hash,expires,new Date().toISOString()).run();
const authHeaders={'cookie':`sst_session=${token}`};

const payload={
  collectedAt:'2026-08-12T09:30:00Z',
  results:[
    {code:'weight_kg',label:'Weight',value:109.8,unit:'kg',status:'normal'},
    {code:'waist_cm',label:'Waist',value:104,unit:'cm',status:'normal'},
    {code:'systolic',label:'Systolic blood pressure',value:128,unit:'mmHg',status:'normal'},
    {code:'diastolic',label:'Diastolic blood pressure',value:82,unit:'mmHg',status:'normal'},
    {code:'resting_hr',label:'Resting heart rate',value:64,unit:'bpm',status:'normal'},
    {code:'ldl_mmol_l',label:'LDL cholesterol',value:2.7,unit:'mmol/L',status:'normal'}
  ]
};
const source={provider:'mock-lab-partner',externalRef:'mock-result-001',receivedAt:'2026-08-12T10:00:00Z'};

// 1) Mocked partner result normalises, persists and remains non-diagnostic.
const first=await ingestHealthMot(env,{userId:dave.id,payload,source});
assert.equal(first.duplicate,false);assert.ok(first.id);assert.ok(first.progressEntryId);
assert.equal(first.mot.schema,'health-mot/v1');assert.equal(first.mot.review.state,'unreviewed');
assert.equal(first.mot.rules.shiftMaySummarise,true);assert.equal(first.mot.rules.shiftMayDiagnose,false);assert.equal(first.mot.rules.shiftMayChangeTreatment,false);
assert.equal(first.progressSignals.length,5);assert.ok(!first.progressSignals.some(x=>x.code==='ldl_mmol_l'));

// 2) Recognised measurements become a clearly sourced Progress entry; unrelated lab values do not leak into Progress columns.
const view=await healthMotProgressView(DB,dave.id);assert.equal(view.latest.id,first.id);assert.equal(view.progressEntry.id,first.progressEntryId);
assert.equal(view.progressEntry.weight_kg,109.8);assert.equal(view.progressEntry.waist_cm,104);assert.equal(view.progressEntry.systolic,128);assert.equal(view.progressEntry.diastolic,82);assert.equal(view.progressEntry.resting_hr,64);assert.equal(view.progressEntry.source,`health_mot:${first.id}`);

// 3) Provider retries are idempotent: same external reference does not duplicate MOT or Progress data.
const retry=await ingestHealthMot(env,{userId:dave.id,payload,source});assert.equal(retry.duplicate,true);assert.equal(retry.id,first.id);assert.equal(retry.progressEntryId,first.progressEntryId);
assert.equal(Number((await DB.prepare('SELECT COUNT(*) c FROM health_mot_results WHERE user_id=?').bind(dave.id).first()).c),1);
assert.equal(Number((await DB.prepare("SELECT COUNT(*) c FROM progress_entries WHERE user_id=? AND source LIKE 'health_mot:%'").bind(dave.id).first()).c),1);

// 4) Member isolation: another member cannot inherit Dave's MOT.
assert.equal(await latestHealthMot(DB,other.id),null);

// 5) Canonical One Shift Brain sees the imported measurements through the same Progress contract.
const brain=await buildShiftBrainContext(env,dave.id,'today',{knowledgeLimit:0});
assert.equal(brain.progress.latest.weight_kg,109.8);assert.equal(brain.progress.latest.waist_cm,104);assert.equal(brain.progress.latest.systolic,128);assert.equal(brain.progress.latest.source,`health_mot:${first.id}`);
assert.equal(brain.rules.clinicalDecisionsRemainOutsideShiftAI,true);

// 6) The real member Progress summary and Today route consume the imported state after authentication.
response=await memberDailyV2Routes(req('/v1/progress/summary',{headers:authHeaders}),env,{});assert.equal(response.status,200);let body=await json(response);
assert.equal(body.progress.latest_weight.kg,109.8);assert.equal(body.progress.entries,2);assert.ok(body.progress.metrics.some(x=>x.key==='weight'&&x.delta===-4.5));assert.ok(body.progress.metrics.some(x=>x.key==='systolic'&&x.latest===128));
response=await memberDailyV3Routes(req('/v1/shift/today',{headers:authHeaders}),env,{});assert.equal(response.status,200);body=await json(response);
assert.equal(body.today.brain.latestProgressDate,'2026-08-12');assert.equal(body.today.context_used.one_shift_brain,true);assert.ok(body.today.actions.some(x=>x.domain==='progress'&&/4\.5kg down/.test(x.title)));

console.log(JSON.stringify({
  ok:true,
  motId:first.id,
  progressEntryId:first.progressEntryId,
  idempotentRetry:retry.duplicate,
  imported:{weightKg:109.8,waistCm:104,bp:'128/82',restingHr:64},
  progressSummary:'114.3kg -> 109.8kg',
  todayLatestProgressDate:body.today.brain.latestProgressDate,
  memberIsolation:true,
  clinicalBoundary:{diagnose:false,changeTreatment:false}
},null,2));
console.log('PASS M15 mocked partner Health MOT -> sourced Progress -> One Shift Brain -> authenticated Today, with idempotency, member isolation and clinical boundaries');
