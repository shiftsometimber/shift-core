const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto');
const {chromium,webkit}=require(process.env.APP_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,dir='work/staging/generated/app-layout-evidence';
assert(/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(base));
const fixture=JSON.parse(fs.readFileSync('work/staging/generated/probe.json'));
const report={source:process.env.GITHUB_SHA,cases:[],productionWrites:0,limits:['Fictional accounts in isolated preview only.','Browser Chromium/WebKit at 390 and 1440px, not signed native apps or physical phones.','Apple Health and Health Connect are interaction prototypes only; no native bridge or health sync is implemented.']};
async function api(ctx,path,body){const r=await ctx.request.fetch(base+path,{method:body?'POST':'GET',headers:{Origin:base},...(body?{data:body}:{}),timeout:45000});assert(r.ok(),path+' '+r.status());return r.json()}
(async()=>{let index=0;try{for(const [engine,name]of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [390,1440]){
 const browser=await engine.launch(),app=await browser.newContext({viewport:{width,height:900}}),web=await browser.newContext({viewport:{width,height:900}}),p=await app.newPage(),w=await web.newPage();
 const row={engine:name,width,checks:[]};report.cases.push(row);
 try{
 const login={email:'probe'+fixture.browserIds[index++]+'@example.invalid',password:fixture.password};await api(app,'/v1/auth/login',login);await api(web,'/v1/auth/login',login);await api(app,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
 let life=await api(app,'/v1/life-back');life=await api(app,'/v1/life-back',{action:'goal',revision:life.progress.revision,goal:'Fictional app layout review',operationId:randomUUID()});life=await api(app,'/v1/life-back',{action:'checkin',goalId:life.progress.goalId,ratings:{energy:40,sleep:60,confidence:60,movement:60,clothes:60,personal:60},win:'',supportNeed:'food',operationId:randomUUID()});
 await p.goto(base+'/member/dashboard?view=app#today',{waitUntil:'domcontentloaded'});await p.locator('#appBottomNav').waitFor();await p.getByText(life.progress.nextShift.title,{exact:true}).filter({visible:true}).first().waitFor({timeout:45000});
 await p.locator('.app-today-grid').waitFor();assert(await p.locator('.mtm-plan').isVisible());assert(await p.locator('.app-life-ring').isVisible());assert.equal(await p.locator('.app-today-shortcuts a').count(),4);if(width===390){const gap=await p.evaluate(()=>document.querySelector('.mtm-week').getBoundingClientRect().top-document.querySelector('.app-life-card').getBoundingClientRect().bottom);assert(gap>=0&&gap<=32,'No empty mobile grid track below Life Back');}
 assert.match(await p.locator('body').evaluate(el=>getComputedStyle(el).fontFamily),/Arial/);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.locator('#appMore').click();assert.equal(await p.locator('#appMore').getAttribute('aria-expanded'),'true');assert(await p.locator('.sst-member-tabs').isVisible());await p.keyboard.press('Escape');assert.equal(await p.locator('#appMore').getAttribute('aria-expanded'),'false');
 assert.equal(await p.locator('.mtm-next').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(231, 227, 218)');
 await p.screenshot({path:dir+'/'+name+'-'+width+'-app-today.png',fullPage:true});
 const mainURL=new URL(p.url()).pathname;let topNavigations=0;const countTop=r=>{if(r.isNavigationRequest()&&r.frame()===p.mainFrame())topNavigations++};p.on('request',countTop);
 await p.locator('#appTab-grub').click();const grubFrame=p.frameLocator('#appTool-grub iframe');await grubFrame.locator('#grubSearch').waitFor({timeout:45000});await grubFrame.locator('#grubSearch').fill('Unfinished meal search');
 assert.equal(new URL(p.url()).pathname,mainURL);assert.equal(await p.locator('#appTab-grub').getAttribute('aria-selected'),'true');assert(await p.locator('.mtm-hero').isVisible());assert(!(await p.locator('.app-today-grid').isVisible()));
 await p.locator('#appTab-fit').click();const fitFrame=p.frameLocator('#appTool-fit iframe');await fitFrame.locator('#fitPrefs').waitFor({timeout:45000});await fitFrame.locator('#fitPrefs').fill('Fictional unfinished workout note');
 await p.locator('#appTab-life-back').click();const lifeFrame=p.frameLocator('#appTool-life-back iframe');await lifeFrame.locator('#journeyView:not([hidden])').waitFor({timeout:45000});await lifeFrame.locator('.area-card').first().click();assert(await lifeFrame.locator('dialog[open]').isVisible());await lifeFrame.locator('dialog[open] [data-close]').first().click();
 await p.locator('#appTab-grub').click();assert.equal(await grubFrame.locator('#grubSearch').inputValue(),'Unfinished meal search');await p.goBack();assert.equal(await p.locator('#appTab-life-back').getAttribute('aria-selected'),'true');await p.goForward();assert.equal(await p.locator('#appTab-grub').getAttribute('aria-selected'),'true');
 await p.locator('#appTab-fit').click();assert.equal(await fitFrame.locator('#fitPrefs').inputValue(),'Fictional unfinished workout note');assert.equal(topNavigations,0,'Tool tabs never navigate the containing page');p.off('request',countTop);
 await p.locator('#appTab-grub').click();await p.screenshot({path:dir+'/'+name+'-'+width+'-inline-grub.png',fullPage:true});
 await p.locator('#appTab-today').click();assert(await p.locator('.app-today-grid').isVisible());assert(!(await p.locator('#appToolPanels').isVisible()));row.checks.push('Inline tool tabs preserve page, header, food search and workout draft; Back/Forward restores tabs; Life Back dialog opens inside panel');

 await w.goto(base+'/member/dashboard?view=web#today',{waitUntil:'domcontentloaded'});await w.getByText(life.progress.nextShift.title,{exact:true}).filter({visible:true}).first().waitFor({timeout:45000});assert.equal(await w.locator('#appBottomNav').count(),0);
 assert.deepEqual((await api(web,'/v1/life-back')).progress,life.progress);row.checks.push('App presentation and existing website render the same saved goal and next step; Arial, no horizontal overflow, More keyboard recovery');
 for(const [ctx,page,view,other,otherPage]of [[app,p,'app',web,w],[web,w,'web',app,p]]){
 const marker='Fictional '+view+' '+randomUUID();await page.goto(base+'/member/check-in?view='+view,{waitUntil:'domcontentloaded'});await page.locator('[data-mood]').first().click();await page.locator('#moodNote').fill(marker);
 const saved=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/check-ins'&&r.request().method()==='POST'&&r.ok(),{timeout:45000});await page.locator('#saveMood').click();await saved;
 await otherPage.reload({waitUntil:'domcontentloaded'});assert(JSON.stringify(await api(other,'/v1/check-ins')).includes(marker),'Other session reads the saved check-in');
 row.checks.push(view+' check-in saved using UI and read through other independently signed-in session after refresh');
 }
 const before=(await api(app,'/v1/life-back')).progress;await api(web,'/v1/life-back',{action:'shift-feedback',shiftId:before.nextShift.id,outcome:'not-fit',operationId:randomUUID()});await p.goto(base+'/member/dashboard?view=app#today',{waitUntil:'domcontentloaded'});const changed=(await api(app,'/v1/life-back')).progress;assert.notEqual(changed.nextShift.detail,before.nextShift.detail);await p.getByText(changed.nextShift.title,{exact:true}).filter({visible:true}).first().waitFor({timeout:45000});
 for(const path of ['/member/grub','/member/fit','/member/life-back','/member/settings']){await p.goto(base+path,{waitUntil:'domcontentloaded'});await p.locator('#appBottomNav').waitFor();
 if(path==='/member/grub'){
  await p.locator('#grubRecommendation .grub-recipe').waitFor({timeout:45000});
  await p.locator('#grubRecommendation .app-screen-details').first().waitFor();
  await p.locator('#grubRecommendation .app-screen-details summary').first().click();
  assert(await p.locator('.grub-pick-why').isVisible());
  await p.locator('#grubRecommendation .app-screen-details summary').first().click();
  await p.locator('#member-food-tab-saved').click();assert(await p.locator('#member-food-panel-saved').isVisible());
  await p.locator('#member-food-tab-discover').click();row.checks.push('Grub data loaded; meal explanation expands; food tabs switch panels');
 }
 if(path==='/member/fit'){
  if(await p.locator('[data-app-fit-setup]:not([open])').count())await p.locator('[data-app-fit-setup]>summary').click();
  await p.locator('#fitGenerate:not([disabled])').waitFor({timeout:45000});
  await p.locator('#fitGenerate').click();await p.locator('.sf-session').first().waitFor({timeout:45000});
  await p.locator('.sf-exercise').first().waitFor();row.checks.push('Fit generates a real fictional plan and renders exercise rows');
 }
 if(path==='/member/settings'){await p.locator('.app-account-details>summary').click();await p.locator('#memberDetailsForm').waitFor();assert(await p.locator('#memberDetailsTitle').isVisible());}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow '+path);
 if(path==='/member/life-back'){
 await p.locator('#journeyView:not([hidden])').waitFor({timeout:45000});
 assert.equal(await p.locator('main').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(5, 5, 5)','Life Back retains dark canvas for its light labels');
 const contrast=await p.locator('#scoreCaption').evaluate(el=>{const rgb=getComputedStyle(el).color.match(/[\d.]+/g).slice(0,3).map(Number);const lum=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};const l=.2126*lum(rgb[0])+.7152*lum(rgb[1])+.0722*lum(rgb[2]);return(l+.05)/(lum(5)+.05)});assert(contrast>=4.5,'Life Back caption contrast');
 await p.locator('.area-card').first().click();assert(await p.locator('dialog[open]').isVisible());await p.screenshot({path:dir+'/'+name+'-'+width+'-life-back-dialog.png',fullPage:true});await p.keyboard.press('Escape');
 row.checks.push('Life Back dark canvas and caption contrast verified; progress card opens its dialog');
 }await p.screenshot({path:dir+'/'+name+'-'+width+'-'+path.split('/').pop()+'.png',fullPage:true});}
 await p.goto(base+'/programme',{waitUntil:'domcontentloaded'});assert.equal(await p.locator('#appBottomNav').count(),0);assert.equal(await p.locator('[data-app-layout]').count(),0);row.checks.push('Layout persists across member routes; public Programme receives no app markup');
 await p.goto(base+'/__app-review');await p.locator('#explainHealth').click();assert.match(await p.locator('#healthExplanation').textContent(),/Nothing was connected or saved/);
 await api(app,'/v1/auth/logout',{});await api(app,'/v1/auth/login',login);assert.deepEqual((await api(app,'/v1/life-back')).progress,changed);row.checks.push('Feedback adaptation visible in app; progress survives new session; health prototype never claims connection');
 }finally{await browser.close()}
}}finally{fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
