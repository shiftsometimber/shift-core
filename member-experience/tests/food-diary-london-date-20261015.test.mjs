import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {journeyPortabilityRoutes,validateFoodEntry,validateWeightImport} from '../journey-portability.mjs';

const food=on=>({operationId:'synthetic-london-food-operation',on,food:'Synthetic actual meal',proteinG:0});
const boundaryCases=[
 ['observed BST failure', '2026-10-14T23:46:00.000Z','2026-10-15','2026-10-16'],
 ['before BST local midnight','2026-10-14T22:59:00.000Z','2026-10-14','2026-10-15'],
 ['winter GMT','2026-12-14T23:46:00.000Z','2026-12-14','2026-12-15'],
 ['spring change before local midnight','2026-03-29T22:59:00.000Z','2026-03-29','2026-03-30'],
 ['spring change after local midnight','2026-03-29T23:01:00.000Z','2026-03-30','2026-03-31'],
 ['autumn change before clocks return','2026-10-24T23:30:00.000Z','2026-10-25','2026-10-26'],
 ['autumn change after clocks return','2026-10-25T23:30:00.000Z','2026-10-25','2026-10-26'],
];
for(const [label,instant,today,tomorrow]of boundaryCases)test('food dates follow the London calendar with true future dates rejected: '+label,()=>{
 const now=Date.parse(instant),accepted=validateFoodEntry(food(today),now);
 assert.equal(accepted.on,today);assert.equal(accepted.proteinG,0);assert.equal('waterMl'in accepted,false);
 assert.throws(()=>validateFoodEntry(food(tomorrow),now),/valid date/);
});
test('food dates retain strict Gregorian syntax and real leap-day validation',()=>{
 const now=Date.parse('2028-03-01T12:00:00.000Z');
 for(const on of['2026-02-29','2026-04-31','2026-00-15','2026-13-01','2026-10-1','2026-10-15T00:00:00Z','not-a-date'])assert.throws(()=>validateFoodEntry(food(on),now),/valid date/,on);
 assert.equal(validateFoodEntry(food('2028-02-29'),now).on,'2028-02-29');
});
test('weight import keeps its original UTC ceiling while food accepts the current London date',()=>{
 const now=Date.parse('2026-10-14T23:46:00.000Z');
 assert.equal(validateFoodEntry(food('2026-10-15'),now).on,'2026-10-15');
 assert.deepEqual(validateWeightImport([{on:'2026-10-14',weightKg:93.2}],now),[{on:'2026-10-14',weightKg:93.2}]);
 assert.throws(()=>validateWeightImport([{on:'2026-10-15',weightKg:93.2}],now),/no future dates/);
 assert.throws(()=>validateWeightImport([{on:'2026-02-30',weightKg:93.2}],now),/valid reading/);
});
test('food validation retains its existing bounded data shape and optional amount semantics',()=>{
 const now=Date.parse('2026-10-14T23:46:00.000Z');
 for(const changed of[{...food('2026-10-15'),food:' '},{...food('2026-10-15'),proteinG:'0'},{...food('2026-10-15'),waterMl:-1},{...food('2026-10-15'),kcalTarget:1200}])assert.throws(()=>validateFoodEntry(changed,now));
 assert.deepEqual(validateFoodEntry({...food('2026-10-15'),food:' Synthetic actual meal ',waterMl:0},now),{...food('2026-10-15'),waterMl:0});
});
async function routeFixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_sessions(id TEXT,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER);CREATE TABLE member_state(user_id INTEGER,preferences TEXT);CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,recorded_on TEXT,weight_kg REAL,source TEXT,created_at TEXT,updated_at TEXT);INSERT INTO users VALUES(1,'food-calendar@example.invalid');INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1);INSERT INTO member_state VALUES(1,'{}');");
 const DB={exec:async q=>sql.exec(q),prepare(q){let values=[];return{bind(...args){values=args;return this;},first:async()=>sql.prepare(q).get(...values)||null,all:async()=>({results:sql.prepare(q).all(...values)}),run:async()=>({meta:{changes:Number(sql.prepare(q).run(...values).changes)}})};},async batch(stmts){sql.exec('BEGIN');try{const results=[];for(const stmt of stmts)results.push(await stmt.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
 const token='synthetic-food-calendar-session',hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
 sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run('food-calendar-session',1,hash,'2099-01-01');
 const request=(path,method,body)=>new Request('https://shiftsometimber.co.uk'+path,{method,headers:{Cookie:'sst_session='+token,Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 return{sql,DB,request,MEMBER_EXPERIENCE_V1_ENABLED:'true'};
}
test('the real authenticated SQLite food route saves London today idempotently while rejecting tomorrow and retaining UTC imports',async()=>{
 const env=await routeFixture(),originalNow=Date.now;Date.now=()=>Date.parse('2026-10-14T23:46:00.000Z');
 try{
  const body=food('2026-10-15'),post=()=>env.request('/v1/grub/eaten','POST',body);
  assert.equal((await journeyPortabilityRoutes(post(),env)).status,201);
  assert.equal((await journeyPortabilityRoutes(post(),env)).status,200);
  const response=await journeyPortabilityRoutes(env.request('/v1/grub/eaten','GET'),env);
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  const saved=await response.json();assert.equal(saved.entries.length,1);assert.equal(saved.entries[0].on,'2026-10-15');assert.equal(saved.entries[0].food,'Synthetic actual meal');assert.equal(saved.entries[0].proteinG,0);assert.equal('waterMl'in saved.entries[0],false);
  assert.equal(env.sql.prepare('SELECT COUNT(*) AS count FROM member_food_entries').get().count,1);
  const tomorrow=await journeyPortabilityRoutes(env.request('/v1/grub/eaten','POST',{...body,operationId:'synthetic-next-day-food-operation',on:'2026-10-16'}),env);
  assert.equal(tomorrow.status,400);assert.equal((await tomorrow.json()).error,'invalid_entry');
  assert.equal(env.sql.prepare('SELECT COUNT(*) AS count FROM member_food_entries').get().count,1);
  const futureImport=await journeyPortabilityRoutes(env.request('/v1/progress/import','POST',{rows:[{on:'2026-10-15',weightKg:93.2}]}),env);
  assert.equal(futureImport.status,400);assert.equal((await futureImport.json()).error,'invalid_import');
  const currentImport=await journeyPortabilityRoutes(env.request('/v1/progress/import','POST',{rows:[{on:'2026-10-14',weightKg:93.2}]}),env);
  assert.equal(currentImport.status,201);assert.equal(env.sql.prepare('SELECT recorded_on FROM progress_entries').get().recorded_on,'2026-10-14');
 }finally{Date.now=originalNow;env.sql.close();}
});
