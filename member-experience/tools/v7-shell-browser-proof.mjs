// Real hosted build: no request interception, synthetic accounts only.
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit} from '/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
const engine=process.argv.includes('--webkit')?'webkit':'chromium';
const origin='https://shift-programme-my-timber-v7-test.matobrien.workers.dev';
const access=JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-test-access.json'));
const evidence=path.resolve('member-experience/v7-release-evidence/shell-'+engine);
fs.mkdirSync(evidence,{recursive:true});
const browser=await ({chromium,webkit}[engine]).launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,recordVideo:{dir:evidence,size:{width:390,height:844}}});
const page=await context.newPage(),errors=[],requests=[],documents=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{const u=new URL(r.url());requests.push({path:u.pathname,type:r.resourceType()});if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents.push(u.pathname);});
page.on('response',r=>{if(r.status()>=400&&!r.url().includes('/favicon.ico'))errors.push('HTTP '+r.status()+' '+new URL(r.url()).pathname);});
const report={engine,device:'390 × 844 mobile browser profile; not a physical phone',testAccount:'v7-choose@example.invalid',origin,at:new Date().toISOString(),checks:[]};
const check=(name,pass,detail)=>{report.checks.push({name,result:pass?'PASS':'FAIL',detail});};
try{
 await page.goto(origin+'/__v7/test-start/choose?key='+access.key,{waitUntil:'domcontentloaded'});
 await page.locator('[data-v7-action-card]').waitFor({timeout:25000});
 await page.evaluate(()=>{window.__shellProof={frame:document.querySelector('#mtShopChrome'),header:document.querySelector('.mt-shop-top'),bottom:document.querySelector('.mt-shop-bottom')};});
 await page.screenshot({path:path.join(evidence,'today.png'),fullPage:false});
 await page.locator('[data-v7=swap]').first().click();
 await page.getByRole('dialog').waitFor();
 await page.screenshot({path:path.join(evidence,'swap.png'),fullPage:false});
 await page.getByRole('button',{name:'Close',exact:true}).click();
 const before=documents.length;
 for(const destination of ['journey','shop','grub','fit','support','more','today']){
  await page.locator('#mtShopChrome [data-mt-shop-tab='+destination+']').click();
  await page.locator('#mtNativeMain > [data-mt-screen='+destination+']').waitFor();
  if(destination==='journey')await page.locator('#timberJourney h2').first().waitFor({timeout:20000});
  if(destination==='support')await page.locator('#mtUtility h1').waitFor({timeout:20000});
  const state=await page.evaluate(()=>({sameFrame:window.__shellProof.frame===document.querySelector('#mtShopChrome'),sameHeader:window.__shellProof.header===document.querySelector('.mt-shop-top'),sameBottom:window.__shellProof.bottom===document.querySelector('.mt-shop-bottom'),iframes:document.querySelectorAll('iframe').length,active:[...document.querySelectorAll('#mtShopChrome a[aria-current=page]')].map(n=>n.dataset.mtShopTab),text:document.querySelector('#mtNativeMain')?.innerText?.slice(0,180)}));
  check(destination+' keeps the shared frame',state.sameFrame&&state.sameHeader&&state.sameBottom&&state.iframes===0&&state.active.includes(destination),state);
  await page.screenshot({path:path.join(evidence,destination+'.png'),fullPage:false});
 }
 check('Seven destinations do not reload the document',documents.length===before,{documentsBefore:before,documentsAfter:documents.length});
 await page.locator('#mtShopChrome [data-mt-shop-tab=more]').click();
 await page.locator('a[href="/member/life-back/preferences"]').click();
 check('More active on Preferences',await page.locator('[data-mt-shop-tab=more]').getAttribute('aria-current')==='page');
 await page.screenshot({path:path.join(evidence,'preferences.png'),fullPage:false});
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:15000});
 const cacheState=await page.evaluate(async()=>({controller:!!navigator.serviceWorker.controller,caches:await caches.keys()}));
 check('Shell service worker installed',cacheState.controller,cacheState);
 requests.length=0;
 await page.goto(origin+'/member/dashboard#today',{waitUntil:'domcontentloaded'});
 await page.locator('[data-v7-action-card]').waitFor({timeout:20000});
 const repeat=await page.evaluate(()=>({resources:performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,transferSize:r.transferSize,workerStart:r.workerStart})),privateText:document.querySelector('#mtNativeMain').innerText.slice(0,80)}));
 check('Repeat shell has fewer than ten requests before content',requests.length<10,{requests:[...requests],resources:repeat.resources});
 const privateCache=await page.evaluate(async()=>{const names=await caches.keys();const all=[];for(const name of names){const c=await caches.open(name);for(const request of await c.keys())all.push(new URL(request.url).pathname);}return all;});
 check('CacheStorage contains no private API responses',!privateCache.some(p=>p.startsWith('/v1/')),privateCache);
 await page.waitForTimeout(250);
 await context.setOffline(true);
 await page.goto(origin+'/member/dashboard#today',{waitUntil:'domcontentloaded'});
 await page.locator('[data-v7-action-card]').waitFor({timeout:12000});
 check('Offline opens saved shell and account content',await page.locator('#mtShellOffline').isVisible());
 await page.screenshot({path:path.join(evidence,'offline.png'),fullPage:false});
 await context.setOffline(false);
}catch(e){check('Browser run completes',false,e.message);}
finally{
 check('No browser exceptions or failed HTTP responses',errors.length===0,errors);
 const video=page.video();await page.close();await context.close();if(video)await video.saveAs(path.join(evidence,'seven-destinations.webm'));await browser.close();
 fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({engine,pass:report.checks.filter(x=>x.result==='PASS').length,fail:report.checks.filter(x=>x.result==='FAIL').length,evidence,failures:report.checks.filter(x=>x.result==='FAIL')}));
}
