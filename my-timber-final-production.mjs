import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {commissioningLogin,memberReady,requireMemberPanel,chooseNecessaryCookies} from './rendered-member-acceptance-support.mjs';

import {verifyLiveTools} from './release/app-member-live.mjs';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.MY_TIMBER_FINAL_EVIDENCE_DIR||'my-timber-final-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});
const password=`Sst-${randomUUID()}-Aa1!`,email=`shiftsometimber+structured-authrender-final-billy-${Date.now()}@gmail.com`;
const report={proof:'MY_TIMBER_FINAL_PRODUCTION_V1',device:{width:390,height:844,label:'Chromium phone viewport (not a Safari device test)'},checks:[],failures:[],networkErrors:[],screens:[],googlePlayScreens:[]};
const resourcePath=value=>{try{const u=new URL(value);return u.origin+u.pathname}catch{return '[no resource URL]'}};
const pass=(name,detail='')=>report.checks.push({name,status:'PASS',detail});
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=My Timber final::${name} — ${detail}`)};
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
async function register(){const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'Billy',source:'commissioning-my-timber-final'})});if(r.status!==201)throw new Error(`register ${r.status} ${await r.text()}`)}
async function login(page){return commissioningLogin(page,{site:SITE,api:API,oidc:OIDC,email,password});}
async function screenshot(page,name){const file=path.join(OUT,`${name}.png`);await page.screenshot({path:file,fullPage:false});report.screens.push(file)}
async function openDetails(page){await chooseNecessaryCookies(page);const d=page.locator('.app-account-details');if(await d.count()&&!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click();await page.locator('#memberDetailsForm').waitFor({state:'visible',timeout:30000});for(const selector of ['#memberEmail','#memberPhone','#memberAddress1','#memberTown','#memberPostcode']){const field=page.locator(selector);for(let attempt=0;attempt<5;attempt++){const closed=field.locator('xpath=ancestor::details[not(@open)]');if(!await closed.count())break;let opened=false;for(let i=0;i<await closed.count();i++){const summary=closed.nth(i).locator(':scope > summary');if(await summary.isVisible()){await summary.click();opened=true;break;}}assert(opened,'Personal/contact section must have a visible disclosure');}assert(await field.isVisible(),'Contact field must be visible: '+selector);}}
async function body(page){return clean(await page.locator('body').innerText())}
async function geometry(page){return page.evaluate(()=>{const root=document.querySelector('#todayActions'),next=document.querySelector('.mt-now'),box=root?.getBoundingClientRect(),nextBox=next?.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,rootTop:Math.round(box?.top||0),rootWidth:Math.round(box?.width||0),nextTop:Math.round(nextBox?.top||0),nextBottom:Math.round(nextBox?.bottom||0),viewport:{width:innerWidth,height:innerHeight},decisionReady:root?.dataset.todayDecisionReady||''}})}

await register();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce',recordVideo:{dir:path.join(OUT,'raw-video'),size:{width:390,height:844}}});
const page=await context.newPage();
try{
  await login(page);
  // PR790: real new fictional-account contact save on production; no customer
  // account or clinical/payment operation. Existing OIDC/registration guard stays.
  await page.goto(SITE+'/member/settings#memberDetailsPanel',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const f=document.querySelector('#memberDetailsFields');return f&&!f.disabled},null,{timeout:30000});await openDetails(page);
  assert.equal(await page.inputValue('#memberEmail'),email);
  assert(await page.locator('#memberEmail').getAttribute('readonly')!==null);
  const contactHeaders={Origin:SITE};
  const priorState=await context.request.get(SITE+'/v1/member-state'),priorConsents=await context.request.get(SITE+'/v1/consents');
  const preservedState=await priorState.json(),preservedConsents=await priorConsents.json();
  await page.fill('#memberAddress1','1 Fictional Release Road');await page.fill('#memberTown','Macclesfield');await page.fill('#memberPostcode','SK10 1AA');await page.fill('#memberPhone','07700 900123');
  await page.locator('#memberDetailsSave').click();await page.getByText('Member details saved.',{exact:true}).waitFor({timeout:30000});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!document.querySelector('#memberDetailsFields')?.disabled,null,{timeout:30000});await openDetails(page);
  assert.equal(await page.inputValue('#memberAddress1'),'1 Fictional Release Road');assert.equal(await page.inputValue('#memberPhone'),'07700 900123');
  const liveDetails=await (await context.request.get(SITE+'/v1/member/details')).json();assert.equal(liveDetails.gpLookupConfigured,true);
  assert.equal(liveDetails.details.address1,'1 Fictional Release Road');
  assert.deepEqual(await (await context.request.get(SITE+'/v1/member-state')).json(),preservedState);assert.deepEqual(await (await context.request.get(SITE+'/v1/consents')).json(),preservedConsents);
  await screenshot(page,'00-member-details-live');
  const logout=await context.request.post(SITE+'/v1/auth/logout',{headers:contactHeaders,data:{}});assert(logout.ok());assert.equal((await context.request.get(SITE+'/v1/member/details')).status(),401);
  await login(page);await page.goto(SITE+'/member/settings#memberDetailsPanel',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!document.querySelector('#memberDetailsFields')?.disabled,null,{timeout:30000});await openDetails(page);assert.equal(await page.inputValue('#memberAddress1'),'1 Fictional Release Road');
  pass('PR790 real fictional-account details persist after reload and fresh login','Manual home address and phone saved; GP lookup configured; email protected; original preferences/consents unchanged.');
  // Leave the signed-out document before attaching strict listeners: Chromium can
  // otherwise deliver its already-buffered, expected /v1/me 401 after login.
  await page.goto('about:blank');
  // The signed-out login page legitimately probes /v1/me and receives 401 before
  // authentication. Start strict browser-error capture only after login succeeds.
  page.on('pageerror',error=>fail('page error',clean(error.message)));
  page.on('response',response=>{if(response.status()>=500){const detail={status:response.status(),url:resourcePath(response.url()),method:response.request().method(),resourceType:response.request().resourceType(),page:resourcePath(page.url())};report.networkErrors.push(detail);console.error('RESOURCE_FAILURE '+JSON.stringify(detail));}});
  page.on('console',message=>{if(message.type()==='error')fail('console error',clean(message.text())+' at '+resourcePath(message.location().url))});
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
  await page.locator('.today-layout').waitFor({state:'visible',timeout:30000});
  await page.locator('.today-meal[data-meal-state="chosen"]').waitFor({state:'visible',timeout:30000});
  assert.equal(clean(await page.locator('.today-meal h3').innerText()),clean(chosen.name),'Rendered Today meal must equal the explicit saved Grub choice');
  assert.equal(await page.locator('#todayBrand .member-design-mark').count(),1);
  assert.equal(await page.locator('#appBottomNav>*').count(),5);
  assert.equal(await page.locator('#sst-footer-c').count(),1);
  assert(!(await page.locator('#todayActions>.mtm-hero').isVisible()),'Retired illustrated hero must not return');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Phone layout has no horizontal overflow');
  await screenshot(page,'01-billy-current-today');
  await page.locator('.today-meal-action').click();
  const mealFrame=page.frameLocator('#appTool-grub iframe');
  await mealFrame.locator('#grubDiscoverResults h3').filter({hasText:chosen.name}).waitFor({state:'visible',timeout:45000});
  assert.equal(new URL(page.url()).pathname,'/member/dashboard','Grub opens in the containing member app');
  assert.deepEqual(await account('/v1/grub/workspace'),chosenWorkspace,'Opening a meal must preserve the saved workspace');
  pass('Approved shared Today shows the explicit saved meal and opens its real inline Grub control',chosen.name);
  await screenshot(page,'02-billy-inline-grub');
  await verifyLiveTools(page,SITE,OUT,report);
  pass('App and website retain tool drafts and browser history, with one navigation, footer and cookie-choice owner','390px and 1440px; visible ordinary controls; no forced DOM or navigation');
  await page.setViewportSize({width:390,height:844});
  const storeDir=path.join(OUT,'google-play');fs.mkdirSync(storeDir,{recursive:true});
  await page.setViewportSize({width:390,height:693});
  async function dismissCookie(){
    const necessary=page.getByRole('button',{name:/Necessary only/i});
    if(await necessary.count()&&await necessary.first().isVisible().catch(()=>false))await necessary.first().click().catch(()=>{});
    await page.waitForTimeout(250);
  }
  async function storeShot(index,slug,label){
    await dismissCookie();await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
    const file=path.join(storeDir,String(index).padStart(2,'0')+'-'+slug+'.png');
    await page.screenshot({path:file,fullPage:false});
    report.googlePlayScreens.push({index,file,label,width:780,height:1386});
  }
  await memberReady(page,{site:SITE});await page.waitForSelector('#todayActions',{state:'visible',timeout:30000});await storeShot(1,'today','Today — one useful next step');
  await requireMemberPanel(page,'journey');await storeShot(2,'journey','Journey — programme progress');
  await requireMemberPanel(page,'visualise');await storeShot(3,'progress','Progress — visualise progress');
  await page.goto(SITE+'/member/check-in',{waitUntil:'domcontentloaded'});await page.locator('main').first().waitFor({state:'visible'});await storeShot(4,'check-in','Check-in — quick member check-in');
  await page.goto(SITE+'/member/grub',{waitUntil:'domcontentloaded'});await page.locator('main').first().waitFor({state:'visible'});await page.waitForTimeout(700);await storeShot(5,'grub','Grub — practical food support');
  await page.goto(SITE+'/member/fit',{waitUntil:'domcontentloaded'});await page.locator('main').first().waitFor({state:'visible'});await page.waitForTimeout(700);await storeShot(6,'fit','Fit — practical movement support');
  await page.goto(SITE+'/member/life-back',{waitUntil:'domcontentloaded'});await page.locator('main').first().waitFor({state:'visible'});await page.waitForTimeout(700);await storeShot(7,'life-back','Life Back — goals and wins');
  await page.goto(SITE+'/member/settings',{waitUntil:'domcontentloaded'});await page.locator('main').first().waitFor({state:'visible'});await page.waitForTimeout(700);await storeShot(8,'settings','Settings — member details and privacy');
  pass('Eight Google Play phone screenshots captured from production My Timber','Synthetic member only; 9:16 portrait UI; no real member data.');
}catch(error){fail('journey exception',clean(error?.message||error).slice(0,1800))}finally{
  const video=page.video();await context.close();if(video)await video.saveAs(path.join(OUT,'my-timber-billy-iphone.webm')).catch(error=>fail('video save',clean(error.message)));await browser.close();write();
}
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`My Timber final production candidate failed ${report.failures.length} check(s)`);
console.log('PASS My Timber final production candidate: authenticated fictional contact save and fresh-login return, explicit published Grub choice, approved shared Today and inline tools, retained drafts and history, one navigation/footer/consent owner, zero phone overflow and eight real production screenshots.');
