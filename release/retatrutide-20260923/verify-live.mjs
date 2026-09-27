import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
const out=path.resolve('retatrutide-production-proof');await mkdir(out,{recursive:true});
const base='https://shiftsometimber.co.uk',guide='/guides/retatrutide-uk-guide';
const protectedRoutes=['/','/programme','/about','/shift-health','/start-here','/treatment-centre','/member-login','/member/dashboard','/mounjaro','/wegovy','/shop','/assets/v42.js','/site-config-v3a.js','/assets/shift-service-bridge-v1.js?v=2'];
const routes=[guide,'/explore-knowledge','/glp1-knowledge-centre','/sitemap.xml','/robots.txt',...protectedRoutes];
const sha=b=>createHash('sha256').update(b).digest('hex');
const phase=process.argv[2];assert.ok(['before','after'].includes(phase));
const report={phase,status:'RUNNING',checkedAt:new Date().toISOString(),commit:process.env.GITHUB_SHA,approvedContentCommit:'2311dc84089b0fdc853f5e86663c9e6acd7b7adc',http:[],preservation:[],browsers:[],failures:[],scope:'Anonymous live GET/HEAD and read-only browser checks. No account/payment mutation. Not independent clinical/legal review, physical Safari, analytics delivery or field Core Web Vitals.'};
const save=()=>writeFile(path.join(out,phase+'.json'),JSON.stringify(report,null,2)+'\n');
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'user-agent':'SHIFT-ReadOnly-Approved-Reta-Release/1','cache-control':'no-cache'}});const bytes=Buffer.from(await r.arrayBuffer());assert.equal(r.status,200,`${url}: ${r.status}`);return {r,bytes};}
try{
 const bodies={};
 for(const route of routes){const {r,bytes}=await get(base+route);bodies[route]=bytes.toString();const file=(route==='/'?'home':route.replace(/[^a-z0-9]+/gi,'_'))+'.txt';await mkdir(path.join(out,phase),{recursive:true});await writeFile(path.join(out,phase,file),bytes);report.http.push({route,status:r.status,finalUrl:r.url,bytes:bytes.length,sha256:sha(bytes),xRobotsTag:r.headers.get('x-robots-tag'),file});}
 report.sitemapUrls=[...bodies['/sitemap.xml'].matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);assert.ok(report.sitemapUrls.includes(base+guide));assert.equal(new Set(report.sitemapUrls).size,report.sitemapUrls.length,'Duplicate sitemap URL');report.sitemapCount=report.sitemapUrls.length;
 if(phase==='before'){report.status='PASS';await save();console.log(JSON.stringify(report,null,2));process.exit(0);}
 const before=JSON.parse(await readFile(path.join(out,'before.json'),'utf8'));
 for(const route of protectedRoutes.concat('/robots.txt')){const a=before.http.find(x=>x.route===route),b=report.http.find(x=>x.route===route);assert.ok(a);assert.equal(b.sha256,a.sha256,'Unrelated live response changed: '+route);assert.equal(b.status,a.status);report.preservation.push({route,bodyUnchanged:true,sha256:b.sha256});}
 assert.deepEqual([...report.sitemapUrls].sort(),[...before.sitemapUrls].sort(),'Live sitemap URL set changed');report.sitemapUrlDelta=0;
 assert.ok(bodies['/sitemap.xml'].includes('<loc>'+base+guide+'</loc>'));
 for(const route of [guide,'/explore-knowledge','/glp1-knowledge-centre']){const h=report.http.find(x=>x.route===route);assert.doesNotMatch(h.xRobotsTag||'',/noindex/i,route+' response noindex');assert.doesNotMatch(bodies[route],/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i,route+' meta noindex');}
 const expectedArticle=await readFile(path.join(process.env.SST_RELEASE_DIR,'guides/retatrutide-uk-guide.html'),'utf8');
 const {chromium,webkit}=createRequire(import.meta.url)(process.env.PW_MODULE);
 for(const [name,engine,width,height] of [['chromium-desktop',chromium,1440,1000],['chromium-mobile390',chromium,390,844],['chromium-mobile360',chromium,360,800],['webkit-mobile390',webkit,390,844]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},locale:'en-GB',deviceScaleFactor:1,reducedMotion:'reduce'});
  const result={name,engineVersion:browser.version(),viewport:{width,height},blockedWrites:[],pageErrors:[],failedResources:[],checks:[]};report.browsers.push(result);
  await context.route('**/*',async route=>{const r=route.request();if(!['GET','HEAD'].includes(r.method())){result.blockedWrites.push({method:r.method(),url:r.url().split('?')[0]});return route.fulfill({status:405,body:'Read-only publication verification'});}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>result.pageErrors.push(e.message));page.on('response',r=>{if(r.status()>=400)result.failedResources.push({status:r.status(),url:r.url().split('?')[0]});});
  try{
   await page.goto(base+guide,{waitUntil:'load',timeout:45000});await page.locator('[data-reta-guide] h1').waitFor({state:'visible'});
   await page.screenshot({path:path.join(out,name+'-first-visit.png'),animations:'disabled'});
   const necessary=page.getByRole('button',{name:'Necessary only',exact:true});if(await necessary.isVisible())await necessary.click();
   await page.screenshot({path:path.join(out,name+'-top.png'),animations:'disabled'});
   const dom=await page.evaluate(expected=>{const exp=new DOMParser().parseFromString(expected,'text/html'),plain=s=>(s||'').replace(/\s+/g,' ').trim();return {title:document.title,h1Count:document.querySelectorAll('h1').length,h1:document.querySelector('h1')?.textContent,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(x=>x.href),description:document.querySelector('meta[name=description]')?.content,overflow:document.documentElement.scrollWidth>innerWidth+1,mainText:document.querySelector('[data-reta-guide]')?.innerText,sections:[...exp.querySelectorAll('.reta-section[id]')].map(e=>({id:e.id,matches:plain(document.getElementById(e.id)?.textContent)===plain(e.textContent)})),sales:[...document.querySelectorAll('[data-reta-guide] a[href]')].map(x=>new URL(x.href).pathname).filter(p=>/^\/(?:start-here|programme|treatment-order|waiting-list|shop|mounjaro|wegovy)(?:\/|$)/.test(p)),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),imageErrors:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.getAttribute('src'))};},expectedArticle);
   assert.equal(dom.h1Count,1);assert.deepEqual(dom.canonical,[base+guide]);assert.equal(dom.overflow,false);assert.equal(dom.title,'Retatrutide UK: Availability, Trial Results & Safety');assert.equal(dom.h1,'Retatrutide (Reta) in the UK: what we know so far');assert.deepEqual(dom.sales,[]);assert.doesNotMatch(dom.mainText,/TRIUMPH Shift Programme|Turn useful information into a weight-management plan/);assert.equal(dom.sections.length,22);assert.ok(dom.sections.every(x=>x.matches),'Live article sections differ from approved copy');assert.deepEqual(dom.imageErrors,[]);
   const faqs=dom.schemas.filter(x=>x['@type']==='FAQPage');assert.equal(faqs.length,1);assert.equal(faqs[0].mainEntity.length,6);
   assert.deepEqual(await page.locator('[data-reta-guide] a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)),[]);
   result.dom={...dom,mainText:undefined,schemas:undefined};result.checks.push('One H1/self-canonical and approved title','All 22 approved sections preserved in live DOM','All fragment links resolve','Six FAQ answers in one schema','No rendered article sales links/promotion','No horizontal document overflow','Images loaded');
   const trigger=page.locator('.menu-trigger');await trigger.click();await page.waitForFunction(()=>document.querySelector('.menu-trigger')?.getAttribute('aria-expanded')==='true');await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('.menu-trigger')?.getAttribute('aria-expanded')==='false');assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);result.checks.push('Menu/Escape/focus return');
   const table=page.locator('.reta-table-wrap');await table.scrollIntoViewIfNeeded();await table.focus();assert.equal(await table.evaluate(e=>document.activeElement===e),true);await page.screenshot({path:path.join(out,name+'-evidence.png'),animations:'disabled'});await page.screenshot({path:path.join(out,name+'-full.png'),fullPage:true,animations:'disabled',timeout:45000});
   for(const hub of ['/explore-knowledge','/glp1-knowledge-centre']){await page.goto(base+hub,{waitUntil:'load',timeout:45000});const link=page.locator('main a[href="'+guide+'"]');assert.equal(await link.count(),1);if(hub==='/glp1-knowledge-centre'&&!await link.isVisible()){const disclosure=page.locator('details.shift-guided-library > summary');assert.equal(await disclosure.innerText(),'Browse the full GLP-1 library');await disclosure.click();}assert.equal(await link.isVisible(),true);await link.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,name+'-'+hub.slice(1)+'.png'),animations:'disabled'});await link.click();await page.waitForURL('**'+guide);assert.equal(await page.locator('[data-reta-guide] h1').isVisible(),true);result.checks.push('Live hub click-through: '+hub);}
   await page.goto(base+'/',{waitUntil:'load',timeout:45000});assert.equal(await page.locator('[data-shift-ai-full-wire]').count(),0,'Homepage ticker returned');result.checks.push('Homepage ticker absent');result.status='PASS';
  }catch(e){result.status='FAIL';result.error=String(e.stack||e);report.failures.push(name+': '+e.message);await page.screenshot({path:path.join(out,name+'-failure.png'),animations:'disabled'}).catch(()=>{});await writeFile(path.join(out,name+'-failure.html'),await page.content()).catch(()=>{});}
  finally{await context.close();await browser.close();await save();}
 }
 report.status=report.failures.length?'FAIL':'PASS';await save();assert.equal(report.failures.length,0,report.failures.join('\n'));console.log(JSON.stringify(report,null,2));
}catch(e){report.status='FAIL';report.failures.push(String(e.stack||e));await save();throw e;}
