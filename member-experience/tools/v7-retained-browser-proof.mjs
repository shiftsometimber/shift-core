import fs from 'node:fs';import path from 'node:path';
import {chromium,webkit} from '/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
const engine=process.argv.includes('--webkit')?'webkit':'chromium',origin='https://shift-programme-my-timber-v7-test.matobrien.workers.dev',a=JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-test-access.json')).cases.choose;
const dir=path.resolve('member-experience/v7-release-evidence/retained-'+engine);fs.mkdirSync(dir,{recursive:true});
const browser=await({chromium,webkit}[engine]).launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,recordVideo:{dir,size:{width:390,height:844}}});
await context.addCookies([{name:'sst_session',value:a.token,url:origin,httpOnly:true,secure:true}]);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+new URL(r.url()).pathname+new URL(r.url()).search);});
const report={engine,at:new Date().toISOString(),account:a.email,checks:[]};const check=(name,pass,detail)=>report.checks.push({name,result:pass?'PASS':'FAIL',detail});
try{
 await page.goto(origin+'/member/dashboard',{waitUntil:'domcontentloaded'});await page.locator('[data-v7-action-card]').waitFor();await page.evaluate(()=>window.__retainedFrame=document.getElementById('mtShopChrome'));
 for(const [name,url,selector]of [['Account settings','/member/settings','#memberDetailsForm'],['Private photos','/member/dashboard?tools=journey#visualise','#photoInput'],['Grub tools','/member/grub?tools=all','#grubSearch'],['Fit tools','/member/fit?tools=all','#fitStatus'],['Life Back','/member/life-back','#journeyView']]){
  const before=errors.length;await page.evaluate(href=>{const a=document.createElement('a');a.href=href;a.textContent='Retained proof link';document.querySelector('#mtNativeMain').append(a);a.click();},url);
  await page.locator(selector).waitFor({timeout:25000});await page.locator('[data-retained-state=ready]').waitFor({timeout:45000});
  check(name+' available in shared frame',await page.evaluate(()=>window.__retainedFrame===document.getElementById('mtShopChrome')&&document.querySelectorAll('#mtShopChrome').length===1&&document.querySelectorAll('iframe').length===0));
  if(name==='Private photos')check('Photo upload controller attached',await page.locator('#photoInput').getAttribute('data-photo-ready')==='true');
  if(name==='Account settings')await page.waitForFunction(()=>document.querySelector('#memberDetailsFields')?.disabled===false,{timeout:20000});
  if(name==='Account settings')check('Account form loaded its saved synthetic values',await page.locator('#memberFirstName').isEnabled());
  check(name+' controller no exception',errors.length===before,errors.slice(before));await page.screenshot({path:path.join(dir,name.toLowerCase().replaceAll(' ','-')+'.png'),fullPage:false});
 }
}catch(e){check('Retained tools browser run',false,e.message);await page.screenshot({path:path.join(dir,'failure.png')});}
finally{const video=page.video();await page.close();await context.close();if(video)await video.saveAs(path.join(dir,'retained.webm'));await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({...report,errors},null,2));console.log(JSON.stringify({...report,errors}));}
