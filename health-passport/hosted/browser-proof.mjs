// Real hosted sign-in UI/password API, generated fictional credentials only.
// No cookie injection, removed dashboard scripts or forced shell visibility.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.env.PASSPORT_PREVIEW_URL;
assert.match(origin||'',/^https:\/\/shift-passport-preview-20260919\.[a-z0-9-]+\.workers\.dev$/);
const secrets=JSON.parse(readFileSync('health-passport/hosted/generated/probe.json'));
const source=JSON.parse(readFileSync('passport-hosted-proof/source.json'));
const out='passport-hosted-proof/browser';mkdirSync(out,{recursive:true});
const report={candidate:process.env.GITHUB_SHA,origin,scope:'hosted full captured dashboard scripts and real password login; fictional verified-email accounts; CAPTCHA and email delivery excluded',checks:[],browserErrors:[],failedRequests:[],productionWrites:false};
const browser=await chromium.launch({headless:true});report.browser={engine:'chromium',version:browser.version()};
const KEY='sst_start_here_handoff_v1';
async function api(page,path,method='GET',body){return page.evaluate(async({path,method,body})=>{const r=await fetch(path,{method,credentials:'include',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()}},{path,method,body});}
async function quiz(page){
 await page.goto(origin+'/start-here');
 await page.locator('[data-multi="why"] button').filter({hasText:'Lose weight'}).click();
 await page.locator('[data-multi="why"] button').filter({hasText:'Feel more energy'}).click();
 await page.locator('[data-quick-next]').click();
 await page.locator('[data-one="med"] button').filter({hasText:'No medication'}).click();
 await page.locator('[data-one="access"] button').filter({hasText:'NHS'}).click();
 await page.locator('[data-quick-next]').click();
 await page.locator('[data-one="budget"] button').filter({hasText:'£0 / NHS'}).click();
 await page.locator('[data-hp-remember]').check();await page.locator('[data-quick-next]').click();
 await page.locator('#quickResult').waitFor({state:'visible'});
}
async function signIn(page,id,{direct=false}={}){
 if(direct)await page.goto(origin+'/member-login?next='+encodeURIComponent('/member/dashboard?passport=1#journey'));
 await page.locator('#previewRegister [name="email"]').fill('probe'+id+'@example.invalid');
 await page.locator('#previewRegister [name="password"]').fill(secrets.password);
 await page.locator('#previewRegister [data-auth-submit]').click();
 await page.waitForURL(u=>u.pathname==='/member/dashboard',{timeout:30000});
 await page.locator('#previewMember.is-ready').waitFor({state:'visible'});
 await page.locator('nav.sst-member-tabs a[href="/member/dashboard#journey"]').first().click();
 await page.locator('[data-health-passport] details.hp-card').waitFor({state:'visible'});
 await page.locator('[data-health-passport] details.hp-card').evaluate(e=>e.open=true);
}
async function consent(page){
 const dialog=page.locator('dialog');await dialog.waitFor({state:'visible'});
 assert.equal(await page.locator('#healthConsentContinue').isEnabled(),false);
 await page.locator('#healthConsentCheck').check();await page.locator('#healthConsentContinue').click();await dialog.waitFor({state:'hidden'});
}
try{
 for(const [i,device,width] of [[0,'mobile',390],[1,'desktop',1440]]){
  const ids=[secrets.browserIds[i*2],secrets.browserIds[i*2+1]],blockedProduct=[];
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out+'/'+device,size:{width,height:900}}});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname.endsWith('shiftsometimber.co.uk')&&u.pathname.startsWith('/v1/'))blockedProduct.push(u.pathname);return route.abort()});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  const errors=[],httpFailures=[],scripts=new Set();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{const u=new URL(r.url());if(u.origin!==origin)return;if(/javascript/.test(r.headers()['content-type']||''))scripts.add(u.pathname);if(r.status()>=500)httpFailures.push({path:u.pathname,status:r.status()})});
  const check=async(name,fn)=>{try{await fn();report.checks.push({device,name,pass:true});console.log('PASS '+device+': '+name)}catch(e){report.checks.push({device,name,pass:false,error:e.message});await page.screenshot({path:out+'/'+device+'-failure.png',fullPage:true});writeFileSync(out+'/'+device+'-failure.html',await page.content());throw e}};
  try{
   await check('Actual Start Here account CTA leads through hosted login to the current dashboard',async()=>{
    await quiz(page);const kept=JSON.parse(await page.evaluate(key=>sessionStorage.getItem(key),KEY));assert.ok(kept?.draft);
    await page.getByRole('link',{name:'Create My Timber account →',exact:true}).click();
    await signIn(page,ids[0]);
    const cookie=(await context.cookies()).find(x=>x.name==='sst_session');assert.ok(cookie?.httpOnly&&cookie?.secure);assert.equal(cookie.domain,new URL(origin).hostname);
    assert.equal((await api(page,'/v1/me')).status,200);assert.ok(await page.locator('.hp-handoff').innerText());
   });
   await check('All original dashboard scripts remain; current Today and Journey run together',async()=>{
    const doc=source.sourcePages.find(x=>x.path==='/member/dashboard');const actual=await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.getAttribute('src')));
    for(const expected of doc.scripts)assert.ok(actual.includes(expected),'Missing original script '+expected);
    for(const p of ['/member-my-timber-problem-v1.js','/member-my-journey-v2.js','/member-my-journey-checkin-v1.js'])assert.ok(scripts.has(p),'Not loaded '+p);
    assert.equal(await page.locator('[data-health-passport]').count(),1);
    await page.locator('nav.sst-member-tabs a[href="/member/dashboard#today"]').first().click();await page.locator('#panel-today.active').waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.querySelector('#panel-today .mt-loading'),{timeout:30000});assert.ok((await page.locator('#panel-today').innerText()).length>80);
    await page.screenshot({path:out+'/'+device+'-today.png'});
    await page.locator('nav.sst-member-tabs a[href="/member/dashboard#journey"]').first().click();await page.locator('#panel-journey.active').waitFor({state:'visible'});
   });
   await check('Consent, exact answer save and persistent read-back work on hosted D1',async()=>{
    await page.locator('[data-hp-confirm]').check();await page.locator('[data-hp-save-start]').click();await consent(page);
    await page.waitForFunction(()=>document.querySelector('[data-hp-status]')?.textContent.includes('now saved'));assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),KEY),null);
    await page.reload();await page.locator('[data-health-passport] .hp-card').waitFor();const r=await api(page,'/v1/health-passport');assert.equal(r.status,200);assert.equal(r.body.passport.records.length,1);assert.deepEqual(r.body.passport.records[0].payload.answers.med,['No medication']);assert.equal(r.body.passport.baseline.startWeightKg,null);
   });
   await check('Personal treatment entry survives reload without modifying orders or another account',async()=>{
    await page.locator('.hp-card').evaluate(e=>e.open=true);await page.locator('[data-hp-add]').click();await page.locator('.hp-form [name="medicine"]').fill('Fictional integration entry');await page.locator('.hp-form [name="provider"]').fill('Fictional provider A');await page.locator('.hp-form [type="submit"]').click();
    await page.waitForFunction(()=>document.querySelector('[data-hp-status]')?.textContent.includes('history was saved'));await page.reload();await page.locator('.hp-card').waitFor();await page.locator('.hp-card').evaluate(e=>e.open=true);
    assert.ok((await page.locator('.hp-v1').innerText()).includes('Fictional provider A'));const r=await api(page,'/v1/health-passport');assert.equal(r.body.passport.orders.length,0);await page.locator('.hp-v1').screenshot({path:out+'/'+device+'-passport.png'});
   });
   await check('Real logout revokes the session, and another login cannot see the first account',async()=>{
    await page.locator('nav.sst-member-tabs .member-nav-more summary').click();await page.locator('[data-member-logout]').click();await page.waitForFunction(async()=>{const r=await fetch('/v1/me');return r.status===401});
    await signIn(page,ids[1],{direct:true});const r=await api(page,'/v1/health-passport');assert.equal(r.status,200);assert.deepEqual(r.body.passport.records,[]);assert.equal(r.body.passport.baseline.startWeightKg,null);assert.ok(!(await page.locator('.hp-v1').innerText()).includes('Fictional provider A'));
   });
   await check('Return to original account, export, withdraw and erase retain ownership boundaries',async()=>{
    await page.locator('nav.sst-member-tabs .member-nav-more summary').click();await page.locator('[data-member-logout]').click();await page.waitForFunction(async()=>{const r=await fetch('/v1/me');return r.status===401});
    await signIn(page,ids[0],{direct:true});const exported=await api(page,'/v1/privacy/export','POST');assert.equal(exported.status,200);assert.equal(exported.body.healthPassport.records.length,2);
    const erased=await api(page,'/v1/privacy/health-tracking','DELETE');assert.equal(erased.status,200);const r=await api(page,'/v1/health-passport');assert.deepEqual(r.body.passport.records,[]);assert.equal(r.body.passport.trackingConsent,false);
   });
   await check('No uncaught script failures, server errors, product-data egress or Passport overflow',async()=>{
    const rect=await page.locator('.hp-v1').evaluate(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:innerWidth}));assert.ok(rect.left>=-1&&rect.right<=rect.width+1);assert.deepEqual(errors,[]);assert.deepEqual(httpFailures,[]);assert.deepEqual(blockedProduct,[]);
   });
  }finally{report.browserErrors.push({device,errors});report.failedRequests.push({device,httpFailures,blockedProduct});await context.close()}
 }
}catch(error){report.error=String(error.message);process.exitCode=1}
finally{await browser.close();report.pass=report.checks.length===14&&report.checks.every(x=>x.pass)&&!report.error;writeFileSync(out+'/report.json',JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;console.log(JSON.stringify({pass:report.pass,checks:report.checks,error:report.error},null,2))}
