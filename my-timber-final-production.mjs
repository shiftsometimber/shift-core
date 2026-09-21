import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {commissioningLogin,memberReady} from './rendered-member-acceptance-support.mjs';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.MY_TIMBER_FINAL_EVIDENCE_DIR||'my-timber-final-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});
const password=`Sst-${randomUUID()}-Aa1!`,email=`shiftsometimber+structured-authrender-final-billy-${Date.now()}@gmail.com`;
const report={proof:'MY_TIMBER_FINAL_PRODUCTION_V1',device:{width:390,height:844,label:'Chromium phone viewport (not a Safari device test)'},checks:[],failures:[],screens:[]};
const pass=(name,detail='')=>report.checks.push({name,status:'PASS',detail});
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=My Timber final::${name} — ${detail}`)};
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
async function register(){const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'Billy',source:'commissioning-my-timber-final'})});if(r.status!==201)throw new Error(`register ${r.status} ${await r.text()}`)}
async function login(page){return commissioningLogin(page,{site:SITE,api:API,oidc:OIDC,email,password});}
async function screenshot(page,name){const file=path.join(OUT,`${name}.png`);await page.screenshot({path:file,fullPage:false});report.screens.push(file)}
async function body(page){return clean(await page.locator('body').innerText())}
async function geometry(page){return page.evaluate(()=>{const root=document.querySelector('#todayActions'),next=document.querySelector('.mt-now'),box=root?.getBoundingClientRect(),nextBox=next?.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,rootTop:Math.round(box?.top||0),rootWidth:Math.round(box?.width||0),nextTop:Math.round(nextBox?.top||0),nextBottom:Math.round(nextBox?.bottom||0),viewport:{width:innerWidth,height:innerHeight},decisionReady:root?.dataset.todayDecisionReady||''}})}

await register();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce',recordVideo:{dir:path.join(OUT,'raw-video'),size:{width:390,height:844}}});
const page=await context.newPage();
try{
  await login(page);
  // Leave the signed-out document before attaching strict listeners: Chromium can
  // otherwise deliver its already-buffered, expected /v1/me 401 after login.
  await page.goto('about:blank');
  // The signed-out login page legitimately probes /v1/me and receives 401 before
  // authentication. Start strict browser-error capture only after login succeeds.
  page.on('pageerror',error=>fail('page error',clean(error.message)));
  page.on('console',message=>{if(message.type()==='error')fail('console error',clean(message.text()))});
  const todayHeaders={Origin:SITE,'X-Shift-Local-Date':new Date().toISOString().slice(0,10),'X-Shift-Local-Hour':'18'};
  const grubResponse=await context.request.post(`${API}/v1/grub/plan`,{headers:todayHeaders,data:{days:7,calories:2000,protein_g:120,preferences:'UK family food, healthy fakeaways, no mushrooms',max_minutes:60,household_size:2}}),grub=await grubResponse.json().catch(()=>({}));
  if(!grubResponse.ok())throw new Error(`Grub seed ${grubResponse.status()} ${JSON.stringify(grub)}`);
  const fitResponse=await context.request.post(`${API}/v1/fit/plan`,{headers:todayHeaders,data:{days:1,minutes_per_day:30,location:'home',equipment:['bodyweight','dumbbells'],preferences:'fat loss, build confidence',limitations:'no acute injuries'}}),fit=await fitResponse.json().catch(()=>({}));
  if(!fitResponse.ok())throw new Error(`Fit seed ${fitResponse.status()} ${JSON.stringify(fit)}`);
  const seeded={grub:grub?.plan?.days?.length||0,fit:fit?.plan?.sessions?.length||0};
  if(!seeded.grub||!seeded.fit)fail('Billy plan seed',JSON.stringify(seeded));else pass('Billy receives real Grub and Fit plans',JSON.stringify(seeded));
  // Connected Grub writes use the page origin, as the actual member app does.
  // Keep its same-origin guard and the server-issued shared-domain cookie intact.
  async function account(path,data){const response=await context.request.fetch(`${SITE}${path}`,{method:data===undefined?'GET':'POST',headers:todayHeaders,...(data===undefined?{}:{data})});const result=await response.json().catch(()=>null);assert(response.ok(),`${path}: HTTP ${response.status()}`);assert(result,`${path}: missing JSON response`);return result}
  // The connected master takes an explicit published meal from Grub. It does
  // not show the retired one-click acceptance of a generated legacy meal.
  const workspace=await account('/v1/grub/workspace'),recipes=await account('/v1/grub/search',{mode:'discover',query:'chicken'}),chosen=recipes.top?.[0];
  assert.equal(typeof chosen?.id,'string','Published recipe ID missing');assert.equal(typeof chosen?.name,'string','Published recipe name missing');assert(chosen.name.length>0);
  await account('/v1/grub/workspace',{action:'choose-today',recipeId:chosen.id,revision:workspace.revision,operationId:randomUUID()});
  const chosenWorkspace=await account('/v1/grub/workspace'),dailyBefore=(await account('/v1/shift/daily-plan')).daily;
  assert.equal(dailyBefore?.connected?.meal?.recipeId,chosen.id,'Today must use the explicit Grub choice');
  assert(dailyBefore.daily_output?.workout?.minutes>10,'Seeded Fit plan must provide a real longer session before adjustment');
  pass('Explicit published Grub choice feeds the connected day',chosen.name);
  await memberReady(page,{site:SITE});
  await page.waitForFunction(()=>document.querySelector('#panel-today')?.classList.contains('active'),null,{timeout:10000});
  await page.waitForSelector('#todayActions[data-today-decision-ready="true"]',{state:'visible',timeout:30000});
  await page.waitForSelector('.mt-now-action',{state:'visible',timeout:10000});
  const more=page.locator('#more-for-today');
  await more.locator(':scope > summary').click();
  await page.locator('.mt-meal').waitFor({state:'visible'});
  const initial=await body(page),initialGeometry=await geometry(page);await screenshot(page,'01-billy-today');
  for(const marker of ['MY TIMBER','NEXT · FOOD','LATER · MOVEMENT','Life changed?'])if(!initial.includes(marker))fail(`initial ${marker}`,'missing');
  if(!(await page.locator('.mtm-hero').isVisible()))fail('approved My Timber home','Current illustrated home header is missing');else pass('Approved My Timber home is preserved');
  if(initialGeometry.overflow!==0)fail('initial horizontal overflow',JSON.stringify(initialGeometry));else pass('390px Today has zero horizontal overflow');
  if(initialGeometry.decisionReady!=='true')fail('recommendation readiness','missing');else pass('Recommended next action is visibly ready');
  assert.equal(clean(await page.locator('.mt-meal h3').innerText()),clean(chosen.name),'Rendered Today meal differs from the saved Grub choice');
  assert.match(await page.locator('.mt-meal').innerText(),/Kept for today/);
  await page.locator('[data-life-changed]').click();
  const late=page.locator('[data-adjust="working_late"]');await late.waitFor({state:'visible',timeout:10000});await late.click();
  await page.waitForSelector('.mtm-announcement[role="status"]',{state:'visible',timeout:20000});
  // Rebuilding Today creates a fresh collapsed disclosure. Open it through
  // its visible control before asserting the rendered meal and movement.
  if(await more.getAttribute('open')===null)await more.locator(':scope > summary').click();
  await page.locator('.mt-workout').waitFor({state:'visible',timeout:10000});
  await page.waitForFunction(()=>/10 minutes/i.test(document.querySelector('.mt-workout')?.textContent||''),null,{timeout:10000});
  const rebuilt=await body(page);await screenshot(page,'02-working-late-rebuilt');
  if(!/10 minutes/i.test(rebuilt))fail('working late movement','not compressed to ten minutes');else pass('Working late compresses movement to 10 minutes');
  const announcement=clean(await page.locator('.mtm-announcement').innerText());
  assert.match(announcement,/Your change is saved/);assert.match(announcement,/Review movement/);assert.match(announcement,/choose any different meal in Grub/);
  pass('Working late explains movement adjustment and preserves member meal control',announcement);
  const dailyAfter=(await account('/v1/shift/daily-plan')).daily;
  assert.equal(dailyAfter.daily_output?.adjustment,'working_late');assert.equal(dailyAfter.daily_output?.workout?.minutes,10);
  assert.equal(dailyAfter.connected?.meal?.recipeId,chosen.id,'Working late replaced the explicitly chosen meal');
  assert.deepEqual(await account('/v1/grub/workspace'),chosenWorkspace,'Working late changed the saved Grub workspace');
  assert.equal(clean(await page.locator('.mt-meal h3').innerText()),clean(chosen.name));assert.match(await page.locator('.mt-meal').innerText(),/Kept for today/);
  await screenshot(page,'03-meal-preserved-next-action');pass('Saved meal stays unchanged while the movement recommendation becomes ten minutes',chosen.name);
  const savedFitBefore=await account('/v1/fit/activity');
  assert.equal(savedFitBefore.plan?.minutes_per_day,30,'The original saved Fit plan must remain 30 minutes before the member chooses to replace it');
  const workoutLink=page.locator('.mt-workout [data-fit-today-handoff]');
  assert.equal(await workoutLink.count(),1,'The shorter movement suggestion needs a clear Fit handoff');
  assert.match(await workoutLink.innerText(),/Review shorter session/);
  await workoutLink.click();
  await page.waitForURL('**/member/fit?from=today&minutes=10',{timeout:15000});
  await page.waitForSelector('.fit-experience-v1',{state:'visible',timeout:20000});
  await page.waitForSelector('#fitTodayHandoff[data-fit-today-minutes="10"]',{state:'visible',timeout:20000});
  const savedSession=savedFitBefore.plan.sessions[0],savedSessionMinutes=Number(savedSession.estimated_minutes||savedSession.requested_minutes||savedFitBefore.plan.minutes_per_day);
  assert.ok(Number.isFinite(savedSessionMinutes)&&savedSessionMinutes>0,'Saved session must have an actual duration');
  await page.waitForFunction(minutes=>(document.querySelector('#fitTodayHandoff')?.textContent||'').includes(`Your saved ${minutes}-minute session below is unchanged.`),savedSessionMinutes,{timeout:20000});
  assert.equal(await page.locator('#fitMinutes').inputValue(),'10');
  assert.equal(await page.locator('#fitDays').inputValue(),'1');
  assert.deepEqual((await account('/v1/fit/activity')).plan,savedFitBefore.plan,'Opening the shorter-session suggestion changed the saved Fit plan');
  await page.waitForFunction(()=>{const img=document.querySelector('#fitOutput .sf-session .sf-exercise img');return img?.complete&&img.naturalWidth>0},null,{timeout:20000});
  await screenshot(page,'04-fit-suggestion-saved-plan-preserved');
  pass('Fit opens with the 10-minute suggestion and the actual saved session explicitly unchanged');
  await page.locator('#fitGenerate').click();
  await page.waitForFunction(()=>/Your plan is ready/.test(document.querySelector('#fitStatus')?.textContent||'')&&!document.querySelector('#fitGenerate')?.disabled,null,{timeout:60000});
  const savedFitAfter=await account('/v1/fit/activity');
  assert.equal(savedFitAfter.plan?.minutes_per_day,10,'Explicit build did not save the requested shorter plan');
  assert.equal(savedFitAfter.plan?.sessions?.length,1);
  assert.equal(await page.locator('#fitTodayHandoff').count(),0,'Completed suggestion should leave the normal Fit session');
  await page.waitForFunction(()=>{const img=document.querySelector('#fitOutput .sf-session .sf-exercise img');return img?.complete&&img.naturalWidth>0},null,{timeout:20000});
  assert.deepEqual(await account('/v1/grub/workspace'),chosenWorkspace,'Building the shorter Fit session changed the chosen Grub meal');
  await screenshot(page,'05-shorter-fit-built');pass('Member explicitly builds the 10-minute Fit session with its image and chosen meal preserved');
  const finalGeometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,url:location.href}));if(finalGeometry.overflow!==0)fail('final horizontal overflow',JSON.stringify(finalGeometry));else pass('Journey finishes with zero horizontal overflow');
}catch(error){fail('journey exception',clean(error?.message||error).slice(0,1800))}finally{
  const video=page.video();await context.close();if(video)await video.saveAs(path.join(OUT,'my-timber-billy-iphone.webm')).catch(error=>fail('video save',clean(error.message)));await browser.close();write();
}
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`My Timber final production candidate failed ${report.failures.length} check(s)`);
console.log('PASS My Timber final production candidate: real authenticated Billy plans, explicit published Grub choice, connected Today, working-late movement adjustment with the chosen meal preserved, real Fit handoff, 390x844 zero-overflow evidence and a genuine phone-format walkthrough video.');
