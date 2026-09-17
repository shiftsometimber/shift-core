import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {myTimberRedirect,tickerAllowed,tickerAsset,tickerClient,withPublicTicker,publicTickerAsset,contrastSafetyStyles,contrastSafetyVersion} from '../public-navigation-policy.mjs';
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
  assert.equal((html.match(/data-shift-public-contrast/g)||[]).length,1,path);
  assert.ok(html.includes(header),path+' header preserved');assert.ok(html.includes('<main><h1>Existing content</h1></main>'));
  assert.ok(html.includes('consent-v4a.js'));assert.ok(html.includes('<footer>Existing footer</footer>'));
  assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Length'),null);
  assert.equal(r.headers.get('X-Shift-Contrast-Safety'),contrastSafetyVersion);
 }
});
test('excluded pages stay quiet including aliases, nested account pages and purchase steps',async()=>{
 for(const path of ['/','/index.html','/about','/about/','/about.html','/mens-mental-health','/mental-health/when-to-get-help','/good-to-talk','/lounge','/tap-room','/my-timber','/member/dashboard','/member/life-back','/member-login','/start-here','/start-here/next','/treatment-order','/checkout','/payment','/verification','/order-confirmation','/treatment-confirmation']){
  const r=await withPublicTicker(new Request(origin+path),htmlResponse(shell));const html=await r.text();
  assert.ok(!html.includes('id="shift-public-news"'),path);
  assert.equal((html.match(/data-shift-public-contrast/g)||[]).length,1,path+' contrast safety still applies');
 }
});
test('legacy ticker replacement is idempotent and removes legacy motion from exclusions',async()=>{
 const old=shell.replace('</header>','</header><section class="medicine-ticker-v138" data-shift-ai-full-wire="canonical-v1"><span><a href="/old">Old news</a></span></section>').replace('</body>','<script src="/assets/newsroom-ticker-v2.js?v=old"></script></body>');
 const req=new Request(origin+'/treatment-centre');const once=await (await withPublicTicker(req,htmlResponse(old))).text();
 const twice=await (await withPublicTicker(req,htmlResponse(once))).text();assert.equal(once,twice);assert.ok(!twice.includes('newsroom-ticker-v2.js'));assert.ok(!twice.includes('Old news'));assert.equal((twice.match(/data-shift-public-contrast/g)||[]).length,1);
 const excluded=await (await withPublicTicker(new Request(origin+'/start-here'),htmlResponse(old))).text();
 assert.ok(!excluded.includes('<section'));assert.ok(excluded.includes(header));assert.ok(!excluded.includes('newsroom-ticker-v2.js'));assert.equal((excluded.match(/data-shift-public-contrast/g)||[]).length,1);
});
test('clinical assessment and account creation also stay inside the excluded journeys',()=>{
 for(const path of ['/treatment-assessment','/treatment-assessment.html','/member-register','/order-success'])assert.equal(tickerAllowed(path),false,path);
});
test('live contrast safety is brand-only and covers every audited shared failure root',()=>{
 const selectors=['.sst-service-bridge__limit','a.sst-service-bridge__cta','.ct-form-card','.faqcard','.eu-card','.dec-panel','.ready-panel','.ready-card','.resource-card-v3b2','.fifa-card','.future-card','.authority-next a','.shift-guided-card','.at-composer','.sh-card__alt','.tool-intro','.featured-links__eyebrow'];
 for(const selector of selectors)assert.ok(contrastSafetyStyles.includes(selector),selector);
 assert.doesNotMatch(contrastSafetyStyles,/#fff(?:fff)?\b|#f4f1e9\b|background:\s*white\b|color:\s*white\b/i);
 for(const value of contrastSafetyStyles.match(/#[0-9a-fA-F]{6}/g)||[])assert.ok(['#E7E3DA','#050505','#707762'].includes(value),value);
});
test('APIs, errors, and non-GET responses are untouched; script is syntactically valid and HEAD has no body',async()=>{
 const api=Response.json({ok:true});assert.equal(await withPublicTicker(new Request(origin+'/v1/me'),api),api);
 const error=new Response(shell,{status:404,headers:{'Content-Type':'text/html'}});assert.equal(await withPublicTicker(new Request(origin+'/missing'),error),error);
 const post=htmlResponse(shell);assert.equal(await withPublicTicker(new Request(origin+'/contact',{method:'POST'}),post),post);
 new Script(tickerClient);
 const asset=publicTickerAsset(new Request(origin+tickerAsset,{method:'HEAD'}));assert.equal(await asset.text(),'');assert.match(asset.headers.get('Content-Type'),/javascript/);
 const head=await withPublicTicker(new Request(origin+'/contact',{method:'HEAD'}),htmlResponse(shell));assert.equal(await head.text(),'');assert.equal(head.headers.get('X-Shift-Contrast-Safety'),contrastSafetyVersion);
});
