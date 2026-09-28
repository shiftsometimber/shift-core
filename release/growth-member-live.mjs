// Runs only inside the existing authorised rendered-member commissioning workflow.
// New labelled synthetic identity; normal public APIs; no real member inspection.
import {chromium} from 'playwright';
import {commissioningLogin,memberReady} from '../rendered-member-acceptance-support.mjs';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk';
const oidc=process.env.SHIFT_COMMISSIONING_OIDC;assert(oidc,'Commissioning identity required');
const dir='growth-member-live-evidence';mkdirSync(dir,{recursive:true});
const email='shiftsometimber+structured-growth-'+randomUUID()+'@gmail.com',password='SST-Growth-'+randomUUID()+'-Aa1!';
console.log('::add-mask::'+email);console.log('::add-mask::'+password);
const report={at:new Date().toISOString(),commit:process.env.GITHUB_SHA,synthetic:true,realCustomerRecordsRead:false,checks:[],status:'running'};
const registered=await fetch(api+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':oidc},body:JSON.stringify({email,password,firstName:'SyntheticGrowth',source:'commissioning-growth-20260928'})});
assert.equal(registered.status,201,'Synthetic registration');
const browser=await chromium.launch();let context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
const call=async(path,body)=>{const r=await context.request.fetch(site+path,{method:body?'POST':'GET',headers:{Origin:site},...(body?{data:body}:{})});assert(r.ok(),path+' '+r.status());return r.json()};
const login=()=>commissioningLogin(page,{site,api,oidc,email,password});
try{
 await login();await call('/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
 let life=await call('/v1/life-back');life=await call('/v1/life-back',{action:'goal',revision:life.progress.revision,goal:'Fictional release check: family walk',operationId:randomUUID()});
 life=await call('/v1/life-back',{action:'checkin',goalId:life.progress.goalId,ratings:{energy:40,sleep:60,confidence:60,movement:60,clothes:60,personal:60},win:'',supportNeed:'food',operationId:randomUUID()});
 for(const outcome of ['not-fit','not-fit','helped']){
  const previous=life.progress.nextShift;
  const checkin=await call('/v1/check-ins',{mood:'Good',note:'Fictional release verification'});assert.equal(checkin.nextStep.action.loopId,previous.id);
  await call('/v1/check-ins/follow-up',{actionId:checkin.nextStep.id,revision:checkin.nextStep.revision,outcome});
  await call('/v1/auth/logout',{});await context.close();context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();await login();
  const returned=await call('/v1/check-ins/follow-up?actionId='+checkin.nextStep.id);assert.equal(returned.followUp.feedback,outcome);
  life=await call('/v1/life-back');
  if(outcome==='not-fit')assert.notEqual(life.progress.nextShift.detail,previous.detail);else assert.equal(life.progress.nextShift.detail,previous.detail);
  assert.equal(life.progress.entries.length,1);assert.equal(life.progress.nextShift.completedAt,undefined);
  await memberReady(page,{site});await page.goto(site+'/member/dashboard#today',{waitUntil:'domcontentloaded'});
  await page.getByText(life.progress.nextShift.title,{exact:true}).first().waitFor({timeout:30000});await page.reload({waitUntil:'domcontentloaded'});
  await page.getByText(life.progress.nextShift.title,{exact:true}).first().waitFor({timeout:30000});
  await page.screenshot({path:dir+'/'+report.checks.length+'-'+outcome+'.png',fullPage:true});
  report.checks.push({outcome,feedbackPersisted:true,taskChanged:outcome==='not-fit',freshBrowserSignIn:true,todayAfterRefresh:true});
 }
 report.status='pass';
}catch(error){report.status='fail';report.error=String(error.message).replaceAll(email,'[synthetic]').replaceAll(password,'[redacted]');await page.screenshot({path:dir+'/failure.png',fullPage:true}).catch(()=>{});throw error}
finally{await context.close();await browser.close();writeFileSync(dir+'/results.json',JSON.stringify(report,null,2))}
console.log('PASS live synthetic check-in, Next Shift adaptation, linked feedback, fresh browser sign-in and refresh');
