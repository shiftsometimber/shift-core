// Real browser save using existing fictional accounts and isolated staging D1.
// API responses are never mocked; production writes are blocked.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';

const origin=process.env.WORK_STAGING_URL;
if(process.env.GITHUB_ACTIONS!=='true'||!/^https:\/\/shift-core-work-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin||''))throw Error('Run only in the isolated hosted staging workflow');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json','utf8'));
assert(fixture.browserIds?.length>=2&&typeof fixture.password==='string','Existing fictional browser fixtures are required');
const out='work/staging/generated/checkin-save-proof';mkdirSync(out,{recursive:true});
const note='walked to the shops';
const clean=value=>String(value).replaceAll(fixture.password,'[redacted]').replace(/(?:probe|hq)\d+@example\.invalid/g,'[fictional account]').slice(0,1200);
const report={checkedAt:new Date().toISOString(),origin,commit:process.env.GITHUB_SHA||null,browser:'Chromium',cases:[],failures:[],limits:[
 'Real isolated staging API and D1 writes using existing fictional accounts; one mobile feedback503 fault injection checks retry; no production member writes',
 'Connected staging uses a same-origin API and does not prove the production cross-origin preflight; the local Worker entry tests and post-deploy raw OPTIONS check verify that separately',
 'Daily check-in snapshots its offered action; the saved feedback is attached to that action without modifying Life Back ratings or history',
 'Desktop and phone viewports in Chromium, not physical Safari or iPhone evidence'
]};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
async function api(context,path,body,expected=200){
 const r=await context.request.fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin},...(body===undefined?{}:{data:body}),timeout:30000});
 assert.equal(r.status(),expected,path+' HTTP status');return r.json();
}
async function screenshot(page,name){
 await page.screenshot({path:out+'/'+name+'.png',fullPage:true,mask:[page.locator('#connected-account')]});
}
const browser=await chromium.launch({headless:true});
try{
 for(const [index,[name,viewport]]of Object.entries({desktop:{width:1440,height:1000},mobile390:{width:390,height:844}}).entries()){
  const row={name,viewport,phase:'login',checks:[],apiRequests:[],blockedExternalWrites:[],pageErrors:[]};report.cases.push(row);
  const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
  let page,injectFeedbackFailure=false;
  try{
   await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==origin&&!['GET','HEAD'].includes(request.method())){row.blockedExternalWrites.push({host:url.host,path:url.pathname,method:request.method()});return route.abort('blockedbyclient')}
    if(injectFeedbackFailure&&url.pathname==='/v1/check-ins/follow-up'&&request.method()==='POST'){injectFeedbackFailure=false;row.feedbackFaultInjected=true;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Temporary test interruption. Try again.'})})}
    return route.continue();
   });
   const id=fixture.browserIds[index];
   await api(context,'/v1/auth/login',{email:'probe'+id+'@example.invalid',password:fixture.password});
   assert.equal(Number((await api(context,'/v1/me')).user.id),id,'Assigned fictional account must be signed in');
   page=await context.newPage();
   page.on('pageerror',error=>row.pageErrors.push(clean(error.message)));
   page.on('response',response=>{const request=response.request(),url=new URL(request.url());if(url.pathname.startsWith('/v1/'))row.apiRequests.push({host:url.host,path:url.pathname,method:request.method(),status:response.status()})});
   row.phase='visible-settings-consent';
   assert.equal((await page.goto(origin+'/member/settings',{waitUntil:'domcontentloaded',timeout:30000})).status(),200);
   const consent=page.locator('#healthConsentManager');
   await page.locator('#healthConsentAction').waitFor({state:'visible',timeout:30000});
   const label=(await page.locator('#healthConsentAction').textContent()).trim();
   if(label==='Review and opt in'){
    await page.locator('#healthConsentAction').click();
    const dialog=page.locator('dialog.health-consent-dialog-v42n[open]');await dialog.waitFor({state:'visible'});
    await dialog.locator('#healthConsentCheck').check();
    const consentResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/consents'&&r.request().method()==='POST',{timeout:30000});
    await dialog.getByRole('button',{name:'Agree & continue',exact:true}).click();
    assert.equal((await consentResponse).status(),201,'Visible consent choice must persist');
    await dialog.waitFor({state:'hidden'});row.enabledConsentThroughUI=true;
   }else{assert.equal(label,'Withdraw consent','Consent control must have a recognised loaded state');row.enabledConsentThroughUI=false}
   await page.waitForFunction(()=>document.querySelector('#healthConsentManager')?.textContent.includes('Optional My Timber health tracking is on.'),null,{timeout:15000});
   const consentRows=(await api(context,'/v1/consents')).consents.filter(c=>c.consent_type==='my_shift_health_tracking').sort((a,b)=>Number(b.id)-Number(a.id));
   assert.equal(Number(consentRows[0]?.granted),1,'Latest server consent must be on');
   await consent.scrollIntoViewIfNeeded();await screenshot(page,'consent-on-'+name);
   row.checks.push('Visible Settings shows tracking on; opt-in is completed through the real dialog only when needed; latest server consent confirms the choice');
   const before=(await api(context,'/v1/check-ins')).checkIns;
   assert(before.length<100,'Fixture history must fit within the endpoint result limit');
   const beforeIds=new Set(before.map(x=>String(x.id))),lifeBackBefore=(await api(context,'/v1/life-back')).progress;
   row.phase='daily-checkin-save';
   assert.equal((await page.goto(origin+'/member/check-in',{waitUntil:'domcontentloaded',timeout:30000})).status(),200);
   await page.waitForFunction(()=>window.SST_API?.saveCheckIn&&window.SST_HEALTH_CONSENT,null,{timeout:15000});
   for(const mood of ['Good','OK','Good','OK']){await page.locator('[data-mood="'+mood+'"]').click();await page.waitForFunction(value=>{const active=[...document.querySelectorAll('[data-mood].active')],pressed=[...document.querySelectorAll('[data-mood][aria-pressed="true"]')];return active.length===1&&pressed.length===1&&active[0].dataset.mood===value&&pressed[0]===active[0]},mood);}
   row.checks.push('Repeated Good/OK switching keeps exactly one visual and accessible choice; final OK is checked against the real saved record');
   await page.locator('#moodNote').fill(note);
   const responsePromise=page.waitForResponse(r=>new URL(r.url()).origin===origin&&new URL(r.url()).pathname==='/v1/check-ins'&&r.request().method()==='POST',{timeout:30000});
   await page.locator('#saveMood').click();
   const response=await responsePromise;row.saveStatus=response.status();
   assert.equal(response.status(),201,'Actual check-in POST must save successfully');
   const saved=await response.json();assert.equal(saved.ok,true);assert.equal(saved.checkIn.mood,'OK');assert.equal(saved.checkIn.note,note);
   const result=page.locator('#checkinResult');await result.waitFor({state:'visible',timeout:30000});
   assert.equal(await result.locator('h2').textContent(),'Middle-of-the-road still counts.');
   const target=new URL(await result.getByRole('link',{name:saved.nextStep.action.label||'Open this next step',exact:true}).getAttribute('href'),origin);
   assert.equal(target.origin,origin);assert.equal(target.pathname.replace('/staging/member-connected/','/member/')+target.hash,saved.nextStep.action.href);
   assert.equal(await result.locator('.checkin-action strong').textContent(),saved.nextStep.action.title);
   assert(await result.getByRole('link',{name:'Back to Today →',exact:true}).isVisible());assert((await result.innerText()).includes('return to Today or reopen Check-in'));
   assert.equal(saved.nextStep.checkInId,saved.checkIn.id);assert.equal(saved.nextStep.feedback,null);
   assert.match(await page.locator('#saveMood').textContent(),/CHECK-IN SAVED/);
   const after=(await api(context,'/v1/check-ins')).checkIns,newRows=after.filter(x=>!beforeIds.has(String(x.id)));
   assert.equal(after.length,before.length+1,'One click adds exactly one saved check-in');assert.equal(newRows.length,1);assert.equal(String(newRows[0].id),String(saved.checkIn.id));assert.equal(newRows[0].mood,'OK');assert.equal(newRows[0].note,note);
   assert.deepEqual((await api(context,'/v1/life-back')).progress,lifeBackBefore,'Daily mood save must preserve the existing Life Back record and Next Shift');
   row.historyCounts={before:before.length,after:after.length};row.nextStepTitle=await result.locator('h2').textContent();row.nextStepTarget=target.pathname+target.hash;
   row.checks.push('OK plus the fictional note saves through real POST201; one record and its exact offered action are stored atomically and shown');
   row.checks.push('Existing Life Back progress and durable Next Shift remain unchanged');
   await result.scrollIntoViewIfNeeded();await screenshot(page,'checkin-saved-'+name);
   row.phase='action-return-feedback';
   await result.getByRole('link',{name:saved.nextStep.action.label||'Open this next step',exact:true}).click();await page.waitForLoadState('domcontentloaded');
   assert.equal(new URL(page.url()).pathname.replace('/staging/member-connected/','/member/'),new URL(saved.nextStep.action.href,origin).pathname);
   assert.equal((await api(context,'/v1/check-ins/follow-up')).followUp.feedback,null,'Opening the action must not count as completion or helpfulness');
   await page.goto(origin+'/member/dashboard#today',{waitUntil:'domcontentloaded'});
   const followup=page.locator('#dailyCheckinFollowup');await followup.getByRole('heading',{name:'Did it help?',exact:true}).waitFor({state:'visible',timeout:30000});
   assert.equal(await followup.locator('strong').textContent(),saved.nextStep.action.title);
   await followup.scrollIntoViewIfNeeded();await screenshot(page,'return-prompt-'+name);
   const outcome=index===0?'helped':'not-fit',feedbackLabel=index===0?'It helped':'It did not fit';
   await followup.getByLabel(feedbackLabel,{exact:true}).check();
   if(index===1){injectFeedbackFailure=true;await followup.getByRole('button',{name:'Save feedback',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#dailyFeedbackStatus')?.textContent.includes('Temporary test interruption'));assert.equal((await api(context,'/v1/check-ins/follow-up')).followUp.feedback,null);assert(await followup.getByRole('button',{name:'Save feedback',exact:true}).isEnabled())}
   const feedbackResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/check-ins/follow-up'&&r.request().method()==='POST');
   await followup.getByRole('button',{name:'Save feedback',exact:true}).click();assert.equal((await feedbackResponse).status(),200);
   await page.waitForFunction(()=>document.querySelector('#dailyFeedbackStatus')?.textContent.startsWith('Feedback saved:'));
   const reviewed=(await api(context,'/v1/check-ins/follow-up')).followUp;assert.equal(reviewed.id,saved.nextStep.id);assert.equal(reviewed.feedback,outcome);assert.equal(reviewed.revision,1);
   await screenshot(page,'feedback-saved-'+name);
   await api(context,'/v1/auth/logout',{});await api(context,'/v1/auth/login',{email:'probe'+id+'@example.invalid',password:fixture.password});
   await page.goto(origin+'/member/dashboard#today',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#dailyFeedbackStatus')?.textContent.startsWith('Feedback saved:'));
   assert.equal(await followup.locator('strong').textContent(),saved.nextStep.action.title);assert((await followup.textContent()).includes(feedbackLabel));
   row.feedback={outcome,revision:reviewed.revision,retainedAfterFreshSignIn:true};row.checks.push('Follow the exact stored action, return to Today, answer did-it-help, and retain the same feedback after fresh sign-in; opening a link does not infer completion');
   await page.goto(origin+'/member/check-in',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#dailyFeedbackStatus')?.textContent.startsWith('Feedback saved:'));
   row.phase='reload-retained-history';
   await page.reload({waitUntil:'domcontentloaded',timeout:30000});
   const history=page.locator('#moodHistory');
   await page.waitForFunction(text=>document.getElementById('moodHistory')?.textContent.includes(text),note,{timeout:30000});
   const disclosure=history.locator('xpath=ancestor::details[1]');
   if(await disclosure.count())if(await disclosure.getAttribute('open')===null)await disclosure.locator(':scope > summary').click();
   const entries=history.locator('.saved-item');assert(await entries.count());assert.match(await entries.first().textContent(),/OK/);assert((await entries.first().textContent()).includes(note));
   const reloaded=(await api(context,'/v1/check-ins')).checkIns;
   assert.equal(reloaded.length,before.length+1);assert(reloaded.some(x=>String(x.id)===String(saved.checkIn.id)&&x.mood==='OK'&&x.note===note));
   assert.deepEqual((await api(context,'/v1/life-back')).progress,lifeBackBefore);
   row.checks.push('Reloaded history and fresh API read retain the same saved mood and note without creating another record');
   await history.scrollIntoViewIfNeeded();await screenshot(page,'checkin-reloaded-'+name);
   row.layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));assert(row.layout.overflow<=1,'Check-in page must fit the viewport');
   assert.deepEqual(row.blockedExternalWrites,[]);assert.deepEqual(row.pageErrors,[]);row.phase='complete';row.passed=true;
  }catch(error){row.failure=clean(error.stack||error);report.failures.push({name,phase:row.phase,error:row.failure});if(page)await screenshot(page,'failure-'+name).catch(()=>{})}
  finally{await context.request.post(origin+'/v1/auth/logout',{headers:{Origin:origin},data:{}}).catch(()=>{});await context.close();save()}
 }
}finally{await browser.close();report.status=report.failures.length?'fail':'pass';save()}
assert.equal(report.failures.length,0,'Isolated rendered check-in save proof failed; see sanitized report');
console.log('PASS: fictional check-in, exact saved action, return prompt, did-it-help persistence, fresh sign-in, failure/retry and Life Back preservation on desktop/mobile.');
