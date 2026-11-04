// Exercises the hosted worker/database, without intercepting application data.
import fs from 'node:fs';import path from 'node:path';
import {chromium,webkit} from '/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
const engine=process.argv.includes('--webkit')?'webkit':'chromium',origin='https://shift-programme-my-timber-v7-test.matobrien.workers.dev';
const accounts=JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-browser-access.json'))[engine];
const directory=path.resolve('member-experience/arcade-evidence/v7-journeys-'+engine);fs.mkdirSync(directory,{recursive:true});
const browser=await({chromium,webkit}[engine]).launch({headless:true});
const report={engine,device:'Mobile browser profile, not a physical phone',origin,at:new Date().toISOString(),journeys:[]};
async function accountContext(account,video=true){const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,...(video?{recordVideo:{dir:directory,size:{width:390,height:844}}}:{})});await context.addCookies([{name:'sst_session',value:account.token,url:origin,httpOnly:true,secure:true,sameSite:'Lax'}]);return context;}
async function boot(page){const r=await page.request.get(origin+'/v1/my-timber/boot');if(!r.ok())throw Error('Boot check failed: '+r.status());return r.json();}
async function open(page,destination='today'){await page.goto(origin+(destination==='today'?'/member/dashboard':'/member/'+destination),{waitUntil:'domcontentloaded'});await page.locator('#mtNativeMain > [data-mt-screen]').waitFor();}
async function screen(page,name){await page.screenshot({path:path.join(directory,name+'.png'),fullPage:false});}
async function closeSheet(page){await page.getByRole('button',{name:'Close',exact:true}).click();}
for(const name of ['choose','hard-week','milestone']){
 const account=accounts[name],context=await accountContext(account),page=await context.newPage(),checks=[],errors=[];
 const result={name,testAccount:account.email,checks};report.journeys.push(result);
 const check=(condition,pass,detail)=>checks.push({condition,result:pass?'PASS':'FAIL',detail});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+new URL(r.url()).pathname);});
 let secondContext=null,second=null;
 try{
  await open(page);const start=await boot(page);check('Prepared starting pile',start.v7.count===(name==='milestone'?29:12),{count:start.v7.count});
  if(name==='choose'){
   await page.locator('[data-v7=swap]').first().click();await page.getByRole('dialog').waitFor();
   check('Exactly three sourced, protein-matched swaps',start.v7.alternatives.length===3&&start.v7.alternatives.every(a=>Math.abs(a.proteinG-start.v7.action.proteinG)<=5&&a.nutrition.source.name===start.v7.action.nutrition.source.name&&a.nutrition.source.version===start.v7.action.nutrition.source.version),{original:start.v7.action.proteinG,swaps:start.v7.alternatives.map(a=>a.proteinG)});
   await screen(page,'choose-swap');await page.locator('[data-v7=pick]').first().click();await page.getByRole('dialog').waitFor({state:'hidden'});
   const selected=await boot(page);check('Swap changes action without food or a pile award',selected.v7.count===12&&selected.v7.action.id!==start.v7.action.id&&selected.nutritionDay.proteinG===0);
   secondContext=await accountContext(account,false);second=await secondContext.newPage();await open(second,'grub');const other=await boot(second);
   check('Today and Grub use the same selected action',selected.v7.action.id===other.v7.action.id);
   const replies=[page.waitForResponse(r=>r.url().endsWith('/v1/life-back')&&r.request().method()==='POST'&&r.request().postDataJSON()?.action==='v7-complete'),second.waitForResponse(r=>r.url().endsWith('/v1/life-back')&&r.request().method()==='POST'&&r.request().postDataJSON()?.action==='v7-complete')];
   await Promise.all([page.locator('[data-v7=done]').first().click(),second.locator('[data-v7=done]').first().click()]);
   const answers=await Promise.all((await Promise.all(replies)).map(r=>r.json()));await page.getByRole('dialog').waitFor();
   check('Concurrent Done on two sessions and two screens awards once',answers.filter(a=>a.awarded).length===1&&answers.every(a=>a.v7.count===13),answers.map(a=>({awarded:a.awarded,count:a.v7.count})));
   await screen(page,'choose-done');await page.getByRole('button',{name:/Tried it, didn.t help/}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
   const after=await boot(page);check('Negative optional feedback keeps log and food totals',after.v7.count===13&&after.nutritionDay.proteinG===0&&after.foodEntries.length===0);
   check('Pile count and remaining add to thirty',(await page.locator('[data-v7-stack]').innerText()).includes('17 to go')&&after.v7.count===13);
   await second.close();await secondContext.close();secondContext=null;
   for(const key of ['Pint','Takeaway','Gym done','Rough night','Weigh in']){
    const button=page.getByRole('button',{name:key,exact:true});await button.click();await page.getByRole('dialog').waitFor();
    if(key==='Gym done'||key==='Rough night'){await page.locator('[data-native-quick]').click();await page.getByRole('dialog').waitFor({state:'hidden'});}
    else if(key==='Weigh in'){await page.locator('[name=weight]').fill('108.5');await page.getByRole('button',{name:'Save reading',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});}
    else await closeSheet(page);
   }
   check('All five quick logs leave pile unchanged',(await boot(page)).v7.count===13);
   await page.getByRole('button',{name:'Good',exact:true}).click();await page.getByText('Check-in saved.',{exact:true}).waitFor();
   check('Recorded mood is absent from Today',!(await page.locator('#mtNativeMain').innerText()).includes('Latest check-in:')&&await page.getByRole('link',{name:'History ›',exact:true}).isVisible());
   await page.locator('[data-mt-shop-tab=grub]').click();
   async function food(meal,query,amount,offPlan=false){
    await page.locator('[data-grub=snack]').click();await page.locator('[data-grub=select-meal][data-meal='+meal+']').click();if(offPlan)await page.locator('[data-grub=offplan]').click();
    await page.locator('[data-food-search] [name=query]').fill(query);await page.locator('[data-food-search] button').click();await page.locator('[data-grub=pick-food]').first().waitFor();await page.locator('[data-grub=pick-food]').first().click();await page.locator('[data-food-portion] [name=amount]').fill(String(amount));await page.locator('[data-food-portion] button').click();await page.getByRole('dialog',{name:'Food recorded'}).waitFor();
    if(offPlan){await screen(page,'grub-offplan');check('Off-plan confirmation is neutral',!/over budget|warning|failed/i.test(await page.getByRole('dialog').innerText()));}
    await page.locator('[data-grub=close]').click();
   }
   await food('breakfast','toast',100);await food('lunch','chicken',180);await food('snacks','yoghurt',150);await food('dinner','pizza',300,true);
   const fullDay=await boot(page);check('Full food day records four meals without an award',fullDay.foodEntries.length===4&&new Set(fullDay.foodEntries.map(e=>e.meal)).size===4&&fullDay.v7.count===13&&fullDay.nutritionDay.proteinG>0&&fullDay.nutritionDay.kcal>0,{entries:fullDay.foodEntries.length,proteinG:fullDay.nutritionDay.proteinG,kcal:fullDay.nutritionDay.kcal,pile:fullDay.v7.count});
   await screen(page,'grub-full-day');await page.locator('[data-grub=detail]').first().click();await screen(page,'grub-meal-detail');await closeSheet(page);
   await page.locator('[data-grub=venue][data-venue=Pub]').click();check('Eating-out figures explicitly use estimates',/estimates/i.test(await page.getByRole('dialog').innerText()));await closeSheet(page);
   await page.locator('[data-mt-shop-tab=fit]').click();await page.locator('[data-fit=start]').waitFor();await screen(page,'fit-home');
   await page.locator('[data-fit=swap]').click();check('Fit offers shorter, no-kit and low-impact',await page.locator('[data-fit=pick]').count()===3);await screen(page,'fit-swap');await closeSheet(page);
   await page.locator('[data-fit=start]').click();const ids=await page.locator('[data-fit=move]').evaluateAll(nodes=>nodes.map(n=>n.dataset.id));
   for(const id of ids){await page.locator('[data-fit=move][data-id="'+id+'"]').click();await page.locator('[data-fit=move][data-id="'+id+'"][data-state=undo]').waitFor();}
   await page.locator('[data-fit=complete]').click();await page.getByRole('dialog',{name:'Session recorded'}).waitFor();await screen(page,'fit-done');await closeSheet(page);
   check('Closing optional Fit ratings keeps activity, no second pile log',(await boot(page)).v7.count===13);
   await page.locator('[data-fit=start]').click();await page.locator('[data-fit=complete]').click();await page.locator('[data-fit=outcome][data-outcome=helped]').click();await page.locator('[data-fit=effort][data-effort=right]').click();await page.locator('[data-fit=close]').click();
   await page.locator('[data-fit=walk]').click();await page.locator('[data-fit-walk] input').fill('20');await page.locator('[data-fit-walk] button').click();await page.getByRole('dialog').waitFor({state:'hidden'});
   check('A walk and extra session never add a pile log',(await boot(page)).v7.count===13);
  }else if(name==='hard-week'){
   const text=await page.locator('#mtNativeMain').innerText();check('Hard-week return is welcoming, pile retained',start.v7.returning&&start.v7.count===12&&/good to see you|manageable|pile is still here/i.test(text)&&!/lost your|reset your streak|failed/i.test(text));
   await screen(page,'hard-week-return');await page.locator('[data-v7=done]').first().click();await page.getByRole('dialog').waitFor();await closeSheet(page);check('Feedback can be closed without losing the earned log',(await boot(page)).v7.count===13);
  }else{
   check('Milestone starts unawarded',!start.v7.milestone);await page.locator('[data-v7=done]').first().click();await page.getByRole('dialog').waitFor();await screen(page,'milestone-done');await closeSheet(page);
   const complete=await boot(page);check('Thirtieth log awards exactly one milestone',complete.v7.count===30&&complete.v7.milestone?.count===30);
   await page.locator('[data-v7=preview]').first().click();await page.locator('.mt-v7-share-image').waitFor();await screen(page,'milestone-preview');const preview=await page.getByRole('dialog').innerText();check('Share preview contains effort only',!/\bkg\b|\bBMI\b|protein|medicine|knee|symptom|108\.5/i.test(preview));await closeSheet(page);
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-v7-stack]').waitFor();const reloaded=await boot(page);check('Refresh neither awards again nor replaces milestone',reloaded.v7.count===30&&reloaded.v7.milestone.id===complete.v7.milestone.id);
  }
 }catch(e){check('Journey completes',false,e.message);await screen(page,name+'-failure');}
 finally{
  check('No uncaught browser exception',errors.length===0,errors);if(secondContext)await secondContext.close();
  const video=page.video();await page.close();await context.close();if(video)await video.saveAs(path.join(directory,name+'.webm'));
 }
}
await browser.close();fs.writeFileSync(path.join(directory,'results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({engine,journeys:report.journeys.map(j=>({name:j.name,account:j.testAccount,pass:j.checks.filter(c=>c.result==='PASS').length,fail:j.checks.filter(c=>c.result==='FAIL').length})),failures:report.journeys.flatMap(j=>j.checks.filter(c=>c.result==='FAIL').map(c=>({journey:j.name,...c}))),directory}));
