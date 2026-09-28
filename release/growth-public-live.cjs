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
  }}finally{await context.close()}
 }}finally{await browser.close();fs.writeFileSync(dir+'/results.json',JSON.stringify({at:new Date().toISOString(),commit:process.env.GITHUB_SHA,results,customerRecordsRead:false},null,2))}
 console.log('PASS live approved public copy in desktop and phone-sized Chromium');
})().catch(e=>{console.error(e);process.exitCode=1});
