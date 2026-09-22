import {chromium,webkit} from 'playwright';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.env.PREVIEW_URL;
assert.equal(origin,'https://shift-stabilisation-preview.matobrien.workers.dev');
const dir='work/staging/generated/review-evidence';mkdirSync(dir,{recursive:true});
const report={source:process.env.PREVIEW_SOURCE_SHA,previewOnly:true,physicalDevices:false,cases:[],failures:[],liveNhs:null};
const lookup=origin+'/v1/member/details/gp-search**';
const result=name=>({practices:[{name,postcode:'SK10 1AA',code:'A12345'}]});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const values=page=>page.evaluate(()=>Object.fromEntries([...new FormData(document.querySelector('#assessment'))].filter(([,v])=>typeof v==='string')));
async function start(page){await page.goto(origin+'/__review',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Start a fictional member preview'}).click();await page.waitForURL('**/member/settings#memberDetailsPanel');await page.goto(origin+'/__review/gp-form',{waitUntil:'domcontentloaded'});await page.locator('#assessmentGpLookup').waitFor();}
for(const [name,engine,size]of [['chromium-desktop',chromium,{width:1365,height:900}],['chromium-phone',chromium,{width:390,height:844}],['webkit-desktop',webkit,{width:1365,height:900}],['webkit-phone',webkit,{width:390,height:844}]]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await context.newPage(),row={name,checks:[],errors:[],status:'running'};report.cases.push(row);
 const external=[];page.on('pageerror',e=>row.errors.push(e.message));await page.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(new URL(route.request().url()).host);return route.abort();}return route.continue();});
 try{
  await start(page);const practice=page.locator('[name="gpPractice"]'),postcode=page.locator('[name="gpPostcode"]');
  assert(await page.locator('#assessment button[type="submit"]').isDisabled());assert.equal(await page.locator('script[src^="/treatment-assessment.js"]').count(),0);
  await page.fill('[name="gpName"]','Fictional doctor');await page.fill('[name="gpAddress"]','1 Fictional Surgery');const before=await values(page);
  await page.route(lookup,route=>route.fulfill({json:result('Fictional safe practice')}));await practice.fill('Fictional');await page.locator('#assessmentGpSelect option').nth(1).waitFor({state:'attached'});await page.selectOption('#assessmentGpSelect','0');
  assert.equal(await practice.inputValue(),'Fictional safe practice');assert.equal(await postcode.inputValue(),'SK10 1AA');const after=await values(page);delete before.gpPractice;delete before.gpPostcode;delete after.gpPractice;delete after.gpPostcode;assert.deepEqual(after,before);assert.match(await page.locator('#assessmentGpHelp').innerText(),/Registration is not verified/);
  row.checks.push('Explicit selection fills only practice name/postcode; other answers and consents unchanged');await page.unroute(lookup);
  let release,arrived;const pending=new Promise(r=>release=r),seen=new Promise(r=>arrived=r);
  await page.route(lookup,async route=>{arrived();await pending;await route.fulfill({json:result('Stale practice')}).catch(()=>{});});await practice.fill('Stale');await seen;await postcode.fill('SK10 9ZZ');release();await pause(200);assert(await page.locator('#assessmentGpChoice').isHidden());assert.equal(await postcode.inputValue(),'SK10 9ZZ');row.checks.push('A delayed directory response cannot replace manually edited details');await page.unroute(lookup);
  await page.route(lookup,route=>route.fulfill({status:503,json:{message:'Directory temporarily unavailable. Enter details manually.'}}));await practice.fill('Unavailable');await page.getByText('Directory temporarily unavailable. Enter details manually.',{exact:true}).waitFor();assert.equal(await practice.inputValue(),'Unavailable');assert.equal(await postcode.inputValue(),'SK10 9ZZ');assert(await page.locator('#assessmentGpChoice').isHidden());row.checks.push('Provider outage retains inputs and exposes manual fallback');await page.unroute(lookup);
  await page.route(lookup,route=>route.fulfill({status:401,json:{error:'not_authenticated'}}));await practice.fill('Expired');await page.waitForFunction(()=>document.querySelector('#assessmentGpHelp').textContent.includes('Sign in to My Timber'));assert.equal(await practice.inputValue(),'Expired');row.checks.push('Expired sign-in does not enable anonymous directory proxy or erase typed fields');await page.unroute(lookup);
  await page.route(lookup,route=>route.fulfill({json:result('<img src=x onerror=alert(1)>')}));await practice.fill('Literal');await page.locator('#assessmentGpSelect option').nth(1).waitFor({state:'attached'});assert.equal(await page.locator('#assessmentGpLookup img').count(),0);assert.match(await page.locator('#assessmentGpSelect option').nth(1).textContent(),/<img/);row.checks.push('Directory labels remain literal text, never executable markup');await page.unroute(lookup);
  await practice.focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'assessmentGpSelect');row.checks.push('Tab from the GP practice field focuses the visible native directory selector');
  if(name==='chromium-desktop'){
   await practice.fill('Blackdown');await pause(850);await page.waitForFunction(()=>!document.querySelector('#assessmentGpHelp').textContent.includes('Searching'),null,{timeout:12000});
   report.liveNhs={available:await page.locator('#assessmentGpChoice').isVisible(),message:await page.locator('#assessmentGpHelp').innerText()};
   if(report.liveNhs.available){await page.selectOption('#assessmentGpSelect','0');report.liveNhs.selected=await practice.inputValue();report.liveNhs.postcode=await postcode.inputValue();}
  }
  row.geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,widget:document.querySelector('#assessmentGpLookup').getBoundingClientRect().toJSON()}));
  assert(row.geometry.document<=row.geometry.viewport+1,JSON.stringify(row.geometry));assert.deepEqual(external,[]);assert.deepEqual(row.errors,[]);
  await page.screenshot({path:dir+'/gp-form-'+name+'.png',fullPage:true});row.status='pass';
 }catch(e){row.status='fail';row.error=String(e.stack||e);report.failures.push({name,error:row.error});await page.screenshot({path:dir+'/gp-form-'+name+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{await context.close();await browser.close();writeFileSync(dir+'/gp-form-browser.json',JSON.stringify(report,null,2));}
}
console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
