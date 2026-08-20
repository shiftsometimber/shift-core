import assert from 'node:assert/strict';
import test from 'node:test';
import {commerceCatalogue,commerceStripeRoutes,validStripeSignature} from '../commerce-stripe-v1.js';

async function signature(payload,secret,timestamp){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${payload}`)));
  return [...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');
}

test('catalogue values are server controlled',()=>{
  assert.equal(commerceCatalogue.pricePence,1000);
  assert.equal(commerceCatalogue.deliveryPence,299);
  assert.deepEqual(commerceCatalogue.sizes,['XS','S','M','L','XL','XXL','3XL','4XL','5XL']);
});

test('validates Stripe HMAC signature and timestamp tolerance',async()=>{
  const payload=JSON.stringify({id:'evt_test',type:'checkout.session.completed'}),secret='whsec_test',timestamp=1_800_000_000;
  const digest=await signature(payload,secret,timestamp);
  assert.equal(await validStripeSignature(payload,`t=${timestamp},v1=${digest}`,secret,timestamp),true);
  assert.equal(await validStripeSignature(payload,`t=${timestamp},v1=${digest}`,secret,timestamp+301),false);
  assert.equal(await validStripeSignature(`${payload}x`,`t=${timestamp},v1=${digest}`,secret,timestamp),false);
});

test('checkout fails closed when Stripe is not configured',async()=>{
  const request=new Request('https://api.shiftsometimber.co.uk/v1/commerce/checkout',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:JSON.stringify({size:'L',quantity:1})});
  const response=await commerceStripeRoutes(request,{DB:{}},{});
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{ok:false,error:'payments_not_configured'});
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://shiftsometimber.co.uk');
});

test('catalogue is available without exposing Stripe configuration',async()=>{
  const request=new Request('https://api.shiftsometimber.co.uk/v1/commerce/catalogue',{headers:{Origin:'https://www.shiftsometimber.co.uk'}});
  const response=await commerceStripeRoutes(request,{},{}),body=await response.json();
  assert.equal(response.status,200);
  assert.equal(body.product.pricePence,1000);
  assert.equal(body.product.deliveryPence,299);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://www.shiftsometimber.co.uk');
});

test('unknown routes are ignored',async()=>{
  const response=await commerceStripeRoutes(new Request('https://api.shiftsometimber.co.uk/v1/other'),{},{});
  assert.equal(response,null);
});
