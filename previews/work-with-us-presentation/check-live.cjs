const assert=require('node:assert/strict'),fs=require('node:fs');
const{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
const dir='work-with-us-presentation-live-evidence',staged={...JSON.parse(fs.readFileSync(dir+'/staged.json')),url:process.env.WORK_ORIGIN+'/work-with-us'};
const timer=setTimeout(()=>{console.error('Browser deadline');process.exit(1)},240000);
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
(async()=>{
 const results=[];
 for(const[name,engine]of Object.entries({chromium,webkit})){
  const browser=await engine.launch();
  for(const width of[390,1440]){
   const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();
   page.setDefaultTimeout(15000);
   await page.route('**/*',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.fulfill({status:204,body:''}));
   await page.goto(staged.url,{waitUntil:'domcontentloaded',timeout:45000});
   await page.locator('main.wwp h1').waitFor();const consent=page.getByRole('button',{name:'Necessary only',exact:true});if(await consent.count()&&await consent.isVisible()){await consent.click();await page.getByRole('dialog',{name:'Cookie choices',exact:true}).waitFor({state:'hidden'});}
   assert.equal(await page.locator('main').getAttribute('data-work-preview'),'20261022-work-with-us-preview-v1');
   assert.equal(await page.locator('main').getAttribute('data-work-release'),'20261022-work-with-us-live-v1');assert.equal(await page.locator('main h1').count(),1);
   assert.equal(await page.locator('.ww-route').count(),6);assert.equal(await page.locator('.ww-stat').count(),4);
   assert(await page.locator('header').count());assert(await page.locator('footer').count());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
   const colours=await page.locator('.ww-stat strong,.ww-route h3,.ww-route small,.ww-pillar strong,.ww-button').evaluateAll(elements=>elements.map(element=>{
    const css=getComputedStyle(element);let ancestor=element,background='rgba(0, 0, 0, 0)';
    while(ancestor){const b=getComputedStyle(ancestor).backgroundColor;if(b!=='rgba(0, 0, 0, 0)'&&b!=='transparent'){background=b;break;}ancestor=ancestor.parentElement;}
    return {label:element.textContent.trim(),colour:css.color,fill:css.webkitTextFillColor,background};
   }));
   for(const row of colours){const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),fg=luminance(rgb(row.fill||row.colour)),bg=luminance(rgb(row.background)),ratio=(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);assert(ratio>=4.5,'Low contrast: '+JSON.stringify({...row,ratio}));}
   if(width<700){const spacing=await page.locator('.ww-gap-grid').evaluate(e=>{const heading=e.querySelector('h2').getBoundingClientRect(),copy=e.querySelector('.ww-gap-copy').getBoundingClientRect();return copy.top-heading.bottom;});assert(spacing>=0&&spacing<80,'Excess mobile gap: '+spacing);}await page.screenshot({path:dir+'/'+name+'-'+width+'.png',fullPage:true});
   await page.locator('.ww-hero-copy a').click();assert.equal(new URL(page.url()).hash,'#opportunity');assert(await page.locator('#opportunity h2').isVisible());
   for(const element of await page.locator('.ww-route').all()){assert(await element.isVisible());assert(await element.getAttribute('href'));}
   results.push({browser:name,width,passed:true,contrastChecks:colours.length,partnershipRoutes:6});
   await context.close();
  }
  await browser.close();
 }
 const browser=await chromium.launch(),page=await browser.newPage({javaScriptEnabled:false});
 await page.goto(staged.url,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.ww-route').count(),6);await page.locator('.ww-hero-copy a').click();assert.equal(new URL(page.url()).hash,'#opportunity');await browser.close();
 const linkChecks=[];
 for(const path of['/partner-with-us','/commercial-principles','/corporate-wellbeing','/expert-contributors','/contact?type=Partnership#contact-form','/contact?type=Technology#contact-form','/contact?type=Investment#contact-form']){const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);linkChecks.push({path,status:r.status});}
 fs.writeFileSync(dir+'/accepted.json',JSON.stringify({production:process.env.WORK_ORIGIN==='https://shiftsometimber.co.uk',browserPasses:results,version:'20261022-work-with-us-preview-v1',commit:staged.commit,results,linkChecks,noJavaScriptPassed:true,publishedCopyAndLinksPreserved:staged.publishedCopyAndLinksPreserved,productionRoutesOwned:0},null,2));
 clearTimeout(timer);console.log('WORK_WITH_US_HOSTED_PREVIEW_ACCEPTED');
})().catch(error=>{console.error(error);process.exit(1)});
