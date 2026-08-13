import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.AUTH_RENDER_EVIDENCE_DIR||'auth-render-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC is required for restricted synthetic-member registration');
fs.mkdirSync(OUT,{recursive:true});

const browsers={chromium,firefox,webkit};
const viewports={desktop:{width:1440,height:900},mobile390:{width:390,height:844}};
const password='Shift-Commissioning-2026!';
const nonce=`authrender-${Date.now()}`;
const report={proof:'GATE1_AUTHENTICATED_RENDERED_PRODUCTION',site:SITE,api:API,cases:[],failures:[],observations:[]};
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=Authenticated rendered acceptance::${name} — ${detail}`)};
const observe=(name,detail)=>{report.observations.push({name,detail});console.log(`::notice title=Authenticated rendered observation::${name} — ${detail}`)};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const slug=s=>s.replace(/[^a-z0-9-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();

async function registerSynthetic(email,firstName){
  const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,firstName,password,source:'commissioning-rendered'})});
  let data=null;try{data=await r.json()}catch{}
  if(r.status!==201)throw new Error(`restricted synthetic registration failed ${r.status}: ${JSON.stringify(data)}`);
}
async function bodyText(page){return clean(await page.locator('body').innerText().catch(()=>''))}
async function assertPage(page,name){
  const text=await bodyText(page);
  if(text.length<80)fail(name,`near-blank body (${text.length} chars)`);
  if(/internal server error|application error|sqlite|sql error|stack trace/i.test(text))fail(name,'internal diagnostics exposed');
  const scroll=await page.evaluate(()=>({w:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
  if(scroll.w-scroll.cw>8)fail(name,`horizontal overflow ${scroll.w-scroll.cw}px`);
  const title=clean(await page.title());if(title.length<2)fail(name,'missing document title');
  const mainCount=await page.locator('main,[role="main"]').count();const h1Count=await page.locator('h1').count();
  if(!mainCount&&!h1Count)fail(name,'no main landmark or h1');
  return{url:page.url(),title,textChars:text.length,horizontalOverflowPx:Math.max(0,scroll.w-scroll.cw),mainCount,h1Count};
}
async function shot(page,name){const file=path.join(OUT,`${slug(name)}.png`);await page.screenshot({path:file,fullPage:true});return file}
async function authState(context){
  const r=await context.request.get(`${API}/v1/member-state`,{headers:{Origin:SITE}});
  let data=null;try{data=await r.json()}catch{}
  return{status:r.status(),ok:r.ok(),data};
}
async function waitForAuth(context){
  for(let i=0;i<20;i++){const s=await authState(context);if(s.ok)return s;await new Promise(r=>setTimeout(r,350));}
  return authState(context);
}
async function findVisible(page,pattern){
  const locators=[page.getByRole('link',{name:pattern}).first(),page.getByRole('button',{name:pattern}).first(),page.getByText(pattern).first()];
  for(const l of locators){if(await l.count()&&await l.isVisible().catch(()=>false))return l;}
  return null;
}
async function openMenuIfNeeded(page){
  for(const p of [/menu/i,/navigation/i,/open menu/i]){const x=await findVisible(page,p);if(x){await x.click().catch(()=>{});await page.waitForTimeout(250);return true;}}
  return false;
}
async function productAction(page,pattern){let x=await findVisible(page,pattern);if(x)return x;await openMenuIfNeeded(page);return findVisible(page,pattern)}

const targets=[
  ['my-shift',/my\s*shift/i],
  ['today',/^today$|shift today/i],
  ['grub',/shift grub|\bgrub\b/i],
  ['fit',/shift fit|\bfit\b/i],
  ['progress',/shift progress|\bprogress\b/i],
  ['shift-ai',/shift ai/i]
];

for(const [browserName,browserType] of Object.entries(browsers)){
  for(const [viewportName,viewport] of Object.entries(viewports)){
    const id=`${browserName}-${viewportName}`;
    const email=`shiftsometimber+${nonce}-${browserName}-${viewportName}@gmail.com`;
    await registerSynthetic(email,`Rendered ${browserName}`);
    const browser=await browserType.launch({headless:true});
    try{
      const context=await browser.newContext({viewport,reducedMotion:'reduce'});
      const page=await context.newPage();
      const consoleErrors=[];page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
      let response=await page.goto(`${SITE}/member-login`,{waitUntil:'networkidle',timeout:45000});
      if(!response||response.status()>=400)fail(`${id}-login`,`login HTTP ${response?.status()??'no response'}`);
      const emailInput=page.locator('input[type="email"],input[name*="email" i]').filter({visible:true}).first();
      const passwordInput=page.locator('input[type="password"]').filter({visible:true}).first();
      if(!await emailInput.count()||!await passwordInput.count())throw new Error(`${id}: login inputs unavailable`);
      await emailInput.fill(email);await passwordInput.fill(password);
      const form=emailInput.locator('xpath=ancestor::form[1]');
      const submit=(await form.count()?form:page).locator('button[type="submit"],input[type="submit"],button').filter({visible:true}).first();
      if(!await submit.count())throw new Error(`${id}: login submit unavailable`);
      await submit.click();
      const state=await waitForAuth(context);
      if(!state.ok)fail(`${id}-login`,`authenticated member-state unavailable after rendered login: ${state.status}`);
      await page.waitForTimeout(900);
      const landing=await assertPage(page,`${id}-authenticated-landing`);
      report.cases.push({name:`${id}-authenticated-landing`,...landing,authenticated:state.ok,consoleErrors:consoleErrors.slice(0,8),screenshot:await shot(page,`${id}-authenticated-landing`)});

      let opened=0;
      const startUrl=page.url();
      for(const [key,pattern] of targets){
        if(page.url()!==startUrl)await page.goto(startUrl,{waitUntil:'networkidle',timeout:45000}).catch(()=>{});
        const action=await productAction(page,pattern);
        if(!action){observe(`${id}-${key}`,'no visible navigation action from authenticated landing');continue;}
        const before=page.url();
        await action.click();await page.waitForTimeout(700);
        const productState=await authState(context);
        const basic=await assertPage(page,`${id}-${key}`);
        if(!productState.ok)fail(`${id}-${key}`,`member session lost while opening product: ${productState.status}`);
        if(page.url()===before&&key!=='my-shift')observe(`${id}-${key}`,'navigation action did not change URL; retained as possible in-page product switch');
        report.cases.push({name:`${id}-${key}`,...basic,authenticated:productState.ok,screenshot:await shot(page,`${id}-${key}`)});
        opened++;
      }
      if(opened<4)fail(id,`only ${opened}/6 representative authenticated product actions were exercised; require at least 4`);
      report.cases.push({name:`${id}-summary`,email,openedTargets:opened,sessionRetained:(await authState(context)).ok});
      await context.close();
    } finally {await browser.close();}
  }
}

fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`Authenticated rendered production matrix failed ${report.failures.length} hard assertion(s)`);
console.log(`PASS authenticated rendered production matrix: ${report.cases.length} retained evidence records across Chromium/Firefox/WebKit desktop+390px; every case used a real restricted synthetic member session and at least four representative member product actions per browser/device.`);
