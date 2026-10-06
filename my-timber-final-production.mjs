import {chromium} from 'playwright';
import {boundedEvidence,attachDiagnostics} from './health-passport/acceptance-diagnostics.mjs';
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
const pass=(name,detail='')=>{report.checks.push({name,status:'PASS',detail});console.log('PASS '+name)};
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
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'allow',recordVideo:{dir:path.join(OUT,'raw-video'),size:{width:390,height:844}}});
await context.addInitScript(()=>{
 window.__earlyTrace=[];const keep=(kind,detail)=>{window.__earlyTrace.push({kind,detail,at:performance.now()});if(window.__earlyTrace.length>120)window.__earlyTrace.shift()};
 for(const method of ['pushState','replaceState']){const orig=history[method];history[method]=function(...args){keep(method,{url:String(args[2]),stack:new Error().stack});return orig.apply(this,args)}}
 const orig=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(type,listener,options){if(type==='click'&&typeof listener==='function'){const stack=new Error().stack;const wrapped=function(e){const a=e.target.closest?.('.today-meal-action');if(a)keep('handler',{stack,href:a.getAttribute('href'),phase:e.eventPhase,prevented:e.defaultPrevented});return listener.call(this,e)};return orig.call(this,type,wrapped,options)}return orig.call(this,type,listener,options)};
 window.addEventListener('error',e=>keep('error',{message:e.message,filename:e.filename,lineno:e.lineno}));
});
const page=await context.newPage();
report.proof='MY_TIMBER_GRUB_HISTORY_FIRST_ACTIVE_WORKER_V1';

report.frameLifecycle=[];const cdp=await context.newCDPSession(page);await cdp.send('Page.enable');for(const kind of ['frameAttached','frameDetached','frameStartedLoading','frameStoppedLoading','frameRequestedNavigation','frameNavigated'])cdp.on('Page.'+kind,event=>{const x={kind,frame:event.frameId||event.frame?.id,reason:event.reason,url:event.url?resourcePath(event.url):event.frame?.url?resourcePath(event.frame.url):null};report.frameLifecycle.push(x);if(report.frameLifecycle.length>80)report.frameLifecycle.shift()});
page.on('console',m=>{if(m.type()==='error'){report.frameLifecycle.push({kind:'console-error',detail:m.text().slice(0,500)});if(report.frameLifecycle.length>80)report.frameLifecycle.shift()}});

const navigation=attachDiagnostics(page,report,write);
const watchdog=setTimeout(()=>{fail('verification termination','Browser verification did not terminate within eight minutes');write();process.exit(1)},480000);watchdog.unref();
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
  assert.equal(await page.locator('.today-meal').getAttribute('data-recipe-id'),chosen.id,'Today must render the exact explicitly saved recipe');assert((await page.locator('.today-meal-meta').innerText()).includes(chosen.name),'The actual chosen recipe name must be visible in the meal card');
  assert.equal(await page.locator('#todayBrand .member-design-mark').count(),1);
  assert.equal(await page.locator('#appBottomNav>*').count(),5);
  assert.equal(await page.locator('#sst-footer-c').count(),1);
  assert.equal(await page.locator('#todayActions>.mtm-hero img').filter({visible:true}).count(),0,'Today must not show the retired pub photograph');assert.equal(await page.locator('#todayActions>.mtm-hero').evaluate(e=>getComputedStyle(e).backgroundImage),'none','Today heading must have no repeated background photograph');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Phone layout has no horizontal overflow');
  await screenshot(page,'01-billy-current-today');
  await page.evaluate(()=>{window.__toolTrace=[];const keep=(kind,detail)=>{window.__toolTrace.push({kind,detail,at:performance.now()});if(window.__toolTrace.length>80)window.__toolTrace.shift()};new MutationObserver(records=>{for(const r of records){for(const n of r.removedNodes)if(n.nodeType===1&&(n.matches('iframe,#appToolPanels,#appTool-grub')||n.querySelector('iframe')))keep('removed',n.outerHTML.slice(0,1400));for(const n of r.addedNodes)if(n.nodeType===1&&(n.matches('iframe,#appToolPanels,#appTool-grub')||n.querySelector('iframe')))keep('added',n.outerHTML.slice(0,1400))}}).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{const n=e.target.closest('a');if(n)keep('click',{href:n.getAttribute('href'),prevented:e.defaultPrevented,tool:document.body.dataset.appTool})});});

  const workers=context.serviceWorkers().filter(w=>w.url().endsWith('/shift-push-sw-v1.js'));assert(workers.length,'Expected original installed worker');
  for(const worker of workers)await worker.evaluate(({block})=>{
    self.__patchLog=[];
    self.addEventListener('fetch',event=>{
      const u=new URL(event.request.url);
      if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname!=='/assets/my-timber-layout.mjs')return;
      event.respondWith((async()=>{
        const r=await fetch(event.request),original=await r.text();
        if(original.split(block).length-1!==1)throw Error('Exact original select history block required');
        const changed=original.replace(block,'').replace("host.hidden=key==='today';",block+"host.hidden=key==='today';");
        self.__patchLog.push({historyIndex:changed.indexOf(block),frameIndex:changed.indexOf("host.hidden=key==='today';")});
        const headers=new Headers(r.headers);headers.delete('Content-Length');headers.delete('Content-Encoding');headers.set('Cache-Control','no-store');return new Response(changed,{status:r.status,headers});
      })());
    });
  },{block:"if(push){const u=new URL(location.href);if(key==='today')u.searchParams.delete('tool');else u.searchParams.set('tool',key);u.hash='today';history.pushState(null,'',u)}"});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.today-meal-action').waitFor({state:'visible',timeout:45000});
  report.patchResponses=[];for(const worker of workers)report.patchResponses.push(...await worker.evaluate(()=>self.__patchLog||[]));
  assert(report.patchResponses.length&&report.patchResponses.every(r=>r.historyIndex<r.frameIndex),'Prove history-first asset served by active worker');
  await page.locator('.today-meal-action').click();
  const mealFrame=page.frameLocator('#appTool-grub iframe');
  await mealFrame.getByText(chosen.name,{exact:true}).filter({visible:true}).first().waitFor({state:'visible',timeout:45000});
  assert.equal(new URL(page.url()).pathname,'/member/dashboard','Grub opens in the containing member app');
  assert.deepEqual(await account('/v1/grub/workspace'),chosenWorkspace,'Opening a meal must preserve the saved workspace');
  pass('Approved shared Today shows the explicit saved meal and opens its real inline Grub control',chosen.name);
}catch(error){report.toolTrace=await page.evaluate(()=>({early:window.__earlyTrace||[],trace:window.__toolTrace||[],tool:document.body.dataset.appTool,host:document.querySelector('#appToolPanels')?.outerHTML?.slice(0,2500),ready:document.readyState,frameDocuments:[...document.querySelectorAll('iframe')].map(f=>({src:f.getAttribute('src'),win:Boolean(f.contentWindow),doc:Boolean(f.contentDocument),url:(()=>{try{return f.contentWindow?.location.href}catch{return '[cross-origin]'}})(),html:f.contentDocument?.documentElement?.outerHTML.slice(0,1500)}))})).catch(()=>null);fail('journey exception',clean(error?.message||error).slice(0,1800));report.navigation=navigation();write();await boundedEvidence('failure screenshot',()=>page.screenshot({path:path.join(OUT,'journey-failure.png'),fullPage:false,timeout:10000}),11000).catch(error=>{(report.evidenceWarnings??=[]).push(error.message);write()})}finally{
  const video=page.video();write();await boundedEvidence('context close',()=>context.close(),15000).catch(error=>fail('context close',clean(error.message)));if(video)await boundedEvidence('video save',()=>video.saveAs(path.join(OUT,'my-timber-billy-iphone.webm')),15000).catch(error=>fail('video save',clean(error.message)));await boundedEvidence('browser close',()=>browser.close(),10000).catch(error=>fail('browser close',clean(error.message)));write();clearTimeout(watchdog);setTimeout(()=>process.exit(report.failures.length?1:0),1000).unref();
}
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`My Timber final production candidate failed ${report.failures.length} check(s)`);
console.log('PASS My Timber final production candidate: authenticated fictional contact save and fresh-login return, explicit published Grub choice, approved shared Today and inline tools, retained drafts and history, one navigation/footer/consent owner, zero phone overflow and eight real production screenshots.');
