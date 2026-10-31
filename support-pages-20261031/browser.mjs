import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mainPages as pages,release} from './config.mjs';
export async function browserCheck({headers={},dir='support-pages-evidence',label='candidate'}={}){
 const {chromium}=await import('../selected-pages-tools/node_modules/playwright/index.mjs'),browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']}),results=[];
 try{for(const viewport of [{width:1440,height:1100},{width:768,height:1024},{width:360,height:800},{width:390,height:844},{width:430,height:932}]){
  const context=await browser.newContext({viewport,extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'}),blockedWrites=[];
  await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false,updatedAt:new Date().toISOString()})));
  await context.route('**/*',route=>{if(['POST','PUT','PATCH','DELETE'].includes(route.request().method())){blockedWrites.push({method:route.request().method(),path:new URL(route.request().url()).pathname});return route.abort();}return route.continue();});
  for(const item of pages)for(const query of [false,true]){
   if(item.key!=='stock'&&![1440,768,390].includes(viewport.width))continue;
   const page=await context.newPage();let navigationAttempts=0;for(let attempt=1;attempt<=3;attempt++){navigationAttempts=attempt;try{await page.goto('https://shiftsometimber.co.uk'+item.path+(query?'?presentation=1':''),{waitUntil:'domcontentloaded',timeout:60000});break;}catch(error){if(attempt===3){fs.writeFileSync(dir+'/'+label+'-navigation-failure.html',await page.content());await page.screenshot({path:dir+'/'+label+'-navigation-failure.png'});throw error;}await new Promise(r=>setTimeout(r,1500));}}await page.locator('main[data-approved-release]').waitFor();await page.waitForLoadState('load',{timeout:45000});await page.evaluate(()=>document.fonts.ready);if(item.key==='causes'){await page.locator('.founder-strip img').scrollIntoViewIfNeeded();await page.locator('.founder-strip img').evaluate(i=>i.decode());}await page.evaluate(()=>window.scrollTo(0,0));
   const layout=await page.evaluate(()=>{const m=document.querySelector('main'),h=m.querySelector('h1');return {release:m.dataset.approvedRelease,key:m.dataset.approvedPages,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:m.querySelectorAll('h1').length,font:getComputedStyle(h).fontFamily,headingColour:getComputedStyle(h).color,background:getComputedStyle(m).backgroundColor,ticker:!!document.querySelector('#shift-public-news')};});
   assert.equal(layout.release,release);assert.equal(layout.key,item.key);assert.equal(layout.headings,1);assert(layout.scrollWidth<=viewport.width,'No overflow '+item.key+' '+viewport.width);assert(layout.font.includes('Arial'));assert.equal(layout.headingColour,'rgb(231, 227, 218)');assert.equal(layout.background,'rgb(5, 5, 5)');assert(!layout.ticker);
   const stem=dir+'/'+label+'-'+item.key+(query?'-query':'')+'-'+viewport.width;await page.screenshot({path:stem+'.png',fullPage:false});if(!query)await page.screenshot({path:stem+'-full.png',fullPage:true});
    const contrast=await page.evaluate(()=>{
     const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=a=>a.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
     return [...document.querySelectorAll('main p,main li,main h2,main h3,main strong,main td,main th,main span')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{let bg=[255,255,255];for(let p=e;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]>=.95){bg=c;break;}}const c=rgb(getComputedStyle(e).color),a=lum(c),b=lum(bg);return {text:e.textContent.trim().slice(0,90),colour:c,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};}).filter(e=>e.ratio<3);
    });
    fs.writeFileSync(stem+'-contrast.json',JSON.stringify(contrast,null,2));assert.equal(contrast.length,0,'No unreadable text '+item.key+' '+JSON.stringify(contrast.slice(0,5)));
   const behaviour={};
   if(item.key==='stock'){
    const form=page.locator('#stockUpdateForm');assert.equal(await form.count(),1);assert.equal(await form.locator('input').count(),3);
    const controls=await form.locator('input').evaluateAll(es=>es.map(e=>({name:e.name,type:e.type,required:e.required,checked:e.checked,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
    assert.deepEqual(controls.map(c=>({name:c.name,type:c.type,required:c.required})),[{name:'first_name',type:'text',required:false},{name:'email',type:'email',required:true},{name:'consent',type:'checkbox',required:true}]);assert(!controls[2].checked);assert(controls.slice(0,2).every(c=>c.height>=50));
    assert.equal(await form.locator('a').getAttribute('href'),'/privacy');assert.equal(await form.locator('button').innerText(),'Put my name down');assert((await page.locator('.su-boundary').innerText()).includes('not an order, reservation or guarantee'));
    const button=await form.locator('button').boundingBox(),consent=await form.locator('.ct-check').boundingBox();assert(button.height>=50&&consent.height>=44);
    if(viewport.width<=600){const a=await page.locator('.su-introduction').boundingBox(),b=await page.locator('.ct-form-card').boundingBox();assert(b.y>=a.y+a.height,'SU1 phone form follows intro');}
    if(viewport.width===1440&&!query){assert.equal(await form.evaluate(e=>e.checkValidity()),false);await form.locator('[name="first_name"]').fill('Layout check');await form.locator('[name="email"]').fill('layout-check@example.invalid');assert.equal(await form.evaluate(e=>e.checkValidity()),false);await form.locator('[name="consent"]').check();assert.equal(await form.evaluate(e=>e.checkValidity()),true);await form.locator('[name="consent"]').uncheck();assert.equal(await form.evaluate(e=>e.checkValidity()),false);behaviour.validation='Email and specific consent required; no submit performed';}
    behaviour.controls=controls;
   }else{
    assert.equal(await page.locator('.sp-support-hero').count(),1);assert.equal(await page.locator('.sp-support-symbol svg').count(),1);
    const cards=await page.locator('.authority-grid-v65>article,.press-card-v3b2,.promise-card-v3b1,.partner-placeholder,.mass-reading,.grid2>div').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim().slice(0,60),fits:[...e.children].every(c=>c.getBoundingClientRect().bottom<=r.bottom+1),height:r.height,decoration:getComputedStyle(e,'::before').content};}));assert(cards.every(c=>c.fits&&c.height>0&&c.decoration==='none'),'Cards fit without inherited decoration '+item.key);
    if(item.key==='promise')assert.equal(await page.locator('.promise-card-v3b1').count(),5);
    if(item.key==='contributors')assert.equal(await page.locator('.authority-grid-v65>article').count(),3);
    if(item.key==='press')assert.equal(await page.locator('.press-card-v3b2').count(),3);
    if(item.key==='partners'){assert((await page.locator('#partner-boundary-v42l').innerText()).includes('not automatically a clinical provider'));assert((await page.locator('.partner-placeholder').innerText()).includes('not filling this page with brands'));}
    const links=await page.locator('main a.btn').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,href:e.getAttribute('href')})));assert(links.every(l=>l.height>=44));behaviour.cards=cards;behaviour.links=links;
   }
   results.push({page:item.key,query,viewport,navigationAttempts,layout,behaviour});await page.close();
  }
  fs.writeFileSync(dir+'/'+label+'-blocked-writes-'+viewport.width+'.json',JSON.stringify({allMutationsAborted:true,blockedWrites},null,2));await context.close();
 }

 }finally{await browser.close();}
 fs.writeFileSync(dir+'/'+label+'-browser.json',JSON.stringify(results,null,2));return results;
}
