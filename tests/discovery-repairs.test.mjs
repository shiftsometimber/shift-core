import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {askTimberRoutes} from '../ask-timber-v1.js';
import {penDayRoutes,appendPenDayExport} from '../pen-day-v1.js';
import {privacyHealthErasureRoute} from '../privacy-health-erasure-route-v1.js';
import {receiveAccountDeletion} from '../privacy-account-request-v1.js';
import {recordProductEvent,analyticsSnapshot,ensureAnalyticsSchema} from '../product-analytics-v1.js';
import {composeDailyOutput} from '../member-product-v8.js';
import {savedFitIssues} from '../member-experience/fit-saved-review.mjs';
import {repairServiceBridgePaint} from '../public-navigation-policy.mjs';
import {preserveServiceBridgePaint} from '../public-service-bridge-preservation.mjs';

function database(t){
 const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
 const DB={exec:async sql=>sqlite.exec(sql),prepare(sql){let args=[];return{bind(...values){args=values;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return{results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}}},async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}}};
 return{sqlite,DB};
}
const site='https://shiftsometimber.co.uk';
function request(path,method='GET',body,headers={}){return new Request(site+path,{method,headers:{Origin:site,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})})}

test('crisis wording and inflections reach static help even with absent or failing dependencies',async()=>{
 const broken=new Proxy({},{get(){throw Error('Dependency must not be accessed')}});
 for(const message of ['I feel suicidal','I am thinking about suicide','I want to kill myself','He wants to kill himself','I am self-harming','I don’t want to live','Someone has anaphylaxis','Possible anaphylactic shock','I can’t breathe','Someone has overdosed','Someone has chest pain']){
  for(const env of [{},{AI:broken},{DB:broken},{AI:broken,DB:broken}]){
   const response=await askTimberRoutes(request('/v1/ai/chat','POST',{message}),env),data=await response.json();
   assert.equal(response.status,200,message);assert.equal(data.mode,'safety',message);assert.match(data.answer,/999/);assert.deepEqual(data.followUps,[]);
  }
 }
 // An informational or negated mention must not diagnose or assert imminent danger.
 for(const message of ['What does suicidal mean?','I am not suicidal','How do I help someone thinking about suicide?']){
  const data=await(await askTimberRoutes(request('/v1/ai/chat','POST',{message}),{})).json();
  assert.equal(data.mode,'safety');assert.match(data.answer,/If you cannot keep yourself or someone else safe/);assert.doesNotMatch(data.answer,/you are suicidal|you are in danger/i);
 }
 for(const message of ['I want to build muscle','How do I improve my walking?','What are suicide rates?']){
  const r=await askTimberRoutes(request('/v1/ai/chat','POST',{message}),{});
  assert.equal(r.status,message.includes('suicide')?200:503);
 }
 assert.equal((await askTimberRoutes(request('/v1/ai/chat','POST',{message:'I feel suicidal'},{Origin:'https://untrusted.invalid'}),{})).status,403);
 assert.equal((await askTimberRoutes(request('/v1/ai/chat','POST',{message:''}),{})).status,400);
});

test('public chat preserves safety responses even when the question also mentions food',()=>{
 const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../frontend/member/assets/ask-timber-intent-v2.js',import.meta.url),'utf8'),context);
 const response={ok:true,mode:'safety',answer:'Call 999 if you cannot stay safe.',nextSteps:['Call 999.'],keyPoints:[],followUps:[]};
 const result=context.AskTimberIntent.complete('I feel suicidal and cannot eat dinner',response);
 assert.equal(JSON.stringify(result),JSON.stringify(response));
 assert.match(context.AskTimberIntent.complete('Can I have a kebab?',{answer:'Here is some information.'}).answer,/food bit/,'Existing ordinary-answer behaviour retained');
});

async function memberFixture(t){
 const {sqlite,DB}=database(t);
 sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
 CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,consent_version TEXT,granted INTEGER,granted_at TEXT,withdrawn_at TEXT,created_at TEXT);
 CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT,updated_at TEXT);CREATE TABLE progress_entries(user_id INTEGER);CREATE TABLE check_ins(user_id INTEGER,case_id INTEGER);
 CREATE TABLE audit_log(user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT);
 INSERT INTO users VALUES(1),(2);INSERT INTO member_state VALUES(1,'{}','2026-09-21');INSERT INTO progress_entries VALUES(1),(2);INSERT INTO check_ins VALUES(1,NULL),(1,99),(2,NULL);`);
 const token='fictional-local-test',hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
 sqlite.prepare('INSERT INTO user_sessions VALUES(1,1,?,?,NULL,NULL)').run(hash,new Date(Date.now()+3600000).toISOString());
 const req=(path,method,body)=>request(path,method,body,{Cookie:'sst_session='+token});
 const consent=granted=>sqlite.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',?)").run(granted);
 return{sqlite,DB,env:{DB},req,consent};
}

test('Pen Day honours consent at write time and has a complete export/erase lifecycle',async t=>{
 const f=await memberFixture(t),{sqlite,env,req,consent}=f;
 const save=()=>penDayRoutes(req('/v1/pen-day','POST',{status:'done',feel:'rough',note:'FICTIONAL PRIVATE NOTE'}),env);
 assert.equal((await save()).status,409,'No consent');consent(1);assert.equal((await save()).status,200);
 assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='product_events'").get().n,0,'No medication analytics generated');
 await ensureAnalyticsSchema(f.DB);
 sqlite.exec("INSERT INTO product_events(user_id,event_name,surface,properties_json,occurred_at) VALUES(1,'pen_day_rough','today','{\"feel\":\"rough\"}','2026-09-21T00:00:00.000Z'),(2,'pen_day_rough','today','{}','2026-09-21T00:00:00.000Z'),(1,'today_viewed','today','{}','2026-09-21T00:00:00.000Z');");
 sqlite.exec("INSERT INTO member_pen_day_notes(user_id,local_date,status,note) VALUES(2,'2026-09-21','done','OTHER MEMBER');");
 consent(0);assert.equal((await save()).status,409,'Withdrawal blocks new saves');
 const exported=await(await appendPenDayExport(req('/v1/privacy/export','POST'),env,Response.json({user:{id:1}}))).json();
 assert.equal(exported.penDayNotes.length,1);assert.equal(exported.penDayNotes[0].note,'FICTIONAL PRIVATE NOTE');assert.equal(exported.penDayLegacyEvents.length,1);
 // Exports must work after withdrawal, regardless of the member experience flag.
 assert.equal(exported.user.id,1);
 const erase=()=>privacyHealthErasureRoute(req('/v1/privacy/health-tracking','DELETE'),env,{},async()=>Response.json({user:{id:1}}));
 assert.equal((await erase()).status,200);assert.equal((await erase()).status,200,'Repeat erasure is safe');
 const after=await(await penDayRoutes(req('/v1/pen-day'),env)).json();assert.equal(after.today,null);assert.deepEqual(after.history,[]);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM member_pen_day_notes WHERE user_id=2').get().n,1);
 assert.deepEqual(sqlite.prepare('SELECT user_id,event_name FROM product_events ORDER BY id').all().map(r=>({...r})),[{user_id:2,event_name:'pen_day_rough'},{user_id:1,event_name:'today_viewed'}]);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM check_ins WHERE case_id=99').get().n,1,'Clinical record remains');
 assert.equal((await save()).status,409,'Erasure withdraws consent');
 for(const eventName of ['pen_day_done','pen_day_rough','pen_day_status_saved','pen_day_door_click'])await assert.rejects(recordProductEvent(env,{userId:1,eventName,properties:{feel:'rough'}}),/unsupported event/);
});

test('Pen Day cannot race a concurrent withdrawal into a new saved note',async t=>{
 const f=await memberFixture(t);f.consent(1);const prepare=f.DB.prepare.bind(f.DB);let injected=false;
 f.DB.prepare=sql=>{if(sql.startsWith('INSERT INTO member_pen_day_notes')&&!injected){f.consent(0);injected=true}return prepare(sql)};
 const r=await penDayRoutes(f.req('/v1/pen-day','POST',{status:'done',note:'MUST NOT SAVE'}),f.env);
 assert.equal(r.status,409);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM member_pen_day_notes').get().n,0);
});

function deletionFixture(t){
 const f=database(t);f.sqlite.exec(`CREATE TABLE data_requests(id INTEGER PRIMARY KEY,user_id INTEGER,request_type TEXT,status TEXT,received_at TEXT,completed_at TEXT);
 CREATE TABLE hq_tasks(id INTEGER PRIMARY KEY,user_id INTEGER,title TEXT,description TEXT,status TEXT,due_at TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,revoked_at TEXT);
 INSERT INTO user_sessions VALUES(1,1,NULL),(2,1,NULL),(3,2,NULL);`);return f;
}
test('deletion receipt reaches HQ and signs out all member sessions atomically, without claiming completion',async t=>{
 const {sqlite,DB}=deletionFixture(t);
 for(let i=0;i<2;i++)assert.deepEqual(await receiveAccountDeletion(DB,1),{ok:true,status:'received'});
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM data_requests').get().n,1);assert.equal(sqlite.prepare('SELECT completed_at FROM data_requests').get().completed_at,null);
 assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM hq_tasks WHERE status='open'").get().n,1);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=1 AND revoked_at IS NULL').get().n,0);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM user_sessions WHERE user_id=2 AND revoked_at IS NULL').get().n,1);
});
test('a failed HQ task cannot leave a false receipt or revoke sessions',async t=>{
 const {sqlite,DB}=deletionFixture(t);sqlite.exec("CREATE TRIGGER deny_queue BEFORE INSERT ON hq_tasks BEGIN SELECT RAISE(ABORT,'queue unavailable'); END;");
 await assert.rejects(receiveAccountDeletion(DB,1),/queue unavailable/);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM data_requests').get().n,0);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM user_sessions WHERE revoked_at IS NULL').get().n,3);
});

test('Today uses the same saved-session guard as Fit without changing the retained plan',()=>{
 const base={date:'2026-09-21',hour:12,grubPlan:{},hydrationMl:0,mode:'train',minutesCap:30,dayChange:null,reasons:[],completedToday:false};
 const plan={location:'home',minutes_per_day:20,sessions:[{title:'Old session',requested_minutes:20,estimated_minutes:22,exercises:[{id:'hotel-push-up',name:'Hotel push-up',group:'push'}]}]},before=structuredClone(plan);
 assert(savedFitIssues(plan).length);
 for(const dayChange of [null,'working_late','rough_guts']){
  const o=composeDailyOutput({...base,fitPlan:plan,dayChange});assert.equal(o.workout.ready,false);assert.equal(o.workout.needsReview,true);assert.deepEqual(o.workout.exercises,[]);assert.equal(o.workout.minutes,null);assert.match(o.workout.detail,/history are kept/);
 }
 assert.deepEqual(plan,before);
 const valid={...plan,sessions:[{...plan.sessions[0],exercises:[{id:'push-up',name:'Push-up',group:'push'}]}]};
 assert.equal(composeDailyOutput({...base,fitPlan:valid}).workout.ready,true);assert.equal(composeDailyOutput({...base,fitPlan:{}}).workout.ready,false);
});

test('24-hour reporting has exact cutoff, midnight and future boundaries for all counts',async t=>{
 const {DB,sqlite}=database(t);await ensureAnalyticsSchema(DB);
 for(const now of ['2026-09-21T10:36:25.123Z','2026-09-21T00:00:00.000Z']){
  sqlite.exec('DELETE FROM product_events');const cutoff=Date.parse(now)-86400000;
  for(const [i,at]of [cutoff-1,cutoff,cutoff+1,Date.parse(now),Date.parse(now)+1].entries())sqlite.prepare("INSERT INTO product_events(user_id,event_name,surface,occurred_at) VALUES(?,'error_presented','test',?)").run(i+1,new Date(at).toISOString());
  const r=await analyticsSnapshot(DB,{hours:24,now});assert.equal(r.errors,3);assert.equal(r.activeMembers,3);assert.equal(r.events[0].count,3);assert.equal(r.surfaces[0].count,3);
 }
});

test('public release preserves every byte outside the exact authorised paint repair',()=>{
 const original='<html><head><title>Retained</title></head><body><main>Retained page content</main></body></html>';
 const repaired=repairServiceBridgePaint(original);
 assert.equal(repairServiceBridgePaint(repaired),repaired);
 assert.equal(preserveServiceBridgePaint(Buffer.from(repaired),{required:true}).toString(),original);
 assert.equal(preserveServiceBridgePaint(Buffer.from(original)).toString(),original);
 assert.throws(()=>preserveServiceBridgePaint(Buffer.from(original),{required:true}),/Missing/);
 assert.throws(()=>preserveServiceBridgePaint(Buffer.from(repaired.replace('#050505','#FFFFFF')),{required:true}),/Unexpected/);
 assert.throws(()=>preserveServiceBridgePaint(Buffer.from(repaired+repaired)),/Unexpected/);
 assert.notEqual(preserveServiceBridgePaint(Buffer.from(repaired.replace('Retained page content','Changed content'))).toString(),original);
});
