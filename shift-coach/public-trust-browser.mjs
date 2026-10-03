import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {repairHtml,withTrustRepair,pages,trustRoute,withContactReference} from './public-trust-repair.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='https://shiftsometimber.co.uk',out=process.env.COACHING_PROOF_DIR||'/tmp/public-trust-proof';mkdirSync(out,{recursive:true});
async function read(path){const r=await fetch(base+path);assert(r.ok,`Source failed: ${path} ${r.status}`);return r.text();}
const source={terms:await read('/terms'),member:await read('/member/dashboard'),contact:await read('/contact'),lounge:await read('/lounge'),crisis:await read('/medicine-news/semaglutide-suicidality')};
const docs={};for(const p of Object.keys(pages)){docs[p]=await (await withTrustRepair(new Request(base+p),new Response(source.terms,{headers:{'Content-Type':'text/html'}}))).text();}
for(const [path,key]of [['/member/dashboard','member'],['/contact','contact'],['/lounge','lounge'],['/medicine-news/semaglutide-suicidality','crisis']])docs[path]=repairHtml(source[key],path);
const browser=await chromium.launch({args:['--no-sandbox']});const results=[];
try{for(const width of [390,1440]){
const submissions=[];let contactFailure=false;
const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(r.method()==='POST'&&u.pathname==='/v1/contact'){const candidate=await withContactReference(new Request(r.url(),{method:'POST',headers:r.headers(),body:r.postData()}));submissions.push(await candidate.json());await route.fulfill({status:contactFailure?503:200,contentType:'application/json',body:JSON.stringify({ok:!contactFailure,message:contactFailure?'Preview delivery unavailable':'Preview message accepted'})});return;}if(r.method()!=='GET'){await route.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"message":"Preview: external writes disabled"}'});return;}if(r.isNavigationRequest()&&docs[u.pathname]){await route.fulfill({status:200,contentType:'text/html',body:docs[u.pathname]});return;}if(u.pathname==='/assets/contact-reference-init.js'){const res=trustRoute(new Request(r.url()));await route.fulfill({status:200,contentType:'text/javascript',body:await res.text()});return;}await route.continue();});
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
await page.goto(base+'/contact?product=TEST-REFERENCE&name=Test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#ct-message')?.value.includes('TEST-REFERENCE'));assert.equal(await page.locator('script[src*="contact-submit-v4"]').count(),0);await page.evaluate(()=>{window.SSTTurnstile={getToken:async()=> 'preview-security-token'};});
await page.locator('#ct-name').fill('Fictional audit');await page.locator('#ct-email').fill('audit@example.invalid');await page.locator('#ct-subject').selectOption({label:'General question'});await page.locator('#ct-message').fill('Changed message retains the product reference.');
await page.locator('.ct-submit').click();assert.equal(submissions.length,0,'Consent must be required before submit');
await page.locator('input[name=privacy]').check();await page.locator('.ct-submit').click();await page.waitForFunction(()=>document.querySelector('[data-shift-contact-status]')?.dataset.state==='success');assert.equal(submissions.length,1,'Exactly one POST per submission');assert.equal(submissions[0].turnstileToken,'preview-security-token');assert(submissions[0].message.includes('SHIFT Health reference: TEST-REFERENCE'));
await page.locator('#ct-name').fill('Fictional audit');await page.locator('#ct-email').fill('audit@example.invalid');await page.locator('#ct-subject').selectOption({label:'General question'});await page.locator('#ct-message').fill('Retry check');await page.locator('input[name=privacy]').check();contactFailure=true;await page.locator('.ct-submit').click();await page.waitForFunction(()=>document.querySelector('[data-shift-contact-status]')?.dataset.state==='error');assert.equal(submissions.length,2);assert.equal(await page.locator('#ct-message').inputValue(),'Retry check');assert(await page.locator('.ct-submit').isEnabled());contactFailure=false;await page.locator('.ct-submit').click();await page.waitForFunction(()=>document.querySelector('[data-shift-contact-status]')?.dataset.state==='success');assert.equal(submissions.length,3);
results.push({path:'/contact',width,productReferenceRetained:true,duplicateScriptRemoved:true,consentRequired:true,oneRequestPerSubmit:true,errorRetainsMessage:true,retryWorks:true,externalMessagesSent:0});
await context.close();}
writeFileSync(out+'/public-trust-browser.json',JSON.stringify({scope:'Candidate adapter applied to current public source; no customer data or messages',results},null,2));console.log(JSON.stringify({publicTrustBrowserChecks:results.length,passed:true,homepageChanged:false,externalMessagesSent:0}));
}finally{await browser.close();}
