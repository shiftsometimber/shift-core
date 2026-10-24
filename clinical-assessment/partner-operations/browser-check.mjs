import {createServer} from 'node:http';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import worker from '../portal-release-worker.mjs';
const {chromium}=await import('/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs');
const server=createServer(async(req,res)=>{try{const r=await worker.fetch(new Request('https://hq.shiftsometimber.co.uk'+req.url),{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch(e){res.writeHead(500);res.end(e.message);}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,results=[];const browser=await chromium.launch({headless:true});
await mkdir('partner-proof',{recursive:true});
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
  await page.goto(origin+'/clinical-portal/partners/demo');await page.getByRole('button',{name:/Alex Example/}).click();await page.getByRole('heading',{name:/Alex Example/}).waitFor();
  assert.equal(await page.locator('#detail').evaluate(e=>getComputedStyle(e).paddingLeft),width<800?'22px':'28px');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'partner-proof/people-'+width+'.png',fullPage:true});
  for(const kind of ['identity','registration','indemnity','agreements','competence']){
   await page.locator('details').filter({has:page.locator('summary',{hasText:'Verification checks'})}).locator('summary').click();
   const form=page.locator('form').filter({has:page.getByRole('heading',{name:'Record an independent check'})});
   await form.locator('[name=kind]').selectOption(kind);await form.locator('[name=source]').fill('Fictional independent check — browser test only');await form.locator('[name=expiresAt]').fill('2027-10-24');await form.getByRole('button',{name:'Save verification'}).click();await page.getByText('Saved and audited. No message was sent.').waitFor();
  }
  await page.locator('summary').getByText('HQ approval & account controls',{exact:true}).click();await page.getByRole('button',{name:'Approve application',exact:true}).click();await page.getByText('CLN-AABBCCDDEEFF',{exact:true}).waitFor();
  await page.goto(origin+'/clinical-portal/dispensing/demo');await page.getByRole('button',{name:/DEMO-1042/}).click();await page.getByRole('button',{name:'Accept prescription',exact:true}).click();await page.getByText(/^accepted ·/).waitFor();
  await page.getByRole('button',{name:'Start dispensing',exact:true}).click();await page.getByText('stock unavailable',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Demo stock: unavailable',exact:true}).click();await page.getByRole('button',{name:'Start dispensing',exact:true}).click();await page.getByText(/^preparing ·/).waitFor();
  await page.locator('[name=trackingNumber]').fill('AB123456789GB');await page.getByRole('button',{name:'Confirm dispatch',exact:true}).click();await page.getByText(/^dispatched ·/).waitFor();assert.match(await page.getByRole('link',{name:'Track delivery'}).getAttribute('href'),/^https:\/\/www.royalmail.com/);
  await page.screenshot({path:'partner-proof/dispensing-'+width+'.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({width,errors,externalRequests:external.length,checks:'staff checks -> approval -> generated username; dispensing -> no-stock block -> fictional stock -> dispatch; inset and overflow'});await context.close();
 }
 await writeFile('partner-proof/browser-receipt.json',JSON.stringify({at:new Date().toISOString(),fictionalOnly:true,realWrites:0,results},null,2));console.log(JSON.stringify(results));
}finally{await browser.close();await new Promise(r=>server.close(r));}
