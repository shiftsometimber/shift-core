import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {distributionScorecard} from './scorecard.mjs';

function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 db.exec(`
 CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,created_at TEXT);
 CREATE TABLE user_auth(user_id INTEGER,email_verified INTEGER,email_verified_at TEXT);
 CREATE TABLE audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT,metadata TEXT,created_at TEXT);
 CREATE TABLE member_status(user_id INTEGER,source TEXT,created_at TEXT);
 CREATE TABLE product_events(user_id INTEGER,event_name TEXT,surface TEXT,source TEXT,properties_json TEXT,occurred_at TEXT);
 `);
 const DB={prepare(sql){let args=[];return{bind(...x){args=x;return this},async all(){return{results:db.prepare(sql).all(...args)}},async first(){return db.prepare(sql).get(...args)}}}};
 return{db,DB};
}

test('distribution scorecard separates support and shared registrations and excludes synthetic accounts',async t=>{
 const {db,DB}=fixture(t),now='2026-10-09T08:00:00.000Z';
 const add=(id,email,source,verified=1)=>{
  db.prepare('INSERT INTO users VALUES(?,?,?)').run(id,email,'2026-10-08T10:00:00.000Z');
  db.prepare('INSERT INTO user_auth VALUES(?,?,?)').run(id,verified,verified?'2026-10-08T10:05:00.000Z':null);
  db.prepare('INSERT INTO member_status VALUES(?,?,?)').run(id,source,'2026-10-08T10:00:00.000Z');
  db.prepare('INSERT INTO audit_log VALUES(?,?,?,?,?)').run(id*10,id,'auth.register','{}','2026-10-08T10:00:00.000Z');
 };
 add(1,'real1@example.com','my-timber-support',1);
 db.prepare('INSERT INTO audit_log VALUES(?,?,?,?,?)').run(11,1,'auth.login','{}','2026-10-08T10:10:00.000Z');
 db.prepare('INSERT INTO audit_log VALUES(?,?,?,?,?)').run(12,1,'my_journey.update','{}','2026-10-08T10:20:00.000Z');
 db.prepare('INSERT INTO product_events VALUES(?,?,?,?,?,?)').run(1,'continuity_today_exposed','my_timber_today','member_client','{}','2026-10-08T10:15:00.000Z');
 db.prepare('INSERT INTO product_events VALUES(?,?,?,?,?,?)').run(1,'after_treatment_started','my_timber_today','member_client','{}','2026-10-08T10:30:00.000Z');
 add(2,'real2@example.com','my-timber-share',0);
 add(3,'synthetic@example.test','my-timber-support',1);
 const r=await distributionScorecard(DB,{days:30,now:Date.parse(now)});
 assert.equal(r.available,true);
 assert.deepEqual(r.registrations.fromWeightLossSupport,{source:'my-timber-support',registered:1,verified:1,signedIn:1,activated:1,todayStarted:1});
 assert.deepEqual(r.registrations.fromSomeoneWhoCares,{source:'my-timber-share',registered:1,verified:0,signedIn:0,activated:0,todayStarted:0});
 assert.equal(r.registrations.total,2);
 assert.equal(r.afterTreatment.starters,1);
 assert.equal(r.publicAnalytics.joinedToMembers,false);
 assert.doesNotMatch(JSON.stringify(r),/real1@example|synthetic@example/);
});

test('missing source tables is unavailable rather than fake zero',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,created_at TEXT)');
 const DB={prepare(sql){return{async all(){return{results:db.prepare(sql).all()}},async first(){return db.prepare(sql).get()}}}};
 const r=await distributionScorecard(DB,{days:30,now:Date.parse('2026-10-09T08:00:00Z')});
 assert.equal(r.available,false);assert.ok(r.missingTables.includes('member_status'));assert.match(r.reason,/not zero/i);
});
