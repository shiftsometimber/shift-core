import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {repairHtml,withTrustRepair,pages,trustRoute} from './public-trust-repair.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='https://shiftsometimber.co.uk',out=process.env.COACHING_PROOF_DIR||'/tmp/public-trust-proof';mkdirSync(out,{recursive:true});
async function read(path){const r=await fetch(base+path);assert(r.ok,`Source failed: ${path} ${r.status}`);return r.text();}
const source={terms:await read('/terms'),member:await read('/member/dashboard'),contact:await read('/contact'),lounge:await read('/lounge'),crisis:await read('/medicine-news/semaglutide-suicidality')};
const docs={};for(const p of Object.keys(pages)){docs[p]=await (await withTrustRepair(new Request(base+p),new Response(source.terms,{headers:{'Content-Type':'text/html'}}))).text();}
for(const [path,key]of [['/member/dashboard','member'],['/contact','contact'],['/lounge','lounge'],['/medicine-news/semaglutide-suicidality','crisis']])docs[path]=repairHtml(source[key],path);
const browser=await chromium.launch({args:['--no-sandbox']});const results=[];
try{for(const width of [390,1440]){
const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(r.method()!=='GET'){await route.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"message":"Preview: external writes disabled"}'});return;}if(r.isNavigationRequest()&&docs[u.pathname]){await route.fulfill({status:200,contentType:'text/html',body:docs[u.pathname]});return;}if(u.pathname==='/assets/contact-reference-init.js'){const res=trustRoute(new Request(r.url()));await route.fulfill({status:200,contentType:'text/javascript',body:await res.text()});return;}await route.continue();});
const page=await context.newPage();
for(const path of [...Object.keys(pages),'/lounge','/medicine-news/semaglutide-suicidality']){
 await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.locator('main').waitFor();
 assert.equal(await page.locator('main h1').count(),1,path+' H1');assert(await page.locator('main h1').isVisible());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' overflow '+width);
 if(path.includes('suicidality'))assert(await page.locator('[data-shift-urgent-help] a[href^="tel:116123"]').isVisible());
 if(path==='/lounge')assert.equal(await page.locator('link[rel=canonical]').first().getAttribute('href'),base+'/lounge');
 await page.screenshot({path:out+'/trust-'+path.replaceAll('/','-')+'-'+width+'.png'});results.push({path,width,pass:true});
}
await page.goto(base+'/member/dashboard',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.visual-gen').count(),0);assert.equal(await page.locator('#savedPhotos').count(),1);assert.equal(await page.locator('#saveOriginal').count(),1);results.push({path:'/member/dashboard',width,generatedControlsRemoved:true,realPhotosRetained:true});
await page.goto(base+'/contact?product=TEST-REFERENCE&name=Test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#ct-message')?.value.includes('TEST-REFERENCE'));assert.equal(await page.locator('script[src*="contact-submit-v4"]').count(),0);results.push({path:'/contact',width,productReferenceRetained:true,duplicateScriptRemoved:true,externalMessagesSent:0});
await context.close();}
writeFileSync(out+'/public-trust-browser.json',JSON.stringify({scope:'Candidate adapter applied to current public source; no customer data or messages',results},null,2));console.log(JSON.stringify({publicTrustBrowserChecks:results.length,passed:true,homepageChanged:false,externalMessagesSent:0}));
}finally{await browser.close();}
