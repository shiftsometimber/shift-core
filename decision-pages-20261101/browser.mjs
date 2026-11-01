import assert from 'node:assert/strict';import fs from 'node:fs';
import {mainPages as pages,release} from './config.mjs';
export async function browserCheck({headers={},dir='decision-pages-evidence',label='candidate',responses=null}={}){
 const {chromium}=await import('../selected-pages-tools/node_modules/playwright/index.mjs'),browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']}),results=[],issues=[];
 try{for(const viewport of [{width:1440,height:1100},{width:768,height:1024},{width:390,height:844}]){
 const context=await browser.newContext({viewport,extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false})));
 await context.route('**/*',route=>{if(['POST','PUT','PATCH','DELETE'].includes(route.request().method()))return route.abort();const u=new URL(route.request().url()),saved=responses?.[u.pathname+u.search]||responses?.[u.pathname];return saved?route.fulfill(saved):route.continue();});
 for(const item of pages)for(const query of [false,true]){
 const page=await context.newPage();await page.goto('https://shiftsometimber.co.uk'+item.path+(query?'?presentation=1':''),{waitUntil:'load',timeout:60000});await page.locator('main[data-approved-release]').waitFor();await page.evaluate(()=>document.fonts.ready);
 const stem=dir+'/'+label+'-'+item.key+(query?'-query':'')+'-'+viewport.width;
 const layout=await page.evaluate(()=>{const m=document.querySelector('main'),h=m.querySelector('h1');return {release:m.dataset.approvedRelease,key:m.dataset.approvedPages,font:getComputedStyle(h).fontFamily,background:getComputedStyle(m).backgroundColor,heading:getComputedStyle(h).color,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1Count:m.querySelectorAll('h1').length,ticker:!!document.querySelector('#shift-public-news')};});
 assert.equal(layout.release,release);assert.equal(layout.key,item.key);assert.equal(layout.h1Count,1);assert(layout.font.includes('Arial'));assert.equal(layout.background,'rgb(5, 5, 5)');assert.equal(layout.heading,'rgb(231, 227, 218)');assert(!layout.ticker);assert(layout.scrollWidth<=viewport.width,'No page overflow '+item.key+' '+viewport.width);
 await page.screenshot({path:stem+'.png'});if(!query)await page.screenshot({path:stem+'-full.png',fullPage:true});
 const checkText=async()=>page.evaluate(()=>{
 const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=a=>a.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 return [...document.querySelectorAll('main p,main li,main h1,main h2,main h3,main strong,main label,main span,main button')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('.qa-scroll-table-v2224,#lifeStats,#uniStats,#uniDetails,#scenarioTable,#nhsEligibility,#gpSnapshot')).map(e=>{let bg=[255,255,255];for(let p=e;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]>=.95){bg=c;break;}}const c=rgb(getComputedStyle(e).webkitTextFillColor||getComputedStyle(e).color),a=lum(c),b=lum(bg),r=e.getBoundingClientRect();return {text:e.textContent.trim().slice(0,85),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),outside:r.left<-.5||r.right>innerWidth+.5,clipped:e.scrollWidth>e.clientWidth+2};}).filter(e=>e.ratio<3||e.outside||e.clipped);
 });
 const first=await checkText();if(first.length)issues.push({key:item.key,query,width:viewport.width,stage:'initial',content:first});
 const behaviour={};const guidance=page.locator('.dp-guidance');if(await guidance.count()){assert.equal(await guidance.evaluate(e=>e.open),false);await guidance.locator('summary').click();assert.equal(await guidance.evaluate(e=>e.open),true);await guidance.locator('summary').click();behaviour.guidance=true;}
 if(['decision','readiness'].includes(item.key)){
 const selector=item.key==='decision'?'.dec-tabs button':'.ready-tabs button';
 behaviour.emptyProfileDisabled=await page.locator(selector).evaluateAll(es=>es.filter(e=>e.disabled).map(e=>e.dataset.tab));
 if(item.key==='decision'){assert(behaviour.emptyProfileDisabled.includes('gp'),'Missing-profile report gate retained');assert(await page.locator('button[onclick="window.print()"]').isDisabled());}
 // Synthetic browser-local test data only. Every network mutation is aborted.
 await page.addInitScript(()=>{localStorage.setItem('sstHealthProfile',JSON.stringify({metrics:{heightCm:170,weightKg:95,bmi:32.9,waistCm:105},answers:{ethnicity:'White',t2d:'No',bpdiag:'No',goal:'Isolated visual test fixture'}}));localStorage.setItem('sstTreatmentFinder',JSON.stringify({answers:{},healthSnapshot:{bmi:32.9,com:[]},routes:[]}));});
 await page.reload({waitUntil:'load'});const tabs=await page.locator(selector).all();behaviour.tabs=[];
 for(const tab of tabs){const id=await tab.getAttribute('data-tab');assert(await tab.isEnabled());await tab.click();assert(await page.locator('#tab-'+id).isVisible());behaviour.tabs.push(id);}
 if(viewport.width===1440&&!query){const print=page.locator('main button[onclick="window.print()"]');await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});await print.click();assert.equal(await page.evaluate(()=>window.__printCalls),1);behaviour.originalPrintButton=true;await page.emulateMedia({media:'print'});assert(await page.locator('[data-dp-art]').evaluate(e=>getComputedStyle(e).display==='none'));await page.pdf({path:stem+'-report.pdf',format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});}
 await tabs[0].click();
 }
 if(['lifestyle','universal','future'].includes(item.key)){
 const map={lifestyle:['lifeA','lifeB','#compareLifestyle','#lifeFighterA'],universal:['uniA','uniB','#compareUniversal','#uniFighterA'],future:['futureA','futureB','button[onclick="doCompare()"]','#comparisonOutput']},[a,b,button,output]=map[item.key];
 await page.waitForFunction(id=>document.getElementById(id)?.options.length>2,a);
 const old=await page.locator(output).innerText();
 const choices=await page.locator('#'+a).evaluate(e=>[...e.options].filter(o=>o.value&&!o.disabled&&o.value!==e.value).map(o=>o.value));await page.locator('#'+a).selectOption(choices.at(-1));
 const other=await page.locator('#'+b).evaluate((e,chosen)=>[...e.options].filter(o=>o.value&&!o.disabled&&o.value!==chosen).map(o=>o.value),choices.at(-1));await page.locator('#'+b).selectOption(other[0]);await page.locator('main '+button).click();await page.waitForFunction(({selector,old})=>document.querySelector(selector)?.innerText!==old,{selector:output,old});assert((await page.locator(output).innerText()).trim());behaviour.comparisonChanged=true;
 if(item.key==='universal'){await page.locator('[data-preset-a="life:walking"]').click();assert.equal(await page.locator('#uniA').inputValue(),'life:walking');assert.equal(await page.locator('#uniB').inputValue(),'life:strength');behaviour.preset=true;}
 }
 if(item.key==='overseas'){
 await page.waitForFunction(()=>document.querySelector('#destinationSelect').options.length>2);const old=await page.locator('#destinationInfo').innerText();const choices=await page.locator('#destinationSelect').evaluate(e=>[...e.options].filter(o=>o.value!==e.value).map(o=>o.value));await page.locator('#destinationSelect').selectOption(choices.at(-1));await page.waitForFunction(old=>document.querySelector('#destinationInfo').innerText!==old,old);
 const cost=await page.locator('#trueCostResult').innerText();await page.locator('#quoteSurgery').fill('4500');await page.waitForFunction(old=>document.querySelector('#trueCostResult').innerText!==old,cost);const score=await page.locator('#packageScore').innerText();await page.locator('.package-check').first().check();await page.waitForFunction(old=>document.querySelector('#packageScore').innerText!==old,score);behaviour.destinationChanged=true;behaviour.costRecalculated=true;behaviour.packageChecklist=true;
 }
 const after=await checkText();if(after.length)issues.push({key:item.key,query,width:viewport.width,stage:'after-controls',content:after});
 if(!query)await page.screenshot({path:stem+'-interacted.png',fullPage:true});
 results.push({page:item.key,query,viewport,layout,behaviour});fs.writeFileSync(dir+'/'+label+'-browser.json',JSON.stringify(results,null,2));await page.close();
 }await context.close();}
 }finally{await browser.close();}
 fs.writeFileSync(dir+'/'+label+'-content-issues.json',JSON.stringify(issues,null,2));assert.equal(issues.length,0,'Readable unclipped text '+JSON.stringify(issues.slice(0,5)));return results;
}
