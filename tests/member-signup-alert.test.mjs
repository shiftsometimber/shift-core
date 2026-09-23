import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,writeFileSync} from 'node:fs';
import {queueSignupAlert,retryPendingSignupAlerts,signupAlertMessage} from '../member-signup-alert.mjs';
import {handleEmailVerification} from '../auth-email-verification-v1.js';
import {fastMemberRegister} from '../member-register-fastpath-v2.js';
import {assertSignupSchema,assertSignupAddition} from '../release/member-signup-alert-schema.mjs';
import {SIGNUP_ALERT_SCHEMA} from '../member-signup-alert.mjs';
import {sendTransactionalEmail,medicineEmailTemplates} from '../transactional-email-v1.js';

function fixture(t){
 const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());
 sql.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT UNIQUE,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT);
 CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER,email_verified_at TEXT);
 CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT);
 CREATE TABLE member_state(user_id INTEGER PRIMARY KEY);
 CREATE TABLE consents(user_id INTEGER,consent_type TEXT,consent_version TEXT,granted INTEGER,granted_at TEXT);
 CREATE TABLE audit_log(user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,ip_address TEXT,created_at TEXT);
 CREATE TABLE user_sessions(user_id INTEGER,token_hash TEXT,expires_at TEXT,last_used_at TEXT,created_at TEXT,revoked_at TEXT);
 CREATE TABLE auth_tokens(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,token_type TEXT,expires_at TEXT,used_at TEXT);`);
 const result=r=>({success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}});
 const DB={async exec(s){sql.exec(s)},prepare(s){return {sql:s,args:[],bind(...args){return {...this,args}},async run(){return result(sql.prepare(this.sql).run(...this.args))},async first(){return sql.prepare(this.sql).get(...this.args)||null},async all(){return {results:sql.prepare(this.sql).all(...this.args)}}}},async batch(ss){sql.exec('BEGIN');try{const r=ss.map(s=>result(sql.prepare(s.sql).run(...s.args)));sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 const messages=[],env={DB,MEMBER_SIGNUP_ALERTS_ENABLED:'true',AUTO_VERIFY_EMAIL:'false',EMAIL:{async send(m){messages.push(m);return {messageId:'fictional-'+messages.length}}}};
 const work=[],ctx={waitUntil(p){work.push(p)}},body={email:'fictional-member@example.test',password:'Fictional-long-password-123',firstName:'Fictional',lastName:'Member'};
 const request=()=>new Request('https://shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const register=async(next=fastMemberRegister)=>{const r=await handleEmailVerification(request(),env,ctx,next);await Promise.all(work.splice(0));return r};
 return {sql,env,messages,body,register,request,ctx,work};
}
test('actual fast registration emails hello once and preserves verification, session revocation and duplicate rejection',async t=>{
 const f=fixture(t),r=await f.register(),body=await r.json();assert.equal(r.status,201);assert.equal(body.verificationRequired,true);assert.equal(body.emailVerified,false);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
 assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM user_sessions WHERE revoked_at IS NULL').get().n,0);
 const alert=f.messages.filter(m=>m.to==='hello@shiftsometimber.co.uk');assert.equal(alert.length,1);assert.match(alert[0].subject,/New My Timber member/);assert.match(alert[0].text,/fictional-member@example.test/);assert.doesNotMatch(JSON.stringify(alert[0]),/password|dateOfBirth|token|phone|consents/i);
 assert.equal(f.messages.filter(m=>m.subject==='Verify your My Shift email').length,1);
 assert.equal((await f.register()).status,409);await retryPendingSignupAlerts(f.env);assert.equal(f.messages.length,2);
 if(process.env.ALERT_PROOF_DIR){mkdirSync(process.env.ALERT_PROOF_DIR,{recursive:true});writeFileSync(process.env.ALERT_PROOF_DIR+'/signup-preview.json',JSON.stringify(alert[0],null,2));writeFileSync(process.env.ALERT_PROOF_DIR+'/signup-preview.html',alert[0].html)}
});
test('same notification hook covers legacy successful registration responses',async t=>{
 const f=fixture(t);f.sql.exec("INSERT INTO users(id,email,first_name) VALUES(7,'legacy@example.test','Legacy');INSERT INTO user_auth(user_id,email_verified) VALUES(7,1)");
 const r=await f.register(async()=>new Response(JSON.stringify({ok:true,user:{id:7,email:'legacy@example.test'},emailVerified:true}),{status:201}));assert.equal(r.status,201);assert.equal(f.messages.length,1);assert.equal(f.messages[0].to,'hello@shiftsometimber.co.uk');
});
test('failed and non-created responses never send signup alerts',async t=>{
 const f=fixture(t);for(const status of [400,409,500,200])await f.register(async()=>new Response(JSON.stringify({ok:status===200,user:{id:1},emailVerified:true}),{status}));assert.equal(f.messages.length,0);
});
test('provider outage cannot invalidate registration; ambiguous acceptance is not retried',async t=>{
 const f=fixture(t);let attempts=0;f.env.EMAIL.send=async m=>{attempts++;throw Error('accepted then connection lost')};const r=await f.register();assert.equal(r.status,201);assert.equal((await r.json()).verificationRequired,true);assert.equal(f.sql.prepare('SELECT state FROM member_signup_alerts').get().state,'uncertain');await retryPendingSignupAlerts(f.env);assert.equal(attempts,2);
});
test('missing binding leaves durable pending alert for scheduled delivery',async t=>{
 const f=fixture(t),binding=f.env.EMAIL;delete f.env.EMAIL;assert.equal((await f.register()).status,201);assert.equal(f.sql.prepare('SELECT state FROM member_signup_alerts').get().state,'pending');f.env.EMAIL=binding;await retryPendingSignupAlerts(f.env);assert.equal(f.messages.length,1);assert.equal(f.messages[0].to,'hello@shiftsometimber.co.uk');assert.equal(f.sql.prepare('SELECT state FROM member_signup_alerts').get().state,'accepted');
});
test('concurrent duplicate attempts claim one send and cannot substitute account data',async t=>{
 const f=fixture(t);await f.register();f.messages.length=0;f.sql.exec('DELETE FROM member_signup_alerts');await Promise.all([queueSignupAlert(f.env,1),queueSignupAlert(f.env,1),queueSignupAlert(f.env,1)]);assert.equal(f.messages.length,1);assert.match(f.messages[0].text,/fictional-member@example.test/);
});
test('deleting an account clears its pending notification instead of emailing stale personal data',async t=>{
 const f=fixture(t);delete f.env.EMAIL;await f.register();f.sql.exec('DELETE FROM users WHERE id=1');assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM member_signup_alerts').get().n,0);
});
test('unconfigured preview stays silent; enabling never backfills old users',async t=>{
 const f=fixture(t);delete f.env.MEMBER_SIGNUP_ALERTS_ENABLED;await f.register();assert.equal(f.messages.length,1);assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='member_signup_alerts'").get().n,0);f.env.MEMBER_SIGNUP_ALERTS_ENABLED='true';await retryPendingSignupAlerts(f.env);assert.equal(f.messages.length,1);
});
test('operator template escapes supplied content and pins recipient',()=>{
 const m=signupAlertMessage({id:5,first_name:'<img src=x onerror=alert(1)>',email:'other@example.test',signed_up_at:'2026-09-23T12:00:00Z'});assert.equal(m.to,'hello@shiftsometimber.co.uk');assert.doesNotMatch(m.html,/<img/);assert.match(m.html,/&lt;img/);assert.doesNotMatch(m.subject,/[\r\n]/);
});
test('queue write failure preserves the created account and verification response',async t=>{
 const f=fixture(t),original=f.env.DB.prepare;
 f.env.DB.prepare=s=>{if(s.includes('CREATE TABLE IF NOT EXISTS member_signup_alerts'))throw Error('queue unavailable');return original(s)};
 const r=await f.register();assert.equal(r.status,201);assert.equal((await r.json()).verificationRequired,true);assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM user_auth').get().n,1);assert.equal(f.messages.length,1);
});
test('medicine order confirmation already includes the orders alias',async t=>{
 const f=fixture(t);await sendTransactionalEmail(f.env,{to:'fictional@example.test',internalNotify:true,includeMatt:true,...medicineEmailTemplates.orderConfirmation({orderNumber:'FICTIONAL-MEDICINE'})});assert.equal(f.messages.filter(m=>m.to==='orders@shiftsometimber.co.uk').length,1);
});
test('signup schema is additive, repeatable and refuses unexpected definitions',()=>{
 const sql=new DatabaseSync(':memory:');try{sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);INSERT INTO users VALUES(1,'retained@example.test');");
 const get=()=>sql.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();const before=get();assert.equal(assertSignupSchema(before),false);sql.exec(SIGNUP_ALERT_SCHEMA);assertSignupAddition(before,get());sql.exec(SIGNUP_ALERT_SCHEMA);assert.equal(sql.prepare('SELECT email FROM users').get().email,'retained@example.test');assert.throws(()=>assertSignupSchema([{type:'table',name:'users'},{type:'table',name:'member_signup_alerts',sql:'CREATE TABLE member_signup_alerts(bad)'}]));sql.exec('CREATE TABLE accidental(id)');assert.throws(()=>assertSignupAddition(before,get()));}finally{sql.close()}
});
