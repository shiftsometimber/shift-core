import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {activationScorecard,reportingWindow} from './scorecard.mjs';
import {memberJourneySnapshot} from '../journey-analytics-v1.js';
const NOW='2026-09-19T12:00:00.000Z';
function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,created_at TEXT);CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER,email_verified_at TEXT);CREATE TABLE audit_log(user_id INTEGER,action TEXT,created_at TEXT);CREATE TABLE product_events(user_id INTEGER,event_name TEXT,source TEXT,occurred_at TEXT);`);
 const DB={prepare(sql){let args=[];return{bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return{results:db.prepare(sql).all(...args)}}}}};
 const user=(id,date,verified=date,email='person'+id+'@real.example')=>{db.prepare('INSERT INTO users VALUES(?,?,?)').run(id,email,date);db.prepare('INSERT INTO user_auth VALUES(?,?,?)').run(id,verified?1:0,verified);};
 const audit=(id,action,date)=>db.prepare('INSERT INTO audit_log VALUES(?,?,?)').run(id,action,date);
 const event=(id,name,date,source='server')=>db.prepare('INSERT INTO product_events VALUES(?,?,?,?)').run(id,name,source,date);
 return{db,DB,user,audit,event,read:()=>activationScorecard(DB,{days:60,now:NOW})};
}
test('empty legitimate cohort is zero; immature retention is null',async t=>{const f=fixture(t),r=await f.read();assert.equal(r.available,true);assert.equal(r.stages[0].members,0);assert.equal(r.retention.week1.ratePct,null);assert.equal(r.retention.week4.ratePct,null)});
test('missing data tables return unavailable, never fabricated zero',async t=>{const f=fixture(t);f.db.exec('DROP TABLE user_auth');const r=await f.read();assert.equal(r.available,false);assert.deepEqual(r.missingTables,['user_auth']);assert.equal(r.stages,undefined)});
test('registered, verified, signed-in and saved stages follow the same people',async t=>{const f=fixture(t);f.user(1,'2026-09-01',null);f.user(2,'2026-09-01');f.user(3,'2026-09-01');f.user(4,'2026-09-01');f.audit(3,'auth.login','2026-09-02');f.audit(4,'auth.login','2026-09-02');f.audit(4,'passport.add','2026-09-03');const r=await f.read();assert.deepEqual(r.stages.map(s=>s.members),[4,3,2,1]);assert.equal(r.stages[3].percentOfRegistered,25)});
test('orphan users without successful auth creation do not count',async t=>{const f=fixture(t);f.db.exec("INSERT INTO users VALUES(1,'orphan@real.example','2026-09-01')");assert.equal((await f.read()).stages[0].members,0)});
test('login and save before verification are not activation',async t=>{const f=fixture(t);f.user(1,'2026-09-01','2026-09-05');f.audit(1,'auth.login','2026-09-02');f.audit(1,'passport.add','2026-09-03');assert.deepEqual((await f.read()).stages.map(s=>s.members),[1,1,0,0])});
test('future verification, accounts and events cannot increase observed counts',async t=>{const f=fixture(t);f.user(1,'2026-09-01','2026-09-20');f.audit(1,'auth.login','2026-09-20');f.user(2,'2026-09-20');assert.deepEqual((await f.read()).stages.map(s=>s.members),[1,0,0,0])});
test('known commissioning audit excludes an otherwise normal-looking account',async t=>{const f=fixture(t);f.user(1,'2026-09-01');f.audit(1,'auth.commissioning_identity_verified','2026-09-01');const r=await f.read();assert.equal(r.stages[0].members,0);assert.equal(r.excludedKnownTestAccounts,1)});
test('known reserved fixture and exact commissioning address families are excluded',async t=>{const f=fixture(t);for(const [i,email]of ['alex@example.invalid','sam@example.test','shiftsometimber+finish-passport-1@gmail.com','shiftsometimber+structured-authrender-x@gmail.com'].entries())f.user(i+1,'2026-09-01','2026-09-01',email);const r=await f.read();assert.equal(r.stages[0].members,0);assert.equal(r.excludedKnownTestAccounts,4)});
test('ordinary plus-addresses are not misclassified as synthetic',async t=>{const f=fixture(t);f.user(1,'2026-09-01','2026-09-01','person+fitness@gmail.com');assert.equal((await f.read()).stages[0].members,1)});
test('returns use mature denominators rather than punishing brand-new members',async t=>{const f=fixture(t);f.user(1,'2026-09-01');f.audit(1,'auth.login','2026-09-03');f.user(2,'2026-09-17');f.audit(2,'auth.login','2026-09-18');const r=await f.read();assert.equal(r.retention.week1.eligible,1);assert.equal(r.retention.week1.returned,1);assert.equal(r.retention.week1.ratePct,100);assert.equal(r.retention.week4.ratePct,null)});
test('same-day login is not a return and second-week login is not week one',async t=>{const f=fixture(t);f.user(1,'2026-09-01');f.audit(1,'auth.login','2026-09-01');f.user(2,'2026-09-01');f.audit(2,'auth.login','2026-09-10');const r=await f.read();assert.equal(r.retention.week1.eligible,2);assert.equal(r.retention.week1.returned,0)});
test('week-four return uses days 21–27, not all-time activity',async t=>{const f=fixture(t);f.user(1,'2026-08-01');f.audit(1,'auth.login','2026-08-23');f.user(2,'2026-08-01');f.audit(2,'auth.login','2026-09-10');const r=await f.read();assert.equal(r.retention.week4.eligible,2);assert.equal(r.retention.week4.returned,1);assert.equal(r.retention.week4.ratePct,50)});
test('ISO and SQLite date formats compare correctly on the same day',async t=>{const f=fixture(t);f.user(1,'2026-09-19 08:00:00','2026-09-19 08:05:00');f.audit(1,'auth.login','2026-09-19T09:00:00.000Z');f.audit(1,'my_journey.update','2026-09-19 09:10:00');assert.deepEqual((await f.read()).stages.map(s=>s.members),[1,1,1,1])});
test('repeated activity counts a person once and does not emit identities',async t=>{const f=fixture(t);f.user(1,'2026-09-01');for(let i=0;i<5;i++)f.audit(1,'auth.login','2026-09-03');const r=await f.read();assert.equal(r.retention.week1.returned,1);assert.doesNotMatch(JSON.stringify(r),/person1@|user_id|email_verified_at/)});
test('snapshot queries do not write, create tables or alter records',async t=>{const f=fixture(t);f.user(1,'2026-09-01');const before=f.db.prepare('SELECT total_changes() n').get().n;await f.read();assert.equal(f.db.prepare('SELECT total_changes() n').get().n,before)});
test('different people at adjacent stages cannot produce a conversion',async t=>{const f=fixture(t);f.user(1,'2026-09-01');f.user(2,'2026-09-01');f.event(1,'registration_started','2026-09-02');f.event(2,'registration_completed','2026-09-03');const r=await memberJourneySnapshot(f.DB,{now:NOW});assert.equal(r.transitions[0].fromMembers,1);assert.equal(r.transitions[0].toMembers,0);assert.equal(r.transitions[0].observedConversionPct,0)});
test('ordered same-account pairs count once; wrong order and client claims do not',async t=>{const f=fixture(t);f.user(1,'2026-09-01');f.user(2,'2026-09-01');f.event(1,'registration_started','2026-09-02');f.event(1,'registration_completed','2026-09-03');f.event(1,'registration_completed','2026-09-04');f.event(2,'registration_started','2026-09-04');f.event(2,'registration_completed','2026-09-03');f.event(2,'registration_completed','2026-09-05','member_client');const r=await memberJourneySnapshot(f.DB,{now:NOW});assert.equal(r.transitions[0].fromMembers,2);assert.equal(r.transitions[0].toMembers,1);assert.equal(r.transitions[0].observedConversionPct,50)});
test('invalid days are bounded; invalid clock is rejected',()=>{assert.equal(reportingWindow({days:999,now:NOW}).days,365);assert.equal(reportingWindow({days:'oops',now:NOW}).days,30);assert.throws(()=>reportingWindow({now:'bad'}),/clock/)});


test('week-eight uses days 49–55, deduplicates and requires full maturity',async t=>{
 const f=fixture(t),now=Date.parse(NOW),at=days=>new Date(now-days*86400000).toISOString();
 f.user(1,at(59));f.audit(1,'auth.login',at(10));f.audit(1,'passport.add',at(9));
 f.user(2,at(59));f.audit(2,'auth.login',at(3)); // exactly day 56: outside window
 f.user(3,at(55));f.audit(3,'auth.login',at(5)); // return observed, cohort immature
 const r=await f.read();assert.equal(r.retention.week8.eligible,2);assert.equal(r.retention.week8.returned,1);assert.equal(r.retention.week8.ratePct,50);
});
test('week-eight includes exactly 56 days of age, excludes pre-window and future evidence',async t=>{
 const f=fixture(t),now=Date.parse(NOW),at=days=>new Date(now-days*86400000).toISOString();
 f.user(1,at(56));f.audit(1,'auth.login',at(7)); // day49 included
 f.user(2,at(56));f.audit(2,'auth.login',at(8)); // day48 excluded
 f.user(3,at(56));f.audit(3,'auth.login',at(-1)); // future excluded
 const r=await f.read();assert.equal(r.retention.week8.eligible,3);assert.equal(r.retention.week8.returned,1);assert.equal(r.retention.week8.ratePct,33.33);
});
test('short cohort window reports no mature week-eight denominator and no rate',async t=>{
 const f=fixture(t);f.user(1,'2026-09-01');const r=await activationScorecard(f.DB,{days:30,now:NOW});
 assert.deepEqual([r.retention.week8.eligible,r.retention.week8.returned,r.retention.week8.ratePct],[0,0,null]);
});
