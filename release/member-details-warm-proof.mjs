import {chromium,webkit} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const origin='https://shift-stabilisation-preview.matobrien.workers.dev',probe=JSON.parse(readFileSync('work/staging/generated/probe.json')),out='work/staging/generated/review-evidence',results=[];
mkdirSync(out,{recursive:true});
for(const[name,engine]of [['chromium',chromium],['webkit',webkit]])for(const width of [390,1440]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'allow'}),page=await context.newPage(),row={browser:name,width,status:'running'};results.push(row);
 try{
  await context.route('**/*',route=>{const q=route.request(),u=new URL(q.url());if(u.hostname.endsWith('google-analytics.com')||u.hostname==='www.googletagmanager.com'||u.pathname==='/cdn-cgi/rum')return route.fulfill({status:204,body:''});if(!['GET','HEAD'].includes(q.method())&&u.origin!==origin)return route.abort();return route.continue();});
  await page.goto(origin+'/staging/sign-in',{waitUntil:'domcontentloaded'});await page.fill('input[name="email"]','probe'+probe.browserIds[0]+'@example.invalid');await page.fill('input[name="password"]',probe.password);await page.locator('#stage-auth button[type="submit"]').click();await page.waitForURL(/\/member\/dashboard/);
  const supported=await page.evaluate(()=>Boolean(navigator.serviceWorker));
  if(supported){await page.evaluate(async()=>{await navigator.serviceWorker.register('/shift-push-sw-v1.js',{scope:'/'});await navigator.serviceWorker.ready;});}
  const rounds=[];
  for(let i=0;i<2;i++){
   await page.goto(origin+'/member/settings#memberDetailsPanel',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>{const f=document.querySelector('#memberDetailsFields');return f&&!f.disabled});
   const state=await page.evaluate(()=>({address:document.querySelector('#memberAddress1').value,privateCache:false,controller:Boolean(navigator.serviceWorker?.controller),width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.equal(state.width,state.scroll);if(supported&&i===1)assert(state.controller,'warm page must be service-worker controlled');rounds.push(state);
   for(const path of ['/programme','/member-login']){const res=await context.request.get(origin+path);assert.equal(res.status(),200);assert.equal(res.headers()['x-shift-startup-layout'],'stable-v1');}
   const asset=await context.request.get(origin+'/analytics-events-v31b.js');assert.equal(asset.headers()['x-shift-analytics-dispatch'],'data-layer-only-v1');assert.equal(createHash('sha256').update(await asset.body()).digest('hex'),'135750c70453438dadfdfc8ace5027f80de99b12052a27cf65f8e1d791739873');
  }
  assert.equal(rounds[0].address,rounds[1].address);row.rounds=rounds;row.serviceWorkerSupported=supported;row.status='pass';await page.screenshot({path:out+'/warm-'+name+'-'+width+'.png',fullPage:true});
 }catch(e){row.status='fail';row.error=String(e.message).replaceAll(probe.password,'[redacted]');}
 finally{await context.close();await browser.close();writeFileSync(out+'/warm-browser.json',JSON.stringify({source:process.env.PREVIEW_SOURCE_SHA,results,physicalDevice:false,notificationPermissionRequested:false},null,2));}
}
assert(results.every(x=>x.status==='pass'),JSON.stringify(results));console.log('Four warm browser/service-worker cases passed. Not a physical-device or push-delivery test.');
