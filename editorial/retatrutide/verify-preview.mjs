import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PW_MODULE);
const out=path.resolve(process.env.RETA_PROOF_DIR||'retatrutide-proof');await mkdir(out,{recursive:true});
const base=new URL(process.env.RETA_PREVIEW_URL);assert.match(base.hostname,/^[a-f0-9]{8,32}\.projectshift\.pages\.dev$/);assert.notEqual(base.hostname,'0da69833.projectshift.pages.dev');
const guide='/guides/retatrutide-uk-guide',canonical='https://shiftsometimber.co.uk'+guide;
const expectedFp='1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0';
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={status:'RUNNING',commit:process.env.GITHUB_SHA,preview:base.origin,checkedAt:new Date().toISOString(),scope:'Static Pages preview; anonymous GET/HEAD only. Not production Worker integration, physical Safari, clinical review or field Core Web Vitals. Analytics writes are blocked; this is not a consent/analytics compliance test.',http:[],browsers:[],failures:[]};
const save=()=>writeFile(path.join(out,'hosted-proof.json'),JSON.stringify(report,null,2)+'\n');
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(40000),headers:{'user-agent':'SHIFT-ReadOnly-Reta-Preview-Proof/1'}});assert.equal(r.status,200,url);return {r,bytes:Buffer.from(await r.arrayBuffer())};}
try{
 for(const [route,file] of [[guide,'guides/retatrutide-uk-guide.html'],['/explore-knowledge','explore-knowledge.html'],['/glp1-knowledge-centre','glp1-knowledge-centre.html'],['/sitemap.xml','sitemap.xml']]){
  const {r,bytes}=await get(new URL(route,base)),expected=await readFile(path.join(process.env.SST_RELEASE_DIR,file));assert.equal(sha(bytes),sha(expected),'Hosted bytes differ: '+route);
  const noindex=r.headers.get('x-robots-tag')||'';assert.match(noindex,/noindex/i,'Preview indexing must be blocked: '+route);
  report.http.push({route,status:r.status,finalUrl:r.url,bytes:bytes.length,sha256:sha(bytes),exactCandidateMatch:true,xRobotsTag:noindex});
 }
 const live=await get('https://projectshift.pages.dev/DEPLOYMENT-FINGERPRINT.json');assert.equal(JSON.parse(live.bytes.toString()).aggregate_sha256,expectedFp,'Production Pages fingerprint moved');report.productionPagesFingerprintUnchanged=expectedFp;
 for(const [name,engine,width,height] of [['chromium-desktop',chromium,1440,1000],['chromium-mobile390',chromium,390,844],['chromium-mobile360',chromium,360,800],['webkit-mobile390',webkit,390,844]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:'en-GB',reducedMotion:'reduce'});
  const result={name,engineVersion:browser.version(),viewport:{width,height},blockedWrites:[],pageErrors:[],failedResources:[],checks:[]};report.browsers.push(result);
  await context.route('**/*',async route=>{const req=route.request();if(!['GET','HEAD'].includes(req.method())){result.blockedWrites.push({method:req.method(),url:req.url().split('?')[0]});return route.fulfill({status:405,body:'Read-only preview proof'});}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>result.pageErrors.push(String(e.message)));page.on('response',r=>{if(r.status()>=400)result.failedResources.push({status:r.status(),url:r.url().split('?')[0]});});
  try{
   await page.goto(new URL(guide,base).href,{waitUntil:'load',timeout:45000});await page.locator('[data-reta-guide] h1').waitFor({state:'visible'});
   await page.screenshot({path:path.join(out,name+'-first-visit.png'),animations:'disabled'});
   const necessary=page.getByRole('button',{name:'Necessary only',exact:true});if(await necessary.isVisible()){await necessary.click();result.readingConsentChoice='Necessary only';}
   await page.screenshot({path:path.join(out,name+'-top.png'),animations:'disabled'});
   const dom=await page.evaluate(()=>({title:document.title,h1:document.querySelectorAll('h1').length,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(x=>x.href),overflow:document.documentElement.scrollWidth>innerWidth+1,description:document.querySelector('meta[name=description]')?.content,mainText:document.querySelector('[data-reta-guide]')?.innerText,mainSalesLinks:[...document.querySelectorAll('[data-reta-guide] a[href]')].map(x=>new URL(x.href).pathname).filter(p=>/^\/(?:start-here|programme|treatment-order|waiting-list|shop|mounjaro|wegovy)(?:\/|$)/.test(p)),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),imageErrors:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.getAttribute('src'))}));
   assert.equal(dom.h1,1);assert.deepEqual(dom.canonical,[canonical]);assert.equal(dom.overflow,false,'Document horizontal overflow');assert.match(dom.title,/Retatrutide UK: Availability, Trial Results & Safety/);assert.match(dom.mainText,/TRIUMPH programme/);assert.doesNotMatch(dom.mainText,/TRIUMPH Shift Programme|Turn useful information into a weight-management plan/);assert.deepEqual(dom.mainSalesLinks,[],'Sales bridge was dynamically reinstated');assert.deepEqual(dom.imageErrors,[],'Article shell image failed to load');
   const faqs=dom.schemas.filter(x=>x['@type']==='FAQPage');assert.equal(faqs.length,1);assert.equal(faqs[0].mainEntity.length,6);
   const fragments=await page.locator('[data-reta-guide] a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(fragments,[]);
   result.checks.push('One visible H1, canonical and metadata match','No document overflow','All article fragment links resolve','One FAQ entity matches six visible questions','No rendered article sales routes or shared programme promotion','All article shell images loaded');result.dom={...dom,mainText:undefined,schemas:undefined};
   const trigger=page.locator('.menu-trigger');await trigger.click();await page.waitForFunction(()=>document.querySelector('.menu-trigger')?.getAttribute('aria-expanded')==='true');await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('.menu-trigger')?.getAttribute('aria-expanded')==='false');assert.equal(await trigger.evaluate(e=>document.activeElement===e),true,'Menu focus did not return');result.checks.push('Menu opens, Escape closes and focus returns');
   const table=page.locator('.reta-table-wrap');await table.scrollIntoViewIfNeeded();await table.focus();result.table=await table.evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,focusable:document.activeElement===e,role:e.getAttribute('role')}));assert.equal(result.table.focusable,true);
   await page.screenshot({path:path.join(out,name+'-evidence.png'),animations:'disabled'});result.checks.push('Evidence table keyboard-focusable within scrolling region');await page.screenshot({path:path.join(out,name+'-full.png'),fullPage:true,animations:'disabled',timeout:45000});
   for(const hub of ['/explore-knowledge','/glp1-knowledge-centre']){
    await page.goto(new URL(hub,base).href,{waitUntil:'load',timeout:45000});const link=page.locator('main a[href="'+guide+'"]');assert.equal(await link.count(),1,'Duplicate or absent discovery link: '+hub);assert.equal(await link.isVisible(),true,'Discovery hidden from readers: '+hub);
    await link.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,name+'-'+hub.slice(1)+'.png'),animations:'disabled'});await link.click();await page.waitForURL('**'+guide);assert.equal(await page.locator('[data-reta-guide] h1').isVisible(),true);result.checks.push('Visible discovery link works: '+hub);
   }
   result.status='PASS';
  }catch(e){result.status='FAIL';result.error=String(e.stack||e);report.failures.push(name+': '+e.message);await page.screenshot({path:path.join(out,name+'-failure.png'),animations:'disabled'}).catch(()=>{});await writeFile(path.join(out,name+'-failure.html'),await page.content()).catch(()=>{});}
  finally{await context.close();await browser.close();await save();}
 }
 report.status=report.failures.length?'FAIL':'PASS';await save();assert.equal(report.failures.length,0,report.failures.join('\n'));console.log(JSON.stringify(report,null,2));
}catch(e){report.status='FAIL';report.failures.push(String(e.stack||e));await save();throw e;}
