import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OUT=process.env.STATE_EVIDENCE_DIR||'state-system-evidence';
const password='Shift-Commissioning-2026!';
const nonce=`statev2-${Date.now()}`;
const report={proof:'G1_008_REAL_SESSION_RENDERED_STATE_SYSTEM_V1',registrations:[],cases:[],failures:[]};
fs.mkdirSync(OUT,{recursive:true});
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=G1-008 state system::${name} — ${detail}`)};
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function bodyText(page){return clean(await page.locator('body').innerText().catch(()=>''))}
async function clickCookieChoice(page){for(const re of [/necessary only/i,/accept analytics/i,/accept all/i]){const x=page.getByRole('button',{name:re}).first();if(await x.count()&&await x.isVisible().catch(()=>false)){await x.click().catch(()=>{});return}}}
async function action(page,re){for(const x of [page.getByRole('button',{name:re}).first(),page.getByRole('link',{name:re}).first(),page.getByText(re).first()])if(await x.count()&&await x.isVisible().catch(()=>false))return x;return null}
async function shell(page,name){const text=await bodyText(page);const g=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));if(text.length<80)fail(name,'near-blank rendered state');if(/internal server error|sqlite|stack trace|sql error/i.test(text))fail(name,'internal diagnostics exposed');if(g.scrollWidth>g.clientWidth)fail(name,`root overflow ${g.scrollWidth-g.clientWidth}px`);return{textChars:text.length,rootOverflow:g.scrollWidth-g.clientWidth}}
async function register(context,email,id){const r=await context.request.post(`${API}/v1/auth/register`,{headers:{Origin:SITE},data:{email,password,firstName:'Dave',source:'commissioning-state-v2'}});let data={};try{data=await r.json()}catch{}const row={name:id,status:r.status(),ok:r.status()===201,verificationRequired:data?.verificationRequired??null,emailVerified:data?.emailVerified??null};report.registrations.push(row);if(!row.ok)fail(`${id}-register`,`HTTP ${r.status()} ${clean(JSON.stringify(data)).slice(0,300)}`);return row.ok}
async function open(page,hash){await page.goto(`${SITE}/member/dashboard?states=${Date.now()}#${hash}`,{waitUntil:'networkidle',timeout:45000});await clickCookieChoice(page);await page.waitForTimeout(300)}
async function emptyStates(page,id){const states=[['grub','grub',/ready when you are/i],['fit','fit',/ready when you are/i],['progress','progress',/\bchoose\b.{0,1200}\bto begin\b/i],['plans','plans',/these are the plans shift ai sees when helping you/i]];for(const [key,hash,re] of states){await open(page,hash);const text=await bodyText(page);const matched=text.match(re);const sh=await shell(page,`${id}-empty-${key}`);if(!matched)fail(`${id}-empty-${key}`,`explicit fresh-member state missing; sample ${text.slice(0,1400)}`);report.cases.push({name:`${id}-empty-${key}`,kind:'empty',found:!!matched,matchedText:matched?.[0]||null,...sh});await page.screenshot({path:path.join(OUT,`${id}-empty-${key}.png`),fullPage:true}).catch(()=>{})}}
async function loadingSuccess(page,id,key,hash,buttonRe){await open(page,hash);const button=await action(page,buttonRe);if(!button){fail(`${id}-${key}-action`,'build action missing');return}const before=await bodyText(page);let delayed=0,resolveDelayed;const delayedDone=new Promise(r=>resolveDelayed=r);const handler=async route=>{const request=route.request();const shouldDelay=request.method()==='POST'&&!request.url().includes('/v1/auth/')&&delayed===0;if(shouldDelay){delayed++;await wait(1600)}try{await route.continue()}finally{if(shouldDelay)resolveDelayed()}};await page.route(`${API}/**`,handler);const click=button.click({timeout:10000}).catch(e=>fail(`${id}-${key}-click`,clean(e.message).slice(0,300)));await page.waitForTimeout(350);const during=await bodyText(page);const disabled=await button.isDisabled().catch(()=>false);const loadingFeedback=during!==before||disabled;if(!loadingFeedback)fail(`${id}-${key}-loading`,'no visible or disabled loading feedback');await click;if(delayed)await Promise.race([delayedDone,wait(3500)]);await page.unroute(`${API}/**`,handler);await page.waitForTimeout(3000);const after=await bodyText(page);const success=after!==before&&!/quality_gate_failed|internal server error/i.test(after);if(!success)fail(`${id}-${key}-success`,`no distinct safe success state; sample ${after.slice(0,900)}`);const sh=await shell(page,`${id}-${key}-success`);report.cases.push({name:`${id}-${key}`,kind:'loading-success',delayedRequests:delayed,loadingFeedback,success,...sh});await page.screenshot({path:path.join(OUT,`${id}-${key}-success.png`),fullPage:true}).catch(()=>{})}

const browser=await chromium.launch({headless:true});
try{
  for(const [id,viewport] of Object.entries({desktop:{width:1440,height:900},mobile390:{width:390,height:844}})){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});
    const email=`shiftsometimber+${nonce}-${id}@gmail.com`;
    if(await register(context,email,id)){
      const page=await context.newPage();
      await emptyStates(page,id);
      await loadingSuccess(page,id,'grub','grub',/build my menu/i);
      await loadingSuccess(page,id,'fit','fit',/build my session/i);
    }
    await context.close();write();
  }
} finally { await browser.close() }
write();console.log(JSON.stringify(report,null,2));if(report.failures.length)throw new Error(`G1-008 state-system acceptance failed ${report.failures.length}`);console.log('PASS G1-008 real-session empty/loading/success states at desktop + 390px.');
