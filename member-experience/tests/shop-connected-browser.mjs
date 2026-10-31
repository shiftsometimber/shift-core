// Offline acceptance: every browser request is intercepted. Captured public
// catalogue fixtures and synthetic accounts only; no production writes/payments.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {shopPageRoutes} from '../shop-routes.mjs';
import {shopBase,shopNavigationAsset,withShopNavigation} from '../shop-navigation.mjs';
import {memberBasketRoutes,bindMemberBasket} from '../shop-basket.mjs';
import {memberExperienceRoutes} from '../entry.mjs';
import {journeyPageRoutes} from '../journey-page.mjs';
import {withSessionState} from '../session-state.mjs';
import {sixPageRecoveryRuntime} from '../six-page-recovery.mjs';
import {memberChromeStyles} from '../chrome.mjs';
import {memberDesignStyles} from '../../member-design.mjs';
import {fixture} from '../../health-passport/fixture.mjs';
import {wrapJourneyShopService} from '../journey-shop-release.mjs';

const require=createRequire(import.meta.url),engines=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.MY_TIMBER_BROWSER_ENGINE||'chromium';assert.ok(['chromium','webkit'].includes(engine));
const dir=process.env.MY_TIMBER_SHOP_FIXTURES;if(!dir)throw Error('Set MY_TIMBER_SHOP_FIXTURES to the captured public fixture directory.');
const out=process.env.MY_TIMBER_SHOP_PROOF||join(dir,'shop-browser-proof');mkdirSync(out,{recursive:true});
const fixtures=Object.fromEntries(['testing','testing-vitamin-d','nutrition','kit','kit-product','basket'].map(k=>[k,readFileSync(join(dir,'live-'+k+(k==='basket'?'.js':'.html')),'utf8')]));
const nativeScripts=process.env.MY_TIMBER_NATIVE_DIR?['native-presentation.js','ios-store-presentation.js'].map(name=>readFileSync(join(process.env.MY_TIMBER_NATIVE_DIR,name),'utf8')):[];
const images=process.env.MY_TIMBER_SHOP_IMAGES?JSON.parse(readFileSync(process.env.MY_TIMBER_SHOP_IMAGES,'utf8')):null;
const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},origin='https://shiftsometimber.co.uk',ownerA='a'.repeat(64),ownerB='b'.repeat(64),results=[];
const shared=bindMemberBasket(fixtures.basket);assert.ok(shared.includes('memberDecision'),'The captured serving extras client has its account-change guard.');
const browser=await engines[engine].launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']}: {})});
const publicRead=async request=>{
 const u=new URL(request.url);assert.equal(u.origin,origin);assert.equal(request.method,'GET');assert.deepEqual([...request.headers.keys()],['accept']);
 const key=u.pathname.includes('shift-purchase-basket')?'basket':u.pathname==='/shop'?(u.searchParams.has('item')?'kit-product':'kit'):u.pathname.includes('supplements')?'nutrition':u.pathname==='/shift-health/testing/vitamin-d'?'testing-vitamin-d':u.pathname==='/shift-health/testing'?'testing':null;
 if(!key)throw Error('Unexpected public fixture request: '+u.pathname);
 return new Response(fixtures[key],{headers:{'Content-Type':key==='basket'?'text/javascript':'text/html'}});
};
function existingPage(path){
 const isDashboard=path==='/member/dashboard',page=isDashboard?'dashboard':path.split('/').pop();
 return withSessionState('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#050505;color:#E7E3DA}'+memberChromeStyles+memberDesignStyles+'</style></head><body data-member-page="'+page+'" data-member-design="20261001" data-member-experience-ui="20261015"><header id="todayBrand" data-member-design-header><a href="/member/dashboard">MY TIMBER</a></header><nav id="appBottomNav">Existing native navigation</nav><nav class="sst-member-tabs">Legacy member navigation</nav><main><section id="previewMember" class="is-ready"><div id="todayActions"></div></section></main><script>'+sixPageRecoveryRuntime+'</script></body></html>');
}
async function setup(width){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],requests=[];
 const f=fixture({seed:false});f.db.exec('ALTER TABLE progress_entries ADD COLUMN notes TEXT');f.db.exec('UPDATE consents SET granted=1');context.on('close',()=>f.close());
 const service=wrapJourneyShopService({fetch:async()=>new Response('retained',{status:404})});
 const state={id:1,reference:ownerA,attempts:[],signedOut:false,held:null,release:null,meReads:0,meFailureAfter:Infinity};
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{window.SST_API_BASE=location.origin;window.SST_API={getMe:async()=>({user:{id:1}}),getMyJourney:async()=>({journey:{}}),getProgressSummary:async()=>({progress:{}}),getConsents:async()=>({consents:[]}),getUnits:async()=>({units:{weight:'kg'}}),getOrders:async()=>({orders:[]})};});
 await page.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url());requests.push({path:u.pathname,method:r.method()});
  if(u.pathname==='/v1/me')return route.fulfill({status:++state.meReads>state.meFailureAfter?503:state.signedOut?401:200,json:state.signedOut?{}:{user:{id:state.id}}});
  if(u.pathname==='/assets/member-experience/health.mjs')return route.fulfill({contentType:'text/javascript',body:'window.SST_HEALTH_CONSENT={ensure:async()=>true};'});
  if(u.pathname==='/v1/life-back/journey'||(u.pathname==='/v1/life-back'&&r.method()==='POST')){const headers=new Headers(r.headers());if(!state.signedOut)headers.set('Cookie','sst_session=test-only-member-'+state.id);const response=await service.fetch(new Request(r.url(),{method:r.method(),headers,...(r.method()==='POST'?{body:r.postData()}: {})}),f.env,{});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});}
  if(u.pathname==='/v1/commerce/active-checkout'){
   const data={ok:true,accountReference:state.reference,attempts:state.attempts};
   if(state.held){const hold=state.held;state.held=null;await new Promise(resolve=>state.release=resolve);return route.fulfill({json:hold});}
   return route.fulfill({json:data});
  }
  if(u.pathname==='/v1/commerce/basket-quote')return route.fulfill({json:{ok:true,accountReference:state.reference,quote:{items:[],subtotalPence:0,totalPence:0,deliveries:[]},recommendations:[],products:[]}});
  if(u.pathname.startsWith('/v1/'))return route.fulfill({json:{ok:true,memory:null,journey:{records:[]},orders:[],consents:[],units:{weight:'kg'},support:{}}});
  const request=new Request(r.url(),{method:r.method()});
  let response=shopNavigationAsset(request)||await memberBasketRoutes(request,env,publicRead)||await shopPageRoutes(request,env,publicRead)||journeyPageRoutes(request,env)||memberExperienceRoutes(request,env);
  if(!response&&['/member/dashboard','/member/grub','/member/fit','/member/settings','/member/saved','/member/orders','/member/plans'].includes(u.pathname))response=new Response(existingPage(u.pathname),{headers:{'Content-Type':'text/html'}});
  if(response){response=await withShopNavigation(request,response,env);if(nativeScripts.length&&response.headers.get('Content-Type')?.includes('text/html'))response=new Response((await response.text()).replace('</body>',nativeScripts.map(content=>'<script>'+content+'</script>').join('')+'</body>'),{status:response.status,headers:response.headers});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});}
  if(u.pathname==='/shop/client.js'){
   const source=process.env.MY_TIMBER_KIT_CLIENT?readFileSync(process.env.MY_TIMBER_KIT_CLIENT,'utf8'):'';return route.fulfill({contentType:'text/javascript',body:source});
  }
  if(images){const key=u.pathname.includes('testing-brandless-cutout-vitamin-d')?'test':u.pathname.includes('nutrition-kitchen')?'nutrition':u.pathname.includes('weight-management-plan')?'care':u.pathname.includes('heavyweight-tee/')?'kit':u.pathname.endsWith('/creatine.webp')?'creatine':null;if(key)return route.fulfill({contentType:'image/webp',body:Buffer.from(images[key].split(',')[1],'base64')});}
  if(/\.(?:m?js|css)$/.test(u.pathname))return route.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'text/javascript',body:''});
  return route.fulfill({status:204,body:''});
 });
 return {page,context,state,errors,requests};
}
async function checkJourney(h){
 const {page}=h;await page.goto(origin+'/member/life-back/journey');await waitChrome(page);await page.waitForSelector('[data-tj-add=win]');
 const add=async(kind,fill)=>{await page.click('[data-tj-add='+kind+']');await page.locator('[name=on]').fill('2026-10-28');await fill();await page.locator('[data-tj-record-form] button.tj-primary').click();await page.waitForSelector('[data-tj-add=win]');assert.match(await page.locator('#timberJourney').innerText(),/Your record is saved/);};
 await add('win',()=>page.locator('[name=text]').fill('Isolated browser win'));
 await page.reload();await page.waitForSelector('[data-tj-add=win]');assert.match(await page.locator('#timberJourney').innerText(),/Isolated browser win/);
 await page.locator('[data-tj-edit]').first().click();await page.locator('[name=text]').fill('Corrected isolated win');await page.locator('[data-tj-record-form] button.tj-primary').click();await page.waitForSelector('[data-tj-add=win]');
 await add('measurement',async()=>{if(await page.locator('[name=weight]').count())await page.locator('[name=weight]').fill('95.2');else{await page.locator('[name=stones]').fill('15');await page.locator('[name=pounds]').fill('0');}await page.locator('[name=waistCm]').fill('103.4');});
 await page.click('[data-tj-measure=clothes]');await add('clothes',async()=>{await page.locator('[name=top]').fill('L');await page.locator('[name=trousers]').fill('32 inch waist');});
 await page.click('[data-tj-guide]');await page.click('[data-tj-add=feeling]');await page.locator('[name=on]').fill('2026-10-28');await page.locator('[name=feelings][value=okay]').check();await page.locator('[data-tj-record-form] button.tj-primary').click();await page.waitForSelector('[data-tj-add=win]');
 await add('treatment',()=>page.locator('[name=change]').selectOption('changed'));
 await add('injection',()=>page.locator('[name=site]').fill('My own past site record'));
 await page.locator('[data-tj-range]').selectOption('custom');await page.locator('[name=from]').fill('2026-10-01');await page.locator('[name=to]').fill('2026-10-31');await page.locator('[data-tj-dates] button').click();assert.equal(new URL(page.url()).searchParams.get('from'),'2026-10-01');
 await page.click('[data-tj-snapshot]');const text=await page.locator('[data-tj-snapshot-text]').inputValue();assert.match(text,/Corrected isolated win/);assert.match(text,/28 Oct|2026-10-28/);assert.match(text,/32 inch waist/);assert.equal(await page.locator('[data-tj-pdf]').isDisabled(),true);assert.equal(await page.locator('[data-tj-share]').isDisabled(),true);
 await page.locator('[data-tj-accept]').check();assert.equal(await page.locator('[data-tj-pdf]').isDisabled(),false);await page.locator('[data-tj-snapshot-text]').fill(text+'\\nMy checked note');assert.equal(await page.locator('[data-tj-pdf]').isDisabled(),true);
 await page.locator('[data-tj-back]').click();await page.click('[data-tj-records]');const record=page.locator('.tj-record').filter({hasText:'Corrected isolated win'});await record.locator('[data-tj-edit]').click();page.once('dialog',dialog=>dialog.accept());await page.locator('[data-tj-delete]').click();await page.waitForSelector('.tj-record');assert.doesNotMatch(await page.locator('#timberJourney').innerText(),/Corrected isolated win/);
 await page.reload();await page.waitForSelector('[data-tj-add=win]');await page.click('[data-tj-records]');assert.equal(await page.locator('.tj-record').count(),5);assert.match(await page.locator('#timberJourney').innerText(),/32 inch waist/);assert.match(await page.locator('#timberJourney').innerText(),/My own past site record/);
 const before=await page.evaluate(()=>fetch('/v1/life-back/journey').then(r=>r.json()));assert.equal(before.records.length,5);h.state.id=2;await page.goto(origin+'/member/life-back/journey');await page.waitForSelector('[data-tj-add=win]');assert.doesNotMatch(await page.locator('#timberJourney').innerText(),/My own past site record|32 inch waist/);h.state.id=1;
}
async function assertBars(page){await page.waitForFunction(()=>{const t=document.querySelector('.mt-shop-top'),b=document.querySelector('.mt-shop-bottom'),s=getComputedStyle(document.body);return t&&b&&parseFloat(s.paddingTop)+1>=t.getBoundingClientRect().height&&parseFloat(s.paddingBottom)+1>=b.getBoundingClientRect().height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('#mtShopChrome').count(),1);}
const waitChrome=page=>page.waitForSelector('#mtShopChrome .mt-shop-primary a',{state:'visible',timeout:10000});
try{
 for(const width of [320,390,768,1440]){
  const h=await setup(width),{page,state,context}=h;
  try{
   await page.goto(origin+shopBase);await waitChrome(page);
   if(images)await page.waitForFunction(()=>[...document.querySelectorAll('.mt-shop-visual img')].every(img=>img.complete&&img.naturalWidth>0));
   assert.deepEqual(await page.locator('.mt-shop-primary a').allTextContents(),['Today','Journey','Shop']);assert.deepEqual(await page.locator('.mt-shop-bottom a').allTextContents(),['Grub','Fit','Support','More']);
   assert.equal(await page.locator('#mtShopChrome svg').count(),8);assert.equal(await page.locator('[data-mt-shop-tab=shop]').getAttribute('aria-current'),'page');
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,gaps:[...document.querySelectorAll('.mt-shop-category')].map(card=>({gap:card.querySelector('strong').getBoundingClientRect().top-card.querySelector('.mt-shop-visual').getBoundingClientRect().bottom,color:getComputedStyle(card.querySelector('strong')).color,display:getComputedStyle(card.querySelector('strong')).display}))}));
   assert.equal(layout.overflow,false);for(const item of layout.gaps){assert.ok(Math.abs(item.gap-8)<=1,JSON.stringify(item));assert.equal(item.color,'rgb(231, 227, 218)');assert.notEqual(item.display,'none');}
   await page.screenshot({path:join(out,'shop-'+width+'.png'),fullPage:true});results.push({width,case:'approved hub, 8px spacing, seven tabs, icons and no horizontal overflow',pass:true});
   for(const tab of ['today','journey','grub','fit','support','more','shop']){
    const target=await page.locator('[data-mt-shop-tab='+tab+']').getAttribute('href');await Promise.all([page.waitForURL(origin+target),page.click('[data-mt-shop-tab='+tab+']')]);await page.waitForLoadState();await waitChrome(page);await assertBars(page);assert.equal(await page.locator('[data-mt-shop-tab='+tab+']').getAttribute('aria-current'),'page');
    assert.equal(await page.locator('#mtShopChrome').count(),1,JSON.stringify({tab,state:await page.evaluate(()=>({path:location.href,hidden:document.hidden,body:document.body.dataset,errors:window.shopErrors,html:document.body.innerHTML.slice(-1200)}))}));assert.equal(await page.locator('#mtSixNav').isVisible().catch(()=>false),false);
    if(tab==='more'){assert.ok(await page.locator('#mtUtility a[href="/member/settings"]').count());assert.ok(await page.locator('#mtUtility a[href="/member/orders"]').count());}
   }
   results.push({width,case:'all seven destinations navigate and More retains account/settings/orders',pass:true});
   await page.reload();await waitChrome(page);await assertBars(page);await page.setViewportSize({width:900,height:width});await assertBars(page);await page.setViewportSize({width,height:900});await assertBars(page);results.push({width,case:'refresh, resize and rotation retain one unobscured navigation',pass:true});
   await page.click('.mt-shop-category[href$="/care"]');await waitChrome(page);assert.equal(await page.locator('a[href="/start-here"]').count(),1);assert.match(await page.locator('main').innerText(),/prescriber/);await page.goto(origin+shopBase);await waitChrome(page);
   await checkJourney(h);results.push({width,case:'real integrated Journey handlers save all six dated record types, refresh, correction, deletion and Snapshot safeguards in isolated SQLite',pass:true});await page.goto(origin+shopBase);await waitChrome(page);
   await page.click('.mt-shop-category[href$="/testing"]');await waitChrome(page);assert.match(await page.locator('main').innerText(),/Vitamin D/);assert.equal(await page.locator('[data-testing-purchase]').count(),0,'The range links to product details');await page.locator('main a[href="'+shopBase+'/testing/vitamin-d"]').first().click();await waitChrome(page);assert.equal(new URL(page.url()).pathname,shopBase+'/testing/vitamin-d');assert.equal(await page.locator('[data-testing-purchase] button[type=submit]').isDisabled(),true);assert.match(await page.locator('[data-testing-purchase]').innerText(),/out of stock|price.*(?:TBC|confirm)|not.*available|coming soon/i);
   await page.click('body>.mt-shop-return');await waitChrome(page);await page.click('.mt-shop-category[href$="/nutrition"]');await waitChrome(page);assert.equal(await page.locator('.shop-toolbar').getAttribute('action'),shopBase+'/nutrition');assert.match(await page.locator('main').innerText(),/proposed|not yet available/i);
   await page.goto(origin+shopBase+'/kit?item=heavyweight-tee&colour=ash-green');await waitChrome(page);assert.match(await page.locator('main').innerText(),/Heavyweight Tee/);
   if(process.env.MY_TIMBER_KIT_CLIENT){await page.click('[data-tm-colour=cream]');assert.match(await page.locator('[data-tm-colour-name]').innerText(),/Cream/);assert.equal(new URL(page.url()).searchParams.get('colour'),'cream');}
   results.push({width,case:'real product content, held purchase button, nutrition form and kit colour flow retained',pass:true});
   state.attempts=[{channel:'apparel',label:'Synthetic saved kit checkout',state:'open',canResume:true,checkoutUrl:'https://evil.test/invalid-payment'}];await page.goto(origin+shopBase);await waitChrome(page);await page.waitForFunction(()=>document.querySelector('#mtShopBasketCount')?.textContent==='1');await page.click('#mtShopBasket');await page.waitForSelector('#sstBasketPanel[open]');assert.match(await page.locator('#sstBasketInner').innerText(),/Synthetic saved kit checkout/);assert.equal(h.requests.filter(r=>/checkout$/.test(r.path)&&r.method==='POST').length,0);
   await page.getByRole('button',{name:'Resume secure payment'}).click();await page.waitForFunction(()=>document.querySelector('#sstBasketInner')?.textContent.includes('Checkout link could not be verified'));assert.equal(new URL(page.url()).pathname,shopBase);await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.click('[data-mt-shop-tab=fit]');await waitChrome(page);await page.waitForFunction(()=>document.querySelector('#mtShopBasketCount')?.textContent==='1');
   state.id=2;state.reference=ownerB;state.attempts=[];await page.evaluate(()=>document.dispatchEvent(new Event('sst:account-changed')));await waitChrome(page);await page.waitForFunction(()=>document.querySelector('#mtShopBasket')?.hidden===true);assert.doesNotMatch(await page.locator('#sstBasketInner').innerText(),/Synthetic saved kit checkout/);
   results.push({width,case:'basket count across pages, saved checkout and account-switch clearing; zero checkout POSTs',pass:true});
   state.signedOut=true;await page.goto(origin+shopBase);await page.waitForFunction(()=>document.body.dataset.memberSession==='signed-out');assert.equal(await page.locator('#mtShopChrome').count(),0);assert.equal(await page.locator('#mtShopMain').isVisible(),false);assert.match(await page.locator('#memberSessionStatus').innerText(),/Sign in/);
   results.push({width,case:'anonymous sign-in guard never reveals app chrome or catalogue',pass:true});
   assert.deepEqual(h.errors,[]);
  }finally{await context.close();}
 }
 // A delayed A response must not resurrect A's basket after B signs in.
 const h=await setup(390);try{
  await h.page.goto(origin+shopBase);await waitChrome(h.page);
  h.state.held={ok:true,accountReference:ownerA,attempts:[{channel:'apparel',label:'Private A checkout',state:'open'}]};
  await h.page.evaluate(()=>document.dispatchEvent(new Event('sst:member-basket-refresh')));await h.page.waitForTimeout(50);assert.ok(h.state.release);
  h.state.id=2;h.state.reference=ownerB;h.state.attempts=[];await h.page.evaluate(()=>document.dispatchEvent(new Event('sst:account-changed')));await waitChrome(h.page);h.state.release();
  await h.page.waitForTimeout(100);assert.doesNotMatch(await h.page.locator('#sstBasketInner').innerText(),/Private A checkout/);assert.equal(await h.page.locator('#mtShopBasket').isVisible(),false);results.push({width:390,case:'late old-account basket response is discarded',pass:true});
 }finally{await h.context.close();}
 const failed=await setup(390);try{
  failed.state.meFailureAfter=1;await failed.page.goto(origin+shopBase);await failed.page.waitForFunction(()=>document.body.dataset.memberSession==='ready');await failed.page.waitForTimeout(200);assert.equal(await failed.page.locator('#mtShopChrome').count(),0);assert.ok(failed.state.meReads<=3,'An unavailable identity check must not create an observer retry loop');results.push({width:390,case:'unavailable identity check fails closed without repeated background requests',pass:true});
 }finally{await failed.context.close();}
}finally{await browser.close();}
const receipt={kind:'MY_TIMBER_SHOP_OFFLINE_BROWSER_ACCEPTANCE',at:new Date().toISOString(),browser:engine,nativeScriptSha256:nativeScripts.map(s=>createHash('sha256').update(s).digest('hex')),live:false,productionWrites:0,checkoutPosts:0,fixtureSha256:Object.fromEntries(Object.entries(fixtures).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')])),checks:results.length,results};
writeFileSync(join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
