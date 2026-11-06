import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {hqV3Route} from '../../hq-v3-api.mjs';
class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');}
 prepare(sql){const db=this.db;return {bind(...values){return{async all(){return{results:db.prepare(sql).all(...values)}},async first(){return db.prepare(sql).get(...values)||null}}},async all(){return{results:db.prepare(sql).all()}},async first(){return db.prepare(sql).get()||null}};}
}
const authenticated=role=>async()=>new Response(JSON.stringify({user:{id:1,role},permissions:['*']}));
const request=(suffix='contract',query='')=>new Request('https://test.invalid/v1/hq/management/v3/'+suffix+query);
test('No v3 projection can query production, a non-TEST partition or a non-owner session',async()=>{
 const DB={prepare(){throw Error('No production/schema/row access is permitted in this test.');}};
 for(const env of [{DB},{DB,HQ_V3_TEST_MODE:'true'},{DB,HQ_V3_TEST_MODE:'true',DEPLOYMENT_ENVIRONMENT:'production'}])assert.equal((await hqV3Route(request(),env,{},authenticated('owner'))).status,503);
 const env={DB,HQ_V3_TEST_MODE:'true',DEPLOYMENT_ENVIRONMENT:'test'};
 assert.equal((await hqV3Route(request('contract','?partition=LIVE'),env,{},authenticated('owner'))).status,403);
 for(const role of ['operations','support','content','readonly','clinical'])assert.equal((await hqV3Route(request(),env,{},authenticated(role))).status,403);
 assert.equal((await hqV3Route(new Request(request(),{method:'POST'}),env,{},authenticated('owner'))).status,405);
});
test('Purchase projection reads existing commercial lines and excludes live/lookalike records and clinical bodies',async()=>{
 const DB=new D1();DB.db.exec(`CREATE TABLE orders(id INTEGER PRIMARY KEY,order_number TEXT,customer_email TEXT,currency TEXT,total_pence INTEGER,status TEXT,payment_status TEXT,created_at TEXT,notes TEXT);
 CREATE TABLE commerce_order_details(order_id INTEGER,stripe_checkout_session_id TEXT);
 CREATE TABLE commerce_order_items(id INTEGER PRIMARY KEY,order_id INTEGER,sku TEXT,product_name TEXT,quantity INTEGER,unit_price_pence INTEGER);
 CREATE TABLE medicine_orders(id INTEGER PRIMARY KEY,order_number TEXT,email TEXT,medicine_name TEXT,strength_label TEXT,unit_price_pence INTEGER,discount_pence INTEGER,total_pence INTEGER,stripe_checkout_session_id TEXT,created_at TEXT,currency TEXT,status TEXT,clinical_reason_code TEXT);
 INSERT INTO orders VALUES(1,'TEST-ORD-1842','fiction@example.invalid','GBP',12000,'processing','paid','2026-11-05T10:00:00Z','PRIVATE CLINICAL BODY'),(2,'LIVE-1843','real@example.invalid','GBP',99999,'paid','paid','2026-11-05T10:00:00Z','PRIVATE'),(3,'TEST-LOOKALIKE','fiction@example.invalid','GBP',88888,'paid','paid','2026-11-05T10:00:00Z','PRIVATE'),(4,'TEST-REAL-ADDRESS','real@deliverable.test','GBP',77777,'paid','paid','2026-11-05T10:00:00Z','PRIVATE');
 INSERT INTO commerce_order_details VALUES(1,'cs_test_one'),(2,'cs_live_two'),(3,'cs_live_three'),(4,'cs_test_four');
 INSERT INTO commerce_order_items VALUES(1,1,'TEST-SKU','TEST shop item',2,6000),(2,2,'LIVE-SKU','Excluded',1,99999),(3,3,'BAD-SKU','Excluded',1,88888),(4,4,'BAD-SKU','Excluded',1,77777);
 INSERT INTO medicine_orders VALUES(1,'TEST-MED-1842','fiction@example.invalid','TEST medicine','2.5 mg',12000,1000,11000,'cs_test_med','2026-11-05T10:00:00Z','GBP','paid','PRIVATE PRESCRIBING RATIONALE');`);
 const env={DB,HQ_V3_TEST_MODE:'true',DEPLOYMENT_ENVIRONMENT:'test'};
 const response=await hqV3Route(request('purchases','?period=CUSTOM&start=2026-11-05&end=2026-11-05'),env,{},authenticated('owner'));assert.equal(response.status,200);const result=await response.json();
 assert.deepEqual(result.orders.map(x=>x.order_ref),['TEST-ORD-1842','TEST-MED-1842']);assert.equal(result.orders[0].sku,'TEST-SKU');assert.equal(result.orders[1].strength_as_sold,'2.5 mg');assert.equal(result.captured.value,null);assert.equal(result.cash.status,'unavailable');assert.equal(result.orders[1].rx_case_ref,null);
 const text=JSON.stringify(result);for(const privateValue of ['PRIVATE','fiction@example.invalid','deliverable.test','99999','88888','77777','clinical_reason_code'])assert.ok(!text.includes(privateValue),privateValue);
 DB.db.close();
});
test('Source map can establish fields without pretending coverage or receipts were tested',async()=>{
 const DB=new D1();DB.db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,date_of_birth TEXT,postcode TEXT)');
 const response=await hqV3Route(request('sources'),{DB,HQ_V3_TEST_MODE:'true',DEPLOYMENT_ENVIRONMENT:'test'},{},authenticated('owner'));const result=await response.json();assert.equal(result.sources.members.status,'mapped');assert.equal(result.sources.medicine_orders.status,'unavailable');assert.equal(result.coverage_status,'NOT RUN');DB.db.close();
});
