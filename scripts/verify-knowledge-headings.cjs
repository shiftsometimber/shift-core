// Render the scripts: delivered HTML alone misses the injected duplicate H1.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const base=process.env.PREVIEW_URL;
 assert(base,'PREVIEW_URL is required');
 const browser=await chromium.launch({headless:true});
 const results=[];
 try {
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900}});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(route.request().method()!=='GET'||/google-analytics|googletagmanager/.test(url.hostname))return route.abort();
    return route.continue();
   });
   for(const path of ['/explore-knowledge','/glp1-knowledge-centre','/about']){
    const page=await context.newPage();
    await page.goto(base+path,{waitUntil:'networkidle'});
    if(path==='/explore-knowledge')await page.locator('.knowledge-guided').waitFor();
    if(path==='/glp1-knowledge-centre')await page.locator('.shift-guided-front').waitFor();
    assert.equal(await page.locator('h1').count(),1,path+' rendered H1 count');
    if(path==='/explore-knowledge'){
     assert.equal(await page.locator('h2#kg-title').count(),1);
     await page.locator('.kg-goal[data-goal="medicine"]').click();
     assert.equal(await page.locator('.kg-goal[data-goal="medicine"]').getAttribute('aria-pressed'),'true');
    }
    if(path==='/glp1-knowledge-centre')assert.equal(await page.locator('h2.shift-guided-title').count(),1);
    if(path==='/about')assert.equal(await page.locator('a[href="/my-timber"]').count(),0);
    fs.mkdirSync('heading-proof',{recursive:true});
    await page.screenshot({path:`heading-proof/${path.slice(1)}-${width}.png`,fullPage:true});
    results.push({path,width,h1:await page.locator('h1').allTextContents(),status:'pass'});
    await page.close();
   }
   await context.close();
  }
 } finally {await browser.close();fs.mkdirSync('heading-proof',{recursive:true});fs.writeFileSync('heading-proof/browser.json',JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
