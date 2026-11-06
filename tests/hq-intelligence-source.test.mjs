import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {intelligenceSnapshot} from '../worker.js';

class D1 {
  constructor(){this.db=new DatabaseSync(':memory:');this.queries=[];}
  prepare(sql){
    this.queries.push(sql);const db=this.db;
    const bound=values=>({async first(){return db.prepare(sql).get(...values)||null;}});
    return {...bound([]),bind(...values){return bound(values);}};
  }
}
function fixture(){
  const DB=new D1(),today=new Date().toISOString(),old=new Date(Date.now()-90*86400000).toISOString();
  DB.db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,created_at TEXT);
    CREATE TABLE member_status(lifecycle_stage TEXT,last_activity_at TEXT,created_at TEXT);
    CREATE TABLE hq_tasks(status TEXT,due_at TEXT);
    CREATE TABLE support_tickets(status TEXT,priority TEXT);
    CREATE TABLE orders(status TEXT);`);
  DB.db.prepare('INSERT INTO users VALUES(?,?)').run(1,today);DB.db.prepare('INSERT INTO users VALUES(?,?)').run(2,old);
  DB.db.prepare("INSERT INTO member_status VALUES('active',?,?)").run(old,old);
  DB.db.exec("INSERT INTO hq_tasks VALUES('open','2000-01-01');INSERT INTO support_tickets VALUES('open','urgent');INSERT INTO orders VALUES('processing');");
  return DB;
}
const signal=(data,key)=>data.signals.find(x=>x.key===key);

test('Missing authoritative MOT source remains unavailable while the six genuine source counts remain visible',async()=>{
  const DB=fixture();try{
    // Clinical intake is a different source and cannot stand in for Shift MOT.
    DB.db.exec("CREATE TABLE clinical_assessments(user_id INTEGER,status TEXT);INSERT INTO clinical_assessments VALUES(1,'completed'),(2,'completed');");
    const data=await intelligenceSnapshot(DB),mot=signal(data,'mot_incomplete');
    assert.equal(mot.count,null);assert.equal(mot.status,'unavailable');assert.equal(mot.severity,'unknown');
    assert.match(mot.reason,/authoritative Shift MOT assessments source/);assert.match(mot.owner,/MOT source owner/);
    assert.deepEqual(data.unavailableSources.map(x=>x.source),['assessments']);assert.match(data.brief,/MOT completion is unavailable/);
    for(const key of ['new_users','stale_members','overdue_tasks','open_support','urgent_support','open_orders'])assert.equal(signal(data,key).count,1,key);
    assert.equal(DB.db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='assessments'").get().n,0);
    assert.ok(DB.queries.every(sql=>/^SELECT\b/.test(sql)),'Intelligence wrote or created a source');
    assert.ok(!DB.queries.some(sql=>/FROM clinical_assessments/.test(sql)),'Clinical intake was relabelled as MOT');
  }finally{DB.db.close();}
});

test('Present authoritative MOT source retains the existing incomplete-member definition',async()=>{
  const DB=fixture();try{
    DB.db.exec("CREATE TABLE assessments(user_id INTEGER,status TEXT);INSERT INTO assessments VALUES(1,'completed'),(2,'draft');");
    const data=await intelligenceSnapshot(DB),mot=signal(data,'mot_incomplete');
    assert.equal(mot.count,1);assert.equal(mot.status,'available');assert.equal(mot.severity,'medium');assert.deepEqual(data.unavailableSources,[]);
    assert.doesNotMatch(data.brief,/unavailable/);
  }finally{DB.db.close();}
});

test('Broken present MOT schema remains an error rather than an unavailable or zero result',async()=>{
  const DB=fixture();try{
    DB.db.exec('CREATE TABLE assessments(user_id INTEGER)');
    await assert.rejects(intelligenceSnapshot(DB),/no such column: a.status/);
  }finally{DB.db.close();}
});

test('Failure of another genuine Intelligence source is not hidden by the missing MOT source',async()=>{
  const DB=fixture();try{
    DB.db.exec('DROP TABLE support_tickets');
    await assert.rejects(intelligenceSnapshot(DB),/no such table: support_tickets/);
  }finally{DB.db.close();}
});
