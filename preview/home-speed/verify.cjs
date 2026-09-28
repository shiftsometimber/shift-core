const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.SEO_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,results=[];
fs.mkdirSync('reta-proof/screenshots',{recursive:true});
(async()=>{
for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [390,1440]){
 const browser=await engine.launch();let original;
 for(const mode of ['baseline','candidate']){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',r=>!['GET','HEAD'].includes(r.request().method())||/google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com/.test(r.request().url())?r.abort():r.continue());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  assert.equal((await page.goto(base+'/?__seo_baseline='+(mode==='baseline'?'1':'0'),{waitUntil:'networkidle'})).status(),200);
  const state=await page.evaluate(()=>({main:document.querySelector('main').innerHTML,styles:[...document.querySelectorAll('header *,main *,footer *')].map(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect();return[el.tagName,...['color','backgroundColor','fontFamily','fontSize','lineHeight','display','padding','margin','borderRadius','maxWidth'].map(k=>c[k]),r.width,r.height]}),overflow:document.documentElement.scrollWidth>innerWidth+1,google:[...document.scripts].filter(x=>/googletagmanager.com\/(gtm.js|gtag\/js)/.test(x.src)).length}));
  assert(!state.overflow);assert.equal(state.google,0);assert.equal(await page.locator('h1').count(),1);
  if(mode==='baseline')original=state;else assert.deepEqual(state,original);
  await page.screenshot({path:`reta-proof/screenshots/${name}-${width}-${mode}.png`,fullPage:true});
  const menu=page.locator('.menu-trigger');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
  const refuse=page.getByRole('button',{name:/reject|refuse|necessary only/i}).first();assert(await refuse.count());await refuse.click();await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count(),0);
  const choices=page.locator('#sstCookieSettings');await choices.click();assert(await page.locator('.cookie-banner-v3a').isVisible());assert.equal(errors.length,0,errors.join('\n'));
  results.push({engine:name,width,mode,pass:true});await context.close();
 }
 await browser.close();
}
fs.writeFileSync('reta-proof/browser.json',JSON.stringify(results,null,2));console.log('PASS all eight browser contexts, style equality, menu, refusal and cookie choices');
})().catch(e=>{console.error(e);process.exitCode=1});
