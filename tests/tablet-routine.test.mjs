import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {tabletRoutineRoutes,applyRoutine,viewRoutine} from '../member-experience/tablet-routine.mjs';
import {tabletClient} from '../member-experience/tablet-routine-client.mjs';
import {applyLifeBackOperation} from '../member-experience/life-back-routes.mjs';
import {fastMemberStateRoute} from '../member-state-fast-v1.js';
import {withCoaching} from '../shift-coach/presentation.mjs';
const origin='https://shiftsometimber.co.uk';
function fixture(t){
 const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());
 sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,date_of_birth TEXT);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,my_why TEXT DEFAULT '{}',roadmap TEXT DEFAULT '{}',treatment_finder TEXT DEFAULT '{}',decision_readiness TEXT DEFAULT '{}',preferences TEXT DEFAULT '{}',updated_at TEXT);CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,last_activity_at TEXT,updated_at TEXT);INSERT INTO users VALUES(1,'one@example.invalid','1980-01-01'),(2,'two@example.invalid','1980-01-01');INSERT INTO member_status(user_id) VALUES(1),(2);INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1),(2,2,'my_shift_health_tracking',1);");
 for(const id of [1,2])sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run(id,id,createHash('sha256').update('test-'+id).digest('hex'),'2030-01-01T00:00:00Z');
 const DB={prepare(q){let args=[];return {bind(...v){args=v;return this},async first(){return sql.prepare(q).get(...args)||null},async run(){const r=sql.prepare(q).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(items){sql.exec('BEGIN');try{const r=[];for(const i of items)r.push(await i.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 const env={DB,MEMBER_EXPERIENCE_V1_ENABLED:'true'};
 const request=(method,body,id=1,headers={})=>new Request(origin+'/v1/tablet-routine',{method,headers:{Cookie:'sst_session=test-'+id,Origin:origin,'Content-Type':'application/json',...headers},body:method==='GET'?undefined:JSON.stringify(body)});
 return {sql,env,request,route:(method,body,id=1,headers={})=>tabletRoutineRoutes(request(method,body,id,headers),env)};
}
const setup={kind:'setup',revision:0,accountId:1,medicine:'wegovy',prescribed:true,startDate:'2026-09-01',time:'07:30'};
test('routine and feedback survive reads, changed approach persists and account stays isolated',async t=>{
 const f=fixture(t);assert.equal((await f.route('POST',setup)).status,200);
 let b=await (await f.route('GET')).json();assert.equal(b.state.time,'07:30');assert.equal(b.firstWeekDue,true);
 b=await (await f.route('POST',{kind:'review',revision:b.revision,accountId:1,routine:'difficult',difficulty:'forgetting',prescriberHelp:false})).json();
 const first=b.state.step.title;
 b=await (await f.route('POST',{kind:'feedback',revision:b.revision,accountId:1,stepId:b.state.step.id,outcome:'didnt-help'})).json();
 assert.notEqual(b.state.step.title,first);assert.equal(b.state.outcomes.length,1);
 const reloaded=await(await f.route('GET')).json();assert.equal(reloaded.state.step.title,b.state.step.title);
 assert.equal((await(await f.route('GET',null,2)).json()).state,null);
 assert.equal((await f.route('POST',{...setup,accountId:1},2)).status,409);
});
test('consent withdrawal hides records, blocks saves but allows deletion',async t=>{
 const f=fixture(t);await f.route('POST',setup);f.sql.exec("INSERT INTO consents VALUES(3,1,'my_shift_health_tracking',0)");
 const read=await(await f.route('GET')).json();assert.equal(read.state,null);assert.equal(read.consent,false);
 f.sql.exec("INSERT INTO consents VALUES(4,1,'my_shift_health_tracking',1)");assert.equal((await(await f.route('GET')).json()).state,null);f.sql.exec("INSERT INTO consents VALUES(5,1,'my_shift_health_tracking',0)");
 assert.equal((await f.route('POST',{...setup,revision:1})).status,403);
 const gone=await(await f.route('DELETE',{revision:1,accountId:1})).json();assert.equal(gone.state,null);
 assert(!f.sql.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences.includes('wegovy'));
});
test('CSRF, missing session, invalid input and stale concurrent updates are rejected',async t=>{
 const f=fixture(t);assert.equal((await f.route('POST',setup,1,{Origin:'https://evil.invalid'})).status,403);assert.equal((await f.route('GET',null,1,{Cookie:''})).status,401);
 for(const change of [{time:'25:00'},{medicine:'injection'},{prescribed:false},{startDate:'2026-02-31'},{startDate:'2099-01-01'},{dose:25}])assert.equal((await f.route('POST',{...setup,...change})).status,400);
 const results=await Promise.all([f.route('POST',setup),f.route('POST',setup)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 assert.equal((await f.route('POST',setup)).status,409);
});
test('general preference writes cannot erase tablet routine or other owned data',async t=>{
 const f=fixture(t);await f.route('POST',setup);
 const r=await fastMemberStateRoute(new Request(origin+'/v1/member-state',{method:'PATCH',headers:{Cookie:'sst_session=test-1','Content-Type':'application/json'},body:JSON.stringify({preferences:{ordinary:'retained',lifeBack:{tabletRoutine:{enabled:false}}}})}),f.env);
 assert.equal(r.status,200);const b=await(await f.route('GET')).json();assert.equal(b.state.medicine,'wegovy');assert.equal(b.state.revision,1);
});
test('side effects and medication concerns retain clinical destination',()=>{
 for(const difficulty of ['sideeffects','hunger']){let s=applyRoutine(null,setup);s=applyRoutine(s,{kind:'review',routine:'difficult',difficulty,prescriberHelp:false});assert.match(s.step.detail,/prescriber/);s=applyRoutine(s,{kind:'feedback',stepId:s.step.id,outcome:'didnt-help'});assert.match(s.step.detail,/prescriber/)}
 let s=applyRoutine(null,setup);s=applyRoutine(s,{kind:'review',routine:'manageable',difficulty:'none',prescriberHelp:true});assert.match(s.step.detail,/prescriber/);
});
test('day-one help and early review do not suppress the first-week check',()=>{
 let s=applyRoutine(null,setup,'2026-09-01T10:00:00Z');
 assert(s.step?.title);assert.equal(s.nextCheckDate,'2026-09-03');
 assert.equal(viewRoutine(s,Date.parse('2026-09-06T20:00:00Z')).firstWeekDue,false);
 s=applyRoutine(s,{kind:'review',routine:'manageable',difficulty:'none',prescriberHelp:false},'2026-09-02T10:00:00Z');
 assert.equal(viewRoutine(s,Date.parse('2026-09-07T00:30:00Z')).firstWeekDue,true);
 s=applyRoutine(s,{kind:'review',routine:'manageable',difficulty:'none',prescriberHelp:false},'2026-09-07T10:00:00Z');
 assert.equal(viewRoutine(s,Date.parse('2026-09-08T10:00:00Z')).firstWeekDue,false);
 assert.equal(viewRoutine({...s,firstWeekReviewedAt:null},Date.parse('2026-09-08T10:00:00Z')).firstWeekDue,false,'legacy dated week-one reviews stay complete');
});
test('helped returns for another usefulness check and not-tried leaves the step open',()=>{
 let s=applyRoutine(null,setup,'2026-09-01T10:00:00Z');const id=s.step.id;
 s=applyRoutine(s,{kind:'feedback',stepId:id,outcome:'not-tried'},'2026-09-01T11:00:00Z');
 assert.equal(s.step.id,id);assert.equal(s.nextCheckDate,'2026-09-02');
 assert.equal(viewRoutine(s,Date.parse('2026-09-02T10:00:00Z')).feedbackDue,true);
 s=applyRoutine(s,{kind:'feedback',stepId:id,outcome:'helped'},'2026-09-02T11:00:00Z');
 assert.equal(viewRoutine(s,Date.parse('2026-09-03T10:00:00Z')).feedbackDue,false);
 assert.equal(viewRoutine(s,Date.parse('2026-09-04T10:00:00Z')).feedbackDue,true);
 assert.equal(viewRoutine(s).helpfulSteps,1);
 s=applyRoutine(s,{kind:'feedback',stepId:id,outcome:'helped'},'2026-09-02T12:00:00Z');
 assert.equal(s.outcomes.length,2,'duplicate same-day answer does not inflate progress');
});
test('every practical obstacle changes in kind; repeat reviews cannot restart failed approaches',()=>{
 for(const difficulty of ['none','timing','forgetting','food']){
  let s=applyRoutine(null,setup);s=applyRoutine(s,{kind:'review',routine:'difficult',difficulty,prescriberHelp:false});
  const first=s.step.kind;
  s=applyRoutine(s,{kind:'feedback',stepId:s.step.id,outcome:'didnt-help'});
  assert.notEqual(s.step.kind,first,difficulty);const alternative=s.step.id;
  s=applyRoutine(s,{kind:'review',routine:'difficult',difficulty,prescriberHelp:false});assert.equal(s.step.id,alternative);
  s=applyRoutine(s,{kind:'feedback',stepId:s.step.id,outcome:'didnt-fit'});assert.match(s.step.title,/support/);
  s=applyRoutine(s,{kind:'review',routine:'difficult',difficulty:difficulty==='food'?'forgetting':'food',prescriberHelp:false});
  s=applyRoutine(s,{kind:'review',routine:'difficult',difficulty,prescriberHelp:false});assert.match(s.step.title,/support/);
 }
});
test('current dashboard and public responses remain intact; embedded client parses',async()=>{
 new Function(tabletClient);
 const html='<html><head></head><body><header>existing</header><div id="todayActions"><p>existing action</p></div></body></html>';
 const req=new Request(origin+'/member/dashboard');
 const r=await withCoaching(req,new Response(html,{headers:{'Content-Type':'text/html'}}));const text=await r.text();assert(text.includes('id="tabletRoutine"'));assert(text.includes('existing action'));assert(text.includes('<header>existing</header>'));assert(text.includes('id="shiftCoach"'));
 const publicResponse=new Response(html,{headers:{'Content-Type':'text/html'}});assert.equal(await withCoaching(new Request(origin+'/'),publicResponse),publicResponse);
});
test('calendar export uses a real daily alarm and excludes all health data',async()=>{
 let downloaded,body,resolve;const ready=new Promise(r=>resolve=r),buttons={};
 const content={set innerHTML(v){},querySelector(){return null},querySelectorAll(){return ['calendar','erase'].map(a=>({dataset:{tabletAction:a},addEventListener:(type,fn)=>buttons[a]=fn}))}};
 const host={hidden:true,querySelector:q=>q.includes('content')?content:q.includes('summary')?{}:{},querySelectorAll:()=>[]};
 const document={hidden:false,getElementById:id=>id==='tabletRoutine'?host:null,addEventListener(){},createElement:()=>({click(){downloaded=this.download}})};
 const b={...viewRoutine({...applyRoutine(null,setup),startDate:'2026-09-01'}),consent:true,accountId:1};
 runInNewContext(tabletClient,{document,window:{addEventListener(){}},fetch:async()=>{resolve();return Response.json(b)},Response,Date,FormData,crypto,Blob,URL:{createObjectURL:blob=>{body=blob;return 'blob:test'},revokeObjectURL(){}},setTimeout:()=>{},MutationObserver:class {observe(){}},confirm:()=>false});
 await ready;await new Promise(r=>setTimeout(r,0));buttons.calendar();assert.equal(downloaded,'my-timber-routine.ics');const ics=await body.text();assert(ics.includes('\r\nBEGIN:VEVENT\r\n'));assert(ics.includes('RRULE:FREQ=DAILY'));assert(ics.includes('BEGIN:VALARM'));assert(!/wegovy|foundayo|dose|side effects/i.test(ics));assert.match(ics,/DTSTAMP:\d{8}T\d{6}Z/);
});

test('tablet writes retain a complete Life Back state and advance its shared revision',async t=>{const f=fixture(t);await f.route('POST',setup);const prefs=JSON.parse(f.sql.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);assert.equal(prefs.lifeBack.progress.revision,1);const changed=applyLifeBackOperation(prefs.lifeBack.progress,{operationId:'tablet-test-goal-20261003',action:'goal',revision:1,goal:'Enjoy family walks'});assert.equal(changed.tabletRoutine.medicine,'wegovy');assert.equal(changed.revision,2);f.sql.exec("UPDATE member_state SET preferences=json_remove(preferences,'$.lifeBack')");assert.equal((await(await f.route('GET')).json()).state,null)});
