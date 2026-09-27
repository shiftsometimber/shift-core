import {chromium,webkit} from 'playwright';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {savedFitIssues} from '../../member-experience/fit-saved-review.mjs';

const origin=process.env.PREVIEW_URL,configPath='work/staging/generated/config.json';
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''),'Isolated preview only');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json')),config=JSON.parse(readFileSync(configPath));
assert.equal(config.name,'shift-stabilisation-preview');assert(!config.routes);assert.equal(config.d1_databases.find(d=>d.binding==='DB')?.database_name,'shift-stabilisation-preview-auth-20260917');
assert(!readFileSync('wrangler.jsonc','utf8').includes(config.d1_databases.find(d=>d.binding==='DB').database_id));
const dir='work/staging/generated/five-points-evidence/discovery';mkdirSync(dir,{recursive:true});
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),cases:[],productionWrites:0};
const save=()=>writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));
const sql=command=>JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config',configPath,'--command',command,'--json'],{encoding:'utf8',timeout:45000,maxBuffer:8e6}));
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const badPlan={location:'home',minutes_per_day:20,sessions:[{day:1,title:'Discovery retained fixture',location:'home',requested_minutes:20,estimated_minutes:22,exercises:[{id:'discovery-hotel-push-up',name:'Hotel push-up',group:'push'},{id:'discovery-cool-down',name:'Cool-Down',group:'legs'}]}]};
const matrix=[['chromium-desktop',chromium,{width:1440,height:1000}],['chromium-phone',chromium,{width:390,height:844}],['webkit-desktop',webkit,{width:1440,height:1000}],['webkit-phone',webkit,{width:390,height:844}]];
for(const [index,[name,engine,viewport]]of matrix.entries()){
 const id=fixture.browserIds[index];assert(Number.isSafeInteger(id)&&id>1e10);
 const browser=await engine.launch(),ctx=await browser.newContext({viewport,serviceWorkers:'block'}),page=await ctx.newPage(),row={name,checks:[]};report.cases.push(row);
 let deletionFailure=0;
 ctx.setDefaultTimeout(30000);ctx.setDefaultNavigationTimeout(30000);
 const phase=value=>{row.phase=value;save();console.log(JSON.stringify({name,phase:value,at:new Date().toISOString()}))};
 const deadline=setTimeout(()=>{row.deadlineExceeded=true;ctx.close().catch(()=>{});browser.close().catch(()=>{})},300000);
 const call=async(path,method='GET',data)=>ctx.request.fetch(origin+path,{method,headers:{Origin:origin},...(data===undefined?{}:{data}),timeout:45000});
 const json=async(path,method='GET',data)=>{const r=await call(path,method,data);assert(r.ok(),path+' '+r.status()+' '+(r.ok()?'':await r.text()));return r.json()};
 const login=()=>json('/v1/auth/login','POST',{email:'probe'+id+'@example.invalid',password:fixture.password});
 const consent=granted=>json('/v1/consents','POST',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted});
 const ready=async path=>{await page.goto(origin+path);await page.waitForFunction(()=>document.body.dataset.memberSession==='ready')};
 const today=async()=>{await ready('/member/dashboard#today');await page.waitForFunction(()=>document.querySelector('#todayActions')?.dataset.todayDecisionReady==='true');await page.locator('#more-for-today').waitFor();const d=page.locator('#more-for-today');if(await d.getAttribute('open')===null)await d.locator(':scope > summary').click();await page.locator('.mt-workout').waitFor()};
 try{
  // Install one router before navigation: late-added context routes were not
  // intercepting DELETE reliably in WebKit. Keep the failure visible in HTTP evidence.
  await ctx.route('**/*',route=>{const r=route.request(),url=new URL(r.url());if(url.origin!==origin&&!['GET','HEAD'].includes(r.method()))return route.abort();if(url.origin===origin&&url.pathname==='/v1/privacy/account'&&r.method()==='DELETE'&&deletionFailure)return route.fulfill({status:deletionFailure,contentType:'application/json',body:JSON.stringify({error:deletionFailure===401?'session_expired':'fictional_dependency_failure'})});return route.continue()});
  phase('public-crisis-rendering');
  await page.goto(origin+'/ask-timber');await page.getByRole('button',{name:'Necessary only',exact:true}).click();
  for(const message of ['I feel suicidal and cannot eat dinner','Someone has anaphylaxis']){
   await page.locator('#timberQuestion').fill(message);const reply=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/ai/chat'&&r.request().method()==='POST');await page.locator('#timberSubmit').click();
   const response=await reply;assert.equal(response.status(),200);assert.equal((await response.json()).mode,'safety');
   await page.locator('#timberResponse .at-copy').waitFor();assert.match(await page.locator('#timberResponse').innerText(),/999/);assert.doesNotMatch(await page.locator('#timberResponse').innerText(),/kebab|reword my question/i);
  }
  await page.screenshot({path:dir+'/'+name+'-crisis.png',fullPage:true});row.checks.push('Public crisis reply survives missing AI binding and mixed food intent without lifestyle addendum');
  phase('urgent-page-paint');await page.goto(origin+'/mental-health/urgent-mental-health-help');await page.locator('.sst-service-bridge__main h2').waitFor();
  row.paint=await page.locator('.sst-service-bridge__main').evaluate(root=>({background:getComputedStyle(root).backgroundColor,text:[...root.querySelectorAll('h2,p')].map(el=>({text:el.textContent,fill:getComputedStyle(el).getPropertyValue('-webkit-text-fill-color'),color:getComputedStyle(el).color}))}));
  assert.equal(row.paint.background,'rgb(231, 227, 218)');assert(row.paint.text.length>=2);for(const text of row.paint.text)assert.equal(text.fill,'rgb(5, 5, 5)');
  await page.locator('.sst-service-bridge__main').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/'+name+'-urgent-paint.png'});row.checks.push('Urgent-page bridge heading and body use black text fill on cream in the rendered browser');
  phase('today-retained-fit');await login();await consent(true);
  sql(`UPDATE shift_plans SET status='replaced' WHERE user_id=${id} AND plan_type='fit' AND status='active'; INSERT INTO shift_plans(user_id,plan_type,starts_on,plan_json) VALUES(${id},'fit','2026-09-21',${quote(JSON.stringify(badPlan))});`);
  const retained=await json('/v1/fit/activity');assert.deepEqual(retained.plan,badPlan);
  await today();const workout=page.locator('.mt-workout');await workout.getByRole('heading',{name:'This saved session needs replacing'}).waitFor();assert.equal(await workout.getByText('Start the session',{exact:false}).count(),0);assert.equal(await workout.locator('li').count(),0);
  await page.screenshot({path:dir+'/'+name+'-today-review.png',fullPage:true});await workout.getByRole('link',{name:'Review saved session',exact:false}).click();await page.getByRole('heading',{name:'This saved session needs replacing'}).waitFor();assert.equal(await page.locator('.sf-exercise').count(),0);
  await page.reload();await page.getByRole('heading',{name:'This saved session needs replacing'}).waitFor();await json('/v1/auth/logout','POST',{});await login();await today();await workout.getByRole('heading',{name:'This saved session needs replacing'}).waitFor();assert.deepEqual(await json('/v1/fit/activity'),retained);
  await workout.getByRole('link',{name:'Review saved session',exact:false}).click();await page.locator('#fitMinutes').selectOption('20');await page.locator('#fitLocation').selectOption('home');
  const build=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/fit/plan'&&r.request().method()==='POST');await page.locator('#fitGenerate').click();assert.equal((await build).status(),200);await page.locator('.sf-current-step').first().waitFor();
  const rebuilt=await json('/v1/fit/activity');assert.deepEqual(savedFitIssues(rebuilt.plan),[]);assert.deepEqual(rebuilt.fitJourney,retained.fitJourney);
  await today();assert.equal(await workout.getByRole('heading',{name:'This saved session needs replacing'}).count(),0);assert((await json('/v1/shift/daily-plan')).daily.daily_output.workout.ready);
  row.checks.push('Today and Fit agree before and after explicit rebuild, reload and new login; exact retained plan/activity preserved');
  phase('pen-day-privacy');await consent(false);
  assert.equal((await call('/v1/pen-day','POST',{status:'done',feel:'rough',note:'Fictional discovery note'})).status(),409);await consent(true);
  assert.equal((await call('/v1/pen-day','POST',{status:'done',feel:'rough',note:'Fictional discovery note'})).status(),200);
  await consent(false);const exported=await json('/v1/privacy/export','POST',{});assert(exported.penDayNotes.some(r=>r.note==='Fictional discovery note'));assert.equal(exported.penDayLegacyEvents.length,0);
  await ready('/member/settings');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Erase health-tracking history',exact:true}).click();await page.getByText('Your optional health-tracking history has been erased and consent withdrawn.',{exact:false}).waitFor();
  const notes=await json('/v1/pen-day');assert.equal(notes.today,null);assert.deepEqual(notes.history,[]);assert.equal((await call('/v1/pen-day','POST',{status:'done'})).status(),409);
  row.checks.push('Hosted consent blocks Pen Day saves; export includes retained notes after withdrawal; Settings erasure removes them');
  phase('deletion-cancel-and-failure');await page.getByRole('button',{name:'Request account deletion',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.locator('#accountDeletionForm').isVisible(),false);
  deletionFailure=401;
  await page.getByRole('button',{name:'Request account deletion',exact:true}).click();await page.locator('#accountDeletionConfirm').check();let failed=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/privacy/account'&&r.request().method()==='DELETE');await page.getByRole('button',{name:'Send deletion request',exact:true}).click();assert.equal((await failed).status(),401);await page.locator('#accountDeletionSignIn').waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  deletionFailure=503;
  await page.getByRole('button',{name:'Request account deletion',exact:true}).click();await page.locator('#accountDeletionConfirm').check();failed=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/privacy/account'&&r.request().method()==='DELETE');await page.getByRole('button',{name:'Send deletion request',exact:true}).click();assert.equal((await failed).status(),503);await page.locator('#accountDeletionStatus[data-state="error"]').waitFor();assert((await call('/v1/me')).ok());
  assert.equal(await page.getByRole('button',{name:'Send deletion request',exact:true}).isEnabled(),true);deletionFailure=0;
  phase('deletion-receipt');const submitted=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/privacy/account'&&r.request().method()==='DELETE');await page.getByRole('button',{name:'Send deletion request',exact:true}).click();assert.equal((await submitted).status(),202);
  await page.locator('#accountDeletionStatus[data-state="received"]').waitFor();assert.match(await page.locator('#accountDeletionStatus').innerText(),/has not yet been deleted/);assert.equal((await call('/v1/me')).status(),401);
  const records=sql(`SELECT status,completed_at FROM data_requests WHERE user_id=${id} AND request_type='deletion'; SELECT status,title FROM hq_tasks WHERE user_id=${id} AND title='Review account deletion request';`);assert.equal(records[0].results.length,1);assert.equal(records[0].results[0].status,'received');assert.equal(records[0].results[0].completed_at,null);assert.equal(records[1].results[0].status,'open');
  const size=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert(size.scroll<=size.width+1);
  await page.screenshot({path:dir+'/'+name+'-deletion-receipt.png',fullPage:true});row.checks.push('Deletion cancellation, failed response/retry, accurate receipt, session revocation and durable HQ task; no account data hard-deleted');row.status='pass';
 }catch(error){row.status='fail';row.error=String(error.stack).replaceAll(fixture.password,'[redacted]');row.url=page.url();row.body=(await page.locator('body').innerText().catch(()=>'' )).slice(0,5000);await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{clearTimeout(deadline);await ctx.close();await browser.close();save();console.log(JSON.stringify({name,status:row.status,phase:row.phase,error:row.error}));}
}
assert(report.cases.every(c=>c.status==='pass'),JSON.stringify(report));console.log(JSON.stringify(report,null,2));
