import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const origin=process.env.PREVIEW_URL;
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''),'Only the new isolated preview is allowed');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json'));
const dir='work/staging/generated/review-evidence';mkdirSync(dir,{recursive:true});
const report={checkedAt:new Date().toISOString(),origin,source:process.env.PREVIEW_SOURCE_SHA,cases:[],failures:[],productionWrites:0,limitations:['Fictional @example.invalid accounts and separately named D1 databases only','Automated Chromium and WebKit at desktop and phone viewports; not a physical iPhone/Mac Safari certification','No live email, payment, medicines or clinical-service commissioning claim','Action completion and helpfulness are member reports, not health outcomes']};
const scrub=s=>String(s).replaceAll(fixture.password,'[redacted]').replace(/(?:probe|hq)\d+@example\.invalid/g,'[fictional account]').slice(0,1800);
const save=()=>writeFileSync(dir+'/browser-report.json',JSON.stringify(report,null,2));
async function api(context,path,data,method=data===undefined?'GET':'POST',status=null){
 const response=await context.request.fetch(origin+path,{method,headers:{Origin:origin},...(data===undefined?{}:{data}),timeout:60000});
 if(status!==null)assert.equal(response.status(),status,method+' '+path);else assert(response.ok(),method+' '+path+' HTTP '+response.status()+': '+scrub(await response.text()));
 return response.headers()['content-type']?.includes('application/json')?response.json():response.text();
}
async function login(ctx,id){await api(ctx,'/v1/auth/login',{email:'probe'+id+'@example.invalid',password:fixture.password},'POST',200);const me=await api(ctx,'/v1/me');assert.equal(Number(me.user.id),id)}
async function open(page,path){await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:45000});}
async function geometry(page){const g=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,content:document.documentElement.scrollWidth,body:document.body.scrollWidth}));assert(g.content<=g.viewport+1,'Horizontal overflow '+JSON.stringify(g));return g;}
async function waitLife(page){await page.locator('#journeyView').waitFor({state:'visible',timeout:45000});await page.waitForFunction(()=>document.querySelector('[data-dialog="goalDialog"]')&&!document.querySelector('[data-dialog="goalDialog"]').disabled);}
async function checkin(page,outcome=null){
 if(!await page.locator('#checkinDialog').isVisible())await page.locator('.checkin-cta [data-dialog="checkinDialog"]').click();
 if(outcome)await page.locator('input[name="shiftFeedback"][value="'+outcome+'"]').check();
 await page.selectOption('#supportNeed','food');
 for(const key of ['energy','sleep','confidence','movement','clothes','personal']){assert.equal(await page.locator('#rating-'+key).inputValue(),'','Fresh rating must be deliberate');await page.locator('#rating-'+key).fill(key==='energy'?'30':'65');}
 await page.locator('#checkinForm button[type="submit"]').click();await page.locator('#checkinDialog').waitFor({state:'hidden',timeout:45000});
}
async function today(page){await open(page,'/member/dashboard#today');await page.waitForFunction(()=>document.querySelector('#todayActions')?.dataset.todayDecisionReady==='true',null,{timeout:45000});await page.locator('.mtm-next').waitFor({state:'visible',timeout:30000});assert.equal(await page.locator('.mtm-next').count(),1);}
const checks=[['chromium-desktop',chromium,{width:1440,height:1000},'helped'],['chromium-phone',chromium,{width:390,height:844},'not-fit'],['webkit-desktop',webkit,{width:1440,height:1000},'helped'],['webkit-phone',webkit,{width:390,height:844},'not-tried']];
for(let index=0;index<checks.length;index++){
 const [name,engine,viewport,outcome]=checks[index],browser=await engine.launch({headless:true});const context=await browser.newContext({viewport,recordVideo:{dir:dir+'/video',size:viewport},reducedMotion:'reduce'});
 const row={name,viewport,phase:'login',checks:[],errors:[],blockedExternalWrites:[]};report.cases.push(row);const page=await context.newPage();
 page.on('pageerror',e=>row.errors.push(scrub(e.message)));
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(u.origin!==origin&&!['GET','HEAD'].includes(r.method())){row.blockedExternalWrites.push({host:u.host,path:u.pathname,method:r.method()});return route.abort()}return route.continue()});
 try{
  row.phase='read-only-public-shell';
  for(const path of ['/shift-health','/mental-health/getting-professional-help','/member-login','/life-back']){
   row.publicPath=path;await open(page,path);await page.locator('.site-header .menu-trigger').click();await page.locator('#site-drawer').waitFor({state:'visible'});
   assert(await page.locator('#site-drawer a[href="/shift-newsroom"]').isVisible());assert.equal(await page.locator('.site-footer').count(),1);
   for(const route of ['/treatment-centre','/shop','/shift-newsroom','/good-to-talk'])assert.equal(await page.locator('.site-footer a[href="'+route+'"]').count(),1);
   await page.locator('#site-drawer .drawer-close').click();await page.locator('#site-drawer').waitFor({state:'hidden'});await geometry(page);
   if(path==='/shift-health'||path==='/life-back')await page.screenshot({path:dir+'/'+name+'-'+(path==='/shift-health'?'health':'public-life-back')+'.png',fullPage:true});
  }
  row.checks.push('Public drawer opens and closes; newsroom present; shared footer key links unique; public pages fit viewport');
  row.phase='fictional-member-login';await login(context,fixture.browserIds[index]);await api(context,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
  await open(page,'/member/dashboard#today');await page.waitForFunction(()=>document.querySelector('#todayActions')?.dataset.todayDecisionReady==='true',null,{timeout:45000});
  const baseline=await api(context,'/v1/member-state');row.baselinePreferenceKeys=Object.keys(baseline.state?.preferences||{});
  row.phase='personal-goal';await open(page,'/member/life-back');await waitLife(page);await page.locator('[data-dialog="goalDialog"]').first().click();await page.fill('#customGoal','Join in on a family walk');await page.locator('#goalForm button[type="submit"]').click();await page.locator('#goalDialog').waitFor({state:'hidden',timeout:30000});
  row.phase='first-check-in';await checkin(page);const initial=await api(context,'/v1/life-back');assert.equal(initial.progress.entries.length,1);assert.equal(initial.progress.nextShift.kind,'food');assert.equal(initial.progress.nextShift.status,'planned');assert.equal(initial.progress.entries[0].win,'');const first=initial.progress.nextShift.id;
  row.phase='one-existing-today-card';await today(page);assert((await page.locator('.mtm-next').innerText()).includes('Choose one straightforward meal'));await geometry(page);
  assert.equal(await page.locator('body').getAttribute('data-member-chrome'),'v1');assert(await page.locator('[data-member-hero="v1"]').count());
  await page.screenshot({path:dir+'/'+name+'-next-shift.png',fullPage:true});
  // Open the actual linked tool. Opening it must not fabricate completion.
  await page.locator('.mtm-next a[href*="grub"]').first().click();await page.waitForURL(/(?:member|member-connected)\/grub/);assert.equal((await api(context,'/v1/life-back')).progress.nextShift.completedAt,undefined);
  await today(page);await page.locator('[data-loop-status="done"]').click();await page.getByText('Marked done ✓',{exact:true}).waitFor({state:'visible',timeout:45000});
  const done=await api(context,'/v1/life-back');assert.equal(done.progress.nextShift.id,first);assert.equal(done.progress.nextShift.status,'done');assert.equal(done.usage.actionsCompleted,1);
  row.checks.push('Deliberate six-area check-in creates one task in existing Today; real Grub route opens; opening does not mark done; explicit done persists');
  row.phase='logout-and-return';await api(context,'/v1/auth/logout',{});await api(context,'/v1/life-back',undefined,'GET',401);await login(context,fixture.browserIds[index]);await today(page);assert((await page.locator('.mtm-next').innerText()).includes('Marked done'));
  row.phase='follow-up-remembered';await page.locator('.mtm-next a[href*="life-back"]').click();await waitLife(page);await page.locator('#checkinDialog').waitFor({state:'visible',timeout:30000});assert((await page.locator('#shiftFollowup').innerText()).includes('Choose one straightforward meal'));assert((await page.locator('#shiftFollowup').innerText()).includes('You marked this done'));
  await page.screenshot({path:dir+'/'+name+'-follow-up.png',fullPage:true});await checkin(page,outcome);
  const reviewed=await api(context,'/v1/life-back');assert.equal(reviewed.progress.entries.length,2);assert.equal(reviewed.progress.entries[1].shiftFeedback.shiftId,first);assert.equal(reviewed.progress.entries[1].shiftFeedback.outcome,outcome);
  assert.equal(reviewed.usage.actionsCompleted,1);assert.equal(reviewed.usage.repeatCheckin,true);
  if(outcome==='not-tried')assert.equal(reviewed.progress.nextShift.id,first);else{assert.notEqual(reviewed.progress.nextShift.id,first);assert.equal(reviewed.progress.shiftHistory[0].id,first);}
  await today(page);assert((await page.locator('.mtm-next').innerText()).includes(outcome==='not-fit'?'Start with a familiar meal':'Choose one straightforward meal'));await geometry(page);await page.screenshot({path:dir+'/'+name+'-returned.png',fullPage:true});
  row.checks.push('Goal, action and done status survive logout and re-login; next check-in remembers exact action; '+outcome+' outcome retained and next action correct');
  const after=await api(context,'/v1/member-state');const untouched=p=>Object.fromEntries(Object.entries(p.state?.preferences||{}).filter(([k])=>k!=='lifeBack'));assert.deepEqual(untouched(after),untouched(baseline),'Unrelated preferences overwritten');
  row.checks.push('Unrelated member preferences remain unchanged');
  row.phase='consent-and-isolation';const cross=await context.request.post(origin+'/v1/life-back',{headers:{Origin:'https://example.invalid'},data:{action:'shift-status',operationId:randomUUID(),shiftId:reviewed.progress.nextShift.id,status:'done'}});assert.equal(cross.status(),403);
  await api(context,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:false});await api(context,'/v1/life-back',{action:'shift-status',operationId:randomUUID(),shiftId:reviewed.progress.nextShift.id,status:'done'},'POST',409);assert.deepEqual((await api(context,'/v1/life-back')).progress,reviewed.progress);
  row.checks.push('Cross-origin update blocked; revoked tracking consent blocks writes without replacing saved history');
  row.usage=reviewed.usage;row.status='pass';row.phase='complete';assert.deepEqual(row.blockedExternalWrites,[],'Browser attempted a write outside the preview');
 }catch(error){row.status='fail';row.finalUrl=page.url();row.bodyText=scrub(await page.locator('body').innerText().catch(()=>''));row.error=scrub(error.stack||error);report.failures.push({name,phase:row.phase,error:row.error});await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{await context.request.post(origin+'/v1/auth/logout',{headers:{Origin:origin},data:{}}).catch(()=>{});await context.close();await browser.close();save();}
}
// Fresh browser creation path plus basic remote boundaries.
const browser=await chromium.launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
try{await open(page,'/__review');await page.getByRole('button',{name:'Start a fresh fictional review'}).click();await page.waitForURL('**/member/life-back');await waitLife(page);assert.equal((await api(context,'/v1/life-back')).progress.entries.length,0);report.freshReview='pass';for(const path of ['/v1/contact','/v1/continuity-interest','/payment','/treatment-order'])assert.equal((await context.request.post(origin+path,{headers:{Origin:origin},data:{}})).status(),403);const m=await api(context,'/__preview/meta');assert.equal(m.productionBindings,false);assert.equal(m.source,process.env.PREVIEW_SOURCE_SHA);report.boundaries='pass';}
catch(e){await page.screenshot({path:dir+'/fresh-review-failure.png',fullPage:true}).catch(()=>{});report.failures.push({phase:'fresh-review-and-boundaries',url:page.url(),body:scrub(await page.locator('body').innerText().catch(()=>'')),error:scrub(e.stack||e)})}finally{await context.close();await browser.close();}
report.status=report.failures.length?'fail':'pass';save();console.log(JSON.stringify(report,null,2));assert.equal(report.failures.length,0,'Preview browser proof failed');
