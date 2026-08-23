import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.G2_001_EVIDENCE_DIR||'g2-001-today-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});

const password=`Sst-${randomUUID()}-Aa1!`;
const report={proof:'G2_001_TODAY_RENDERED_PREMIUM_PRODUCTION_V3_STABLE_INTERACTION_IDENTITY',assets:{},cases:[],failures:[]};
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=G2-001 Today::${name} — ${detail}`)};
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const numericPx=v=>Number.parseFloat(String(v||'0'))||0;

async function assetProof(asset,markers){
  const response=await fetch(`${SITE}/${asset}?commissioning=${Date.now()}`,{redirect:'follow'});
  const text=await response.text();
  const row={status:response.status,authority:response.headers.get('x-shift-frontend-authority')||'',markers:Object.fromEntries(markers.map(m=>[m,text.includes(m)]))};
  report.assets[asset]=row;
  if(response.status!==200)fail(`asset-${asset}`,`HTTP ${response.status}`);
  if(row.authority!==`git:frontend/member/${asset}`)fail(`asset-authority-${asset}`,row.authority||'missing');
  for(const marker of markers)if(!row.markers[marker])fail(`asset-marker-${asset}`,marker);
}
await assetProof('member-today-premium-v1.js',['G2-001-TODAY-PREMIUM','SST_API.getShiftToday','data-today-action-card','dataset.todayPremiumReady']);
await assetProof('member-today-premium-v1.css',['G2-001-TODAY-PREMIUM','.mp-today-action-card.is-lead','min-height:48px']);
await assetProof('member-shell-v33g.js',['member-today-premium-v1.js?v=1','member-today-premium-v1.css?v=1']);

async function register(email){const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'TodayProof',source:'commissioning-g2-001'})});if(r.status!==201)throw new Error(`register ${r.status} ${await r.text()}`)}
async function login(page,email){await page.goto(`${SITE}/member-login`,{waitUntil:'domcontentloaded',timeout:30000});const r=await page.evaluate(async({api,email,password})=>{const x=await fetch(`${api}/v1/auth/login`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});return{ok:x.ok,status:x.status,text:await x.text()}},{api:API,email,password});if(!r.ok)throw new Error(`login ${r.status} ${r.text}`)}
async function seedAndReadToday(page){return page.evaluate(async api=>{const plan=await fetch(`${api}/v1/hydration/plan`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({weight_kg:110,activity_minutes:20})});let planBody={};try{planBody=await plan.json()}catch{}const today=await fetch(`${api}/v1/shift/today`,{credentials:'include'});let todayBody={};try{todayBody=await today.json()}catch{}return{plan:{ok:plan.ok,status:plan.status,body:planBody},today:{ok:today.ok,status:today.status,body:todayBody}}},API)}
async function dismissConsent(page){const choices=[page.getByRole('button',{name:/necessary only/i}).first(),page.getByRole('button',{name:/necessary/i}).first()];for(const choice of choices){if(await choice.count()&&await choice.isVisible().catch(()=>false)){await choice.click();await page.waitForTimeout(250);return true}}return false}
async function openToday(page){await page.goto(`${SITE}/member/dashboard`,{waitUntil:'domcontentloaded',timeout:30000});await dismissConsent(page);await page.waitForFunction(()=>/\bToday\b[\s\S]*\bGrub\b[\s\S]*\bFit\b/i.test(document.body?.innerText||''),null,{timeout:20000});for(const c of [page.getByRole('button',{name:/^Today$/i}).first(),page.getByRole('link',{name:/^Today$/i}).first(),page.getByRole('tab',{name:/^Today$/i}).first(),page.getByText(/^Today$/i).first()]){if(await c.count()&&await c.isVisible().catch(()=>false)){await c.click();await page.waitForFunction(()=>document.querySelector('#panel-today')?.dataset.todayPremiumReady==='true',null,{timeout:15000});await page.waitForTimeout(350);return}}throw new Error('Today navigation control missing')}
async function todayControl(page){for(const c of [page.getByRole('button',{name:/^Today$/i}).first(),page.getByRole('link',{name:/^Today$/i}).first(),page.getByRole('tab',{name:/^Today$/i}).first(),page.getByText(/^Today$/i).first()])if(await c.count()&&await c.isVisible().catch(()=>false))return c;return null}
function snapshotFn(){return()=>{const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0&&!e.closest('[hidden]')};const body=String(document.body?.innerText||'').replace(/\s+/g,' ').trim();const headings=[...document.querySelectorAll('h1,h2,h3')].filter(visible).map(e=>({tag:e.tagName,text:String(e.textContent||'').replace(/\s+/g,' ').trim(),font:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight}));const buttons=[...document.querySelectorAll('button,a,[role="button"]')].filter(visible).map(e=>String(e.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean);const actionCards=[...document.querySelectorAll('.mp-today-action-card')].filter(visible).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),cta=e.querySelector('.mp-today-action-cta'),cs=cta?getComputedStyle(cta):null,cr=cta?.getBoundingClientRect();return{text:String(e.innerText||'').replace(/\s+/g,' ').trim(),w:Math.round(r.width),h:Math.round(r.height),bg:s.backgroundColor,border:s.borderTopColor,radius:s.borderRadius,shadow:s.boxShadow,cta:cta?{text:String(cta.textContent||'').trim(),w:Math.round(cr.width),h:Math.round(cr.height),bg:cs.backgroundColor,color:cs.color}:null}});const visibleMetrics=['metricCalories','metricProtein','metricSteps','metricWater'].map(id=>document.getElementById(id)).filter(e=>e&&visible(e)).map(e=>String(e.textContent||'').trim());return{url:location.href,title:document.title,body,headings,buttons,actionCards,visibleMetrics,todayReady:document.querySelector('#panel-today')?.dataset.todayPremiumReady||'',rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,main:document.querySelectorAll('main,[role="main"]').length,h1:document.querySelectorAll('h1').length,rawJson:/\{\s*"?(?:ok|today|actions)"?\s*:/.test(body),implementationJunk:/\b(?:undefined|null|stack trace|TypeError|Internal Server Error|debug|localhost|127\.0\.0\.1)\b/i.test(body)}}}

const browser=await chromium.launch({headless:true});
try{
  for(const [id,viewport] of Object.entries({desktop:{width:1440,height:900},mobile390:{width:390,height:844}})){
    const row={id,viewport,pageErrors:[],consoleErrors:[]};report.cases.push(row);const email=`shiftsometimber+structured-authrender-g3008-${Date.now()}-${id}@gmail.com`;let context;
    try{
      await register(email);context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>row.pageErrors.push(clean(e.message)));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(clean(m.text()))});await login(page,email);row.api=await seedAndReadToday(page);if(!row.api.plan.ok)fail(`${id}-seed-plan`,`hydration plan ${row.api.plan.status}`);const today=row.api.today.body?.today;if(!row.api.today.ok||!today)fail(`${id}-today-api`,`today ${row.api.today.status}`);
      if(today){if(today.headline!=="Here’s your Shift today.")fail(`${id}-headline-contract`,clean(today.headline));if(today.subhead!=='No dashboard archaeology. Just the useful stuff.')fail(`${id}-subhead-contract`,clean(today.subhead));if(!Array.isArray(today.actions)||today.actions.length<2)fail(`${id}-action-depth`,`${today.actions?.length||0}`);if(!today.actions?.some(a=>a.domain==='hydration'))fail(`${id}-personalised-action`,'hydration plan not consumed by Today')}
      await openToday(page);row.rendered=await page.evaluate(snapshotFn());const body=row.rendered.body;
      if(!/Here[’']s your Shift today\./i.test(body))fail(`${id}-render-headline`,'canonical Today headline not rendered');if(!/No dashboard archaeology\. Just the useful stuff\./i.test(body))fail(`${id}-render-subhead`,'canonical Today subhead not rendered');
      if(today){for(const action of today.actions.slice(0,3)){if(action.title&&!body.includes(action.title))fail(`${id}-render-title`,action.title);if((action.detail||action.text)&&!body.includes(action.detail||action.text))fail(`${id}-render-detail`,action.detail||action.text);if(action.cta?.label&&!body.includes(action.cta.label))fail(`${id}-render-cta`,action.cta.label)}}
      if(row.rendered.todayReady!=='true')fail(`${id}-premium-ready`,row.rendered.todayReady||'missing');if(row.rendered.actionCards.length<2)fail(`${id}-action-cards`,String(row.rendered.actionCards.length));
      const lead=row.rendered.actionCards[0];if(lead){if(lead.bg!=='rgb(23, 38, 29)')fail(`${id}-lead-background`,lead.bg);if(numericPx(lead.radius)<20)fail(`${id}-lead-radius`,lead.radius);if(!lead.shadow||lead.shadow==='none')fail(`${id}-lead-shadow`,lead.shadow||'none')}
      for(const card of row.rendered.actionCards){if(card.cta&&card.cta.h<44)fail(`${id}-touch-target`,`${card.cta.text}:${card.cta.h}px`)}
      if(id==='mobile390'&&row.rendered.actionCards.some(card=>card.cta&&card.cta.w<280))fail(`${id}-mobile-cta-width`,JSON.stringify(row.rendered.actionCards.map(x=>x.cta)));
      if(row.rendered.visibleMetrics.some(x=>!x||x==='—'))fail(`${id}-fake-metric`,JSON.stringify(row.rendered.visibleMetrics));if(row.rendered.rootOverflow>0)fail(`${id}-overflow`,`${row.rendered.rootOverflow}px`);if(!row.rendered.main)fail(`${id}-main`,'missing main landmark');if(!row.rendered.h1)fail(`${id}-h1`,'missing h1');if(row.rendered.rawJson)fail(`${id}-raw-json`,'implementation JSON visible');if(row.rendered.implementationJunk)fail(`${id}-implementation-junk`,'debug/error/internal text visible');if(row.rendered.headings.length<2)fail(`${id}-hierarchy`,'insufficient visible heading hierarchy');
      await page.screenshot({path:path.join(OUT,`${id}-today.png`),fullPage:true});
      row.ctaProof={};
      const logDrink=page.locator('button[data-today-target="hydration"]').first();
      if(!(await logDrink.count())||!(await logDrink.isVisible().catch(()=>false)))fail(`${id}-log-drink-cta`,'missing');
      else if(!/^Log a drink$/i.test(clean(await logDrink.textContent())))fail(`${id}-log-drink-label`,clean(await logDrink.textContent()));
      else{await logDrink.click();await page.waitForFunction(()=>document.querySelector('#panel-water')?.classList.contains('active'),null,{timeout:5000});row.ctaProof.logDrinkReachedHydration=true;const back=await todayControl(page);if(!back)fail(`${id}-today-return-control`,'missing');else{await back.click();await page.waitForFunction(()=>document.querySelector('#panel-today')?.dataset.todayPremiumReady==='true',null,{timeout:10000});await page.waitForTimeout(250);const returnBody=clean(await page.locator('#panel-today').innerText());row.ctaProof.returnedWithCanonicalState=today?.actions?.slice(0,3).every(a=>(!a.title||returnBody.includes(a.title))&&(!(a.detail||a.text)||returnBody.includes(a.detail||a.text)));if(!row.ctaProof.returnedWithCanonicalState)fail(`${id}-return-state`,returnBody.slice(0,500))}}
      const doneLater=page.locator('button[data-today-target="today"]').first();
      if(!(await doneLater.count())||!(await doneLater.isVisible().catch(()=>false)))fail(`${id}-done-later-cta`,'missing');
      else if(!/^Done later$/i.test(clean(await doneLater.textContent())))fail(`${id}-done-later-label`,clean(await doneLater.textContent()));
      else{await doneLater.click();await page.waitForFunction(()=>{const b=document.querySelector('button[data-today-target="today"]');return b?.getAttribute('aria-pressed')==='true'&&/Kept simple/i.test(b?.textContent||'')},null,{timeout:3000});row.ctaProof.todayAcknowledged=await doneLater.getAttribute('aria-pressed')==='true'&&/Kept simple/i.test(await doneLater.textContent());if(!row.ctaProof.todayAcknowledged)fail(`${id}-today-acknowledgement`,'CTA did not settle to explicit outcome')}
      await page.waitForTimeout(120);if(row.pageErrors.length)fail(`${id}-page-errors`,JSON.stringify(row.pageErrors));if(row.consoleErrors.length)fail(`${id}-console-errors`,JSON.stringify(row.consoleErrors));
    }catch(error){fail(`${id}-exception`,clean(error?.message||error).slice(0,1600))}finally{write();if(context)await context.close().catch(()=>{})}
  }
}finally{await browser.close();write()}
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`G2-001 rendered Today acceptance failed ${report.failures.length}`);
console.log('PASS G2-001 rendered premium Today acceptance: canonical authenticated Today detail and CTAs are visible, Log a drink reaches the real hydration surface, canonical priorities survive leave/return, the in-surface acknowledgement settles explicitly, unavailable metrics are not faked, and desktop + 390px retain homepage-grade hierarchy, usable touch targets, zero root overflow and no browser errors.');
