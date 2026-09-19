// Synthetic-account application acceptance on live production. Reuses the
// existing audited commissioning identity: never alters ordinary CAPTCHA,
// email verification, account roles, or real customer records. This is NOT
// proof of an unassisted public CAPTCHA/email-signup journey.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {commissioningLogin,memberReady} from '../rendered-member-acceptance-support.mjs';
const site='https://shiftsometimber.co.uk',apiRoot='https://api.shiftsometimber.co.uk',oidc=process.env.SHIFT_COMMISSIONING_OIDC;
assert.ok(oidc,'Existing authorised commissioning identity required');
const out='passport-production-evidence';mkdirSync(out,{recursive:true});
const report={release:process.env.PASSPORT_RELEASE_SHA||process.env.GITHUB_SHA,scope:'synthetic production application acceptance; existing audited test authentication; public CAPTCHA and email delivery unchanged and not claimed tested',checks:[],errors:[],customerRecordsAccessed:false};
async function account(i){const email=`shiftsometimber+structured-authrender-passport-${Date.now()}-${i}@gmail.com`,password='Sst-'+randomUUID()+'-Aa1!';const r=await fetch(apiRoot+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':oidc},body:JSON.stringify({email,password,firstName:'Passport test',source:'commissioning-health-passport'})});assert.equal(r.status,201,'Synthetic registration rejected');return {email,password};}
async function call(page,path,method='GET',body){return page.evaluate(async({path,method,body})=>{const r=await fetch(path,{method,credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()}},{path,method,body});}
async function openJourney(page){await page.locator('nav.sst-member-tabs a[href="/member/dashboard#journey"]').first().click();await page.locator('#panel-journey.active').waitFor({state:'visible'});const summary=page.locator('.hp-card>summary');await summary.waitFor({state:'visible'});if(!await page.locator('.hp-card').evaluate(e=>e.open))await summary.click();}
const browser=await chromium.launch({headless:true});report.browser={engine:'chromium',version:browser.version()};
try{
 for(const [device,width]of [['mobile',390],['desktop',1440]]){
  const ids=[await account(device+'-a'),await account(device+'-b')];
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out+'/'+device,size:{width,height:900}}});
  const page=await context.newPage();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const check=async(name,fn)=>{try{await fn();report.checks.push({device,name,pass:true});console.log('PASS '+device+': '+name)}catch(e){report.checks.push({device,name,pass:false,error:e.message});await page.screenshot({path:out+'/'+device+'-failure.png'}).catch(()=>{});throw e}};
  let id,firstRecord;
  try{
   await check('Live Start Here opts in without changing the no-medication result',async()=>{
    await page.goto(site+'/start-here');await page.locator('[data-multi="why"] button').filter({hasText:'Lose weight'}).click();await page.locator('[data-quick-next]').click();await page.locator('[data-one="med"] button').filter({hasText:'No medication'}).click();await page.locator('[data-one="access"] button').filter({hasText:'NHS'}).click();await page.locator('[data-quick-next]').click();await page.locator('[data-one="budget"] button').filter({hasText:'£0 / NHS'}).click();assert.equal(await page.locator('[data-hp-remember]').isChecked(),false);await page.locator('[data-hp-remember]').check();await page.locator('[data-quick-next]').click();await page.locator('#quickResult').waitFor({state:'visible'});
   });
   await check('Server-issued synthetic session loads the complete real dashboard and retained answers',async()=>{
    await commissioningLogin(page,{site,api:apiRoot,oidc,...ids[0]});await memberReady(page,{site});await openJourney(page);await page.locator('.hp-handoff').waitFor({state:'visible'});const p=await call(page,'/v1/health-passport');assert.equal(p.status,200);id=p.body.member.id;assert.deepEqual(p.body.passport.records,[]);assert.equal(p.body.passport.baseline.startWeightKg,null);assert.equal(await page.locator('[data-health-passport]').count(),1);
   });
   await check('Consent, exact save, reload and read-back work in production',async()=>{
    await page.locator('[data-hp-confirm]').check();await page.locator('[data-hp-save-start]').click();await page.locator('dialog').waitFor({state:'visible'});assert.equal(await page.locator('#healthConsentContinue').isEnabled(),false);await page.locator('#healthConsentCheck').check();await page.locator('#healthConsentContinue').click();await page.waitForFunction(()=>document.querySelector('[data-hp-status]')?.textContent.includes('now saved'));await page.reload();await openJourney(page);const p=await call(page,'/v1/health-passport');assert.equal(p.status,200);assert.deepEqual(p.body.passport.records[0].payload.answers.med,['No medication']);firstRecord=p.body.passport.records[0];assert.equal(p.body.passport.records.length,1);
   });
   await check('Personal history saves through the real form without creating orders',async()=>{
    await page.locator('[data-hp-add]').click();await page.locator('.hp-form [name="medicine"]').fill('Fictional acceptance record - not a prescription');await page.locator('.hp-form [name="provider"]').fill('Synthetic verification only');await page.locator('.hp-form [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('[data-hp-status]')?.textContent.includes('history was saved'));await page.reload();await openJourney(page);const p=await call(page,'/v1/health-passport');assert.equal(p.body.passport.records.length,2);assert.equal(p.body.passport.orders.length,0);await page.locator('.hp-v1').screenshot({path:out+'/'+device+'-passport.png'});
   });
   await check('Actual logout revokes session; second test account has no borrowed records',async()=>{
    await page.locator('nav.sst-member-tabs .member-nav-more summary').click();await page.locator('[data-member-logout]').click();await page.waitForFunction(async()=>{const r=await fetch('/v1/me');return r.status===401});await commissioningLogin(page,{site,api:apiRoot,oidc,...ids[1]});await memberReady(page,{site});await openJourney(page);const p=await call(page,'/v1/health-passport');assert.deepEqual(p.body.passport.records,[]);const rejected=await call(page,'/v1/health-passport/records/'+firstRecord.id,'DELETE',{expectedAccountId:id,revision:firstRecord.revision});assert.equal(rejected.status,409);
   });
   await check('Export and optional erasure affect only the original synthetic account',async()=>{
    await commissioningLogin(page,{site,api:apiRoot,oidc,...ids[0]});await memberReady(page,{site});await openJourney(page);const exp=await call(page,'/v1/privacy/export','POST');assert.equal(exp.status,200);assert.equal(exp.body.healthPassport.records.length,2);const erased=await call(page,'/v1/privacy/health-tracking','DELETE');assert.equal(erased.status,200);const p=await call(page,'/v1/health-passport');assert.deepEqual(p.body.passport.records,[]);assert.equal(p.body.passport.trackingConsent,false);
   });
   await check('Passport has no uncaught scripts or horizontal overflow at tested width',async()=>{const r=await page.locator('.hp-v1').evaluate(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:innerWidth}));assert.ok(r.left>=-1&&r.right<=r.width+1);assert.deepEqual(errors,[])});
  }finally{
   // Best-effort removal of optional synthetic data and session revocation.
   // Retain ordinary audited test-account records; never delete customer data.
   await call(page,'/v1/privacy/health-tracking','DELETE').catch(()=>{});
   await context.request.post(site+'/v1/auth/logout',{headers:{Origin:site}}).catch(()=>{});
   report.errors.push({device,errors});await context.close();
  }
 }
}catch(e){report.error=e.message;process.exitCode=1}
finally{await browser.close();report.pass=report.checks.length===14&&report.checks.every(x=>x.pass)&&!report.error;writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks,scope:report.scope,error:report.error},null,2));if(!report.pass)process.exitCode=1;}
