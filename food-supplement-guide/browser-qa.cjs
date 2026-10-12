// HISTORICAL MIXED-EDITION QA ONLY. Do not use this receipt/script as food-only acceptance.
// Current food-only code requires revised 390/1440 actual browser proof before public acceptance.
// Real Chrome candidate overlay on the existing production shell. All modifying
// requests and telemetry are blocked. This is candidate QA, not live acceptance.
const fs=require('fs'),assert=require('assert/strict'),path=require('path'),crypto=require('crypto');
const puppeteer=require('/Users/shiftsometimberltd/.npm/_npx/4b4c857f6efdfb61/node_modules/puppeteer/lib/puppeteer/puppeteer.js');
const root=__dirname,out=path.join(root,'evidence');fs.mkdirSync(out,{recursive:true});
const inputs=JSON.parse(fs.readFileSync(path.join(root,'candidate.json'),'utf8'));
const guidePath='/guides/food-and-supplements',base='https://shiftsometimber.co.uk';
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,userDataDir:path.join(root,'chrome-profile'),args:['--no-first-run','--disable-background-networking']});
 const checks=[],blocked=[],errors=[];try{
 for(const width of [390,1440]){
  const page=await browser.newPage();await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);await page.setViewport({width,height:900,deviceScaleFactor:1});
  await page.setRequestInterception(true);page.on('request',r=>{
   const u=new URL(r.url());
   if(r.method()!=='GET'||/google-analytics|googletagmanager|facebook|doubleclick|\/v1\//i.test(r.url())){blocked.push({method:r.method(),path:u.pathname});return r.abort();}
   if(u.origin===base&&u.pathname===guidePath)return r.respond({status:200,contentType:'text/html',body:inputs.html});
   const asset=inputs.assets[u.pathname];if(asset)return r.respond({status:200,contentType:asset.type,body:asset.body});
   if(u.origin!==base&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))return r.abort();
   return r.continue();
  });
  page.on('pageerror',e=>errors.push({width,error:e.message}));
  await page.goto(base+guidePath,{waitUntil:'networkidle2',timeout:45000});await page.waitForSelector('.supp-card');
  const necessary=await page.$('button[data-consent-choice="necessary"]');
  if(necessary)await necessary.click();else{const buttons=await page.$$('button');for(const b of buttons)if(await b.evaluate(x=>x.innerText.trim()==='Necessary only')){await b.click();break;}}
  await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(x=>x.innerText.trim()==='Necessary only'&&x.offsetHeight),{timeout:5000});
  const check=async(name,fn)=>{await fn();checks.push({width,name,pass:true});};
  await check('initial rendering and no horizontal overflow',async()=>{assert.equal(await page.$$eval('#shift-food-guide .supp-card',x=>x.length),11);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);});
  await check('body text has readable contrast',async()=>{const bad=await page.evaluate(()=>{const rgb=s=>s.match(/[\d.]+/g)?.slice(0,3).map(Number);const lum=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);return [...document.querySelectorAll('#shift-food-guide p')].filter(x=>x.offsetHeight).map(x=>{const c=getComputedStyle(x),fg=rgb(c.webkitTextFillColor||c.color);let n=x,bg;while(n){const value=getComputedStyle(n).backgroundColor;if(!/rgba\(.+, 0\)$/.test(value)&&value!=='transparent'){bg=rgb(value);break;}n=n.parentElement;}if(!fg||!bg)return null;const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);return ratio<4.5?{text:x.innerText.slice(0,50),ratio,fg,bg}:null;}).filter(Boolean);});assert.deepEqual(bad,[]);});
  await check('all six goals change advice',async()=>{for(const goal of ['basics','weight','strength','energy','gut','sleep']){await page.locator('[data-sfg-goal="'+goal+'"]').click();assert.equal(await page.$eval('[data-sfg-goal="'+goal+'"]',x=>x.getAttribute('aria-pressed')),'true');assert((await page.$eval('#starting-result',x=>x.innerText)).length>100);}});
  await check('vegan, small appetite and training decisions',async()=>{await page.select('#diet','vegan');await page.select('#appetite','glp1');await page.locator('#training').click();assert.equal(await page.evaluate(()=>SHIFT_GUIDE.relevance(SHIFT_DATA.supplements.find(s=>s.id==='b12')).level),'consider');assert.equal(await page.evaluate(()=>SHIFT_GUIDE.relevance(SHIFT_DATA.supplements.find(s=>s.id==='creatine')).level),'consider');assert(!(await page.$eval('#meal-protein',s=>s.innerText)).match(/tuna|eggs|chicken|fish/i));});
  await check('all three meals and next-step handoff',async()=>{for(const m of ['breakfast','lunch','dinner'])await page.locator('[data-sfg-meal="'+m+'"]').click();await page.select('#meal-colour','Tinned tomatoes');await page.locator('#use-meal').click();assert.match(await page.$eval('#plan-body',x=>x.innerText),/tinned tomatoes/i);});
  await check('search, no matches and filter recovery',async()=>{await page.type('#search','nonsense');assert.equal(await page.$$('.supp-card').then(x=>x.length),0);await page.locator('[data-clear-filter]').click();await page.select('#filter','ask');assert((await page.$$('.supp-card')).length>=1);await page.select('#filter','all');});
  await check('comparison, cap and clear',async()=>{await page.locator('[data-compare="b12"]').click();await page.locator('[data-compare="creatine"]').click();assert.equal(await page.$eval('[data-compare="iron"]',x=>x.disabled),true);assert.match(await page.$eval('#comparison-content',x=>x.innerText),/Vitamin B12/);await page.locator('#clear-compare').click();});
  await check('modal, keyboard Escape and focus return',async()=>{await page.locator('[data-detail="vitamin-d"]').click();assert.equal(await page.$eval('#detail-dialog',x=>x.open),true);await page.keyboard.press('Tab');await page.keyboard.press('Escape');assert.equal(await page.$eval('#detail-dialog',x=>x.open),false);assert.equal(await page.evaluate(()=>document.activeElement.dataset.detail),'vitamin-d');});
  await check('shortlist and buy-nothing result',async()=>{await page.locator('[data-shortlist="b12"]').click();await page.locator('input[name="action"][value="nothing"]').click();assert.match(await page.$eval('#shortlist',x=>x.innerText),/Vitamin B12/);assert.match(await page.$eval('#plan-title',x=>x.innerText),/Buy nothing/);});
  await check('cost example and zero-servings rejection',async()=>{await page.locator('#cost-example').click();assert.match(await page.$eval('#cost-result',x=>x.innerText),/£9.00/);await page.$eval('#servings',x=>{x.value='0';x.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.$eval('#cost-result',x=>x.classList.contains('error')),true);});
  await check('local takeaway download contents',async()=>{const client=await page.createCDPSession();const file=path.join(out,'SHIFT-my-food-and-supplements-takeaway.txt');if(fs.existsSync(file))fs.unlinkSync(file);await client.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out});await page.locator('#download').click();const deadline=Date.now()+5000;while((!fs.existsSync(file)||fs.statSync(file).size===0)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));assert(fs.existsSync(file)&&fs.statSync(file).size>0);assert.match(fs.readFileSync(file,'utf8'),/Buy nothing for now/);fs.renameSync(file,path.join(out,'takeaway-'+width+'.txt'));});
  await check('print layout produces a PDF',async()=>{await page.emulateMediaType('print');await page.pdf({path:path.join(out,'takeaway-'+width+'.pdf'),format:'A4'});assert.equal(await page.$eval('#food',x=>getComputedStyle(x).display),'none');await page.emulateMediaType('screen');});
  await check('reset and refresh clear choices',async()=>{await page.locator('#reset').click();assert.equal(await page.$eval('#diet',x=>x.value),'mixed');assert.match(await page.$eval('#shortlist',x=>x.innerText),/Nothing shortlisted/);await page.select('#diet','vegan');await page.reload({waitUntil:'networkidle2'});assert.equal(await page.$eval('#diet',x=>x.value),'mixed');});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(out,'guide-'+width+'.png'),fullPage:true});await page.screenshot({path:path.join(out,'viewport-'+width+'.png'),fullPage:false});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-receipt.json'),JSON.stringify({status:'passed',checkedAt:new Date().toISOString(),candidateHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'candidate.json'))).digest('hex'),checks,blockedRequests:blocked,pageErrors:errors,scope:'Real Chrome 390/1440 candidate overlay; not deployed-source or independent human acceptance'},null,2));
 console.log(JSON.stringify({status:'passed',checks:checks.length,widths:[390,1440],errors:errors.length,evidence:out}));
 }finally{await browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(out,'browser-failure.txt'),e.stack);console.error(e.stack);process.exitCode=1;});
