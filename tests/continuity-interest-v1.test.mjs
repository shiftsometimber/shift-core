import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {continuityInterestRoutes} from '../continuity-interest-v1.js';

function DB(t){
  const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
  return{sqlite,async exec(sql){sqlite.exec(sql)},prepare(sql){let args=[];return{
    bind(...values){args=values;return this},
    async first(){return sqlite.prepare(sql).get(...args)||null},
    async all(){return{results:sqlite.prepare(sql).all(...args)}},
    async run(){const result=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}}}
  }},async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}}};
}
const request=body=>new Request('https://api.shiftsometimber.co.uk/v1/continuity-interest',{method:'POST',headers:{'content-type':'application/json','CF-Connecting-IP':'192.0.2.5'},body:JSON.stringify(body)});

test('captures an explicitly consented OOS continuity interest without promising treatment',async t=>{
  const db=DB(t),response=await continuityInterestRoutes(request({email:'MATT@example.com',first_name:'Matt',intent:'disrupted',source:'start-here',consent:true}),{DB:db});
  assert.equal(response.status,201);const body=await response.json();assert.equal(body.status,'registered');assert.match(body.message,/No purchase, stock or treatment eligibility is promised/);
  assert.deepEqual(Object.keys(body).sort(),['message','ok','status']);
  const row=db.sqlite.prepare('SELECT * FROM continuity_interest WHERE email=?').get('matt@example.com');
  assert.equal(row.intent,'disrupted');assert.equal(row.source,'start-here');assert.equal(row.consent_version,'continuity-interest-v1');assert.equal(row.active,1);assert.equal(row.withdrawn_at,null);assert.ok(Number.isFinite(Date.parse(row.consented_at)));
  const deliveries=db.sqlite.prepare('SELECT email_hash,event_type,status FROM auth_delivery_events').all();
  assert.equal(deliveries.length,4);assert.equal(new Set(deliveries.map(row=>row.email_hash)).size,4);
  for(const delivery of deliveries){assert.equal(delivery.event_type,'interest_notify');assert.equal(delivery.status,'binding_missing');assert.match(delivery.email_hash,/^[a-f0-9]{64}$/)}
});
test('rejects absent consent and malformed email',async t=>{const db=DB(t);assert.equal((await continuityInterestRoutes(request({email:'bad',consent:true}),{DB:db})).status,400);assert.equal((await continuityInterestRoutes(request({email:'matt@example.com',consent:false}),{DB:db})).status,400);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM continuity_interest').get().n,0)});
test('rate limits public capture',async t=>{const db=DB(t);for(let i=0;i<8;i++)assert.equal((await continuityInterestRoutes(request({email:'bad',consent:true}),{DB:db})).status,400);assert.equal((await continuityInterestRoutes(request({email:'matt@example.com',consent:true}),{DB:db})).status,429);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM continuity_interest').get().n,0)});
test('hands preflight back to the Worker CORS boundary',async t=>{const db=DB(t),result=await continuityInterestRoutes(new Request('https://api.shiftsometimber.co.uk/v1/continuity-interest',{method:'OPTIONS'}),{DB:db});assert.equal(result,null);assert.equal(db.sqlite.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'").get().n,0)});
