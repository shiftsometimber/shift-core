import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.OVERFLOW_EVIDENCE_DIR||'overflow-evidence';
const password='Shift-Commissioning-2026!';
if(!OIDC) throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});
const report={proof:'GATE1_AUTHENTICATED_OVERFLOW_DIAGNOSTIC_V5',auth:[],cases:[],failures:[],navigationErrors:[],browserErrors:[]};
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));

async function register(email){
  const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,firstName:'Dave',password,source:'commissioning-rendered'})});
  if(r.status!==201) throw new Error(`register ${r.status} ${await r.text()}`);
}
async function memberState(p){
  return p.evaluate(async api=>{try{const r=await fetch(`${api}/v1/member-state`,{credentials:'include',headers:{Accept:'application/json'}});return{status:r.status,ok:r.ok}}catch(e){return{status:0,ok:false,error:String(e?.message||e)}}},API);
}
async function visible(p,re){
  for(const x of [p.getByRole('link',{name:re}).first(),p.getByRole('button',{name:re}).first(),p.getByText(re).first()]) if(await x.count()&&await x.isVisible().catch(()=>false)) return x;
  return null;
}
async function dismissCookie(p){
  for(const re of [/necessary only/i,/accept analytics/i,/accept all/i]){const x=await visible(p,re);if(x){await x.click({timeout:3000}).catch(()=>{});await p.waitForTimeout(200);return true}}
  return false;
}
async function login(p,email,name){
  await p.goto(`${SITE}/member-login`,{waitUntil:'networkidle',timeout:45000});
  await dismissCookie(p);
  const ei=p.locator('input[type="email"],input[name*="email" i]').filter({visible:true}).first();
  const pi=p.locator('input[type="password"]').filter({visible:true}).first();
  await ei.fill(email); await pi.fill(password);
  const form=ei.locator('xpath=ancestor::form[1]');
  const submit=(await form.count()?form:p).locator('button[type="submit"],input[type="submit"],button').filter({visible:true}).first();
  const responseWait=p.waitForResponse(r=>r.url().includes('/v1/auth/login')&&r.request().method()==='POST',{timeout:15000});
  await submit.click({timeout:8000});
  const lr=await responseWait;
  let state=await memberState(p);
  for(let i=0;i<12&&!state.ok;i++){await p.waitForTimeout(250);state=await memberState(p)}
  const cookies=(await p.context().cookies(`${API}/`)).filter(k=>k.name==='sst_session').map(k=>({name:k.name,domain:k.domain,path:k.path,httpOnly:k.httpOnly,secure:k.secure,sameSite:k.sameSite}));
  report.auth.push({name,loginStatus:lr.status(),memberState:state,cookiePresent:cookies.length>0,url:p.url()});write();
  if(lr.status()!==200||!state.ok||!cookies.length) throw new Error(`${name} authentication not established: login=${lr.status()} member=${state.status} cookie=${cookies.length?'yes':'no'}`);
  await p.goto(`${SITE}/member/dashboard?release=33d#today`,{waitUntil:'networkidle',timeout:45000});
  await dismissCookie(p);
  const landed=await memberState(p);
  if(!landed.ok) throw new Error(`${name} session lost on dashboard navigation (${landed.status})`);
}

async function inspect(p,name){
  const d=await p.evaluate(()=>{
    const root=document.documentElement,vw=root.clientWidth,iw=innerWidth,sw=root.scrollWidth;
    const items=[],overlays=[];
    for(const el of document.querySelectorAll('body *')){
      const r=el.getBoundingClientRect();if(!r.width&&!r.height)continue;
      const c=getComputedStyle(el);
      const m={tag:el.tagName.toLowerCase(),id:el.id||'',className:String(el.className||'').slice(0,220),role:el.getAttribute('role')||'',ariaLabel:el.getAttribute('aria-label')||'',text:String(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,180),left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height),position:c.position,display:c.display,visibility:c.visibility,widthCss:c.width,minWidth:c.minWidth,maxWidth:c.maxWidth,paddingLeft:c.paddingLeft,paddingRight:c.paddingRight,marginLeft:c.marginLeft,marginRight:c.marginRight,overflowX:c.overflowX,whiteSpace:c.whiteSpace,transform:c.transform,zIndex:c.zIndex,gridTemplateColumns:c.gridTemplateColumns,flex:c.flex};
      const excess=Math.max(r.right-vw,r.width-vw);
      if(r.right>0&&excess>8)items.push({el,meta:{...m,excess:Math.round(excess)}});
      if((c.position==='fixed'||c.position==='sticky')&&c.visibility!=='hidden')overlays.push(m);
    }
    items.sort((a,b)=>b.meta.excess-a.meta.excess);overlays.sort((a,b)=>(Number(b.zIndex)||0)-(Number(a.zIndex)||0));
    const top=items.slice(0,30),rules=[];
    for(const s of Array.from(document.styleSheets)){
      let rs=[];try{rs=Array.from(s.cssRules||[])}catch{continue}
      const walk=x=>{for(const rule of x){if(rule.cssRules){walk(Array.from(rule.cssRules));continue}const sel=rule.selectorText;if(!sel)continue;let hit=false;for(const y of top){try{if(y.el.matches(sel)){hit=true;break}}catch{}}if(!hit)continue;const css=String(rule.cssText||'');if(/(width|min-width|max-width|margin|padding|transform|translate|overflow|white-space|position|grid|flex|left|right)/i.test(css))rules.push({href:s.href||'inline',selector:sel,css:css.slice(0,1800)})}};walk(rs)
    }
    const ancestry=top.slice(0,12).map(x=>{const chain=[];let el=x.el;for(let i=0;el&&i<10;i++,el=el.parentElement){const r=el.getBoundingClientRect(),c=getComputedStyle(el);chain.push({tag:el.tagName.toLowerCase(),id:el.id||'',className:String(el.className||'').slice(0,180),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),position:c.position,display:c.display,overflowX:c.overflowX,widthCss:c.width,minWidth:c.minWidth,maxWidth:c.maxWidth,transform:c.transform,gridTemplateColumns:c.gridTemplateColumns,flex:c.flex})}return{offender:x.meta,chain}});
    const myShift=Array.from(document.querySelectorAll('a,button')).map(el=>({tag:el.tagName.toLowerCase(),text:String(el.textContent||'').replace(/\s+/g,' ').trim(),href:el instanceof HTMLAnchorElement?el.href:'',ariaLabel:el.getAttribute('aria-label')||''})).filter(x=>/my\s*shift/i.test(`${x.text} ${x.ariaLabel}`)).slice(0,20);
    return{url:location.href,viewport:vw,innerWidth:iw,scrollWidth:sw,overflow:sw-vw,bodyWidth:Math.round(document.body.getBoundingClientRect().width),htmlStyle:{overflowX:getComputedStyle(root).overflowX},bodyStyle:{overflowX:getComputedStyle(document.body).overflowX,margin:getComputedStyle(document.body).margin,padding:getComputedStyle(document.body).padding},stylesheets:Array.from(document.styleSheets).map(s=>s.href||'inline'),offenders:top.map(x=>x.meta),overlays:overlays.slice(0,40),ancestry,matchedRules:rules.slice(0,160),myShift};
  });
  report.cases.push({name,...d});
  if(d.overflow>8)report.failures.push({name,overflow:d.overflow,top:d.offenders.slice(0,12),overlays:d.overlays.slice(0,20),rules:d.matchedRules.slice(0,40),ancestry:d.ancestry.slice(0,8),myShift:d.myShift});
  await p.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true}).catch(e=>report.browserErrors.push({name,stage:'screenshot',error:clean(e.message).slice(0,400)}));
  write();return d;
}

const targets=[['today',/^today$|shift today/i],['grub',/shift grub|\bgrub\b/i],['fit',/shift fit|\bfit\b/i],['progress',/shift progress|\bprogress\b/i],['shift-ai',/shift ai/i]];
const nonce=Date.now();
const users=[{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile390',viewport:{width:390,height:844}}].map(x=>({...x,email:`shiftsometimber+structured-authrender-overflow-${nonce}-${x.name}@gmail.com`}));
await Promise.all(users.map(x=>register(x.email)));
const browser=await chromium.launch({headless:true});
try{
  for(const x of users){
    const c=await browser.newContext({viewport:x.viewport,reducedMotion:'reduce'}),p=await c.newPage();
    try{
      await login(p,x.email,x.name);await p.waitForTimeout(800);await inspect(p,`${x.name}-landing`);
      for(const [key,re] of targets){
        try{await p.goto(`${SITE}/member/dashboard?release=33d#today`,{waitUntil:'networkidle',timeout:45000});await dismissCookie(p);const a=await visible(p,re);if(a){await a.click({timeout:6000});await p.waitForTimeout(800)}else report.navigationErrors.push({name:`${x.name}-${key}`,error:'action not visible from authenticated dashboard'})}catch(e){report.navigationErrors.push({name:`${x.name}-${key}`,error:clean(e.message).slice(0,700)})}
        await inspect(p,`${x.name}-${key}`);
      }
    }catch(e){report.browserErrors.push({name:x.name,stage:'journey',error:clean(e.message).slice(0,900)});write()}finally{await c.close()}
  }
}finally{await browser.close();write()}
console.log(JSON.stringify({proof:report.proof,auth:report.auth,cases:report.cases.map(x=>({name:x.name,url:x.url,overflow:x.overflow,top:x.offenders.slice(0,5),myShift:x.myShift})),failures:report.failures,navigationErrors:report.navigationErrors,browserErrors:report.browserErrors},null,2));
if(!report.failures.length&&report.auth.length===2&&report.auth.every(x=>x.loginStatus===200&&x.memberState?.ok&&x.cookiePresent))console.log('PASS authenticated overflow diagnostic: no horizontal overflow detected');
else console.error(`DIAGNOSTIC complete: ${report.failures.length} overflow cases, ${report.auth.filter(x=>x.memberState?.ok).length}/${report.auth.length} authenticated`);
