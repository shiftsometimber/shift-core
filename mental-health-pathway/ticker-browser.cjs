const assert=require('node:assert/strict'),fs=require('node:fs');
const puppeteer=require(process.env.SHIFT_PUPPETEER_MODULE);
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.SHIFT_CHROME,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const checks=[];
 try{
  for(const width of [390,320,1440]){
   const page=await browser.newPage(),tickerRequests=[];
   await page.setViewport({width,height:1000,deviceScaleFactor:1});
   page.on('request',r=>{if(/\/v1\/radar\/ticker(?:\?|$)|\/assets\/(?:public-news-ticker-v1|newsroom-ticker-v2)\.js/.test(r.url()))tickerRequests.push(r.url());});
   const response=await page.goto('https://shiftsometimber.co.uk/mens-mental-health',{waitUntil:'networkidle2',timeout:45000});assert.equal(response.status(),200);
   const state=await page.evaluate(()=>({tickerCount:document.querySelectorAll('#shift-public-news,[data-shift-news-ticker]').length,heading:document.querySelector('h1')?.textContent.replace(/\s+/g,' ').trim(),urgent:!!document.querySelector('a[href="/mental-health/urgent-mental-health-help"]'),savedStep:!!document.querySelector('a[href="/member/support"]'),noOverflow:document.documentElement.scrollWidth<=innerWidth+1}));
   assert.equal(state.tickerCount,0);assert.equal(state.heading,'What do you need right now?');assert(state.urgent&&state.savedStep&&state.noOverflow);assert.equal(tickerRequests.length,0,'Ticker client or wire request still loads');
   await page.screenshot({path:'mental-health-ticker-release/live-'+width+'.png',fullPage:false});checks.push({width,...state,tickerRequests:0});await page.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync('mental-health-ticker-release/browser-verification.json',JSON.stringify({ok:true,checks},null,2));console.log('PASS live Chrome at 320, 390 and 1440 pixels: ticker and its requests absent; urgent help, saved step and page width intact.');
})().catch(e=>{console.error(e);process.exit(1)});
