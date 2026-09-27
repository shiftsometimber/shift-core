import {DatabaseSync} from 'node:sqlite';
import {fastMemberRegister} from '../member-register-fastpath-v2.js';
import {fastMemberLogin} from '../member-login-fastpath-v1.js';
import {handleEmailVerification} from '../auth-email-verification-v1.js';
import {myJourneyRoutes} from '../my-journey-v1.js';
import {memberHealthRoutes} from '../member-experience/health-routes.mjs';
export const PASSWORD='Fictional-Source-Only-19!';
export function fixture(t){
 const db=new DatabaseSync(':memory:');if(t)t.after(()=>db.close());
 db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT UNIQUE,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT);
 CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER DEFAULT 0,email_verified_at TEXT,failed_login_attempts INTEGER DEFAULT 0,locked_until TEXT,last_login_at TEXT,updated_at TEXT);
 CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT,updated_at TEXT);
 CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,my_why TEXT DEFAULT '{}',roadmap TEXT DEFAULT '{}',treatment_finder TEXT DEFAULT '{}',decision_readiness TEXT DEFAULT '{}',preferences TEXT DEFAULT '{}',updated_at TEXT);
 CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,last_used_at TEXT,created_at TEXT,revoked_at TEXT);
 CREATE TABLE audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,ip_address TEXT,created_at TEXT);
 CREATE TABLE auth_tokens(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,token_type TEXT,expires_at TEXT,used_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,consent_version TEXT,granted INTEGER,granted_at TEXT,withdrawn_at TEXT,created_at TEXT);
 CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,source TEXT);
 CREATE TABLE check_ins(id INTEGER PRIMARY KEY,user_id INTEGER,case_id INTEGER);`);
 const DB={async exec(sql){db.exec(sql)},prepare(sql){let args=[];return{bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return{results:db.prepare(sql).all(...args)}},_run(){const r=db.prepare(sql).run(...args);return{meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}},async run(){return this._run()}}},async batch(xs){db.exec('BEGIN');try{const out=xs.map(x=>x._run());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
 const messages=[],env={DB,AUTO_VERIFY_EMAIL:'false',MEMBER_EXPERIENCE_V1_ENABLED:'true',EMAIL:{async send(m){messages.push(m);return{id:'fictional-only'}}}};
 const req=(path,body,method='POST',cookie='')=>new Request('https://shiftsometimber.co.uk'+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const register=(email,acquisition)=>handleEmailVerification(req('/v1/auth/register',{email,password:PASSWORD,firstName:'Fictional',acquisition}),env,{},fastMemberRegister);
 const verify=email=>{const msg=messages.filter(m=>m.to===email&&m.subject.startsWith('Verify')).at(-1);const url=msg?.text.match(/https:\/\/[^\s]+/)[0];return handleEmailVerification(new Request(url),env,{},fastMemberLogin)};
 const login=async email=>{const r=await fastMemberLogin(req('/v1/auth/login',{email,password:PASSWORD}),env);const cookie=r.headers.getSetCookie().find(x=>x.startsWith('sst_session=')&&!x.includes('Max-Age=0'))?.split(';')[0];return{response:r,cookie}};
 const save=async cookie=>{const request=req('/v1/journey',{journey:{setup:{startDate:'2026-09-01',route:'lifestyle'},weight:{startKg:100,currentKg:99,targetKg:90}}},'PATCH',cookie);const gate=await memberHealthRoutes(request,env);return gate||myJourneyRoutes(request,env)};
 return{db,DB,env,req,register,verify,login,save,messages};
}
