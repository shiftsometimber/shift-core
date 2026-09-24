const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.SEO_TOOLS+'/node_modules/playwright');
const base=process.env.VERIFY_BASE||'https://shift-reta-repair-preview.matobrien.workers.dev',live=!!process.env.VERIFY_BASE;
const path='/guides/retatrutide-uk-guide',results=[];
fs.mkdirSync('reta-proof/screenshots',{recursive:true});
(async()=>{
for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [390,1440]){
 const browser=await engine.launch();let original;
 for(const mode of live?['candidate']:['baseline','candidate']){
  const context=await browser.newContext({viewport:{width,height:900}});const requests=[],errors=[];
  await context.route('**/*',r=>{let q=r.request();requests.push(q.url());return !['GET','HEAD'].includes(q.method())||/google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com/.test(q.url())?r.abort():r.continue()});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
  const response=await page.goto(base+path+(mode==='baseline'?'?__seo_baseline=1':''),{waitUntil:'networkidle'});
  assert.equal(response.status(),200);if(!live)assert.equal(response.headers()['x-shift-preview-commit'],process.env.GITHUB_SHA);
  const state=await page.evaluate(()=>{
   const main=document.querySelector('main').cloneNode(true);main.querySelector('[data-reta-editorial-image]')?.remove();
   const selectors=['header.site-header','h1','.reta-hero','.menu-trigger','.reta-toc','.reta-body','.reta-section h2','.reta-table-wrap','footer.site-footer'];
   return {main:main.innerHTML,styles:Object.fromEntries(selectors.map(s=>{const el=document.querySelector(s),c=getComputedStyle(el);return[s,['color','backgroundColor','fontFamily','fontSize','lineHeight','display','padding','margin','borderRadius','maxWidth'].map(k=>c[k])]})),header:document.querySelector('header.site-header').getBoundingClientRect().toJSON(),h1:document.querySelector('h1').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth+1,schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),google:[...document.scripts].filter(x=>/googletagmanager.com\/(gtm.js|gtag\/js)/.test(x.src)).map(x=>x.src)};
  });
  assert(!state.overflow);assert.equal(state.google.length,0);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://shiftsometimber.co.uk'+path);
  if(mode==='baseline')original=state;
  else {
   if(original){assert.deepEqual(state.styles,original.styles);assert.deepEqual(state.header,original.header);assert.deepEqual(state.h1,original.h1);assert.equal(state.main,original.main)}
   for(const type of ['Article','MedicalWebPage']){let s=state.schemas.find(x=>x['@type']===type);assert(!s.datePublished);assert.equal(s.dateModified,'2026-09-23');assert(s.image.url.includes('/assets/reta-research-'))}
   const image=page.locator('[data-reta-editorial-image] img');await image.scrollIntoViewIfNeeded();await image.evaluate(x=>x.decode());assert.equal(await image.evaluate(x=>x.naturalWidth),1200);
   await page.screenshot({path:`reta-proof/screenshots/${name}-${width}-image.png`});
  }
  const menu=page.locator('.menu-trigger');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');assert(await menu.evaluate(x=>x===document.activeElement));
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`reta-proof/screenshots/${name}-${width}-${mode}.png`});
  const refuse=page.getByRole('button',{name:/reject|refuse|necessary only/i}).first();
  if(await refuse.count()) {await refuse.click();await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count(),0)}
  const choices=page.locator('#sstCookieSettings');assert.equal(await choices.count(),1);await choices.click();assert(await page.locator('.cookie-banner-v3a').isVisible());
  assert.equal(errors.length,0,errors.join('\n'));results.push({name,width,mode,status:'pass',styles:state.styles,googleBeforeConsent:state.google,errors,refusalTested:await refuse.count()>0});
  await context.close();
 }
 await browser.close();
}
fs.writeFileSync('reta-proof/browser.json',JSON.stringify({base,live,results},null,2));console.log('PASS',results.length,'browser contexts');
})().catch(e=>{fs.writeFileSync('reta-proof/browser-error.txt',String(e.stack));console.error(e);process.exitCode=1});
