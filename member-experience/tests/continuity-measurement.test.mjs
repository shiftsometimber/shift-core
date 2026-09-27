import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {summariseContinuity,londonDay,continuityScorecard} from '../../continuity-measurement/scorecard.mjs';
const exposure={userId:1,at:'2026-09-01T10:00:00Z'};
test('first Today starts cohort, including unfinished loops; Days 2–7 need full calendar window',()=>{
 const input={exposures:[exposure,{...exposure,at:'2026-09-03T10:00:00Z'},{userId:2,at:exposure.at}],actions:[{userId:1,at:'2026-09-07T22:59:59Z'}]};
 let r=summariseContinuity({...input,asOf:'2026-09-07T22:59:59Z'});assert.equal(r.week1.status,'not_yet_eligible');assert.equal(r.week1.ratePct,null);
 r=summariseContinuity({...input,asOf:'2026-09-07T23:00:00Z'});assert.equal(r.todayStarters,2);assert.equal(r.week1.numerator,1);assert.equal(r.week1.denominator,2);assert.equal(r.week1.ratePct,50);assert.equal(r.day1Loop.status,'unavailable');
});
test('Day 1 and Day 8 are not week-1 return, Day 22 and Day 28 are week-4',()=>{
 let r=summariseContinuity({exposures:[exposure],actions:[exposure,{userId:1,at:'2026-09-08T00:00:00Z'}],asOf:'2026-09-29T00:00:00Z'});assert.equal(r.week1.numerator,0);assert.equal(r.week4.numerator,0);
 for(const at of ['2026-09-21T23:00:00Z','2026-09-28T22:59:59Z']){r=summariseContinuity({exposures:[exposure],actions:[{userId:1,at}],asOf:'2026-09-28T23:00:00Z'});assert.equal(r.week4.numerator,1);assert.equal(r.week4.denominator,1)}
});
test('London calendar maturity survives spring and autumn clock changes',()=>{
 assert.equal(londonDay('2026-03-29T23:00:00Z')-londonDay('2026-03-29T00:00:00Z'),1);
 assert.equal(londonDay('2026-10-25T00:00:00Z'),londonDay('2026-10-25T23:00:00Z'));
 const r=summariseContinuity({exposures:[{userId:1,at:'2026-03-23T00:00:00Z'}],asOf:'2026-03-29T23:00:00Z'});assert.equal(r.week1.denominator,1);
});
test('linked episodes count once; latest answer, negatives, neutral answers and unanswered remain visible',()=>{
 const ep=(id,reviews=[])=>({userId:1,id,at:'2026-09-02T10:00:00Z',reviews});
 const r=summariseContinuity({asOf:'2026-09-20',episodes:[ep('a',[{at:'2026-09-03',outcome:'helped'}]),ep('a',[{at:'2026-09-04',outcome:'not-fit'}]),ep('b',[{at:'2026-09-03',outcome:'helped'}]),ep('c',[{at:'2026-09-03',outcome:'not-tried'}]),ep('d')]});
 assert.equal(r.helped.numerator,1);assert.equal(r.helped.denominator,3);assert.equal(r.feedbackCoverage.denominator,4);assert.equal(r.feedbackCoverage.unanswered,1);assert.equal(r.medicationElsewhere.status,'unavailable');
});
test('absent sources and absent exposure are never zero-percent performance',()=>{
 const r=summariseContinuity({activityAvailable:false,episodesAvailable:false});assert.equal(r.week4.status,'unavailable');assert.equal(r.helped.ratePct,null);
 assert.equal(summariseContinuity({}).week4.status,'awaiting_first_today_exposure');
});
test('report adapter excludes staff/tests, login/page views and untrusted sources; returns only aggregate evidence',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec(`CREATE TABLE users(id INTEGER,email TEXT);CREATE TABLE hq_users(email TEXT);CREATE TABLE audit_log(user_id INTEGER,action TEXT);CREATE TABLE product_events(user_id INTEGER,event_name TEXT,source TEXT,occurred_at TEXT);CREATE TABLE check_ins(id INTEGER,user_id INTEGER,case_id INTEGER,submitted_at TEXT);CREATE TABLE member_state(user_id INTEGER,preferences TEXT);CREATE TABLE daily_checkin_actions(id TEXT,user_id INTEGER,checkin_id INTEGER,action_json TEXT,created_at TEXT,feedback TEXT,reviewed_at TEXT);
 INSERT INTO users VALUES(1,'person@real.example'),(2,'staff@real.example'),(3,'test@example.invalid'),(4,'member@real.example');INSERT INTO hq_users VALUES('staff@real.example');
 INSERT INTO product_events VALUES(1,'continuity_today_exposed','member_client','2026-09-01'),(2,'continuity_today_exposed','member_client','2026-09-01'),(3,'continuity_today_exposed','member_client','2026-09-01'),(4,'continuity_today_exposed','server','2026-09-01'),(1,'login_succeeded','server','2026-09-03');`);
 const DB={prepare(sql){let args=[];return{bind(...a){args=a;return this},async all(){return{results:db.prepare(sql).all(...args)}}}}};
 const r=await continuityScorecard(DB,{now:'2026-09-29',days:90});assert.equal(r.todayStarters,1);assert.equal(r.week1.numerator,0);assert.equal(r.week1.denominator,1);assert(!JSON.stringify(r).includes('real.example'));
 db.exec("INSERT INTO check_ins VALUES(1,1,NULL,'2026-09-03')");assert.equal((await continuityScorecard(DB,{now:'2026-09-29',days:90})).week1.numerator,1);
});

test('skipping a question is unanswered and supersedes an earlier positive response',()=>{
 const r=summariseContinuity({asOf:'2026-09-20',episodes:[{userId:1,id:'a',at:'2026-09-01',reviews:[{at:'2026-09-02',outcome:'helped'},{at:'2026-09-03',outcome:'skip'}]}]});
 assert.equal(r.helped.denominator,0);assert.equal(r.feedbackCoverage.numerator,0);assert.equal(r.feedbackCoverage.unanswered,1);
});
