const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const {chromium,webkit}=require(process.env.APP_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,dir='work/staging/generated/book-voice-evidence';
assert.equal(base,'https://shift-book-voice-a9c990.matobrien.workers.dev');
fs.mkdirSync(dir,{recursive:true});
const edits=JSON.parse(fs.readFileSync('editorial/book-voice/edits.json'));
const fixture=JSON.parse(fs.readFileSync('work/staging/generated/probe.json'));
const report={source:process.env.GITHUB_SHA,productionWrites:0,approvedEdits:23,cases:[],copy:[],limits:['Fictional accounts in separate preview databases.','Chromium/WebKit at phone and desktop widths; not physical phones or native apps.']};
async function api(ctx,path,body){const r=await ctx.request.fetch(base+path,{method:body?'POST':'GET',headers:{Origin:base},...(body?{data:body}:{}),timeout:45000});assert(r.ok(),path+' '+r.status());return r.json()}
async function consent(page){if(await page.locator('[data-consent="necessary"]').isVisible().catch(()=>false))await page.locator('[data-consent="necessary"]').click()}
async function layout(page,row,label){await consent(page);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow');
 const clipped=await page.locator('main button,main a.btn,main [role="button"]').evaluateAll(els=>els.filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&el.scrollWidth>el.clientWidth+2).map(el=>el.textContent.trim()));assert.deepEqual(clipped,[],label+' clipped controls');
 await page.screenshot({path:dir+'/'+row.engine+'-'+row.width+'-'+label+'.png',fullPage:true});row.checks.push(label+': no horizontal overflow or clipped controls');}
(async()=>{let index=0;const {applyBookVoiceCopy,restoreBookVoiceCopy}=await import('../../book-voice.mjs');
 try{
 const baseline=JSON.parse(fs.readFileSync('work/staging/generated/public-baseline.json'));
 const news=baseline.pages.find(p=>p.path.startsWith('/medicine-news/')&&p.before.includes(edits.find(e=>e.kind==='news').old));assert(news,'Current news article with SHIFT take label');
 const paths=[...new Set(edits.filter(e=>e.kind==='public').map(e=>e.route)),news.path,'/member/saved','/member/grub','/assets/member-experience/grub.mjs','/assets/member-experience/fit.mjs','/assets/member-experience/checkin-followup.mjs'];
 const coverage=new Set();
 for(const path of paths){const response=await fetch(base+path);assert.equal(response.status,200,path);const actual=await response.text();
  for(const [i,e]of edits.entries()){
   const target=e.kind==='news'?news.path:e.kind==='public'||e.source==='member-experience/entry.mjs'?e.route:e.source==='member-experience/grub-runtime.mjs'&&e.old.startsWith('Updating a meal')?'/member/grub':'/assets/member-experience/'+(e.source.includes('checkin-followup')?'checkin-followup':e.source.includes('grub')?'grub':'fit')+'.mjs';
   if(target!==path)continue;assert(actual.includes(e.new),'Missing approved wording '+i+' '+path);assert(!actual.includes(e.old),'Old wording '+i+' '+path);coverage.add(i);
  }
  if(path.endsWith('.mjs'))new vm.Script(actual);
  const before=baseline.pages.find(p=>p.path===path)?.before;if(before){const after=applyBookVoiceCopy(path,before);assert.equal(restoreBookVoiceCopy(path,after),before,'Complete public document preservation: '+path);const fragments=s=>[...s.matchAll(/<(?:script|form|header|nav|footer)\b[\s\S]*?<\/(?:script|form|header|nav|footer)>/gi)].map(m=>m[0]);assert.deepEqual(fragments(after),fragments(before),'Scripts/forms/navigation/footer untouched '+path)}
  report.copy.push({path,status:response.status,expectedTextPresent:true});
 }
 assert.equal(coverage.size,23,'All approved edits must actually be served');report.coverage=[...coverage].sort((a,b)=>a-b);
 for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [390,1440]){
  const browser=await engine.launch(),ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage(),row={engine:name,width,checks:[]};report.cases.push(row);ctx.setDefaultTimeout(45000);
  try{
   for(const path of ['/about','/life-back','/articles/food-noise-after-stopping-glp1','/programme','/shift-health',news.path]){await page.goto(base+path,{waitUntil:'domcontentloaded'});await layout(page,row,path.slice(1).replaceAll('/','-'));}
   await api(ctx,'/v1/auth/login',{email:'probe'+fixture.browserIds[index++]+'@example.invalid',password:fixture.password});await api(ctx,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
   await page.goto(base+'/member/grub?view=web',{waitUntil:'domcontentloaded'});await page.locator('#grubSearch').waitFor();await consent(page);
   await page.getByText('No meals planned yet. Build a plan or choose a day from any recipe.',{exact:true}).waitFor({state:'attached'});await page.getByText('Your shopping list is empty.',{exact:false}).waitFor({state:'attached'});await layout(page,row,'signed-in-grub');
   await page.goto(base+'/member/fit?view=web',{waitUntil:'domcontentloaded'});if(await page.locator('[data-app-fit-setup]:not([open])').count())await page.locator('[data-app-fit-setup]>summary').click();await page.locator('#fitGenerate:not([disabled])').waitFor();await page.locator('#fitGenerate').click();await page.locator('.sf-session').first().waitFor();assert((await page.locator('#fitStatus').textContent()).includes('Your plan is ready. Read through the exercises and swap any that don’t suit you.'));await layout(page,row,'signed-in-fit');
   await page.goto(base+'/member/check-in?view=web',{waitUntil:'domcontentloaded'});await page.locator('[data-mood]').first().click();await page.locator('#moodNote').fill('Fictional voice review: food step');const saved=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/check-ins'&&r.request().method()==='POST');await page.locator('#saveMood').click();assert((await saved).ok());await page.getByText(edits[13].new,{exact:true}).waitFor();await layout(page,row,'signed-in-check-in-saved');
   const next=await api(ctx,'/v1/check-ins/follow-up');assert(next.followUp?.id,'Saved next step exists');const dest=new URL(next.followUp.action.href,base);dest.searchParams.set('step',next.followUp.id);dest.hash='dailyCheckinFollowup';await page.goto(dest.href,{waitUntil:'domcontentloaded'});await page.getByText(edits[14].new,{exact:true}).waitFor();await layout(page,row,'signed-in-follow-up');await page.locator('input[name="dailyFeedback"][value="not-tried"]').check();const feedback=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/check-ins/follow-up'&&r.request().method()==='POST');await page.getByRole('button',{name:'Save feedback',exact:true}).click();assert((await feedback).ok());await page.reload({waitUntil:'domcontentloaded'});assert.equal((await api(ctx,'/v1/check-ins/follow-up')).followUp.feedback,'not-tried');row.checks.push('Check-in UI saves next step; optional feedback records not-tried and survives reload');
   await page.goto(base+'/member/saved?view=web',{waitUntil:'domcontentloaded'});await page.getByText(edits[22].new,{exact:true}).waitFor();await layout(page,row,'signed-in-saved');
   await api(ctx,'/v1/auth/logout',{});const guest=await ctx.request.get(base+'/v1/check-ins');assert.equal(guest.status(),401);row.checks.push('Signed-out gate still rejects private records');
  }catch(e){row.error=e.message;await page.screenshot({path:dir+'/'+name+'-'+width+'-failure.png',fullPage:true}).catch(()=>{});throw e}finally{await browser.close()}
 }
 }finally{fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
