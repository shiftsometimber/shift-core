import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const origin=process.env.PREVIEW_URL,dir='work/staging/generated/five-points-evidence/b1',configFile='work/staging/generated/config.json';
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''));
const config=JSON.parse(readFileSync(configFile)),fixture=JSON.parse(readFileSync('work/staging/generated/b1-probe.json'));
assert.equal(config.d1_databases.find(x=>x.binding==='DB')?.database_name,'shift-stabilisation-preview-auth-20260917');assert(!config.routes);
mkdirSync(dir,{recursive:true});
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),productionWrites:0,cases:[]},save=()=>writeFileSync(dir+'/browser-report.json',JSON.stringify(report,null,2));
const sql=command=>JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config',configFile,'--command',command,'--json'],{encoding:'utf8',maxBuffer:4e6}));
const matrix=[['chromium-desktop',chromium,{width:1440,height:1000}],['chromium-phone',chromium,{width:390,height:844}],['webkit-desktop',webkit,{width:1440,height:1000}],['webkit-phone',webkit,{width:390,height:844}]];
for(const [index,[name,engine,viewport]]of matrix.entries()){
 const f=fixture.cases[index],browser=await engine.launch(),context=await browser.newContext({viewport}),page=await context.newPage(),row={name,checks:[]};report.cases.push(row);
 context.setDefaultTimeout(25000);context.setDefaultNavigationTimeout(30000);
 const mark=phase=>{row.phase=phase;save();console.log(JSON.stringify({name,phase}))};
 const post=(path,data)=>context.request.post(origin+path,{headers:{Origin:origin},data});
 const patch=data=>context.request.patch(origin+'/v1/member-state',{headers:{Origin:origin},data});
 const state=async()=>{const r=await context.request.get(origin+'/v1/member-state');assert.equal(r.status(),200);return(await r.json()).state};
 const login=async password=>{const r=await post('/v1/auth/login',{email:f.email,password});assert.equal(r.status(),200,'ordinary login');};
 const trigger='b1_failure_'+f.id;
 try{
  await context.route('**/*',route=>{const r=route.request();return new URL(r.url()).origin!==origin&&!['GET','HEAD'].includes(r.method())?route.abort():route.continue()});
  mark('signed-out-recovery-entry');await page.goto(origin+'/member-login');const necessary=page.getByRole('button',{name:'Necessary only',exact:true});if(await necessary.isVisible())await necessary.click();await page.getByRole('button',{name:'Forgotten your password?',exact:true}).click();await page.locator('#previewReset input[name=email]').waitFor();await page.getByRole('button',{name:'Back to sign in',exact:true}).click();await page.locator('#previewRegister input[name=password]').waitFor();row.checks.push('Signed-out public login loads with its session runtime; Forgot password and return controls work');
  mark('ordinary-login-and-parallel-saves');await login(fixture.oldPassword);
  for(let i=0;i<5;i++){const r=await Promise.all([patch({myWhy:{why:'Fictional walk '+i,promise:'Fictional promise'}}),patch({roadmap:{step:'Fictional step '+i}})]);assert.deepEqual(r.map(x=>x.status()),[200,200]);const s=await state();assert.equal(s.myWhy.why,'Fictional walk '+i);assert.equal(s.roadmap.step,'Fictional step '+i)}
  const baseline=await state();row.checks.push('Five overlapping partial saves retain both fields in independent D1 read-back');
  mark('real-d1-rollback-and-retry');
  sql(`CREATE TRIGGER ${trigger} BEFORE UPDATE ON member_status WHEN NEW.user_id=${f.id} BEGIN SELECT RAISE(ABORT,'B1 synthetic activity failure'); END`);
  const failed=await patch({myWhy:{why:'must roll back'}});assert(failed.status()>=500,'DB failure must not return success');assert.deepEqual(await state(),baseline);
  sql(`DROP TRIGGER ${trigger}`);assert.equal((await patch({myWhy:{why:'Fictional retry'}})).status(),200);assert.equal((await state()).myWhy.why,'Fictional retry');row.checks.push('Actual D1 failure after state write rolls back; retry persists without duplication');
  mark('adapter-network-failure-retry-and-relogin');await page.goto(origin+'/member/dashboard#today');await page.waitForFunction(()=>!!window.SST_API?.saveMemberState);
  await page.route('**/v1/member-state',route=>route.request().method()==='PATCH'?route.abort('timedout'):route.continue());
  const error=await page.evaluate(async()=>{try{await SST_API.saveMemberState({myWhy:{why:'Fictional network retry'}});return{success:true}}catch(e){return{code:e.code,message:e.message}}});assert.equal(error.code,'network_error');
  await page.unroute('**/v1/member-state');await page.evaluate(()=>SST_API.saveMemberState({myWhy:{why:'Fictional network retry'}}));await page.reload();assert.equal((await state()).myWhy.why,'Fictional network retry');
  await post('/v1/auth/logout',{});await login(fixture.oldPassword);assert.equal((await state()).myWhy.why,'Fictional network retry');row.checks.push('Production browser adapter reports network failure; retry, reload and ordinary new login retain data');
  mark('visible-saved-goal-failure-retry-and-clean-session');
  assert.equal((await post('/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true})).status(),201);
  await page.goto(origin+'/member/life-back');await page.locator('#journeyView').waitFor();await page.locator('[data-dialog="goalDialog"]').first().click();
  const goalInput=page.locator('#customGoal'),goalSave=page.locator('#goalForm button[type=submit]');await goalInput.fill('Fictional visible retry');
  await page.route('**/v1/life-back',route=>route.request().method()==='POST'?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'B1 save temporarily unavailable. Please retry.'})}):route.continue());
  await goalSave.click();await page.locator('#goalError').getByText('B1 save temporarily unavailable. Please retry.',{exact:true}).waitFor();assert.equal(await goalInput.inputValue(),'Fictional visible retry');assert(await goalSave.isEnabled());await page.screenshot({path:dir+'/'+name+'-member-save-retry.png',fullPage:true});
  await page.unroute('**/v1/life-back');await goalSave.click();await page.locator('#liveStatus').getByText('Personal goal saved. Your previous history stays in your account.',{exact:true}).waitFor();
  const savedGoal=await context.request.get(origin+'/v1/life-back');assert.equal((await savedGoal.json()).progress.goal,'Fictional visible retry');assert.equal((await state()).myWhy.why,'Fictional network retry');
  await page.reload();await page.locator('[data-area="personal"] .area-name').getByText('Fictional visible retry',{exact:true}).waitFor();
  const freshContext=await browser.newContext({viewport});try{const signed=await freshContext.request.post(origin+'/v1/auth/login',{headers:{Origin:origin},data:{email:f.email,password:fixture.oldPassword}});assert.equal(signed.status(),200);const freshPage=await freshContext.newPage();await freshPage.goto(origin+'/member/life-back');await freshPage.locator('[data-area="personal"] .area-name').getByText('Fictional visible retry',{exact:true}).waitFor();}finally{await freshContext.close()}
  row.checks.push('Protected Life Back form retains input on visible failure; retry, reload and clean browser login read the saved goal; unrelated member-state data survives');
  mark('reset-race-expiry-and-old-session');
  assert.equal((await post('/v1/auth/reset-password',{token:f.expired,password:'B1-expired-must-not-work!'})).status(),400);
  const passwords=['B1-concurrent-password-A!','B1-concurrent-password-B!'],race=await Promise.all(passwords.map(password=>post('/v1/auth/reset-password',{token:f.race,password})));
  assert.deepEqual(race.map(r=>r.status()).sort(),[200,400]);const winning=passwords[race.findIndex(r=>r.status()===200)];
  assert.equal((await context.request.get(origin+'/v1/member-state')).status(),401);assert.equal((await post('/v1/auth/login',{email:f.email,password:fixture.oldPassword})).status(),401);await login(winning);assert.equal((await state()).myWhy.why,'Fictional network retry');row.checks.push('Real D1: exactly one reset winner, expired token rejected, prior session revoked, saved data preserved');
  mark('rendered-reset-failure-retry');await page.goto(origin+'/reset-password.html?token='+encodeURIComponent(f.token));
  const inputs=page.locator('input[type=password]');await inputs.first().waitFor();const newPassword='B1-rendered-'+name+'-password!';for(let i=0;i<await inputs.count();i++)await inputs.nth(i).fill(newPassword);
  row.resetControls=await page.locator('form input,form button').evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,id:n.id,name:n.name,type:n.type,text:n.tagName==='BUTTON'?n.textContent:''})));
  const submit=page.locator('button[type=submit],input[type=submit]').first();
  await page.route('**/v1/auth/reset-password',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,message:'Temporary test failure. Please try again.'})}));
  await submit.click();await page.getByText('Temporary test failure. Please try again.',{exact:false}).waitFor();assert.equal(await inputs.first().inputValue(),newPassword);assert.equal(await submit.isEnabled(),true);await page.screenshot({path:dir+'/'+name+'-reset-retry.png',fullPage:true});
  await page.unroute('**/v1/auth/reset-password');const done=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/auth/reset-password');await submit.click();assert.equal((await done).status(),200);
  await page.waitForURL('**/member-login#sign-in');await page.locator('#previewRegister input[name=password]').waitFor();
  assert.equal((await post('/v1/auth/reset-password',{token:f.token,password:'B1-reuse-must-not-work!'})).status(),400);assert.equal((await post('/v1/auth/login',{email:f.email,password:winning})).status(),401);await login(newPassword);assert.equal((await state()).myWhy.why,'Fictional network retry');
  const retained=await context.request.get(origin+'/v1/life-back'),retainedBody=await retained.json();row.postResetLifeBack={status:retained.status(),error:retainedBody.error||null};assert.equal(retained.status(),200,JSON.stringify(row.postResetLifeBack));assert.equal(retainedBody.progress.goal,'Fictional visible retry');
  row.checks.push('Pinned rendered reset form retains password on visible failure, retries successfully; reused link rejected; ordinary new-password login retains member data');
  mark('rendered-expired-and-reused-link');
  for(const token of [f.token,f.expired]){await page.goto(origin+'/reset-password.html?token='+encodeURIComponent(token));await inputs.first().waitFor();for(let i=0;i<await inputs.count();i++)await inputs.nth(i).fill('B1-link-rejection-password!');const rejected=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/auth/reset-password');await submit.click();assert.equal((await rejected).status(),400);await page.getByText('That reset link has expired or has already been used.',{exact:true}).waitFor();assert(await submit.isEnabled())}
  await page.screenshot({path:dir+'/'+name+'-expired-or-used.png',fullPage:true});row.checks.push('Expired and reused fixture-link forms show the server explanation and permit requesting a fresh link');

  mark('form-width-and-label-regressions');row.layout=[];
  for(const width of [360,768,1024]){await page.setViewportSize({width,height:900});await page.goto(origin+'/reset-password.html?token='+encodeURIComponent(f.token));await inputs.first().waitFor();const layout=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,labels:[...document.querySelectorAll('input[type=password]')].map(x=>!!(x.labels?.length||x.getAttribute('aria-label')||x.getAttribute('aria-labelledby')))}));row.layout.push(layout);if(layout.scroll>layout.width+1)row.overflow=await page.locator('body *').evaluateAll(nodes=>nodes.map(el=>({tag:el.tagName,id:el.id,class:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).filter(r=>r.left<0||r.right>document.documentElement.clientWidth+1));save();assert(layout.scroll<=layout.width+1,'Reset form overflow');assert(layout.labels.every(Boolean),'Password inputs labelled')}
  row.resetPaint=await page.locator('.auth-shell label').first().evaluate(el=>({color:getComputedStyle(el).color,fill:getComputedStyle(el).getPropertyValue('-webkit-text-fill-color')}));assert.equal(row.resetPaint.color,'rgb(231, 227, 218)');assert.equal(row.resetPaint.fill,'rgb(231, 227, 218)');
  await inputs.first().focus();await page.keyboard.press('Tab');assert(await inputs.nth(1).evaluate(el=>el===document.activeElement));await page.keyboard.press('Tab');assert(await submit.evaluate(el=>el===document.activeElement));row.checks.push('Labelled reset controls follow keyboard order: new password, confirmation, submit');
  await page.screenshot({path:dir+'/'+name+'-reset-form.png',fullPage:true});
  row.status='pass';mark('complete');
 }catch(e){row.status='fail';row.error=String(e.stack).replaceAll(fixture.oldPassword,'[redacted]').replaceAll(f.token,'[token-redacted]').replaceAll(f.race,'[token-redacted]');row.body=(await page.locator('body').innerText().catch(()=>'' )).slice(0,2500);await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});console.log(JSON.stringify({name,phase:row.phase,error:row.error}));}
 finally{try{sql(`DROP TRIGGER IF EXISTS ${trigger}`)}catch{}await context.close();await browser.close();save()}
}
report.status=report.cases.every(x=>x.status==='pass')?'pass':'fail';save();assert.equal(report.status,'pass','B1 browser matrix failed; inspect report');
