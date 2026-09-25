import test from 'node:test';
import assert from 'node:assert/strict';
import {memberExperienceRoutes,memberExperienceEntry} from '../entry.mjs';
import {memberNavigation} from '../chrome.mjs';
import {fixture} from '../../health-passport/fixture.mjs';
import {commerceStripeRoutes} from '../../commerce-stripe-v1.js';
import {createHash} from 'node:crypto';

const origin='https://shiftsometimber.co.uk';
const enabled={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const get=(path,method='GET')=>memberExperienceRoutes(new Request(origin+path,{method}),enabled);

test('My Orders is linked from the current member chrome and serves a private deep link',async()=>{
 assert.match(memberNavigation(),/href="\/member\/orders">My Orders/);
 for(const path of ['/member/orders','/member/orders.html']){
  const response=get(path),html=await response.text();
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.match(response.headers.get('Vary'),/Cookie/);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
  assert.match(html,/data-member-page="orders"/);assert.match(html,/id="memberSessionStatus"/);
  assert.match(html,/\/assets\/member-experience\/orders\.mjs/);
  assert.doesNotMatch(html,/sample order|fictional order|stock_on_hand/i);
  assert.equal((await get(path,'HEAD').text()),'');
 }
 const dashboard=await memberExperienceEntry(new Request(origin+'/member/dashboard'),enabled,new Response('<html><head></head><body><main></main></body></html>',{headers:{'Content-Type':'text/html'}}));
 assert.match(await dashboard.text(),/href="\/member\/orders">My Orders/);
 assert.equal(memberExperienceRoutes(new Request(origin+'/member/orders',{method:'POST'}),enabled),null);
 assert.equal(memberExperienceRoutes(new Request(origin+'/member/orders'),{}),null);
});

test('Orders runtime uses the existing member API and safe DOM rendering',async()=>{
 for(const path of ['/assets/member-experience/orders.mjs','/assets/member-experience/orders.css']){
  const r=get(path);assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);
  assert.equal(await get(path,'HEAD').text(),'');
 }
 const script=await get('/assets/member-experience/orders.mjs').text();
 new Function(script);
 assert.match(script,/fetch\('\/v1\/commerce\/orders'/);
 assert.match(script,/credentials:'include'/);
 assert.match(script,/retry\.addEventListener/);
 assert.match(script,/You have no SHIFT shop orders yet/);
 assert.match(script,/response\.status===401/);
 assert.match(script,/textContent=/);
 assert.doesNotMatch(script,/innerHTML|localStorage|sessionStorage|method:'POST'|stock_on_hand/);
});

test('two fictional signed-in members see only their own shop history; empty, revoked and anonymous sessions stay private',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());
 f.db.exec(`CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);
 CREATE TABLE products(id INTEGER PRIMARY KEY,name TEXT,sku TEXT);
 CREATE TABLE orders(id INTEGER PRIMARY KEY,user_id INTEGER,customer_email TEXT,order_number TEXT,quantity INTEGER,subtotal_pence INTEGER,total_pence INTEGER,currency TEXT,status TEXT,payment_status TEXT,notes TEXT,created_at TEXT,updated_at TEXT,product_id INTEGER);
 CREATE TABLE commerce_order_details(order_id INTEGER PRIMARY KEY,size TEXT,delivery_pence INTEGER,shipping_name TEXT,shipping_address_json TEXT,stripe_payment_intent_id TEXT);
 CREATE TABLE commerce_order_items(id INTEGER PRIMARY KEY,order_id INTEGER,sku TEXT,product_name TEXT,colour TEXT,size TEXT,quantity INTEGER,unit_price_pence INTEGER);
 INSERT INTO products VALUES(1,'Fictional shirt','FICTIONAL-TEE');
 INSERT INTO orders VALUES(1,1,'fictional-1@example.invalid','TEST-ONE',1,1000,1299,'gbp','paid','paid','{}','2026-09-25','2026-09-25',1);
 INSERT INTO orders VALUES(2,2,'fictional-2@example.invalid','TEST-TWO',1,1000,1299,'gbp','dispatched','paid','{}','2026-09-25','2026-09-25',1);
 INSERT INTO commerce_order_items(order_id,sku,product_name,colour,size,quantity,unit_price_pence) VALUES(1,'FICTIONAL-TEE','Fictional shirt','Black','L',1,1000),(2,'FICTIONAL-TEE','Fictional shirt','Cream','M',1,1000);`);
 f.db.prepare('INSERT INTO users(id,email,first_name) VALUES(3,?,?)').run('fictional-3@example.invalid','Empty');
 f.db.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(3,?,?)').run(createHash('sha256').update('test-only-member-3').digest('hex'),'2099-01-01T00:00:00Z');
 const read=async id=>{const headers=id?{Cookie:'sst_session=test-only-member-'+id}:{};const r=await commerceStripeRoutes(new Request(origin+'/v1/commerce/orders',{headers}),f.env,{});return {status:r.status,body:await r.json()}};
 const one=await read(1),two=await read(2);
 assert.equal(one.status,200);assert.equal(two.status,200);
 assert.deepEqual(one.body.orders.map(x=>x.order_number),['TEST-ONE']);
 assert.deepEqual(two.body.orders.map(x=>x.order_number),['TEST-TWO']);
 assert(!JSON.stringify(one.body).includes('TEST-TWO'));
 assert(!JSON.stringify(two.body).includes('TEST-ONE'));
 assert.deepEqual((await read(3)).body.orders,[]);
 assert.equal((await read(0)).status,401);
 f.db.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=1').run(new Date().toISOString());
 assert.equal((await read(1)).status,401);
 assert.deepEqual(f.db.prepare('SELECT id,user_id,order_number,status FROM orders ORDER BY id').all().map(x=>({...x})),[
  {id:1,user_id:1,order_number:'TEST-ONE',status:'paid'},
  {id:2,user_id:2,order_number:'TEST-TWO',status:'dispatched'}
 ]);
});
