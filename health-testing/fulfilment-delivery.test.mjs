import test from 'node:test';
import assert from 'node:assert/strict';
import {fulfilmentFixture} from './fulfilment-fixture.mjs';
import {fulfilmentRoute} from './fulfilment-api.mjs';
import {processDueDeliveries,deliveryAction} from './fulfilment-delivery.mjs';
import {londonSchedule} from './fulfilment-mail-model.mjs';
const root='https://api.shiftsometimber.co.uk/v1/hq/testing/fulfilment';
async function call(f,path='',method='GET',body){const response=await fulfilmentRoute(new Request(root+path,{method,headers:{Origin:'https://hq.shiftsometimber.co.uk','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),f.env);return {status:response.status,body:await response.json()};}
function fixture(){const f=fulfilmentFixture(),sent=[];f.env.TESTING_FULFILMENT_MAIL_ENABLED='true';f.env.TESTING_FULFILMENT_SCHEDULER_ENABLED='true';f.env.EMAIL={send:async message=>{sent.push(message);return {messageId:'fixture-provider-'+sent.length};}};return {...f,sent};}
async function batch(f,live=false){if(live)f.ready();const result=await call(f,live?'/batches':'/batches/test','POST',{orderIds:[1],requestKey:crypto.randomUUID(),configRevision:1});assert.equal(result.status,201);return result.body.batch;}
async function approval(f,b,action='send_now',extra={}){const review=(await call(f,'/batches/'+b.id)).body;return {action,requestKey:crypto.randomUUID(),batchRevision:review.batch.revision,deliveryRevision:review.mail.delivery?.revision,reviewHash:review.mail.reviewHash,confirmReviewed:true,...extra};}
const send=(f,b,body)=>call(f,'/batches/'+b.id+'/delivery','POST',body);
const stored=(f,b)=>f.db.prepare('SELECT * FROM testing_fulfilment_mail WHERE batch_id=?').get(b.id);

test('send now uses the reviewed Gmail envelope and exact CSV, records acceptance once, and never creates a customer order',async()=>{
 const f=fixture(),b=await batch(f),body=await approval(f,b);body.to='wrong@example.invalid';const result=await send(f,b,body);assert.equal(result.status,200);assert.equal(f.sent.length,1);const m=f.sent[0];assert.deepEqual(m.to,['shiftsometimber@gmail.com']);assert.equal(m.from.email,'orders@shiftsometimber.co.uk');assert.equal(m.replyTo,'partners@shiftsometimber.co.uk');assert.match(m.text,/TEST-ONLY-001/);
 assert.equal(Buffer.from(m.attachments[0].content,'base64').toString('utf8'),f.db.prepare('SELECT csv_text FROM testing_fulfilment_batches WHERE id=?').get(b.id).csv_text);assert.equal(stored(f,b).status,'sent');assert.equal(stored(f,b).provider_id,'fixture-provider-1');assert.equal(f.db.prepare('SELECT status FROM testing_fulfilment_batches WHERE id=?').get(b.id).status,'submitted');
 assert.equal((await send(f,b,body)).status,200);assert.equal(f.sent.length,1);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM orders').get().n,3);
});
test('a fresh review and confirmed partner setup are required; recipient overrides cannot redirect real orders',async()=>{
 const f=fixture(),b=await batch(f,true);let body=await approval(f,b);body.confirmReviewed=false;assert.equal((await send(f,b,body)).status,409);body=await approval(f,b);body.reviewHash='tampered';assert.equal((await send(f,b,body)).status,409);
 body=await approval(f,b);body.to='wrong@example.invalid';assert.equal((await send(f,b,body)).status,200);assert.deepEqual(f.sent[0].to,['fulfilment@example.invalid']);assert.equal(f.sent[0].cc,undefined);
});
test('mixed baskets export only testing items and show the customer, date, products and partner codes in review',async()=>{
 const f=fixture();f.db.prepare('INSERT INTO commerce_order_items VALUES(12,1,?,1)').run('OTHER-PARTNER-SUPPLEMENT');const b=await batch(f,true),detail=(await call(f,'/batches/'+b.id)).body;
 const order=detail.mail.envelope.orders[0];assert.equal(order.products.length,2);assert.equal(order.customerName,'Synthetic "Example", Customer');assert.equal(order.placedAt,'2026-10-28T10:00:00Z');assert(order.products.every(p=>p.supplierSku));assert(!JSON.stringify(detail).includes('OTHER-PARTNER-SUPPLEMENT'));
});
test('UK date/time validation handles BST, missing clock-change hours, repeated hours, invalid dates and past times',()=>{
 const march=Date.parse('2026-03-01T00:00:00Z');assert.throws(()=>londonSchedule('2026-03-29','01:30',march),/does not exist/);assert.equal(londonSchedule('2026-03-29','02:30',march).utc,'2026-03-29T01:30:00.000Z');
 const october=Date.parse('2026-10-01T00:00:00Z');assert.throws(()=>londonSchedule('2026-10-25','01:30',october),/occurs twice/);assert.equal(londonSchedule('2026-10-25','01:30',october,'first').utc,'2026-10-25T00:30:00.000Z');assert.equal(londonSchedule('2026-10-25','01:30',october,'second').utc,'2026-10-25T01:30:00.000Z');assert.throws(()=>londonSchedule('2026-02-30','12:00',march),/valid/);assert.throws(()=>londonSchedule('2026-03-01','00:00',march),/future/);
});
test('scheduled sending persists, waits until due, runs without an HQ session and cannot duplicate across two runners',async()=>{
 const f=fixture(),b=await batch(f),now=Date.parse('2026-10-28T12:00:00Z'),body=await approval(f,b,'schedule',{date:'2026-10-29',time:'10:30'});
 await deliveryAction(f.env,f.db.prepare('SELECT * FROM testing_fulfilment_batches WHERE id=?').get(b.id),body,'fixture-owner@example.invalid',now);assert.equal(f.sent.length,0);assert.equal(stored(f,b).status,'scheduled');await processDueDeliveries(f.env,Date.parse('2026-10-29T10:29:00Z'));assert.equal(f.sent.length,0);
 await Promise.all([processDueDeliveries(f.env,Date.parse('2026-10-29T10:30:00Z')),processDueDeliveries(f.env,Date.parse('2026-10-29T10:30:00Z'))]);assert.equal(f.sent.length,1);assert.equal(stored(f,b).status,'sent');
});
test('scheduled sends can be cancelled and rescheduled with revision protection and without releasing the batch',async()=>{
 const f=fixture(),b=await batch(f),body=await approval(f,b,'schedule',{date:'2026-10-29',time:'10:30'});assert.equal((await send(f,b,body)).status,200);assert.equal((await send(f,b,{...body,time:'11:00'})).status,409);
 let row=stored(f,b);assert.equal((await send(f,b,{action:'cancel_schedule',deliveryRevision:row.revision+1})).status,409);assert.equal((await send(f,b,{action:'cancel_schedule',deliveryRevision:row.revision})).status,200);assert.equal(stored(f,b).status,'cancelled');
 assert.equal((await send(f,b,await approval(f,b,'schedule',{date:'2026-10-29',time:'11:00'}))).status,200);row=stored(f,b);assert.equal((await send(f,b,await approval(f,b,'reschedule',{date:'2026-10-29',time:'12:00'}))).status,200);assert.equal(stored(f,b).send_at,'2026-10-29T12:00:00.000Z');assert(stored(f,b).revision>row.revision);assert.equal(f.sent.length,0);
});
test('changed paid-order details or partner configuration hold scheduled emails before transport',async()=>{
 for(const edit of ["INSERT INTO commerce_refunds VALUES(1,1,100)","UPDATE commerce_order_details SET shipping_name='Changed' WHERE order_id=1","UPDATE testing_fulfilment_config SET destination='changed@example.invalid',revision=revision+1"]){const f=fixture(),b=await batch(f,true);await send(f,b,await approval(f,b,'schedule',{date:'2026-10-29',time:'10:30'}));f.db.exec(edit);await processDueDeliveries(f.env,Date.parse('2026-10-29T10:30:00Z'));assert.equal(f.sent.length,0);assert.equal(stored(f,b).status,'blocked');}
});
test('scheduled mail prevents manual submission or batch cancellation until the schedule is cancelled',async()=>{
 const f=fixture(),b=await batch(f,true);await send(f,b,await approval(f,b,'schedule',{date:'2026-10-29',time:'10:30'}));for(const action of ['cancel','submitted'])assert.equal((await call(f,'/batches/'+b.id+'/actions','POST',{revision:1,action,reference:'fixture-proof',confirmActuallySubmitted:true})).status,409);assert.equal(f.sent.length,0);
});
test('double clicks and competing immediate send approvals produce one transport call',async()=>{
 const f=fixture(),b=await batch(f),one=await approval(f,b),two=await approval(f,b);const results=await Promise.all([send(f,b,one),send(f,b,one),send(f,b,two)]);assert(results.some(r=>r.status===200));assert.equal(f.sent.length,1);await processDueDeliveries(f.env,Date.now()+86400000);assert.equal(f.sent.length,1);
});
test('unknown transport outcomes never retry automatically and cannot be sent again through the UI endpoint',async()=>{
 const f=fixture(),b=await batch(f);let attempts=0;f.env.EMAIL.send=async()=>{attempts++;throw Error('Network timeout');};await send(f,b,await approval(f,b));assert.equal(stored(f,b).status,'uncertain');await processDueDeliveries(f.env,Date.now()+86400000);assert.equal((await send(f,b,await approval(f,b))).status,409);assert.equal(attempts,1);
});
test('definite provider rejections record failure and require a new reviewed retry',async()=>{
 const f=fixture(),b=await batch(f);f.env.EMAIL.send=async()=>{throw Object.assign(Error('Unverified sender'),{code:'E_SENDER_NOT_VERIFIED'});};const body=await approval(f,b);await send(f,b,body);assert.equal(stored(f,b).status,'failed');assert.equal((await send(f,b,body)).status,200);
 f.env.EMAIL.send=async m=>{f.sent.push(m);return {messageId:'retry-accepted'};};await send(f,b,await approval(f,b));assert.equal(f.sent.length,1);assert.equal(stored(f,b).status,'sent');
});
test('accepted mail whose audit transaction fails becomes uncertain rather than being sent twice',async()=>{
 const f=fixture(),b=await batch(f),original=f.DB.batch;let accepted=false;f.env.EMAIL.send=async m=>{f.sent.push(m);accepted=true;return {messageId:'accepted-but-audit-fails'};};f.DB.batch=statements=>accepted?Promise.reject(Error('DB temporary failure')):original(statements);
 await send(f,b,await approval(f,b));assert.equal(f.sent.length,1);assert.equal(stored(f,b).status,'sending');accepted=false;await processDueDeliveries(f.env,Date.now()+11*60000);assert.equal(stored(f,b).status,'uncertain');assert.equal(f.sent.length,1);
});
test('missing email or scheduler configuration holds sends without contacting transport',async()=>{
 const f=fixture(),b=await batch(f);f.env.TESTING_FULFILMENT_MAIL_ENABLED='false';assert.equal((await send(f,b,await approval(f,b))).status,409);f.env.TESTING_FULFILMENT_MAIL_ENABLED='true';f.env.TESTING_FULFILMENT_SCHEDULER_ENABLED='false';assert.equal((await send(f,b,await approval(f,b,'schedule',{date:'2026-10-29',time:'10:30'}))).status,409);assert.equal(f.sent.length,0);
});
