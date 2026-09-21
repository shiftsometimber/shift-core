import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const origin=process.env.PREVIEW_URL,fixture=JSON.parse(readFileSync('work/staging/generated/probe.json')),dir='work/staging/generated/five-points-evidence/launch';
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''));mkdirSync(dir,{recursive:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGMsKE9iIAUwkaR6VMOohiGlAQAhWAFpdf7BsgAAAABJRU5ErkJggg==','base64');
const report={source:process.env.GITHUB_SHA,checkedAt:new Date().toISOString(),cases:[],productionWrites:0,externalPaymentProviderTested:false};
const write=()=>writeFileSync(dir+'/browser-report.json',JSON.stringify(report,null,2));
for(const [name,engine,viewport]of [['chromium-desktop',chromium,{width:1440,height:1000}],['chromium-phone',chromium,{width:390,height:844}],['webkit-desktop',webkit,{width:1440,height:1000}],['webkit-phone',webkit,{width:390,height:844}]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport}),page=await context.newPage(),row={name,checks:[]};report.cases.push(row);context.setDefaultTimeout(30000);
 let release;const ready=new Promise(resolve=>release=resolve);
 const deadline=setTimeout(()=>{release();context.close().catch(()=>{});browser.close().catch(()=>{})},240000);
 const phase=s=>{row.phase=s;write();console.log(name+': '+s)};
 try{
  await context.route('**/*',route=>new URL(route.request().url()).origin!==origin&&!['GET','HEAD'].includes(route.request().method())?route.abort():route.continue());
  const login=async(c=context,index=0)=>{const r=await c.request.post(origin+'/v1/auth/login',{headers:{Origin:origin},data:{email:'probe'+fixture.ids[index]+'@example.invalid',password:fixture.password}});assert.equal(r.status(),200)};
  await login();
  await context.request.post(origin+'/v1/consents',{headers:{Origin:origin},data:{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true}});
  phase('delayed-photo-controller');
  await page.route('**/member-product-v33d.js*',async route=>{await ready;await route.continue()});
  await page.goto(origin+'/member/dashboard#visualise',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.dataset.memberSession==='ready');
  assert(await page.locator('#photoInput').isDisabled(),'cannot select a photo before handler readiness');
  await page.screenshot({path:dir+'/'+name+'-photo-loading.png',fullPage:true});release();
  await page.waitForFunction(()=>document.querySelector('#photoInput')?.dataset.photoReady==='true');
  assert(await page.locator('#photoInput').isEnabled());await page.unroute('**/member-product-v33d.js*');
  row.checks.push('Slow controller load cannot lose a selection; control enables only after binding');
  phase('photo-error-and-retry');
  await page.locator('#photoInput').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await page.locator('#visualStatus').getByText(/could not open that photo/).waitFor();
  await page.locator('#photoInput').setInputFiles({name:'fictional.png',mimeType:'image/png',buffer:png});
  await page.waitForFunction(()=>{const p=document.querySelector('#photoPreview');return p?.complete&&p.naturalWidth>0&&getComputedStyle(p).display!=='none'});
  await page.locator('#savePhotoConsent').check();
  await page.route('**/v1/shift/progress-photo',r=>r.request().method()==='POST'?r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,message:'Fictional temporary save failure. Please retry.'})}):r.continue());
  await page.locator('#saveOriginal').click();await page.locator('#visualStatus').getByText(/temporary save failure/).waitFor();assert(await page.locator('#saveOriginal').isEnabled());
  await page.unroute('**/v1/shift/progress-photo');
  const saved=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/shift/progress-photo'&&r.request().method()==='POST');await page.locator('#saveOriginal').click();const response=await saved;assert.equal(response.status(),201);const id=(await response.json()).photo.id;
  await page.locator('#visualStatus').getByText(/saved to My Shift/i).waitFor();await page.locator(`[data-photo-id="${id}"]`).waitFor();
  await page.reload();await page.locator(`[data-photo-id="${id}"]`).waitFor();
  await context.request.post(origin+'/v1/auth/logout',{headers:{Origin:origin},data:{}});await login();await page.reload();await page.locator(`[data-photo-id="${id}"]`).waitFor();
  const other=await browser.newContext();try{await login(other,1);assert.equal((await other.request.get(origin+`/v1/shift/progress-photo/${id}/image`)).status(),404)}finally{await other.close()}
  await page.screenshot({path:dir+'/'+name+'-photo-retained.png',fullPage:true});
  await page.locator(`[data-photo-delete="${id}"]`).click();await page.locator('#visualStatus').getByText('Photo deleted.',{exact:true}).waitFor();await page.reload();assert.equal((await context.request.get(origin+`/v1/shift/progress-photo/${id}/image`)).status(),404);
  row.checks.push('Corrupt file explains failure; valid retry, failed-save retry, reload, fresh login, cross-account rejection and durable deletion pass');
  phase('orlistat-pack-accuracy');
  await page.goto(origin+'/treatment-order?medicine=orlistat&view=spec&from=treatment-centre');
  await page.locator('[data-op-price]').getByText('£79.00',{exact:true}).waitFor();
  assert.match(await page.locator('.op-lead').innerText(),/may not match every format, access or budget/);assert.equal(await page.locator('.op-recommendation strong').innerText(),'THIS OPTION');
  await page.locator('input[name="treatment-stage"][value="continuing"]').check();
  for(const [count,amount]of [[42,'£59.00'],[84,'£79.00'],[168,'£129.00'],[42,'£59.00']]){
   const value=await page.locator('[data-dose-select] option').evaluateAll((nodes,n)=>nodes.find(o=>o.textContent.includes(n+' capsules'))?.value,count);assert(value);
   await page.locator('[data-dose-select]').selectOption(value);
   await page.locator('[data-op-price]').getByText(amount,{exact:true}).waitFor();
   assert.match(await page.locator('[data-receipt-list]').innerText(),new RegExp(count+' capsules'));
   assert.equal(await page.locator('.op-price small').innerText(),'PACK PRICE');
   assert.match(await page.locator('[data-summary-dose]').textContent(),new RegExp(count+' capsules'));
   assert.equal(await page.locator('[data-stock-status]').innerText(),'No stock available today');
  }
  await page.reload();await page.locator('[data-op-price]').getByText('£59.00',{exact:true}).waitFor();assert.match(await page.locator('[data-receipt-list]').innerText(),/42 capsules/);
  await page.screenshot({path:dir+'/'+name+'-orlistat.png',fullPage:true});row.checks.push('42/84/168 pack, configured price, receipt and reload agree; exact OOS retained');
  phase('centre-claims');await page.goto(origin+'/treatment-centre');
  assert.equal(await page.getByText('Use the free Health MOT to organise your current picture and identify sensible priorities.',{exact:true}).count(),0);
  assert.equal(await page.locator('.treatment-card').filter({hasText:'Emerging treatments'}).filter({hasText:'Orforglipron'}).count(),0);
  const mot=page.getByRole('link',{name:'Explore the Health MOT',exact:true});assert.equal(await mot.getAttribute('href'),'/shift-health/health-mot');
  row.checks.push('Home-test CTA describes its actual destination; authorised Foundayo removed from research-only grouping');
  row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert(row.overflow<=1,'Centre root overflow');
  row.status='pass';phase('complete');
 }catch(e){row.status='fail';row.error=String(e.stack).replaceAll(fixture.password,'[redacted]');await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});console.error(row.error)}
 finally{release();clearTimeout(deadline);await context.close().catch(()=>{});await browser.close().catch(()=>{});write()}
}
assert(report.cases.every(r=>r.status==='pass'),'Launch preview browser matrix failed');
