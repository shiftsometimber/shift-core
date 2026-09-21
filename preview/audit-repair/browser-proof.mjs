import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const origin=process.env.PREVIEW_URL;
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''),'Isolated preview only');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json')),dir='work/staging/generated/five-points-evidence/audit';mkdirSync(dir,{recursive:true});
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),cases:[],productionWrites:0};
const matrix=[['chromium-desktop',chromium,{width:1440,height:1000}],['chromium-phone',chromium,{width:390,height:844}],['webkit-desktop',webkit,{width:1440,height:1000}],['webkit-phone',webkit,{width:390,height:844}]];
for(const [name,engine,viewport]of matrix){
 const browser=await engine.launch(),context=await browser.newContext({viewport}),page=await context.newPage(),row={name,checks:[]};report.cases.push(row);
 try{
  await context.route('**/*',route=>{const r=route.request();return new URL(r.url()).origin!==origin&&!['GET','HEAD'].includes(r.method())?route.abort():route.continue()});
  const login=async()=>{const r=await context.request.post(origin+'/v1/auth/login',{headers:{Origin:origin},data:{email:'probe'+fixture.ids[0]+'@example.invalid',password:fixture.password}});assert(r.ok(),'Fictional login '+r.status())};
  const json=async path=>{const r=await context.request.get(origin+path);assert(r.ok(),path+' '+r.status());return r.json()};
  await login();
  const progress=(await json('/v1/progress/summary')).progress;
  assert.deepEqual(progress.metrics.map(x=>x.key),['weight']);assert.equal(progress.metrics[0].delta,null);assert.equal(progress.units,'stone_lb');row.summary=progress;
  await page.goto(origin+'/member/dashboard#today');await page.waitForFunction(()=>document.body.dataset.memberSession==='ready');
  const link=page.locator('.sst-member-tabs a[href$="/dashboard#visualise"]').first();await link.click();await page.locator('#panel-visualise.active').waitFor();
  const story=page.locator('#shiftProgressStory');await story.getByText('16 st 3.1 lb',{exact:true}).waitFor();assert.equal(await story.locator('.shift-progress-metric').count(),1);assert(!(await story.innerText()).includes('Holding steady'));
  row.colours=await story.locator('.shift-progress-metric').evaluate(el=>({background:getComputedStyle(el).backgroundColor,text:getComputedStyle(el.querySelector('strong')).color}));assert.equal(row.colours.background,'rgb(231, 227, 218)');assert.equal(row.colours.text,'rgb(5, 5, 5)');
  await page.screenshot({path:dir+'/'+name+'-progress.png',fullPage:true});row.checks.push('Actual Progress link, one imperial weight reading, no invented optional readings/trend, approved card colours');
  const retained=await json('/v1/fit/activity');
  await page.goto(origin+'/member/fit');await page.getByRole('heading',{name:'This saved session needs replacing'}).waitFor();assert.equal(await page.locator('.sf-exercise').count(),0);await page.screenshot({path:dir+'/'+name+'-retained-fit.png',fullPage:true});
  await page.reload();await page.getByRole('heading',{name:'This saved session needs replacing'}).waitFor();assert.deepEqual(await json('/v1/fit/activity'),retained);
  const logout=await context.request.post(origin+'/v1/auth/logout',{headers:{Origin:origin},data:{}});assert(logout.ok());await login();await page.reload();await page.getByRole('heading',{name:'This saved session needs replacing'}).waitFor();assert.deepEqual(await json('/v1/fit/activity'),retained);
  row.checks.push('Inconsistent saved Fit blocked after reload and fresh login; stored plan and activity unchanged');row.status='pass';
 }catch(e){row.status='fail';row.navigation=await page.locator('.sst-member-tabs a').evaluateAll(nodes=>nodes.map(a=>({label:a.textContent,href:a.getAttribute('href')}))).catch(()=>[]);row.error=String(e.stack).replaceAll(fixture.password,'[redacted]');await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});}
 finally{await context.close();await browser.close();writeFileSync(dir+'/report.json',JSON.stringify(report,null,2))}
}
assert(report.cases.every(x=>x.status==='pass'),JSON.stringify(report));console.log(JSON.stringify(report,null,2));
