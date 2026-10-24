// Isolated synthetic browser acceptance. All URLs are intercepted; no live API,
// account, health record, email, consent write or other production mutation.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {quickLogClient,quickLogStyles} from '../quick-log.mjs';
const require=createRequire(process.cwd()+'/package.json');
const engines=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const results=[],screenshots=[];
const proofDirectory=process.env.QUICK_LOG_PROOF_DIR||'/tmp/my-timber-quick-log-proof-20261024';
await mkdir(proofDirectory,{recursive:true});
const html='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-member-design="20261001" data-member-page="dashboard" data-member-session="ready" style="background:#050505;color:#e7e3da"><header id="todayBrand">MY TIMBER</header><main><section id="panel-today"><button data-mt-quick-log>Log your day</button><div id="todayActions"></div></section><a class="mp-tab" data-panel="today" href="#today">Today</a><a class="mp-tab" data-panel="visualise" href="#visualise">Journey</a></main></body></html>';
async function setup(browser,width){
 const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Europe/London'});
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**',async route=>{
  const u=new URL(route.request().url());
  if(u.origin==='https://shift.test'&&u.pathname==='/member/dashboard')return route.fulfill({status:200,contentType:'text/html',body:html});
  if(u.origin==='https://shift.test'&&u.pathname==='/v1/settings/units'&&route.request().method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:'{"units":{"weight":"kg","height":"cm"}}'});
  return route.abort('blockedbyclient');
 });
 await page.goto('https://shift.test/member/dashboard#today');
 await page.evaluate(()=>{
  window.fixture={id:7,ensure:true,granted:true,paused:false,postMode:'ok',summaryFail:false,summaryWithdrawal:false,posts:[],summaryReads:0,events:[],refreshToday:0};
  const getMe=async()=>{if(window.fixture.expired)throw Object.assign(Error('expired'),{status:401});return{user:{id:window.fixture.id}};};
  window.SST_HEALTH_CONSENT={ensure:async()=>window.fixture.ensure};
  window.SST_API={getMe,getConsents:async()=>({consents:[{id:10,consent_type:'my_shift_health_tracking',granted:window.fixture.granted?1:0}]}),getMyJourney:async()=>({ok:true,journey:{setup:{complete:false,paused:window.fixture.paused}}}),saveProgress:async payload=>{window.fixture.posts.push(payload);if(window.fixture.postMode==='timeout')throw Object.assign(Error('timeout'),{code:'timeout'});return{ok:true};},getProgressSummary:async()=>{window.fixture.summaryReads++;if(window.fixture.summaryFail)throw Error('offline');if(window.fixture.summaryWithdrawal)window.fixture.granted=false;return{progress:{state:'ready',metrics:[{key:'weight',latest:93.2,series:[{on:new Date().toISOString().slice(0,10),value:93.2}]}]}};}};
  document.addEventListener('sst:progress-saved',event=>window.fixture.events.push(event.detail));
  document.addEventListener('sst:refresh-today',()=>window.fixture.refreshToday++);
 });
 await page.addStyleTag({content:quickLogStyles});await page.addScriptTag({content:quickLogClient});
 return{page,context,errors};
}
async function visible(page,selector){await page.waitForSelector(selector,{state:'visible'});}
async function open(page){await page.click('[data-mt-quick-log]');await visible(page,'#mtQuickLog[open]');}
async function note(page,text='Stairs felt easier.') {await page.locator('#mtQuickLog summary').filter({hasText:'Add a note'}).click();await page.fill('#mtQuickLog textarea',text);}
for(const name of (process.env.QUICK_LOG_ENGINES||'chromium,webkit').split(',')){
 const browser=await engines[name].launch({headless:true});
 try{for(const width of [390,1440]){
  const cases=[
   ['save, actual summary receipt and returned Today',async page=>{
    await open(page);await page.fill('[name="weight"]','93.2');await note(page);await page.click('#mtQuickLog [type="submit"]');
    await page.waitForSelector('#mtQuickLog',{state:'hidden'});await visible(page,'#mtQuickLogSavedStatus');
    assert.equal((await page.locator('#mtQuickLogSavedStatus').innerText()).replace(/\s+/g,' ').trim(),'Your log is saved. View Journey');
    assert.equal(await page.locator('#mtQuickLogSavedStatus a').getAttribute('href'),'/member/dashboard#visualise');
    const f=await page.evaluate(()=>window.fixture);assert.equal(f.posts.length,1);assert.equal(f.posts[0].weightKg,93.2);assert.equal(f.posts[0].notes,'Stairs felt easier.');assert.equal(f.events.length,1);assert.equal(f.summaryReads,1);assert.equal(f.refreshToday,1);
    await page.click('#mtQuickLogSavedStatus a');assert.equal(new URL(page.url()).hash,'#visualise');
   }],
   ['unit conversion, keyboard draft recovery and compact target',async page=>{
    await page.dblclick('[data-mt-quick-log]');await visible(page,'#mtQuickLog[open]');await page.fill('[name="weight"]','93.2');
    const screenshot=join(proofDirectory,name+'-'+width+'-quick-log.png');await page.screenshot({path:screenshot,fullPage:true});screenshots.push(screenshot);
    await page.selectOption('[name="weightUnit"]','lb');assert.ok(Math.abs(Number(await page.inputValue('[name="weight"]'))-205.471)<.002);
    await page.selectOption('[name="weightUnit"]','stone_lb');assert.equal(await page.inputValue('[name="weightStone"]'),'14');
    assert.ok(Math.abs(Number(await page.inputValue('[name="weightPounds"]'))-9.471)<.002);
    const rect=await page.locator('#mtQuickLog [type="submit"]').boundingBox();assert.ok(rect.height>=44);assert.ok(await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('#mtQuickLog [type="submit"]')).fontSize))>=19);
    const unitTarget=await page.locator('#mtQuickLog [name="weightUnit"]').boundingBox();assert.ok(unitTarget.height>=44,'Unit selector must remain a comfortable44px target');
    for(let n=0;n<12;n++){await page.keyboard.press('Tab');const focus=await page.evaluate(()=>({inside:!!document.activeElement.closest('#mtQuickLog'),active:document.activeElement.outerHTML.slice(0,350),controls:[...document.querySelectorAll('#mtQuickLog a[href],#mtQuickLog button,#mtQuickLog input,#mtQuickLog select,#mtQuickLog textarea,#mtQuickLog summary')].filter(control=>!control.disabled&&control.getClientRects().length).map(control=>({tag:control.tagName,name:control.name,text:control.textContent.slice(0,50)}))}));assert.equal(focus.inside,true,JSON.stringify({engine:name,width,tab:n+1,focus}));}
    for(let n=0;n<12;n++){await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#mtQuickLog')),true,'Reverse keyboard navigation stays in the modal');}
    await page.keyboard.press('Escape');await page.waitForSelector('#mtQuickLog',{state:'hidden'});await open(page);assert.equal(await page.inputValue('[name="weightStone"]'),'14');
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
   }],
   ['declining optional consent preserves draft and sends nothing',async page=>{
    await page.evaluate(()=>window.fixture.ensure=false);await open(page);await note(page,'Only a note.');await page.click('#mtQuickLog [type="submit"]');
    await page.waitForFunction(()=>document.querySelector('#mtQuickLog .mtql-status').textContent.includes('Nothing saved'));
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);assert.equal(await page.inputValue('#mtQuickLog textarea'),'Only a note.');
   }],
   ['acknowledged save refresh failure retries only summary',async page=>{
    await page.evaluate(()=>window.fixture.summaryFail=true);await open(page);await note(page);await page.click('#mtQuickLog [type="submit"]');
    await page.waitForFunction(()=>document.querySelector('#mtQuickLog [type="submit"]').textContent==='Retry summary');
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),1);assert.equal(await page.locator('#mtQuickLogSavedStatus').count(),0);
    await page.evaluate(()=>window.fixture.summaryFail=false);await page.click('#mtQuickLog [type="submit"]');await visible(page,'#mtQuickLogSavedStatus');assert.equal(await page.evaluate(()=>window.fixture.posts.length),1);
   }],
   ['unconfirmed network save cannot silently repeat',async page=>{
    await page.evaluate(()=>window.fixture.postMode='timeout');await open(page);await note(page);await page.click('#mtQuickLog [type="submit"]');
    await visible(page,'[data-mtql-checked]');assert.equal(await page.locator('#mtQuickLog [type="submit"]').isDisabled(),true);
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),1);assert.equal(await page.locator('#mtQuickLogSavedStatus').count(),0);
    await page.click('[data-mtql-checked]');assert.equal(await page.evaluate(()=>window.fixture.posts.length),1);assert.equal(await page.locator('#mtQuickLog [type="submit"]').isEnabled(),true);
   }],
   ['account change clears private draft and gives visible recovery',async page=>{
    await open(page);await note(page,'Private first-account note.');await page.evaluate(()=>window.fixture.id=8);await page.click('#mtQuickLog [type="submit"]');
    await visible(page,'#mtQuickLogRecovery');assert.match(await page.locator('#mtQuickLogRecovery').innerText(),/account changed/);assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
    await page.click('#mtQuickLogRecovery button');await visible(page,'#mtQuickLog[open]');assert.equal(await page.inputValue('#mtQuickLog textarea'),'');
   }]
  ];
  for(const[label,run]of cases){const{page,context,errors}=await setup(browser,width);try{await run(page);assert.deepEqual(errors,[]);results.push({engine:name,width,case:label,pass:true});}finally{await context.close();}}
 }}finally{await browser.close();}
}
console.log(JSON.stringify({kind:'ISOLATED_QUICK_LOG_BROWSER_ACCEPTANCE',at:new Date().toISOString(),live:false,synthetic:true,productionWrites:0,cases:results.length,results,screenshots},null,2));
