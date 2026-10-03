import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';
import {deviceHealthRoutes} from '../../member-experience/device-health.mjs';
import {deviceHealthRuntime,deviceHealthStyles} from '../../member-experience/device-health-client.mjs';
const {chromium,webkit}=createRequire(import.meta.url)('playwright');
const out=process.env.HEALTH_PROOF_OUT||'/tmp/shift-health-browser-proof';mkdirSync(out,{recursive:true});
const results=[];
const matrix=[[chromium,390],[chromium,1440],[webkit,390]].filter(([engine])=>!process.env.HEALTH_PROOF_ENGINE||engine.name()===process.env.HEALTH_PROOF_ENGINE);
for(const [engine,width] of matrix){
 const f=fixture(),browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
 const readings=[{id:'fake-heart',kind:'heart_rate',at:new Date().toISOString(),heartRate:78,source:'Fictional watch'},{id:'fake-bp',kind:'blood_pressure',at:new Date().toISOString(),systolic:128,diastolic:82,source:'Fictional cuff'},{id:'fake-weight',kind:'weight',at:new Date().toISOString(),weightKg:93.2,source:'Fictional scales'}];
 let account=1;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.pathname==='/v1/device-health'){
   const response=await deviceHealthRoutes(new Request('https://shiftsometimber.co.uk/v1/device-health',{method:request.method(),headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json',Cookie:'sst_session=test-only-member-'+account},...(request.method()==='POST'?{body:request.postData()}:{} )}),f.env);
   return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  }
  if(url.pathname==='/member/settings')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en-GB"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Device health fixture</title><style>body{margin:16px;background:#050505;color:#E7E3DA;font:16px/1.6 Arial}main{max-width:960px;margin:auto}'+deviceHealthStyles+'</style><main><h1>My Timber Settings</h1><section id="deviceHealth"></section></main></html>'});
  return route.abort();
 });
 try{
  await page.goto('https://shiftsometimber.co.uk/member/settings');
  await page.evaluate(rows=>window.SST_NATIVE_HEALTH={platform:'apple_health',request:async()=>({readings:rows})},readings);
  await page.addScriptTag({content:deviceHealthRuntime});
  await page.getByRole('button',{name:'Preview Apple Health readings'}).waitFor();
  await page.getByRole('button',{name:'Preview Apple Health readings'}).click();await page.getByRole('status').filter({hasText:'Tick the import consent'}).waitFor();
  await page.locator('#deviceHealth>label input').check();await page.getByRole('button',{name:'Preview Apple Health readings'}).click();
  await page.getByRole('button',{name:'Save selected readings'}).waitFor();assert.equal((await (await deviceHealthRoutes(new Request('https://shiftsometimber.co.uk/v1/device-health',{headers:{Cookie:'sst_session=test-only-member-1'}}),f.env)).json()).readings.length,0);
  await page.screenshot({path:out+'/preview-'+engine.name()+'-'+width+'.png',fullPage:true});
  await page.getByRole('button',{name:'Save selected readings'}).click();await page.getByRole('status').filter({hasText:'Selected readings saved'}).waitFor();
  assert.equal(await page.locator('#deviceHealth li').count(),3);assert.equal(await page.locator('#deviceHealth li').filter({hasText:'93.2 kg'}).count(),1);
  // Reload reads the persisted shared account, without invoking a native read.
  await page.reload();await page.addScriptTag({content:deviceHealthRuntime});await page.locator('#deviceHealth li').first().waitFor();assert.equal(await page.locator('#deviceHealth li').count(),3);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Disconnect Apple Health imports'}).click();await page.getByRole('status').filter({hasText:'Imports disconnected'}).waitFor();assert.equal(await page.locator('#deviceHealth li').count(),3);
  page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete imported Apple Health copies'}).click();await page.getByRole('status').filter({hasText:'Imported copies deleted'}).waitFor();assert.equal(await page.locator('#deviceHealth li').count(),0);
  // A response from the original preview cannot save under a later account.
  await page.evaluate(rows=>window.SST_NATIVE_HEALTH={platform:'apple_health',request:async()=>({readings:rows})},readings);await page.evaluate(()=>window.dispatchEvent(new Event('sst-native-health-ready')));
  await page.locator('#deviceHealth>label input').check();await page.getByRole('button',{name:'Preview Apple Health readings'}).click();await page.getByRole('button',{name:'Save selected readings'}).waitFor();account=2;
  await page.getByRole('button',{name:'Save selected readings'}).click();await page.getByRole('status').filter({hasText:'account changed'}).waitFor();assert.equal(JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=2').get().preferences).deviceHealth,undefined);
  assert.deepEqual(errors,[]);results.push({engine:engine.name(),width,status:'PASS',nativeOSPermissionsTested:false});
 }finally{await context.close();await browser.close();f.close();}
}
writeFileSync(out+'/receipt.json',JSON.stringify({results,customerRecordsRead:false,customerRecordsChanged:false},null,2));console.log(JSON.stringify(results));
