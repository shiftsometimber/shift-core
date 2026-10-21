const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE),origin='https://shift-timber-mill-preview-20261021.matobrien.workers.dev',version='20261021-mill-v2-colours',out='timber-mill-ci-evidence';
const products=JSON.parse(fs.readFileSync(path.join(__dirname,'products.json'))),report=[];
fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({version,passes:report,at:new Date().toISOString()},null,2));
const decoded=async locator=>{const result=await locator.evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>img.decode()));return imgs.every(img=>img.complete&&img.naturalWidth>0)});assert(result,'Images failed to decode');};
const noOverflow=async page=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'Horizontal overflow');

(async()=>{
const before=fs.readFileSync(out+'/preview-before.html','utf8'),after=fs.readFileSync(out+'/preview-after.html','utf8');
for(const tag of ['header','footer']){const regex=new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>','g');assert.deepEqual(after.match(regex),before.match(regex),'Shared '+tag+' changed');}
for(const[engine,type]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true});
  try{for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],blocked=[];
    await context.route('**/*',route=>{const request=route.request();if(!['GET','HEAD','OPTIONS'].includes(request.method())){blocked.push({method:request.method(),url:request.url()});return route.abort();}return route.continue();});
    page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(origin+'/shop',{waitUntil:'networkidle',timeout:45000});assert.equal(response.status(),200);assert.equal(response.headers()['x-shift-timbermill-version'],version);
    assert.equal(await page.locator('[data-timber-mill-version="'+version+'"]').count(),1);assert.equal(await page.locator('.shop-test').count(),0);
    assert.equal(await page.locator('[data-tm-product]:visible').count(),6);assert.equal(await page.locator('[data-tm-product]').count(),16);
    await page.getByRole('link',{name:'Browse the full range',exact:true}).click();assert.equal(await page.locator('[data-tm-product]:visible').count(),16);
    for(const product of products){
      const tile=page.locator('[data-tm-variant="'+product.slug+'"]');
      assert.equal(await tile.locator('.tm-swatch').count(),3);
      for(const[colour,name]of [['cream','Cream'],['black','Black'],['ash-green','Ash Green']]){
        const button=tile.getByRole('button',{name,exact:true});await button.click();
        assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await tile.locator('[data-tm-colour-name]').textContent(),name);
        assert.equal(await tile.locator('[data-tm-image]').getAttribute('src'),'/assets/products/'+product.slug+'/'+colour+'.webp?v=timber4');
        assert.equal(await tile.locator('.tm-item-link').getAttribute('href'),'/shop?item='+product.slug+'&colour='+colour);
        await decoded(tile.locator('[data-tm-image]'));
        const box=await button.boundingBox();assert(box.width>=44&&box.height>=44,'Swatch touch target too small');
      }
    }
    const first=page.locator('[data-tm-variant="heavyweight-tee"]');await first.getByRole('button',{name:'Cream',exact:true}).press('Space');
    assert.equal(await first.locator('[data-tm-colour-name]').textContent(),'Cream');
    await page.locator('[data-tm-filter="equipment"]').click();assert.equal(await page.locator('[data-tm-product]:visible').count(),products.filter(p=>p.category==='equipment').length);
    await page.goBack();assert.equal(await first.locator('[data-tm-colour-name]').textContent(),'Cream');
    await noOverflow(page);await page.screenshot({path:out+'/'+engine+'-'+width+'-catalogue.png'});
    await first.locator('.tm-item-link').click();assert.equal(new URL(page.url()).searchParams.get('colour'),'cream');
    assert.equal(await page.locator('[data-tm-colour-name]').textContent(),'Cream');assert.equal(await page.locator('.tm-buying').getAttribute('open'),null);
    await page.getByRole('button',{name:'Black',exact:true}).press('Enter');assert.equal(new URL(page.url()).searchParams.get('colour'),'black');
    const reloadResponse=await page.reload({waitUntil:'networkidle'});
    const reloadState=await page.evaluate(()=>({url:location.href,ready:document.readyState,version:document.querySelector('[data-timber-mill-version]')?.dataset.timberMillVersion,tiles:document.querySelectorAll('[data-tm-product]').length,variants:[...document.querySelectorAll('[data-tm-variant]')].map(item=>({slug:item.dataset.tmVariant,label:item.querySelector('[data-tm-colour-name]')?.textContent,img:item.querySelector('img')?.getAttribute('src'),buttons:[...item.querySelectorAll('[data-tm-colour]')].map(b=>({colour:b.dataset.tmColour,pressed:b.getAttribute('aria-pressed')}))})),scripts:[...document.scripts].map(s=>s.src),controlled:!!navigator.serviceWorker?.controller}));
    fs.writeFileSync(out+'/'+engine+'-'+width+'-reload.json',JSON.stringify({responseURL:reloadResponse.url(),fromServiceWorker:reloadResponse.fromServiceWorker(),state:reloadState,errors,blocked},null,2));
    await page.screenshot({path:out+'/'+engine+'-'+width+'-reload.png'});
    assert.equal(await page.getByRole('button',{name:'Black',exact:true}).getAttribute('aria-pressed'),'true');await decoded(page.locator('[data-tm-image]'));await noOverflow(page);
    await page.screenshot({path:out+'/'+engine+'-'+width+'-detail.png'});
    assert.deepEqual(errors,[]);assert.deepEqual(blocked.filter(r=>!/analytics|insights|beacon|consent|telemetry|pixel|rum/i.test(r.url)),[],'Unexpected attempted write');
    report.push({engine,width,productColourChecks:48,detailURLReload:true,keyboard:true,categoryBackRetention:true,imagesDecoded:true,swatchesAtLeast44px:true,noOverflow:true,stockHiddenBeforeBuying:true,noUnexpectedWrites:true,at:new Date().toISOString()});save();console.log(JSON.stringify(report.at(-1)));
    await context.close();
  }}finally{await browser.close();}
}
const browser=await chromium.launch({headless:true});try{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000}}),page=await context.newPage();
  await page.goto(origin+'/shop?item=hoodie&colour=cream',{waitUntil:'networkidle'});assert.equal(await page.getByRole('button',{name:'Cream',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Black',exact:true}).click();await page.waitForURL('**/shop?item=hoodie&colour=black');assert.equal(await page.getByRole('button',{name:'Black',exact:true}).getAttribute('aria-pressed'),'true');await decoded(page.locator('[data-tm-image]'));await context.close();
}finally{await browser.close();}
fs.writeFileSync(out+'/accepted.json',JSON.stringify({version,browserPasses:4,realProductColourChecks:192,noJavaScriptGETFallback:true,sharedHeaderAndFooterUnchanged:true,productionChanged:false,at:new Date().toISOString()},null,2));console.log('TIMBER_MILL_PREVIEW_ACCEPTED');
})().catch(error=>{save();console.error(error.stack);process.exitCode=1;});
