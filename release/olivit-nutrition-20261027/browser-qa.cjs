const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const puppeteer=require('/Users/shiftsometimberltd/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer/lib/puppeteer/puppeteer.js');
const dir=__dirname,html=fs.readFileSync(path.join(dir,'shift-health-olivit-preview.html'),'utf8');
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-first-run','--disable-background-networking']});
 const results=[],errors=[],blocked=[];
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage();await page.setViewport({width,height:1000,deviceScaleFactor:1});await page.setBypassServiceWorker(true);
   await page.setRequestInterception(true);page.on('request',request=>{
    const url=request.url();
    if(request.method()!=='GET'||/google-analytics|googletagmanager|facebook|doubleclick|\/v1\//i.test(url)){blocked.push({method:request.method(),url});return request.abort();}
    if(url==='https://shiftsometimber.co.uk/shift-health')return request.respond({status:200,contentType:'text/html',body:html});
    if(!url.startsWith('https://shiftsometimber.co.uk/')&&!url.startsWith('data:'))return request.abort();
    return request.continue();
   });
   page.on('pageerror',e=>errors.push({width,message:e.message}));
   await page.goto('https://shiftsometimber.co.uk/shift-health',{waitUntil:'networkidle2',timeout:30000});
   const section=await page.$('#supplements-nutrition');assert(section,'nutrition section');
   await section.scrollIntoView();
   assert.equal(await page.$$eval('.snh-group',els=>els.length),4);
   for(const selector of ['#nutrition-protein','#nutrition-creatine','#nutrition-hydration','#nutrition-snacks']){
    await page.click(selector+'>summary');assert(await page.$eval(selector,el=>el.open));
   }
   const metrics=await page.evaluate(()=>{
    const el=document.querySelector('.snh'),rect=el.getBoundingClientRect();
    const cards=[...el.querySelectorAll('.snh-product')];
    const colours=[el,...cards].map(node=>({background:getComputedStyle(node).backgroundColor,text:getComputedStyle(node).color}));
    return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,sectionWidth:rect.width,sectionRight:rect.right,cardCount:cards.length,cardOverflow:cards.some(c=>c.scrollWidth>c.clientWidth),colours,links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href'))};
   });
   assert.equal(metrics.cardCount,8);assert.equal(metrics.cardOverflow,false);assert(metrics.sectionRight<=width+1);assert(metrics.sectionWidth<=width);
   for(const c of metrics.colours)assert.notEqual(c.background,c.text);
   assert.deepEqual(metrics.links,['/member/grub']);
   await section.screenshot({path:path.join(dir,'nutrition-'+width+'.png')});
   results.push({width,passed:true,...metrics});
   await page.close();
  }
  assert.equal(errors.length,0,JSON.stringify(errors));
  fs.writeFileSync(path.join(dir,'browser-results.json'),JSON.stringify({checkedAt:new Date().toISOString(),results,errors,blockedRequests:blocked.length},null,2));
  console.log(JSON.stringify({passed:true,viewports:results.map(r=>r.width),products:8,errors,results},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
