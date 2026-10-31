import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFoodLog} from '../food-log.mjs';
import {journeyPortabilityRoutes} from '../journey-portability.mjs';
import {buildMemberJourneyContext} from '../ai-context.mjs';
import {savedFactKind,savedFactAnswer} from '../ai-fast-answers.mjs';
import {compactJourney} from '../ai-practical-context.mjs';
import {foodLogPresentation,createFoodLogViewFlow,foodLogRuntime} from '../food-log-client.mjs';
import vm from 'node:vm';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const offset=(date,n)=>{const at=new Date(date+'T12:00:00Z');at.setUTCDate(at.getUTCDate()+n);return at.toISOString().slice(0,10)};
async function fixture(t,{table=true}={}){
 const sql=new DatabaseSync(':memory:'),reads=[],writes=[],e={sql,reads,writes};t.after(()=>sql.close());
 sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_sessions(id TEXT,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,consent_type TEXT,granted INTEGER);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT);CREATE TABLE check_ins(id INTEGER PRIMARY KEY,user_id INTEGER,case_id INTEGER,wellbeing_score INTEGER,notes TEXT,submitted_at TEXT);CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,recorded_on TEXT,protein_g REAL);INSERT INTO users VALUES(1,'one@example.invalid'),(2,'two@example.invalid');INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1),(2,'my_shift_health_tracking',1);INSERT INTO member_state VALUES(1,'{}'),(2,'{}');");
 if(table)sql.exec('CREATE TABLE member_food_entries(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,recorded_on TEXT NOT NULL,body_json TEXT NOT NULL,created_at TEXT NOT NULL);');
 e.DB={
  exec:async q=>{writes.push(q);sql.exec(q)},
  prepare(q){let values=[];return {
   bind(...v){values=v;return this},
   first:async()=>{reads.push(q);const value=sql.prepare(q).get(...values)||null;await e.onRead?.(q);return value},
   all:async()=>{reads.push(q);const results=sql.prepare(q).all(...values);await e.onRead?.(q);return {results}},
   run:async()=>{writes.push(q);return {meta:{changes:Number(sql.prepare(q).run(...values).changes)}}}
  }}
 };
 for(const id of[1,2]){const token=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('food-log-'+id))).toString('hex');sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run('session-'+id,id,token,'2099-01-01');}
 e.MEMBER_EXPERIENCE_V1_ENABLED='true';return e;
}
const req=(body,{user=1,method=body?'POST':'GET'}={})=>new Request('https://shiftsometimber.co.uk/v1/grub/eaten',{method,headers:{Cookie:'sst_session=food-log-'+user,Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
const add=(e,id,on,food,nutrition={},user=1)=>e.sql.prepare('INSERT INTO member_food_entries VALUES(?,?,?,?,?)').run(id,user,on,JSON.stringify({operationId:id,on,food,...nutrition}),'2026-01-01T12:00:00Z');

test('one confirmed save updates the diary, Today context, AI facts and totals; retries do not double-count',async t=>{
 const e=await fixture(t),date=today(),entry={operationId:'food-confirmed-operation-one',on:date,food:'Eggs and toast · 1 pictured portion',kcal:300,proteinG:18,fibreG:0,nutritionSource:'member_confirmed_estimate'};
 const prefs={grubV2:{today:{date,recipeId:'planned',name:'Uneaten planned dinner',kcal:900,protein_g:80},week:[{}]},myJourney:{setup:{paused:false}}};e.sql.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify(prefs));e.sql.prepare('INSERT INTO progress_entries VALUES(1,1,?,999)').run(date);
 assert.equal((await journeyPortabilityRoutes(req(entry),e)).status,201);assert.equal((await journeyPortabilityRoutes(req(entry),e)).status,200);
 const diary=await(await journeyPortabilityRoutes(req(),e)).json();assert.equal(diary.memberId,1);assert.equal(diary.entries.length,1);assert.equal(diary.foodLog.today.entryCount,1);assert.equal(diary.foodLog.today.nutrition.proteinG.total,18);assert.equal(diary.foodLog.today.nutrition.kcal.total,300);
 const journey=await buildMemberJourneyContext(e.DB,1);assert.equal(journey.status,'available');assert.deepEqual(journey.grub.foodLog,diary.foodLog);assert.equal(journey.grub.chosenForToday.state,'chosen_not_confirmed_eaten');assert.equal(e.sql.prepare('SELECT protein_g FROM progress_entries').get().protein_g,999);
 assert.equal(savedFactKind('What have I eaten today?'),'food_today');assert.match(savedFactAnswer('food_today',journey),/Eggs and toast/);assert.doesNotMatch(savedFactAnswer('food_today',journey),/Uneaten planned/);assert.match(savedFactAnswer('food_protein',journey),/18 g/);
 assert.equal((await journeyPortabilityRoutes(req({id:entry.operationId},{method:'DELETE'}),e)).status,200);
 const after=await buildMemberJourneyContext(e.DB,1);assert.equal(after.grub.foodLog.today.entryCount,0);assert.equal(after.grub.foodLog.today.nutrition.proteinG,undefined);assert.match(savedFactAnswer('food_today',after),/no saved eaten-food/);
});
test('missing nutrition stays unknown while a genuine recorded zero contributes to coverage',async t=>{
 const e=await fixture(t),date=today();add(e,'one',date,'Plain description');add(e,'two',date,'Known zero',{proteinG:0,kcal:0});add(e,'three',date,'Known amount',{proteinG:12,kcal:200});
 const log=await readFoodLog(e.DB,1);assert.equal(log.today.entryCount,3);assert.deepEqual(log.today.nutrition.proteinG,{total:12,recordedEntries:2,missingEntries:1});assert.equal(log.today.nutrition.fatG,undefined);assert.equal(log.today.completeDay,false);
 const text=foodLogPresentation(log);assert.match(text.today.lines.join(' '),/2 of 3 entries.*1 missing/);assert(!text.today.lines.some(line=>line.startsWith('Fat:')));assert.match(text.note,/incomplete/);
});
test('simultaneous retries acknowledge one save and produce one contribution to totals',async t=>{
 const e=await fixture(t),entry={operationId:'simultaneous-food-operation',on:today(),food:'One confirmed meal',proteinG:18};
 const responses=await Promise.all([journeyPortabilityRoutes(req(entry),e),journeyPortabilityRoutes(req(entry),e)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,201]);const log=await readFoodLog(e.DB,1);assert.equal(log.today.entryCount,1);assert.equal(log.today.nutrition.proteinG.total,18);
});
test('a concurrent deletion cannot pair old totals with a different recent-food list',async t=>{
 const e=await fixture(t);add(e,'concurrent-delete',today(),'One snapshot meal',{proteinG:18});let changed=false;
 e.onRead=query=>{if(!changed&&query.includes('GROUP BY recorded_on')){changed=true;e.sql.exec("DELETE FROM member_food_entries WHERE user_id=1");}};
 const snapshot=await readFoodLog(e.DB,1);assert.equal(snapshot.today.entryCount,1);assert.equal(snapshot.recent.length,1);assert.equal(snapshot.recent[0].food,'One snapshot meal');assert.equal(snapshot.today.nutrition.proteinG.total,18);
 const next=await readFoodLog(e.DB,1);assert.equal(next.today.entryCount,0);assert.deepEqual(next.recent,[]);
});
test('full-range totals remain exact beyond the diary and AI recent-record display limits',async t=>{
 const e=await fixture(t),date=today();e.sql.exec('BEGIN');for(let i=0;i<400;i++)add(e,'many-'+i,date,'Synthetic entry '+i,{proteinG:1});e.sql.exec('COMMIT');
 const response=await(await journeyPortabilityRoutes(req(),e)).json();assert.equal(response.entries.length,365);assert.equal(response.historyMayBeLimited,true);assert.equal(response.foodLog.today.entryCount,400);assert.equal(response.foodLog.today.nutrition.proteinG.total,400);assert.equal(response.foodLog.recent.length,12);assert.equal(response.foodLog.recentMayBeLimited,true);
});
test('date range and account boundaries exclude other members, old entries and future dates',async t=>{
 const e=await fixture(t),date=today();add(e,'today',date,'Own food',{proteinG:10});add(e,'six-days-ago',offset(date,-6),'Own earlier food',{proteinG:20});add(e,'old',offset(date,-7),'Old food',{proteinG:30});add(e,'future',offset(date,1),'Future food',{proteinG:40});add(e,'other',date,'OTHER_MEMBER_PRIVATE_FOOD',{proteinG:500},2);
 const log=await readFoodLog(e.DB,1);assert.equal(log.today.nutrition.proteinG.total,10);assert.equal(log.last7Days.nutrition.proteinG.total,30);assert.equal(log.last7Days.entryCount,2);assert.equal(log.last7Days.loggedDays,2);assert(!JSON.stringify(log).includes('OTHER_MEMBER'));assert(!log.recent.some(entry=>entry.food==='Future food'));
});
test('London midnight determines the food day, including the BST boundary',async t=>{
 const e=await fixture(t);add(e,'london-today','2026-07-02','London midnight snack',{kcal:100});add(e,'utc-yesterday','2026-07-01','Earlier meal',{kcal:300});
 const log=await readFoodLog(e.DB,1,{now:new Date('2026-07-01T23:15:00Z')});assert.equal(log.date,'2026-07-02');assert.equal(log.today.nutrition.kcal.total,100);assert.equal(log.last7Days.nutrition.kcal.total,400);
});
test('reading a new member log is read-only and absence of a table is an empty log',async t=>{
 const e=await fixture(t,{table:false});const log=await readFoodLog(e.DB,1);assert.equal(log.status,'available');assert.equal(log.today.entryCount,0);assert.deepEqual(log.today.nutrition,{});assert.deepEqual(e.writes,[]);
});
test('withdrawn or paused tracking prevents food reads and suppresses private results',async t=>{
 const e=await fixture(t);add(e,'private',today(),'PRIVATE_FOOD');e.sql.exec('UPDATE consents SET granted=0 WHERE user_id=1');assert.deepEqual(await readFoodLog(e.DB,1),{status:'tracking_off'});assert(!e.reads.some(q=>q.includes('FROM member_food_entries')));
 e.sql.exec('UPDATE consents SET granted=1 WHERE user_id=1');e.sql.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({myJourney:{setup:{paused:true}}}));assert.deepEqual(await readFoodLog(e.DB,1),{status:'paused'});
});
test('withdrawal or withdrawal-and-regrant during a read cannot return the old food snapshot',async t=>{
 for(const regrant of[false,true]){const e=await fixture(t);add(e,'private',today(),'PRIVATE_FOOD');let changed=false;e.onRead=q=>{if(!changed&&q.includes('GROUP BY recorded_on')){changed=true;e.sql.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)"+(regrant?",(1,'my_shift_health_tracking',1)":""));}};
  const log=await readFoodLog(e.DB,1);assert.equal(log.status,regrant?'privacy_changed':'tracking_off');assert.equal(log.recent,undefined);
 }
});
test('a broken store is unavailable rather than an invented empty day',async t=>{
 const e=await fixture(t);e.sql.prepare('INSERT INTO member_food_entries VALUES(?,?,?,?,?)').run('broken',1,today(),'not JSON','2026-01-01');assert.deepEqual(await readFoodLog(e.DB,1),{status:'unavailable'});
});
test('compact food context is relevant, bounded and does not mutate the full saved view',async t=>{
 const e=await fixture(t);for(let i=0;i<8;i++)add(e,'compact-'+i,today(),'Food '+i);const journey=await buildMemberJourneyContext(e.DB,1),before=JSON.stringify(journey);
 assert.equal(compactJourney(journey,'What did I eat today?').grub.foodLog.recent.length,6);assert.equal(compactJourney(journey,'Help with gardening').grub.foodLog,undefined);assert.equal(JSON.stringify(journey),before);
});
test('nutrition facts come from the current log and never imply a complete day',async t=>{
 const e=await fixture(t);add(e,'description',today(),'No amounts');let journey=await buildMemberJourneyContext(e.DB,1);assert.match(savedFactAnswer('food_protein',journey),/no protein amounts/);add(e,'protein',today(),'Known amount',{proteinG:18,nutritionSource:'member_confirmed_estimate'});journey=await buildMemberJourneyContext(e.DB,1);const answer=savedFactAnswer('food_protein',journey);assert.match(answer,/18 g.*1 of 2/);assert.match(answer,/not proof of your whole day/);assert.match(answer,/estimates/);
});
test('summary views refuse another account response and ignore a late response after clearing',async()=>{
 const changes=[],sample={status:'available',today:{entryCount:1}};
 const wrong=createFoodLogViewFlow({readLog:async()=>({memberId:1,foodLog:sample}),readMember:async()=>({user:{id:2}}),onChange:(value,state)=>changes.push({value,state})});await wrong.refresh();assert.equal(changes.at(-1).state,'account_changed');assert(!changes.some(row=>row.value));
 let resolve;const late=createFoodLogViewFlow({readLog:()=>new Promise(r=>{resolve=r}),readMember:async()=>({user:{id:1}}),onChange:(value,state)=>changes.push({value,state})});const pending=late.refresh();late.clear();resolve({memberId:1,foodLog:sample});await pending;assert.equal(changes.at(-1).state,'cleared');assert(!changes.some(row=>row.value));
});
test('the view refresh has a deadline and a successful refresh verifies the current account',async()=>{
 const states=[];const flow=createFoodLogViewFlow({timeoutMs:8,readLog:signal=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true})),readMember:async()=>({user:{id:1}}),onChange:(data,state)=>states.push(state)});await flow.refresh();assert.equal(states.at(-1),'timeout');
 const good=createFoodLogViewFlow({readLog:async()=>({memberId:1,foodLog:{status:'available'}}),readMember:async()=>({user:{id:1}}),onChange:(value,state)=>states.push(state)});await good.refresh();assert.equal(states.at(-1),'available');good.clear();
});
test('the served shared runtime is self-contained and carries no food data through browser storage or invalidation messages',()=>{
 new vm.Script(foodLogRuntime);assert.doesNotMatch(foodLogRuntime,/localStorage|sessionStorage|indexedDB/);assert.match(foodLogRuntime,/postMessage\(\{type:'invalidate'\}\)/);assert.match(foodLogRuntime,/panel-today/);assert.match(foodLogRuntime,/panel-journey/);
});
