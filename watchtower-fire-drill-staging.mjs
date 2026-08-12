import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {watchtowerSnapshot} from './watchtower-v1.js';

class D1Statement{constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}bind(...p){return new D1Statement(this.db,this.sql,p.map(v=>v===undefined?null:v))}async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{changes:Number(r.changes||0),last_row_id:Number(r.lastInsertRowid||0)}}}async first(){return this.db.prepare(this.sql).get(...this.params)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}}
class D1Database{constructor(){this.sqlite=new DatabaseSync(':memory:')}prepare(sql){return new D1Statement(this.sqlite,sql)}async exec(sql){this.sqlite.exec(sql);return{success:true}}}

const DB=new D1Database();
await DB.exec(`
CREATE TABLE radar_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,action TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO radar_audit(action,created_at) VALUES('scan',CURRENT_TIMESTAMP);
CREATE TABLE users(id INTEGER PRIMARY KEY);
CREATE TABLE shift_plans(id INTEGER PRIMARY KEY,user_id INTEGER,plan_type TEXT,status TEXT,plan_json TEXT);
CREATE TABLE shift_ai_conversations(id INTEGER PRIMARY KEY,created_at TEXT);
CREATE TABLE product_feedback(id INTEGER PRIMARY KEY,updated_at TEXT);
CREATE TABLE shift_knowledge_nodes(id INTEGER PRIMARY KEY,label TEXT,status TEXT,updated_at TEXT);
`);
const env={DB,AI:{},EMAIL:{}};
let mode='green';
const realFetch=globalThis.fetch;
globalThis.fetch=async(input)=>{
 const url=String(input instanceof Request?input.url:input);
 const service=url.includes('/health')?'core':url.includes('/v1/radar/ticker')?'radar':'public';
 if(mode==='red'&&service==='core')return new Response('down',{status:503});
 if(mode==='amber'&&service==='core')await new Promise(r=>setTimeout(r,850));
 return new Response(service==='radar'?JSON.stringify({ok:true,items:[]}):'ok',{status:200,headers:{'content-type':service==='radar'?'application/json':'text/plain'}});
};
try{
 const baseline=await watchtowerSnapshot(env);
 assert.equal(baseline.status,'GREEN','baseline must be GREEN');
 assert.equal(baseline.summary.red,0);assert.equal(baseline.summary.amber,0);
 mode='amber';
 const degraded=await watchtowerSnapshot(env);
 assert.equal(degraded.status,'AMBER','slow core must produce AMBER');
 const latency=degraded.attention.find(x=>x.code==='core_latency');
 assert.ok(latency,'core latency alert required');
 assert.ok(latency.nextAction,'operator next action required on AMBER');
 mode='red';
 const outage=await watchtowerSnapshot(env);
 assert.equal(outage.status,'RED','core outage must produce RED');
 const failure=outage.attention.find(x=>x.code==='core_failure_rate');
 assert.ok(failure,'core failure-rate alert required');
 assert.ok(failure.nextAction,'operator next action required on RED');
 mode='green';
 const restoredButRemembered=await watchtowerSnapshot(env);
 const rows=await DB.prepare(`SELECT service,ok,status,error,checked_at FROM watchtower_probe_history WHERE service='core' ORDER BY id`).all();
 assert.ok(rows.results.length>=4,'probe history must retain baseline/degraded/outage/recovery samples');
 assert.ok(rows.results.some(x=>Number(x.ok)===0&&Number(x.status)===503),'outage sample must be retained');
 assert.ok(Number(rows.results.at(-1)?.ok)===1,'latest recovered sample must be healthy');
 assert.ok(['GREEN','AMBER','RED'].includes(restoredButRemembered.status));
 await DB.prepare(`UPDATE watchtower_probe_history SET checked_at=datetime('now','-25 hours')`).run();
 const recovered=await watchtowerSnapshot(env);
 assert.equal(recovered.status,'GREEN','Watchtower must return GREEN after current recovery and incident-window expiry');
 assert.equal(recovered.platform.probes.every(x=>x.ok),true,'all current probes must be healthy after recovery');
 console.log(JSON.stringify({baseline:{status:baseline.status},degraded:{status:degraded.status,alert:latency.code,nextAction:latency.nextAction},outage:{status:outage.status,alert:failure.code,nextAction:failure.nextAction},retainedHistory:{coreSamples:rows.results.length,failedSamples:rows.results.filter(x=>!Number(x.ok)).length,latestHealthy:!!Number(rows.results.at(-1)?.ok)},recovery:{status:recovered.status,currentHealthy:recovered.platform.probes.every(x=>x.ok)}},null,2));
 console.log('PASS B07 Watchtower fire drill: GREEN -> latency AMBER -> outage RED -> retained probe history/operator next-action -> healthy recovery -> GREEN after incident window.');
}finally{globalThis.fetch=realFetch;}
