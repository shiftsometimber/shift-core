import assert from 'node:assert/strict';
import test from 'node:test';
import {withShopNavigation,shopNavAsset,shopStyleAsset} from '../shop-navigation.mjs';
import {withJourneyShopAssets,shopBootRuntime} from '../journey-shop-assets.mjs';
const origin='https://shiftsometimber.co.uk',html='<!doctype html><html><head><title>My Timber</title></head><body data-member-page="grub" data-member-session="pending"><header class="site-header">Website</header><main><form id="retained"><input name="retained"></form></main><footer id="sst-footer-c">Footer</footer></body></html>';
test('member opening styles and non-private shell are in the first response before member content',async()=>{
 const r=await withShopNavigation(new Request(origin+'/member/grub'),new Response(html,{headers:{'Content-Type':'text/html','Set-Cookie':'retained=1; Secure','Content-Security-Policy':"default-src 'self'"}}),{MEMBER_EXPERIENCE_V1_ENABLED:'true'}),s=await r.text();
 assert(s.indexOf('data-mt-shop-initial-paint')<s.indexOf('</head>'));assert(s.indexOf(shopNavAsset)<s.indexOf('</head>'));assert(s.includes('data-mt-member-paint="20261101"'));assert(s.indexOf('id="mtShopPending"')<s.indexOf('<main>'));
 assert(s.includes('<main><form id="retained"><input name="retained"></form></main>'));assert.equal(r.headers.get('Set-Cookie'),'retained=1; Secure');assert.equal(r.headers.get('Content-Security-Policy'),"default-src 'self'");assert.equal(r.headers.get('Cache-Control'),'no-store, private');
 assert(!s.includes('id="mtShopChrome"'));assert(!s.includes('id="mtShopBasket"'));assert(!s.includes('data-mt-shop-tab='));assert(s.includes('JavaScript is needed'));assert(s.includes('data-mt-opening-retry'));
});
test('opening injection is idempotent and does not wait for a render-blocking shared stylesheet',async()=>{
 const request=new Request(origin+'/member/life-back/journey'),env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
 const old=html.replace('</body>','<link data-mt-shop-assets rel="stylesheet" href="'+shopStyleAsset+'"><script defer src="'+shopNavAsset+'"></script></body>');
 const first=await withShopNavigation(request,new Response(old,{headers:{'Content-Type':'text/html'}}),env),second=await withShopNavigation(request,first,env),s=await second.text();
 assert.equal((s.match(/data-mt-shop-initial-paint/g)||[]).length,1);assert.equal((s.match(/id="mtShopPending"/g)||[]).length,1);assert.equal((s.match(/<script defer src=/g)||[]).length,1);assert(!/<link\b[^>]*rel="stylesheet"[^>]*programme-shop\.css/.test(s));
});
test('public pages, disabled release flags, non-GET and non-HTML responses retain their existing handler result',async()=>{
 for(const [path,method,env,type]of [['/', 'GET',{MEMBER_EXPERIENCE_V1_ENABLED:'true'},'text/html'],['/member/grub','POST',{MEMBER_EXPERIENCE_V1_ENABLED:'true'},'text/html'],['/member/grub','GET',{},'text/html'],['/member/grub','GET',{MEMBER_EXPERIENCE_V1_ENABLED:'true'},'application/json']]){
 const original=new Response(html,{headers:{'Content-Type':type}});assert.equal(await withShopNavigation(new Request(origin+path,{method}),original,env),original);}
});

test('only the exact owned older bootstrap is upgraded; unknown newer bootstraps are retained',async()=>{
 const request=new Request(origin+'/my-timber-v11.js'),old=shopBootRuntime.replace("document.querySelector('[data-mt-shop-assets]')","document.querySelector('link[data-mt-shop-assets]')");
 const response=await withJourneyShopAssets(request,new Response('const retained=1;'+old,{headers:{'Content-Type':'text/javascript'}})),source=await response.text();
 assert.equal(source,'const retained=1;'+shopBootRuntime);const second=await withJourneyShopAssets(request,new Response(source,{headers:{'Content-Type':'text/javascript'}}));assert.equal(await second.text(),source);
 const newer='/* Approved My Timber Journey/Shop loader; newer unrelated owner code */';assert.equal(await(await withJourneyShopAssets(request,new Response(newer,{headers:{'Content-Type':'text/javascript'}}))).text(),newer);
});
