import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {hqIntelligence} from '../../hq-intelligence-signals.mjs';
const at=new Date('2026-11-06T12:00:00.000Z');
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,created_at TEXT);CREATE TABLE assessments(user_id INTEGER,status TEXT);CREATE TABLE member_status(lifecycle_stage TEXT,last_activity_at TEXT,created_at TEXT);CREATE TABLE hq_tasks(status TEXT,due_at TEXT);CREATE TABLE support_tickets(status TEXT,priority TEXT);CREATE TABLE orders(status TEXT);");
 const queries=[],DB={prepare(q){queries.push(q);const run=args=>({first:async()=>sql.prepare(q).get(...args)});return {...run([]),bind(...args){return run(args)}}};
 return {sql,DB,queries,close:()=>sql.close()};
}
test('Native operational counts retain source-specific availability and confirmed zeros',async()=>{
 const f=fixture();try{const r=await hqIntelligence(f.DB,at);assert.equal(r.coverage.status,'available');assert.equal(r.coverage.availableSources,7);assert.ok(r.signals.every(s=>s.status==='available'&&s.count===0));assert.ok(f.queries.every(q=>q.startsWith('SELECT COUNT(*)')));}finally{f.close()}
});
test('One missing assessment source cannot hide support, tasks and other confirmed counts',async()=>{
 const f=fixture();try{
  f.sql.exec("DROP TABLE assessments;INSERT INTO support_tickets VALUES('open','urgent');INSERT INTO hq_tasks VALUES('open','2026-11-05');INSERT INTO users VALUES(1,'2026-11-06T00:00:00Z');");
  const r=await hqIntelligence(f.DB,at),by=Object.fromEntries(r.signals.map(s=>[s.key,s]));
  assert.equal(r.coverage.status,'partial');assert.equal(r.coverage.availableSources,6);assert.equal(by.mot_incomplete.count,null);assert.equal(by.mot_incomplete.status,'unavailable');assert.equal(by.urgent_support.count,1);assert.equal(by.overdue_tasks.count,1);assert.equal(by.new_users.count,1);assert.match(r.brief,/1 operational source is unavailable/);assert.match(r.brief,/2 high-priority/);
 }finally{f.close()}
});
test('All unavailable or invalid native sources keep null counts and cannot report a clear workload or expose query errors',async()=>{
 for(const value of [undefined,{count:'0'},{count:-1},{count:1.5},{count:Number.MAX_SAFE_INTEGER+1}]){
  const DB={prepare(){return {bind(){return this},async first(){return value}}}};
  const r=await hqIntelligence(DB,at);assert.equal(r.coverage.status,'unavailable');assert.ok(r.signals.every(s=>s.count===null));assert.match(r.brief,/unavailable/);assert.doesNotMatch(r.brief,/clear|No alerts/);
 }
 const r=await hqIntelligence({prepare(){throw Error('PRIVATE_SQL_DETAILS')}},at);assert.ok(!JSON.stringify(r).includes('PRIVATE_SQL_DETAILS'));
});
test('Native source recovery restores confirmed counts without schema writes or stale fallback',async()=>{
 const f=fixture();try{
  f.sql.exec('DROP TABLE member_status');assert.equal((await hqIntelligence(f.DB,at)).coverage.status,'partial');
  f.sql.exec("CREATE TABLE member_status(lifecycle_stage TEXT,last_activity_at TEXT,created_at TEXT);INSERT INTO member_status VALUES('active','2026-09-01T00:00:00Z','2026-09-01T00:00:00Z');");
  const r=await hqIntelligence(f.DB,at);assert.equal(r.coverage.status,'available');assert.equal(r.signals.find(s=>s.key==='stale_members').count,1);
 }finally{f.close()}
});
test('Closed, cancelled and completed work is excluded by the retained source queries',async()=>{
 const f=fixture();try{
  f.sql.exec("INSERT INTO users VALUES(1,'2026-01-01'),(2,'2026-11-06');INSERT INTO assessments VALUES(1,'completed');INSERT INTO hq_tasks VALUES('done','2020-01-01'),('cancelled','2020-01-01'),('open',NULL);INSERT INTO support_tickets VALUES('closed','urgent');INSERT INTO orders VALUES('fulfilled'),('cancelled'),('refunded'),('processing');");
  const by=Object.fromEntries((await hqIntelligence(f.DB,at)).signals.map(s=>[s.key,s.count]));assert.equal(by.mot_incomplete,1);assert.equal(by.new_users,1);assert.equal(by.overdue_tasks,0);assert.equal(by.urgent_support,0);assert.equal(by.open_orders,1);
 }finally{f.close()}
});
