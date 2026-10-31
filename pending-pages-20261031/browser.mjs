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
    await page.evaluate(()=>window.scrollTo(0,0));
    const layout=await page.evaluate(()=>{
     const m=document.querySelector('main'),h=m.querySelector('h1'),s=getComputedStyle(h),r=h.getBoundingClientRect();
     return {marker:m.dataset.approvedRelease,key:m.dataset.approvedPages,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:m.querySelectorAll('h1').length,background:getComputedStyle(m).backgroundColor,font:s.fontFamily,headingColour:s.color,headingFill:s.webkitTextFillColor,headingVisible:s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>0&&r.height>0,ticker:!!document.querySelector('#shift-public-news'),images:[...m.querySelectorAll('.sp-photo img')].map(i=>({src:i.getAttribute('src'),complete:i.complete,width:i.naturalWidth})),panels:[...m.querySelectorAll('.sp-panel,.sp-start-panel,.sp-benefits')].map(e=>({className:e.className,background:getComputedStyle(e).backgroundColor,colour:getComputedStyle(e).color}))};
    });
    assert.equal(layout.marker,release);assert.equal(layout.key,item.key);assert.equal(layout.background,'rgb(5, 5, 5)');assert.equal(layout.headings,1);assert(layout.headingVisible);assert.equal(layout.headingFill,'rgb(231, 227, 218)');assert(layout.font.includes('Arial'));assert(layout.scrollWidth<=viewport.width,'No horizontal overflow '+item.key+' '+viewport.width);assert(!layout.ticker);for(const i of layout.images)assert(i.complete&&i.width>0);
    for(const p of layout.panels){assert.equal(p.background,'rgb(231, 227, 218)');assert.equal(p.colour,'rgb(5, 5, 5)');}
    const stem=dir+'/'+label+'-'+item.key+(query?'-query':'')+'-'+viewport.width;
    await page.screenshot({path:stem+'.png',fullPage:false});if(!query&&viewport.width!==768)await page.screenshot({path:stem+'-full.png',fullPage:true});
    const contrast=await page.evaluate(()=>{
     const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=a=>a.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
     return [...document.querySelectorAll('main p,main li,main h2,main h3,main strong,main td,main th,main span')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{let bg=[255,255,255];for(let p=e;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]>=.95){bg=c;break;}}const c=rgb(getComputedStyle(e).color),a=lum(c),b=lum(bg);return {text:e.textContent.trim().slice(0,90),colour:c,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};}).filter(e=>e.ratio<3);
    });
    fs.writeFileSync(stem+'-contrast.json',JSON.stringify(contrast,null,2));assert.equal(contrast.length,0,'No unreadable retained text '+item.key+' '+JSON.stringify(contrast.slice(0,5)));
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
     const panel=await page.locator('.sp-start-panel').boundingBox(),copy=await page.locator('.sp-start-copy').boundingBox();if(viewport.width>600)assert(panel.height-copy.height<5,'MO3 image must not create excess empty panel height');
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
