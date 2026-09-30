const fs=require('fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.BROWSER_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,results=[];
fs.mkdirSync('home-compact-proof/screenshots',{recursive:true});
(async()=>{
for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']]){
 const browser=await engine.launch();
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.route('**/*',r=>!['GET','HEAD'].includes(r.request().method())||/google-analytics|googletagmanager|doubleclick/.test(r.request().url())?r.abort():r.continue());
  const page=await context.newPage();let before;
  for(const mode of ['baseline','candidate']){
   const response=await page.goto(base+'/?baseline='+(mode==='baseline'?'1':'0'),{waitUntil:'networkidle'});assert.equal(response.status(),200);
   const necessary=page.getByRole('button',{name:'Necessary only',exact:true});if(await necessary.isVisible())await necessary.click();
   await page.evaluate(()=>document.fonts.ready);
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length,links:[...document.querySelectorAll('a:not(.sst-free-feature):not(.sst-free-entry)')].filter(a=>!a.closest('.sst-route-steps>li:first-child')).map(a=>[a.textContent,a.getAttribute('href')]),outside:[...document.querySelectorAll('header *,main *,footer *')].filter(el=>!el.closest('.sst-route-free')&&!el.querySelector('.sst-route-free')&&!el.querySelector('.sst-route-steps')&&!el.closest('.sst-route-steps')&&el.id!=='sst-home-route-title'&&!el.closest('.home-hero .actions')&&!el.querySelector('.home-hero .actions')).map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return [el.tagName,el.textContent,...['fontFamily','fontSize','lineHeight','color','backgroundColor','display','padding','margin','borderRadius','maxWidth'].map(k=>s[k]),Math.round(r.width*100)/100,Math.round(r.height*100)/100]})}));
   assert(!state.overflow,`${name} ${width} ${mode} horizontal overflow`);assert.equal(state.h1,1);
   if(mode==='baseline')before=state;else{
    assert.equal(await page.locator('.sst-route-number').count(),0);assert.equal(await page.locator('#sst-home-route-title').textContent(),'FIND YOUR WAY WITH SHIFT.');
    assert.deepEqual(state.outside,before.outside,'Homepage outside replaced strip changed');assert.deepEqual(state.links,before.links,'Existing homepage links changed');
    assert.equal(await page.locator('.sst-start-card').getAttribute('href'),'/start-here');assert.equal(await page.locator('.sst-start-card').count(),1);
    assert.equal(await page.locator('.sst-start-card').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(112, 119, 98)');
    const cta=page.locator('.home-hero .actions>a.primary');
    assert.equal(await cta.getAttribute('href'),'/start-here');
    const ctaStyle=await cta.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,fontSize:parseFloat(getComputedStyle(el).fontSize),fontWeight:getComputedStyle(el).fontWeight,animation:getComputedStyle(el,'::after').animationName}));
    assert.equal(ctaStyle.background,'rgb(112, 119, 98)');assert.equal(ctaStyle.color,'rgb(5, 5, 5)');assert(ctaStyle.fontSize>=18.67);assert.equal(ctaStyle.fontWeight,'700');assert.equal(ctaStyle.animation,'sst-start-shimmer');
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await cta.evaluate(el=>getComputedStyle(el,'::after').animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
    const design=await page.locator('.sst-free-designed').evaluate(el=>({height:el.offsetHeight,background:getComputedStyle(el).backgroundColor,heading:getComputedStyle(el.querySelector('h2')).fontSize,columns:getComputedStyle(el.querySelector('.sst-free-features')).gridTemplateColumns.split(' ').length,labels:[...el.querySelectorAll('h3')].map(x=>x.textContent),body:getComputedStyle(el.querySelector('.sst-free-feature p')).fontSize,font:getComputedStyle(el.querySelector('h2')).fontFamily,clipped:[...el.querySelectorAll('h2,h3,p')].some(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)}));
    assert.deepEqual(await page.locator('.sst-free-designed a').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),['/member/dashboard','/member/grub','/member/fit','/member/check-in','/member/dashboard#visualise']);await page.locator('.sst-free-entry').focus();assert(await page.locator('.sst-free-entry').evaluate(a=>a===document.activeElement));console.log('LAYOUT',name,width,JSON.stringify(design));assert.equal(design.background,'rgb(112, 119, 98)');assert.equal(design.heading,width<=900?'26px':'28px');assert.equal(design.columns,width<=900?2:4);assert.deepEqual(design.labels,['FOOD','MOVEMENT','CHECK-INS','PROGRESS']);assert.equal(design.body,width<=900?'16px':'14px');assert(design.font.includes('ShiftRouteCondensed'));assert(!design.clipped);if(width===1440)assert(design.height>=140&&design.height<=205,'Desktop banner must remain compact');
    await page.screenshot({path:`home-compact-proof/screenshots/${name}-${width}-top.png`});await page.screenshot({path:`home-compact-proof/screenshots/${name}-${width}-full.png`,fullPage:true});
    await page.locator('.sst-free-designed').screenshot({path:`home-compact-proof/screenshots/${name}-${width}-strip.png`});
    await page.locator('.menu-trigger').click();assert.equal(await page.locator('.menu-trigger').getAttribute('aria-expanded'),'true');assert(await page.locator('.site-drawer').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-trigger').getAttribute('aria-expanded'),'false');
    results.push({engine:name,width,...design,noOverflow:true,unchangedOutsideStrip:true,originalLinksPreserved:true,menuPassed:true});console.log('PASS',name,width,JSON.stringify(design));
   }
  }
  await context.close();
 }
 await browser.close();
}
assert.equal((await fetch(base,{method:'POST'})).status,405);
assert.equal((await fetch(base+'/v1/auth/me')).status,404);
fs.writeFileSync('home-compact-proof/browser.json',JSON.stringify(results,null,2));
console.log('PASS: eight desktop/mobile engine-width combinations, exact palette and compact sizing, no clipping/overflow, existing layout/links/menu preserved, read-only preview');
})().catch(e=>{console.error(e);process.exit(1)});
