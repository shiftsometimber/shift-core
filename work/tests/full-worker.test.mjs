import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {dirname,resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bundle=resolve('work/build/worker-entry-v6.js');
async function runtime(flags={}){
 const mf=new Miniflare({modules:[{type:'ESModule',path:bundle}],modulesRoot:dirname(bundle),compatibilityDate:'2026-08-09',d1Databases:{DB:'full-auth',WORK_DB:'full-work'},bindings:flags});
 const db=await mf.getD1Database('DB'),work=await mf.getD1Database('WORK_DB');
 await db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT,name TEXT,role TEXT,status TEXT,mfa_enabled INTEGER);CREATE TABLE hq_sessions(id INTEGER PRIMARY KEY,hq_user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);');
 await work.exec(readFileSync('work/migration.sql','utf8').replace(/^--.*$/gm,'').replace(/\n/g,' '));
 await db.exec("INSERT INTO users VALUES(1,'Fictional member');INSERT INTO hq_users VALUES(1,'fictional@example.invalid','Fictional HQ','owner','active',1);");
 for(const [table,column,token] of [['user_sessions','user_id','member-test'],['hq_sessions','hq_user_id','hq-test']])await db.prepare('INSERT INTO '+table+'('+column+',token_hash,expires_at) VALUES(1,?,?)').bind(createHash('sha256').update(token).digest('hex'),'2099-01-01T00:00:00.000Z').run();
 const call=(path,body,cookie='sst_session=member-test; sst_hq_session=hq-test')=>mf.dispatchFetch('https://full-work.invalid'+path,{method:body?'POST':'GET',headers:{Cookie:cookie,Origin:'https://full-work.invalid','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {mf,db,work,call};
}
await test('Actual Worker stays dark by default and rejects feature asset access',async()=>{const {mf,call}=await runtime();try{for(const p of ['/member/work','/hq/work','/v1/work','/v1/hq/work','/assets/work/work.mjs'])assert.equal((await call(p)).status,404)}finally{await mf.dispose()}});
await test('Actual Worker uses real separate HQ and member sessions; commissioning stays closed',async()=>{const {mf,call}=await runtime({WORK_V1_ENABLED:'true'});try{
 assert.equal((await call('/v1/hq/work',undefined,'sst_session=member-test')).status,401);
 assert.equal((await call('/v1/work',undefined,'sst_hq_session=hq-test')).status,401);
 const conf={name:'Fictional pilot',start:'2026-09-14',end:'2026-12-07',seats:50,feePence:0,scope:'Agreed weekly self-guided reviews.',support:'No live support.',reporterIds:[1]};
 const response=await call('/v1/hq/work',{action:'create',config:conf});assert.equal(response.status,201,await response.clone().text());const {employer:s}=await response.json();
 assert.equal((await call('/v1/hq/work',{action:'activate',id:s.id,revision:s.revision,privacyReference:'fictional-reference'})).status,409);
 assert.equal((await call('/v1/work/join',{code:'invalid',consent:true,noticeVersion:'work-pilot-2026-09-12-v1'})).status,409);
 assert.equal((await call('/v1/work/testing',{commissioned:true})).status,409);
 const js=await call('/assets/work/work.mjs');assert.equal(js.status,200);assert.match(js.headers.get('Content-Type'),/javascript/);
 for(const p of ['/member/work','/hq/work','/employer/work']){const r=await call(p);assert.equal(r.status,200);assert.match(r.headers.get('Content-Security-Policy'),/script-src 'self'/)}
}finally{await mf.dispose()}});
