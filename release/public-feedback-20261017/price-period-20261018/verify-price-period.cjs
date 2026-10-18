const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=require('/Users/shiftsometimberltd/SST/my-timber-experience-20261015/node_modules/playwright');
const root=__dirname,base=path.dirname(root),live=process.argv.includes('--live'),prepared=JSON.parse(fs.readFileSync(root+'/prepared-changes.json'));
const report={at:new Date().toISOString(),mode:live?'live':'staged-live-response',build:prepared.build,checks:[],pageErrors:[],writesSubmitted:0};
(async()=>{const {repairPromiseResponse}=await import(root+'/public-promise-accuracy-v1.mjs');
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{const context=await b.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 if(!live)await context.route('https://shiftsometimber.co.uk/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname,file=root+'/after'+p;
  if(p==='/treatment-order'){
   const response=await route.fetch();let body=await response.text();
   for(const [a,z]of [['review the monthly price','review the price and supply period'],['MONTHLY PRICE','TREATMENT PRICE'],['Pay month by month.','Pay per treatment order.'],['This month’s order','This treatment order'],['One month · four weekly doses','4 weeks · four weekly doses'],['public-feedback-20261017-b7d5bf35aac0',prepared.build]])body=body.split(a).join(z);
   await route.fulfill({response,body,headers:{...response.headers(),'content-length':String(Buffer.byteLength(body))}});return;
  }
  if(fs.existsSync(file)&&fs.statSync(file).isFile()){
   let body=fs.readFileSync(file,'utf8');
   if(p.endsWith('.js'))body=await(await repairPromiseResponse(new Response(body),new Request(req.url()))).text();
   await route.fulfill({status:200,body,contentType:p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'application/json'});return;
  }await route.continue();
 });
 const p=await context.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));
 await p.goto('https://shiftsometimber.co.uk/treatment-order?medicine=mounjaro&view=spec',{waitUntil:'domcontentloaded'});
 const consent=p.getByRole('button',{name:'Necessary only',exact:true});if(await consent.count())await consent.click();
 await p.locator('[data-price-checked]').filter({hasText:'HQ price checked'}).waitFor();
 for(const width of [320,1440]){
  await p.setViewportSize({width,height:1000});
  for(const [key,name,heading]of [['mounjaro','Mounjaro','PRICE PER 4 WEEKS'],['wegovy-injection','Wegovy injection','PRICE PER 4 WEEKS'],['wegovy-tablets','Wegovy tablet','PACK PRICE'],['foundayo','Foundayo','PACK PRICE'],['orlistat','Orlistat','PACK PRICE']]){
   await p.locator('[data-switch-medicine="'+key+'"]').click();await p.getByRole('heading',{name,exact:true}).first().waitFor();
   assert.equal(await p.locator('.op-price small').innerText(),heading);
   assert.match(await p.locator('[data-price-checked]').innerText(),/^HQ price checked /);
   const text=await p.locator('[data-op-step="0"]').innerText();
   assert.ok(!/MONTHLY PRICE|Live monthly price|inclusive monthly|Pay month by month|One month · four weekly doses/.test(text));
   assert.match(await p.locator('[data-receipt-list]').innerText(),key==='mounjaro'||key==='wegovy-injection'?/four weekly doses \(4 weeks\)/:/selected pack/);
   assert.match(await p.locator('[data-op-step="0"] .op-lead').innerText(),/Assessment may lead to another form of support or no prescription/);
   assert.equal(new URL(p.url()).searchParams.get('medicine'),key);
   const selected=await p.locator('[data-dose-select] option:checked').getAttribute('data-price');
   assert.equal(await p.locator('[data-op-price]').innerText(),'£'+Number(selected).toFixed(2));
   const compare=await p.locator('[data-compare-output]').innerText();assert.match(compare,/per 4 weeks/);
   const box=await p.locator('.op-price').boundingBox();assert.ok(box.x>=-1&&box.x+box.width<=width+1,'price within viewport');
   report.checks.push({width,medicine:key,heading,exactHQPrice:true,periodReceipt:true,neutralAssessment:true,switchUrl:true,priceFitsViewport:true});
  }
 }
 await p.locator('[data-switch-medicine="orlistat"]').click();
 for(const pack of ['42','84','168']){
  await p.locator('[data-dose-select]').selectOption(pack);
  assert.match(await p.locator('.op-price>span').first().innerText(),new RegExp('per '+pack+'-capsule pack'));
  report.checks.push({orlistatPack:pack,correctPackPeriod:true});
 }
 await p.locator('[data-switch-medicine="wegovy-injection"]').click();
 await p.locator('input[name="treatment-stage"][value="continuing"]').check();
 await p.locator('[data-dose-select]').selectOption('7.2');
 assert.equal(await p.locator('[data-op-price]').innerText(),'Price unavailable');
 report.checks.push({unpricedDose:'wegovy-injection-7.2',noInventedPrice:true});
 await p.locator('[data-switch-medicine="mounjaro"]').click();await p.goBack({waitUntil:'domcontentloaded'});
 assert.equal(new URL(p.url()).searchParams.get('medicine'),'wegovy-injection');
 assert.equal(await p.locator('.op-price small').innerText(),'PRICE PER 4 WEEKS');
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('[data-price-checked]').filter({hasText:'HQ price checked'}).waitFor();
 assert.equal(await p.locator('.op-price small').innerText(),'PRICE PER 4 WEEKS');
 report.checks.push({historyBackAndReload:true});
 await p.locator('[data-switch-medicine="mounjaro"]').click();await p.evaluate(()=>window.scrollTo(0,0));
 await p.screenshot({path:root+'/'+(live?'live':'staged')+'-price-period.png'});
 const fail=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 if(!live){await fail.route('https://shiftsometimber.co.uk/**',async route=>{
   const url=new URL(route.request().url()),file=root+'/after'+url.pathname;
   if(fs.existsSync(file)&&file.endsWith('.js')){const body=await(await repairPromiseResponse(new Response(fs.readFileSync(file,'utf8')),new Request(url))).text();await route.fulfill({status:200,body,contentType:'application/javascript'});return}
   await route.continue();
 });}
 await fail.route('**/v1/catalogue/medicines',route=>route.abort());
 const f=await fail.newPage();f.on('pageerror',e=>report.pageErrors.push(e.message));
 await f.goto('https://shiftsometimber.co.uk/treatment-order?medicine=mounjaro&view=spec',{waitUntil:'domcontentloaded'});
 await f.locator('[data-price-checked]').filter({hasText:'HQ price unavailable'}).waitFor();
 assert.equal(await f.locator('[data-op-price]').innerText(),'Price unavailable');
 report.checks.push({catalogueFailure:true,noPriceOrTimestampInvented:true});
 assert.deepEqual(report.pageErrors,[]);report.pass=true;
 }catch(e){report.pass=false;report.failure=e.stack;throw e}
 finally{await b.close();fs.writeFileSync(root+'/'+(live?'live':'preview')+'-browser-proof.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
})().catch(()=>{process.exitCode=1});
