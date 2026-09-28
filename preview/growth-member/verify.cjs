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
  await page.goto(base+'/mens-mental-health',{waitUntil:'domcontentloaded'});
  await page.locator('.shift-guided-front__inner').waitFor();
  const alignment=await page.evaluate(()=>{
   const root=document.querySelector('.shift-guided-front__inner'),intro=document.querySelector('.shift-guided-intro'),r=root.getBoundingClientRect(),p=intro.getBoundingClientRect(),h=root.querySelector('h1').getBoundingClientRect();
   return {heading:getComputedStyle(root.querySelector('h1')).textAlign,intro:getComputedStyle(intro).textAlign,headingOffset:Math.abs((h.left+h.right)/2-(r.left+r.right)/2),rootOffset:Math.abs((r.left+r.right)/2-document.documentElement.clientWidth/2),introOffset:Math.abs((p.left+p.right)/2-(r.left+r.right)/2),overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  assert.equal(alignment.heading,'center');assert.equal(alignment.intro,'center');assert(alignment.rootOffset<2,JSON.stringify(alignment));assert(alignment.introOffset<2);assert(alignment.headingOffset<2);assert(!alignment.overflow);
  assert.equal(await page.locator('.shift-guided-card').count(),4);
  assert.equal(await page.locator('.shift-guided-card').first().evaluate(el=>getComputedStyle(el).alignItems),'center');
  assert(await page.locator('.shift-guided-kicker').evaluate(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return Math.abs((r.left+r.right-p.left-p.right)/2)<2}));
  assert.equal(await page.locator('.shift-guided-alert a').getAttribute('href'),'/mental-health/urgent-mental-health-help');
  await page.screenshot({path:dir+'/'+name+'-'+width+'-good-to-talk.png',fullPage:true});
  await page.locator('.shift-guided-library summary').click();assert(await page.locator('.shift-guided-library').evaluate(el=>el.open));
  row.checks.push('Good to Talk: centred heading, intro and layout; no overflow; four support choices, urgent link and library disclosure preserved');
  for(const path of ['/clinic-gone-quiet','/provider-switch']){
   const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
   assert.equal(await page.locator('[data-growth-continuity]').count(),1);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('[data-continuity-primary]').getAttribute('href'),'/member/dashboard?entry=continuity#today');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:dir+'/'+name+'-'+width+path.replaceAll('/','-')+'.png',fullPage:true});
  }
  await page.locator('[data-continuity-primary]').click();
  const signIn=page.locator('#memberSessionStatus a');await signIn.waitFor();
  assert.equal(new URL(await signIn.getAttribute('href'),base).searchParams.get('returnTo'),'/member/dashboard?entry=continuity#today');
  await signIn.click();const returnLogin=page.url();
  const user=fixture.browserIds[index++],login=()=>api(ctx,'/v1/auth/login',{email:'probe'+user+'@example.invalid',password:fixture.password});
  await login();await page.goto(returnLogin,{waitUntil:'domcontentloaded'});
  await page.waitForURL(base+'/member/dashboard?entry=continuity#today');
  await page.locator('#continuityWelcome').waitFor();
  const initialLife=await api(ctx,'/v1/life-back');
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continuityWelcome').waitFor();
  assert.deepEqual((await api(ctx,'/v1/life-back')).progress,initialLife.progress,'Opening and refreshing Continuity must not write progress');
  row.checks.push('Continuity public CTA preserves chosen Today route through signed-out gate and restored session; no record written on arrival or refresh');
  await api(ctx,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
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
  const savedProgress=life.progress;
  await page.goto(base+'/clinic-gone-quiet',{waitUntil:'domcontentloaded'});await page.locator('[data-continuity-primary]').click();
  await page.locator('#continuityWelcome').waitFor();await page.getByText(life.progress.nextShift.title,{exact:true}).first().waitFor({timeout:45000});
  assert.deepEqual((await api(ctx,'/v1/life-back')).progress,savedProgress,'Returning from Continuity retains goal, check-ins and current step');
  assert.equal(await page.locator('#continuityWelcome').count(),1);
  await page.screenshot({path:dir+'/'+name+'-'+width+'-continuity-today.png',fullPage:true});
  row.checks.push('Returning Continuity member sees existing Next Shift and retains saved goal, check-ins and linked feedback without restarting');
  row.checks.push('Two negative daily reviews change the task; helpful feedback retains adjusted task; linked feedback survives logout/login; Today displays saved result; no invented reflection or completion');row.status='pass';
 }catch(e){row.status='fail';row.error=String(e.stack).replaceAll(fixture.password,'[redacted]');await page.screenshot({path:dir+'/'+name+'-'+width+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{await ctx.close();await browser.close();fs.writeFileSync(dir+'/verification.json',JSON.stringify(report,null,2));}
}
assert(report.cases.every(x=>x.status==='pass'),JSON.stringify(report.cases));
console.log('PASS four browser contexts and isolated persisted negative-feedback journeys');
})().catch(e=>{console.error(e);process.exitCode=1});
