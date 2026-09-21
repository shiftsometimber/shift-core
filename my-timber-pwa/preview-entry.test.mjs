import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from './preview/worker.mjs';
const origin='https://shift-my-timber-pwa-preview.matobrien.workers.dev';
function fixture(t){
 const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());
 sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT);CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,token_hash TEXT UNIQUE,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);');
 const DB={prepare(query){let args=[];return{bind(...values){args=values;return this},async first(){return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}}},async batch(statements){sql.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sql.exec('COMMIT');return out}catch(e){sql.exec('ROLLBACK');throw e}},async exec(query){sql.exec(query)}};
 const env={DB,PREVIEW_SOURCE_SHA:'fixture',PREVIEW_EXPIRES_AT:new Date(Date.now()+86400000).toISOString()};
 return{sql,env,request:(path,options={})=>worker.fetch(new Request(origin+path,options),env)};
}
test('preview form policy preserves same-origin POST origin and completes the entry flow',async t=>{
 const f=fixture(t),landing=await f.request('/');
 // Per Fetch origin-header rules, no-referrer produces Origin:null on native
 // form POST. This reproduces the screenshot without relaxing server checks.
 const policy=landing.headers.get('Referrer-Policy');
 const formOrigin=policy==='no-referrer'?'null':origin;
 const start=await f.request('/__preview/start',{method:'POST',headers:{Origin:formOrigin,'Content-Type':'application/x-www-form-urlencoded'},body:''});
 assert.equal(start.status,303,'normal form must enter the device preview');
 assert.equal(policy,'same-origin','external destinations must still receive no referrer');
 const cookie=start.headers.get('Set-Cookie').split(';')[0];
 assert.match(start.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Lax/);
 const dashboard=await f.request('/member/dashboard',{headers:{Cookie:cookie}});
 assert.equal(dashboard.status,200);assert((await dashboard.text()).includes('Send test notification'));
 const status=await f.request('/v1/my-timber-pwa/status',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'{}'});
 assert.equal(status.status,200);assert.equal((await status.json()).enabled,false);
 const repeat=await f.request('/__preview/start',{method:'POST',headers:{Origin:origin,Cookie:cookie}});
 assert.equal(repeat.status,303);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM users').get().n,1);
 f.sql.exec("INSERT INTO users(email) VALUES('unrelated-fixture@example.invalid')");
 const finish=await f.request('/__preview/finish',{method:'POST',headers:{Origin:origin,Cookie:cookie}});
 assert.equal(finish.status,303);assert.match(finish.headers.get('Set-Cookie'),/Max-Age=0/);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM users').get().n,1,'finish only removes this fixture');
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM user_sessions').get().n,0);
});
test('foreign, missing and null Origin remain blocked without creating a session',async t=>{
 const f=fixture(t);
 for(const path of ['/__preview/start','/__preview/finish'])for(const value of [null,'null','https://evil.example','https://shift-my-timber-pwa-preview.matobrien.workers.dev.evil.example']){
  const response=await f.request(path,{method:'POST',headers:value===null?{}:{Origin:value}});
  assert.equal(response.status,403);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM users').get().n,0);
 }
});
test('expired preview still blocks all fixture creation',async t=>{const f=fixture(t);f.env.PREVIEW_EXPIRES_AT='2000-01-01T00:00:00Z';assert.equal((await f.request('/__preview/start',{method:'POST',headers:{Origin:origin}})).status,410);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM users').get().n,0);});
