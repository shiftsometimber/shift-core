import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.G3_PREMIUM_EVIDENCE_DIR||'g3-premium-system-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});

const password=`Sst-${randomUUID()}-Aa1!`;
const report={
  proof:'G3_PREMIUM_SYSTEM_PRODUCTION_V2_PALETTE_FAMILY',
  constitution:{
    principle:'homepage-grade forest/cream family, not literal single-token colour matching',
    forest:'dark green surfaces/active controls',
    cream:'warm off-white/stone content surfaces'
  },
  cases:[],failures:[]
};
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=Gate 3 premium system::${name} — ${detail}`)};
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));

async function register(email){
  const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'PremiumProof',source:'commissioning-g3-premium-system'})});
  if(r.status!==201)throw new Error(`register ${r.status} ${await r.text()}`);
}
async function login(page,email){
  await page.goto(`${SITE}/member-login`,{waitUntil:'domcontentloaded',timeout:30000});
  const r=await page.evaluate(async({api,email,password})=>{const x=await fetch(`${api}/v1/auth/login`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});return{ok:x.ok,status:x.status,text:await x.text()}},{api:API,email,password});
  if(!r.ok)throw new Error(`login ${r.status} ${r.text}`);
}
async function dismissConsent(page){for(const c of [page.getByRole('button',{name:/necessary only/i}).first(),page.getByRole('button',{name:/necessary/i}).first()]){if(await c.count()&&await c.isVisible().catch(()=>false)){await c.click();await page.waitForTimeout(150);return}}}
const reEscape=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
async function clickExact(page,label){const rx=new RegExp(`^${reEscape(label)}$`,'i');for(const c of [page.getByRole('button',{name:rx}).first(),page.getByRole('link',{name:rx}).first(),page.getByText(rx).first()]){if(await c.count()&&await c.isVisible().catch(()=>false)){await c.click();await page.waitForTimeout(350);return true}}return false}

function snapshotFn(){return()=>{
  const tidy=v=>String(v||'').replace(/\s+/g,' ').trim();
  const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0&&!e.closest('[hidden]')};
  const surfaces=[...document.querySelectorAll('main *')].filter(visible).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{tag:e.tagName,cls:String(e.className||''),bg:s.backgroundColor,w:Math.round(r.width),h:Math.round(r.height),radius:parseFloat(s.borderRadius)||0}}).filter(x=>x.bg&&x.bg!=='rgba(0, 0, 0, 0)'&&x.bg!=='transparent');
  const controls=[...document.querySelectorAll('main button,main input,main select,main textarea')].filter(visible).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{tag:e.tagName,text:tidy(e.textContent||e.getAttribute('aria-label')||e.getAttribute('placeholder')||''),h:Math.round(r.height),radius:parseFloat(s.borderRadius)||0,border:s.borderTopColor,bg:s.backgroundColor}});
  const footer=document.querySelector('footer'),fr=footer?.getBoundingClientRect();
  const body=tidy(document.body?.innerText||'');
  return{body,rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,main:document.querySelectorAll('main,[role="main"]').length,h1:[...document.querySelectorAll('h1')].filter(visible).map(e=>({text:tidy(e.textContent),size:parseFloat(getComputedStyle(e).fontSize)||0})),h2:[...document.querySelectorAll('h2')].filter(visible).map(e=>tidy(e.textContent)),surfaces,controls,footer:footer&&visible(footer)?{text:tidy(footer.innerText),w:Math.round(fr.width),left:Math.round(fr.left),right:Math.round(fr.right)}:null,junk:/\b(?:undefined|null|stack trace|TypeError|Internal Server Error|localhost|127\.0\.0\.1|debug mode)\b/i.test(body)};
}}
function rgb(bg){const m=String(bg||'').match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
function forestFamily(bg){const c=rgb(bg);return !!c&&c[0]<=45&&c[1]>=18&&c[1]<=75&&c[2]<=55&&c[1]>=c[0]&&c[1]>=c[2]}
function creamFamily(bg){const c=rgb(bg);return !!c&&c[0]>=235&&c[1]>=225&&c[2]>=210&&c[0]>=c[1]&&c[1]>=c[2]}
function checkSnapshot(id,name,s,viewport){
  if(s.rootOverflow>0)fail(`${id}-${name}-overflow`,`${s.rootOverflow}px`);
  if(!s.main)fail(`${id}-${name}-main`,'missing main landmark');
  if(!s.h1.length)fail(`${id}-${name}-h1`,'missing visible H1');else if(s.h1[0].size<(viewport.width<=390?30:36))fail(`${id}-${name}-h1-size`,String(s.h1[0].size));
  if(s.junk)fail(`${id}-${name}-implementation-junk`,'visible implementation/error junk');
  if(!s.footer)fail(`${id}-${name}-footer`,'visible footer missing');else if(s.footer.left<0||s.footer.right>viewport.width+1||s.footer.w>viewport.width+1)fail(`${id}-${name}-footer-geometry`,JSON.stringify(s.footer));
  for(const c of s.controls){if(c.tag==='BUTTON'&&c.h<44)fail(`${id}-${name}-button-touch`,`${c.text}:${c.h}px`);if(['INPUT','SELECT','TEXTAREA'].includes(c.tag)&&c.h<40)fail(`${id}-${name}-control-height`,`${c.tag}:${c.text}:${c.h}px`);if(['INPUT','SELECT','TEXTAREA'].includes(c.tag)&&c.radius<6)fail(`${id}-${name}-control-radius`,`${c.tag}:${c.text}:${c.radius}px`)}
  const substantial=s.surfaces.filter(x=>x.w>180&&x.h>75);
  if(!substantial.some(x=>forestFamily(x.bg)))fail(`${id}-${name}-forest-family`,'no substantial dark-green member surface');
  if(!substantial.some(x=>creamFamily(x.bg)))fail(`${id}-${name}-cream-family`,'no substantial warm off-white/stone surface');
}

const browser=await chromium.launch({headless:true});
try{
  for(const [id,viewport] of Object.entries({desktop:{width:1440,height:900},mobile390:{width:390,height:844}})){
    const row={id,viewport,pageErrors:[],consoleErrors:[],surfaces:{}};report.cases.push(row);const email=`shiftsometimber+structured-authrender-g3premium-${Date.now()}-${id}@gmail.com`;let context;
    try{
      await register(email);context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>row.pageErrors.push(clean(e.message)));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(clean(m.text()))});
      await page.goto(`${SITE}/`,{waitUntil:'domcontentloaded',timeout:30000});await dismissConsent(page);await page.waitForTimeout(500);row.public=await page.evaluate(snapshotFn());if(row.public.rootOverflow>0)fail(`${id}-public-overflow`,`${row.public.rootOverflow}px`);if(!row.public.h1.length)fail(`${id}-public-h1`,'homepage H1 missing');if(!row.public.footer)fail(`${id}-public-footer`,'homepage footer missing');
      await login(page,email);await page.goto(`${SITE}/member/dashboard`,{waitUntil:'domcontentloaded',timeout:30000});await dismissConsent(page);await page.waitForFunction(()=>/\bMY SHIFT\b/i.test(document.body?.innerText||''),null,{timeout:20000});await page.waitForTimeout(600);
      if(viewport.width<=390){const menu=page.getByRole('button',{name:/^Menu$/i}).first();if(await menu.count()&&await menu.isVisible().catch(()=>false)){await menu.click();await page.waitForTimeout(200)}}
      const expectedNav=['Shift Today','Shift Grub','Shift Fit','Hydration','Conundrum','My Plans','Progress Picture','Shift MOT','Shift Progress','Check-in','Settings'];const shellText=clean(await page.locator('body').innerText());for(const label of expectedNav)if(!shellText.includes(label))fail(`${id}-member-ia-${label.replace(/\s+/g,'-').toLowerCase()}`,'missing member-intent navigation label');
      row.surfaces.today=await page.evaluate(snapshotFn());checkSnapshot(id,'today',row.surfaces.today,viewport);
      for(const target of ['Grub','Fit','My Plans','Progress']){const clicked=await clickExact(page,target),key=target.toLowerCase().replace(/\s+/g,'_');if(!clicked){fail(`${id}-${key}-navigation`,'control missing');continue}await page.waitForTimeout(450);const s=await page.evaluate(snapshotFn());row.surfaces[key]=s;checkSnapshot(id,key,s,viewport)}
      if(!/Helping ordinary blokes feel like themselves again\./i.test(row.surfaces.today.footer?.text||''))fail(`${id}-footer-brand-contract`,'member footer does not retain brand promise');
      await page.screenshot({path:path.join(OUT,`${id}-member-system.png`),fullPage:true});if(row.pageErrors.length)fail(`${id}-page-errors`,JSON.stringify(row.pageErrors));if(row.consoleErrors.length)fail(`${id}-console-errors`,JSON.stringify(row.consoleErrors));
    }catch(e){fail(`${id}-exception`,clean(e?.message||e).slice(0,1200))}finally{if(context)await context.close().catch(()=>{});write()}
  }
}finally{await browser.close();write()}
console.log(JSON.stringify(report,null,2));if(report.failures.length)throw new Error(`Gate 3 premium-system production acceptance failed ${report.failures.length}`);console.log('PASS Gate 3 premium system: homepage-grade forest/cream palette family carries into authenticated My Shift shell, responsive intent navigation, footer, forms and representative Today/Grub/Fit/Plans/Progress surfaces at desktop + 390px with no implementation leakage or root overflow.');
