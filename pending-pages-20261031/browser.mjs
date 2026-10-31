import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pages,release} from './config.mjs';
export async function browserCheck({headers={},dir='pending-pages-evidence',label='candidate'}={}){
 const {chromium}=await import('../selected-pages-tools/node_modules/playwright/index.mjs');
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});const results=[];
 try{for(const viewport of [{width:1440,height:1100},{width:768,height:1024},{width:390,height:844}]){
  const context=await browser.newContext({viewport,extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'}),blockedWrites=[];
  await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false,updatedAt:new Date().toISOString()})));
  await context.route('**/*',route=>{if(['POST','PUT','PATCH','DELETE'].includes(route.request().method())){blockedWrites.push({method:route.request().method(),path:new URL(route.request().url()).pathname});return route.abort();}return route.continue();});
  for(const item of pages){
   for(const query of [false,true]){
    const page=await context.newPage();await page.bringToFront();
    await page.goto('https://shiftsometimber.co.uk'+item.path+(query?'?presentation=1':''),{waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('main[data-approved-release]').waitFor({state:'visible',timeout:30000});
    await page.waitForLoadState('load',{timeout:45000});await page.evaluate(()=>document.fonts.ready);
    await page.locator('main .sp-photo img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
    const layout=await page.evaluate(()=>{
     const m=document.querySelector('main'),h=m.querySelector('h1'),s=getComputedStyle(h),r=h.getBoundingClientRect();
     return {marker:m.dataset.approvedRelease,key:m.dataset.approvedPages,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:m.querySelectorAll('h1').length,background:getComputedStyle(m).backgroundColor,font:s.fontFamily,headingColour:s.color,headingFill:s.webkitTextFillColor,headingVisible:s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>0&&r.height>0,ticker:!!document.querySelector('#shift-public-news'),images:[...m.querySelectorAll('.sp-photo img')].map(i=>({src:i.getAttribute('src'),complete:i.complete,width:i.naturalWidth})),panels:[...m.querySelectorAll('.sp-panel,.sp-start-panel,.sp-benefits')].map(e=>({className:e.className,background:getComputedStyle(e).backgroundColor,colour:getComputedStyle(e).color}))};
    });
    assert.equal(layout.marker,release);assert.equal(layout.key,item.key);assert.equal(layout.background,'rgb(5, 5, 5)');assert.equal(layout.headings,1);assert(layout.headingVisible);assert.equal(layout.headingFill,'rgb(231, 227, 218)');assert(layout.font.includes('Arial'));assert(layout.scrollWidth<=viewport.width,'No horizontal overflow '+item.key+' '+viewport.width);assert(!layout.ticker);for(const i of layout.images)assert(i.complete&&i.width>0);
    for(const p of layout.panels){assert.equal(p.background,'rgb(231, 227, 218)');assert.equal(p.colour,'rgb(5, 5, 5)');}
    const stem=dir+'/'+label+'-'+item.key+(query?'-query':'')+'-'+viewport.width;
    await page.screenshot({path:stem+'.png',fullPage:false});if(!query&&viewport.width!==768)await page.screenshot({path:stem+'-full.png',fullPage:true});
    const behaviour={};
    if(item.key==='support'){
     assert.equal(await page.locator('.sp-ticks li').count(),3);assert.equal(await page.locator('.spp-features .continuity-grid>div').count(),3);
     const a=await page.locator('.sp-copy').boundingBox(),b=await page.locator('.sp-panel').boundingBox();if(viewport.width>600)assert(b.x>a.x&&Math.max(a.y,b.y)<Math.min(a.y+a.height,b.y+b.height),'FS1 split hero');else assert(b.y>=a.y+a.height,'FS1 mobile stacked');
     await page.getByRole('link',{name:'Find one useful step',exact:true}).first().click();behaviour.anchor=await page.locator('#awareness-first-step').evaluate(e=>({top:e.getBoundingClientRect().top,visible:getComputedStyle(e).display!=='none'}));
    }
    if(item.key==='partner'){
     const titles=await page.locator('.partner-card-v3b2 h3').allTextContents();assert.equal(titles.length,8);assert.deepEqual(titles,[...titles].sort((a,b)=>a.localeCompare(b,'en-GB')));behaviour.alphabeticalCategories=titles;
     assert.equal(await page.locator('.sp-copy .sp-button').getAttribute('href'),'https://shiftsometimber.co.uk/contact?type=Partnership#contact-form');
     await page.locator('.sp-category-links a').first().click();behaviour.anchor=await page.locator('#sp-partner-0').evaluate(e=>({top:e.getBoundingClientRect().top,visible:getComputedStyle(e).display!=='none'}));
    }
    if(item.key==='obesity'){
     assert.equal(await page.locator('.sp-start-panel .sp-step').count(),3);assert.equal(await page.locator('.mop-contents nav a').count(),6);
     await page.locator('.sp-start-panel a[href="#measurements"]').click();behaviour.anchor=await page.locator('#measurements').evaluate(e=>({top:e.getBoundingClientRect().top,visible:getComputedStyle(e).display!=='none'}));
    }
    if(item.key==='comparison'){
     assert.equal(await page.locator('.sp-comparison-topics .sp-step').count(),4);assert.equal(await page.locator('.sp-panel dt').count(),3);
     const a=await page.locator('.sp-panel').boundingBox(),b=await page.locator('.sp-comparison-topics').boundingBox();if(viewport.width>600)assert(b.x>a.x&&Math.abs(b.y-a.y)<3,'TC2 questions alongside topics');else assert(b.y>=a.y+a.height,'TC2 stacked mobile');
     await page.locator('.sp-comparison-topics a[href="#tablets-vs-injections"]').click();behaviour.anchor=await page.locator('#tablets-vs-injections').evaluate(e=>({top:e.getBoundingClientRect().top,visible:getComputedStyle(e).display!=='none'}));
     assert(await page.locator('main').innerText().then(t=>t.includes('qualified prescriber')));
    }
    assert(behaviour.anchor.visible&&behaviour.anchor.top>=60&&behaviour.anchor.top<350,'Anchor clears header '+item.key+' '+JSON.stringify(behaviour.anchor));
    results.push({page:item.key,selected:item.selected,viewport,query,layout,behaviour});await page.close();
   }
  }
  fs.writeFileSync(dir+'/'+label+'-blocked-write-attempts-'+viewport.width+'.json',JSON.stringify({allMutationsAborted:true,blockedWrites},null,2));await context.close();
 }}finally{await browser.close();}
 fs.writeFileSync(dir+'/'+label+'-browser.json',JSON.stringify(results,null,2));return results;
}
