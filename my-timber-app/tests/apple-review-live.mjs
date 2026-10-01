import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const SITE=(process.env.APPLE_REVIEW_SITE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const email=String(process.env.APPLE_REVIEW_EMAIL||'').trim();
const password=String(process.env.APPLE_REVIEW_PASSWORD||'');
const headless=process.env.APPLE_REVIEW_HEADLESS!=='0';
if(!email||!password)throw new Error('APPLE_REVIEW_EMAIL and APPLE_REVIEW_PASSWORD are required');

const report={site:SITE,checks:[]};
const pass=(name,detail='')=>{report.checks.push({name,status:'PASS',detail});console.log('PASS',name,detail)};

for(const path of ['/privacy','/account-deletion']){
  const r=await fetch(SITE+path,{redirect:'follow'});
  assert.equal(r.status,200,path+' must return HTTP 200');
  pass(path+' public route','HTTP 200');
}

const browser=await chromium.launch({headless});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();
try{
  await page.goto(SITE+'/member/dashboard',{waitUntil:'domcontentloaded'});
  const passwordInput=page.locator('#previewRegister input[name="password"]');
  await passwordInput.waitFor({state:'visible',timeout:30000});
  const minLengthRaw=await passwordInput.getAttribute('minlength');
  const minLength=minLengthRaw===null?0:Number(minLengthRaw);
  assert.ok(Number.isFinite(minLength)&&minLength<=password.length,'Login client-side minimum exceeds reviewer password length');
  pass('reviewer login form accepts supplied reviewer password length','minlength='+minLength);

  await page.locator('#previewRegister input[name="email"]').fill(email);
  await passwordInput.fill(password);
  await page.locator('#previewRegister button[data-auth-submit]').click();
  await page.locator('#previewMember.is-ready').waitFor({state:'visible',timeout:45000});
  pass('reviewer account signs in through real Turnstile-protected UI');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#previewMember.is-ready').waitFor({state:'visible',timeout:30000});
  pass('reviewer session survives reload');

  for(const [path,label,needle] of [
    ['/member/dashboard#today','Today','What do you need help sorting?'],
    ['/member/grub','Grub','GRUB'],
    ['/member/fit','Fit','FIT'],
    ['/member/settings','Settings','Request account deletion']
  ]){
    await page.goto(SITE+path,{waitUntil:'domcontentloaded'});
    await page.locator('body').waitFor({state:'visible'});
    await page.waitForFunction(text=>document.body.innerText.toLowerCase().includes(String(text).toLowerCase()),needle,{timeout:30000});
    pass(label+' reviewer route');
  }

  const logout=await page.evaluate(async()=>{
    const r=await fetch('/v1/auth/logout',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:'{}'});
    return {status:r.status,body:await r.text()};
  });
  assert.ok(logout.status>=200&&logout.status<300,'Logout failed: '+logout.status);
  const me=await context.request.get(SITE+'/v1/me');
  assert.equal(me.status(),401,'Session must be revoked after logout');
  pass('logout revokes reviewer session');
} finally {
  await context.close();
  await browser.close();
}

console.log(JSON.stringify(report,null,2));
