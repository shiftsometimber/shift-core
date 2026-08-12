import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readRadarFreshness} from './radar-freshness-v2.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';

class D1Statement {
  constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params;}
  bind(...params){return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v));}
  async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{last_row_id:Number(r.lastInsertRowid||0),changes:Number(r.changes||0)}};}
  async first(){return this.db.prepare(this.sql).get(...this.params)||null;}
  async all(){return{results:this.db.prepare(this.sql).all(...this.params)};}
}
class D1Database {
  constructor(){this.sqlite=new DatabaseSync(':memory:');}
  prepare(sql){return new D1Statement(this.sqlite,sql);}
  async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}

const DB=new D1Database();
const before=await readRadarFreshness(DB);
assert.equal(before.status,'AMBER');
assert.equal(before.current,false);
assert.equal(before.ages.scan,null);
assert.ok(before.reasons.some(x=>x.code==='scan_stale'));

const result=await runRadarScheduledScan({DB});
assert.equal(result.freshnessDue,0);
assert.ok(result.scanRecordedAt);

const heartbeat=await DB.prepare(`SELECT event_id,action,actor,detail_json,created_at FROM radar_audit WHERE action='scan' ORDER BY id DESC LIMIT 1`).first();
assert.ok(heartbeat);
assert.equal(heartbeat.event_id,null);
assert.equal(heartbeat.action,'scan');
assert.equal(heartbeat.actor,'scheduler');
const detail=JSON.parse(heartbeat.detail_json);
assert.equal(detail.kind,'scheduled_freshness_scan');
assert.equal(detail.freshness_due,0);
assert.ok(detail.started_at&&detail.completed_at);

const after=await readRadarFreshness(DB);
assert.equal(after.status,'GREEN');
assert.equal(after.current,true);
assert.notEqual(after.ages.scan,null);
assert.ok(after.ages.scan<=after.sloHours.scanHours);
assert.equal(after.reasons.length,0);

console.log(JSON.stringify({before:{status:before.status,current:before.current,scanAge:before.ages.scan},heartbeat:{actor:heartbeat.actor,created_at:heartbeat.created_at,detail},after:{status:after.status,current:after.current,scanAge:after.ages.scan,sloHours:after.sloHours.scanHours}},null,2));
console.log('PASS M03 scheduled Radar scan records a no-change heartbeat and satisfies the unchanged production freshness SLO contract');
