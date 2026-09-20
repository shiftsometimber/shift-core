import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const origin=process.env.PREVIEW_URL;
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''),'Isolated preview only');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json'));
const dir='work/staging/generated/five-points-evidence';mkdirSync(dir,{recursive:true});
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),cases:[],failures:[],productionWrites:0,limits:['Fictional accounts only; Chromium and WebKit desktop/phone viewports','Recorded movement and selected food are not verified health outcomes','No claim of physical-device or real-user retention testing']};
const save=()=>writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));
async function api(ctx,path,body){const r=await ctx.request.fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin},...(body?{data:body}:{}),timeout:45000});assert(r.ok(),path+' '+r.status()+(r.ok()?'':' '+await r.text()));return r.json()}
async function login(ctx,id){await api(ctx,'/v1/auth/login',{email:'probe'+id+'@example.invalid',password:fixture.password})}
async function ready(page,path){await page.goto(origin+path,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.body.dataset.memberSession==='ready',null,{timeout:45000});}
async function today(page){await ready(page,'/member/dashboard#today');await page.locator('.mtm-next').waitFor();await page.waitForFunction(()=>document.querySelector('#todayActions')?.dataset.todayDecisionReady==='true');}
const matrix=[['chromium-desktop',chromium,{width:1440,height:1000},'food','helped'],['chromium-phone',chromium,{width:390,height:844},'movement','not-fit'],['webkit-desktop',webkit,{width:1440,height:1000},'movement','helped'],['webkit-phone',webkit,{width:390,height:844},'food','not-tried']];
for(const [index,[name,engine,viewport,topic,outcome]] of matrix.entries()){
 const browser=await engine.launch(),ctx=await browser.newContext({viewport,recordVideo:{dir:dir+'/video',size:viewport}}),page=await ctx.newPage();
 const row={name,topic,outcome,checks:[],errors:[],phase:'login'};report.cases.push(row);
 page.on('pageerror',e=>row.errors.push(e.message));
 await ctx.route('**/*',route=>{const r=route.request();if(new URL(r.url()).origin!==origin&&!['GET','HEAD'].includes(r.method())){row.errors.push('External write blocked: '+new URL(r.url()).pathname);return route.abort()}return route.continue()});
 try{
  await login(ctx,fixture.browserIds[index]);await api(ctx,'/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
  row.phase='first-day';await today(page);assert.equal(await page.locator('.mtm-next .mt-now-action').count(),1);assert.equal(await page.locator('#optional-checkin').getAttribute('open'),null);assert.equal(await page.locator('#more-for-today').getAttribute('open'),null);
  const order=await page.evaluate(()=>{const a=document.querySelector('.mtm-next'),b=document.querySelector('#optional-checkin');return !!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)});assert(order,'Primary action precedes optional mood question');
  await page.locator('.mtm-change-step').click();assert(await page.locator('#more-for-today .mt-real-plan').isVisible());await page.locator('#more-for-today summary').click();
  await page.screenshot({path:dir+'/'+name+'-today.png',fullPage:true});row.checks.push('One primary action before optional check-in; food/movement available without answering mood');
  row.phase='no-questionnaire-start';await page.locator('.mtm-next .mt-now-action').click();await page.waitForURL(/\/(?:member|member-connected)\/grub/);const first=await api(ctx,'/v1/life-back');assert.equal(first.progress.entries.length,0);assert.equal(first.progress.nextShift.kind,'food');
  const firstFeedback=page.locator('#dailyCheckinFollowup');await firstFeedback.locator('summary').waitFor();await firstFeedback.locator('summary').click();await firstFeedback.locator('input[value="not-tried"]').check();await firstFeedback.getByRole('button',{name:'Save feedback',exact:true}).click();await firstFeedback.getByText(/^Feedback saved:/).waitFor();assert.equal((await api(ctx,'/v1/life-back')).progress.entries.length,0);row.checks.push('First action and honest not-tried feedback work without mood, goal or ratings questions');
  row.phase='save-offer';let life=await api(ctx,'/v1/life-back');life=await api(ctx,'/v1/life-back',{action:'goal',revision:life.progress.revision,goal:'Enjoy a family walk',operationId:randomUUID()});
  life=await api(ctx,'/v1/life-back',{action:'checkin',goalId:life.progress.goalId,ratings:{energy:40,sleep:60,confidence:60,movement:60,clothes:60,personal:60},win:'Made time for a short walk',supportNeed:topic,operationId:randomUUID()});
  const before=life.progress,offer=await api(ctx,'/v1/check-ins',{mood:'Good',note:'Fictional review only'}),id=offer.nextStep.id;
  await today(page);assert((await page.locator('.mtm-next').innerText()).includes(before.nextShift.title));
  const link=page.locator('.mtm-next .mt-now-action');assert((await link.getAttribute('href')).includes('step='+id));await link.click();await page.waitForURL(new RegExp('/(?:member|member-connected)/'+(topic==='food'?'grub':'fit')));
  assert.equal((await api(ctx,'/v1/life-back')).progress.nextShift.completedAt,undefined,'Opening never fabricates completion');
  row.phase='use-tool';
  if(topic==='food'){
   await page.waitForFunction(()=>document.querySelector('#grubAccountStatus')?.textContent.includes('up to date'));await page.locator('#grubSearch').fill('chicken');await page.locator('#grubSearchGo').click();await page.locator('#grubDiscoverResults [data-food-today]').first().click();await page.locator('#grubDiscoverResults [data-food-receipt]').first().waitFor({state:'visible'});
  }else{
   await page.locator('#fitGenerate').waitFor();await page.locator('#fitDays').selectOption('1');await page.locator('#fitMinutes').selectOption('10');await page.locator('#fitGenerate').click();await page.locator('.sf-current-step').first().waitFor();await page.locator('.sf-exercise [data-sf-complete="done"]').first().click();await page.waitForFunction(()=>document.querySelector('.sf-exercise[data-completion="done"]'));
  }
  row.phase='feedback-in-tool';const host=page.locator('#dailyCheckinFollowup');await host.locator('summary').waitFor();await host.locator('summary').click();assert((await host.innerText()).includes(before.nextShift.title));
  await host.locator('input[value="'+outcome+'"]').check();await host.getByRole('button',{name:'Save feedback',exact:true}).click();await host.getByText(/^Feedback saved:/).waitFor();
  const saved=await api(ctx,'/v1/check-ins/follow-up?actionId='+id);assert.equal(saved.followUp.feedback,outcome);
  life=await api(ctx,'/v1/life-back');assert.equal(life.progress.entries.length,before.entries.length);assert.equal((life.progress.shiftHistory?.find(a=>a.id===before.nextShift.id)||life.progress.nextShift).reviews.at(-1).outcome,outcome);
  await page.screenshot({path:dir+'/'+name+'-tool-feedback.png',fullPage:true});row.checks.push('Actual tool action and exact saved-step feedback on the same page; no invented reflection or completion');
  row.phase='refresh-and-new-session';const savedURL=page.url();await page.reload();await host.locator('summary').waitFor();await host.locator('summary').click();assert((await host.innerText()).includes('Feedback saved:'));
  await api(ctx,'/v1/auth/logout',{});await login(ctx,fixture.browserIds[index]);await ready(page,new URL(savedURL).pathname+new URL(savedURL).search);await host.locator('summary').waitFor();await host.locator('summary').click();assert((await host.innerText()).includes('Feedback saved:'));
  await today(page);const expected=outcome==='not-fit'?'Review one activity, without committing':before.nextShift.title;assert((await page.locator('.mtm-next').innerText()).includes(expected));
  const size=await page.evaluate(()=>({w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth}));assert(size.s<=size.w+1,'No horizontal overflow');
  await page.screenshot({path:dir+'/'+name+'-returned.png',fullPage:true});row.checks.push('Feedback retained across reload and new login; next recommendation reflects the answer; no horizontal overflow');
  row.phase='standalone-feedback';if(outcome!=='not-tried'){
   await page.locator('.mtm-next .mt-now-action').click();await host.locator('summary').waitFor();await host.locator('summary').click();await host.locator('input[value="not-tried"]').check();await host.getByRole('button',{name:'Save feedback',exact:true}).click();await host.getByText(/^Feedback saved:/).waitFor();assert.equal((await api(ctx,'/v1/life-back')).progress.entries.length,before.entries.length);row.checks.push('Follow-up of the new Life Back action also saves in place without a new questionnaire');
  }
  assert.deepEqual(row.errors,[],'Browser errors');row.status='pass';row.phase='complete';
 }catch(e){row.status='fail';row.error=String(e.stack).replaceAll(fixture.password,'[redacted]');row.url=page.url();row.body=(await page.locator('body').innerText().catch(()=>'' )).slice(0,3500);report.failures.push({name,phase:row.phase,error:row.error});await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{await ctx.close();await browser.close();save();}
}
report.status=report.failures.length?'fail':'pass';save();console.log(JSON.stringify(report,null,2));assert.equal(report.failures.length,0);
