// Hosted settings presentation with fictional API responses. No sign-in,
// credentials, account writes, external requests or email delivery.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {passwordSettingsRuntime} from '../../member-experience/password-settings.mjs';

const origin=process.env.WORK_STAGING_URL;
if(process.env.GITHUB_ACTIONS!=='true'||!/^https:\/\/shift-core-work-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin||''))throw Error('Use the isolated hosted staging workflow only');
const out='work/staging/generated/password-settings-proof';mkdirSync(out,{recursive:true});
const email='password-settings-review@example.invalid';
const turnstile=readFileSync('frontend/member/turnstile-auth-v1.js','utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const report={checkedAt:new Date().toISOString(),origin,commit:process.env.GITHUB_SHA||null,browser:'Chromium',sourceHashes:{passwordRuntime:sha(passwordSettingsRuntime),turnstileClient:sha(turnstile)},cases:[],failures:[],productionRequests:0,accountWrites:0,emailDelivery:0,limits:['Actual hosted /member/settings HTML, CSS, member API adapter and password runtime','Fictional same-origin API responses intercepted inside Playwright; no credentials or real account','Unmodified frontend Turnstile client supplied locally because the staging router excludes this asset; security config is explicitly disabled only in this browser fixture','Email transport, token consumption and real Cloudflare challenge are not exercised','Chromium desktop and phone viewport; not physical Safari or iPhone evidence']};
const clean=value=>String(value).replaceAll(origin,'[isolated staging]').slice(0,1000);
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
const browser=await chromium.launch({headless:true});

async function open(page,row){
 const response=await page.goto(origin+'/member/settings',{waitUntil:'networkidle',timeout:30000});
 assert.equal(response.status(),200,'Hosted canonical settings page must exist');
 await page.waitForFunction(()=>window.SST_API?.getMe&&window.SST_API?.requestPasswordReset&&window.SSTTurnstile&&document.getElementById('memberPasswordReset'),null,{timeout:10000});
 assert.equal(await page.locator('[data-member-password-settings]').count(),1,'Exactly one password card');
 assert.equal(await page.locator('#memberPasswordReset button').textContent(),'Reset password');
 assert.equal(await page.locator('#memberPasswordReset button').isEnabled(),true);
 assert.equal(await page.locator('#memberPasswordStatus').textContent(),'');
 assert.equal(await page.locator('#memberPasswordSignIn').isVisible(),false);
 assert.equal(row.resetRequests.length,0,'Opening settings must not request a reset');
 assert.equal(row.meRequests,0,'Account email is read only after an explicit reset action');
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,navs:document.querySelectorAll('nav.sst-member-tabs').length,page:document.body.dataset.memberPage,healthControls:!!document.querySelector('#healthConsentManager'),passwordInputs:document.querySelectorAll('#memberPasswordReset input').length}));
 assert.ok(layout.overflow<=1,'Settings has horizontal overflow');assert.equal(layout.navs,1);assert.equal(layout.page,'settings');assert.equal(layout.healthControls,true);assert.equal(layout.passwordInputs,0);
 row.layout=layout;
}

try{
 for(const [name,viewport]of Object.entries({desktop:{width:1440,height:1000},mobile390:{width:390,height:844}})){
  const row={name,viewport,checks:[],resetRequests:[],meRequests:0,securityConfigs:0,blockedExternal:[],blockedWrites:[],unexpectedApi:[],pageErrors:[]};report.cases.push(row);
  const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
  let state='pending',expired=false,releasePending=null,markResetArrived=null;
  const pendingResponse=new Promise(resolve=>{releasePending=resolve});
  const resetArrived=new Promise(resolve=>{markResetArrived=resolve});
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),path=url.pathname,method=request.method();
   if(url.origin!==origin){row.blockedExternal.push({host:url.host,path,method});return route.abort('blockedbyclient')}
   const json=(status,body)=>route.fulfill({status,contentType:'application/json',headers:{'Cache-Control':'no-store'},body:JSON.stringify(body)});
   if(path==='/turnstile-auth-v1.js'&&method==='GET')return route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:turnstile});
   if(path==='/v1/me'&&method==='GET'){
    row.meRequests++;
    return expired?json(401,{ok:false,error:'session_expired'}):json(200,{ok:true,user:{id:1,email,firstName:'Fictional reviewer'}});
   }
   if(path==='/v1/profile'&&method==='GET')return json(200,{ok:true,profile:{email,firstName:'Fictional reviewer'}});
   if(path==='/v1/consents'&&method==='GET')return json(200,{ok:true,consents:[]});
   if(path==='/v1/auth/turnstile-config'&&method==='GET'){row.securityConfigs++;return json(200,{required:false,enabled:false})}
   if(path==='/v1/auth/request-password-reset'&&method==='POST'){
    let payload;try{payload=request.postDataJSON()}catch{payload=null}
    row.resetRequests.push({method,path,payload});
    markResetArrived();
    if(state==='pending')await pendingResponse;
    if(state==='failure')return json(503,{ok:false,error:'temporary_failure',message:'Password reset is temporarily unavailable. Please try again.'});
    return json(200,{ok:true,message:'If that account exists, reset instructions will be sent shortly.'});
   }
   if(path.startsWith('/v1/')){row.unexpectedApi.push({path,method});return json(404,{ok:false,error:'isolated_fixture_only'})}
   if(!['GET','HEAD'].includes(method)){row.blockedWrites.push({path,method});return route.abort('blockedbyclient')}
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',error=>row.pageErrors.push(clean(error.message)));
  try{
   // Read the actually served candidate, not a substituted copy of the new code.
   const asset=await context.request.get(origin+'/assets/member-experience/password-settings.mjs');
   assert.equal(asset.status(),200);assert.match(asset.headers()['content-type'],/javascript/);assert.equal(sha(await asset.text()),report.sourceHashes.passwordRuntime);
   row.servedRuntimeMatchesSource=true;
   await open(page,row);
   row.checks.push('Actual canonical settings page serves the exact candidate runtime; existing navigation and privacy controls remain; no account lookup or reset on load');
   const form=page.locator('#memberPasswordReset'),button=form.locator('button'),status=page.locator('#memberPasswordStatus');
   await page.locator('[data-member-password-settings]').scrollIntoViewIfNeeded();
   await page.screenshot({path:out+'/settings-'+name+'.png',fullPage:false});

   await button.click();
   await page.waitForFunction(()=>document.querySelector('#memberPasswordReset')?.getAttribute('aria-busy')==='true');
   let arrivalTimeout;
   try{await Promise.race([resetArrived,new Promise((_,reject)=>{arrivalTimeout=setTimeout(()=>reject(Error('Reset request did not reach the isolated browser fixture')),10000)})])}finally{clearTimeout(arrivalTimeout)}
   await page.waitForFunction(()=>document.querySelector('#memberPasswordReset button')?.disabled===true);
   assert.equal(await button.textContent(),'Requesting reset…');
   // An extra submit event while the first request is unresolved must be ignored.
   await form.evaluate(element=>element.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
   await page.waitForTimeout(150);
   assert.equal(row.resetRequests.length,1);assert.equal(row.meRequests,1);assert.equal(row.securityConfigs,1);
   assert.deepEqual(row.resetRequests[0],{method:'POST',path:'/v1/auth/request-password-reset',payload:{email}});
   state='success';releasePending();
   await page.waitForFunction(()=>document.querySelector('#memberPasswordStatus')?.dataset.state==='success');
   assert.equal(await button.textContent(),'Reset requested');assert.equal(await button.isDisabled(),true);assert.equal(await form.getAttribute('aria-busy'),null);
   assert.match(await status.textContent(),/inbox and junk folder/);assert.match(await status.textContent(),/password stays the same/);
   await form.evaluate(element=>element.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
   await page.waitForTimeout(150);assert.equal(row.resetRequests.length,1);
   row.checks.push('Explicit reset reads fictional signed-in email, uses the real adapter and Turnstile client, sends exact payload, blocks duplicate submits while pending and after success');
   await page.screenshot({path:out+'/reset-requested-'+name+'.png',fullPage:false});

   row.successRequestCount=row.resetRequests.length;row.resetRequests=[];row.meRequests=0;state='failure';
   await open(page,row);await button.click();
   await page.waitForFunction(()=>document.querySelector('#memberPasswordStatus')?.dataset.state==='error');
   assert.match(await status.textContent(),/temporarily unavailable/);assert.equal(await button.isEnabled(),true);assert.equal(await button.textContent(),'Reset password');assert.equal(await form.getAttribute('aria-busy'),null);
   assert.equal(await page.locator('#memberPasswordSignIn').isVisible(),false);assert.equal(row.resetRequests.length,1);
   state='success';await button.click();
   await page.waitForFunction(()=>document.querySelector('#memberPasswordStatus')?.dataset.state==='success');
   assert.equal(row.resetRequests.length,2);assert.equal(row.meRequests,2);
   for(const request of row.resetRequests)assert.deepEqual(request.payload,{email});
   row.retryRequestCount=row.resetRequests.length;row.checks.push('A failed request reports the error, restores the control, and one deliberate retry succeeds');

   row.resetRequests=[];row.meRequests=0;expired=true;
   await open(page,row);await button.click();
   await page.waitForFunction(()=>document.querySelector('#memberPasswordStatus')?.dataset.state==='error');
   assert.match(await status.textContent(),/sign in again before resetting/);assert.equal(await button.isEnabled(),true);assert.equal(await page.locator('#memberPasswordSignIn').isVisible(),true);assert.equal(await page.locator('#memberPasswordSignIn').getAttribute('href'),'/member-login');
   assert.equal(row.resetRequests.length,0);assert.equal(row.meRequests,1);assert.equal(await form.getAttribute('aria-busy'),null);
   row.checks.push('Expired session shows sign-in guidance and makes no reset request');
   await page.screenshot({path:out+'/session-expired-'+name+'.png',fullPage:false});
   assert.deepEqual(row.unexpectedApi,[],'Unexpected API request in settings fixture');assert.deepEqual(row.blockedWrites,[],'Unexpected write outside the intercepted reset request');assert.deepEqual(row.pageErrors,[],'Browser runtime errors');
   row.passed=true;
  }catch(error){row.failure=clean(error.stack||error);report.failures.push({name,error:row.failure});await page.screenshot({path:out+'/failure-'+name+'.png',fullPage:false}).catch(()=>{});throw error}
  finally{releasePending();await context.close();save()}
 }
}finally{await browser.close();save()}
console.log('PASS: password settings desktop/mobile presentation, explicit reset, pending lock, retry and expired-session proof using fictional intercepted APIs only.');
