import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const base=process.env.PREVIEW_URL||'https://shift-stabilisation-preview.matobrien.workers.dev';assert.equal(new URL(base).hostname,'shift-stabilisation-preview.matobrien.workers.dev');
const dir='account-completion-evidence/delivery-browser';fs.mkdirSync(dir,{recursive:true});const results=[];
for(const [name,engine,width,height]of [['chromium-desktop',chromium,1280,900],['chromium-phone',chromium,390,844],['webkit-desktop',webkit,1280,900],['webkit-phone',webkit,390,844]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/__review');await page.getByRole('button',{name:'Start a fictional member preview'}).click();await page.waitForURL('**/member/settings#memberDetailsPanel');
  await page.waitForFunction(()=>document.getElementById('memberDetailsFields')?.disabled===false&&document.getElementById('memberDeliveryFields')?.disabled===false);
  for(const [id,value]of [['memberAddress1','1 Fictional Close'],['memberTown','Macclesfield'],['memberPostcode','SK10 1AA']])await page.locator('#'+id).fill(value);
  await page.locator('#memberDetailsSave').click();await page.waitForFunction(()=>document.getElementById('memberDetailsStatus').textContent==='Member details saved.'&&document.getElementById('memberDeliveryFields').disabled===false);
  await page.locator('#memberDeliveryMode').selectOption('separate');
  for(const [id,value]of [['memberDeliveryRecipient','Fictional Recipient'],['memberDeliveryAddress1','2 Fictional Road'],['memberDeliveryAddress2','Flat 2'],['memberDeliveryTown','London'],['memberDeliveryPostcode','SW1A 1AA']])await page.locator('#'+id).fill(value);
  await page.locator('#memberDeliverySave').click();await page.waitForFunction(()=>document.getElementById('memberDeliveryStatus').textContent.startsWith('Delivery address saved.'));
  await page.reload();await page.waitForFunction(()=>document.getElementById('memberDeliveryFields')?.disabled===false&&document.getElementById('memberDetailsFields')?.disabled===false);
  assert.equal(await page.locator('#memberDeliveryMode').inputValue(),'separate');assert.equal(await page.locator('#memberDeliveryAddress1').inputValue(),'2 Fictional Road');assert.equal(await page.locator('#memberAddress1').inputValue(),'1 Fictional Close');
  await page.locator('#memberAddress1').fill('3 Fictional Close');await page.locator('#memberDetailsSave').click();await page.waitForFunction(()=>document.getElementById('memberDetailsStatus').textContent==='Member details saved.'&&document.getElementById('memberDeliveryFields').disabled===false);
  assert.equal(await page.locator('#memberDeliveryAddress1').inputValue(),'2 Fictional Road');
  let fail=true;await page.route('**/v1/member/details/delivery',route=>{if(route.request().method()==='PUT'&&fail){fail=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'save_failed',message:'Injected preview failure. Your delivery edits remain.'})});}return route.continue();});
  await page.locator('#memberDeliveryAddress1').fill('4 Fictional Road');await page.locator('#memberDeliverySave').click();await page.waitForFunction(()=>document.getElementById('memberDeliveryStatus').textContent.includes('Injected preview failure'));assert.equal(await page.locator('#memberDeliveryAddress1').inputValue(),'4 Fictional Road');
  await page.locator('#memberDeliverySave').click();await page.waitForFunction(()=>document.getElementById('memberDeliveryStatus').textContent.startsWith('Delivery address saved.'));await page.unroute('**/v1/member/details/delivery');
  await page.locator('#memberDeliveryPanel').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/'+name+'-separate.png',fullPage:true});
  await page.locator('#memberDeliveryMode').selectOption('home');await page.locator('#memberDeliverySave').click();await page.waitForFunction(()=>document.getElementById('memberDeliveryStatus').textContent.startsWith('Delivery address saved.'));assert((await page.locator('#memberDeliveryHome').textContent()).includes('3 Fictional Close'));
  await page.reload();await page.waitForFunction(()=>document.getElementById('memberDeliveryFields')?.disabled===false);assert.equal(await page.locator('#memberDeliveryMode').inputValue(),'home');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);results.push({name,status:'PASS',separateSaveReload:true,homePreserved:true,oldClientSavePreservesDelivery:true,failureRetry:true,sameAsHome:true,noOverflow:true,pageErrors:errors});
 }catch(e){results.push({name,status:'FAIL',message:e.message,pageErrors:errors});await page.screenshot({path:dir+'/'+name+'-failure.png',fullPage:true}).catch(()=>{});}finally{await context.close();await browser.close();fs.writeFileSync(dir+'/results.json',JSON.stringify({previewOnly:true,physicalDeviceTest:false,providerLive:false,results},null,2));}
}
console.log(JSON.stringify(results,null,2));assert.equal(results.filter(r=>r.status==='FAIL').length,0);
