const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto');
const {chromium,webkit}=require(process.env.GROWTH_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,dir='work/staging/generated/growth-evidence';
assert(/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(base));
const fixture=JSON.parse(fs.readFileSync('work/staging/generated/probe.json'));
const report={commit:process.env.GITHUB_SHA,at:new Date().toISOString(),productionWrites:0,cases:[],limits:['Desktop and phone viewports, not physical devices.','Fictional preview persistence, not production acceptance.','Public sign-up, payments, real email delivery and full release matrix are not claimed by these checks.']};
async function api(ctx,path,body){const r=await ctx.request.fetch(base+path,{method:body?'POST':'GET',headers:{Origin:base},...(body?{data:body}:{}),timeout:45000});assert(r.ok(),path+' '+r.status());return r.json();}
(async()=>{
let index=0;
for(const [engine,name]of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [390,1440]){
 const browser=await engine.launch(),ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage(),row={engine:name,width,checks:[]};report.cases.push(row);
 await ctx.route('**/*',route=>{const r=route.request();if(new URL(r.url()).origin!==base&&!['GET','HEAD'].includes(r.method()))return route.abort();return route.continue()});
 try{
  for(const path of ['/programme','/help']){
   const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
   await page.locator(path==='/programme'?'[data-growth-week]':'[data-growth-promise]').waitFor();
   assert.equal(await page.locator('h1').count(),1);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(await page.locator('.desktop-nav a').count(),5);
   const newLink=page.locator(path==='/programme'?'.growth-week a':'.growth-promise a').first();
   assert.equal(await newLink.evaluate(el=>getComputedStyle(el).color),'rgb(231, 227, 218)','New links retain cream contrast');
   await page.screenshot({path:dir+'/'+name+'-'+width+path.replaceAll('/','-')+'.png',fullPage:true});
   const menu=page.locator('.menu-trigger');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
   row.checks.push(path+': content, one H1, no horizontal overflow, five nav links and menu open/close');
  }
  const user=fixture.browserIds[index++],login=()=>api(ctx,'/v1/auth/login',{email:'probe'+user+'@example.invalid',password:fixture.password});
  await login();await api(ctx,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
  let life=await api(ctx,'/v1/life-back');life=await api(ctx,'/v1/life-back',{action:'goal',revision:life.progress.revision,goal:'Enjoy a family walk',operationId:randomUUID()});
  life=await api(ctx,'/v1/life-back',{action:'checkin',goalId:life.progress.goalId,ratings:{energy:40,sleep:60,confidence:60,movement:60,clothes:60,personal:60},win:'',supportNeed:'food',operationId:randomUUID()});
  for(const outcome of ['not-fit','not-fit','helped']){
   const before=life.progress.nextShift;
   const saved=await api(ctx,'/v1/check-ins',{mood:'Good',note:'Fictional preview check'});
   assert.equal(saved.nextStep.action.loopId,before.id);
   await api(ctx,'/v1/check-ins/follow-up',{actionId:saved.nextStep.id,revision:saved.nextStep.revision,outcome});
   await api(ctx,'/v1/auth/logout',{});await login();
   const returned=await api(ctx,'/v1/check-ins/follow-up?actionId='+saved.nextStep.id);assert.equal(returned.followUp.feedback,outcome);
   life=await api(ctx,'/v1/life-back');
   if(outcome==='not-fit')assert.notEqual(life.progress.nextShift.detail,before.detail);else assert.equal(life.progress.nextShift.detail,before.detail);
   assert.equal(life.progress.entries.length,1);assert.equal(life.progress.nextShift.completedAt,undefined);
  }
  await page.goto(base+'/member/dashboard#today',{waitUntil:'domcontentloaded'});
  await page.getByText(life.progress.nextShift.title,{exact:true}).first().waitFor({timeout:45000});
  await page.screenshot({path:dir+'/'+name+'-'+width+'-returned-next-shift.png',fullPage:true});
  row.checks.push('Two negative daily reviews change the task; helpful feedback retains adjusted task; linked feedback survives logout/login; Today displays saved result; no invented reflection or completion');
  const emailProbes=[];page.on('request',request=>{if(new URL(request.url()).pathname==='/v1/member/details/email-change')emailProbes.push(request.url())});
  await page.goto(base+'/member/settings',{waitUntil:'domcontentloaded'});
  await page.locator('#memberDetailsForm[data-bound="true"]').waitFor();
  assert.equal(await page.locator('#memberEmailChangePanel').getAttribute('data-email-change-enabled'),'false');
  assert.equal(await page.locator('#memberEmailChangePanel').isVisible(),false);
  assert.notEqual(await page.locator('#memberEmail').getAttribute('readonly'),null);
  await page.waitForTimeout(500);assert.deepEqual(emailProbes,[],'Disabled feature must not generate an email-change request');
  await page.screenshot({path:dir+'/'+name+'-'+width+'-settings-capability.png',fullPage:true});
  row.checks.push('Settings retains read-only email and does not probe the disabled email-change endpoint');row.status='pass';
 }catch(e){row.status='fail';row.error=String(e.stack).replaceAll(fixture.password,'[redacted]');await page.screenshot({path:dir+'/'+name+'-'+width+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{await ctx.close();await browser.close();fs.writeFileSync(dir+'/verification.json',JSON.stringify(report,null,2));}
}
assert(report.cases.every(x=>x.status==='pass'),JSON.stringify(report.cases));
console.log('PASS four browser contexts and isolated persisted negative-feedback journeys');
})().catch(e=>{console.error(e);process.exitCode=1});
