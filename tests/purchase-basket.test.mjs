import test from 'node:test';
import assert from 'node:assert/strict';
import {isPurchaseBasketPage,purchaseBasketAsset,withPurchaseBasket} from '../public-purchase-basket.mjs';

test('basket is site-wide but never modifies My Timber or private pages',()=>{
 assert.equal(isPurchaseBasketPage('/'),true);
 assert.equal(isPurchaseBasketPage('/treatment-order'),true);
 assert.equal(isPurchaseBasketPage('/shop.html'),true);
 for(const path of ['/my-timber','/my-timber/today','/member/dashboard','/hq','/v1/me','/assets/a.js']){
   assert.equal(isPurchaseBasketPage(path),false,path);
 }
});
test('public asset is read-only and contains a user-scoped basket, not medical or card fields',async()=>{
 const get=new Request('https://api.shiftsometimber.co.uk/assets/shift-purchase-basket-v1.js');
 const response=purchaseBasketAsset(get);
 assert.equal(response.status,200);
 assert.match(response.headers.get('content-type'),/application\/javascript/);
 const js=await response.text();
 assert.match(js,/sst-purchase-basket-v1/);
 assert.match(js,/accountReference/);
 assert.match(js,/checkout\.stripe\.com/);
 assert.doesNotMatch(js,/(localStorage\.setItem\([^)]*(?:serviceWeight|serviceHeight|cardNumber|verificationToken))/i);
 assert.equal(purchaseBasketAsset(new Request(get.url,{method:'POST'})),null);
});
test('one script is injected without altering the HTML body or responses on other routes',async()=>{
 const req=new Request('https://shiftsometimber.co.uk/treatment-order');
 const input='<html><body><header>SHIFT</header><main>Unchanged</main></body></html>';
 const resp=()=>new Response(input,{headers:{'Content-Type':'text/html; charset=utf-8','ETag':'"old"','Content-Length':String(input.length)}});
 const result=await withPurchaseBasket(req,resp());
 const html=await result.text();
 assert.match(html,/Unchanged<\/main>/);
 assert.match(html,/api\.shiftsometimber\.co\.uk\/assets\/shift-purchase-basket-v1\.js/);
 assert.equal(result.headers.has('ETag'),false);
 assert.equal(result.headers.get('cache-control'),'private, no-cache, must-revalidate');
 const repeated=await withPurchaseBasket(req,new Response(html,{headers:{'Content-Type':'text/html'}}));
 assert.equal((await repeated.text()).split('shift-purchase-basket-v1.js').length,2);
 const privatePage=await withPurchaseBasket(new Request('https://shiftsometimber.co.uk/my-timber/today'),resp());
 assert.equal(await privatePage.text(),input);
 const notHtml=await withPurchaseBasket(req,new Response('plain',{headers:{'Content-Type':'text/plain'}}));
 assert.equal(await notHtml.text(),'plain');
});
