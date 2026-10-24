import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
import {sendRefundEmail} from '../worker.js';

test('refund email confirms original payment method and timing',async()=>{
  let message=null;
  const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE orders(id INTEGER PRIMARY KEY,user_id INTEGER,customer_email TEXT,status TEXT,payment_status TEXT);CREATE TABLE users(id INTEGER,email TEXT);INSERT INTO orders VALUES(1,NULL,'customer@example.com','refunded','refunded')");
  const DB={prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async run(){return{meta:{changes:Number(db.prepare(sql).run(...args).changes)}}}}}};
  const env={DB,EMAIL:{send:async value=>{message=value;return{messageId:'fictional-refund-provider'}}}};
  await sendRefundEmail(env,{id:1,
    customer_email:'customer@example.com',
    customer_name:'Matt O’Brien',
    order_number:'SST-TEST123',
    product_name:'Shift Some Timber T-shirt',
    size:'L',
    amountPence:1299,
    environment:'test'
  });
  assert.equal(message.to,'customer@example.com');
  assert.match(message.subject,/refund has been processed/i);
  assert.match(message.html,/original payment method/i);
  assert.match(message.html,/up to 10 working days/i);
  assert.match(message.html,/£12\.99/);
  assert.match(message.html,/no real money has moved/i);
  assert.match(message.text,/original payment method/i);
});
