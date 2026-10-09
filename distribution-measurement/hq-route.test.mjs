import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import hq from '../hq-ai-v2.js';
import legacy from '../hq-ai.js';

function dbFixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 db.exec(`
 CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,created_at TEXT);
 CREATE TABLE user_auth(user_id INTEGER,email_verified INTEGER,email_verified_at TEXT);
 CREATE TABLE audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT,metadata TEXT,created_at TEXT);
 CREATE TABLE member_status(user_id INTEGER,source TEXT,created_at TEXT);
 CREATE TABLE product_events(user_id INTEGER,event_name TEXT,surface TEXT,source TEXT,properties_json TEXT,occurred_at TEXT);
 `);
 return{prepare(sql){let args=[];return{bind(...x){args=x;return this},async all(){return{results:db.prepare(sql).all(...args)}},async first(){return db.prepare(sql).get(...args)}}}};
}

test('HQ distribution API and page require the existing HQ session',async t=>{
 const original=legacy.fetch;t.after(()=>{legacy.fetch=original});
 let reads=0;const DB={prepare(){reads++;return{async all(){return{results:[]}},async first(){return null}}}};
 legacy.fetch=async()=>new Response('{}',{status:401});
 assert.equal((await hq.fetch(new Request('https://test.invalid/v1/hq/distribution'),{DB},{})).status,401);
 assert.equal((await hq.fetch(new Request('https://test.invalid/hq/distribution'),{DB},{})).status,401);
 assert.equal(reads,0);
});

test('HQ distribution returns aggregate evidence and a noindex operator page',async t=>{
 const original=legacy.fetch;t.after(()=>{legacy.fetch=original});
 legacy.fetch=async request=>{assert.equal(new URL(request.url).pathname,'/v1/hq/me');return Response.json({user:{id:1,role:'owner'}})};
 const DB=dbFixture(t);
 const api=await hq.fetch(new Request('https://test.invalid/v1/hq/distribution?days=90'),{DB},{});
 assert.equal(api.status,200);assert.equal(api.headers.get('cache-control'),'no-store');
 const data=await api.json();assert.equal(data.available,true);assert.equal(data.days,90);assert.equal(data.registrations.total,0);assert.equal(data.publicAnalytics.joinedToMembers,false);
 const page=await hq.fetch(new Request('https://test.invalid/hq/distribution'),{DB},{});
 assert.equal(page.status,200);assert.match(page.headers.get('x-robots-tag'),/noindex/);
 const html=await page.text();assert.match(html,/Organic &amp; My Timber distribution/);assert.match(html,/\/v1\/hq\/distribution\?days=/);assert.doesNotMatch(html,/member email|patient-level/i);
});
