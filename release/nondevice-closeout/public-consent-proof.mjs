import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const origin='https://shiftsometimber.co.uk',reports=[];
mkdirSync('nondevice-proof',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  let context=await browser.newContext({viewport:{width,height:900}}),collector=[],gtm=[];
  const intercept=async route=>{
   const req=route.request(),u=new URL(req.url());
   if(/google-analytics\.com$|analytics\.google\.com$|doubleclick\.net$/.test(u.hostname)||/\/collect(?:\?|$|\/)/.test(u.pathname)){
    const payloads=[u.search,req.postData()||''].filter(Boolean).flatMap(s=>s.split('\n'));
    for(const s of payloads){const params=new URLSearchParams(s.replace(/^\?/,''));if(params.get('en'))collector.push(Object.fromEntries(params));}
    return route.fulfill({status:204,body:''});
   }
   if(u.hostname==='www.googletagmanager.com'&&u.pathname==='/gtm.js')gtm.push(u.pathname);
   // Intercept generated acquisition measurement; no production fixture writes.
   if(!['GET','HEAD'].includes(req.method()))return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
   return route.continue();
  };await context.route('**/*',intercept);
  let page=await context.newPage();await page.goto(origin+'/about',{waitUntil:'domcontentloaded'});
  await page.locator('[data-consent="necessary"]').waitFor({state:'visible'});await page.waitForTimeout(1500);
  assert.equal(gtm.length,0,'GTM requested before consent');assert.equal(collector.length,0,'Collection before consent');
  await page.locator('[data-consent="necessary"]').click();await page.waitForTimeout(1500);
  assert.equal(gtm.length,0);assert.equal(collector.length,0);
  await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="analytics"]').click();
  await page.waitForFunction(()=>document.querySelector('#sst-consented-gtm'),{timeout:15000});
  for(let i=0;i<20&&!collector.some(p=>p.en==='page_view');i++)await page.waitForTimeout(500);
  assert.equal(gtm.length,1,'Consent must load one GTM container');
  const views=collector.filter(p=>p.en==='page_view');assert.equal(views.length,1,'One permitted page view must be generated');
  for(const p of collector){assert(!JSON.stringify(p).includes('fictional-private'));if(p.dl){const u=new URL(p.dl);assert.equal(u.origin,origin);assert.equal(u.pathname,'/about');assert.equal(u.search,'');assert.equal(u.hash,'');}assert(!p.uid,'No account identifier in public analytics');}
  await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="analytics"]').click();await page.waitForTimeout(1000);assert.equal(gtm.length,1);assert.equal(collector.filter(p=>p.en==='page_view').length,1,'Repeated consent duplicated the page view');
  await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="necessary"]').click();
  assert.equal(await page.evaluate(()=>window['ga-disable-G-Y7BV5KY6RR']),true);
  // A browser carrying accepted consent must still exclude sensitive URLs.
  await context.close();
  context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',intercept);
  await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({analytics:true,necessary:true})));
  page=await context.newPage();
  const before=gtm.length,events=collector.length;
  await page.goto(origin+'/about?email=fictional-private@example.invalid',{waitUntil:'domcontentloaded'});await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>window.SST_ANALYTICS_SUPPRESSED),true);assert.equal(gtm.length,before);assert.equal(collector.length,events);
  await page.goto(origin+'/shift-health/sleep-apnoea',{waitUntil:'domcontentloaded'});await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>window.SST_ANALYTICS_SUPPRESSED),true);assert.equal(gtm.length,before);assert.equal(collector.length,events);
  reports.push({width,defaultDenied:true,necessaryOnlyNoCollection:true,acceptedPageViews:views.length,containerLoadedOnce:true,withdrawalDisabled:true,sensitiveQuerySuppressed:true,healthSurfaceSuppressed:true,collectorTransmissionIntercepted:true});await context.close();
 }
 writeFileSync('nondevice-proof/public-consent.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,reports,productionAccountWrites:0,externalAnalyticsEventsTransmitted:0,scope:'Actual deployed browser consent UI and generated collector payload. Collection intercepted; GA4 receipt/key-event configuration not claimed.'},null,2));
}finally{await browser.close();}
