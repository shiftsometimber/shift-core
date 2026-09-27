import assert from 'node:assert/strict';
import test from 'node:test';
import {sendRefundEmail} from '../worker.js';

test('refund email confirms original payment method and timing',async()=>{
  let message=null;
  const env={EMAIL:{send:async value=>{message=value}}};
  await sendRefundEmail(env,{
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
