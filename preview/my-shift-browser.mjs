import http from 'node:http';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from '/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
import {memberExperienceRoutes} from '../member-experience/entry.mjs';
let mode='action';const calls=[],checks=[];
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');calls.push({path:url.pathname,method:req.method});let r;
 if(url.pathname.startsWith('/v1/')){
  if(mode==='signedout')r=Response.json({error:'authentication_required'},{status:401});
  else if(url.pathname==='/v1/me')r=Response.json({user:{id:1,firstName:'QA'}});
  else if(url.pathname==='/v1/member/details')r=Response.json({ok:true,details:{firstName:'QA',lastName:'Fictional',email:'qa@example.invalid'},revision:'1'});
  else if(url.pathname==='/v1/treatment/orders')r=mode==='error'?Response.json({error:'unavailable'},{status:503}):Response.json({ok:true,orders:mode==='empty'?[]:[{orderNumber:'TEST-PRIVATE-1',medicineName:'<img src=x onerror=alert(1)>',strengthLabel:'Test only',clinicalStatus:mode==='resolved'?'assessment_pending':'more_information_required',clarificationRequired:mode!=='resolved',headline:mode==='resolved'?'Under review':'More information needed',message:'Fictional browser test only',updatedAt:'2026-10-24T08:00:00Z',createdAt:'2026-10-23T10:00:00Z',paymentStatus:'paid',totalPence:100}]});
  else if(url.pathname==='/v1/commerce/orders')r=Response.json({ok:true,orders:[]});
  else if(url.pathname==='/v1/member/treatment/week')r=Response.json({week:{context:{progress:[{recorded_on:'2026-10-23',weight_kg:90}]}}});
  else r=Response.json({error:'not_available'},{status:404});
 }else r=memberExperienceRoutes(new Request(url),{MEMBER_EXPERIENCE_V1_ENABLED:'true'})||new Response('Not found',{status:404});
 res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});mkdirSync('preview/my-shift-proof',{recursive:true});
try{
 for(const width of [320,390,1024]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));mode='action';await page.goto(origin+'/member/my-shift');await page.waitForFunction(()=>document.getElementById('ms-status').textContent.startsWith('Order updates checked'));
  assert.equal(await page.locator('#ms-actions .ms-attention').count(),1);assert.equal(await page.locator('#my-shift img').count(),0);
  const geometry=await page.locator('[data-panel=overview]').evaluate(e=>({padding:getComputedStyle(e).paddingLeft,overflow:document.documentElement.scrollWidth>innerWidth}));assert.equal(geometry.overflow,false);assert.equal(geometry.padding,width<=540?'22px':'28px');
  assert.equal(await page.locator('#ms-actions .ms-attention').evaluate(e=>getComputedStyle(e).animationIterationCount),'infinite');
  await page.locator('#ms-motion').click();assert.equal(await page.locator('#ms-actions .ms-attention').evaluate(e=>getComputedStyle(e).animationName),'none');await page.locator('#ms-motion').click();
  await page.screenshot({path:'preview/my-shift-proof/overview-'+width+'.png',fullPage:true});
  for(const view of ['profile','health','orders','prescriptions','documents','updates','consultations','account']){await page.evaluate(v=>document.querySelector('[data-view="'+v+'"]').click(),view);assert.equal(await page.locator('[data-panel="'+view+'"]').isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.evaluate(()=>document.querySelector('[data-view=orders]').click());await page.getByRole('button',{name:'View order →',exact:true}).first().click();assert.equal(await page.locator('[data-panel=detail]').isVisible(),true);
  mode='resolved';await page.locator('#ms-refresh').click();await page.waitForFunction(()=>document.getElementById('ms-status').textContent.startsWith('Order updates checked'));assert.equal(await page.locator('.ms-attention').count(),0);
  mode='error';await page.locator('#ms-refresh').click();await page.waitForFunction(()=>document.getElementById('ms-status').textContent.startsWith('Some order'));assert.match(await page.locator('#ms-actions').innerText(),/could not load/);
  mode='signedout';await page.locator('#ms-refresh').click();await page.waitForFunction(()=>document.body.dataset.memberSession==='signed-out');assert.equal(await page.locator('#ms-orders').innerText(),'');assert.equal(await page.locator('#ms-member').innerText(),'My Shift');assert.equal(await page.locator('main').isVisible(),false);
  checks.push({width,checks:'nine sections, inset, overflow, safe DOM, pulse/pause, resolved, partial failure and session expiry passed',errors});assert.deepEqual(errors,[]);await context.close();
 }
 mode='action';const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();await page.goto(origin+'/member/my-shift');await page.waitForFunction(()=>document.getElementById('ms-status').textContent.startsWith('Order updates checked'));assert.equal(await page.locator('#ms-actions .ms-attention').evaluate(e=>getComputedStyle(e).animationName),'none');await context.close();
 assert(calls.every(c=>c.method==='GET'));writeFileSync('preview/my-shift-proof/browser-receipt.json',JSON.stringify({at:new Date().toISOString(),fictionalOnly:true,productionWrites:0,calls: calls.length,checks,reducedMotion:true},null,2));console.log('PASS',JSON.stringify(checks));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
