import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.STATE_EVIDENCE_DIR||'state-system-evidence';
if(!OIDC) throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});

const browsers={chromium,firefox,webkit};
const viewports={desktop:{width:1440,height:900},mobile390:{width:390,height:844}};
const password='Shift-Commissioning-2026!';
const nonce=`structured-authrender-state-${Date.now()}`;
const report={proof:'G1_008_RENDERED_STATE_SYSTEM_PRODUCTION',base:SITE,cases:[],failures:[],observations:[],registrations:[]};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const slug=s=>s.replace(/[^a-z0-9-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=G1-008 rendered state system::${name} — ${detail}`)};
const observe=(name,detail)=>{report.observations.push({name,detail});console.warn(`::warning title=G1-008 observation::${name} — ${detail}`)};
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));

async function screenshot(page,name){const file=path.join(OUT,`${slug(name)}.png`);await page.screenshot({path:file,fullPage:true}).catch(()=>{});return file}
async function bodyText(page){return clean(await page.locator('body').innerText().catch(()=>''))}
async function assertShell(page,name){
  const text=await bodyText(page);
  if(text.length<80) fail(name,`near-blank body (${text.length} visible chars)`);
  if(/internal server error|application error|sqlite|sql error|stack trace|cloudflare ray id/i.test(text)) fail(name,'internal diagnostics exposed');
  const geom=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  if(geom.scrollWidth-geom.clientWidth>8) fail(name,`horizontal overflow ${geom.scrollWidth-geom.clientWidth}px`);
  return {textChars:text.length,horizontalOverflowPx:Math.max(0,geom.scrollWidth-geom.clientWidth)};
}
async function findAction(page,pattern){
  const candidates=[page.getByRole('link',{name:pattern}).first(),page.getByRole('button',{name:pattern}).first(),page.getByRole('tab',{name:pattern}).first(),page.locator('a,button,[role="button"],[role="tab"]').filter({hasText:pattern}).first(),page.getByText(pattern).first()];
  for(const c of candidates) if(await c.count()&&await c.isVisible().catch(()=>false)) return c;
  return null;
}
async function dismissCookie(page){for(const re of [/necessary only/i,/accept analytics/i,/accept all/i]){const x=await findAction(page,re);if(x){await x.click({timeout:2500}).catch(()=>{});return}}}
async function register(identity){
  const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email:identity.email,firstName:'Dave',password,source:'commissioning-rendered-state'})});
  let data=null;try{data=await r.json()}catch{}
  const row={name:identity.id,status:r.status,ok:r.status===201,error:data?.error||null};report.registrations.push(row);
  if(!row.ok) fail(`${identity.id}-register`,`${r.status} ${JSON.stringify(data)}`);
}
async function login(page,email,name){
  await page.goto(`${SITE}/member-login`,{waitUntil:'networkidle',timeout:45000});await dismissCookie(page);
  const ei=page.locator('input[type="email"],input[name*="email" i]').filter({visible:true}).first();
  const pi=page.locator('input[type="password"]').filter({visible:true}).first();
  if(!await ei.count()||!await pi.count()){fail(`${name}-login`,'login controls missing');return false}
  await ei.fill(email);await pi.fill(password);
  const form=ei.locator('xpath=ancestor::form[1]');const submit=(await form.count()?form:page).locator('button[type="submit"],input[type="submit"],button').filter({visible:true}).first();
  const responsePromise=page.waitForResponse(r=>r.url().includes('/v1/auth/login')&&r.request().method()==='POST',{timeout:12000}).catch(()=>null);
  await submit.click({timeout:8000});const response=await responsePromise;await page.waitForTimeout(500);
  if(!response||response.status()!==200){fail(`${name}-login`,`login response ${response?.status()??'none'}`);return false}
  return true;
}
async function loadingMarker(page){
  const semantic=page.locator('[aria-busy="true"],[role="progressbar"],[data-state="loading"],.loading,.loader,.skeleton,[class*="skeleton" i]').filter({visible:true});
  if(await semantic.count()) return {found:true,kind:'semantic',count:await semantic.count()};
  const text=await bodyText(page);
  const m=text.match(/\b(loading|getting[^.]{0,45}ready|preparing|building[^.]{0,35}(plan|today|session)|checking[^.]{0,30}(session|account)|one moment|hang on)\b/i);
  return m?{found:true,kind:'text',sample:m[0]}:{found:false};
}
async function emptyMarker(page){
  const semantic=page.locator('[data-state="empty"],.empty-state,[class*="empty-state" i],[class~="empty"]').filter({visible:true});
  if(await semantic.count()) return {found:true,kind:'semantic',count:await semantic.count()};
  const text=await bodyText(page);
  const m=text.match(/\b(nothing here yet|nothing yet|no [^.]{0,45} yet|not [^.]{0,45} yet|get started|start by|add your first|log your first|create your first|build your first|generate your first|start a plan|once you|when you log)\b/i);
  return m?{found:true,kind:'text',sample:m[0]}:{found:false};
}
async function openTarget(page,re,name){
  await page.goto(`${SITE}/member/dashboard?state-system=${Date.now()}#today`,{waitUntil:'networkidle',timeout:45000});await dismissCookie(page);
  let a=await findAction(page,re);
  if(!a){const menu=await findAction(page,/^menu$|navigation|open menu/i);if(menu){await menu.click({timeout:2500}).catch(()=>{});a=await findAction(page,re)}}
  if(!a){fail(name,'target action not discoverable from authenticated dashboard');return false}
  await a.click({timeout:6000});await page.waitForTimeout(450);return true;
}

const identities=[];
for(const [bn] of Object.entries(browsers)) for(const [vn] of Object.entries(viewports)) identities.push({bn,vn,id:`${bn}-${vn}`,email:`shiftsometimber+${nonce}-${bn}-${vn}@gmail.com`});
await Promise.all(identities.map(register));write();

for(const x of identities){
  if(!report.registrations.find(r=>r.name===x.id)?.ok) continue;
  const browser=await browsers[x.bn].launch({headless:true});
  try{
    const context=await browser.newContext({viewport:viewports[x.vn],reducedMotion:'reduce'});const page=await context.newPage();
    if(!await login(page,x.email,x.id)){await context.close();continue}

    // LOADING: delay authenticated non-auth API reads after login and require a visible, intelligible rendered loading state while the real request is pending.
    let delayed=0;
    await page.route('**/v1/**',async route=>{
      const req=route.request(),u=new URL(req.url());
      if(u.origin===API&&!u.pathname.startsWith('/v1/auth/')&&delayed<4){delayed++;await new Promise(r=>setTimeout(r,1800));}
      await route.continue();
    });
    const loadingName=`${x.id}-loading`;
    const nav=page.goto(`${SITE}/member/dashboard?state-loading=${Date.now()}#today`,{waitUntil:'networkidle',timeout:45000}).catch(e=>{fail(loadingName,clean(e.message).slice(0,300));return null});
    await page.waitForTimeout(350);
    const loading=await loadingMarker(page);const loadingShell=await assertShell(page,loadingName);const loadingShot=await screenshot(page,loadingName);
    if(!loading.found) fail(loadingName,'no visible loading/status affordance while authenticated member data request was deliberately pending');
    await nav;await page.unroute('**/v1/**');
    report.cases.push({name:loadingName,delayedRequests:delayed,loading,...loadingShell,screenshot:loadingShot});

    // EMPTY: this is a brand-new verified synthetic member with no generated plan/progress history. Representative empty product surfaces must explain what to do next, not render a blank/prototype shell.
    const targets=[['grub',/shift grub|\bgrub\b/i],['fit',/shift fit|\bfit\b/i],['progress',/shift progress|\bprogress\b/i],['plans',/my plans|plans/i]];
    for(const [key,re] of targets){
      const name=`${x.id}-empty-${key}`;if(!await openTarget(page,re,name))continue;
      const shell=await assertShell(page,name),empty=await emptyMarker(page),text=await bodyText(page),shot=await screenshot(page,name);
      if(!empty.found) fail(name,`fresh-member surface lacks an explicit empty/get-started state; visible sample: ${text.slice(0,260)}`);
      report.cases.push({name,empty,...shell,url:page.url(),textSample:text.slice(0,320),screenshot:shot});
    }
    await context.close();
  }catch(e){fail(x.id,clean(e.message).slice(0,700))}finally{await browser.close();write()}
}

console.log(JSON.stringify(report,null,2));
if(report.failures.length) throw new Error(`G1-008 rendered state-system acceptance failed ${report.failures.length} assertion(s)`);
console.log(`PASS G1-008 automated rendered state-system floor: ${report.cases.length} loading/empty cases across Chromium/Firefox/WebKit desktop + 390px. This automation is evidence, not a substitute for any explicitly retained final physical-device/human acceptance.`);
