import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {shopPageRoutes,publicShopURL,projectShopDocument} from '../shop-routes.mjs';
import {shopBase,shopMemberPath,shopNavigationAsset,withShopNavigation,shopNavAsset,shopStyleAsset} from '../shop-navigation.mjs';
import {memberBasketRoutes,bindMemberBasket} from '../shop-basket.mjs';
import {wrapSupportService} from '../support-release.mjs';
import {purchaseBasketAsset} from '../../public-purchase-basket.mjs';
const origin='https://shiftsometimber.co.uk',env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},req=(path,init)=>new Request(origin+path,init);
const fixture='<!doctype html><html><head><link rel="stylesheet" href="/product.css"><style>.product{color:#E7E3DA}</style><script src="/analytics-bootstrap-v1.js"></script></head><body class="shop-page" data-template="catalogue"><header>Public menu</header><main id="main-content"><a href="/shift-health/testing/vitamin-d">Vitamin D</a><form method="get" action="/shift-health/supplements-nutrition"><input name="q"></form><form method="post" action="/shift-health/testing/vitamin-d/purchase"><button disabled>Out of stock</button></form><p>Price TBC</p><a href="/start-here">Check eligibility</a></main><footer>Public footer</footer><script data-testing-storefront>window.testingPreserved=true</script><script defer src="/shop/client.js"></script><script src="/assets/shift-purchase-basket-v1.js"></script><script src="/register-sw-v3a.js"></script><script src="/assets/public-news-ticker-v1.js"></script></body></html>';

test('approved hub links all four real ranges and existing private orders; it starts behind the retained session gate',async()=>{
 const response=await shopPageRoutes(req(shopBase),env),html=await response.text();
 assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/private/);assert.match(html,/data-member-session="pending"/);
 for(const path of ['/testing','/nutrition','/care','/kit'])assert.ok(html.includes('href="'+shopBase+path+'"'));
 assert.match(html,/href="\/member\/orders"/);assert.match(html,/Everything here is optional/);assert.doesNotMatch(html,/No shop orders shown|would appear here/);
});
test('member catalogue uses only a finite public path and validated, bounded filter parameters',()=>{
 for(const [path,want]of [['/testing','/shift-health/testing'],['/testing/vitamin-d','/shift-health/testing/vitamin-d'],['/nutrition?product=creatine&brand=Applied+Nutrition','/shift-health/supplements-nutrition?product=creatine&brand=Applied+Nutrition'],['/kit?item=heavyweight-tee&colour=cream','/shop?item=heavyweight-tee&colour=cream']])assert.equal(publicShopURL(origin+shopBase+path).pathname+publicShopURL(origin+shopBase+path).search,want);
 for(const path of ['/kit?returnTo=https://evil.test','/nutrition?q=a&q=b','/testing?q=%0Asecret','/nutrition?q='+('x'.repeat(181)),'/testing/a/b','/kit/extra'])assert.equal(publicShopURL(origin+shopBase+path),null,path);
 assert.equal(shopMemberPath('https://evil.test/shop'),null);assert.equal(shopMemberPath('/v1/commerce/checkout'),null);assert.equal(shopMemberPath('/start-here'),null);
 assert.equal(shopMemberPath('/shop?colour=black#range'),shopBase+'/kit?colour=black#range');
});
test('catalogue projection retains stock/price/functional controls, rewrites browsing and leaves clinical/POST handlers intact',()=>{
 const html=projectShopDocument(fixture,new URL(origin+'/shift-health/testing/vitamin-d'));
 assert.match(html,/href="\/member\/life-back\/shop\/testing\/vitamin-d"/);assert.match(html,/action="\/member\/life-back\/shop\/nutrition"/);
 assert.match(html,/action="\/shift-health\/testing\/vitamin-d\/purchase"/);assert.match(html,/<button disabled>Out of stock/);assert.match(html,/Price TBC/);assert.match(html,/href="\/start-here"/);assert.match(html,/window.testingPreserved=true/);assert.match(html,/src="\/shop\/client.js"/);
 assert.doesNotMatch(html,/Public menu|Public footer|analytics-bootstrap|register-sw|public-news-ticker|src="\/assets\/shift-purchase-basket/);
 assert.match(html,/class="shop-page"/);assert.match(html,/data-mt-shop-document/);assert.match(html,/noindex,nofollow/);
 assert.throws(()=>projectShopDocument('<main>Unknown</main>',new URL(origin+'/shop')),/contract changed/);
});
test('public projection never forwards member credentials; private response does not copy public cache or cookies',async()=>{
 let read;const response=await shopPageRoutes(req(shopBase+'/nutrition?product=creatine',{headers:{Cookie:'private-session=secret',Authorization:'Bearer private','X-Account':'secret',Referer:origin+'/member/dashboard'}}),env,async r=>{read=r;return new Response(fixture,{headers:{'Content-Type':'text/html','Set-Cookie':'public=unwanted','Cache-Control':'public,max-age=1000'}});});
 assert.equal(read.url,origin+'/shift-health/supplements-nutrition?product=creatine');assert.equal(read.method,'GET');assert.equal(read.redirect,'error');assert.deepEqual([...read.headers.keys()],['accept']);assert.equal(response.headers.get('Set-Cookie'),null);assert.equal(response.headers.get('Cache-Control'),'no-store, private');
});
test('unavailable, redirected, oversized or unrecognised catalogue fails closed with recovery',async()=>{
 for(const fetcher of [async()=>new Response('',{status:404}),async()=>{throw Error('network')},async()=>new Response('<main>Changed</main>',{headers:{'Content-Type':'text/html'}}),async()=>new Response('x'.repeat(2000001),{headers:{'Content-Type':'text/html'}})]){
  const response=await shopPageRoutes(req(shopBase+'/testing'),env,fetcher);assert.equal(response.status,503);assert.match(await response.text(),/Your basket has not changed/);
 }
});
test('care opens the existing eligibility route without arranging treatment',async()=>{
 const html=await(await shopPageRoutes(req(shopBase+'/care'),env)).text();assert.match(html,/href="\/start-here"/);assert.match(html,/prescribing decisions belong with the prescriber/);assert.doesNotMatch(html,/\/v1\/.*checkout/);
});
test('new pages refuse writes; unknown paths and disabled feature do not affect the fallback',async()=>{
 assert.equal((await shopPageRoutes(req(shopBase,{method:'POST'}),env)).status,405);
 assert.equal((await shopPageRoutes(req(shopBase+'/unknown'),env)).status,404);
 assert.equal(await shopPageRoutes(req('/shop'),env),null);assert.equal(await shopPageRoutes(req(shopBase),{}),null);
 assert.equal(await memberBasketRoutes(req('/assets/member-experience/programme-shop-basket.js'),{}),null);
 const response=await shopPageRoutes(req(shopBase,{method:'HEAD'}),env);assert.equal(response.status,200);assert.equal(await response.text(),'');
});
test('navigation joins every owned member page once and preserves existing account scripts/cookies',async()=>{
 for(const path of ['/member/dashboard','/member/life-back/journey','/member/grub','/member/fit','/member/settings','/member/orders','/member/saved']){
  const input=new Response('<html><body><script src="/existing-account.js"></script></body></html>',{headers:{'Content-Type':'text/html','Set-Cookie':'retained=1; Secure; HttpOnly','ETag':'old'}}),response=await withShopNavigation(req(path),input,env),html=await response.clone().text();
  assert.match(html,/existing-account.js/);assert.equal(response.headers.get('Set-Cookie'),'retained=1; Secure; HttpOnly');assert.equal(response.headers.get('ETag'),null);
  const twice=await withShopNavigation(req(path),response,env);assert.equal(await twice.text(),html);
 }
 for(const path of ['/shop','/start-here','/member-login','/v1/me']){const input=new Response('<body></body>',{headers:{'Content-Type':'text/html'}});assert.equal(await withShopNavigation(req(path),input,env),input);}
});
test('shared navigation asset compiles and retains exactly the approved destinations and title spacing',async()=>{
 const script=await shopNavigationAsset(req(shopNavAsset)).text();assert.doesNotThrow(()=>new vm.Script(script));
 for(const text of ['Today','Journey','Shop','Grub','Fit','Support','More'])assert.ok(script.includes(text));
 const css=await shopNavigationAsset(req(shopStyleAsset)).text();assert.match(css,/\.mt-shop-copy\{display:block;padding:8px 10px 10px/);assert.match(css,/-webkit-text-fill-color:#E7E3DA!important/);
});
test('member basket retains canonical payment/owner checks and refuses changed contracts',async()=>{
 const response=purchaseBasketAsset(req('/assets/shift-purchase-basket-v1.js'));assert.ok(response);
 const source=await response.text(),bound=bindMemberBasket(source);assert.doesNotThrow(()=>new vm.Script(bound));
 for(const check of ['body.accountReference!==account',"url.hostname!=='checkout.stripe.com'",'saved.owner!==account','checkout_expired','memberResumeEpoch!==memberBasketEpoch','sst:member-basket-clear'])assert.ok(bound.includes(check),check);
 assert.throws(()=>bindMemberBasket('unknown public source'),/contract changed/);
 const failed=await memberBasketRoutes(req('/assets/member-experience/programme-shop-basket.js'),env,async()=>new Response('changed',{headers:{'Content-Type':'text/javascript'}}));assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/fetch\(/);
});
test('release wrapper serves Shop, keeps Journey and passes clinical/auth/payment/public handlers through unchanged',async()=>{
 const original={fetch:async()=>new Response('retained')},wrapper=wrapSupportService(original);
 assert.match(await(await wrapper.fetch(req(shopBase),env,{})).text(),/SHOP &amp; SERVICES/);
 assert.match(await(await wrapper.fetch(req('/member/life-back/journey'),env,{})).text(),/timberJourney/);
 for(const path of ['/','/shop','/start-here','/v1/auth/login','/v1/commerce/supplements-checkout','/treatment-assessment'])assert.equal(await(await wrapper.fetch(req(path),env,{})).text(),'retained');
});
