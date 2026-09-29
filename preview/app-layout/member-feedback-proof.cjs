const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.APP_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,dir='work/staging/generated/app-layout-evidence',fixture=JSON.parse(fs.readFileSync('work/staging/generated/probe.json'));
const report={source:process.env.GITHUB_SHA,productionWrites:0,cases:[],limits:['Browser viewports, not physical-device certification.','Ask launcher and install card use fixture controls where the isolated preview omits public integrations.']};
(async()=>{try{for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']]){
 const browser=await engine.launch();try{for(const width of [320,375,1440])for(const view of ['app','web']){
 const ctx=await browser.newContext({viewport:{width,height:812}}),p=await ctx.newPage(),row={engine:name,width,view,checks:[]};report.cases.push(row);
 try{const login=await ctx.request.post(base+'/v1/auth/login',{headers:{Origin:base},data:{email:'probe'+fixture.browserIds[0]+'@example.invalid',password:fixture.password}});assert(login.ok());
 await p.goto(base+'/member/check-in?view='+view);await p.locator('[data-mood]').first().waitFor();await p.locator('[data-consent="necessary"]').click();
 await p.locator('#memberUtilities #sstCookieSettings').waitFor();
 // The preview intentionally omits the public Ask service; test the existing launch-control contract without sending a message.
 await p.evaluate(()=>{if(!document.getElementById('askTimberLaunch')){const b=document.createElement('button');b.id='askTimberLaunch';b.textContent='ASK SHIFT';b.style.cssText='position:fixed;bottom:16px;right:16px';b.onclick=()=>b.dataset.clicked='true';document.body.append(b)}});
 await p.locator('#memberUtilities #askTimberLaunch').waitFor();
 for(const mood of await p.locator('[data-mood]').all()){await mood.scrollIntoViewIfNeeded();assert(await mood.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit)}),'Mood tap unobstructed');}
 for(const id of ['sstCookieSettings','askTimberLaunch'])assert.equal(await p.locator('#'+id).evaluate(el=>getComputedStyle(el).position),'static');
 await p.locator('#sstCookieSettings').click();assert.equal(await p.locator('.cookie-banner-v3a').count(),1);await p.locator('[data-consent="necessary"]').click();await p.locator('#askTimberLaunch').click();
 await p.screenshot({path:dir+'/feedback-'+name+'-'+width+'-'+view+'-checkin.png',fullPage:true});row.checks.push('Every mood option reachable; utilities in document flow; cookie settings still reopen');
 await p.goto(base+'/member/dashboard?view='+view+'#today');await p.locator('#appTab-grub').waitFor({timeout:45000});
 if(view==='app')await p.locator('#appMore').click();
 await p.locator('.member-nav-more>summary').click();
 assert.equal(await p.locator('.member-nav-more>div').evaluate(el=>getComputedStyle(el).position),'static');
 const menu=await p.locator('.member-nav-more>div').boundingBox();const main=await p.locator('main').boundingBox();if(view==='web')assert(main.y>=menu.y+menu.height-1,'Expanded menu reserves space above content');
 row.checks.push('Plans and records expands in flow');await p.screenshot({path:dir+'/feedback-'+name+'-'+width+'-'+view+'-menu.png',fullPage:true});
 await p.goto(base+'/member/grub?view='+view);await p.locator('#grubReload').waitFor();
 const account=p.locator('.app-screen-details').filter({has:p.locator('#grubReload')});if(await account.count()&&!(await p.locator('#grubReload').isVisible()))await account.locator('summary').first().click();
 assert(!(await p.locator('#grubSignOut').isVisible()),'Sign out is not adjacent to Reload');await p.locator('.grub-signout>summary').click();await p.locator('#grubSignOut').waitFor();
 row.checks.push('Sign out requires opening Account actions');await p.screenshot({path:dir+'/feedback-'+name+'-'+width+'-'+view+'-account.png',fullPage:true});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No sideways overflow');row.status='pass';
 }catch(e){row.status='fail';row.error=e.message;await p.screenshot({path:dir+'/feedback-failure.png',fullPage:true}).catch(()=>{});throw e}finally{await ctx.close()}
 }}finally{await browser.close()}
}}finally{fs.writeFileSync(dir+'/member-feedback-report.json',JSON.stringify(report,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
