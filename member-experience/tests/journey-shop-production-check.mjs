// Fresh production HTTP/browser checks. No intercepted responses, synthetic login,
// orders, checkout requests, account creation or customer-record writes.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const phase=process.argv[2],engine=process.env.MY_TIMBER_BROWSER_ENGINE||'chromium',origin='https://shiftsometimber.co.uk';
const state=JSON.parse(readFileSync('journey-shop-publication-state.json','utf8'));
const digest=s=>createHash('sha256').update(s).digest('hex');
const main=s=>(s.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const headers=phase==='candidate'?{'Cloudflare-Workers-Version-Overrides':state.owners.map(s=>s.name+'="'+s.versionId+'"').join(', ')}:{};
const receipt={phase,browser:engine,source:state.source,checkedAt:new Date().toISOString(),productionWrites:0,pages:[],assets:[],privateApis:[],errors:[],blockedPosts:0,authenticatedProductionAcceptance:false};
const browser=await ({chromium,webkit}[engine]).launch({headless:true});
let context;
try{
 context=await browser.newContext({viewport:{width:engine==='webkit'?390:1440,height:900},extraHTTPHeaders:headers});
 const page=await context.newPage();page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.route('**/*',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.request().method())){receipt.blockedPosts++;return r.abort();}return r.continue();});
 const get=async path=>{const r=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:25000});const html=await r.text();return {status:r.status(),html,headers:r.headers()};};
 const protectedPaths=['/','/clinic-gone-quiet','/shift-health','/start-here','/treatment-centre','/privacy','/account-deletion','/member/settings','/member/orders','/member/saved'];
 let baseline;
 if(phase!=='before')baseline=JSON.parse(readFileSync('production-before.json','utf8'));
 for(const path of protectedPaths){
  const r=await get(path);assert.equal(r.status,200,path);const text=main(r.html);assert(text,path+' main');
  const item={path,status:r.status,mainSHA256:digest(text)};receipt.pages.push(item);
  if(baseline){const old=baseline.pages.find(x=>x.path===path);assert.equal(item.mainSHA256,old.mainSHA256,'Protected main changed: '+path);}
 }
 if(phase!=='before'){
  for(const path of ['/member/dashboard','/member/dashboard?timber=support#today','/member/dashboard?timber=stuff#today','/member/grub','/member/fit','/member/life-back/journey','/member/life-back/shop']){
   const r=await get(path);assert.equal(r.status,200,path);
   assert(r.html.includes('/assets/member-experience/programme-shop-navigation.mjs'),'Navigation missing: '+path);
   assert(r.html.includes('/assets/member-experience/programme-shop.css'),'Styles missing: '+path);
   receipt.pages.push({path,status:r.status,shopMarker:r.headers['x-my-timber-shop'],journeyShopMarker:r.headers['x-my-timber-journey-shop']});
  }
  const hub=await get('/member/life-back/shop');for(const text of ['Testing &amp; wellbeing','Supplements &amp; nutrition','Weight-management care','Everyday kit','Your orders','Everything here is optional'])assert(hub.html.includes(text),text);
  for(const path of ['/member/life-back/shop/testing','/member/life-back/shop/testing/vitamin-d','/member/life-back/shop/nutrition','/member/life-back/shop/care','/member/life-back/shop/kit','/member/life-back/shop/kit?item=heavyweight-tee&colour=ash-green']){
   const r=await get(path);assert.equal(r.status,200,path);
   if(path.endsWith('/testing'))assert(r.html.includes('/member/life-back/shop/testing/vitamin-d'));
   if(path.endsWith('/vitamin-d')){assert.match(r.html,/data-testing-purchase/);assert.match(r.html,/Out of stock/);assert.match(r.html,/>TBC</);assert.match(r.html,/<button[^>]*type="submit"[^>]*disabled|<button[^>]*disabled[^>]*type="submit"/);}
   if(path.endsWith('/nutrition'))assert.match(r.html,/proposed|not yet available/i);
   if(path.includes('item=')){assert.match(r.html,/tm-detail-layout/);assert.match(r.html,/data-tm-colour="cream"/);}
   receipt.pages.push({path,status:r.status,sha256:digest(r.html)});
  }
  await get('/member/life-back/shop');await page.waitForFunction(()=>document.body.dataset.memberSession==='signed-out',{timeout:15000});assert.equal(await page.locator('#mtShopChrome').count(),0);assert.equal(await page.locator('#mtShopMain').isVisible(),false);
  for(const path of ['/assets/member-experience/programme-shop-navigation.mjs','/assets/member-experience/programme-shop.css','/assets/member-experience/programme-shop-basket.js','/assets/member-experience/programme-journey.mjs','/assets/member-experience/programme-journey.css','/assets/my-timber-layout.mjs','/my-timber-v11.js']){
   const r=await page.evaluate(async path=>{const r=await fetch(path,{cache:'no-store'});return {status:r.status,contentType:r.headers.get('Content-Type'),source:await r.text(),integration:r.headers.get('X-My-Timber-Layout-Integration')};},path);assert.equal(r.status,200,path);assert.match(r.contentType,/javascript|css/);
   if(path.endsWith('my-timber-layout.mjs'))assert.equal(r.integration,'approved-journey-applied');
   receipt.assets.push({path,status:r.status,sha256:digest(r.source),integration:r.integration});
  }
  for(const path of ['/v1/life-back/journey','/v1/life-back','/v1/privacy/export','/v1/commerce/active-checkout']){
   const r=await page.evaluate(async path=>{const r=await fetch(path,{cache:'no-store',credentials:'include'});return {status:r.status};},path);assert([401,403].includes(r.status),path+' rejects signed-out access; got '+r.status);receipt.privateApis.push({path,status:r.status});
  }
  assert.deepEqual(receipt.errors.filter(e=>!baseline.errors.includes(e)),[],'New production console errors');
 }
 receipt.verified=true;receipt.finishedAt=new Date().toISOString();
}finally{if(context)await context.close();await browser.close();writeFileSync('production-'+phase+(engine==='webkit'?'-webkit':'')+'.json',JSON.stringify(receipt,null,2)+'\n');}
console.log('FRESH_PRODUCTION_CHECK',JSON.stringify({phase,browser:engine,verified:receipt.verified,pages:receipt.pages.length,assets:receipt.assets.length,privateApis:receipt.privateApis,errors:receipt.errors,productionWrites:0,finishedAt:receipt.finishedAt}));
