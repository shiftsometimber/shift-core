const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
const out='my-timber-menu-live-evidence',origin=process.env.MENU_ORIGIN,staged=JSON.parse(fs.readFileSync(out+'/staged.json')),production=origin==='https://shiftsometimber.co.uk';
const timeout=setTimeout(()=>{console.error('Menu browser deadline');process.exit(1)},240000);
(async()=>{
 const results=[];
 for(const[name,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch({headless:true});
  for(const width of[390,1440]){
   const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
   await context.route('**/*',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.fulfill({status:204,body:''}));
   const page=await context.newPage();page.setDefaultTimeout(20000);
   const response=await page.goto(origin+'/member/dashboard',{waitUntil:'domcontentloaded',timeout:45000});assert.equal(response.status(),200);
   const header=page.locator('.mtw-header');await header.waitFor({state:'visible'});const menu=header.locator('.mtw-site-menu');await menu.waitFor();
   const consent=page.getByRole('button',{name:'Necessary only',exact:true});if(await consent.count()&&await consent.isVisible()){await consent.click();await page.getByRole('dialog',{name:'Cookie choices',exact:true}).waitFor({state:'hidden'});}
   assert.equal(await menu.getAttribute('data-mtw-menu'),'20261022-menu-preview-v1');assert.equal(await menu.count(),1);
   assert(await page.getByRole('link',{name:'Already a member? Log in',exact:true}).isVisible());assert(await page.getByRole('link',{name:'Join My Timber — free',exact:true}).first().isVisible());
   await page.waitForFunction(()=>{const i=document.querySelector('.mtw-header img');return i?.complete&&i.naturalWidth>0;});
   await menu.locator('summary').press('Enter');assert(await menu.evaluate(e=>e.open));
   const nav=menu.getByRole('navigation',{name:'My Timber site menu',exact:true});assert.equal(await nav.getByRole('link').count(),15);
   for(const title of['About','Knowledge','SHIFT Newsroom','Work With Us','My Timber'])assert(await nav.getByRole('link',{name:title,exact:true}).isVisible());
   const panel=await menu.locator('.mtw-site-menu-panel').boundingBox();assert(panel.x>=0&&panel.x+panel.width<=width+1,'Menu leaves viewport');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
   await page.screenshot({path:out+'/'+(production?'live':'staging')+'-'+name+'-'+width+'-menu.png',fullPage:false});
   await page.keyboard.press('Escape');assert.equal(await menu.evaluate(e=>e.open),false);assert(await menu.locator('summary').evaluate(e=>document.activeElement===e));
   await menu.locator('summary').click();await header.click({position:{x:2,y:2}});assert.equal(await menu.evaluate(e=>e.open),false);
   results.push({browser:name,width,menuLinks:15,loginAndJoinRetained:true,keyboardOpen:true,escapeAndFocusReturn:true,outsideClose:true,noOverflow:true,publicSignedOutOnly:true});
   await context.close();
  }
  await browser.close();
 }
 fs.writeFileSync(out+'/accepted.json',JSON.stringify({url:origin+'/member/dashboard',production,version:'20261022-mytimber-menu-live-v1',commit:staged.commit,browserPasses:results,noPrivateSessionRead:true,at:new Date().toISOString()},null,2));clearTimeout(timeout);console.log('MYTIMBER_MENU_FOUR_BROWSER_CHECKS_PASSED '+(production?'PUBLIC':'STAGED'));
})().catch(error=>{console.error(error);process.exit(1)});
