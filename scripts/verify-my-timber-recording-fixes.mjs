import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {livePresentation,liveAppClient} from '../app-layout-live.mjs';
import {memberDesignClient} from '../member-design.mjs';
import {tabClient} from '../preview/app-layout/tabs.mjs';
import {memberChromeStyles,memberNavigation} from '../member-experience/chrome.mjs';
import {withAccountDeletion,accountDeletionRuntime} from '../member-experience/account-deletion.mjs';
import {client as pwaClient} from '../my-timber-pwa/ui.mjs';
import {card} from '../my-timber-pwa/presentation.mjs';
import {deviceHealthRuntime} from '../member-experience/device-health-client.mjs';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const native=execFileSync('git',['show','fbcc7b2f561e22d7dca548c250fc5f3c2a42871c:my-timber-app/shared/native-presentation.js'],{encoding:'utf8'});
const out=process.env.PROOF_DIR||'/tmp/my-timber-recording-browser-proof-20261024';mkdirSync(out,{recursive:true});
const receipt={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingDiffSha256:createHash('sha256').update(execFileSync('git',['diff','--binary','HEAD'])).digest('hex'),physicalDevice:false,productionWrites:0,results:[]};
for(const [engine,type]of [['webkit',webkit],['chromium',chromium]]){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html='';await page.route('**/*',route=>route.fulfill({status:200,contentType:route.request().isNavigationRequest()?'text/html':'text/javascript',body:route.request().url().includes('app_panel=1')?'<html><body><main>Isolated tool fixture</main></body></html>':route.request().isNavigationRequest()?html:''}));
  const template=(main,pageName='settings')=>'<html><head><style>'+memberChromeStyles+'</style></head><body data-member-chrome="v1" data-member-page="'+pageName+'"><nav class="sst-member-tabs">'+memberNavigation()+'</nav>'+card+'<main>'+main+'</main></body></html>';
  const scripts=code=>'<script>'+code+'</script>';
  const compose=(source,path='/member/settings',runtime=liveAppClient)=>livePresentation(source,path).replace('</body>',scripts(native)+scripts(runtime)+'</body>');
  html=compose(template('<h1>Settings</h1>')).replace('</body>',scripts(pwaClient)+'</body>');await page.goto('https://shiftsometimber.co.uk/member/settings');
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#myTimberApp').isVisible(),false,engine+' native install card');
  assert.equal(await page.locator('nav.sst-member-tabs').isVisible(),false);
  await page.locator('#appMore').click();
  assert.equal(await page.locator('nav.sst-member-tabs').isVisible(),true);
  for(const href of ['/member/dashboard#today','/member/dashboard#journey','/member/grub','/member/fit'])assert.equal(await page.locator('nav.sst-member-tabs a[href="'+href+'"]').isVisible(),false,href);
  await page.locator('nav.sst-member-tabs a[href="/member/life-back"]').waitFor({state:'visible'});
  assert.equal(await page.locator('nav.sst-member-tabs a[href="/member/check-in"]').isVisible(),true);
  await page.screenshot({path:out+'/'+engine+'-more.png',fullPage:true});
  await page.keyboard.press('Escape');assert.equal(await page.locator('nav.sst-member-tabs').isVisible(),false);
  receipt.results.push({engine,case:'native install hidden; single primary navigation; More links and Escape',pass:true});
  const shortcuts='<nav class="app-today-shortcuts"><a href="/member/dashboard#today">Today</a><a href="/member/fit">Fit</a><a href="/member/grub">Grub</a><a href="/member/life-back">Life Back</a></nav>';
  html=compose(template('<div id="todayActions" class="app-today-v3">'+shortcuts+'</div>','dashboard'),'/member/dashboard',tabClient+memberDesignClient);
  await page.goto('https://shiftsometimber.co.uk/member/dashboard');
  await page.waitForFunction(()=>!!document.getElementById('appToolPanels'));
  assert.equal(await page.locator('.app-today-shortcuts').isVisible(),false);
  for(const tool of ['grub','fit']){
   await page.locator('#appBottomNav a[data-app-open="'+tool+'"]').click();
   await page.locator('#appTool-'+tool+' iframe').waitFor({state:'visible'});
   assert.equal(await page.locator('#appBottomNav a[data-app-open="'+tool+'"]').getAttribute('aria-current'),'page');
  }
  receipt.results.push({engine,case:'dashboard duplicate tabs hidden; bottom Grub and Fit still switch panels',pass:true});

  html=compose(withAccountDeletion(template('<h1>Settings</h1><section class="tracker-card"><h2>Other setting</h2></section>'))).replace('</body>',scripts('window.deletionCalls=0;window.SST_API={deleteAccount:async()=>{window.deletionCalls++;return {ok:true,status:"received"}}};')+scripts(accountDeletionRuntime)+'</body>');
  await page.goto('https://shiftsometimber.co.uk/member/settings');
  await page.locator('#accountDeletionOpen').click();await page.locator('#accountDeletionConfirm').check();await page.locator('#accountDeletionForm button[type="submit"]').click();
  await page.waitForFunction(()=>document.getElementById('accountDeletionStatus')?.dataset.state==='received');
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#accountDeletionStatus').isVisible(),true);
  assert.equal(await page.locator('#accountDeletionStatus').evaluate(n=>!!n.closest('details:not([open])')),false);
  assert.match(await page.locator('#accountDeletionStatus').innerText(),/awaiting review/);
  assert.equal(await page.locator('#appBottomNav').count(),0);
  assert.equal(await page.locator('.sst-member-tabs').count(),0);
  assert.equal(await page.locator('#accountDeletionSignIn').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.deletionCalls),1);
  await page.screenshot({path:out+'/'+engine+'-deletion-received.png',fullPage:true});
  receipt.results.push({engine,case:'deletion receipt remains visible; sign-in link; authenticated controls removed; one request',pass:true});
  html=compose(withAccountDeletion(template('<h1>Settings</h1>'))).replace('</body>',scripts('window.SST_API={deleteAccount:async()=>{throw Object.assign(Error("expired"),{status:401})}};')+scripts(accountDeletionRuntime)+'</body>');
  await page.goto('https://shiftsometimber.co.uk/member/settings');await page.locator('#accountDeletionOpen').click();await page.locator('#accountDeletionConfirm').check();await page.locator('#accountDeletionForm button[type="submit"]').click();
  await page.waitForFunction(()=>document.getElementById('accountDeletionStatus')?.dataset.state==='error');
  assert.equal(await page.locator('#accountDeletionSignIn').isVisible(),true);assert.equal(await page.locator('#appBottomNav').count(),1);
  assert.equal(await page.locator('#accountDeletionForm button[type="submit"]').isEnabled(),true);
  receipt.results.push({engine,case:'failed deletion stays retryable and does not claim receipt',pass:true});
  // Synthetic health bridge only: no phone permissions or personal Health reads.
  await page.unroute('**/*');let healthState={accountId:42,trackingEnabled:true,readings:[],permissions:{},limit:500},reads=0;
  await page.route('**/*',async route=>{
   if(route.request().url().includes('/v1/device-health')){const data=route.request().postDataJSON();if(data?.action==='connect')healthState.permissions.apple_health=true;if(data?.action==='import')healthState.readings=data.readings;return route.fulfill({contentType:'application/json',body:JSON.stringify(healthState)});}
   return route.fulfill({contentType:route.request().isNavigationRequest()?'text/html':'text/javascript',body:route.request().isNavigationRequest()?html:''});
  });
  html=template('<div id="deviceHealth"></div>');html=html.replace('</body>',scripts('window.healthRequests=0;window.SST_NATIVE_HEALTH={platform:"apple_health",request:async()=>{window.healthRequests++;return {readings:[{id:"synthetic-weight",kind:"weight",weightKg:93.2,at:"2026-10-24T12:00:00Z",source:"Isolated fixture"}]}}};')+scripts(deviceHealthRuntime)+'</body>');
  await page.goto('https://shiftsometimber.co.uk/member/settings');await page.getByRole('button',{name:'Preview Apple Health readings'}).click();assert.equal(await page.evaluate(()=>window.healthRequests),0);
  await page.locator('#deviceHealth input[type="checkbox"]').check();await page.getByRole('button',{name:'Preview Apple Health readings'}).click();await page.getByRole('button',{name:'Save selected readings'}).waitFor();assert.equal(healthState.readings.length,0);
  await page.getByRole('button',{name:'Save selected readings'}).click();await page.waitForFunction(()=>document.querySelector('#deviceHealth [role="status"]')?.textContent.includes('Selected readings saved'));
  assert.equal(healthState.readings.length,1);assert.equal(await page.evaluate(()=>window.healthRequests),1);
  receipt.results.push({engine,case:'synthetic Apple Health preview requires consent and saves only after selection',pass:true});
  assert.deepEqual(errors,[],engine+' JS errors');
 }finally{await browser.close();}
}
writeFileSync(out+'/receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
