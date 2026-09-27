import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {memberHealthRoutes} from '../member-experience/health-routes.mjs';
import {myJourneyRoutes} from '../my-journey-v1.js';
function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,my_why TEXT DEFAULT '{}',roadmap TEXT DEFAULT '{}',treatment_finder TEXT DEFAULT '{}',decision_readiness TEXT DEFAULT '{}',preferences TEXT DEFAULT '{}',updated_at TEXT);CREATE TABLE audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT);CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,source TEXT);`);
 for(const id of [1,2]){
  db.prepare('INSERT INTO users(id,email) VALUES(?,?)').run(id,`fictional-${id}@example.invalid`);
  db.prepare('INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').run(id,id,createHash('sha256').update('test-only-member-'+id).digest('hex'),'2099-01-01T00:00:00Z');
  db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(id);
  db.prepare('INSERT INTO member_state(user_id,preferences) VALUES(?,?)').run(id,JSON.stringify({myJourney:{setup:{why:'member '+id},weight:{currentKg:95}},lifeBack:{progress:{revision:3}},grubV2:{today:'kept'}}));
 }
 const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}}},async batch(statements){db.exec('BEGIN');try{const values=[];for(const s of statements)values.push(await s.run());db.exec('COMMIT');return values}catch(e){db.exec('ROLLBACK');throw e}}};
 return {db,env:{DB,MEMBER_EXPERIENCE_V1_ENABLED:'true'},read:id=>JSON.parse(db.prepare('SELECT preferences FROM member_state WHERE user_id=?').get(id).preferences)};
}
const request=(path,method='GET',body,id=1)=>new Request('https://shiftsometimber.co.uk'+path,{method,headers:{'Content-Type':'application/json',...(id?{Cookie:'sst_session=test-only-member-'+id}:{})},...(body?{body:JSON.stringify(body)}:{})});
test('authenticated health save survives a stale ordinary Journey PATCH and read-back',async t=>{
 const f=fixture(t),stale=f.read(1).myJourney;
 for(const slug of ['health-mot','sleep-apnoea']){const response=await memberHealthRoutes(request('/v1/health-passport/interest','POST',{slug}),f.env);assert.equal(response.status,201);assert.equal((await response.json()).interest,slug)}
 const patched=await myJourneyRoutes(request('/v1/journey','PATCH',{journey:{...stale,weight:{currentKg:94},healthInterests:[]}}),f.env);assert.equal(patched.status,200);
 const read=await myJourneyRoutes(request('/v1/journey'),f.env),body=await read.json();assert.deepEqual(body.journey.healthInterests,['health-mot','sleep-apnoea']);assert.equal(body.journey.weight.currentKg,94);
 assert.equal(f.read(1).lifeBack.progress.revision,3);assert.equal(f.read(1).grubV2.today,'kept');assert.equal(f.read(2).myJourney.healthInterests,undefined);
});
test('unauthenticated, expired and tracking-off requests cannot save',async t=>{
 const f=fixture(t),before=f.read(1);
 assert.equal((await memberHealthRoutes(request('/v1/health-passport/interest','POST',{slug:'health-mot'},0),f.env)).status,401);
 f.db.exec("UPDATE user_sessions SET expires_at='2000-01-01T00:00:00Z' WHERE id=1");assert.equal((await memberHealthRoutes(request('/v1/health-passport/interest','POST',{slug:'health-mot'}),f.env)).status,401);
 f.db.exec("UPDATE user_sessions SET expires_at='2099-01-01T00:00:00Z' WHERE id=1;INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");
 const off=await memberHealthRoutes(request('/v1/health-passport/interest','POST',{slug:'health-mot'}),f.env);assert.equal(off.status,409);assert.equal((await off.json()).error,'health_consent_required');assert.deepEqual(f.read(1),before);
});
test('actual Journey erase removes only that member’s priorities',async t=>{
 const f=fixture(t);for(const id of [1,2])assert.equal((await memberHealthRoutes(request('/v1/health-passport/interest','POST',{slug:'health-mot'},id),f.env)).status,201);
 const erased=await myJourneyRoutes(request('/v1/journey','DELETE'),f.env);assert.equal(erased.status,200);assert.equal(f.read(1).myJourney,undefined);assert.deepEqual(f.read(2).myJourney.healthInterests,['health-mot']);assert.equal(f.read(1).grubV2.today,'kept');
});
