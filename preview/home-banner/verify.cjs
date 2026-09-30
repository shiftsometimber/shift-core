const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.BROWSER_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,results=[];
fs.mkdirSync('home-banner-proof/screenshots',{recursive:true});
(async()=>{
for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']]){
const browser=await engine.launch();
for(const width of [320,390,1440]){
 const context=await browser.newContext({viewport:{width,height:1000}});
 await context.route('**/*',r=>!['GET','HEAD'].includes(r.request().method())||/google-analytics|googletagmanager|doubleclick/.test(r.request().url())?r.abort():r.continue());
 const page=await context.newPage();let original;
 for(const mode of ['baseline','candidate']){
  const response=await page.goto(base+'/?baseline='+(mode==='baseline'?'1':'0'),{waitUntil:'networkidle'});assert.equal(response.status(),200);
  const consent=page.getByRole('button',{name:'Necessary only',exact:true});if(await consent.isVisible())await consent.click();
  await page.evaluate(()=>document.fonts.ready);
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length,elements:[...document.querySelectorAll('header *,main *,footer *')].filter(el=>!el.closest('#sst-home-route')).map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return [el.tagName,...['color','backgroundColor','fontFamily','fontSize','lineHeight','display','padding','margin','borderRadius','maxWidth'].map(k=>s[k]),Math.round(r.width*100)/100,Math.round(r.height*100)/100]})}));
  assert(!state.overflow,`${name} ${width} ${mode} overflow`);assert.equal(state.h1,1);
  if(mode==='baseline')original=state;else{
   assert.deepEqual(state,original,'Outside-banner appearance changed');
   const placement=await page.locator('#sst-home-route').evaluate(el=>({before:el.previousElementSibling.className,after:el.nextElementSibling.className,links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href')),padding:getComputedStyle(el.querySelector('.sst-route-free')).paddingTop}));
   assert.equal(placement.before,'home-hero');assert.equal(placement.after,'struggle-artwork-section');assert.deepEqual(placement.links,['/start-here','/programme','/member/dashboard']);assert.equal(placement.padding,'3px');
   await page.screenshot({path:`home-banner-proof/screenshots/${name}-${width}-full.png`,fullPage:true});
   await page.locator('#sst-home-route').screenshot({path:`home-banner-proof/screenshots/${name}-${width}-banner.png`});
   const menu=page.locator('.menu-trigger');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
   const start=page.locator('#sst-home-route a').first();await start.focus();assert.equal(await start.evaluate(el=>document.activeElement===el),true);
   results.push({engine:name,width,placement,originalPageStyleEquality:true,noOverflow:true,menuPassed:true,keyboardPassed:true});
  }
 }
 await context.close();
}
await browser.close();
}
const r=await fetch(base,{method:'POST'});assert.equal(r.status,405);
fs.writeFileSync('home-banner-proof/browser.json',JSON.stringify(results,null,2));console.log('PASS: six desktop/mobile browser combinations, exact original style preservation, banner placement, links, menu and read-only restriction');
})().catch(e=>{console.error(e);process.exitCode=1});
