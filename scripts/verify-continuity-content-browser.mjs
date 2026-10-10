const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {mkdirSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';
import {renderContinuityDocument,continuityPages} from '../public-continuity.mjs';
import {approvedContinuityBody} from '../release/public-continuity-body-proof.mjs';
const origin='https://shiftsometimber.co.uk', out='continuity-content-browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
for(const width of [390,1440])for(const path of ['/clinic-gone-quiet','/provider-switch']){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
 const response=await fetch(origin+path);assert.equal(response.status,200);const live=await response.text();
 let candidate=renderContinuityDocument(live,path).replace(/<main\b[^>]*>[\s\S]*?<\/main>/,()=>'<main id="main-content" class="continuity-page" data-public-continuity>'+approvedContinuityBody(path)+'</main>');
 await page.route(origin+path,route=>route.fulfill({status:200,contentType:'text/html',body:candidate}));
 await page.goto(origin+path,{waitUntil:'domcontentloaded'});await page.locator('main h1').waitFor();
 assert.equal(await page.locator('main h1').count(),1);assert(await page.locator('main').innerText().then(t=>t.includes(path==='/clinic-gone-quiet'?'First decide what you need help with':'Your five-minute handover note')));
 const geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,main:document.querySelector('main').getBoundingClientRect().toJSON()}));assert(geometry.document<=width+1,'horizontal overflow');
 const headings=await page.locator('main h2').allTextContents();const links=await page.locator('main a').evaluateAll(as=>as.map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})));
 await page.screenshot({path:out+path+'-'+width+'.png',fullPage:true});
 const target=path==='/clinic-gone-quiet'?'/help':'/clinic-gone-quiet';await page.locator('main a[href="'+target+'"]').first().click();await page.waitForLoadState('domcontentloaded');const destination={url:page.url(),heading:await page.locator('h1').first().innerText()};assert(destination.url.includes(target));assert(destination.heading.length>5);
 results.push({path,width,mode:'Candidate exact body rendered in production shell via browser interception; NOT live deployment',headings,geometry,destination,links});await context.close();
}
await browser.close();writeFileSync(out+'/browser-proof.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results.map(({path,width,geometry,destination})=>({path,width,geometry,destination})),null,2));
