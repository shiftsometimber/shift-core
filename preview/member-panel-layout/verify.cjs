const fs=require('fs'),assert=require('assert/strict'),{createHash}=require('crypto');
const {chromium,webkit}=require(process.env.APP_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,dir='work/staging/generated/member-panel-layout-evidence';
assert(/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(base),'Fictional isolated preview only');
fs.mkdirSync(dir,{recursive:true});
const fixture=JSON.parse(fs.readFileSync('work/staging/generated/probe.json'));
const legacyContextSource=fs.readFileSync('frontend/member/my-timber-v11.js','utf8');
const report={source:process.env.GITHUB_SHA,legacyContextSourceSha256:createHash('sha256').update(legacyContextSource).digest('hex'),cases:[],productionWrites:0};
async function api(ctx,path,body){const r=await ctx.request.fetch(base+path,{method:body?'POST':'GET',headers:{Origin:base},...(body?{data:body}:{}),timeout:45000});assert(r.ok(),path+' '+r.status());return r.json()}
(async()=>{let index=0;const seeded=new Set();try{for(const [engine,name]of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [320,390,430,1440]){
 const browser=await engine.launch(),ctx=await browser.newContext({viewport:{width,height:844}});ctx.setDefaultTimeout(45000);
 // The isolated preview omits this legacy production loader. Run its unchanged
 // source against the fictional API so the real remembered-context path is covered.
 await ctx.addInitScript({content:legacyContextSource});const p=await ctx.newPage();
 const row={engine:name,width,checks:[],tools:[]};report.cases.push(row);
 try{
 await api(ctx,'/v1/auth/login',{email:'probe'+fixture.ids[index++%fixture.ids.length]+'@example.invalid',password:fixture.password});
 // Separate fictional cohort keeps the full fresh-account proof independent.
  await api(ctx,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
  const account=fixture.ids[(index-1)%fixture.ids.length];
  if(!seeded.has(account)){const now=new Date(),plan=await ctx.request.post(base+'/v1/fit/plan',{headers:{Origin:base,'X-Shift-Local-Date':now.toISOString().slice(0,10),'X-Shift-Local-Hour':String(now.getUTCHours())},data:{days:1,minutes_per_day:20,location:'home',equipment:'none'},timeout:45000});assert(plan.ok(),'Seed real fictional Fit plan '+plan.status());seeded.add(account);}
  await p.goto(base+'/member/check-in?view=app',{waitUntil:'domcontentloaded'});
 if(await p.locator('[data-consent="necessary"]').isVisible())await p.locator('[data-consent="necessary"]').click();
 await p.locator('[data-mood]').first().click();await p.locator('#moodNote').fill('Fictional recent check-in for panel layout');
 const saved=p.waitForResponse(r=>new URL(r.url()).pathname==='/v1/check-ins'&&r.request().method()==='POST');await p.locator('#saveMood').click();
  const healthChoice=p.getByRole('checkbox',{name:/I explicitly consent/});
  if(await Promise.race([saved.then(()=>false),healthChoice.waitFor({state:'visible'}).then(()=>true)])){await healthChoice.check();await p.getByRole('button',{name:'Agree & continue',exact:true}).click();}
  assert((await saved).ok());
 await p.goto(base+'/member/dashboard?view=app#today',{waitUntil:'domcontentloaded'});
 await p.locator('#sstTodayContext').waitFor();await p.locator('#appTab-grub').waitFor();
 const remembered=await p.locator('#sstTodayContext').textContent(),records=await api(ctx,'/v1/check-ins');
 for(const key of ['grub','fit','life-back']){
  await p.locator('#appTab-'+key).click();await p.waitForFunction(()=>scrollY===0);const frame=p.frameLocator('#appTool-'+key+' iframe');await frame.locator('main').waitFor();
  const ready=key==='grub'?'#grubSearch':key==='fit'?'#fitPrefs':'#journeyView:not([hidden])';await frame.locator(ready).waitFor({state:key==='fit'?'attached':'visible'});
  if(key==='grub')await frame.locator('#grubSearch').fill('Unfinished layout-check search');
  if(key==='fit'){await frame.locator('[data-app-fit-setup]').waitFor({state:'attached'});if(await frame.locator('[data-app-fit-setup]:not([open])').count())await frame.locator('[data-app-fit-setup]>summary').click();await frame.locator('#fitPrefs').waitFor({state:'visible'});await frame.locator('#fitPrefs').fill('Unfinished layout-check workout notes');}
  await p.waitForFunction(key=>{const f=document.querySelector('#appTool-'+key+' iframe'),main=f?.contentDocument?.querySelector('main');return f&&main&&f.clientHeight>=main.getBoundingClientRect().bottom-1},key);
  const bounds=await p.evaluate(key=>{const tab=document.querySelector('.app-today-shortcuts').getBoundingClientRect(),f=document.querySelector('#appTool-'+key+' iframe'),d=f.contentDocument,main=d.querySelector('main').getBoundingClientRect();return{gap:f.getBoundingClientRect().top-tab.bottom,minimum:getComputedStyle(document.getElementById('todayActions')).minHeight,outerScroll:scrollY,innerScroll:f.contentWindow.scrollY,mainTop:main.top,mainBottom:main.bottom,frameHeight:f.clientHeight,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,childWidth:d.documentElement.scrollWidth,childViewport:f.contentWindow.innerWidth,roots:[d.documentElement,d.body].map(e=>{const s=f.contentWindow.getComputedStyle(e),r=e.getBoundingClientRect();return{tag:e.tagName,width:r.width,right:r.right,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,cssWidth:s.width,minWidth:s.minWidth,maxWidth:s.maxWidth,padding:s.padding,margin:s.margin,overflowX:s.overflowX}}),scrollOverflows:[...d.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+1).slice(0,16).map(e=>{const s=f.contentWindow.getComputedStyle(e);return{tag:e.tagName,id:e.id,class:e.className,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,overflowX:s.overflowX,whiteSpace:s.whiteSpace,minWidth:s.minWidth}}),overflowText:(()=>{const out=[],walker=d.createTreeWalker(d.body,4);while(walker.nextNode()&&out.length<12){const n=walker.currentNode;if(!n.textContent.trim()||!n.parentElement.getClientRects().length)continue;const r=d.createRange();r.selectNodeContents(n);for(const box of r.getClientRects())if(box.right>f.contentWindow.innerWidth+1){out.push({tag:n.parentElement.tagName,id:n.parentElement.id,class:n.parentElement.className,text:n.textContent.trim().slice(0,100),right:box.right,overflowWrap:getComputedStyle(n.parentElement).overflowWrap});break}}return out})(),overflows:[...d.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<-1||r.right>f.contentWindow.innerWidth+1)}).slice(0,12).map(e=>({tag:e.tagName,id:e.id,class:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))}},key);
  assert(bounds.gap>=0&&bounds.gap<=20,'Tool immediately follows tabs: '+JSON.stringify(bounds));assert.equal(bounds.minimum,'0px');assert.equal(bounds.innerScroll,0);assert(bounds.mainTop>=-1);assert(bounds.frameHeight>=bounds.mainBottom-1);assert(bounds.scrollWidth<=bounds.viewport+1);assert(bounds.childWidth<=bounds.childViewport+1,'Embedded content must fit: '+JSON.stringify(bounds));
  assert(!(await p.locator('#sstTodayContext').isVisible()));assert(!(await p.locator('#sstTreatmentJourney').isVisible()));assert(!(await p.locator('#sstFiveLoops').isVisible()));
  await p.evaluate(key=>document.querySelector('#appTool-'+key+' iframe').contentWindow.scrollTo(0,300),key);
  await p.waitForFunction(key=>document.querySelector('#appTool-'+key+' iframe').contentWindow.scrollY===0,key);
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:dir+'/'+name+'-'+width+'-'+key+'.png'});row.tools.push({key,...bounds});
  await p.evaluate(()=>scrollTo({top:300,behavior:'instant'}));await p.waitForFunction(()=>scrollY>0);
 }
 await p.locator('#appTab-grub').click();assert.equal(await p.frameLocator('#appTool-grub iframe').locator('#grubSearch').inputValue(),'Unfinished layout-check search');
 await p.locator('#appTab-fit').click();assert.equal(await p.frameLocator('#appTool-fit iframe').locator('#fitPrefs').inputValue(),'Unfinished layout-check workout notes');
 await p.goBack();assert.equal(await p.locator('#appTab-grub').getAttribute('aria-selected'),'true');await p.goForward();assert.equal(await p.locator('#appTab-fit').getAttribute('aria-selected'),'true');
 await p.locator('#appTab-today').click();assert(await p.locator('#sstTodayContext').isVisible());assert.equal(await p.locator('#sstTodayContext').textContent(),remembered);assert.deepEqual(await api(ctx,'/v1/check-ins'),records,'Tab changes do not alter check-ins');
 row.checks.push('Recent check-in context belongs to Today; no empty banner or minimum-height gap; tool content starts at top; one outer scroll; drafts and history retained; saved check-ins unchanged');
 }catch(e){row.error=e.message;await p.screenshot({path:dir+'/'+name+'-'+width+'-failure.png',fullPage:false}).catch(()=>{});throw e}finally{await browser.close()}
 }}finally{fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
