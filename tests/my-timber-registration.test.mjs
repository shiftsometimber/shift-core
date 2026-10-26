import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {fastMemberRegister} from '../member-register-fastpath-v2.js';
function database(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(`
 CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT UNIQUE,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,updated_at TEXT);
 CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER,email_verified_at TEXT);
 CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT);
 CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT,my_why TEXT,updated_at TEXT);
 CREATE TABLE consents(user_id INTEGER,consent_type TEXT,consent_version TEXT,granted INTEGER,granted_at TEXT);
 CREATE TABLE audit_log(user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,ip_address TEXT,created_at TEXT);
 CREATE TABLE user_sessions(user_id INTEGER,token_hash TEXT,expires_at TEXT,last_used_at TEXT,created_at TEXT);
 `);
 const db={sql,fail:false,prepare(query){return{bind(...params){return{query,params,async first(){return sql.prepare(query).get(...params)},async run(){const r=sql.prepare(query).run(...params);return{meta:{last_row_id:Number(r.lastInsertRowid)}}}}}}},async batch(ops){sql.exec('BEGIN');try{for(const op of ops){if(db.fail&&op.query.startsWith('UPDATE member_state'))throw Error('injected');sql.prepare(op.query).run(...op.params)}sql.exec('COMMIT')}catch(e){sql.exec('ROLLBACK');throw e}}};
 return db;
}
const body=()=>({email:'synthetic@example.invalid',password:'Synthetic-only-password',firstName:'Synthetic',consents:[{type:'terms',granted:true},{type:'adult_self_declaration',granted:true}],onboarding:{goals:['fitness'],firstStep:'movement',healthConsent:true,height:175,weight:90}});
const register=(db,data)=>fastMemberRegister(new Request('https://example.invalid/v1/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),{DB:db,AUTO_VERIFY_EMAIL:'true'});
test('setup and account saved together; onboarding always requires verification',async()=>{
 const db=database(),r=await register(db,body()),result=await r.json();
 assert.equal(r.status,201);assert.equal(result.emailVerified,false);assert.equal(result.onboardingSaved,true);
 assert.equal(db.sql.prepare('SELECT email_verified FROM user_auth').get().email_verified,0);
 const state=db.sql.prepare('SELECT * FROM member_state').get(),prefs=JSON.parse(state.preferences);
 assert.equal(prefs.myJourney.weight.currentKg,90);assert.equal(prefs.myTimberOnboarding.firstStep,'movement');assert.equal(JSON.parse(state.my_why).why,'Get fitter');
 assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM consents WHERE consent_type='my_timber_health_personalisation'").get().n,1);
});
test('failed setup rolls back auth, consent and session; retry succeeds without legacy fallback',async()=>{
 const db=database();db.fail=true;const r=await register(db,body());assert.equal(r.status,503);
 for(const table of ['user_auth','member_state','consents','user_sessions'])assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
 db.fail=false;assert.equal((await register(db,body())).status,201);
});
test('health fields discarded without explicit consent',async()=>{
 const db=database(),data=body();data.onboarding.healthConsent=false;data.onboarding.treatment='shift';
 assert.equal((await register(db,data)).status,201);
 const prefs=JSON.parse(db.sql.prepare('SELECT preferences FROM member_state').get().preferences);
 assert.equal(prefs.myJourney,undefined);assert.equal(prefs.myTimberOnboarding.weight,undefined);assert.equal(prefs.myTimberOnboarding.treatment,undefined);
});
test('orphan retry preserves existing tracker and other member preferences',async()=>{
 const db=database();db.sql.prepare('INSERT INTO users(id,email) VALUES(?,?)').run(1,body().email);
 db.sql.prepare('INSERT INTO member_state(user_id,preferences,my_why) VALUES(?,?,?)').run(1,JSON.stringify({deviceHealth:{keep:true},myJourney:{weight:{currentKg:80,startKg:85}}}),JSON.stringify({why:'Existing reason'}));
 assert.equal((await register(db,body())).status,201);
 const row=db.sql.prepare('SELECT * FROM member_state').get(),prefs=JSON.parse(row.preferences);
 assert.equal(prefs.myJourney.weight.currentKg,80);assert.equal(prefs.deviceHealth.keep,true);assert.equal(JSON.parse(row.my_why).why,'Existing reason');
});
test('malformed setup and missing declaration rejected before creating user',async()=>{
 for(const change of [d=>d.onboarding.goals='weight',d=>d.onboarding.weight=-1,d=>d.consents=[]]){
  const db=database(),data=body();change(data);assert.equal((await register(db,data)).status,400);assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM users').get().n,0);
 }
});
test('existing account cannot be overwritten',async()=>{
 const db=database();await register(db,body());const d=body();d.onboarding.weight=100;
 assert.equal((await register(db,d)).status,409);assert.equal(JSON.parse(db.sql.prepare('SELECT preferences FROM member_state').get().preferences).myJourney.weight.currentKg,90);
});
