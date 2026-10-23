import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {continuityInterestRoutes} from '../continuity-interest-v1.js';

function database(t){
 const s=new DatabaseSync(':memory:');t.after(()=>s.close());
 return {sqlite:s,async exec(sql){s.exec(sql)},prepare(sql){let args=[];return {
  bind(...v){args=v;return this},
  async first(){return s.prepare(sql).get(...args)||null},
  async all(){return {results:s.prepare(sql).all(...args)}},
  async run(){const v=s.prepare(sql).run(...args);return {success:true,meta:{changes:Number(v.changes),last_row_id:Number(v.lastInsertRowid)}}}
 }}};
}
function setup(t,{event='General question',mail='success',security=true}={}){
 const DB=database(t),delivered=[];
 const prev=globalThis.fetch;
 globalThis.fetch=async(url)=> {
  assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  return new Response(JSON.stringify({success:security,action:'contact_enquiry',hostname:'shiftsometimber.co.uk'}),{status:200,headers:{'content-type':'application/json'}});
 };
 t.after(()=>{globalThis.fetch=prev});
 const EMAIL={async send(data){delivered.push(data);if(mail==='fail')throw Object.assign(new Error('synthetic provider failure'),{code:'TEST_FAILURE'});return {id:'synthetic-accepted-only'}}};
 const env={DB,EMAIL,TURNSTILE_SECRET_KEY:'fictional-secret',TURNSTILE_SITE_KEY:'fictional-site-key'};
 const request=()=>new Request('https://shiftsometimber.co.uk/v1/contact',{method:'POST',headers:{'content-type':'application/json','Origin':'https://shiftsometimber.co.uk','CF-Connecting-IP':'192.0.2.44'},body:JSON.stringify({name:'Synthetic Test',email:'tester@example.invalid',type:event,message:'TEST_ONLY_NOT_A_REAL_ENQUIRY',consent:true,turnstileToken:'synthetic-token'})});
 return{DB,delivered,env,request};
}
test('contact form accepts fictional general enquiry only after Turnstile and records provider-accepted delivery to hello', {concurrency:false},async t=>{
 const a=setup(t),r=await continuityInterestRoutes(a.request(),a.env),body=await r.json();
 assert.equal(r.status,201);assert.equal(body.status,'sent');assert.equal(a.delivered.length,1);
 assert.equal(a.delivered[0].to,'hello@shiftsometimber.co.uk');
 assert.match(a.delivered[0].subject,/SHIFT enquiry/);
 const rows=a.DB.sqlite.prepare('SELECT event_type,status,COUNT(*) n FROM auth_delivery_events GROUP BY event_type,status').all();
 assert.equal(rows.length,1);assert.equal(rows[0].status,'sent');assert.equal(rows[0].event_type,'general');
 assert.equal(rows[0].n,1);
});
test('partnership enquiry routes only to partner mailbox; no automatic Matt copy',{concurrency:false},async t=>{
 const a=setup(t,{event:'Partnership'}),r=await continuityInterestRoutes(a.request(),a.env);
 assert.equal(r.status,201);assert.deepEqual(a.delivered.map(x=>x.to),['partners@shiftsometimber.co.uk']);
});
test('provider rejection fails closed; no successful enquiry assertion',{concurrency:false},async t=>{
 const a=setup(t,{mail:'fail'}),r=await continuityInterestRoutes(a.request(),a.env),body=await r.json();
 assert.equal(r.status,503);assert.equal(body.error,'delivery_failed');
 const rows=a.DB.sqlite.prepare('SELECT status,COUNT(*) n FROM auth_delivery_events GROUP BY status').all();
 assert.equal(rows[0].status,'failed');assert.equal(rows[0].n,1);
});
test('missing mail binding fails closed rather than falsely claiming receipt',{concurrency:false},async t=>{
 const a=setup(t);delete a.env.EMAIL;
 const r=await continuityInterestRoutes(a.request(),a.env);
 assert.equal(r.status,503);assert.equal((await r.json()).error,'delivery_failed');
 const row=a.DB.sqlite.prepare('SELECT status FROM auth_delivery_events').get();assert.equal(row.status,'binding_missing');
});
test('Turnstile rejection prevents delivery',{concurrency:false},async t=>{
 const a=setup(t,{security:false}),r=await continuityInterestRoutes(a.request(),a.env);
 assert.equal(r.status,403);assert.equal(a.delivered.length,0);
 const table=a.DB.sqlite.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='auth_delivery_events'").get();
 assert.equal(table.n,0);
});
