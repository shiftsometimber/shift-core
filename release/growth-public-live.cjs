const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.RUNNER_TEMP+'/heading-tools/node_modules/playwright');
const dir='b1-runtime-release/growth-public';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch();const results=[];
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  try{for(const path of ['/programme','/help']){
   const r=await page.goto('https://shiftsometimber.co.uk'+path,{waitUntil:'domcontentloaded'});assert.equal(r.status(),200);
   await page.locator(path==='/programme'?'[data-growth-week]':'[data-growth-promise]').waitFor();
   assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.desktop-nav a').count(),5);
   assert.equal(await page.locator('#preview-only').count(),0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const links=page.locator(path==='/programme'?'.growth-week a':'.growth-promise a');
   assert.equal(await links.first().evaluate(el=>getComputedStyle(el).color),'rgb(231, 227, 218)');
   if(path==='/help')assert((await page.locator('[data-growth-promise]').innerText()).includes('No stock available today'));
   const menu=page.locator('.menu-trigger');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
   await page.screenshot({path:dir+'/'+width+path.replaceAll('/','-')+'.png',fullPage:true});
   results.push({path,width,status:'pass',checks:['approved copy','one H1','five navigation links','cream links','no overflow','menu','no preview banner']});
  }
  await page.goto('https://shiftsometimber.co.uk'+'/mens-mental-health',{waitUntil:'domcontentloaded'});
  await page.locator('.shift-guided-front__inner').waitFor();
  const alignment=await page.evaluate(()=>{
   const root=document.querySelector('.shift-guided-front__inner'),intro=document.querySelector('.shift-guided-intro'),r=root.getBoundingClientRect(),p=intro.getBoundingClientRect(),h=root.querySelector('h1').getBoundingClientRect();
   return {heading:getComputedStyle(root.querySelector('h1')).textAlign,intro:getComputedStyle(intro).textAlign,headingOffset:Math.abs((h.left+h.right)/2-(r.left+r.right)/2),rootOffset:Math.abs((r.left+r.right)/2-document.documentElement.clientWidth/2),introOffset:Math.abs((p.left+p.right)/2-(r.left+r.right)/2),overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  assert.equal(alignment.heading,'center');assert.equal(alignment.intro,'center');assert(alignment.rootOffset<2,JSON.stringify(alignment));assert(alignment.introOffset<2);assert(alignment.headingOffset<2);assert(!alignment.overflow);
  assert.equal(await page.locator('.shift-guided-card').count(),4);
  assert.equal(await page.locator('.shift-guided-card').first().evaluate(el=>getComputedStyle(el).alignItems),'center');
  assert(await page.locator('.shift-guided-kicker').evaluate(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return Math.abs((r.left+r.right-p.left-p.right)/2)<2}));
  assert.equal(await page.locator('.shift-guided-alert a').getAttribute('href'),'/mental-health/urgent-mental-health-help');
  await page.screenshot({path:dir+'/'+width+'-good-to-talk.png',fullPage:true});
  await page.locator('.shift-guided-library summary').click();assert(await page.locator('.shift-guided-library').evaluate(el=>el.open));
  results.push('Good to Talk: centred heading, intro and layout; no overflow; four support choices, urgent link and library disclosure preserved');
  for(const path of ['/clinic-gone-quiet','/provider-switch']){
   const response=await page.goto('https://shiftsometimber.co.uk'+path,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
   assert.equal(await page.locator('[data-growth-continuity]').count(),1);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('[data-continuity-primary]').getAttribute('href'),'/member/dashboard?entry=continuity#today');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:dir+'/'+width+path.replaceAll('/','-')+'.png',fullPage:true});
  }
  await page.locator('[data-continuity-primary]').click();
  // Production retains its existing inline auth form; the isolated preview uses a link.
  await page.locator('#previewAuth:not([hidden])').waitFor();
  assert.equal(await page.locator('body').getAttribute('data-member-session'),'signed-out');
  assert(await page.locator('#previewRegister input[name="email"]').isVisible());
  assert(await page.locator('#previewRegister input[name="password"]').isVisible());
  assert.equal(page.url(),'https://shiftsometimber.co.uk/member/dashboard?entry=continuity#today');
  assert.equal(await page.locator('#continuityWelcome').isVisible(),false,'Private Today content stays behind authentication');
  await page.screenshot({path:dir+'/'+width+'-continuity-sign-in.png',fullPage:true});
  results.push({width,status:'pass',checks:['inline production sign-in visible','chosen Continuity destination retained','private Today content hidden']});


  }finally{await context.close()}
 }}finally{await browser.close();fs.writeFileSync(dir+'/results.json',JSON.stringify({at:new Date().toISOString(),commit:process.env.GITHUB_SHA,results,customerRecordsRead:false},null,2))}
 console.log('PASS live approved public copy in desktop and phone-sized Chromium');
})().catch(e=>{console.error(e);process.exitCode=1});
