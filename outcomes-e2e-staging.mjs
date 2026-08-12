import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {outcomesSnapshot} from './outcomes-v1.js';

class D1Statement{
  constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}
  bind(...params){return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v))}
  async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{last_row_id:Number(r.lastInsertRowid||0),changes:Number(r.changes||0)}}}
  async first(){return this.db.prepare(this.sql).get(...this.params)||null}
  async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}
}
class D1Database{
  constructor(){this.sqlite=new DatabaseSync(':memory:')}
  prepare(sql){return new D1Statement(this.sqlite,sql)}
  async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
  exec(sql){this.sqlite.exec(sql);return Promise.resolve()}
}

const DB=new D1Database();
DB.sqlite.exec(`
CREATE TABLE progress_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,recorded_on TEXT NOT NULL,
  weight_kg REAL,waist_cm REAL,systolic INTEGER,diastolic INTEGER,resting_hr INTEGER,steps INTEGER,
  protein_g REAL,sleep_hours REAL,mood_score INTEGER,notes TEXT,source TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// Schema is additive and owned by the production analytics module.
await DB.prepare(`CREATE TABLE IF NOT EXISTS product_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,event_id TEXT NOT NULL UNIQUE,user_id INTEGER,event_name TEXT NOT NULL,
  surface TEXT,source TEXT,session_id TEXT,properties_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`).run();

const addProgress=async(user,date,weight)=>DB.prepare(`INSERT INTO progress_entries(user_id,recorded_on,weight_kg,source) VALUES(?,?,?,'member')`).bind(user,date,weight).run();
const addEvent=async(user,name)=>DB.prepare(`INSERT INTO product_events(event_id,user_id,event_name,surface,source,properties_json) VALUES(?,?,?,?,?,?)`).bind(`${user}-${name}-${Math.random()}`,user,name,'commissioning','server','{}').run();

// Member one: meaningful engagement and measurable change.
await addProgress(101,'2026-07-01',114.3);await addProgress(101,'2026-08-12',109.8);
for(const name of ['today_viewed','grub_plan_generated','fit_plan_generated','shift_ai_message','progress_logged'])await addEvent(101,name);
for(let i=0;i<8;i++)await addEvent(101,'today_viewed');

// Member two: deliberately different direction and lower engagement to prove cohort separation rather than a single-member vanity number.
await addProgress(202,'2026-07-01',95);await addProgress(202,'2026-08-12',96);
await addEvent(202,'today_viewed');

const result=await outcomesSnapshot(DB,{minEntries:2,limit:100});
assert.equal(result.ok,true);assert.equal(result.internalOnly,true);assert.equal(result.summary.members,2);assert.equal(result.summary.withWeightComparison,2);
const one=result.cohort.find(x=>Number(x.user_id)===101),two=result.cohort.find(x=>Number(x.user_id)===202);
assert.ok(one&&two);assert.equal(one.first_weight_kg,114.3);assert.equal(one.latest_weight_kg,109.8);assert.equal(one.weight_delta_kg,-4.5);assert.ok(one.weight_delta_pct<0);
assert.equal(two.first_weight_kg,95);assert.equal(two.latest_weight_kg,96);assert.equal(two.weight_delta_kg,1);assert.ok(two.weight_delta_pct>0);
assert.ok(one.total_events>two.total_events);assert.notEqual(one.engagement_band,two.engagement_band);
assert.match(result.warning,/Correlation does not establish causation/i);assert.match(result.warning,/not a publishable clinical outcome claim/i);

console.log(JSON.stringify({ok:true,members:result.summary.members,memberOne:{deltaKg:one.weight_delta_kg,deltaPct:one.weight_delta_pct,events:one.total_events,band:one.engagement_band},memberTwo:{deltaKg:two.weight_delta_kg,deltaPct:two.weight_delta_pct,events:two.total_events,band:two.engagement_band},governanceWarning:result.warning},null,2));
console.log('PASS M16 member-one outcomes/cohort architecture: progress + engagement are analysable, cohort-separated and explicitly non-causal/internal-only');
