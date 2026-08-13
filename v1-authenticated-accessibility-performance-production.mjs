import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {SLOS} from './operational-slos-v1.js';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.AP_AUTH_EVIDENCE_DIR||'v1-auth-ap-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});

const report={proof:'V1_AUTHENTICATED_ACCESSIBILITY_PERFORMANCE_V4_CONTRAST_TIMING',budgets:SLOS,cases:[],failures:[]};
const fail=(n,d)=>{report.failures.push({name:n,detail:d});console.error(`::error title=Authenticated A11y Performance::${n} — ${d}`)};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();

async function action(p,re){
  for(const x of [p.getByRole('button',{name:re}).first(),p.getByRole('link',{name:re}).first(),p.getByRole('tab',{name:re}).first(),p.getByText(re).first()]){
    if(await x.count()&&await x.isVisible().catch(()=>false))return x;
  }
  return null;
}

async function inspect(p,name,renderMs){
  const state=await p.evaluate(()=>{
    const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0};
    const unlabeled=[...document.querySelectorAll('input,select,textarea,button')].filter(e=>visible(e)&&e.type!=='hidden'&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!(e.id&&document.querySelector(`label[for="${CSS.escape(e.id)}"]`))&&!e.closest('label')&&!(e.tagName==='BUTTON'&&String(e.textContent||'').trim())).map(e=>({tag:e.tagName,type:e.getAttribute('type')||'',id:e.id||'',name:e.getAttribute('name')||''}));
    const rgba=value=>{const m=String(value||'').match(/rgba?\(([^)]+)\)/i);if(!m)return null;const q=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return[q[0]||0,q[1]||0,q[2]||0,Number.isFinite(q[3])?q[3]:1]};
    const over=(fg,bg)=>{const a=fg[3]+bg[3]*(1-fg[3]);if(!a)return[255,255,255,1];return[(fg[0]*fg[3]+bg[0]*bg[3]*(1-fg[3]))/a,(fg[1]*fg[3]+bg[1]*bg[3]*(1-fg[3]))/a,(fg[2]*fg[3]+bg[2]*bg[3]*(1-fg[3]))/a,a]};
    const background=e=>{const chain=[];for(let n=e;n;n=n.parentElement)chain.push(n);let bg=[255,255,255,1];for(const n of chain.reverse()){const c=rgba(getComputedStyle(n).backgroundColor);if(c&&c[3]>0)bg=over(c,bg)}return bg};
    const lum=c=>{const v=c.slice(0,3).map(x=>{x=x/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
    const ratio=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    const selector=e=>{if(e.id)return`#${CSS.escape(e.id)}`;const cls=[...e.classList].slice(0,2).map(x=>`.${CSS.escape(x)}`).join('');return`${e.tagName.toLowerCase()}${cls}`};
    const contrast=[];
    const candidates=[...document.querySelectorAll('body *')].filter(e=>visible(e));
    for(const e of candidates){
      const s=getComputedStyle(e),bg=background(e),fg0=rgba(s.color),text=String(e.textContent||'').trim();
      if(text&&fg0&&[...e.children].every(c=>!String(c.textContent||'').trim())){
        const fg=over(fg0,bg),r=ratio(fg,bg),size=parseFloat(s.fontSize)||16,weight=parseInt(s.fontWeight,10)||400,large=size>=24||(size>=18.66&&weight>=700),required=large?3:4.5;
        if(r+1e-6<required)contrast.push({kind:'text',selector:selector(e),ratio:Number(r.toFixed(2)),required,fg:s.color,bg:`rgb(${bg.slice(0,3).map(x=>Math.round(x)).join(', ')})`,sample:text.slice(0,80)});
      }
      if(e.matches('button,input,select,textarea,[role="button"],[role="tab"]')){
        const border=rgba(s.borderTopColor),fg=border||fg0;if(fg){const r=ratio(over(fg,bg),bg);if(r+1e-6<3)contrast.push({kind:'control',selector:selector(e),ratio:Number(r.toFixed(2)),required:3,fg:border?s.borderTopColor:s.color,bg:`rgb(${bg.slice(0,3).map(x=>Math.round(x)).join(', ')})`})}
      }
      if(contrast.length>=40)break;
    }
    return{rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,main:document.querySelectorAll('main,[role="main"]').length,h1:document.querySelectorAll('h1').length,unlabeled,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,visibleChars:String(document.body?.innerText||'').trim().length,contrastFailures:contrast};
  });
  if(renderMs>SLOS.publicP95Ms)fail(name,`render-ready ${renderMs}ms > ${SLOS.publicP95Ms}ms public/render budget`);
  if(state.rootOverflow>0)fail(name,`root overflow ${state.rootOverflow}px`);
  if(state.main<1&&state.h1<1)fail(name,'missing main landmark/h1');
  if(state.unlabeled.length)fail(name,`${state.unlabeled.length} visible controls lack labels/names: ${JSON.stringify(state.unlabeled.slice(0,8))}`);
  if(!state.reducedMotion)fail(name,'reduced-motion preference inactive');
  if(state.visibleChars<100)fail(name,'near blank surface');
  if(state.contrastFailures.length)fail(name,`${state.contrastFailures.length} measured WCAG contrast failures: ${JSON.stringify(state.contrastFailures.slice(0,8))}`);
  await p.keyboard.press('Tab');
  const focus=await p.evaluate(()=>{const e=document.activeElement,s=e&&getComputedStyle(e);return{ok:!!e&&e!==document.body&&e!==document.documentElement,tag:e?.tagName||'',outline:s?.outlineStyle||'',outlineWidth:s?.outlineWidth||'',boxShadow:s?.boxShadow||''}});
  if(!focus.ok)fail(name,'Tab did not move focus');
  if((focus.outline==='none'||focus.outlineWidth==='0px')&&(!focus.boxShadow||focus.boxShadow==='none'))fail(name,`focused ${focus.tag} has no visible focus treatment`);
  report.cases.push({name,renderReadyMs:renderMs,...state,focus,url:p.url()});
  await p.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true}).catch(()=>{});
}

async function surface(p,id,label,marker){
  const a=await action(p,label);if(!a){fail(id,`navigation missing for ${label}`);return}
  const started=Date.now();await a.click();
  try{await p.waitForFunction(({source,flags})=>new RegExp(source,flags).test(document.body?.innerText||''),{source:marker.source,flags:marker.flags},{timeout:15000})}catch{fail(id,`surface did not settle: ${clean(await p.locator('body').innerText()).slice(0,700)}`)}
  await inspect(p,id,Date.now()-started);
}

async function shiftAiSurface(p,id){
  let a=await action(p,/^shift ai$/i);if(!a)a=await action(p,/^ask timber$/i);
  const started=Date.now();
  if(a)await a.click();else await p.goto(`${SITE}/ask-timber`,{waitUntil:'domcontentloaded',timeout:45000});
  try{await p.waitForFunction(()=>/shift ai|ask timber|what can i help|how can i help|ask shift/i.test(document.body?.innerText||''),null,{timeout:15000})}catch{}
  const pathname=new URL(p.url()).pathname;if(/member-login/i.test(pathname)){fail(id,'Ask Timber lost authenticated session');return}
  const body=clean(await p.locator('body').innerText());if(/that page has wandered off|page you tried to open could not be found/i.test(body)){fail(id,`Ask Timber resolved to not-found at ${pathname}`);return}
  if(!/shift ai|ask timber|what can i help|how can i help|ask shift/i.test(body))fail(id,`Shift AI surface did not settle: ${body.slice(0,700)}`);
  await inspect(p,id,Date.now()-started);
}

const password=`Sst-${randomUUID()}-Aa1!`,email=`shiftsometimber+structured-authrender-ap-${Date.now()}@gmail.com`;
const registerStarted=Date.now();
const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,firstName:'Dave',password,source:'commissioning-auth-ap'})});
const registerMs=Date.now()-registerStarted;if(r.status!==201)throw new Error(`fixture register HTTP ${r.status}`);if(registerMs>SLOS.apiP95Ms)fail('fixture-register',`API ${registerMs}ms > ${SLOS.apiP95Ms}ms budget`);

const browser=await chromium.launch({headless:true});
try{
  for(const [vpName,viewport] of Object.entries({desktop:{width:1440,height:900},mobile390:{width:390,height:844}})){
    const c=await browser.newContext({viewport,reducedMotion:'reduce'}),p=await c.newPage();
    await p.goto(`${SITE}/member-login`,{waitUntil:'networkidle',timeout:45000});
    const loginStarted=Date.now();const auth=await p.evaluate(async({api,email,password})=>{const x=await fetch(`${api}/v1/auth/login`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});return{x:x.status,ok:x.ok}},{api:API,email,password});const loginMs=Date.now()-loginStarted;
    if(loginMs>SLOS.apiP95Ms)fail(`${vpName}-auth`,`login API ${loginMs}ms > ${SLOS.apiP95Ms}ms budget`);
    if(!auth.ok){fail(`${vpName}-auth`,`login ${auth.x}`);await c.close();continue}
    const dashboardStarted=Date.now();await p.goto(`${SITE}/member/dashboard`,{waitUntil:'domcontentloaded',timeout:45000});await p.waitForFunction(()=>String(document.body?.innerText||'').trim().length>100,null,{timeout:15000});await inspect(p,`${vpName}-my-shift`,Date.now()-dashboardStarted);
    await surface(p,`${vpName}-today`,/^today$/i,/today|your shift/i);
    await surface(p,`${vpName}-grub`,/^grub$/i,/build my menu/i);
    await surface(p,`${vpName}-fit`,/^fit$/i,/build my session/i);
    await surface(p,`${vpName}-progress`,/^shift progress$/i,/your story starts here|progress/i);
    await shiftAiSurface(p,`${vpName}-shift-ai`);
    await c.close();
  }
}finally{await browser.close()}

fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`authenticated accessibility/performance failed ${report.failures.length}`);
console.log(`PASS authenticated accessibility/performance: ${report.cases.length} member surface cases with measured contrast and render-ready timing.`);
