import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assetPath} from './runtime.mjs';
export async function browserCheck({headers={},html,asset,dir='work-w2-evidence',label='candidate'}={}){
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'../work-w2-tools/node_modules/playwright/index.mjs');
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),args:['--no-sandbox']});
 fs.mkdirSync(dir,{recursive:true});const results=[];
 try{
  for(const viewport of [{width:1440,height:1000},{width:768,height:1024},{width:390,height:844}]){
   const context=await browser.newContext({viewport,extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'});
   const page=await context.newPage();let contactRequests=0;
   await page.route('**/v1/contact',route=>{contactRequests++;return route.abort();});
   if(html)await page.route('https://shiftsometimber.co.uk/shift-for-work',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
   if(asset)await page.route('https://shiftsometimber.co.uk'+assetPath,route=>route.fulfill({status:200,contentType:'image/webp',body:asset}));
   await page.goto('https://shiftsometimber.co.uk/shift-for-work',{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('.ww2-photo img').waitFor({state:'visible'});
   await page.waitForFunction(()=>{const img=document.querySelector('.ww2-photo img');return img?.complete&&img.naturalWidth>0;},null,{timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#shift-work-enquiry button[type="submit"]')?.disabled===false,null,{timeout:30000});
   await page.waitForLoadState('load',{timeout:30000});
   const cookieChoice=page.getByRole('button',{name:'Necessary only',exact:true});
   if(await cookieChoice.isVisible())await cookieChoice.click();
   await page.evaluate(()=>document.fonts.ready);
   const layout=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
    const img=document.querySelector('.ww2-photo img');
    return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:document.querySelectorAll('main h1').length,ticker:!!document.querySelector('#shift-public-news'),imageLoaded:img.complete&&img.naturalWidth>0,background:getComputedStyle(document.querySelector('main')).backgroundColor,copy:rect('.ww2-copy'),photo:rect('.ww2-photo'),benefits:rect('.ww2-benefits')};
   });
   await page.screenshot({path:dir+'/'+label+'-'+viewport.width+'.png',fullPage:true});
   assert.equal(layout.background,'rgb(5, 5, 5)');assert.equal(layout.headings,1);assert.equal(layout.ticker,false);assert(layout.imageLoaded);assert(layout.scrollWidth<=viewport.width,'Horizontal overflow '+viewport.width);
   if(viewport.width>760)assert(layout.photo.x>layout.copy.x+layout.copy.width-1,'Desktop split layout');else assert(layout.photo.y>=layout.copy.bottom,'Mobile reading order');
   await page.getByRole('link',{name:'Talk to us about SHIFT for Work',exact:true}).click();
   await page.locator('#work-enquiry[open]').waitFor({state:'visible'});
   await page.locator('#work-name').waitFor({state:'visible'});
   assert.equal(await page.locator('#shift-work-enquiry').getAttribute('action'),'/v1/contact');
   assert.equal(await page.locator('#shift-work-enquiry [required]').count(),6);
   const form=await page.evaluate(()=>{const copy=document.querySelector('.sw-enquiry-copy').getBoundingClientRect(),fields=document.querySelector('form[data-work-enquiry]').getBoundingClientRect();return {scrollWidth:document.documentElement.scrollWidth,background:getComputedStyle(document.querySelector('form[data-work-enquiry]')).backgroundColor,text:getComputedStyle(document.querySelector('#work-name')).color,input:getComputedStyle(document.querySelector('#work-name')).backgroundColor,copy:{x:copy.x,y:copy.y,height:copy.height,bottom:copy.bottom},fields:{x:fields.x,y:fields.y,height:fields.height},rowGap:getComputedStyle(document.querySelector('.sw-enquiry-grid')).rowGap,gridAutoRows:getComputedStyle(document.querySelector('.sw-enquiry-grid')).gridAutoRows};});
   await page.screenshot({path:dir+'/'+label+'-enquiry-viewport-'+viewport.width+'.png',fullPage:false});
   assert(form.scrollWidth<=viewport.width,'Enquiry overflow '+viewport.width);assert.equal(form.text,'rgb(231, 227, 218)');assert.equal(form.input,'rgb(5, 5, 5)');
   if(viewport.width<=760){assert(form.fields.y>=form.copy.bottom,'Mobile form follows the introduction');assert(form.fields.y-form.copy.bottom<=28,'No empty gap above the mobile form');}
   await page.screenshot({path:dir+'/'+label+'-enquiry-'+viewport.width+'.png',fullPage:true});
   assert.equal(contactRequests,0,'No enquiry submitted');
   results.push({viewport,layout,form,enquiryOpens:true,contactRequests});await context.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(dir+'/'+label+'-browser.json',JSON.stringify(results,null,2));return results;
}
if(process.argv[2]==='local'){
 const results=await browserCheck({html:fs.readFileSync('/tmp/shift-for-work-w2-candidate.html','utf8'),asset:fs.readFileSync('/tmp/workplace-w2-20261030.webp')});console.log(JSON.stringify(results));
}
