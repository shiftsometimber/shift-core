import test from 'node:test';
import assert from 'node:assert/strict';
import {fulfilmentRoute} from './fulfilment-api.mjs';
import {fulfilmentFixture} from './fulfilment-fixture.mjs';
import {csvText,defaultColumns,validateConfig,sha256,testRecipient} from './fulfilment-model.mjs';
const root='/v1/hq/testing/fulfilment';
const req=(path='',method='GET',body,origin='https://hq.shiftsometimber.co.uk')=>new Request('https://api.shiftsometimber.co.uk'+root+path,{method,headers:{Origin:origin,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
async function call(f,path='',method='GET',body,origin){const response=await fulfilmentRoute(req(path,method,body,origin),f.env);return {response,status:response.status,body:response.headers.get('Content-Type')?.includes('json')?await response.json():await response.text()};}
const prepare=(f,ids=[1],key=crypto.randomUUID(),configRevision=1)=>call(f,'/batches','POST',{orderIds:ids,requestKey:key,configRevision});

test('fulfilment requires an operations role, authenticated origin and explicit supported methods',async()=>{
 const f=fulfilmentFixture();f.env.CORE.fetch=async()=>Response.json({error:'unauthorised'},{status:401});assert.equal((await call(f)).status,401);
 f.env.CORE.fetch=async()=>Response.json({user:{role:'readonly'},permissions:['commerce_read']});assert.equal((await call(f)).status,403);
 assert.equal((await call(f,'/batches/test','POST',{},'https://other.example')).status,403);
 assert.equal((await call(f,'/batches/test','POST',{},'')).status,403);
 assert.equal((await call(f,'','DELETE')).status,405);
});
test('CSV setup validates required fields, recipient and format, saves with revision and audit, and never sends',async()=>{
 const f=fulfilmentFixture();let body=f.configBody();body.columns=body.columns.slice(1);assert.equal((await call(f,'/config','PATCH',body)).status,400);
 body=f.configBody();body.destination='bad@example.invalid\r\nBcc: steal@example.invalid';assert.equal((await call(f,'/config','PATCH',body)).status,400);
 const result=await call(f,'/config','PATCH',f.configBody());assert.equal(result.status,200);assert.equal(result.body.config.revision,2);
 assert.equal((await call(f,'/config','PATCH',f.configBody())).status,409);
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM testing_fulfilment_events WHERE event='config_saved'").get().n,1);assert.equal(f.mailCalls(),0);
});
test('queue uses paid canonical orders and holds unverified payments, absent codes, refunds and future products',async()=>{
 const f=fulfilmentFixture();let result=await call(f,'/queue');assert.equal(result.body.orders.length,2);assert(result.body.orders.every(o=>!o.ready));assert.equal(result.body.setupReady,false);
 f.ready();result=await call(f,'/queue');assert(result.body.orders.every(o=>o.ready));assert.equal(result.body.orders[0].lines.length,2);
 f.order(4,{session:'cs_test_fixture'});f.order(5,{sku:'SST-NF-PSA-LAB'});f.order(6,{status:'cancelled'});f.order(7);f.db.exec('INSERT INTO commerce_refunds VALUES(1,7,100)');
 result=await call(f,'/queue');for(const id of [4,5,6,7])assert.equal(result.body.orders.find(o=>o.id===id).ready,false);
 assert(!result.body.orders.some(o=>o.id===3));
});
test('synthetic batches are separate from real orders and force the verified Gmail test destination',async()=>{
 const f=fulfilmentFixture(),key=crypto.randomUUID();const result=await call(f,'/batches/test','POST',{requestKey:key,configRevision:1,to:'wrong@example.invalid'});
 assert.equal(result.status,201);const b=result.body.batch;assert.equal(b.mode,'test');
 const detail=await call(f,'/batches/'+b.id);assert.deepEqual(detail.body.email.to,[testRecipient]);assert.deepEqual(detail.body.email.cc,[]);assert.match(detail.body.email.subject,/TEST ONLY/);assert.match(detail.body.email.body,/synthetic data only/);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM orders').get().n,3);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM testing_fulfilment_items').get().n,0);assert.equal(f.mailCalls(),0);
 assert.equal((await call(f,'/batches/'+b.id+'/send','POST',{})).status,404);
});
test('real exports stay blocked until setup, supplier codes and current delivery details are valid',async()=>{
 const f=fulfilmentFixture();assert.equal((await prepare(f)).status,409);f.ready();f.db.exec("UPDATE testing_products SET supplier_sku=NULL WHERE id='vitamin-d'");assert.equal((await prepare(f)).status,409);
 f.ready();f.db.exec("UPDATE commerce_order_details SET shipping_address_json='{}' WHERE order_id=1");assert.equal((await prepare(f)).status,409);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM testing_fulfilment_batches').get().n,0);
});
test('whole-order batches snapshot every testing line, quote CSV correctly and replay idempotently',async()=>{
 const f=fulfilmentFixture();f.ready();const key=crypto.randomUUID(),a=await prepare(f,[1,2],key);assert.equal(a.status,201);assert.equal(a.body.batch.row_count,3);assert.equal(a.body.batch.order_count,2);
 const b=await prepare(f,[1,2],key);assert.equal(b.status,200);assert.equal(b.body.replayed,true);assert.equal(a.body.batch.id,b.body.batch.id);
 assert.equal((await prepare(f,[1],key)).status,409);assert.equal((await prepare(f,[1])).status,409);
 const csv=await call(f,'/batches/'+a.body.batch.id+'/csv');assert.equal(csv.status,200);assert(csv.body.includes('"Synthetic ""Example"", Customer"'));assert(csv.body.includes('"Flat 1, Example House"'));assert(csv.body.endsWith('\r\n'));assert.equal(await sha256(csv.body),a.body.batch.csv_sha256);
 assert.equal((await call(f,'/queue')).body.orders.length,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM testing_fulfilment_items WHERE active=1').get().n,3);
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM testing_fulfilment_events WHERE event='csv_downloaded'").get().n,1);
});
test('two competing exports cannot reserve or duplicate the same order lines',async()=>{
 const f=fulfilmentFixture();f.ready();const results=await Promise.all([prepare(f),prepare(f)]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM testing_fulfilment_batches').get().n,1);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM testing_fulfilment_items WHERE active=1').get().n,2);
});
test('an unsent cancellation retains history, invalidates old downloads and returns orders to the queue',async()=>{
 const f=fulfilmentFixture();f.ready();const result=await prepare(f),id=result.body.batch.id;
 assert.equal((await call(f,'/batches/'+id+'/actions','POST',{revision:1,action:'cancel',reference:'Rebuild with corrected details'})).status,200);
 assert.equal((await call(f,'/batches/'+id+'/csv')).status,409);assert.equal((await call(f,'/queue')).body.orders.length,2);assert.equal((await prepare(f)).status,201);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM testing_fulfilment_batches').get().n,2);
});
test('refunds, changed quantities, new lines, addresses, product codes and CSV revisions invalidate a prepared export',async()=>{
 const edits=["INSERT INTO commerce_refunds VALUES(1,1,100)","UPDATE commerce_order_items SET quantity=2 WHERE id=10","INSERT INTO commerce_order_items VALUES(12,1,'SST-NF-IRON',1)","UPDATE commerce_order_details SET shipping_address_json='{}' WHERE order_id=1","UPDATE testing_products SET supplier_sku='CHANGED' WHERE id='prostate-health'","UPDATE testing_fulfilment_config SET revision=2","UPDATE orders SET customer_name='Changed name' WHERE id=1","UPDATE orders SET customer_email='changed@example.invalid' WHERE id=1"];
 for(const sql of edits){const f=fulfilmentFixture();f.ready();const result=await prepare(f),id=result.body.batch.id;f.db.exec(sql);const csv=await call(f,'/batches/'+id+'/csv');assert.equal(csv.status,409,sql);assert.equal(csv.body.error,'batch_outdated');assert.equal((await call(f,'/batches/'+id+'/actions','POST',{revision:1,action:'submitted',reference:'message-proof',confirmActuallySubmitted:true})).status,409);}
});
test('submission and acknowledgement require evidence; tracking uses revisions without changing the source order or sending',async()=>{
 const f=fulfilmentFixture();f.ready();const result=await prepare(f),id=result.body.batch.id;
 assert.equal((await call(f,'/batches/'+id+'/actions','POST',{revision:1,action:'submitted',reference:'proof'})).status,409);
 assert.equal((await call(f,'/batches/'+id+'/actions','POST',{revision:1,action:'submitted',reference:'message-id-example',confirmActuallySubmitted:true})).status,200);
 assert.equal((await call(f,'/batches/'+id+'/actions','POST',{revision:1,action:'cancel',reference:'Invalid cancel'})).status,409);
 assert.equal((await call(f,'/batches/'+id+'/actions','POST',{revision:2,action:'acknowledged',reference:'partner-receipt-example'})).status,200);
 assert.equal((await call(f,'/batches/'+id+'/tracking','PATCH',{orderId:1,revision:1,status:'dispatched'})).status,400);
 const update={orderId:1,revision:1,status:'dispatched',carrier:'Royal Mail',trackingReference:'SYNTHETIC-TRACKING'};
 assert.equal((await call(f,'/batches/'+id+'/tracking','PATCH',update)).status,200);assert.equal((await call(f,'/batches/'+id+'/tracking','PATCH',update)).status,409);
 assert.equal(f.db.prepare('SELECT status FROM orders WHERE id=1').get().status,'paid');assert.equal(f.mailCalls(),0);
});
test('email draft attachment is the exact CSV, remains a draft and contains no clinical or account data',async()=>{
 const f=fulfilmentFixture();const result=await call(f,'/batches/test','POST',{requestKey:crypto.randomUUID(),configRevision:1}),id=result.body.batch.id;
 const eml=await call(f,'/batches/'+id+'/email.eml');assert.equal(eml.status,200);assert.match(eml.body,/X-Unsent: 1/);assert.match(eml.body,/To: shiftsometimber@gmail.com/);assert.match(eml.body,/Content-Disposition: attachment/);assert(!/health_answers|assessment|session_token|password/i.test(eml.body));
 const csv=(await call(f,'/batches/'+id+'/csv')).body;
 const payload=eml.body.split('Content-Disposition: attachment;')[1].split('\r\n\r\n')[1].split('\r\n--')[0];assert.equal(Buffer.from(payload.replaceAll('\r\n',''),'base64').toString('utf8'),csv);
});
test('formula-like and control characters are held rather than silently modifying warehouse data',async()=>{
 const f=fulfilmentFixture();f.ready();f.db.exec("UPDATE commerce_order_details SET shipping_name='=HYPERLINK()' WHERE order_id=1");assert.equal((await prepare(f)).status,409);
 const cfg={columns:defaultColumns,delimiter:',',utf8_bom:false};assert.throws(()=>csvText([{recipient:'@formula'}],cfg));
 const body=f.configBody();body.columns=[...defaultColumns.map(c=>({...c}))];body.columns[0].header='=formula';assert.throws(()=>validateConfig(body));
});
test('queue pagination retains older orders and does not silently drop orders after the first hundred',async()=>{
 const f=fulfilmentFixture();f.ready();for(let id=4;id<106;id++)f.order(id);
 const first=await call(f,'/queue');assert.equal(first.body.orders.length,100);assert(first.body.nextCursor);
 const next=await call(f,'/queue?after='+first.body.nextCursor);assert.equal(next.body.orders.length,4);assert.equal(next.body.nextCursor,null);assert(!next.body.orders.some(o=>first.body.orders.some(p=>p.id===o.id)));
});

test('long delivery fields are held without silently truncating the CSV address',async()=>{
 const f=fulfilmentFixture();f.ready();f.db.prepare('UPDATE commerce_order_details SET shipping_address_json=? WHERE order_id=1').run(JSON.stringify({line1:'x'.repeat(251),city:'Example Town',postal_code:'TE1 1ST',country:'GB'}));
 const result=await prepare(f);assert.equal(result.status,409);assert.match(result.body.message,/too long/);
});
