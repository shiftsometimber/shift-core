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

const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=process.env.MY_TIMBER_SHOP_FIXTURES;if(!dir)throw Error('Set MY_TIMBER_SHOP_FIXTURES to the captured public fixture directory.');
const out=process.env.MY_TIMBER_SHOP_PROOF||join(dir,'shop-browser-proof');mkdirSync(out,{recursive:true});
const fixtures=Object.fromEntries(['testing','nutrition','kit','basket'].map(k=>[k,readFileSync(join(dir,'live-'+k+(k==='basket'?'.js':'.html')),'utf8')]));
const images=process.env.MY_TIMBER_SHOP_IMAGES?JSON.parse(readFileSync(process.env.MY_TIMBER_SHOP_IMAGES,'utf8')):null;
const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},origin='https://shiftsometimber.co.uk',ownerA='a'.repeat(64),ownerB='b'.repeat(64),results=[];
const shared=bindMemberBasket(fixtures.basket);assert.ok(shared.includes('memberDecision'),'The captured serving extras client has its account-change guard.');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']}: {})});
const publicRead=async request=>{
 const u=new URL(request.url);assert.equal(u.origin,origin);assert.equal(request.method,'GET');assert.deepEqual([...request.headers.keys()],['accept']);
 const key=u.pathname.includes('shift-purchase-basket')?'basket':u.pathname==='/shop'?'kit':u.pathname.includes('supplements')?'nutrition':u.pathname.startsWith('/shift-health/testing')?'testing':null;
 if(!key)throw Error('Unexpected public fixture request: '+u.pathname);
 return new Response(fixtures[key],{headers:{'Content-Type':key==='basket'?'text/javascript':'text/html'}});
};
function existingPage(path){
 const isDashboard=path==='/member/dashboard',page=isDashboard?'dashboard':path.split('/').pop();
 return withSessionState('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#050505;color:#E7E3DA}'+memberChromeStyles+memberDesignStyles+'</style></head><body data-member-page="'+page+'" data-member-design="20261001" data-member-experience-ui="20261015"><header id="todayBrand"><a href="/member/dashboard">MY TIMBER</a></header><nav class="sst-member-tabs">Legacy member navigation</nav><main><section id="previewMember" class="is-ready"><div id="todayActions"></div></section></main><script>'+sixPageRecoveryRuntime+'</script></body></html>');
}
async function setup(width){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],requests=[];
 const state={id:7,reference:ownerA,attempts:[],signedOut:false,held:null,release:null,meReads:0,meFailureAfter:Infinity};
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{window.SST_API_BASE=location.origin;window.SST_API={getMe:async()=>({user:{id:7}}),getMyJourney:async()=>({journey:{}}),getProgressSummary:async()=>({progress:{}}),getConsents:async()=>({consents:[]}),getUnits:async()=>({units:{weight:'kg'}}),getOrders:async()=>({orders:[]})};});
 await page.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url());requests.push({path:u.pathname,method:r.method()});
  if(u.pathname==='/v1/me')return route.fulfill({status:++state.meReads>state.meFailureAfter?503:state.signedOut?401:200,json:state.signedOut?{}:{user:{id:state.id}}});
  if(u.pathname==='/v1/life-back/journey')return route.fulfill({json:{accountId:state.id,today:'2026-10-29',units:'kg',revision:0,showMedicine:false,records:[],goal:null,trackingEnabled:false,paused:false,historyMayBeLimited:false}});
  if(u.pathname==='/v1/commerce/active-checkout'){
   const data={ok:true,accountReference:state.reference,attempts:state.attempts};
   if(state.held){const hold=state.held;state.held=null;await new Promise(resolve=>state.release=resolve);return route.fulfill({json:hold});}
   return route.fulfill({json:data});
  }
  if(u.pathname==='/v1/commerce/basket-quote')return route.fulfill({json:{ok:true,accountReference:state.reference,quote:{items:[],subtotalPence:0,totalPence:0,deliveries:[]},recommendations:[],products:[]}});
  if(u.pathname.startsWith('/v1/'))return route.fulfill({json:{ok:true,memory:null,journey:{records:[]},orders:[],consents:[],units:{weight:'kg'},support:{}}});
  const request=new Request(r.url(),{method:r.method()});
  let response=shopNavigationAsset(request)||await memberBasketRoutes(request,env,publicRead)||await shopPageRoutes(request,env,publicRead)||journeyPageRoutes(request,env)||memberExperienceRoutes(request,env);
  if(!response&&['/member/dashboard','/member/grub','/member/fit','/member/settings','/member/saved'].includes(u.pathname))response=new Response(existingPage(u.pathname),{headers:{'Content-Type':'text/html'}});
  if(response){response=await withShopNavigation(request,response,env);return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});}
  if(u.pathname==='/shop/client.js'){
   const source=process.env.MY_TIMBER_KIT_CLIENT?readFileSync(process.env.MY_TIMBER_KIT_CLIENT,'utf8'):'';return route.fulfill({contentType:'text/javascript',body:source});
  }
  if(images){const key=u.pathname.includes('testing-brandless-cutout-vitamin-d')?'test':u.pathname.includes('nutrition-kitchen')?'nutrition':u.pathname.includes('weight-management-plan')?'care':u.pathname.includes('heavyweight-tee/')?'kit':u.pathname.endsWith('/creatine.webp')?'creatine':null;if(key)return route.fulfill({contentType:'image/webp',body:Buffer.from(images[key].split(',')[1],'base64')});}
  if(/\.(?:m?js|css)$/.test(u.pathname))return route.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'text/javascript',body:''});
  return route.fulfill({status:204,body:''});
 });
 return {page,context,state,errors,requests};
}
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
    const target=await page.locator('[data-mt-shop-tab='+tab+']').getAttribute('href');await Promise.all([page.waitForURL(origin+target),page.click('[data-mt-shop-tab='+tab+']')]);await page.waitForLoadState();await waitChrome(page);assert.equal(await page.locator('[data-mt-shop-tab='+tab+']').getAttribute('aria-current'),'page');
    assert.equal(await page.locator('#mtShopChrome').count(),1,JSON.stringify({tab,state:await page.evaluate(()=>({path:location.href,hidden:document.hidden,body:document.body.dataset,errors:window.shopErrors,html:document.body.innerHTML.slice(-1200)}))}));assert.equal(await page.locator('#mtSixNav').isVisible().catch(()=>false),false);
    if(tab==='more'){assert.ok(await page.locator('#mtUtility a[href="/member/settings"]').count());assert.ok(await page.locator('#mtUtility a[href="/member/orders"]').count());}
   }
   results.push({width,case:'all seven destinations navigate and More retains account/settings/orders',pass:true});
   await page.click('.mt-shop-category[href$="/testing"]');await waitChrome(page);assert.match(await page.locator('main').innerText(),/Vitamin D/);assert.equal(await page.locator('[data-testing-purchase] button[type=submit]').isDisabled(),true);
   await page.click('body>.mt-shop-return');await waitChrome(page);await page.click('.mt-shop-category[href$="/nutrition"]');await waitChrome(page);assert.equal(await page.locator('.shop-toolbar').getAttribute('action'),shopBase+'/nutrition');assert.match(await page.locator('main').innerText(),/proposed|not yet available/i);
   await page.goto(origin+shopBase+'/kit?item=heavyweight-tee&colour=ash-green');await waitChrome(page);assert.match(await page.locator('main').innerText(),/Heavyweight Tee/);
   if(process.env.MY_TIMBER_KIT_CLIENT){await page.click('[data-tm-colour=cream]');assert.match(await page.locator('[data-tm-colour-name]').innerText(),/Cream/);assert.equal(new URL(page.url()).searchParams.get('colour'),'cream');}
   results.push({width,case:'real product content, held purchase button, nutrition form and kit colour flow retained',pass:true});
   state.attempts=[{channel:'apparel',label:'Synthetic saved kit checkout',state:'open',canResume:true,checkoutUrl:'https://evil.test/invalid-payment'}];await page.goto(origin+shopBase);await waitChrome(page);await page.waitForFunction(()=>document.querySelector('#mtShopBasketCount')?.textContent==='1');await page.click('#mtShopBasket');await page.waitForSelector('#sstBasketPanel[open]');assert.match(await page.locator('#sstBasketInner').innerText(),/Synthetic saved kit checkout/);assert.equal(h.requests.filter(r=>/checkout$/.test(r.path)&&r.method==='POST').length,0);
   await page.getByRole('button',{name:'Resume secure payment'}).click();await page.waitForFunction(()=>document.querySelector('#sstBasketInner')?.textContent.includes('Checkout link could not be verified'));assert.equal(new URL(page.url()).pathname,shopBase);await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.click('[data-mt-shop-tab=fit]');await waitChrome(page);await page.waitForFunction(()=>document.querySelector('#mtShopBasketCount')?.textContent==='1');
   state.id=8;state.reference=ownerB;state.attempts=[];await page.evaluate(()=>document.dispatchEvent(new Event('sst:account-changed')));await waitChrome(page);await page.waitForFunction(()=>document.querySelector('#mtShopBasket')?.hidden===true);assert.doesNotMatch(await page.locator('#sstBasketInner').innerText(),/Synthetic saved kit checkout/);
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
  h.state.id=8;h.state.reference=ownerB;h.state.attempts=[];await h.page.evaluate(()=>document.dispatchEvent(new Event('sst:account-changed')));await waitChrome(h.page);h.state.release();
  await h.page.waitForTimeout(100);assert.doesNotMatch(await h.page.locator('#sstBasketInner').innerText(),/Private A checkout/);assert.equal(await h.page.locator('#mtShopBasket').isVisible(),false);results.push({width:390,case:'late old-account basket response is discarded',pass:true});
 }finally{await h.context.close();}
 const failed=await setup(390);try{
  failed.state.meFailureAfter=1;await failed.page.goto(origin+shopBase);await failed.page.waitForFunction(()=>document.body.dataset.memberSession==='ready');await failed.page.waitForTimeout(200);assert.equal(await failed.page.locator('#mtShopChrome').count(),0);assert.ok(failed.state.meReads<=3,'An unavailable identity check must not create an observer retry loop');results.push({width:390,case:'unavailable identity check fails closed without repeated background requests',pass:true});
 }finally{await failed.context.close();}
}finally{await browser.close();}
const receipt={kind:'MY_TIMBER_SHOP_OFFLINE_BROWSER_ACCEPTANCE',at:new Date().toISOString(),browser:'chromium',live:false,productionWrites:0,checkoutPosts:0,fixtureSha256:Object.fromEntries(Object.entries(fixtures).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')])),checks:results.length,results};
writeFileSync(join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
