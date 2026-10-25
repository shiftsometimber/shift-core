import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {livePresentation,liveAppClient as expectedLiveAppClient} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/app-layout-live.mjs';
import {memberDesignClient} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/member-design.mjs';
import {tabClient} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/preview/app-layout/tabs.mjs';
import {memberChromeStyles,memberNavigation} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/member-experience/chrome.mjs';
import {withAccountDeletion,accountDeletionRuntime as expectedDeletionRuntime} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/member-experience/account-deletion.mjs';
import {client as expectedPwaClient} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/my-timber-pwa/ui.mjs';
import {card} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/my-timber-pwa/presentation.mjs';
import {deviceHealthRuntime} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/member-experience/device-health-client.mjs';
import {fitActiveEditAsset} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/shift-coach/fit-active-edit.mjs';
import {memberImageViewerRuntime} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/shift-coach/member-image-viewer.mjs';
import {assertAppClient} from 'file:///Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/release/app-client-proof.mjs';
const expectedSource='8ad691488cd003c899f4c8cfbb7439a97f8a3e49';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedSource);
const deployedSource=process.env.VERIFIED_MY_TIMBER_DEPLOYMENT_SOURCE;assert.match(deployedSource||'',/^[a-f0-9]{40}$/,'Run only with the verified guarded deployment source');execFileSync('git',['merge-base','--is-ancestor',expectedSource,deployedSource]);
const delivered=[];
async function asset(path,expected,compare){const response=await fetch('https://shiftsometimber.co.uk'+path,{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,path);const body=await response.text();if(compare)compare(body,expected);else assert.equal(body,expected,path+' exact deployed bytes');delivered.push({path,sha256:createHash('sha256').update(body).digest('hex'),comparison:compare?'original assertAppClient: exact bytes outside canonical compiled first-week function':'exact bytes'});return body;}
const liveAppClient=await asset('/assets/my-timber-layout.mjs',fitActiveEditAsset(expectedLiveAppClient)+memberImageViewerRuntime,assertAppClient);
const accountDeletionRuntime=await asset('/assets/member-experience/account-deletion.mjs',expectedDeletionRuntime);
const pwaClient=await asset('/assets/my-timber-pwa.js',expectedPwaClient);
const deliveredAdapter=await asset('/api-adapter-v33d.js',readFileSync('/Users/shiftsometimberltd/SST/my-timber-joined-2daf-20261025/frontend/member/api-adapter-v33d.js','utf8'));

const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const native=execFileSync('git',['show','fbcc7b2f561e22d7dca548c250fc5f3c2a42871c:my-timber-app/shared/native-presentation.js'],{encoding:'utf8'});
const out=process.env.PROOF_DIR||'/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/immediate-deletion-proof/live-delivered-browser';mkdirSync(out,{recursive:true});
const receipt={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingDiffSha256:createHash('sha256').update(execFileSync('git',['diff','--binary','HEAD'])).digest('hex'),deployedSource,physicalDevice:false,productionWrites:0,deliveredAssets:delivered,productionAuthenticatedDeletionPerformed:false,results:[]};
for(const [engine,type]of [['webkit',webkit],['chromium',chromium]]){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
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
  html=compose(template('<div id="todayActions" class="app-today-v3">'+shortcuts+'</div>','dashboard'),'/member/dashboard',liveAppClient);
  await page.goto('https://shiftsometimber.co.uk/member/dashboard');
  await page.waitForFunction(()=>!!document.getElementById('appToolPanels'));
  assert.equal(await page.locator('.app-today-shortcuts').isVisible(),false);
  for(const tool of ['grub','fit']){
   await page.locator('#appBottomNav a[data-app-open="'+tool+'"]').click();
   await page.locator('#appTool-'+tool+' iframe').waitFor({state:'visible'});
   await page.waitForFunction(tool=>document.querySelector('#appBottomNav a[data-app-open="'+tool+'"]')?.getAttribute('aria-current')==='page',tool);
  }
  receipt.results.push({engine,case:'dashboard duplicate tabs hidden; bottom Grub and Fit still switch panels',pass:true});

  html=compose(withAccountDeletion(template('<h1>Settings</h1><section class="tracker-card"><h2>Other setting</h2></section>'))).replace('</body>',scripts('window.deletionCalls=0;window.SST_API={deleteAccount:async()=>{window.deletionCalls++;return {ok:true,status:"deleted",accountClosed:true}}};')+scripts(accountDeletionRuntime)+'</body>');
  await page.goto('https://shiftsometimber.co.uk/member/settings');
  await page.locator('#accountDeletionOpen').click();await page.locator('#accountDeletionConfirm').check();await page.locator('#accountDeletionForm button[type="submit"]').click();
  await page.waitForFunction(()=>document.getElementById('accountDeletionStatus')?.dataset.state==='deleted');
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#accountDeletionStatus').isVisible(),true);
  assert.equal(await page.locator('#accountDeletionStatus').evaluate(n=>!!n.closest('details:not([open])')),false);
  assert.match(await page.locator('#accountDeletionStatus').innerText(),/account has been deleted/);
  assert.equal(await page.locator('#appBottomNav').count(),0);
  assert.equal(await page.locator('.sst-member-tabs').count(),0);
  assert.equal(await page.locator('#accountDeletionSignIn').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.deletionCalls),1);
  await page.screenshot({path:out+'/'+engine+'-deletion-received.png',fullPage:true});
  receipt.results.push({engine,case:'immediate deletion confirmation remains visible; sign-in link; authenticated controls removed; one request',pass:true});
  html=compose(withAccountDeletion(template('<h1>Settings</h1>'))).replace('</body>',scripts('window.SST_API={deleteAccount:async()=>{throw Object.assign(Error("expired"),{status:401})}};')+scripts(accountDeletionRuntime)+'</body>');
  await page.goto('https://shiftsometimber.co.uk/member/settings');await page.locator('#accountDeletionOpen').click();await page.locator('#accountDeletionConfirm').check();await page.locator('#accountDeletionForm button[type="submit"]').click();
  await page.waitForFunction(()=>document.getElementById('accountDeletionStatus')?.dataset.state==='error');
  assert.equal(await page.locator('#accountDeletionSignIn').isVisible(),true);assert.equal(await page.locator('#appBottomNav').count(),1);
  assert.equal(await page.locator('#accountDeletionForm button[type="submit"]').isEnabled(),true);
  receipt.results.push({engine,case:'failed deletion stays retryable and does not claim receipt',pass:true});
  // Actual delivered browser adapter; every request is fulfilled locally.
  await page.unroute('**/*');let adapterCalls=0,adapterStatus=200;
  await page.route('**/*',async route=>{
   if(new URL(route.request().url()).pathname==='/v1/privacy/account'){
    adapterCalls++;assert.equal(route.request().method(),'DELETE');assert.deepEqual(route.request().postDataJSON(),{confirmation:'DELETE_MY_ACCOUNT'});
    return route.fulfill({status:adapterStatus,contentType:'application/json',body:JSON.stringify(adapterStatus===200?{ok:true,status:'deleted',accountClosed:true}:{ok:false,error:'unauthorized'})});
   }
   return route.fulfill({status:200,contentType:route.request().isNavigationRequest()?'text/html':'text/javascript',body:route.request().isNavigationRequest()?html:''});
  });
  html='<html><head></head><body><h1>Fictional adapter fixture</h1>'+scripts('window.SST_API_BASE=location.origin;')+scripts(deliveredAdapter)+'</body></html>';
  await page.goto('https://shiftsometimber.co.uk/member/settings');
  const adapterSuccess=await page.evaluate(()=>window.SST_API.deleteAccount());assert.equal(adapterSuccess.accountClosed,true);assert.equal(adapterCalls,1);
  adapterStatus=401;const adapterError=await page.evaluate(async()=>{try{await window.SST_API.deleteAccount();return {unexpectedSuccess:true}}catch(error){return {status:error.status}}});assert.equal(adapterError.status,401);assert.equal(adapterCalls,2);
  receipt.results.push({engine,case:'delivered account adapter sends explicit DELETE confirmation once per action; preserves 401 without destructive replay',pass:true});
  assert.deepEqual(errors,[],engine+' JS errors');
 }finally{await browser.close();}
}
writeFileSync(out+'/receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
