import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const origin=process.env.PREVIEW_URL;
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview-v2\.[a-z0-9-]+\.workers\.dev$/.test(origin||''),'Only the isolated v2 preview is allowed');
const dir='work/staging/generated/review-evidence';mkdirSync(dir,{recursive:true});
const report={checkedAt:new Date().toISOString(),origin,source:process.env.PREVIEW_SOURCE_SHA,cases:[],productionWrites:0,status:'fail'};

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();
 const row={browser:name,status:'fail',checks:[]};report.cases.push(row);
 try{
  await page.goto(origin+'/member-login',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#preview-registration-note').waitFor({state:'visible',timeout:15000});
  const create=page.locator('#preview-create-account');assert.equal(await create.count(),1,'Preview create-account route missing');
  row.checks.push('My Timber preview clearly warns against real details and exposes a dedicated fictional account route');
  await create.click();await page.waitForURL('**/staging/register?next=life-back',{timeout:30000});
  const form=page.locator('#stage-auth'),email=form.locator('input[name="email"]'),password=form.locator('input[name="password"]');
  await form.waitFor({state:'visible',timeout:15000});
  const testEmail=await email.inputValue();assert(/^reviewer-[a-z0-9]+@example\.invalid$/.test(testEmail),'Registration did not generate a fictional preview email');
  assert.equal(await email.getAttribute('readonly'),'','Generated preview email must be read-only');
  assert((await page.locator('#stage-preview-email-note').innerText()).includes('no real email'),'Fictional-email explanation missing');
  row.testEmailDomain='example.invalid';row.checks.push('Registration generates a read-only @example.invalid address; no real email is requested');
  const testPassword='Preview-'+randomUUID()+'-Aa9!';await password.fill(testPassword);await form.locator('button[type="submit"]').click();
  await page.waitForURL(/\/staging\/member-connected\/life-back(?:\?|$)/,{timeout:30000});
  let me=await context.request.get(origin+'/v1/me');assert.equal(me.status(),200,'Fresh preview account is not authenticated');const first=await me.json();assert(first.user?.id,'Fresh preview account missing user id');
  row.checks.push('Brand-new fictional account creates successfully and lands authenticated in the member experience');
  const logout=await context.request.post(origin+'/v1/auth/logout',{headers:{Origin:origin},data:{}});assert.equal(logout.status(),200,'Logout failed');
  await page.goto(origin+'/staging/sign-in?next=life-back',{waitUntil:'domcontentloaded',timeout:45000});
  const signForm=page.locator('#stage-auth'),signEmail=signForm.locator('input[name="email"]');await signForm.waitFor({state:'visible'});assert.equal(await signEmail.inputValue(),testEmail,'Preview sign-in did not remember fictional account address');
  await signForm.locator('input[name="password"]').fill(testPassword);await signForm.locator('button[type="submit"]').click();await page.waitForURL(/\/staging\/member-connected\/life-back(?:\?|$)/,{timeout:30000});
  me=await context.request.get(origin+'/v1/me');assert.equal(me.status(),200,'Re-login failed');const second=await me.json();assert.equal(String(second.user?.id),String(first.user?.id),'Re-login returned a different account');
  row.checks.push('Logout and visible sign-in return to the same newly-created fictional account');
  row.status='pass';
 }catch(error){row.error=String(error.stack||error);await page.screenshot({path:dir+'/registration-'+name+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{await context.request.post(origin+'/v1/auth/logout',{headers:{Origin:origin},data:{}}).catch(()=>{});await context.close();await browser.close();}
}
report.status=report.cases.every(x=>x.status==='pass')?'pass':'fail';writeFileSync(dir+'/registration-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert.equal(report.status,'pass','Preview registration proof failed');
