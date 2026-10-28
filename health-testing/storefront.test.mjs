import test from 'node:test';
import assert from 'node:assert/strict';
import {rangeProducts} from './catalogue.mjs';
import {testingContent} from './public.mjs';
import {storefrontInventory,purchaseState} from './storefront.mjs';
import worker from '../health-nutrition/worker.mjs';

test('every product has a TBC price, zero stock and a disabled basket control',()=>{
 for(const p of rangeProducts){
  assert.deepEqual(storefrontInventory[p.id],{stockQuantity:0,pricePence:null,currency:'GBP',saleEnabled:false});
  assert.equal(purchaseState(p).canPurchase,false);
  const html=testingContent('/shift-health/testing/'+p.id).content;
  assert(html.includes('class="nft-price">TBC'));
  assert(html.includes('0 in stock'));
  assert(html.includes('type="submit" disabled'));
  assert(html.includes('name="quantity"'));
  assert(!/£\d|buy now|free delivery|free shipping/i.test(html));
 }
 const cards=testingContent('/shift-health/testing').content;
 assert.equal((cards.match(/class="nft-card-price">TBC/g)||[]).length,20);
 assert.equal((cards.match(/0 in stock/g)||[]).length,20);
});

test('search and category work in server rendering, including empty and escaped queries',()=>{
 const search=testingContent('/shift-health/testing',new URLSearchParams({q:'HbA1c'})).content;
 assert(search.includes('1 of 20 products'));
 assert(search.includes('data-test="diabetes" data-product-type'));
 assert(search.includes('data-test="testosterone" hidden'));
 const home=testingContent('/shift-health/testing',new URLSearchParams({category:'home'})).content;
 assert(home.includes('8 of 20 products'));
 assert(home.includes('value="home" selected'));
 assert(home.includes('id="lab-tests" data-product-group hidden'));
 const empty=testingContent('/shift-health/testing',new URLSearchParams({q:'<script>alert(1)</script>'})).content;
 assert(empty.includes('0 of 20 products'));
 assert(empty.includes('data-testing-empty>'));
 assert(!empty.includes('<script>alert(1)</script>'));
});

test('direct purchase requests cannot reach orders, reservations, upstream commerce or payment',async()=>{
 let sideEffects=0;
 const env={BLOG:{fetch:()=>{sideEffects++;throw Error('Unexpected upstream')}},DB:{prepare:()=>{sideEffects++;throw Error('Unexpected write')}}};
 for(const p of rangeProducts){
  const response=await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing/'+p.id+'/purchase',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:1,stockQuantity:999,pricePence:1,saleEnabled:true})}),env);
  assert.equal(response.status,409);
  const body=await response.json();assert.equal(body.error,'out_of_stock');assert.equal(body.stockQuantity,0);assert.equal(body.pricePence,null);
 }
 assert.equal(sideEffects,0);
 assert.equal((await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing/not-real/purchase',{method:'POST'}),env)).status,404);
 assert.equal((await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing/iron/purchase'),env)).status,405);
});
