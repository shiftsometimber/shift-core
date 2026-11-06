import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {hqV3Route} from '../../hq-v3-api.mjs';

// All records, checkout ids and sessions below are fictional, in-memory only.
class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');this.queries=[];}
 prepare(sql){this.queries.push(sql);const db=this.db;const execute=values=>({async all(){return{results:db.prepare(sql).all(...values)}},async first(){return db.prepare(sql).get(...values)||null}});return {...execute([]),bind(...values){return execute(values)}};}
}
const request=(path='contract',query='')=>new Request('https://fictional.example/v1/hq/management/v3/'+path+query);
const identity=(user={},permissions=['*'])=>async()=>Response.json({user:{id:17,role:'owner',status:'active',mfaEnabled:true,...user},permissions});
const configuration=DB=>({DB,DEPLOYMENT_ENVIRONMENT:'production',HQ_V3_LIVE_READS:'true'});
const query='?period=CUSTOM&start=2026-11-05&end=2026-11-05';
const read=async(DB,path='purchases',suffix=query)=>hqV3Route(request(path,suffix),configuration(DB),{},identity());
function fixture(){
 const DB=new D1();DB.db.exec(`
 CREATE TABLE orders(id INTEGER PRIMARY KEY,order_number TEXT,customer_email TEXT,currency TEXT,total_pence INTEGER,status TEXT,payment_status TEXT,created_at TEXT,notes TEXT);
 CREATE TABLE commerce_order_details(order_id INTEGER,stripe_checkout_session_id TEXT);
 CREATE TABLE commerce_order_items(id INTEGER PRIMARY KEY,order_id INTEGER,sku TEXT,product_name TEXT,quantity INTEGER,unit_price_pence INTEGER);
 CREATE TABLE medicine_orders(id INTEGER PRIMARY KEY,order_number TEXT,user_id INTEGER,email TEXT,medicine_name TEXT,strength_label TEXT,unit_price_pence INTEGER,discount_pence INTEGER,total_pence INTEGER,stripe_checkout_session_id TEXT,created_at TEXT,currency TEXT,status TEXT,clinical_reason_code TEXT);
 CREATE TABLE clinical_member_records(id TEXT PRIMARY KEY,order_number TEXT,user_id INTEGER,assessment_body TEXT);
 INSERT INTO orders VALUES(1,'SST-FICTION-SHOP','buyer@fictional.example','GBP',10000,'paid','paid','2026-11-05T10:00:00Z','PRIVATE notes');
 INSERT INTO commerce_order_details VALUES(1,'cs_live_fictional_shop');
 INSERT INTO commerce_order_items VALUES(1,1,'FICTIONAL-SKU','Fictional shop label',2,5000);
 INSERT INTO medicine_orders VALUES(1,'SST-FICTION-MED',42,'buyer@fictional.example','Fictional medicine','5 mg',12000,1000,11000,'cs_live_fictional_med','2026-11-05T10:00:00Z','GBP','paid','PRIVATE rationale');
 INSERT INTO clinical_member_records VALUES('case-fictional-42','SST-FICTION-MED',42,'PRIVATE assessment'),('case-other-person','SST-FICTION-MED',43,'PRIVATE other member');
 `);return DB;
}
test('Live read requires explicit unmixed deployment scope, active MFA and commercial permission before any source access',async()=>{
 const DB={prepare(){assert.fail('Unauthorised data-source access')}};
 for(const override of [{HQ_V3_LIVE_READS:undefined},{DEPLOYMENT_ENVIRONMENT:'test'},{HQ_V3_TEST_MODE:'true'},{SSTRX_ENVIRONMENT:'synthetic'}])assert.equal((await hqV3Route(request(),{...configuration(DB),...override},{},identity())).status,503);
 for(const suffix of ['?partition=TEST','?partition=LIVE&partition=TEST','?partition=LIVE&partition=LIVE','?partition=live','?partition='])assert.equal((await hqV3Route(request('contract',suffix),configuration(DB),{},identity())).status,403);
 for(const user of [{mfaEnabled:false},{status:'disabled'},{role:'clinical'},{role:'support'},{role:'readonly'}])assert.equal((await hqV3Route(request(),configuration(DB),{},identity(user))).status,403);
 assert.equal((await hqV3Route(request(),configuration(DB),{},identity({},[]))).status,403);
 assert.equal((await hqV3Route(request(),configuration(DB),{},async()=>Response.json({error:'expired'},{status:401}))).status,401);
 const r=await hqV3Route(request('contract','?partition=LIVE'),configuration(DB),{},identity());assert.equal(r.status,200);const data=await r.json();assert.equal(data.partition,'LIVE');assert.equal(data.audience,'ops_meta');assert.equal(data.ai.execution_permitted,false);assert.equal(data.acceptance_status,'NOT RUN');
});
test('Live commercial list and drill use retained mode authority; test and wildcard lookalikes, private bodies and destinations stay out',async()=>{
 const DB=fixture();try{
  for(const [id,ref,email,session] of [[2,'SST-TEST-SESSION','buyer@fictional.example','cs_test_fictional'],[3,'SST-EXAMPLE','member@example.invalid','cs_live_fake'],[4,'TEST-LOOKALIKE','buyer@fictional.example','cs_live_fake2'],[5,'SST-MODE-LOOKALIKE','buyer@fictional.example','csXliveYfake'],[6,'SST-NO-PAYMENT','buyer@fictional.example',null],[7,'SST-EXAMPLE-TEST','member@example.test','cs_live_fake3']]){
   DB.db.prepare("INSERT INTO orders VALUES(?,?,?,'GBP',98765,'paid','paid','2026-11-05T10:00:00Z','PRIVATE')").run(id,ref,email);DB.db.prepare('INSERT INTO commerce_order_details VALUES(?,?)').run(id,session);DB.db.prepare("INSERT INTO commerce_order_items VALUES(?,?,'EXCLUDED','PRIVATE excluded',1,98765)").run(id,id);
   DB.db.prepare("INSERT INTO medicine_orders VALUES(?,?,42,?,'Fictional medicine','5 mg',98765,0,98765,?,'2026-11-05T10:00:00Z','GBP','paid','PRIVATE')").run(id,ref+'-MED',email,session);
  }
  const r=await read(DB);assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');const d=await r.json();assert.equal(d.partition,'LIVE');assert.equal(d.status,'available');assert.deepEqual(d.orders.map(o=>o.order_ref),['SST-FICTION-SHOP','SST-FICTION-MED']);assert.equal(d.orders[1].rx_case_ref,'case-fictional-42');
  for(const value of ['PRIVATE','98765','buyer@','member@','cs_live_','assessment_body','clinical_reason_code','case-other-person'])assert.ok(!JSON.stringify(d).includes(value),value);
  assert.equal(d.captured.value,null);assert.equal(d.cash.value,null);assert.match(d.source_scope.authority,/manual and missing-session orders are excluded/);
  const drill=await(await read(DB,'purchases/SST-FICTION-MED')).json();assert.equal(drill.purchase.refs.case_ref,'case-fictional-42');assert.equal(drill.purchase.clinical_detail_in_hq,false);assert.equal(drill.partition,'LIVE');
  for(const ref of ['TEST-LOOKALIKE','SST-TEST-SESSION','SST-MODE-LOOKALIKE','SST-EXAMPLE-MED'])assert.equal((await read(DB,'purchases/'+ref)).status,404);
  assert.ok(DB.queries.every(sql=>/^\s*(SELECT|PRAGMA)/i.test(sql)),'Projection made a write');
 }finally{DB.db.close()}
});
test('Ambiguous case linkage and broken purchase sources stay explicit instead of inventing a reference or an empty drill',async()=>{
 const DB=fixture();try{
  DB.db.prepare('INSERT INTO clinical_member_records VALUES(?,?,42,?)').run('case-ambiguous','SST-FICTION-MED','PRIVATE');
  const d=await(await read(DB,'purchases/SST-FICTION-MED')).json();assert.equal(d.purchase.refs.status,'unavailable');assert.equal(d.purchase.lines[0].rx_case_ref,null);
  DB.db.exec('DROP TABLE commerce_order_items');const failed=await read(DB,'purchases/SST-MISSING');assert.equal(failed.status,503);assert.equal((await failed.json()).error,'purchase_source_incomplete');
 }finally{DB.db.close()}
});
test('Unmapped live member/support partitions perform no speculative population query; dictionary retains live audience',async()=>{
 const DB={prepare(){assert.fail('Unmapped member/support source must not be queried')}};
 for(const path of ['demographics','support']){const d=await(await read(DB,path)).json();assert.equal(d.partition,'LIVE');assert.equal(d[path].status,'unavailable');assert.equal(d[path].value,null);}
 const dictionary=await(await read(DB,'dictionary')).json();assert.ok(dictionary.metrics.every(m=>m.partition==='LIVE'));
 const learning=await(await read(DB,'learning')).json();assert.equal(learning.learning.status,'unavailable');assert.equal(learning.learning.clinical_bodies_permitted,false);
});
test('Live staff directory reports enrolled MFA separately from professional verification and excludes known test identities',async()=>{
 const DB=new D1();try{
  DB.db.exec("CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT,status TEXT,mfa_enabled INTEGER); INSERT INTO hq_users VALUES(1,'owner@fictional.example','active',1),(2,'staff@fictional.example','active',0),(3,'fiction@example.invalid','active',0),(4,'fiction@example.test','active',0),(5,'old@fictional.example','disabled',0)");
  const d=await(await read(DB,'access')).json();assert.equal(d.partition,'LIVE');assert.equal(d.staff.active,2);assert.equal(d.staff.enrolled,1);assert.equal(d.staff.coverage,.5);assert.equal(d.staff.waive_permitted,false);assert.match(d.staff.source,/not fresh-device/);assert.ok(!JSON.stringify(d).includes('owner@'));
 }finally{DB.db.close()}
});
