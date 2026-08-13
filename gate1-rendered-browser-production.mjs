import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const OUT=process.env.RENDER_EVIDENCE_DIR||'render-evidence';
fs.mkdirSync(OUT,{recursive:true});
const browsers={chromium,firefox,webkit};
const viewports={desktop:{width:1440,height:900},mobile390:{width:390,height:844}};
const report={proof:'GATE1_RENDERED_BROWSER_PRODUCTION',base:BASE,cases:[],failures:[],knownGaps:[]};
const slug=s=>s.replace(/[^a-z0-9-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=Gate1 rendered acceptance::${name} — ${detail}`)};
const gap=(name,detail)=>{report.knownGaps.push({name,detail});console.warn(`::warning title=Known Gate1 product gap::${name} — ${detail}`)};

function cleanText(s){return String(s||'').replace(/\s+/g,' ').trim()}
async function visibleText(page){return cleanText(await page.locator('body').innerText().catch(()=>''))}
async function assertBasic(page,name){
  const text=await visibleText(page);
  if(text.length<80) fail(name,`near-blank rendered body (${text.length} visible chars)`);
  if(/internal server error|application error|sqlite|sql error|stack trace|cloudflare ray id/i.test(text)) fail(name,'raw/internal failure text exposed');
  const title=cleanText(await page.title()); if(title.length<2) fail(name,'missing document title');
  const bodyBox=await page.locator('body').boundingBox();
  const scroll=await page.evaluate(()=>({w:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
  if(scroll.w-scroll.cw>8) fail(name,`horizontal overflow ${scroll.w-scroll.cw}px`);
  if(!bodyBox) fail(name,'body did not render');
  const mainCount=await page.locator('main, [role="main"]').count();
  const h1Count=await page.locator('h1').count();
  if(mainCount===0&&h1Count===0) fail(name,'no main landmark or h1');
  return {title,textChars:text.length,horizontalOverflowPx:Math.max(0,scroll.w-scroll.cw),mainCount,h1Count};
}
async function screenshot(page,name){const file=path.join(OUT,`${slug(name)}.png`);await page.screenshot({path:file,fullPage:true});return file}
async function findHref(page,pattern){const links=await page.locator('a[href]').evaluateAll(as=>as.map(a=>({href:a.href,text:(a.textContent||'').trim()})));return links.find(x=>pattern.test(`${x.href} ${x.text}`))?.href||null}

for(const [browserName,browserType] of Object.entries(browsers)){
  const browser=await browserType.launch({headless:true});
  try{
    for(const [viewportName,viewport] of Object.entries(viewports)){
      const context=await browser.newContext({viewport,reducedMotion:'reduce'});
      const page=await context.newPage();
      const consoleErrors=[]; page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
      const name=`${browserName}-${viewportName}-home`;
      const response=await page.goto(`${BASE}/`,{waitUntil:'networkidle',timeout:45000});
      if(!response||response.status()>=400) fail(name,`homepage HTTP ${response?.status()??'no response'}`);
      const basic=await assertBasic(page,name);const image=await screenshot(page,name);
      report.cases.push({name,url:page.url(),status:response?.status(),...basic,consoleErrors:consoleErrors.slice(0,5),screenshot:image});

      const loginName=`${browserName}-${viewportName}-login`;
      const loginResponse=await page.goto(`${BASE}/member-login.html`,{waitUntil:'networkidle',timeout:45000});
      if(!loginResponse||loginResponse.status()>=400) fail(loginName,`login HTTP ${loginResponse?.status()??'no response'}`);
      const loginBasic=await assertBasic(page,loginName);
      const email=page.locator('input[type="email"], input[name*="email" i]').filter({visible:true}).first();
      const password=page.locator('input[type="password"]').filter({visible:true}).first();
      if(await email.count()===0||await password.count()===0){fail(loginName,'visible email/password controls not found');}
      else {
        const form=email.locator('xpath=ancestor::form[1]');
        const submit=(await form.count()?form:page).locator('button[type="submit"], input[type="submit"], button').filter({visible:true}).first();
        if(await submit.count()===0) fail(loginName,'visible submit control not found');
        else {
          const before=await visibleText(page);
          await email.fill('rendered-commissioning-no-account@example.invalid');
          await password.fill('DefinitelyNotARealPassword-2026!');
          await submit.click();
          await page.waitForTimeout(1800);
          const after=await visibleText(page);
          const changed=after!==before;
          const alertText=cleanText(await page.locator('[role="alert"], [aria-live], .error, .form-error, .message-error, .alert').filter({visible:true}).allInnerTexts().catch(()=>[]));
          const combined=`${after} ${alertText}`;
          if(!changed) fail(loginName,'invalid login produced no rendered state change');
          if(!/invalid|incorrect|not recognised|not recognized|check.{0,30}(email|password)|(email|password).{0,30}check|try again|sign in|login/i.test(combined)) fail(loginName,'invalid login did not expose intelligible member guidance');
          if(/stack trace|sqlite|sql error|internal server error/i.test(combined)) fail(loginName,'invalid login leaked internal diagnostics');
        }
      }
      const loginImage=await screenshot(page,`${loginName}-invalid-state`);
      const registerHref=await findHref(page,/register|sign\s*up|join/i);
      const resetHref=await findHref(page,/forgot|reset|password/i);
      report.cases.push({name:loginName,url:page.url(),status:loginResponse?.status(),...loginBasic,registerHref,resetHref,screenshot:loginImage});

      if(registerHref){
        const regName=`${browserName}-${viewportName}-register`;
        const r=await page.goto(registerHref,{waitUntil:'networkidle',timeout:45000});
        if(!r||r.status()>=400) fail(regName,`register HTTP ${r?.status()??'no response'}`);
        const b=await assertBasic(page,regName);const inputs=await page.locator('input,select,textarea').filter({visible:true}).count();
        if(inputs<2) gap(regName,`member-login registration affordance resolves to ${page.url()} with ${inputs} visible form controls; account registration remains uncommissioned`);
        report.cases.push({name:regName,url:page.url(),status:r?.status(),visibleControls:inputs,...b,screenshot:await screenshot(page,regName)});
      } else gap(loginName,'no registration affordance discovered from member-login surface');

      if(resetHref){
        const resetName=`${browserName}-${viewportName}-reset`;
        const r=await page.goto(resetHref,{waitUntil:'networkidle',timeout:45000});
        if(!r||r.status()>=400) fail(resetName,`reset HTTP ${r?.status()??'no response'}`);
        const b=await assertBasic(page,resetName);const resetEmail=page.locator('input[type="email"], input[name*="email" i]').filter({visible:true}).first();
        if(await resetEmail.count()===0) gap(resetName,'reset surface has no visible email control; recovery remains human/product AMBER');
        report.cases.push({name:resetName,url:page.url(),status:r?.status(),...b,screenshot:await screenshot(page,resetName)});
      } else gap(loginName,'no reset affordance discovered from member-login surface');
      await context.close();
    }
  } finally {await browser.close()}
}

fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.failures.length) throw new Error(`Gate 1 rendered production evidence sweep failed ${report.failures.length} hard assertion(s)`);
console.log(`PASS Gate 1 rendered production evidence sweep: ${report.cases.length} rendered cases across Chromium/Firefox/WebKit and desktop/390px mobile; invalid-login failure guidance rendered without diagnostic leakage. ${report.knownGaps.length} known product-gap observations were retained without false PASS promotion.`);
