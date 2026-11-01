import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mainPages as pages,release} from './config.mjs';
export async function browserCheck({headers={},dir='surgery-guides-evidence',label='candidate',responses=null}={}){
 const {chromium}=await import('../selected-pages-tools/node_modules/playwright/index.mjs'),browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']}),results=[],contentIssues=[];
 try{for(const viewport of [{width:1440,height:1100},{width:768,height:1024},{width:390,height:844}]){
  const context=await browser.newContext({viewport,extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'}),blockedWrites=[];
  await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false,updatedAt:new Date().toISOString()})));
  await context.route('**/*',route=>{if(['POST','PUT','PATCH','DELETE'].includes(route.request().method())){blockedWrites.push({method:route.request().method(),path:new URL(route.request().url()).pathname});return route.abort();}const u=new URL(route.request().url()),saved=responses?.[u.pathname+u.search]||responses?.[u.pathname];if(saved)return route.fulfill(saved);return route.continue();});
  for(const item of pages)for(const query of [false,true]){
   const page=await context.newPage();let navigationAttempts=0;for(let attempt=1;attempt<=3;attempt++){navigationAttempts=attempt;try{await page.goto('https://shiftsometimber.co.uk'+item.path+(query?'?presentation=1':''),{waitUntil:'domcontentloaded',timeout:60000});break;}catch(error){if(attempt===3){fs.writeFileSync(dir+'/'+label+'-navigation-failure.html',await page.content());await page.screenshot({path:dir+'/'+label+'-navigation-failure.png'});throw error;}await new Promise(r=>setTimeout(r,1500));}}
   await page.locator('main[data-approved-release]').waitFor();await page.waitForLoadState('load',{timeout:45000});await page.evaluate(()=>document.fonts.ready);
   if(item.photo){const photo=page.locator('.qr-photo img');await photo.evaluate(i=>i.decode());assert(await photo.evaluate(i=>i.naturalWidth>=1200),'Dedicated hero image decoded '+item.key);}
   await page.evaluate(()=>window.scrollTo(0,0));
   const layout=await page.evaluate(()=>{const m=document.querySelector('main'),h=m.querySelector('h1');return {release:m.dataset.approvedRelease,key:m.dataset.approvedPages,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:m.querySelectorAll('h1').length,font:getComputedStyle(h).fontFamily,headingColour:getComputedStyle(h).color,background:getComputedStyle(m).backgroundColor,headingBounds:{left:h.getBoundingClientRect().left,right:h.getBoundingClientRect().right,scroll:h.scrollWidth,width:h.clientWidth},ticker:!!document.querySelector('#shift-public-news')};});
   assert.equal(layout.release,release);assert.equal(layout.key,item.key);assert.equal(layout.headings,1);assert(layout.scrollWidth<=viewport.width,'No page overflow '+item.key+' '+viewport.width);assert(layout.font.includes('Arial'));assert.equal(layout.headingColour,'rgb(231, 227, 218)');assert.equal(layout.background,'rgb(5, 5, 5)');assert(!layout.ticker);assert(layout.headingBounds.left>=0&&layout.headingBounds.right<=viewport.width&&layout.headingBounds.scroll<=layout.headingBounds.width+1,'Heading fits '+item.key+' '+viewport.width);
   const stem=dir+'/'+label+'-'+item.key+(query?'-query':'')+'-'+viewport.width;
   await page.screenshot({path:stem+'.png',fullPage:false});if(!query)await page.screenshot({path:stem+'-full.png',fullPage:true});
   const content=await page.evaluate(()=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=a=>a.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    return [...document.querySelectorAll('main p,main li,main h1,main h2,main h3,main strong,main td,main th,main span')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{let bg=[255,255,255];for(let p=e;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]>=.95){bg=c;break;}}const c=rgb(getComputedStyle(e).color),a=lum(c),b=lum(bg),r=e.getBoundingClientRect();return {text:e.textContent.trim().slice(0,90),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),outside:!e.closest('.qa-scroll-table-v2224')&&(r.left<-.5||r.right>innerWidth+.5),clipped:e.scrollWidth>e.clientWidth+2};}).filter(e=>e.ratio<3||e.outside||e.clipped);
   });fs.writeFileSync(stem+'-content.json',JSON.stringify(content,null,2));if(content.length)contentIssues.push({page:item.key,query,viewport,content});
   assert.equal(await page.locator('.qr-hero').count(),1);assert.equal(await page.locator('.qr-hero-copy').count(),1);assert.equal(await page.locator('main form').count(),0);
   if(item.key==='readiness')assert.equal(await page.locator('.ready-card').count(),4);
   if(item.key==='governance')assert.equal(await page.locator('.governance-register-v65>article').count(),3);
   if(item.key==='editorial')assert.equal(await page.locator('.authority-grid-v65>article').count(),3);
   if(item.key==='reviews')assert.equal(await page.locator('.review-score>div').count(),5);
   if(await page.locator('.editorial-note-v2222').count())assert((await page.locator('.editorial-note-v2222').innerText()).includes('does not diagnose'));
   if(['readiness','progress'].includes(item.key))assert(await page.locator('main code').count()>0);
   if(item.key==='disclaimer'){
    const boundary=page.locator('#v30h-emergency-boundary');assert.equal(await boundary.count(),1);assert((await boundary.innerText()).includes('Not an emergency service'));assert((await boundary.boundingBox()).y<(await page.locator('main h1').boundingBox()).y,'Emergency boundary remains above the title');
   }
   const links=await page.locator('main a.btn,main button.btn').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,href:e.getAttribute('href')})));assert(links.every(l=>l.height>=44));
   const behaviour={links}; if(await page.locator('.surg2-table').count()){const table=page.locator('.qa-scroll-table-v2224'); const scroll=await table.evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,overflow:getComputedStyle(e).overflowX}));assert(['auto','scroll'].includes(scroll.overflow));if(viewport.width===390){assert(scroll.scrollWidth>scroll.width);await table.evaluate(e=>e.scrollLeft=100);assert(await table.evaluate(e=>e.scrollLeft>0));}behaviour.table=scroll;}const index=page.locator('.qr-index');if(await index.count()){
    assert.equal(await index.evaluate(e=>e.open),false);assert((await index.locator('summary').boundingBox()).height>=48);await index.locator('summary').click();assert.equal(await index.evaluate(e=>e.open),true);
    const anchors=await index.locator('a').evaluateAll(es=>es.map(e=>({id:e.getAttribute('href').slice(1),height:e.getBoundingClientRect().height,target:!!document.getElementById(e.getAttribute('href').slice(1))})));assert(anchors.every(a=>a.target&&a.height>=44));
    await index.locator('a').first().click();await page.waitForFunction(id=>{const top=document.getElementById(id)?.getBoundingClientRect().top;return top>=60&&top<350;},anchors[0].id,{timeout:5000});behaviour.index={count:anchors.length,position:await page.locator('#'+anchors[0].id).evaluate(e=>e.getBoundingClientRect().top)};
   }
   if(item.kind==='printable'&&!query){
    const print=page.locator('main button[onclick=\"window.print()\"]');assert.equal(await print.count(),1);await page.evaluate(()=>{window.__remainingPrintCalls=0;window.print=()=>{window.__remainingPrintCalls++;};});await print.click();assert.equal(await page.evaluate(()=>window.__remainingPrintCalls),1,'Original print control works');behaviour.printButton=true;
    if(viewport.width===1440){
     const count=await page.locator('main li').count();assert(count>0);await page.emulateMedia({media:'print'});
     const printed=await page.evaluate(()=>{const m=document.querySelector('main');return {paperBackground:[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.body).backgroundColor],ancestors:[...function*(){for(let e=m;e;e=e.parentElement)yield {tag:e.tagName,id:e.id,display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility,contentVisibility:getComputedStyle(e).contentVisibility};}()],outsideMain:[...document.body.children].filter(e=>e!==m&&!e.contains(m)&&!['SCRIPT','STYLE'].includes(e.tagName)&&[...e.getClientRects()].some(r=>r.width>0&&r.height>0)).map(e=>({tag:e.tagName,id:e.id})),background:getComputedStyle(m).backgroundColor,heading:getComputedStyle(m.querySelector('h1')).color,hiddenArt:[...m.querySelectorAll('[data-rp-decoration],.no-print')].every(e=>getComputedStyle(e).display==='none'),visibleItems:[...m.querySelectorAll('li')].filter(e=>e.getClientRects().length).length};});
     fs.writeFileSync(stem+'-print-layout.json',JSON.stringify(printed,null,2));await page.screenshot({path:stem+'-print.png',fullPage:true});assert.deepEqual(printed.paperBackground,['rgb(255, 255, 255)','rgb(255, 255, 255)'],'Entire paper is white');assert.equal(printed.background,'rgb(255, 255, 255)');assert.equal(printed.heading,'rgb(0, 0, 0)');assert(printed.hiddenArt);assert.deepEqual(printed.outsideMain,[],'Site navigation and footer do not print');assert.equal(printed.visibleItems,count,'Every checklist point prints');
     const pdf=await page.pdf({path:stem+'-print.pdf',format:'A4',printBackground:true});const pageCount=(pdf.toString('latin1').match(/\/Type\s*\/Page(?:\s|\/|>)/g)||[]).length;assert(pageCount>=1&&pageCount<=3,'Printable resource stays within three pages '+item.key+' '+pageCount);behaviour.print={...printed,pages:pageCount};await page.emulateMedia({media:'screen'});
    }
   }
   results.push({page:item.key,query,viewport,navigationAttempts,layout,behaviour});await page.close();
  }
  fs.writeFileSync(dir+'/'+label+'-blocked-writes-'+viewport.width+'.json',JSON.stringify({allMutationsAborted:true,blockedWrites},null,2));await context.close();
 }
 }finally{await browser.close();}
 fs.writeFileSync(dir+'/'+label+'-browser.json',JSON.stringify(results,null,2));fs.writeFileSync(dir+'/'+label+'-content-issues.json',JSON.stringify(contentIssues,null,2));assert.equal(contentIssues.length,0,'All text readable and unclipped '+JSON.stringify(contentIssues.slice(0,5)));return results;
}
