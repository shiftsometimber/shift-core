import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const origin=process.env.WORK_STAGING_URL;
if(process.env.GITHUB_ACTIONS!=='true'||!/^https:\/\/shift-core-work-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin||''))throw Error('Isolated staging only');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json'));
const out='work/staging/generated/member-walk-proof';mkdirSync(out,{recursive:true});
const report={at:new Date().toISOString(),commit:process.env.GITHUB_SHA,cases:[],failures:[],limits:['Fictional isolated accounts only','Session latency and503 responses for session, Grub load and Fit build are deliberately injected for recovery checks; successful session and day adjustment use real APIs','No password reset email or real member writes']};
async function api(context,path,body){const r=await context.request.fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin},...(body?{data:body}:{})});assert(r.ok(),path+' '+r.status());return r.json()}
async function login(context,id){await api(context,'/v1/auth/login',{email:'probe'+id+'@example.invalid',password:fixture.password})}
async function shot(page,name){await page.screenshot({path:out+'/'+name+'.png',fullPage:false,mask:[page.locator('#connected-account')]})}
const browser=await chromium.launch();
try{
 for(const [index,[name,viewport]]of Object.entries({desktop:{width:1440,height:1000},mobile390:{width:390,height:844}}).entries()){
  const row={name,checks:[],pageErrors:[]};report.cases.push(row);
  const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage();
  try{
   // Check both actual auth owners without treating a network failure as logout.
   for(const path of ['/staging/member-auth','/staging/member-auth/dashboard']){
    await page.goto(origin+path);await page.waitForFunction(()=>document.body.dataset.memberSession==='signed-out');
    assert(await page.locator('#previewAuth').isVisible());assert(!(await page.locator('#previewMember').isVisible()));
   }
   await page.goto(origin+'/member/check-in');await page.waitForFunction(()=>document.body.dataset.memberSession==='signed-out');assert(await page.locator('#memberSessionStatus a').isVisible());assert(!(await page.locator('main').isVisible()));
   await shot(page,'signed-out-'+name);row.checks.push('Anonymous login and dashboard show auth only; signed-out check-in gives Sign in and hides member tools');
   await login(context,fixture.browserIds[index*2]);
   let release;const hold=new Promise(resolve=>release=resolve);
   await page.route('**/v1/me',async route=>{await hold;await route.continue()});
   await page.goto(origin+'/staging/member-auth/dashboard',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('body').getAttribute('data-member-session'),'pending');assert(!(await page.locator('#previewAuth').isVisible()));assert(!(await page.locator('#previewMember').isVisible()));await shot(page,'checking-session-'+name);
   release();await page.waitForFunction(()=>document.body.dataset.memberSession==='ready');await page.unroute('**/v1/me');assert(await page.locator('#previewMember').isVisible());assert(!(await page.locator('#previewAuth').isVisible()));row.checks.push('Delayed real retained-session lookup shows neutral checking state, then member; no login flash');
   await page.goto(origin+'/member-login');await page.waitForURL(url=>url.pathname==='/member/dashboard');await page.waitForFunction(()=>document.body.dataset.memberSession==='ready');row.checks.push('Retained session on member-login lands on the canonical dashboard');
   await page.route('**/v1/me',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"injected_unavailable"}'}));
   await page.goto(origin+'/member/check-in');await page.waitForFunction(()=>document.body.dataset.memberSession==='error');assert(!(await page.locator('main').isVisible()));await shot(page,'session-retry-'+name);
   await page.unroute('**/v1/me');await page.getByRole('button',{name:'Retry sign-in check'}).click();await page.waitForFunction(()=>document.body.dataset.memberSession==='ready');assert(await page.locator('main').isVisible());row.checks.push('Service failure keeps member hidden and Retry recovers using real session');
   page.on('pageerror',e=>row.pageErrors.push(e.message));
   await page.route('**/v1/grub/workspace',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Fictional load interruption"}'}));
   await page.goto(origin+'/member/grub');await page.locator('#grubAccountStatus[data-error="true"]').waitFor();assert(await page.locator('#grubReload').isEnabled());await page.unroute('**/v1/grub/workspace');await page.locator('#grubReload').click();await page.waitForFunction(()=>document.querySelector('#grubAccountStatus')?.textContent.includes('up to date'));assert(!(await page.locator('.grub-account a').isVisible()));row.checks.push('Grub failed load has retry; real reload restores saved food and hides Sign in');
   await page.goto(origin+'/member/fit');await page.waitForFunction(()=>document.body.dataset.memberSession==='ready');await page.locator('#fitGenerate').waitFor();
   await page.route('**/v1/fit/plan',route=>route.request().method()==='POST'?route.fulfill({status:503,contentType:'application/json',body:'{"message":"Fictional build interruption"}'}):route.continue());
   const failedBuild=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/fit/plan'&&r.request().method()==='POST');await page.locator('#fitGenerate').click();assert.equal((await failedBuild).status(),503);await page.waitForFunction(()=>!document.querySelector('#fitGenerate').disabled);assert(!/Building/.test(await page.locator('#fitGenerate').innerText()));assert((await page.locator('#fitStatus').innerText()).length>0);await page.unroute('**/v1/fit/plan');row.checks.push('Existing Fit build failure releases button and shows recovery message');
   const beforeDay=await api(context,'/v1/shift/daily-plan'),beforeFood=await api(context,'/v1/grub/workspace'),beforeFit=await api(context,'/v1/plan/list');
   let adjustments=0;page.on('request',r=>{if(new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.method()==='POST')adjustments++});
   await page.goto(origin+'/member/ask-timber');await page.waitForFunction(()=>document.body.dataset.memberSession==='ready');
   await page.locator('[data-prompt="Working late"]').click();await page.locator('[data-handoff]').click();await page.locator('#confirmYes').click();
   await page.locator('[data-adjust="working_late"]').waitFor({state:'visible',timeout:30000});assert.equal(adjustments,0,'Opening Ask handoff must not save');await shot(page,'ask-review-'+name);
   assert.deepEqual((await api(context,'/v1/shift/daily-plan')).daily.daily_output?.adjustment,beforeDay.daily.daily_output?.adjustment);
   const saved=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.request().method()==='POST');
   await page.locator('[data-adjust="working_late"]').click();assert.equal((await saved).status(),200);await page.locator('.mt-sheet-wrap').waitFor({state:'detached'});
   assert.equal(adjustments,1);assert.deepEqual(await api(context,'/v1/grub/workspace'),beforeFood);assert.deepEqual(await api(context,'/v1/plan/list'),beforeFit);await shot(page,'ask-saved-'+name);row.checks.push('Actual Working Late button → confirmation → working review sheet → one explicit real adjustment; saved Grub and Fit unchanged');
   await page.reload();await page.waitForFunction(()=>document.querySelector('#todayActions')?.dataset.todayDecisionReady==='true');assert.equal(await page.locator('.mt-sheet-wrap').count(),0);assert.equal(adjustments,1);
   const blank=await browser.newContext({viewport,reducedMotion:'reduce'});try{
    await login(blank,fixture.browserIds[index*2+1]);const first=await blank.newPage();await first.goto(origin+'/member/dashboard#journey');await first.getByRole('button',{name:'Add your starting point',exact:true}).waitFor({state:'visible'});assert.equal(await first.locator('.mj-stat-grid').count(),0);await shot(first,'journey-first-use-'+name);await first.getByRole('button',{name:'Add your starting point',exact:true}).click();assert(await first.locator('[data-mj-form]').isVisible());row.checks.push('Empty Journey shows honest starting-point CTA; opens existing form without a write');
   }finally{await blank.close()}
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert(overflow<=0);assert.deepEqual(row.pageErrors,[]);
  }catch(error){row.error=String(error.message).replaceAll(fixture.password,'[redacted]');report.failures.push({name,error:row.error});}
  finally{await context.close();writeFileSync(out+'/report.json',JSON.stringify(report,null,2));}
 }
}finally{await browser.close()}
assert.equal(report.failures.length,0,JSON.stringify(report.failures));console.log('PASS member walk repairs: real Ask handoff, deterministic session states, retry, and first-use Journey on desktop/mobile');
