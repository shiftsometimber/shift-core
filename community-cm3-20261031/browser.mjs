import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mainPages as pages,release} from './config.mjs';
export async function browserCheck({headers={},dir='community-cm3-evidence',label='candidate'}={}){
 const {chromium}=await import('../selected-pages-tools/node_modules/playwright/index.mjs'),browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']}),results=[];
 try{for(const viewport of [{width:1440,height:1100},{width:768,height:1024},{width:360,height:800},{width:390,height:844},{width:430,height:932}]){
  const context=await browser.newContext({viewport,extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'}),blockedWrites=[];
  await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false,updatedAt:new Date().toISOString()})));
  await context.route('**/*',route=>{if(['POST','PUT','PATCH','DELETE'].includes(route.request().method())){blockedWrites.push({method:route.request().method(),path:new URL(route.request().url()).pathname});return route.abort();}return route.continue();});
  for(const item of pages)for(const query of [false,true]){
   const page=await context.newPage();let navigationAttempts=0;for(let attempt=1;attempt<=3;attempt++){navigationAttempts=attempt;try{await page.goto('https://shiftsometimber.co.uk'+item.path+(query?'?presentation=1':''),{waitUntil:'domcontentloaded',timeout:60000});break;}catch(error){if(attempt===3){fs.writeFileSync(dir+'/'+label+'-navigation-failure.html',await page.content());await page.screenshot({path:dir+'/'+label+'-navigation-failure.png'});throw error;}await new Promise(r=>setTimeout(r,1500));}}await page.locator('main[data-approved-release]').waitFor();await page.waitForLoadState('load',{timeout:45000});await page.evaluate(()=>document.fonts.ready);await page.locator('main .cm-photo img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));if(item.key==='causes'){await page.locator('.founder-strip img').scrollIntoViewIfNeeded();await page.locator('.founder-strip img').evaluate(i=>i.decode());}await page.evaluate(()=>window.scrollTo(0,0));
   const layout=await page.evaluate(()=>{const m=document.querySelector('main'),h=m.querySelector('h1');return {release:m.dataset.approvedRelease,key:m.dataset.approvedPages,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:m.querySelectorAll('h1').length,font:getComputedStyle(h).fontFamily,headingColour:getComputedStyle(h).color,background:getComputedStyle(m).backgroundColor,ticker:!!document.querySelector('#shift-public-news')};});
   assert.equal(layout.release,release);assert.equal(layout.key,item.key);assert.equal(layout.headings,1);assert(layout.scrollWidth<=viewport.width,'No overflow '+item.key+' '+viewport.width);assert(layout.font.includes('Arial'));assert.equal(layout.headingColour,'rgb(231, 227, 218)');assert.equal(layout.background,'rgb(5, 5, 5)');assert(!layout.ticker);
   const stem=dir+'/'+label+'-'+item.key+(query?'-query':'')+'-'+viewport.width;await page.screenshot({path:stem+'.png',fullPage:false});if(!query)await page.screenshot({path:stem+'-full.png',fullPage:true});
    const contrast=await page.evaluate(()=>{
     const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=a=>a.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
     return [...document.querySelectorAll('main p,main li,main h2,main h3,main strong,main td,main th,main span')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{let bg=[255,255,255];for(let p=e;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]>=.95){bg=c;break;}}const c=rgb(getComputedStyle(e).color),a=lum(c),b=lum(bg);return {text:e.textContent.trim().slice(0,90),colour:c,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};}).filter(e=>e.ratio<3);
    });
    fs.writeFileSync(stem+'-contrast.json',JSON.stringify(contrast,null,2));assert.equal(contrast.length,0,'No unreadable text '+item.key+' '+JSON.stringify(contrast.slice(0,5)));
   const behaviour={};
   assert.equal(await page.locator('.cm-channel').count(),3);assert.deepEqual(await page.locator('.cm-channel h3').allTextContents(),['Facebook','Instagram','X']);
   assert.equal(await page.locator('.cm-photo img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
   const channels=await page.locator('.cm-channel a').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,href:e.getAttribute('href'),target:e.getAttribute('target'),rel:e.getAttribute('rel'),text:e.textContent.trim()})));
   assert.deepEqual(channels.map(x=>x.href),['https://facebook.com/ShiftSomeTimber','https://instagram.com/ShiftSomeTimber','https://x.com/ShiftSomeTimber']);assert(channels.every(x=>x.height>=44&&x.target==='_blank'&&x.rel.includes('noopener')&&x.rel.includes('noreferrer')));
   const stock=await page.locator('.newsletter-v2223 a').evaluate(e=>({height:e.getBoundingClientRect().height,href:e.getAttribute('href'),text:e.textContent.trim()}));assert(stock.height>=48&&stock.href==='/waiting-list-journey'&&stock.text==='Get stock updates');assert((await page.locator('.newsletter-v2223').innerText()).includes('not an order, reservation or guarantee'));
   assert.equal(await page.locator('.cm-principles li').count(),5);assert.equal(await page.locator('main form').count(),0);
   const rows=await page.locator('.cm-channel').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {fits:[...e.children].every(c=>c.getBoundingClientRect().bottom<=r.bottom+1),decoration:getComputedStyle(e,'::before').content};}));assert(rows.every(r=>r.fits&&r.decoration==='none'),'Natural channel row height without legacy decoration');
   if(viewport.width<=600){const a=await page.locator('.cm-copy').boundingBox(),b=await page.locator('.cm-photo').boundingBox();assert(b.y>=a.y+a.height,'Mobile photo follows headline and introduction');const c=await page.locator('.cm-principles').boundingBox(),d=await page.locator('.newsletter-v2223').boundingBox();assert(d.y>=c.y+c.height,'Mobile information panels stack');}
   behaviour.channels=channels;behaviour.stock=stock;behaviour.rows=rows;
   results.push({page:item.key,query,viewport,navigationAttempts,layout,behaviour});await page.close();
  }
  fs.writeFileSync(dir+'/'+label+'-blocked-writes-'+viewport.width+'.json',JSON.stringify({allMutationsAborted:true,blockedWrites},null,2));await context.close();
 }

 }finally{await browser.close();}
 fs.writeFileSync(dir+'/'+label+'-browser.json',JSON.stringify(results,null,2));return results;
}
