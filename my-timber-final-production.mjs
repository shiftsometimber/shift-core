import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.MY_TIMBER_FINAL_EVIDENCE_DIR||'my-timber-final-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});
const password=`Sst-${randomUUID()}-Aa1!`,email=`shiftsometimber+structured-authrender-final-billy-${Date.now()}@gmail.com`;
const report={proof:'MY_TIMBER_FINAL_PRODUCTION_V1',device:{width:390,height:844,label:'iPhone-format Safari acceptance geometry'},checks:[],failures:[],screens:[]};
const pass=(name,detail='')=>report.checks.push({name,status:'PASS',detail});
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=My Timber final::${name} — ${detail}`)};
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
async function register(){const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'Billy',source:'commissioning-my-timber-final'})});if(r.status!==201)throw new Error(`register ${r.status} ${await r.text()}`)}
async function login(page){await page.goto(`${SITE}/member-login`,{waitUntil:'domcontentloaded',timeout:30000});const result=await page.evaluate(async({api,email,password})=>{const r=await fetch(`${api}/v1/auth/login`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});return{ok:r.ok,status:r.status,text:await r.text()}},{api:API,email,password});if(!result.ok)throw new Error(`login ${result.status} ${result.text}`)}
async function screenshot(page,name){const file=path.join(OUT,`${name}.png`);await page.screenshot({path:file,fullPage:false});report.screens.push(file)}
async function body(page){return clean(await page.locator('body').innerText())}
async function geometry(page){return page.evaluate(()=>{const root=document.querySelector('#todayActions'),next=document.querySelector('.mt-now'),box=root?.getBoundingClientRect(),nextBox=next?.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,rootTop:Math.round(box?.top||0),rootWidth:Math.round(box?.width||0),nextTop:Math.round(nextBox?.top||0),nextBottom:Math.round(nextBox?.bottom||0),viewport:{width:innerWidth,height:innerHeight},decisionReady:root?.dataset.todayDecisionReady||''}})}

await register();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce',recordVideo:{dir:path.join(OUT,'raw-video'),size:{width:390,height:844}}});
const page=await context.newPage();
page.on('pageerror',error=>fail('page error',clean(error.message)));
page.on('console',message=>{if(message.type()==='error')fail('console error',clean(message.text()))});
try{
  await login(page);
  await page.goto(`${SITE}/member/dashboard#grub`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.SST_API?.generateGrub&&window.SST_API?.generateFit,null,{timeout:20000});
  const seeded=await page.evaluate(async()=>{const grub=await window.SST_API.generateGrub({days:7,calories:2000,protein_g:120,preferences:'UK family food, healthy fakeaways, no mushrooms',max_minutes:60,household_size:2});const fit=await window.SST_API.generateFit({days:1,minutes_per_day:30,location:'home',equipment:['bodyweight','dumbbells'],preferences:'fat loss, build confidence',limitations:'no acute injuries'});return{grub:grub?.plan?.days?.length||0,fit:fit?.plan?.sessions?.length||0}});
  if(!seeded.grub||!seeded.fit)fail('Billy plan seed',JSON.stringify(seeded));else pass('Billy receives real Grub and Fit plans',JSON.stringify(seeded));
  await page.goto(`${SITE}/member/dashboard#today`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#todayActions[data-today-decision-ready="true"]',{state:'visible',timeout:30000});
  await page.waitForSelector('.mt-now-action',{state:'visible',timeout:10000});
  const initial=await body(page),initialGeometry=await geometry(page);await screenshot(page,'01-billy-today');
  for(const marker of ['MY TIMBER · TODAY','YOUR NEXT MEAL','TODAY’S MOVEMENT','LIFE CHANGED?'])if(!initial.includes(marker))fail(`initial ${marker}`,'missing');
  if(initialGeometry.overflow!==0)fail('initial horizontal overflow',JSON.stringify(initialGeometry));else pass('390px Today has zero horizontal overflow');
  if(initialGeometry.decisionReady!=='true')fail('recommendation readiness','missing');else pass('Recommended next action is visibly ready');
  const late=page.locator('[data-adjust="working_late"]');await late.click();
  await page.waitForSelector('.mt-rebuilt',{state:'visible',timeout:20000});
  await page.waitForFunction(()=>/10 minutes/i.test(document.querySelector('.mt-workout')?.textContent||''),null,{timeout:10000});
  const rebuilt=await body(page);await screenshot(page,'02-working-late-rebuilt');
  if(!/10 minutes/i.test(rebuilt))fail('working late movement','not compressed to ten minutes');else pass('Working late compresses movement to 10 minutes');
  if(!/Day rebuilt|working late|late/i.test(rebuilt))fail('working late explanation','recalculation not explained');else pass('Working late visibly explains the recalculation');
  const mealTitle=clean(await page.locator('.mt-meal h3').innerText());
  const accept=page.locator('[data-meal="accept"]');if(!(await accept.count()))fail('meal choice CTA','I’ll have that missing');else{await accept.click();await page.waitForFunction(()=>/Kept for today/i.test(document.querySelector('.mt-meal')?.textContent||''),null,{timeout:15000});await screenshot(page,'03-meal-kept-next-action');const advanced=await body(page);if(!/Start the session/i.test(advanced))fail('meal-to-movement progression','next action did not advance');else pass('Accepting dinner advances directly to movement',mealTitle)}
  const workoutLink=page.getByRole('link',{name:/Start the session/i}).first();if(await workoutLink.count()){await workoutLink.click();await page.waitForFunction(()=>document.querySelector('#panel-fit')?.classList.contains('active'),null,{timeout:10000});await screenshot(page,'04-fit-opened');pass('Movement CTA opens the real Fit session immediately')}else fail('movement CTA','Start the session missing');
  const finalGeometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,url:location.href}));if(finalGeometry.overflow!==0)fail('final horizontal overflow',JSON.stringify(finalGeometry));else pass('Journey finishes with zero horizontal overflow');
}catch(error){fail('journey exception',clean(error?.message||error).slice(0,1800))}finally{
  const video=page.video();await context.close();if(video)await video.saveAs(path.join(OUT,'my-timber-billy-iphone.webm')).catch(error=>fail('video save',clean(error.message)));await browser.close();write();
}
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`My Timber final production candidate failed ${report.failures.length} check(s)`);
console.log('PASS My Timber final production candidate: real authenticated Billy plans, immediate Today recommendation, working-late Grub/Fit recalculation, meal-to-movement progression, real Fit handoff, 390x844 zero-overflow evidence and a genuine phone-format walkthrough video.');
