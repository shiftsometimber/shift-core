import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {myTimberRedirect,tickerAllowed,tickerAsset,tickerClient,withPublicTicker,publicTickerAsset} from '../public-navigation-policy.mjs';
const origin='https://shiftsometimber.co.uk';
const header='<header class="site-header"><a href="/start-here">Start Here</a><a href="/treatment-centre">Treatments</a><a href="/member/dashboard">My Timber</a></header>';
const shell=`<!doctype html><html><head><title>Existing page</title><link rel="canonical" href="${origin}/programme"><script defer src="/consent-v4a.js"></script></head><body>${header}<main><h1>Existing content</h1></main><footer>Existing footer</footer></body></html>`;
const htmlResponse=html=>new Response(html,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':String(html.length)}});
test('the missing My Timber aliases reach the existing account gate in one permanent same-origin redirect',()=>{
 for(const path of ['/my-timber','/my-timber/','/my-timber.html','/my-timber.html/'])for(const method of ['GET','HEAD']){
  const response=myTimberRedirect(new Request(origin+path+'?next=%2Fmember%2Flife-back',{method}));
  assert.equal(response.status,301);assert.equal(response.headers.get('Location'),origin+'/member/dashboard?next=%2Fmember%2Flife-back');
 }
 assert.equal(myTimberRedirect(new Request(origin+'/my-timber',{method:'POST'})),null);
 assert.equal(myTimberRedirect(new Request(origin+'/member/dashboard')),null);
});
test('Knowledge, Treatments, news, Programme and Health follow the revised public-page policy',async()=>{
 for(const path of ['/knowledge','/explore-knowledge','/articles/stopping-glp1','/articles/food-noise-after-stopping-glp1','/treatment-centre','/treatment-centre/medicines-watch','/mounjaro','/wegovy','/medicine-news','/medicine-news/example','/shift-newsroom','/programme','/shift-health','/shift-health/sleep-apnoea','/life-back','/contact','/privacy']){
  assert.equal(tickerAllowed(path),true,path);
  const r=await withPublicTicker(new Request(origin+path),htmlResponse(shell));const html=await r.text();
  assert.equal((html.match(/id="shift-public-news"/g)||[]).length,1,path);
  assert.ok(html.includes(header),path+' header preserved');assert.ok(html.includes('<main><h1>Existing content</h1></main>'));
  assert.ok(html.includes('consent-v4a.js'));assert.ok(html.includes('<footer>Existing footer</footer>'));
  assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Length'),null);
 }
});
test('excluded pages stay quiet including aliases, nested account pages and purchase steps',async()=>{
 for(const path of ['/','/index.html','/about','/about/','/about.html','/mens-mental-health','/mental-health/when-to-get-help','/good-to-talk','/lounge','/tap-room','/my-timber','/member/dashboard','/member/life-back','/member-login','/start-here','/start-here/next','/treatment-order','/checkout','/payment','/verification','/order-confirmation','/treatment-confirmation']){
  const r=await withPublicTicker(new Request(origin+path),htmlResponse(shell));
  assert.ok(!(await r.text()).includes('id="shift-public-news"'),path);
 }
});
test('legacy ticker replacement is idempotent and removes legacy motion from exclusions',async()=>{
 const old=shell.replace('</header>','</header><section class="medicine-ticker-v138" data-shift-ai-full-wire="canonical-v1"><span><a href="/old">Old news</a></span></section>').replace('</body>','<script src="/assets/newsroom-ticker-v2.js?v=old"></script></body>');
 const req=new Request(origin+'/treatment-centre');const once=await (await withPublicTicker(req,htmlResponse(old))).text();
 const twice=await (await withPublicTicker(req,htmlResponse(once))).text();assert.equal(once,twice);assert.ok(!twice.includes('newsroom-ticker-v2.js'));assert.ok(!twice.includes('Old news'));
 const excluded=await (await withPublicTicker(new Request(origin+'/start-here'),htmlResponse(old))).text();
 assert.ok(!excluded.includes('<section'));assert.ok(excluded.includes(header));assert.ok(!excluded.includes('newsroom-ticker-v2.js'));
});
test('clinical assessment and account creation also stay inside the excluded journeys',()=>{
 for(const path of ['/treatment-assessment','/treatment-assessment.html','/member-register','/order-success'])assert.equal(tickerAllowed(path),false,path);
});
test('APIs, errors, and non-GET responses are untouched; script is syntactically valid and HEAD has no body',async()=>{
 const api=Response.json({ok:true});assert.equal(await withPublicTicker(new Request(origin+'/v1/me'),api),api);
 const error=new Response(shell,{status:404,headers:{'Content-Type':'text/html'}});assert.equal(await withPublicTicker(new Request(origin+'/missing'),error),error);
 const post=htmlResponse(shell);assert.equal(await withPublicTicker(new Request(origin+'/contact',{method:'POST'}),post),post);
 new Script(tickerClient);
 const asset=publicTickerAsset(new Request(origin+tickerAsset,{method:'HEAD'}));assert.equal(await asset.text(),'');assert.match(asset.headers.get('Content-Type'),/javascript/);
});
