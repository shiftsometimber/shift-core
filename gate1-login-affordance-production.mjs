import {chromium, firefox, webkit} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const OUT=process.env.RENDER_EVIDENCE_DIR||'render-evidence';
fs.mkdirSync(OUT,{recursive:true});
const browsers={chromium,firefox,webkit};
const viewports={desktop:{width:1440,height:900},mobile390:{width:390,height:844}};
const report={proof:'GATE1_LOGIN_AFFORDANCE_PRODUCTION',base:BASE,cases:[],failures:[]};
const slug=s=>s.replace(/[^a-z0-9-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=Gate1 login affordance::${name} — ${detail}`)};

async function shot(page,name){const file=path.join(OUT,`${slug(name)}.png`);await page.screenshot({path:file,fullPage:true});return file}
async function visibleCount(locator){return locator.filter({visible:true}).count()}
async function findAction(page,pattern){
  const candidates=[
    page.getByRole('link',{name:pattern}).first(),
    page.getByRole('button',{name:pattern}).first(),
    page.locator('[role="button"]').filter({hasText:pattern}).first(),
    page.locator('a,button,input[type="button"],input[type="submit"]').filter({hasText:pattern}).first()
  ];
  for(const candidate of candidates){if(await candidate.count()&&await candidate.isVisible().catch(()=>false))return candidate}
  return null;
}
async function gotoLogin(page){
  const response=await page.goto(`${BASE}/member-login.html`,{waitUntil:'networkidle',timeout:45000});
  if(!response||response.status()>=400)throw new Error(`login HTTP ${response?.status()??'no response'}`);
}
async function assertRegistration(page,name){
  await gotoLogin(page);
  const action=await findAction(page,/create account|register|sign\s*up|join/i);
  if(!action){fail(name,'no discoverable Create account / registration control on member login');return}
  const beforeUrl=page.url();
  await action.click();
  await page.waitForTimeout(800);
  const email=page.locator('input[type="email"],input[name*="email" i]');
  const passwords=page.locator('input[type="password"]');
  const visibleEmail=await visibleCount(email);
  const visiblePasswords=await visibleCount(passwords);
  const visibleInputs=await visibleCount(page.locator('input,select,textarea'));
  const text=clean(await page.locator('body').innerText().catch(()=>''));
  const changed=page.url()!==beforeUrl||/create account|register|sign up|join my shift/i.test(text);
  if(!changed)fail(name,'registration control produced no discernible rendered state/navigation change');
  if(visibleEmail<1||visiblePasswords<1||visibleInputs<2)fail(name,`registration surface incomplete after click: email=${visibleEmail}, password=${visiblePasswords}, visibleControls=${visibleInputs}, url=${page.url()}`);
  report.cases.push({name,action:'registration',beforeUrl,afterUrl:page.url(),visibleEmail,visiblePasswords,visibleInputs,screenshot:await shot(page,name)});
}
async function assertRecovery(page,name){
  await gotoLogin(page);
  const action=await findAction(page,/forgot password|reset password|forgot|reset/i);
  if(!action){fail(name,'no discoverable Forgot password / reset control on member login');return}
  const beforeUrl=page.url();
  await action.click();
  await page.waitForTimeout(800);
  const visibleEmail=await visibleCount(page.locator('input[type="email"],input[name*="email" i]'));
  const text=clean(await page.locator('body').innerText().catch(()=>''));
  const recoveryText=/reset|forgot|recovery|send.{0,20}(link|email)|check your email/i.test(text);
  const changed=page.url()!==beforeUrl||recoveryText;
  if(!changed)fail(name,'password-recovery control produced no discernible rendered state/navigation change');
  if(visibleEmail<1)fail(name,`password-recovery surface has no visible email control after click; url=${page.url()}`);
  report.cases.push({name,action:'recovery',beforeUrl,afterUrl:page.url(),visibleEmail,recoveryText,screenshot:await shot(page,name)});
}

for(const [browserName,browserType] of Object.entries(browsers)){
  const browser=await browserType.launch({headless:true});
  try{
    for(const [viewportName,viewport] of Object.entries(viewports)){
      const context=await browser.newContext({viewport,reducedMotion:'reduce'});
      const page=await context.newPage();
      try{
        await assertRegistration(page,`${browserName}-${viewportName}-registration-affordance`);
        await assertRecovery(page,`${browserName}-${viewportName}-recovery-affordance`);
      }catch(error){fail(`${browserName}-${viewportName}`,String(error?.message||error));}
      await context.close();
    }
  } finally {await browser.close()}
}

fs.writeFileSync(path.join(OUT,'login-affordance-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`Gate 1 login affordance proof failed ${report.failures.length} assertion(s)`);
if(report.cases.length!==12)throw new Error(`Expected 12 successful rendered interaction cases, got ${report.cases.length}`);
console.log('PASS Gate 1 login registration/recovery affordance proof: 12/12 interactive cases across Chromium/Firefox/WebKit desktop and 390px mobile.');
