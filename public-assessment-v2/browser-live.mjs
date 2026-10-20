import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
const root=process.env.ASSESSMENT_RELEASE_DIR,origin=process.env.ASSESSMENT_BROWSER_ORIGIN,out=process.env.ASSESSMENT_BROWSER_EVIDENCE;
assert(origin&&out&&root);await fs.mkdir(out,{recursive:true});
const catalogue=JSON.parse(await fs.readFile(root+'/catalogue-live.json','utf8'));
const names={mounjaro:'Mounjaro',wegovy:'Wegovy injection','wegovy-tablet':'Wegovy tablets',foundayo:'Foundayo',orlistat:'Orlistat',liraglutide:'Liraglutide'};
const result={origin,cases:[],errors:[],inheritedPreviewServiceWorkerErrors:[],clinicalOrPaymentRequests:0,limits:['Fictional assessment inputs only; no clinical submission or payment','Mobile-width WebKit is not a physical iPhone']};
for(const[engine,width]of[[chromium,390],[chromium,1440],[webkit,390]]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
 page.on('pageerror',error=>{const knownPreviewRegistration=origin.endsWith('.projectshift.pages.dev')&&error.message===new URL(origin).pathname+new URL(origin).hostname+'/service-worker-v3a.js?v=cos-live-recovery-20260909-r2 due to access control checks.';if(knownPreviewRegistration)result.inheritedPreviewServiceWorkerErrors.push({message:error.message,assetUnchanged:true});else result.errors.push(error.message);});
 page.on('request',r=>{if(/\/v1\/(?:commerce\/medicine-checkout|commerce\/medicine-clinical|pharmacy\/|clinical\/)/.test(r.url()))result.clinicalOrPaymentRequests++;});
 await page.goto(origin+'/treatment-centre',{waitUntil:'load'});await page.locator('[data-shift-assessment-entry] a[href="/medicine-preference"]').click();await page.locator('#dose').waitFor();
 for(const[key,name]of Object.entries(names)){
  await page.locator('[data-product="'+key+'"]').click();const p=catalogue.products.find(x=>x.name===name);assert(p);assert.equal(p.status,'out_of_stock');
  for(const v of p.variants){await page.locator('#dose').selectOption(v.strengthLabel);assert.equal(await page.locator('#price').textContent(),'£'+(v.pricePence/100).toFixed(2));assert.equal(v.status,'out_of_stock');assert(await page.locator('#start').isDisabled());assert.equal(await page.locator('#supply').textContent(),'OUT OF STOCK');}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow');
  assert.match(await page.locator('.prescribing-notice').first().innerText(),/prescriber/);
  assert.doesNotMatch(await page.locator('body').innerText(),/must be (?:stated|clearly)|Production photography|proposed service terms|API documentation|PRIVATE PREVIEW/);
  await page.locator('#preview-assessment').click();await page.locator('#demoMedicine').waitFor();assert.equal(await page.locator('#demoMedicine').inputValue(),key);
  await page.getByRole('button',{name:'Show fictional starting case'}).click();await page.getByRole('button',{name:'Review clinical answers'}).click();assert.match(await page.locator('#clinicalSummary').textContent(),new RegExp(name==='Orlistat'?'Orlistat capsules':name==='Foundayo'?'Foundayo tablets':name));
  assert.match(await page.locator('body').innerText(),/fictional/i);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  result.cases.push({engine:engine.name(),width,product:name,prices:p.variants.length,allOOS:true,preferenceInHandover:true});
  await page.goto(origin+'/medicine-preference',{waitUntil:'domcontentloaded'});await page.locator('#dose').waitFor();
 }
 await page.screenshot({path:out+'/'+engine.name()+'-'+width+'.png',fullPage:true});await browser.close();
}
assert.deepEqual(result.errors,[]);assert.equal(result.clinicalOrPaymentRequests,0);
await fs.writeFile(out+'/receipt.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({origin,cases:result.cases.length,variants:29,errors:result.errors,clinicalOrPaymentRequests:result.clinicalOrPaymentRequests}));
