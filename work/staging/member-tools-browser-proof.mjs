// Hosted Playwright proof against the separate Worker and fictional D1 accounts.
// No mocks, production host, OIDC override, member records or real photographs.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {join} from 'node:path';
const origin=process.env.WORK_STAGING_URL;
if(process.env.GITHUB_ACTIONS!=='true'||!/^https:\/\/shift-core-work-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin||''))throw Error('Run only in the isolated hosted staging workflow');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json'));
assert.equal(fixture.browserIds?.length,4,'Four separate browser-only fictional accounts are required');
const out='work/staging/generated/member-tools-proof';mkdirSync(out,{recursive:true});
const report={checkedAt:new Date().toISOString(),origin,commit:process.env.GITHUB_SHA||null,browser:'Chromium',sourceHashes:{},cases:[],failures:[],limits:['Fictional @example.invalid accounts on the existing separate staging databases','No production sign-in, real member data or real photographs','No AI photo generation or clinical-service commissioning claim']};
const clean=s=>String(s).replaceAll(fixture.password,'[redacted]').replace(/(?:probe|hq)\d+@example\.invalid/g,'[fictional account]').slice(0,1500);
const save=()=>writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGMsKE9iIAUwkaR6VMOohiGlAQAhWAFpdf7BsgAAAABJRU5ErkJggg==','base64');
async function api(context,path,body,method=body===undefined?'GET':'POST'){
 const r=await context.request.fetch(origin+path,{method,headers:{Origin:origin},...(body===undefined?{}:{data:body}),timeout:60000});
 assert(r.ok(),`${method} ${path}: HTTP ${r.status()}`);return r.json();
}
async function login(context,id){
 const response=await context.request.post(origin+'/v1/auth/login',{headers:{Origin:origin},data:{email:'probe'+id+'@example.invalid',password:fixture.password}});
 assert.equal(response.status(),200,'Fictional password sign-in failed');
 const me=await api(context,'/v1/me');assert.equal(Number(me.user.id),id,'Signed-in identity differs from assigned fictional account');
}
async function open(page,hash='today'){
 await page.goto(origin+'/member/dashboard#'+hash,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#previewMember')?.classList.contains('is-ready')&&window.SST_API?.listProgressPhotos&&document.body.dataset.memberTools==='v1',null,{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#todayActions')?.dataset.todayDecisionReady==='true',null,{timeout:30000});
 if(hash==='visualise')await page.waitForFunction(()=>document.querySelector('#panel-visualise')?.classList.contains('active')&&document.querySelector('#shiftProgressStory')?.getAttribute('aria-busy')==='false',null,{timeout:30000});
 if(hash==='plans')await page.waitForFunction(()=>document.querySelector('#panel-plans')?.classList.contains('active')&&document.querySelector('#activePlans')?.dataset.planManagerReady==='true',null,{timeout:30000});
}
async function revealUserControl(locator){
 if(await locator.isVisible())return;
 const disclosure=locator.locator('xpath=ancestor::details[not(@open)][1]');
 assert(await disclosure.count(),'Required control is hidden without an openable disclosure');
 const summary=disclosure.locator(':scope > summary').first();await summary.waitFor({state:'visible',timeout:5000});await summary.click();await locator.waitFor({state:'visible',timeout:5000});
}
async function navigateHeader(page,name){
 await page.locator('.sst-member-tabs .member-nav-tools a').filter({hasText:new RegExp('^'+name+'$')}).click();
 await page.waitForFunction(panel=>document.querySelector('#panel-'+panel)?.classList.contains('active'),name.toLowerCase(),{timeout:20000});
 await page.locator('#panel-'+name.toLowerCase()).waitFor({state:'visible'});
}
async function geometry(page,row,label){
 const g=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,font:getComputedStyle(document.body).fontFamily,headingFont:getComputedStyle(document.querySelector('.mtm-hero h2')).fontFamily}));
 assert(g.overflow<=0,`${label}: horizontal overflow ${g.overflow}px`);assert.equal(g.headingFont,g.font,`${label}: heading font differs from site body font`);
 row.geometry??={};row.geometry[label]=g;
}
async function today(page){
 // A panel can become visible while the freshly reloaded page is still reading
 // its account-backed day. Wait for that render before comparing its contents.
 await page.waitForFunction(()=>{const root=document.querySelector('#todayActions');return root?.dataset.todayDecisionReady==='true'&&['.mtm-hero','[data-master-rough]','.mt-meal','.mt-workout'].every(selector=>root.querySelector(selector))},null,{timeout:30000});
 return page.evaluate(()=>{const root=document.querySelector('#todayActions');return{hero:root.querySelector('.mtm-hero')?.textContent.replace(/\s+/g,' ').trim(),care:root.querySelector('[data-master-rough]')?.textContent.trim(),meal:root.querySelector('.mt-meal')?.textContent.replace(/\s+/g,' ').trim(),fit:root.querySelector('.mt-workout')?.textContent.replace(/\s+/g,' ').trim(),avatar:!!root.querySelector('[data-avatar],.avatar'),tapRoom:/tap room/i.test(root.innerText)}});
}
for(const [name,sha]of Object.entries(JSON.parse(readFileSync('work/staging/generated/current-tool-assets.json')))){
 const r=await fetch(origin+'/'+name);assert.equal(r.status,200,`Current asset ${name} missing`);const actual=createHash('sha256').update(new Uint8Array(await r.arrayBuffer())).digest('hex');assert.equal(actual,sha,`${name} differs from tested source`);report.sourceHashes[name]=actual;
}
const browser=await chromium.launch({headless:true});
try{
 for(const [index,[name,viewport]]of Object.entries({desktop:{width:1440,height:1000},mobile390:{width:390,height:844}}).entries()){
  const row={name,viewport,phase:'fictional-account-login',checks:[],pageErrors:[],failedRequests:[],apiRequests:[]};report.cases.push(row);
  const own=await browser.newContext({viewport,reducedMotion:'reduce'}),other=await browser.newContext({viewport,reducedMotion:'reduce'});
  const ownId=fixture.browserIds[index*2],otherId=fixture.browserIds[index*2+1];let page;
  try{
   await login(own,ownId);await login(other,otherId);
   row.phase='seed-progress-and-saved-plans';
   await api(own,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
   const dates=['2026-08-01','2026-08-14'];
   for(let i=0;i<2;i++)await api(own,'/v1/progress',{recordedOn:dates[i],weightKg:i?105:110,waistCm:i?115:120,systolic:i?135:145,diastolic:i?88:95,steps:i?6500:3000,sleepHours:i?7:5.5,moodScore:i?8:5,source:'fictional-staging-readiness'});
   await api(own,'/v1/grub/plan',{days:1,calories:2050,protein_g:115,preferences:'no fish; quick meals'});
   const beforePlans=await api(own,'/v1/plan/list');assert.equal(beforePlans.plans.current.filter(p=>p.type==='grub').length,1);
   const firstId=beforePlans.plans.current.find(p=>p.type==='grub').id;
   await api(own,'/v1/grub/plan',{days:1,calories:2100,protein_g:120,preferences:'no fish; batch friendly'});
   await api(own,'/v1/fit/plan',{days:1,minutes_per_day:20,location:'home',equipment:'none'});
   row.phase='choose-today-meal';
   const food=await api(own,'/v1/grub/workspace'),search=await api(own,'/v1/grub/search',{mode:'discover',query:'chicken'});assert(search.top?.length);
   const chosen=search.top[0];assert.equal(typeof chosen.id,'string','Published recipe must have a string ID');assert.equal(typeof chosen.name,'string','Published recipe uses the name field');assert.notEqual(chosen.name,'','Published recipe name is empty');await api(own,'/v1/grub/workspace',{action:'choose-today',recipeId:chosen.id,revision:food.revision,operationId:randomUUID()});
   row.phase='verify-account-isolation';
   const ownPlans=(await api(own,'/v1/plan/list')).plans;assert(ownPlans.replaced.some(p=>String(p.id)===String(firstId)));
   const otherPlans=(await api(other,'/v1/plan/list')).plans;assert.equal(otherPlans.current.length,0);assert.equal(otherPlans.replaced.length,0);
   const otherSummary=(await api(other,'/v1/progress/summary')).progress;
   // The canonical empty summary omits entries; only a ready summary has a count.
   // Accept an explicitly zero count too, without coercing a missing/wrong shape.
   assert.equal(otherSummary?.state,'empty','Separate account must return the canonical empty summary');
   assert.deepEqual(otherSummary.metrics,[],'Separate account leaked progress metrics');
   assert.deepEqual(otherSummary.milestones,[],'Separate account leaked progress milestones');
   assert(!Object.hasOwn(otherSummary,'entries')||otherSummary.entries===0,'An empty progress summary must omit entries or report numeric zero');
   const ownSummary=(await api(own,'/v1/progress/summary')).progress;
   assert.equal(ownSummary?.state,'ready','The seeded progress summary is not ready');
   assert.equal(ownSummary.entries,2,'The seeded progress summary must retain both check-ins');
   for(const label of ['Weight','Waist','Steps','Sleep','Mood'])assert(ownSummary.metrics?.some(metric=>metric.label===label),'Seeded progress API omitted '+label);
   row.seededProgress={state:ownSummary.state,entries:ownSummary.entries,metricLabels:ownSummary.metrics.map(metric=>metric.label)};
   row.checks.push('Real API writes retain two progress records, current plans and replaced history; separate account stays empty');
   row.phase='open-current-today';
   page=await own.newPage();page.on('pageerror',e=>row.pageErrors.push(clean(e.message)));
   // Record timings and transport outcomes only; never record cookies, headers,
   // credentials or response bodies. This separates an actual API timeout from
   // a request cancelled when the test closes a failed page.
   const requestTimes=new WeakMap();
   page.on('request',request=>{const url=new URL(request.url());if(!url.pathname.startsWith('/v1/'))return;const trace={host:url.host,path:url.pathname,method:request.method(),phase:row.phase};requestTimes.set(request,{trace,started:Date.now()});if(row.apiRequests.length<100)row.apiRequests.push(trace)});
   page.on('response',response=>{const item=requestTimes.get(response.request());if(item){item.trace.status=response.status();item.trace.responseMs=Date.now()-item.started}});
   page.on('requestfinished',request=>{const item=requestTimes.get(request);if(item)item.trace.finishedMs=Date.now()-item.started});
   page.on('requestfailed',request=>{const item=requestTimes.get(request),url=new URL(request.url()),error=request.failure()?.errorText;if(item){item.trace.error=error;item.trace.failedMs=Date.now()-item.started}row.failedRequests.push({host:url.host,path:url.pathname,error,elapsedMs:item?Date.now()-item.started:null,phase:row.phase})});
   await open(page);const before=await today(page);assert(before.hero?.includes('MY TIMBER'));assert(before.care?.includes('Feeling rough'));assert(before.meal?.includes(chosen.name));assert.equal(before.avatar,false);assert.equal(before.tapRoom,false);row.todayBefore=before;
   await geometry(page,row,'today');await page.screenshot({path:join(out,name+'-today.png'),fullPage:true});
   row.phase='render-progress-via-more';
   await page.locator('.member-nav-more > summary').click();await page.locator('.member-nav-more [data-panel="visualise"]').click();
   await page.waitForFunction(()=>document.querySelector('#panel-visualise')?.classList.contains('active')&&document.querySelector('#shiftProgressStory')?.getAttribute('aria-busy')==='false');
   const story=await page.locator('#shiftProgressStory').innerText();row.progressText=clean(story);
   assert(story.includes('2 check-ins retained'),'Missing retained progress count');
   // CSS uppercases metric labels. Read their actual DOM text so typography
   // cannot turn a present metric into a false negative.
   const metricLabels=(await page.locator('#shiftProgressStory .shift-progress-label').allTextContents()).map(text=>text.trim());
   for(const label of ['Weight','Waist','Steps','Sleep','Mood'])assert(metricLabels.includes(label),'Missing progress metric '+label);
   row.phase='upload-photo-through-visible-controls';
   await revealUserControl(page.locator('#photoInput'));await page.setInputFiles('#photoInput',{name:'fictional-pixel.png',mimeType:'image/png',buffer:png});await page.locator('#visualConsentWrap').waitFor({state:'visible'});
   await revealUserControl(page.locator('#photoWeightUnit'));await page.selectOption('#photoWeightUnit','kg');await revealUserControl(page.locator('#photoWeightKg'));await page.selectOption('#photoWeightKg','105.0');await revealUserControl(page.locator('#savePhotoConsent'));await page.check('#savePhotoConsent');await revealUserControl(page.locator('#saveOriginal'));await page.click('#saveOriginal');
   await page.waitForFunction(()=>document.querySelector('#savedPhotos [data-photo-id] img')?.complete&&document.querySelector('#savedPhotos [data-photo-id] img')?.naturalWidth>0,null,{timeout:30000});
   row.phase='verify-photo-account-isolation';
   const photoId=await page.locator('#savedPhotos [data-photo-id]').first().getAttribute('data-photo-id');
   const photos=await api(own,'/v1/shift/progress-photo');assert.equal(photos.photos.length,1);assert.equal(String(photos.photos[0].id),photoId);assert.equal((await api(other,'/v1/shift/progress-photo')).photos.length,0);
   assert.equal((await other.request.get(origin+'/v1/shift/progress-photo/'+photoId+'/image')).status(),404);
   assert.equal((await fetch(origin+'/v1/shift/progress-photo/'+photoId+'/image')).status,401);
   row.checks.push('Progress renders; photo uploaded through UI loads from private D1 and another account cannot list or retrieve it');
   await geometry(page,row,'progress');await page.screenshot({path:join(out,name+'-progress-photo.png'),fullPage:true});
   row.phase='render-retained-plans';
   await open(page,'plans');const currentCount=await page.locator('.mp-plan-manager-card.is-current').count();assert.equal(currentCount,ownPlans.current.length);assert(await page.locator('.mp-plan-history-row[data-plan-record="'+firstId+'"]').count());
   await page.locator('.mp-plan-manager-history > summary').first().click();await geometry(page,row,'plans');
   const planText=await page.locator('#panel-plans .mp-plan-manager-heading h3').evaluate(el=>({text:el.textContent,color:getComputedStyle(el).color}));
   assert.equal(planText.text,'Current plans');assert.equal(planText.color,'rgb(231, 227, 218)','Plans heading must remain readable on the dark member panel');
   await page.screenshot({path:join(out,name+'-plans.png'),fullPage:true});
   row.phase='open-saved-plan-without-changing-current-week';
   const beforeView=await api(own,'/v1/grub/workspace');
   await page.locator('[data-plan-snapshot="'+firstId+'"]').click();
   await page.waitForFunction(id=>document.querySelector('[data-saved-plan-view="'+id+'"]')?.textContent.includes('Saved contents'),String(firstId),{timeout:20000});
   const retained=(await api(own,'/v1/plan/latest')).plans.find(p=>String(p.id)===String(firstId));assert(retained?.plan?.days?.[0]?.meals?.length);
   assert((await page.locator('[data-saved-plan-view="'+firstId+'"]').innerText()).includes(retained.plan.days[0].meals[0].name),'Saved-plan view differs from the retained plan');
   assert(!(await api(other,'/v1/plan/latest')).plans.some(p=>String(p.id)===String(firstId)),'Another account received this saved plan');
   assert.deepEqual(await api(own,'/v1/grub/workspace'),beforeView,'Viewing a historical plan changed the current food workspace');
   row.checks.push('My Plans renders actual current records and prior history; saved contents match the retained record without replacing the current week');
   row.phase='verify-return-after-fresh-login';
   await api(own,'/v1/auth/logout',{});assert.equal((await own.request.get(origin+'/v1/shift/progress-photo/'+photoId+'/image')).status(),401);await login(own,ownId);
   await open(page,'visualise');await page.locator('#savedPhotos [data-photo-id="'+photoId+'"] img').waitFor({state:'visible'});assert((await page.locator('#shiftProgressStory').innerText()).includes('2 check-ins retained'));
   await open(page,'plans');assert(await page.locator('.mp-plan-history-row[data-plan-record="'+firstId+'"]').count());
   row.checks.push('Progress, private photo, current plans and replaced plans survive logout and fresh password sign-in');
   row.phase='delete-photo-and-verify-reload';
   await open(page,'visualise');await page.locator('[data-photo-delete="'+photoId+'"]').click();await page.waitForFunction(id=>!document.querySelector('#savedPhotos [data-photo-id="'+id+'"]'),photoId);
   assert.equal((await api(own,'/v1/shift/progress-photo')).photos.length,0);assert.equal((await own.request.get(origin+'/v1/shift/progress-photo/'+photoId+'/image')).status(),404);
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#savedPhotos')?.textContent.includes('No saved progress photos'));
   row.checks.push('Delete through UI removes photo from fresh list, image URL and reload');
   row.phase='return-through-native-journey-and-today-links';
   await navigateHeader(page,'Journey');await navigateHeader(page,'Today');assert.deepEqual(await today(page),before,'Restored tools changed the approved Today content or chosen meal');await geometry(page,row,'returnToday');
   row.checks.push('Real header controls return from Progress to Journey and Today; approved greeting, care, meal, movement and font remain, without avatar or Tap Room');
   assert.deepEqual(row.pageErrors,[],'Browser page errors');row.phase='complete';row.status='pass';
  }catch(error){row.status='fail';row.error=clean(error.message);row.stack=String(error.stack||'').split('\n').filter(line=>/^\s+at /.test(line)).slice(0,4).map(clean);report.failures.push({name,phase:row.phase,error:row.error,stack:row.stack});if(page)await page.screenshot({path:join(out,name+'-failure.png'),fullPage:true}).catch(()=>{});}
  finally{for(const context of [own,other]){await context.request.post(origin+'/v1/auth/logout',{headers:{Origin:origin},data:{}}).catch(()=>{});await context.close()}save();}
 }
}finally{await browser.close();report.status=report.failures.length?'fail':'pass';save();}
console.log(JSON.stringify(report,null,2));assert.equal(report.failures.length,0,'Isolated rendered member preservation proof failed');
