import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {commissioningLogin,memberReady,memberReload,chooseNecessaryCookies} from '../rendered-member-acceptance-support.mjs';
import {startCoaching} from '../shift-coach/browser-journey-support.mjs';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk',oidc=process.env.SHIFT_COMMISSIONING_OIDC;
assert(oidc);const out='premortem-evidence';mkdirSync(out,{recursive:true});
async function freshOIDC(){
 const endpoint=process.env.ACTIONS_ID_TOKEN_REQUEST_URL,credential=process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
 if(!endpoint||!credential)return oidc;
 const url=new URL(endpoint);url.searchParams.set('audience','shift-production-commissioning');
 const response=await fetch(url,{headers:{Authorization:'bearer '+credential},signal:AbortSignal.timeout(30000)});assert(response.ok,'Existing runner commissioning identity renewal');const data=await response.json();assert(data.value);return data.value;
}
const report={at:new Date().toISOString(),source:process.env.ACCEPTANCE_SOURCE,scope:'Fictional production accounts; Chromium phone and desktop, no physical-device or real-member-outcome claim',checks:[],errors:[],networkFailures:[],sessionTest:'Server-revoked real test session models expiry; no fabricated API response',realWeekFourOutcome:'unavailable'};
const scrub=value=>String(value).replace(/(?:cookie|authorization):[^\r\n]+/gi,'[redacted header]');
const write=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
const browser=await chromium.launch({headless:true});
try{
for(const [name,width] of [['mobile',390],['desktop',1440]]){
 const identity={email:'shiftsometimber+structured-authrender-premortem-'+Date.now()+'-'+name+'@gmail.com',password:'Sst-'+randomUUID()+'-Aa1!'};
 const r=await fetch(api+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':await freshOIDC()},body:JSON.stringify({...identity,firstName:'Fictional acceptance',source:'commissioning-premortem'}),signal:AbortSignal.timeout(30000)});assert.equal(r.status,201,'Synthetic registration');
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out+'/'+name,size:{width,height:900}}});const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',e=>{report.errors.push({device:name,message:scrub(e.message).slice(0,600)});write()});
 page.on('response',r=>{if(r.status()>=500){report.networkFailures.push({device:name,path:new URL(r.url()).pathname,status:r.status()});write()}});
 const call=async path=>{const r=await context.request.get(site+path,{headers:{Origin:site},timeout:30000});assert.equal(r.status(),200,path);return r.json()};
 const check=async(label,fn)=>{try{await fn();report.checks.push({device:name,label,pass:true});console.log('PASS '+name+' '+label);write()}catch(e){report.checks.push({device:name,label,pass:false,error:scrub(e.message).slice(0,1500)});write();const screenshot=await page.screenshot({path:out+'/'+name+'-failure.png',timeout:10000}).catch(()=>null);if(screenshot)console.log('PROOF_SCREENSHOT '+name+'-failure '+screenshot.toString('base64'));console.log('FAIL '+name+' '+label+' '+scrub(e.message).slice(0,1200));return false}};
 let checkin,next,initial,smaller,changed,firstCheckinResponse;
 try{
 await commissioningLogin(page,{site,api,oidc:await freshOIDC(),...identity});await memberReady(page,{site});
 await check('Consent-off blocks personal setup; visible opt-in persists',async()=>{
  const s=await call('/v1/shift-coach');assert.equal(s.consent,false);
  assert.equal(await page.locator('[data-coach-setup]').count(),0);
  await page.goto(site+'/member/check-in',{waitUntil:'domcontentloaded'});await chooseNecessaryCookies(page);
  await page.locator('[data-mood="OK"]').click();await page.locator('#moodNote').fill('Fictional acceptance: walked to the shops');
  firstCheckinResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/check-ins'&&r.request().method()==='POST');
  await page.locator('#saveMood').click();
  const d=page.locator('dialog.health-consent-dialog-v42n[open]');await d.waitFor();assert.equal(await d.locator('#healthConsentContinue').isEnabled(),false);
  await d.locator('#healthConsentCheck').check();await d.locator('#healthConsentContinue').click();await d.waitFor({state:'hidden'});
  assert.equal((await firstCheckinResponse).status(),201,'Consent write and dependent check-in save must finish before read-back');assert.equal((await call('/v1/shift-coach')).consent,true);
 });
 await check('Daily check-in saves one record and its exact next step',async()=>{
  const r=await firstCheckinResponse;assert.equal(r.status(),201);const saved=await r.json();checkin=saved.checkIn;next=saved.nextStep;
  assert.equal(checkin.mood,'OK');assert.equal(next.checkInId,checkin.id);
  const result=page.locator('#checkinResult');await result.waitFor({state:'visible'});
  assert.equal(await result.locator('.checkin-action strong').innerText(),next.action.title);
  const link=result.getByRole('link',{name:next.action.label||'Open this next step',exact:true});
  assert.equal(new URL(await link.getAttribute('href'),site).origin,site);await link.click();await page.waitForLoadState('domcontentloaded');
  assert.equal(new URL(page.url()).pathname,new URL(next.action.href,site).pathname);
  assert.equal((await call('/v1/check-ins/follow-up')).followUp.feedback,null,'Opening is not completion');
 });
 await check('Today shows saved step; feedback survives refresh and fresh login',async()=>{
  await memberReady(page,{site});
  const f=page.locator('#dailyCheckinFollowup');const disclosure=f.locator(':scope > details');await disclosure.locator(':scope > summary').waitFor({state:'visible'});if(!await disclosure.evaluate(e=>e.open))await disclosure.locator(':scope > summary').click();await f.getByRole('heading',{name:'Did it help?',exact:true}).waitFor();
  assert.equal(await f.locator('strong').innerText(),next.action.title);
  await f.getByLabel('It helped',{exact:true}).check();await f.getByRole('button',{name:'Save feedback',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#dailyFeedbackStatus')?.textContent.startsWith('Feedback saved:'));
  let saved=(await call('/v1/check-ins/follow-up')).followUp;assert.equal(saved.id,next.id);assert.equal(saved.feedback,'helped');
  await memberReload(page,{site});assert.deepEqual((await call('/v1/check-ins/follow-up')).followUp,saved);
  const logout=await context.request.post(site+'/v1/auth/logout',{headers:{Origin:site},data:{}});assert(logout.ok());
  await page.goto(site+'/member-login',{waitUntil:'domcontentloaded'});await commissioningLogin(page,{site,api,oidc:await freshOIDC(),...identity});await memberReady(page,{site});
  assert.deepEqual((await call('/v1/check-ins/follow-up')).followUp,saved);assert((await call('/v1/check-ins')).checkIns.some(x=>String(x.id)===String(checkin.id)));
 });
 await check('Did not fit produces a smaller step and retains the answer',async()=>{
  await memberReady(page,{site});await startCoaching(page,'Make food planning easier');
  initial=(await call('/v1/shift-coach')).action;assert(initial.minutes>1,'Initial action must permit a smaller step');
  await page.locator('[data-coach-action="accept"]').click();await page.getByText('Tell Shift AI how it went',{exact:true}).click();
  await page.getByRole('button',{name:"Didn't fit my day",exact:true}).click();await page.locator('[data-coach-action="accept"]').waitFor();
  const s=await call('/v1/shift-coach');smaller=s.action;assert.equal(smaller.type,initial.type);assert(smaller.minutes<initial.minutes,'Must be smaller');assert.equal(smaller.minutes,1);assert.equal(smaller.task.steps.length,1);assert(smaller.task.steps.length<initial.task.steps.length,'Actual task must shrink, not just its estimate');report.adaptationEvidence={initial,smaller};
  assert(s.memory.outcomes.some(x=>x.actionId===initial.id&&x.value==='didnt-fit'),'Exact feedback persisted');
  await memberReload(page,{site});assert.equal((await call('/v1/shift-coach')).action.id,smaller.id);
 });
 await check('Did not help changes approach and rejects the previous type',async()=>{
  await page.locator('[data-coach-action="accept"]').click();await page.getByText('Tell Shift AI how it went',{exact:true}).click();await page.getByRole('button',{name:"Done, didn't help",exact:true}).click();
  await page.locator('[data-coach-action="accept"]').waitFor();changed=(await call('/v1/shift-coach')).action;
  assert.notEqual(changed.type,smaller.type);assert.notEqual(changed.approach,smaller.approach);assert.notDeepEqual(changed.task.steps,smaller.task.steps);report.adaptationEvidence.changed=changed;const result=await call('/v1/shift-coach');assert(result.memory.rejections.includes(smaller.type));assert(result.memory.outcomes.some(x=>x.actionId===smaller.id&&x.value==='didnt-help'));
  await memberReload(page,{site});assert.equal((await call('/v1/shift-coach')).action.id,changed.id);
 });
 await check('Real session revocation blocks private saves; fresh login restores prior state',async()=>{
  const before=await call('/v1/shift-coach');
  const r=await context.request.post(site+'/v1/auth/logout',{headers:{Origin:site},data:{}});assert(r.ok());
  assert.equal((await context.request.get(site+'/v1/shift-coach')).status(),401);
  const rejectedSave=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/shift-coach'&&r.request().method()==='POST');await page.locator('[data-coach-action="accept"]').click();assert.equal((await rejectedSave).status(),401,'Revoked real session must reject the actual private save');
  await page.waitForFunction(()=>document.querySelector('[data-coach-status]')?.textContent.includes('could not save')||location.pathname==='/member-login');
  assert.equal((await context.request.get(site+'/v1/check-ins')).status(),401);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.querySelector('[data-coach-action="accept"]')||document.querySelector('#shiftCoach')?.hidden);
  await commissioningLogin(page,{site,api,oidc:await freshOIDC(),...identity});await memberReady(page,{site});
  const returned=await call('/v1/shift-coach');assert.equal(returned.action.id,before.action.id);assert.equal(returned.action.status,before.action.status);
  assert.equal((await call('/v1/check-ins/follow-up')).followUp.feedback,'helped');
  const screenshot=await page.screenshot({path:out+'/'+name+'-returned.png',fullPage:true});console.log('PROOF_SCREENSHOT '+name+'-returned '+screenshot.toString('base64'));
 });
 }finally{
  await commissioningLogin(page,{site,api,oidc:await freshOIDC(),...identity}).catch(()=>{});
  const erasure=await context.request.delete(site+'/v1/privacy/health-tracking',{headers:{Origin:site},timeout:15000}).catch(()=>null);
  report.checks.push({device:name,label:'Optional fictional health data cleaned',pass:erasure?.status()===200});
  await context.request.post(site+'/v1/auth/logout',{headers:{Origin:site},timeout:15000}).catch(()=>{});await context.close();write();
 }
}
}catch(e){report.error=scrub(e.message).slice(0,2000);process.exitCode=1}
finally{await browser.close();report.pass=!report.error&&!report.errors.length&&!report.networkFailures.length&&report.checks.every(x=>x.pass);write();console.log(JSON.stringify({pass:report.pass,checks:report.checks,adaptationEvidence:report.adaptationEvidence,error:report.error,networkFailures:report.networkFailures}));if(!report.pass)process.exitCode=1;}
