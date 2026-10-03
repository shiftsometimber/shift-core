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

test('new coach feedback counts toward week-four return and helped rate, without prepared-only inflation or private content',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec(`CREATE TABLE users(id INTEGER,email TEXT);CREATE TABLE audit_log(user_id INTEGER,action TEXT);CREATE TABLE product_events(user_id INTEGER,event_name TEXT,source TEXT,occurred_at TEXT);CREATE TABLE check_ins(id INTEGER,user_id INTEGER,case_id INTEGER,submitted_at TEXT);CREATE TABLE member_state(user_id INTEGER,preferences TEXT);CREATE TABLE daily_checkin_actions(id TEXT,user_id INTEGER,checkin_id INTEGER,action_json TEXT,created_at TEXT,feedback TEXT,reviewed_at TEXT);INSERT INTO users VALUES(1,'person@real.example'),(2,'test@example.invalid');INSERT INTO product_events VALUES(1,'continuity_today_exposed','member_client','2026-09-01'),(2,'continuity_today_exposed','member_client','2026-09-01');`);
 const coach={actions:[{id:'a',status:'completed',acceptedAt:Date.parse('2026-09-02'),preparedAt:Date.parse('2026-09-01')},{id:'legacy',status:'completed',preparedAt:Date.parse('2026-09-01')},{id:'only-prepared',status:'prepared',preparedAt:Date.parse('2026-09-23')}],outcomes:[{actionId:'a',value:'helped',at:Date.parse('2026-09-23'),title:'PRIVATE MEMBER WORDS'},{actionId:'legacy',value:'didnt-help',at:Date.parse('2026-09-24')}]};
 for(const user of [1,2])db.prepare('INSERT INTO member_state VALUES(?,?)').run(user,JSON.stringify({lifeBack:{progress:{shiftAI:coach}}}));
 const DB={prepare(sql){let args=[];return{bind(...a){args=a;return this},async all(){return{results:db.prepare(sql).all(...args)}}}}};
 let r=await continuityScorecard(DB,{now:'2026-09-29',days:90});assert.equal(r.week4.numerator,1);assert.equal(r.week4.denominator,1);assert.equal(r.helped.numerator,1);assert.equal(r.helped.denominator,2);assert.equal(r.helped.ratePct,50);assert(!JSON.stringify(r).includes('PRIVATE MEMBER WORDS'));
 db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({lifeBack:{progress:{shiftAI:{actions:[coach.actions[2]],outcomes:[]}}}}));r=await continuityScorecard(DB,{now:'2026-09-29',days:90});assert.equal(r.week4.numerator,0);assert.equal(r.helped.denominator,0);
});

test('first-week usefulness retains unfinished starters, counts each member once and needs the complete London week',()=>{
 const ep=(userId,id,reviews)=>({userId,id,at:'2026-09-01T11:00:00Z',reviews});
 const input={exposures:[exposure,{userId:2,at:exposure.at},{userId:3,at:exposure.at}],episodes:[ep(1,'a',[{at:'2026-09-02',outcome:'helped'}]),ep(1,'b',[{at:'2026-09-03',outcome:'helped'}]),ep(2,'c',[{at:'2026-09-02',outcome:'not-fit'}])]};
 assert.equal(summariseContinuity({...input,asOf:'2026-09-07T22:59:59Z'}).firstWeekUsefulStep.status,'not_yet_eligible');
 const r=summariseContinuity({...input,asOf:'2026-09-07T23:00:00Z'}).firstWeekUsefulStep;
 assert.equal(r.numerator,1);assert.equal(r.denominator,3);assert.equal(r.answeredMembers,2);assert.equal(r.unansweredMembers,1);assert.equal(r.ratePct,33.33);
});
test('first-week usefulness rejects old, late and future evidence, and retains in-window corrections',()=>{
 const ep=(id,at,reviews)=>({userId:1,id,at,reviews});
 const r=summariseContinuity({exposures:[exposure],asOf:'2026-09-09',episodes:[
 ep('old','2026-09-01T09:00:00Z',[{at:'2026-09-02',outcome:'helped'}]),
 ep('late','2026-09-02',[{at:'2026-09-08',outcome:'helped'}]),
 ep('future','2026-09-02',[{at:'2027-09-02',outcome:'helped'}]),
 ep('corrected','2026-09-02',[{at:'2026-09-03',outcome:'helped'},{at:'2026-09-04',outcome:'didnt-help'}])
 ]}).firstWeekUsefulStep;
 assert.equal(r.numerator,0);assert.equal(r.denominator,1);assert.equal(r.answeredMembers,1);
 assert.equal(summariseContinuity({episodesAvailable:false}).firstWeekUsefulStep.status,'unavailable');
});
test('support follow-through includes old unassigned work and excludes staff/tests, private text and future requests',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec(`CREATE TABLE users(id INTEGER,email TEXT);CREATE TABLE hq_users(email TEXT);CREATE TABLE audit_log(user_id INTEGER,action TEXT);CREATE TABLE product_events(user_id INTEGER,event_name TEXT,source TEXT,occurred_at TEXT);CREATE TABLE support_tickets(reference TEXT,user_id INTEGER,status TEXT,assigned_hq_user_id INTEGER,created_at TEXT,updated_at TEXT,body TEXT);INSERT INTO users VALUES(1,'member@real.example'),(2,'test@example.invalid'),(3,'staff@real.example');INSERT INTO hq_users VALUES('staff@real.example');
 INSERT INTO support_tickets VALUES('COACH-old',1,'open',NULL,'2026-07-01','2026-09-20','PRIVATE WORDS'),('COACH-new',1,'waiting',9,'2026-09-28','2026-09-28','SECRET'),('COACH-closed',1,'closed',9,'2026-09-01','2026-09-28','SECRET'),('COACH-test',2,'open',NULL,'2026-09-01','2026-09-01','SECRET'),('COACH-staff',3,'open',NULL,'2026-09-01','2026-09-01','SECRET'),('SUP-unrelated',1,'open',NULL,'2026-09-01','2026-09-01','SECRET'),('COACH-future',1,'open',NULL,'2027-01-01','2027-01-01','SECRET'),('COACH-clock',1,'open',NULL,'2026-09-01','2027-01-01','SECRET');`);
 const DB={prepare(sql){let args=[];return{bind(...a){args=a;return this},async all(){return{results:db.prepare(sql).all(...args)}}}}};
 const r=await continuityScorecard(DB,{now:'2026-09-29',days:7});const q=r.supportFollowThrough;
 assert.equal(q.openRequests,3);assert.equal(q.unassignedRequests,2);assert.equal(q.withoutUpdate48Hours,1);assert.equal(q.unknownUpdateTime,1);assert.equal(q.teamMarkedClosed,1);assert.equal(q.memberConfirmedResolution.status,'unavailable');assert.equal(q.responsePromise,null);assert(!JSON.stringify(r).includes('PRIVATE'));assert(!JSON.stringify(r).includes('real.example'));
 db.exec('DROP TABLE support_tickets');assert.equal((await continuityScorecard(DB,{now:'2026-09-29'})).supportFollowThrough.status,'unavailable');
});

test('support resolution counts explicit latest-reply confirmation without returning messages',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec(`CREATE TABLE users(id INTEGER,email TEXT);CREATE TABLE hq_users(email TEXT);CREATE TABLE audit_log(user_id INTEGER,action TEXT);CREATE TABLE product_events(user_id INTEGER,event_name TEXT,source TEXT,occurred_at TEXT);CREATE TABLE support_tickets(reference TEXT,user_id INTEGER,status TEXT,assigned_hq_user_id INTEGER,created_at TEXT,updated_at TEXT,body TEXT,subject TEXT);INSERT INTO users VALUES(1,'member@real.example'),(2,'test@example.invalid');`);
 const insert=(reference,user,status,reply,confirmation,subject='My Timber everyday coaching help [thread-v1]')=>db.prepare('INSERT INTO support_tickets VALUES(?,?,?,9,?,?,?,?)').run(reference,user,status,'2026-09-20','2026-09-28',JSON.stringify({request:'PRIVATE REQUEST',replies:[{id:reply,text:'PRIVATE REPLY'}],confirmation}),subject);
 insert('COACH-confirmed',1,'closed','latest',{replyId:'latest',at:'2026-09-28'});insert('COACH-team-closed',1,'closed','latest',null);insert('COACH-stale',1,'closed','new',{replyId:'old',at:'2026-09-28'});insert('COACH-future-confirmation',1,'closed','latest',{replyId:'latest',at:'2027-01-01'});insert('COACH-test',2,'closed','latest',{replyId:'latest',at:'2026-09-28'});insert('COACH-legacy-json',1,'closed','latest',{replyId:'latest',at:'2026-09-28'},'Original plain request');
 const DB={prepare(sql){let args=[];return{bind(...a){args=a;return this},async all(){return{results:db.prepare(sql).all(...args)}}}}};
 const r=await continuityScorecard(DB,{now:'2026-09-29'});assert.equal(r.supportFollowThrough.memberConfirmedResolution.status,'observed');assert.equal(r.supportFollowThrough.memberConfirmedResolution.requests,1);assert.equal(r.supportFollowThrough.teamMarkedClosed,5);assert(!JSON.stringify(r).includes('PRIVATE'));
});
