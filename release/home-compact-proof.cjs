const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
(async()=>{
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const {addHomeBanner,removeHomeBanner}=await import('../home-route-banner.mjs');
const {stabilisePublicHtml}=await import('../public-startup-stability.mjs');
const {verifyApprovedHome,removeApprovedHome}=await import('../home-compact-footer.mjs');
fs.mkdirSync('home-compact-proof',{recursive:true});
const r=await fetch('https://shiftsometimber.co.uk/');assert(r.ok);const before=await r.text(),candidate=stabilisePublicHtml('/',before);
verifyApprovedHome(candidate);assert.equal(removeApprovedHome(candidate),before,'Exact current production preservation');assert.equal(stabilisePublicHtml('/',candidate),candidate,'Idempotent');assert.equal(removeHomeBanner(candidate),removeHomeBanner(before));
const preview=await (await fetch('https://shift-home-footer-preview.matobrien.workers.dev/')).text();
const strip=s=>s.replace('<!--sst-approved-home-removals-20261001-->','').replace(/<style id="sst-cream-(?:header|footer)-preview">[\s\S]*?<\/style>/g,'');
assert.equal(strip(candidate),strip(preview),'Production candidate equals approved preview');
fs.writeFileSync('home-compact-proof/candidate.html',candidate);const results=[],browser=await chromium.launch();
try{for(const width of [320,390,768,1440]){const page=await browser.newPage({viewport:{width,height:1000}});await page.route('https://shift-home-footer-preview.matobrien.workers.dev/',route=>route.fulfill({status:200,contentType:'text/html',body:candidate}));await page.goto('https://shift-home-footer-preview.matobrien.workers.dev/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
const state=await page.locator('.hc-wrap').evaluate(el=>({overflow:document.documentElement.scrollWidth>innerWidth+1,cards:[...el.querySelectorAll('.hc-card')].map(c=>({height:c.getBoundingClientRect().height,width:c.getBoundingClientRect().width,overflow:c.scrollWidth>c.clientWidth+1,href:c.getAttribute('href')})),heading:getComputedStyle(el.querySelector('h2')).fontFamily,columns:getComputedStyle(el.querySelector('ol')).gridTemplateColumns}));
assert(!state.overflow,'Page overflow '+width);assert(state.cards.every(c=>!c.overflow),'Card overflow '+width);assert.equal(state.cards.length,4);assert.deepEqual(state.cards.map(c=>c.href),['/start-here','/programme','/shift-health','/member/dashboard']);if(width===1440)assert(state.cards.every(c=>c.height<260),'Compact card budget');
assert.equal(await page.locator('.route-panel,.alone-divider,#shift.home-platform').count(),0);assert.equal(await page.locator('#sst-footer-c .fc-main>section').count(),6);assert.equal(await page.locator('#sst-footer-c .footer-brand img').count(),1);
await page.locator('.hc-wrap').screenshot({path:'home-compact-proof/cards-'+width+'.png'});await page.locator('#sst-footer-c').screenshot({path:'home-compact-proof/footer-'+width+'.png'});
const menu=page.locator('.menu-trigger');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');results.push({width,...state});await page.close();}}finally{await browser.close();}
fs.writeFileSync('home-compact-proof/results.json',JSON.stringify(results,null,2));fs.writeFileSync('home-compact-proof/SHA256SUMS',fs.readdirSync('home-compact-proof').filter(n=>n!=='SHA256SUMS').map(n=>crypto.createHash('sha256').update(fs.readFileSync('home-compact-proof/'+n)).digest('hex')+'  '+n).join('\n'));
console.log('PASS current production preservation, approved preview equality, 320/390/768/1440 layouts and menu');
})().catch(e=>{console.error(e);process.exitCode=1});
