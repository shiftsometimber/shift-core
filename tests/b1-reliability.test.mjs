import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {createHash,pbkdf2Sync,randomBytes} from 'node:crypto';
import {fastMemberStateRoute} from '../member-state-fast-v1.js';
import {fastMemberLogin} from '../member-login-fastpath-v1.js';
import {handleAuthRecovery} from '../auth-recovery-v1.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
const hash=password=>{const salt=randomBytes(16);return `pbkdf2$100000$${salt.toString('base64url')}$${pbkdf2Sync(password,salt,100000,32,'sha256').toString('base64url')}`};
const matches=(password,stored)=>{const[,n,s,h]=stored.split('$');return pbkdf2Sync(password,Buffer.from(s,'base64url'),Number(n),32,'sha256').toString('base64url')===h};
const schema=`
CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT UNIQUE,first_name TEXT);
CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER DEFAULT 1,failed_login_attempts INTEGER DEFAULT 0,locked_until TEXT,last_login_at TEXT,updated_at TEXT);
CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT,created_at TEXT);
CREATE TABLE auth_tokens(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,token_type TEXT,expires_at TEXT,used_at TEXT);
CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,my_why TEXT,roadmap TEXT,treatment_finder TEXT,decision_readiness TEXT,preferences TEXT,updated_at TEXT);
CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,last_activity_at TEXT,updated_at TEXT);
CREATE TABLE audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,ip_address TEXT,created_at TEXT);
INSERT INTO users VALUES(1,'b1-one@example.invalid','Fictional'),(2,'b1-two@example.invalid','Fictional');
INSERT INTO member_status(user_id) VALUES(1),(2);
`;
function fixture(hooks={}){
 const sql=new DatabaseSync(':memory:');sql.exec(schema);
 for(const id of [1,2]){sql.prepare('INSERT INTO user_auth(user_id,password_hash) VALUES(?,?)').run(id,hash('old-fictional-password'));sql.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').run(id,sha('session-'+id),new Date(Date.now()+600000).toISOString())}
 const DB={async exec(s){sql.exec(s)},prepare(s){return{sql:s,args:[],bind(...args){return{...this,args}},async first(){const row=sql.prepare(s).get(...this.args)||null;await hooks.afterRead?.(s,row);return row},async all(){return{results:sql.prepare(s).all(...this.args)}},async run(){hooks.beforeRun?.(s);return{meta:sql.prepare(s).run(...this.args)}}}},async batch(statements){await hooks.beforeBatch?.(statements);sql.exec('BEGIN');let committed=false;try{const results=[];for(const s of statements){hooks.beforeRun?.(s.sql);results.push({meta:sql.prepare(s.sql).run(...s.args)})}sql.exec('COMMIT');committed=true;await hooks.afterCommit?.();return results}catch(e){if(!committed)sql.exec('ROLLBACK');throw e}}};
 const env={DB,MEMBER_EXPERIENCE_V1_ENABLED:'true',PUBLIC_SITE_URL:'https://preview.example.invalid'};
 const request=(path,body,id=1)=>new Request('https://preview.example.invalid'+path,{method:body===undefined?'GET':'POST',headers:{cookie:'sst_session=session-'+id,Origin:'https://preview.example.invalid','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const save=(body,id=1)=>{const r=request('/v1/member-state',body,id);return fastMemberStateRoute(new Request(r,{method:'PATCH'}),env)};
 const read=async(id=1)=>(await(await fastMemberStateRoute(request('/v1/member-state',undefined,id),env)).json()).state;
 const reset=(password='new-fictional-password',token='reset-1')=>handleAuthRecovery(request('/v1/auth/reset-password',{password,token}),env,{},()=>{throw Error('Unexpected fallback')});
 const token=(value='reset-1',expiry=new Date(Date.now()+600000).toISOString())=>sql.prepare('INSERT INTO auth_tokens(user_id,token_hash,token_type,expires_at) VALUES(1,?,\'password_reset\',?)').run(sha(value),expiry);
 const login=(password,id=1)=>fastMemberLogin(request('/v1/auth/login',{email:`b1-${id===1?'one':'two'}@example.invalid`,password}),env);
 return{sql,DB,env,request,save,read,reset,token,login};
}
function barrier(pattern){let count=0,release;const p=new Promise(r=>release=r);return async s=>{if(pattern.test(s)&&count<2){if(++count===2)release();await p}}}
const owned={grubV2:{saved:1},myJourney:{saved:2},lifeBack:{saved:3},fitJourney:{saved:4},displayUnits:{height:'cm'}};
for(const present of [false,true])test(`WR01 independent concurrent saves persist; existing row=${present}`,async()=>{
 const hooks={},f=fixture(hooks);if(present)await f.save({preferences:{theme:'original'}});
 hooks.afterRead=barrier(/^SELECT u\.\*,s\.id session_id/);
 const r=await Promise.all([f.save({myWhy:{goal:'walk'}}),f.save({roadmap:{step:'first'}})]);assert.deepEqual(r.map(x=>x.status),[200,200]);
 assert.deepEqual((await f.read()).myWhy,{goal:'walk'});assert.deepEqual((await f.read()).roadmap,{step:'first'});assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM member_state').get().n,1);f.sql.close();
});
test('WR01 dedicated preferences survive stale, omitted and null preferences in both flag modes',async()=>{
 const f=fixture();await f.save({myWhy:{goal:'original'},preferences:{theme:'one'}});f.sql.prepare('UPDATE member_state SET preferences=?').run(JSON.stringify({...owned,theme:'one'}));
 await f.save({roadmap:{step:1}});assert.deepEqual((await f.read()).preferences,{...owned,theme:'one'});
 await f.save({preferences:{theme:'two',myJourney:{stale:1},grubV2:{stale:1}}});assert.deepEqual((await f.read()).preferences,{...owned,theme:'two'});
 await f.save({preferences:null,myWhy:null});assert.deepEqual((await f.read()).myWhy,{goal:'original'});assert.deepEqual((await f.read()).preferences,{...owned,theme:'two'});
 f.env.MEMBER_EXPERIENCE_V1_ENABLED='false';await f.save({preferences:{theme:'three',grubV2:{stale:1}}});assert.deepEqual((await f.read()).preferences,{theme:'three',grubV2:owned.grubV2});f.sql.close();
});
test('WR01 same-field replacement is last accepted write, empty payload preserves all, malformed input is rejected',async()=>{
 const f=fixture();await f.save({myWhy:{first:1,second:2}});await f.save({myWhy:{replacement:true}});const before=await f.read();assert.deepEqual(before.myWhy,{replacement:true});await f.save({});assert.deepEqual(await f.read(),before);
 for(const body of ['{','null','[]','42']){const r=await fastMemberStateRoute(new Request('https://preview.example.invalid/v1/member-state',{method:'PATCH',headers:{cookie:'sst_session=session-1'},body}),f.env);assert.equal(r.status,400);assert.deepEqual(await f.read(),before)}f.sql.close();
});
for(const point of ['INSERT INTO member_state','UPDATE member_status'])test('WR01 rollback and retry at '+point,async()=>{
 const hooks={},f=fixture(hooks);await f.save({myWhy:{original:1}});const before=await f.read(),activity=f.sql.prepare('SELECT * FROM member_status WHERE user_id=1').get();
 let armed=true;hooks.beforeRun=s=>{if(armed&&s.startsWith(point)){armed=false;throw Error('synthetic outage')}};
 await assert.rejects(f.save({myWhy:{after:1}}),/synthetic outage/);assert.deepEqual(await f.read(),before);assert.deepEqual(f.sql.prepare('SELECT * FROM member_status WHERE user_id=1').get(),activity);
 assert.equal((await f.save({myWhy:{after:1}})).status,200);assert.deepEqual((await f.read()).myWhy,{after:1});f.sql.close();
});
test('WR01 lost acknowledgement is recoverable by read-back and safe retry; no duplicate or unrelated revert',async()=>{
 const hooks={},f=fixture(hooks);let once=true;hooks.afterCommit=()=>{if(once){once=false;throw Error('acknowledgement lost')}};
 await assert.rejects(f.save({myWhy:{goal:'saved despite timeout'}}),/acknowledgement lost/);assert.equal((await f.read()).myWhy.goal,'saved despite timeout');
 await f.save({roadmap:{step:2}});await f.save({myWhy:{goal:'saved despite timeout'}});assert.deepEqual((await f.read()).roadmap,{step:2});assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM member_state').get().n,1);f.sql.close();
});
test('WR01 account isolation and expired/revoked sessions protect stored work',async()=>{
 const f=fixture();await f.save({myWhy:{owner:1}});await f.save({myWhy:{owner:2}},2);assert.deepEqual((await f.read(2)).myWhy,{owner:2});
 f.sql.prepare('UPDATE user_sessions SET expires_at=? WHERE user_id=1').run('2000-01-01T00:00:00Z');assert.equal((await f.save({myWhy:{bad:1}})).status,401);
 f.sql.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=2').run(new Date().toISOString());assert.equal((await f.save({myWhy:{bad:2}},2)).status,401);
 assert.deepEqual(f.sql.prepare('SELECT my_why FROM member_state ORDER BY user_id').all().map(x=>JSON.parse(x.my_why)),[{owner:1},{owner:2}]);f.sql.close();
});
test('WR02 concurrent reset has exactly one winner, only winner password works and own sessions revoked',async()=>{
 const f=fixture({afterRead:barrier(/^SELECT id,user_id,expires_at,used_at FROM auth_tokens/)});f.token();await f.save({myWhy:{preserved:true}});
 const passwords=['new-fictional-password-A','new-fictional-password-B'],r=await Promise.all(passwords.map(p=>f.reset(p))),winner=r.findIndex(x=>x.status===200);assert.deepEqual(r.map(x=>x.status).sort(),[200,400]);
 const stored=f.sql.prepare('SELECT password_hash FROM user_auth WHERE user_id=1').get().password_hash;assert(matches(passwords[winner],stored));assert(!matches(passwords[1-winner],stored));
 assert(f.sql.prepare('SELECT revoked_at FROM user_sessions WHERE user_id=1').get().revoked_at);assert.equal(f.sql.prepare('SELECT revoked_at FROM user_sessions WHERE user_id=2').get().revoked_at,null);
 assert.equal((await f.reset()).status,400);assert.equal((await f.login('old-fictional-password')).status,401);assert.equal((await f.login(passwords[winner])).status,200);assert.equal(JSON.parse(f.sql.prepare('SELECT my_why FROM member_state WHERE user_id=1').get().my_why).preserved,true);f.sql.close();
});
for(const point of ['UPDATE auth_tokens','UPDATE user_auth','UPDATE user_sessions'])test('WR02 complete rollback and successful retry at '+point,async()=>{
 const hooks={},f=fixture(hooks);f.token();const before=f.sql.prepare('SELECT * FROM user_auth WHERE user_id=1').get();let armed=true;hooks.beforeRun=s=>{if(armed&&s.startsWith(point)){armed=false;throw Error('synthetic reset outage')}};
 await assert.rejects(f.reset(),/synthetic reset outage/);assert.deepEqual(f.sql.prepare('SELECT * FROM user_auth WHERE user_id=1').get(),before);assert.equal(f.sql.prepare('SELECT used_at FROM auth_tokens').get().used_at,null);assert.equal(f.sql.prepare('SELECT revoked_at FROM user_sessions WHERE user_id=1').get().revoked_at,null);
 assert.equal((await f.reset()).status,200);assert.equal((await f.reset()).status,400);f.sql.close();
});
test('WR02 invalid, expired, malformed expiry, missing and weak inputs cannot change authentication',async()=>{
 const f=fixture();f.token('expired','2000-01-01T00:00:00Z');f.token('bad-date','not-a-date');const before=f.sql.prepare('SELECT * FROM user_auth').all();
 for(const [password,token] of [['new-fictional-password','unknown'],['new-fictional-password','expired'],['new-fictional-password','bad-date'],['new-fictional-password',''],['short','expired']])assert.equal((await f.reset(password,token)).status,400);
 assert.deepEqual(f.sql.prepare('SELECT * FROM user_auth').all(),before);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM user_sessions WHERE revoked_at IS NOT NULL').get().n,0);f.sql.close();
});
test('WR02 token expiry after initial read/before atomic claim is enforced',async()=>{
 const hooks={},f=fixture(hooks);f.token();hooks.beforeBatch=()=>f.sql.exec("UPDATE auth_tokens SET expires_at='2000-01-01T00:00:00Z'");assert.equal((await f.reset()).status,400);assert.equal(f.sql.prepare('SELECT used_at FROM auth_tokens').get().used_at,null);assert(matches('old-fictional-password',f.sql.prepare('SELECT password_hash FROM user_auth WHERE user_id=1').get().password_hash));f.sql.close();
});
test('WR02 dropped success acknowledgement does not permit second reset; new password still signs in',async()=>{
 const hooks={},f=fixture(hooks);f.token();let armed=true;hooks.afterCommit=()=>{if(armed){armed=false;throw Error('reset acknowledgement lost')}};
 await assert.rejects(f.reset(),/acknowledgement lost/);assert.equal((await f.reset('different-fictional-password')).status,400);assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM audit_log WHERE user_id=1 AND action='auth.login'").get().n,0);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=2 AND revoked_at IS NULL').get().n,1);
 assert.equal((await f.login('new-fictional-password')).status,200);f.sql.close();
});
test('WR02 real request path records mail outcomes, keeps enumeration response generic and supersedes old links',async()=>{
 const f=fixture(),mail=[];f.env.EMAIL={send:async m=>{mail.push(m);return{messageId:'synthetic-provider-id'}}};
 const request=email=>handleAuthRecovery(f.request('/v1/auth/request-password-reset',{email}),f.env,{},()=>null);
 const a=await request('b1-one@example.invalid'),unknown=await request('missing@example.invalid');assert.deepEqual(await a.json(),await unknown.json());assert.equal(mail.length,1);
 const firstToken=new URL(mail[0].text.match(/https:\/\/\S+/)[0]).searchParams.get('token');assert.equal(new URL(mail[0].text.match(/https:\/\/\S+/)[0]).origin,f.env.PUBLIC_SITE_URL);await request('b1-one@example.invalid');assert.equal((await f.reset('new-fictional-password',firstToken)).status,400);
 assert.equal(f.sql.prepare("SELECT status FROM auth_delivery_events WHERE provider_id='synthetic-provider-id'").get().status,'sent');
 f.env.EMAIL={send:async()=>{throw Object.assign(Error('provider unavailable'),{code:'synthetic_provider_outage'})}};assert.equal((await request('b1-one@example.invalid')).status,200);assert.equal(f.sql.prepare('SELECT status FROM auth_delivery_events ORDER BY id DESC LIMIT 1').get().status,'failed');
 delete f.env.EMAIL;assert.equal((await request('b1-one@example.invalid')).status,200);assert.equal(f.sql.prepare('SELECT status FROM auth_delivery_events ORDER BY id DESC LIMIT 1').get().status,'binding_missing');f.sql.close();
});

test('a login checked against the old password cannot mint a session after reset commits',async()=>{
 let release,entered;const held=new Promise(r=>release=r),reached=new Promise(r=>entered=r);
 const f=fixture({beforeBatch:async statements=>{if(statements.some(s=>s.sql.startsWith('INSERT INTO user_sessions'))){entered();await held}}});
 f.token();const login=f.login('old-fictional-password');await reached;
 assert.equal((await f.reset('new-fictional-password')).status,200);release();
 const late=await login;assert.notEqual(late.status,200,'Old credential validation must not survive a committed reset');
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=1 AND revoked_at IS NULL').get().n,0);
 assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM audit_log WHERE user_id=1 AND action='auth.login'").get().n,0);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=2 AND revoked_at IS NULL').get().n,1);
 assert.equal((await f.login('new-fictional-password')).status,200);f.sql.close();
});

import worker from '../worker.js';
import {proveResetLoginRace} from '../preview/launch-readiness/auth-race-probe.mjs';
test('legacy trailing-slash login shares reset-race protection',async()=>{
 let release,entered;const held=new Promise(r=>release=r),reached=new Promise(r=>entered=r);
 const f=fixture({beforeBatch:async statements=>{if(statements.some(s=>s.sql.startsWith('INSERT INTO user_sessions'))){entered();await held}}});
 const prepare=f.DB.prepare.bind(f.DB);f.DB.prepare=s=>{const st=prepare(s);if(s.includes('FROM sqlite_master'))st.first=async function(){return{count:this.args.length}};return st};
 f.token();const login=worker.fetch(f.request('/v1/auth/login/',{email:'b1-one@example.invalid',password:'old-fictional-password'}),f.env,{});await reached;
 assert.equal((await f.reset('new-fictional-password')).status,200);release();assert.equal((await login).status,401);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=1 AND revoked_at IS NULL').get().n,0);f.sql.close();
});
test('hosted reset/login probe exercises the real handlers and verifies a fresh session',async()=>{
 const f=fixture();const r=await proveResetLoginRace(f.env);assert.equal(r.resetStatus,200);assert.equal(r.lateOldLoginStatus,401);assert.equal(r.activeBeforeFresh,0);assert.equal(r.freshLoginStatus,200);assert.equal(r.freshSessionVerified,true);f.sql.close();
});
