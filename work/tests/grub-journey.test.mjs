import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import {probeGrub} from '../../member-experience/grub-journey-probe.mjs';
import {buildIndustrialCatalogue} from '../../industrial-catalogue-v14.js';
const bundle=resolve('work/build/worker-entry-v6.js');
const mf=new Miniflare({modules:[{type:'ESModule',path:bundle}],modulesRoot:dirname(bundle),compatibilityDate:'2026-08-09',d1Databases:{DB:'work-journey-auth-fictional',WORK_DB:'work-journey-fictional'},bindings:{WORK_V1_ENABLED:'true',WORK_PILOT_COMMISSIONED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true'}});
const db=await mf.getD1Database('DB'),work=await mf.getD1Database('WORK_DB');
const sql=p=>readFileSync(p,'utf8').replace(/^--.*$/gm,'').replace(/\n/g,' ');
await db.exec(sql('preview/bootstrap.sql'));await work.exec(sql('work/migration.sql'));
await db.exec('CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT,name TEXT,password_hash TEXT,role TEXT,status TEXT,mfa_enabled INTEGER,last_login_at TEXT,created_at TEXT,updated_at TEXT);CREATE TABLE hq_sessions(id INTEGER PRIMARY KEY,hq_user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT,created_at TEXT);');
const password=randomBytes(24).toString('base64url'),salt=randomBytes(16),hash='pbkdf2$100000$'+salt.toString('base64url')+'$'+pbkdf2Sync(password,salt,100000,32,'sha256').toString('base64url');
for(const [id,name]of [[1,'Employee'],[2,'Employer'],[3,'Other employer']]){await db.prepare('INSERT INTO users(id,email,first_name) VALUES(?,?,?)').bind(id,'fictional'+id+'@example.invalid',name).run();await db.prepare('INSERT INTO user_auth(user_id,password_hash,email_verified) VALUES(?,?,1)').bind(id,hash).run();await db.prepare('INSERT INTO member_status(user_id) VALUES(?)').bind(id).run()}
await db.prepare('INSERT INTO hq_users(id,email,name,password_hash,role,status,mfa_enabled) VALUES(1,?,?,?,?,?,0)').bind('fictional-hq@example.invalid','Fictional operator',hash,'owner','active').run();
const call=(path,body,cookie='')=>mf.dispatchFetch('https://work-journey.invalid'+path,{redirect:'manual',method:body?'POST':'GET',headers:{Origin:'https://work-journey.invalid','Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});
async function login(email,hq=false){const r=await call(hq?'/v1/hq/auth/login':'/v1/auth/login',{email,password});assert.equal(r.status,200,await r.clone().text());const cookie=r.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);return cookie.split(';')[0]}
await db.exec("CREATE TABLE structured_content(id TEXT PRIMARY KEY,content_type TEXT,title TEXT,status TEXT,data_json TEXT)");
const fixtureRecipes=buildIndustrialCatalogue().recipes.slice(0,2500);
for(let i=0;i<fixtureRecipes.length;i+=100)await db.batch(fixtureRecipes.slice(i,i+100).map(r=>db.prepare("INSERT INTO structured_content VALUES(?,'recipe',?,'published',?)").bind(r.id,r.title,JSON.stringify({...r,nutrition:{status:'validated',protein_g:30,kcal:400}}))));
try{await test('Complete real Worker food journey with separate password-authenticated accounts',async()=>{
 const member=await login('fictional1@example.invalid'),other=await login('fictional2@example.invalid');
 const checks=await probeGrub({call,member,other,patch:(path,body,cookie)=>mf.dispatchFetch('https://work-journey.invalid'+path,{method:'PATCH',headers:{Origin:'https://work-journey.invalid','Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)})});assert(checks.length>=6);
 assert.equal((await call('/v1/auth/logout',{},member)).status,200);assert.equal((await call('/v1/grub/workspace',undefined,member)).status,401);
 const again=await login('fictional1@example.invalid');assert.equal((await(await call('/v1/grub/workspace',undefined,again)).json()).week.length,9);
})}finally{await mf.dispose()}
