import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixture} from '../health-passport/fixture.mjs';
import {receiveAccountDeletion} from '../privacy-account-request-v1.js';
import {fastMemberLogin} from '../member-login-fastpath-v1.js';
import {handleAuthRecovery} from '../auth-recovery-v1.js';
import {handleEmailVerification} from '../auth-email-verification-v1.js';
import core from '../worker.js';
const now='2026-10-24T16:30:00.000Z',password='Isolated-fixture-password';
const tokenHash=t=>createHash('sha256').update(t).digest('hex');
async function hash(value){const salt=new Uint8Array(16).fill(7),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(value),'PBKDF2',false,['deriveBits']);return 'pbkdf2$100000$'+Buffer.from(salt).toString('base64url')+'$'+Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},key,256)).toString('base64url');}
async function setup(t){
 const f=fixture({seed:false});t.after(()=>f.close());const {db}=f;
 db.exec('CREATE TABLE IF NOT EXISTS cases(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id));CREATE TABLE pharmacy_orders(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id))');
 const worker=readFileSync(new URL('../worker.js',import.meta.url),'utf8'),bootstrap=worker.slice(worker.indexOf('  const statements = [',worker.indexOf('async function ensureSchema')),worker.indexOf('\n  ];',worker.indexOf('  const statements = [',worker.indexOf('async function ensureSchema')))+6);
 for(const [,sql]of bootstrap.matchAll(/`([^`]+)`/g))db.exec(sql);
 db.exec('ALTER TABLE user_sessions ADD COLUMN created_at TEXT');
 for(const column of ['phone TEXT','date_of_birth TEXT','postcode TEXT','created_at TEXT','updated_at TEXT'])db.exec('ALTER TABLE users ADD COLUMN '+column);
 db.exec(`CREATE TABLE IF NOT EXISTS user_auth(user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER,email_verified_at TEXT,failed_login_attempts INTEGER DEFAULT 0,locked_until TEXT,last_login_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS auth_tokens(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,token_type TEXT,expires_at TEXT,used_at TEXT);
 CREATE TABLE IF NOT EXISTS member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,updated_at TEXT,last_activity_at TEXT);
 CREATE TABLE IF NOT EXISTS data_requests(id INTEGER PRIMARY KEY,user_id INTEGER,request_type TEXT,status TEXT,received_at TEXT,completed_at TEXT);
 CREATE TABLE IF NOT EXISTS hq_tasks(id INTEGER PRIMARY KEY,user_id INTEGER,title TEXT,description TEXT,status TEXT,due_at TEXT,completed_at TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE IF NOT EXISTS cases(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id));
 CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),status TEXT);
 CREATE TABLE IF NOT EXISTS member_food_entries(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),note TEXT);
 CREATE TABLE IF NOT EXISTS shift_ai_conversations(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),body TEXT);
 CREATE TABLE IF NOT EXISTS message_outbox(id INTEGER PRIMARY KEY,user_id INTEGER,recipient TEXT,status TEXT,updated_at TEXT);
 ALTER TABLE audit_log ADD COLUMN ip_address TEXT;
 INSERT INTO member_status VALUES(1,'registered','none',NULL,NULL),(2,'registered','none',NULL,NULL);
 INSERT INTO member_food_entries VALUES(1,1,'private food'),(2,2,'second account');
 INSERT INTO shift_ai_conversations VALUES(1,1,'private AI'),(2,2,'second account AI');
 INSERT INTO progress_entries(user_id,recorded_on,weight_kg) VALUES(1,'2026-10-24',93.2),(2,'2026-10-24',100);
 INSERT INTO message_outbox(id,user_id,channel,recipient,body,status) VALUES(1,1,'email','fictional-1@example.invalid','fixture','queued'),(2,2,'email','fictional-2@example.invalid','fixture','queued');`);
 db.exec(readFileSync(new URL('../member-experience/treatment.sql',import.meta.url),'utf8'));
 db.exec(readFileSync(new URL('../migrations/007_tap_room_phase1.sql',import.meta.url),'utf8'));
 const pwa=readFileSync(new URL('../my-timber-pwa/reminders.mjs',import.meta.url),'utf8');for(const name of ['deviceDDL','deliveryDDL'])db.exec(pwa.match(new RegExp('export const '+name+'=`([\\s\\S]*?)`;'))[1]);
 db.exec(`INSERT INTO my_timber_push_devices(endpoint,user_id,session_id,p256dh,auth,hour,enabled,consented_at,updated_at) VALUES('isolated-1',1,'1','fixture','fixture',19,1,'${now}','${now}'),('isolated-2',2,'2','fixture','fixture',19,1,'${now}','${now}');INSERT INTO my_timber_push_deliveries VALUES('isolated-1','2026-10-24','sent','${now}'),('isolated-2','2026-10-24','sent','${now}');`);
 const stored=await hash(password);for(const id of [1,2]){db.prepare('INSERT INTO user_auth(user_id,password_hash,email_verified) VALUES(?,?,1)').run(id,stored);db.prepare('INSERT INTO auth_tokens(user_id,token_hash,token_type,expires_at) VALUES(?,?,?,?)').run(id,tokenHash('reset-'+id),'password_reset','2099-01-01');db.prepare('INSERT INTO auth_tokens(user_id,token_hash,token_type,expires_at) VALUES(?,?,?,?)').run(id,tokenHash('verify-'+id),'email_verification','2099-01-01');}
 f.env.EMAIL={send(){throw Error('No email is authorised or expected in this fixture');}};return f;
}
const req=(path,body)=>new Request('https://shiftsometimber.co.uk'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('confirmed deletion is immediate, atomic and account-scoped with no HQ task',async t=>{
 const {db,DB}=await setup(t);const result=await receiveAccountDeletion(DB,1,now);assert.deepEqual(result,{ok:true,status:'deleted',deletedAt:now,accountClosed:true});
 assert.equal(db.prepare('SELECT COUNT(*) n FROM hq_tasks').get().n,0);
 assert.equal(db.prepare('SELECT status FROM data_requests WHERE user_id=1').get().status,'completed');
 assert.equal(db.prepare('SELECT completed_at FROM data_requests WHERE user_id=1').get().completed_at,now);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=1 AND revoked_at IS NULL').get().n,0);
 assert.match(db.prepare('SELECT password_hash FROM user_auth WHERE user_id=1').get().password_hash,/^closed\$/);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM auth_tokens WHERE user_id=1').get().n,0);
 for(const table of ['member_state','member_food_entries','shift_ai_conversations','progress_entries','my_timber_push_devices']){assert.equal(db.prepare('SELECT COUNT(*) n FROM '+table+' WHERE user_id=1').get().n,0,table);assert.equal(db.prepare('SELECT COUNT(*) n FROM '+table+' WHERE user_id=2').get().n,1,table+' second account');}
 assert.equal(db.prepare('SELECT COUNT(*) n FROM my_timber_push_deliveries').get().n,1);
 assert.match(db.prepare('SELECT email FROM users WHERE id=1').get().email,/@deleted\.invalid$/);
 assert.equal(db.prepare('SELECT email FROM users WHERE id=2').get().email,'fictional-2@example.invalid');
 assert.equal(db.prepare('SELECT status FROM message_outbox WHERE id=1').get().status,'cancelled');
 assert.equal(db.prepare('SELECT status FROM message_outbox WHERE id=2').get().status,'queued');
 await receiveAccountDeletion(DB,1,now);assert.equal(db.prepare('SELECT COUNT(*) n FROM data_requests WHERE user_id=1').get().n,1);
});
test('required records do not delay closure or preserve reusable login credentials',async t=>{
 const f=await setup(t);f.db.exec("INSERT INTO cases VALUES(99,1);INSERT INTO orders(order_number,user_id,status) VALUES('fixture-order',1,'completed');INSERT INTO check_ins(user_id,case_id,notes) VALUES(1,99,'retained clinical record'),(1,NULL,'optional note');");
 await receiveAccountDeletion(f.DB,1,now);assert.equal(f.db.prepare('SELECT email FROM users WHERE id=1').get().email,'fictional-1@example.invalid');assert.equal(f.db.prepare('SELECT COUNT(*) n FROM check_ins').get().n,1);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM cases').get().n,1);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM orders').get().n,1);
 assert.equal((await fastMemberLogin(req('/v1/auth/login',{email:'fictional-1@example.invalid',password}),f.env)).status,401);
 for(const [path,body,handler]of [['/v1/auth/request-password-reset',{email:'fictional-1@example.invalid'},handleAuthRecovery],['/v1/auth/resend-verification',{email:'fictional-1@example.invalid'},handleEmailVerification]])assert.equal((await handler(req(path,body),f.env,{},()=>{throw Error('unexpected fallback')})).status,200);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM auth_tokens WHERE user_id=1').get().n,0);
 assert.equal((await handleAuthRecovery(req('/v1/auth/reset-password',{token:'reset-1',password:'Another-isolated-password'}),f.env,{})).status,400);
 assert.equal((await handleEmailVerification(req('/v1/auth/verify-email',{token:'verify-1'}),f.env,{})).status,400);
});
test('any failed erase rolls everything back and never claims deletion',async t=>{
 const f=await setup(t);f.db.exec("CREATE TRIGGER fail_deletion BEFORE INSERT ON data_requests BEGIN SELECT RAISE(ABORT,'isolated failure');END;");await assert.rejects(receiveAccountDeletion(f.DB,1,now),/isolated failure/);
 assert.match(f.db.prepare('SELECT password_hash FROM user_auth WHERE user_id=1').get().password_hash,/^pbkdf2\$/);assert.equal(f.db.prepare('SELECT revoked_at FROM user_sessions WHERE user_id=1').get().revoked_at,null);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM member_food_entries WHERE user_id=1').get().n,1);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM data_requests').get().n,0);
});
test('a login already hashing its password cannot create a session after deletion',async t=>{
 const f=await setup(t),batch=f.DB.batch.bind(f.DB);let intercept=true;f.DB.batch=async statements=>{if(intercept){intercept=false;await receiveAccountDeletion({...f.DB,batch},1,now)}return batch(statements)};
 const response=await fastMemberLogin(req('/v1/auth/login',{email:'fictional-1@example.invalid',password}),f.env);assert.equal(response.status,401);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=1 AND revoked_at IS NULL').get().n,0);
});
test('a password change already in progress cannot reopen a deleted account',async t=>{
 const f=await setup(t),prepare=f.DB.prepare.bind(f.DB);let intercepted=false;f.DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('UPDATE user_auth SET password_hash=?,failed_login_attempts')){const run=statement.run.bind(statement);statement.run=async()=>{if(!intercepted){intercepted=true;await receiveAccountDeletion({...f.DB,prepare},1,now)}return run()}}return statement};
 const response=await handleAuthRecovery(req('/v1/auth/change-password',{currentPassword:password,password:'New-isolated-fixture-password'}),f.env,{},()=>Response.json({user:{id:1}}));assert.equal(response.status,401);assert.match(f.db.prepare('SELECT password_hash FROM user_auth WHERE user_id=1').get().password_hash,/^closed\$/);
});
test('destructive endpoint requires explicit confirmation and rejects cross-origin requests',async t=>{
 const f=await setup(t);for(const [confirmation,origin,expected]of [[undefined,'https://shiftsometimber.co.uk',400],['DELETE_MY_ACCOUNT','https://evil.example',403]]){
 const r=await core.fetch(new Request('https://shiftsometimber.co.uk/v1/privacy/account',{method:'DELETE',headers:{Origin:origin,'Content-Type':'application/json',Cookie:'sst_session=test-only-member-1'},body:JSON.stringify({confirmation})}),f.env,{});assert.equal(r.status,expected);
 }
 assert.equal(f.db.prepare('SELECT revoked_at FROM user_sessions WHERE user_id=1').get().revoked_at,null);
 const r=await core.fetch(new Request('https://shiftsometimber.co.uk/v1/privacy/account',{method:'DELETE',headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json',Cookie:'sst_session=test-only-member-1'},body:JSON.stringify({confirmation:'DELETE_MY_ACCOUNT'})}),f.env,{});assert.equal(r.status,200);assert.equal((await r.json()).status,'deleted');assert.match(r.headers.get('Set-Cookie'),/Max-Age=0/);
});

test('safeguarding evidence is retained without keeping the member account open',async t=>{
 const f=await setup(t);f.db.exec("INSERT INTO tap_room_profiles(user_id,display_name,bio) VALUES(1,'Private name','Private bio');INSERT INTO tap_room_posts(id,room_slug,user_id,body) VALUES(11,'test',1,'Unreported personal post'),(12,'test',1,'Reported evidence');INSERT INTO tap_room_reports(reporter_user_id,post_id,category,priority) VALUES(2,12,'safety','high');");
 await receiveAccountDeletion(f.DB,1,now);assert.equal(f.db.prepare('SELECT body FROM tap_room_posts WHERE id=11').get().body,'[Deleted by member]');assert.equal(f.db.prepare('SELECT body FROM tap_room_posts WHERE id=12').get().body,'Reported evidence');assert.equal(f.db.prepare('SELECT email FROM users WHERE id=1').get().email,'fictional-1@example.invalid');assert.equal(f.db.prepare('SELECT display_name FROM tap_room_profiles WHERE user_id=1').get().display_name,'Deleted member');assert.match(f.db.prepare('SELECT password_hash FROM user_auth WHERE user_id=1').get().password_hash,/^closed\$/);
});

test('orphaned authentication is closed without permitting registration recovery into retained records',async t=>{
 const f=await setup(t);f.db.exec("DELETE FROM user_auth WHERE user_id=1;INSERT INTO cases VALUES(99,1);CREATE TABLE member_signup_alerts(user_id INTEGER PRIMARY KEY);INSERT INTO member_signup_alerts VALUES(1),(2);INSERT INTO data_requests(user_id,request_type,status,received_at) VALUES(1,'deletion','received','2026-10-01');INSERT INTO hq_tasks(user_id,title,status) VALUES(1,'Review account deletion request','open');");
 await receiveAccountDeletion(f.DB,1,now);assert.match(f.db.prepare('SELECT password_hash FROM user_auth WHERE user_id=1').get().password_hash,/^closed\$/);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM member_signup_alerts WHERE user_id=1').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM member_signup_alerts WHERE user_id=2').get().n,1);assert.equal(f.db.prepare('SELECT status FROM hq_tasks').get().status,'done');assert.equal(f.db.prepare('SELECT status FROM data_requests').get().status,'completed');
});
