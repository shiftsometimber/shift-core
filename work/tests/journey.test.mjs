import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import {WorkStore,NOTICE} from '../model.mjs';
const bundle=resolve('work/build/worker-entry-v6.js');
const mf=new Miniflare({modules:[{type:'ESModule',path:bundle}],modulesRoot:dirname(bundle),compatibilityDate:'2026-08-09',d1Databases:{DB:'work-journey-auth-fictional',WORK_DB:'work-journey-fictional'},bindings:{WORK_V1_ENABLED:'true',WORK_PILOT_COMMISSIONED:'true'}});
const db=await mf.getD1Database('DB'),work=await mf.getD1Database('WORK_DB');
const sql=p=>readFileSync(p,'utf8').replace(/^--.*$/gm,'').replace(/\n/g,' ');
await db.exec(sql('preview/bootstrap.sql'));await work.exec(sql('work/migration.sql'));
await db.exec('CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT,name TEXT,password_hash TEXT,role TEXT,status TEXT,mfa_enabled INTEGER,last_login_at TEXT,created_at TEXT,updated_at TEXT);CREATE TABLE hq_sessions(id INTEGER PRIMARY KEY,hq_user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT,created_at TEXT);');
const password=randomBytes(24).toString('base64url'),salt=randomBytes(16),hash='pbkdf2$100000$'+salt.toString('base64url')+'$'+pbkdf2Sync(password,salt,100000,32,'sha256').toString('base64url');
for(const [id,name]of [[1,'Employee'],[2,'Employer'],[3,'Other employer']]){await db.prepare('INSERT INTO users(id,email,first_name) VALUES(?,?,?)').bind(id,'fictional'+id+'@example.invalid',name).run();await db.prepare('INSERT INTO user_auth(user_id,password_hash,email_verified) VALUES(?,?,1)').bind(id,hash).run();await db.prepare('INSERT INTO member_status(user_id) VALUES(?)').bind(id).run()}
await db.prepare('INSERT INTO hq_users(id,email,name,password_hash,role,status,mfa_enabled) VALUES(1,?,?,?,?,?,0)').bind('fictional-hq@example.invalid','Fictional operator',hash,'owner','active').run();
const call=(path,body,cookie='')=>mf.dispatchFetch('https://work-journey.invalid'+path,{redirect:'manual',method:body?'POST':'GET',headers:{Origin:'https://work-journey.invalid','Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});
async function login(email,hq=false){const r=await call(hq?'/v1/hq/auth/login':'/v1/auth/login',{email,password});assert.equal(r.status,200,await r.clone().text());const cookie=r.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);return cookie.split(';')[0]}
try{await test('Actual password login → company claim → review → fixed report → revocation',async()=>{
 const employee=await login('fictional1@example.invalid'),employer=await login('fictional2@example.invalid'),other=await login('fictional3@example.invalid'),hq=await login('fictional-hq@example.invalid',true);
 assert.equal((await call('/v1/hq/work',undefined,employee)).status,401);
 assert.equal((await call('/member/work')).status,303);
 const start=new Date();start.setUTCHours(0,0,0,0);const end=new Date(+start+84*86400000);
 let s;async function admin(action,extra={}){const r=await call('/v1/hq/work',{action,...(s?{id:s.id,revision:s.revision}:{}),...extra},hq);assert.equal(r.status,action==='create'?201:200,await r.clone().text());const b=await r.json();s=b.employer;return b}
 await admin('create',{config:{name:'Fictional journey company',start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10),seats:50,feePence:0,scope:'Fictional technical verification only.',support:'No live support or real employees.',reporterIds:[2]}});
 await admin('activate',{privacyReference:'Fictional local commissioning fixture; not a real approval'});
 const invite=await admin('invite',{expiresAt:new Date(+start+7*86400000).toISOString()});
 assert.equal((await call('/v1/work/join',{code:invite.code,consent:true,noticeVersion:NOTICE},employee)).status,200);
 assert.equal((await call('/v1/work/review',{employerId:s.id,week:1,completed:true},employee)).status,200);
 const own=await(await call('/v1/work',undefined,employee)).json();assert.deepEqual(own.workplaces[0].completedWeeks,[1]);assert.equal((await(await call('/v1/employer/work',undefined,other)).json()).reports.length,0);
 assert.equal((await call('/v1/work/testing',{},employee)).status,409);
 // Explicit fixture-only time transition. No API clock override or production bypass.
 const store=new WorkStore(work),record=await store.get(s.id),closedEnd=new Date(+start-86400000);record.config.end=closedEnd.toISOString().slice(0,10);record.config.start=new Date(+closedEnd-84*86400000).toISOString().slice(0,10);await store.save(record,record.revision);s=(await(await call('/v1/hq/work',undefined,hq)).json()).employers[0];
 await admin('report',{safeToRelease:true,reviewReference:'Fictional closed-period privacy test'});
 const report=await(await call('/v1/employer/work',undefined,employer)).json();assert.equal(report.reports[0].report.activations.status,'withheld');assert(!JSON.stringify(report).includes('completedWeeks'));assert(!JSON.stringify(report).includes('userId'));
 await admin('reporters',{reporterIds:[]});assert.equal((await(await call('/v1/employer/work',undefined,employer)).json()).reports.length,0);
 assert.equal((await call('/v1/work/withdraw',{employerId:s.id,confirm:true},employee)).status,200);assert.equal((await(await call('/v1/work',undefined,employee)).json()).workplaces.length,0);
 assert.equal((await call('/v1/auth/logout',{},employee)).status,200);assert.equal((await call('/v1/work',undefined,employee)).status,401);
 assert(await db.prepare('SELECT id FROM users WHERE id=1').first());
})}finally{await mf.dispose()}
