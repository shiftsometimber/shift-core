import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pages,release} from './config.mjs';
export async function browserCheck({headers={},dir='selected-pages-evidence',label='candidate'}={}){
 const {chromium}=await import('../selected-pages-tools/node_modules/playwright/index.mjs');
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});const results=[];
 try{for(const viewport of [{width:1440,height:1100},{width:768,height:1024},{width:390,height:844}]){
  const context=await browser.newContext({viewport,extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'});let writes=0;
  await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false,updatedAt:new Date().toISOString()})));
  await context.route('**/*',route=>{if(['POST','PUT','PATCH','DELETE'].includes(route.request().method())){writes++;return route.abort();}return route.continue();});
  for(const item of pages){
   const page=await context.newPage();await page.bringToFront();
   await page.goto('https://shiftsometimber.co.uk'+item.path,{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('main[data-approved-release]').waitFor({state:'visible',timeout:30000});
   await page.waitForLoadState('load',{timeout:45000});await page.evaluate(()=>document.fonts.ready);
   await page.locator('main .sp-photo img,main .sp-still').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
   const layout=await page.evaluate(()=>{
    const m=document.querySelector('main'),h=m.querySelector('h1'),s=getComputedStyle(h),r=h.getBoundingClientRect();
    return {marker:m.dataset.approvedRelease,key:m.dataset.approvedPages,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:m.querySelectorAll('h1').length,background:getComputedStyle(m).backgroundColor,font:s.fontFamily,headingColour:s.color,headingFill:s.webkitTextFillColor,headingVisible:s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>0&&r.height>0,ticker:!!document.querySelector('#shift-public-news'),images:[...m.querySelectorAll('.sp-photo img,.sp-still')].map(i=>({src:i.getAttribute('src'),complete:i.complete,width:i.naturalWidth})),styles:[...m.querySelectorAll('.sp-letter,.ct-form-card,.nr-story:not([hidden]),.qpp-needs,.lbp-needs')].slice(0,3).map(e=>({className:e.className,background:getComputedStyle(e).backgroundColor,colour:getComputedStyle(e).color})),formControls:[...m.querySelectorAll('input,select,textarea')].map(e=>({id:e.id,name:e.name,background:getComputedStyle(e).backgroundColor,colour:getComputedStyle(e).color}))};
   });
   assert.equal(layout.marker,release);assert.equal(layout.key,item.key);assert.equal(layout.background,'rgb(5, 5, 5)');assert.equal(layout.headings,1);assert(layout.headingVisible);assert.equal(layout.headingFill,'rgb(231, 227, 218)');assert(layout.font.includes('Arial'),'Existing sans-serif family');assert(layout.scrollWidth<=viewport.width,'No overflow '+item.key+' '+viewport.width);assert.equal(layout.ticker,['newsroom','continuity'].includes(item.key));for(const i of layout.images)assert(i.complete&&i.width>0);
   await page.screenshot({path:dir+'/'+label+'-'+item.key+'-'+viewport.width+'.png',fullPage:false});
   if(viewport.width!==768)await page.screenshot({path:dir+'/'+label+'-'+item.key+'-full-'+viewport.width+'.png',fullPage:true});
   const behaviour={};
   if(item.key==='about'){
    assert.equal(await page.locator('.sp-letter').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(231, 227, 218)');
    await page.getByRole('link',{name:'Read my story',exact:true}).click();await page.waitForURL('**/about#story');
    behaviour.story=await page.locator('#story').evaluate(e=>({top:e.getBoundingClientRect().top,text:e.textContent}));assert(behaviour.story.top>=60&&behaviour.story.top<300,'Story jump clears header');
    assert((await page.locator('.ab-story').innerText()).includes('I’m Matt. A normal bloke'));
   }
   if(item.key==='contact'){
    const form=page.locator('#shiftContactForm');assert.equal(await form.count(),1);
    assert.equal(await page.locator('.ct-form-card').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(231, 227, 218)');
    await page.locator('#ct-name').fill('Layout verification');await page.locator('#ct-email').fill('invalid-email');await page.locator('#ct-subject').selectOption({label:'Website or technical help'});
    behaviour.invalidEmailRejected=await page.locator('#ct-email').evaluate(e=>!e.checkValidity());assert(behaviour.invalidEmailRejected);
    assert.equal(await page.locator('main a[href="tel:03303110981"]').count(),1);assert.equal(await page.locator('main [data-contact-whatsapp] a').getAttribute('href'),'https://wa.me/447932618313');
    const b=await page.locator('.ct-form-card').boundingBox(),a=await page.locator('.sp-contact-intro').boundingBox();behaviour.formPosition={intro:a,form:b};if(viewport.width>600)assert(b.x>a.x&&Math.abs(b.y-a.y)<3,'CO1 form alongside intro');else assert(b.y>=a.y+a.height&&b.y-a.y-a.height<35,'Tight stacked mobile form');
    behaviour.formNotSubmitted=true;
   }
   if(item.key==='newsroom'){
    const visible=()=>page.locator('[data-news-card]:not([hidden])');await page.waitForFunction(()=>document.querySelectorAll('[data-news-card]:not([hidden])').length===12);
    behaviour.initialStories=await visible().count();
    await page.locator('input[name=q]').fill('yellow');await page.waitForFunction(()=>{const a=[...document.querySelectorAll('[data-news-card]:not([hidden])')];return a.length>0&&a.length<12&&a.every(e=>e.dataset.nrSearch.includes('yellow'));});behaviour.searchResults=await visible().count();
    await page.locator('input[name=q]').fill('');await page.waitForFunction(()=>document.querySelectorAll('[data-news-card]:not([hidden])').length===12);
    await page.locator('#news-sort').selectOption('oldest');
    await page.waitForFunction(()=>{const a=[...document.querySelectorAll('[data-news-card]:not([hidden])')];return a.every((e,i)=>!i||a[i-1].dataset.date<=e.dataset.date);});behaviour.sortWorks=true;
    await page.locator('#news-sort').selectOption('newest');await page.locator('[data-nr-more]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-news-card]:not([hidden])').length===24);behaviour.moreStories=await visible().count();
    await page.locator('.nr-refine summary').click();await page.locator('#news-topic').selectOption('research');await page.waitForFunction(()=>{const a=[...document.querySelectorAll('[data-news-card]:not([hidden])')];return a.length>0&&a.every(e=>(e.dataset.topic||'').split(' ').includes('research'));});behaviour.refineWorks=true;
   }
   if(item.key==='continuity'){
    await page.getByRole('link',{name:'Find your next step',exact:true}).click();await page.waitForURL('**/clinic-gone-quiet#sp-help-routes');
    behaviour.routes=await page.locator('#sp-help-routes').evaluate(e=>({top:e.getBoundingClientRect().top,text:e.textContent}));assert(behaviour.routes.top>=60&&behaviour.routes.top<300,'Help routes clear header');assert((await page.locator('main').innerText()).includes('not monitored clinical messages.'));assert.equal(await page.locator('#sp-help-routes').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(231, 227, 218)');
    if(await page.locator('#sp-help-routes .cr-choices').count()){behaviour.currentReviewRetained=true;assert.equal(await page.locator('#sp-help-routes details').count(),6);const first=page.locator('#sp-help-routes summary').first();await first.click();assert(await page.locator('#sp-help-routes details').first().evaluate(e=>e.open));}
   }
   if(item.key==='life-back'){
    assert.equal(await page.locator('.sp-copy .sp-button').getAttribute('href'),'/member/life-back');assert.equal(await page.locator('.lbp-needs .continuity-grid>div').count(),3);assert.equal(await page.locator('.lbp-needs').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(231, 227, 218)');
    behaviour.memberDestination='/member/life-back';behaviour.steps=3;
   }
   await page.close();const query=await context.newPage();await query.bringToFront();await query.goto('https://shiftsometimber.co.uk'+item.path+'?presentation=1',{waitUntil:'domcontentloaded',timeout:60000});await query.locator('main[data-approved-release]').waitFor();await query.waitForLoadState('load',{timeout:45000});await query.evaluate(()=>document.fonts.ready);await query.locator('main .sp-photo img,main .sp-still').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
   const queryLayout=await query.evaluate(()=>({marker:document.querySelector('main').dataset.approvedRelease,scrollWidth:document.documentElement.scrollWidth,headings:document.querySelectorAll('main h1').length}));assert.equal(queryLayout.marker,release);assert.equal(queryLayout.headings,1);assert(queryLayout.scrollWidth<=viewport.width);if(viewport.width!==768)await query.screenshot({path:dir+'/'+label+'-'+item.key+'-query-'+viewport.width+'.png',fullPage:false});
   results.push({page:item.key,selected:item.selected,viewport,layout,behaviour,query:queryLayout});await query.close();
  }
  assert.equal(writes,0,'No writes or external messages during verification');await context.close();
 }}finally{await browser.close();}
 fs.writeFileSync(dir+'/'+label+'-browser.json',JSON.stringify(results,null,2));return results;
}
