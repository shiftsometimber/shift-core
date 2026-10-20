import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';
import {deviceHealthRoutes} from '../../member-experience/device-health.mjs';
import {deviceHealthRuntime,deviceHealthStyles} from '../../member-experience/device-health-client.mjs';
import {deviceHealthSyncRuntime} from '../../member-experience/device-health-sync-client.mjs';
const {chromium,webkit}=createRequire(import.meta.url)('playwright');
const out=process.env.HEALTH_PROOF_OUT||'work/health-autosync/browser';mkdirSync(out,{recursive:true});
const results=[];
for(const [engine,width,platform] of [[chromium,320,'apple_health'],[chromium,1440,'health_connect'],[webkit,390,'apple_health']]){
 const f=fixture(),browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage();
 let account=1;const errors=[],calls=[];
 const rows=[{id:'synthetic-scale-1',kind:'weight',at:new Date().toISOString(),weightKg:93.2,source:'Synthetic test scales'},{id:'synthetic-cuff-1',kind:'blood_pressure',at:new Date().toISOString(),systolic:128,diastolic:82,source:'Synthetic test cuff'},{id:'synthetic-watch-1',kind:'heart_rate',at:new Date().toISOString(),heartRate:78,source:'Synthetic test watch'}];
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(({rows,platform})=>{window.__nativeCalls=[];window.__syntheticReadings=rows;window.SST_NATIVE_HEALTH={platform,automaticImportVersion:1,requestAutomatic:async(account,kinds,askPermission)=>{window.__nativeCalls.push({account,kinds,askPermission});return{readings:askPermission?[]:window.__syntheticReadings.filter(r=>kinds.includes(r.kind))}},request:async()=>({readings:window.__syntheticReadings})};}, {rows,platform});
 const state=async id=>(await deviceHealthRoutes(new Request('https://shiftsometimber.co.uk/v1/device-health',{headers:{Cookie:'sst_session=test-only-member-'+id}}),f.env)).json();
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/v1/device-health'){
   if(req.method()==='POST')calls.push(JSON.parse(req.postData()).action);
   const response=await deviceHealthRoutes(new Request(url,{method:req.method(),headers:{Origin:url.origin,'Content-Type':'application/json',Cookie:'sst_session=test-only-member-'+account},...(req.method()==='POST'?{body:req.postData()}:{} )}),f.env);
   return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  }
  if(url.pathname==='/assets/sync.js')return route.fulfill({contentType:'text/javascript',body:deviceHealthSyncRuntime});
  if(url.pathname==='/assets/client.js')return route.fulfill({contentType:'text/javascript',body:deviceHealthRuntime});
  if(['/member/settings','/member/dashboard'].includes(url.pathname))return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic connection test</title><style>body{margin:16px;background:#e7e3da;color:#050505;font:16px/1.6 Arial}main{max-width:960px;margin:auto}'+deviceHealthStyles+'</style><main><h1>My Timber '+(url.pathname.endsWith('settings')?'Settings':'Today')+'</h1>'+(url.pathname.endsWith('settings')?'<section id="deviceHealth"></section>':'')+'</main><script defer src="/assets/sync.js"></script>'+(url.pathname.endsWith('settings')?'<script defer src="/assets/client.js"></script>':'')+'</html>'});
  return route.abort();
 });
 try{
  await page.goto('https://shiftsometimber.co.uk/member/settings');await page.getByRole('group',{name:'Automatic imports'}).waitFor();
  const panel=page.getByRole('group',{name:'Automatic imports'});
  assert.equal(await panel.getByRole('checkbox',{name:'Heart rate (optional)',exact:true}).isChecked(),false);
  await panel.getByRole('button',{name:/Connect /}).click();await page.getByRole('status').filter({hasText:'Agree to automatic imports first'}).waitFor();assert.deepEqual(calls,[]);
  await panel.getByRole('checkbox',{name:/I agree to automatic imports/}).check();await panel.getByRole('button',{name:/Connect /}).click();
  await page.getByRole('button',{name:'Sync now',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelectorAll('#deviceHealth li').length===2);
  assert.equal((await state(1)).readings.length,2);assert.equal((await state(1)).readings.some(r=>r.kind==='heart_rate'),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.evaluate(()=>document.body.style.fontSize='32px');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.evaluate(()=>document.body.style.fontSize='16px');
  await page.getByRole('button',{name:'Sync now',exact:true}).focus();assert.equal(await page.getByRole('button',{name:'Sync now',exact:true}).evaluate(e=>e===document.activeElement),true);
  await page.screenshot({path:out+'/settings-'+engine.name()+'-'+width+'.png',fullPage:true});
  // Opening Today after more than a minute automatically imports, without a save click.
  await page.addInitScript(()=>{const original=Date.now;Date.now=()=>original()+61000;});
  const before=calls.filter(x=>x==='sync').length;await page.goto('https://shiftsometimber.co.uk/member/dashboard');await page.waitForFunction(()=>window.__nativeCalls.length===1);await page.waitForTimeout(100);
  assert.equal(calls.filter(x=>x==='sync').length,before+1);assert.equal((await state(1)).readings.length,2);
  await page.evaluate(()=>window.dispatchEvent(new Event('sst-app-active')));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__nativeCalls.length),1);
  await page.goto('https://shiftsometimber.co.uk/member/settings');await page.getByRole('button',{name:'Sync now',exact:true}).waitFor();await page.getByRole('button',{name:'Sync now',exact:true}).click();await page.getByRole('status').filter({hasText:'checked and saved'}).waitFor();
  assert.equal((await state(1)).readings.length,2);
  await page.getByRole('button',{name:/^Disconnect .* imports$/}).click();await page.getByRole('status').filter({hasText:'Imports disconnected'}).waitFor();
  assert.equal((await state(1)).automaticSync[platform].enabled,false);assert.equal((await state(1)).readings.length,2);
  await page.reload();await page.getByRole('group',{name:'Automatic imports'}).waitFor();assert.equal(await page.getByRole('button',{name:'Sync now',exact:true}).count(),0);assert.equal(await page.evaluate(()=>window.__nativeCalls.length),0);
  account=2;await page.goto('https://shiftsometimber.co.uk/member/dashboard');await page.waitForTimeout(100);assert.equal((await state(2)).readings.length,0);assert.equal(await page.evaluate(()=>window.__nativeCalls.length),0);
  assert.deepEqual(errors,[]);results.push({engine:engine.name(),width,platform,status:'PASS',realSQLite:true,nativeOSPermissionsTested:false,physicalDevice:false});
 }finally{await context.close();await browser.close();f.close();}
}
writeFileSync(out+'/receipt.json',JSON.stringify({results,syntheticDataOnly:true,productionWrites:0},null,2));console.log(JSON.stringify(results));
