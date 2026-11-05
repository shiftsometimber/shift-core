// Browser mobile emulation; clock controlled to exercise real boundary rendering.
// All API responses remain real. Only owned synthetic records are written.
import fs from'node:fs';import crypto from'node:crypto';
import{chromium,webkit}from'/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
const live=process.argv.includes('--live'),before=process.argv.includes('--before'),origin=live||before?'https://shiftsometimber.co.uk':'https://shift-programme-my-timber-v7-test.matobrien.workers.dev';
const a=JSON.parse(fs.readFileSync(live||before?'/private/tmp/my-timber-v7-live-proof-account.json':'/private/tmp/my-timber-v7-test-access.json'));const account=live||before?a:a.cases.choose;
const dir='member-experience/meal-windows-evidence/'+(before?'before':live?'live':'test');fs.mkdirSync(dir,{recursive:true});const report={at:new Date().toISOString(),synthetic:account.email,physical:false,engines:[]};
for(const[name,type]of(before?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]])){
 const b=await type.launch(),c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,recordVideo:{dir:dir+'/'+name,size:{width:390,height:844}}});
 await c.addCookies([{name:'sst_session',value:account.token,url:origin,secure:true,httpOnly:true}]);
 const p=await c.newPage(),e={name,checks:[],errors:[]},requests=[];report.engines.push(e);p.on('pageerror',x=>e.errors.push(x.message));p.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/v1/'))requests.push(new URL(r.url()).pathname)});
 const check=(id,pass,detail)=>{e.checks.push({id,pass,detail});if(!pass)throw Error(id)};
 const shot=async file=>{await p.setViewportSize({width:391,height:844});await p.setViewportSize({width:390,height:844});await p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await p.screenshot({path:dir+'/'+name+'-'+file+'.jpg',quality:85})};
 try{
  await p.goto(origin+'/member/life-back/shop?mt-rollback=1');await p.locator('#mtShopMain .mt-shop-category').first().waitFor();
  const shop={text:await p.locator('#mtShopMain').textContent(),links:await p.locator('#mtShopMain a[href]').evaluateAll(ns=>ns.map(n=>({text:n.textContent,href:n.getAttribute('href')})))};
  if(before)fs.writeFileSync('member-experience/meal-windows-evidence/shop-before.json',JSON.stringify(shop));else check('Shop is unchanged',JSON.stringify(shop)===fs.readFileSync('member-experience/meal-windows-evidence/shop-before.json','utf8'));
  if(!before){
   let boot=await(await c.request.get(origin+'/v1/my-timber/boot')).json();if(!live){const prepared=await c.request.post(origin+'/v1/life-back',{headers:{Origin:origin},data:{action:'v7-refresh',expectedAccount:account.id,revision:boot.progress.revision,operationId:crypto.randomUUID()}});check('Actual preparation RPC succeeds',prepared.ok());boot=await(await c.request.get(origin+'/v1/my-timber/boot')).json();}check('Owned synthetic account',String(boot.accountId)===String(account.id));check('Three prepared meal periods in snapshot',Object.keys(boot.v7.mealOffers||{}).length===3);
   // Test fixture can be reset safely; live fixture may already have completed in
   // the preceding engine, so verify clock switching before writing in live too.
   if(!boot.v7.actionPinned&&!boot.v7.completedToday){
    const day=boot.v7.today;
    await p.clock.install({time:new Date(day+'T02:59:40Z')});
    await p.goto(origin+'/member/dashboard?mt-rollback=1#today');await p.locator('[data-v7-action-card]').waitFor();await p.evaluate(()=>window.__mealFrame=document.querySelector('#mtShopChrome'));
    const label=()=>p.locator('[data-v7-action-card] h2').innerText();
    check('02:59 shows tea',/^MAKE TEA:/i.test(await label()),await label());
    const move=async time=>{await p.clock.setSystemTime(new Date(day+'T'+time+':00Z'));await p.clock.runFor(16000)};
    let count=requests.length;
    await move('03:00');check('03:00 changes to breakfast without reload',/^MAKE BREAKFAST:/i.test(await label()));await shot('breakfast');await p.getByRole('link',{name:'Record what you ate',exact:true}).first().click();await p.locator('dialog[open]').waitFor();check('Breakfast food entry opens with Breakfast selected',await p.locator('[data-grub=select-meal][aria-pressed=true]').innerText()==='Breakfast');await p.locator('dialog [data-v7=close]').click();await p.getByRole('link',{name:'Today',exact:true}).click();await p.locator('[data-v7-action-card]').waitFor();
    await move('11:00');check('11:00 still breakfast',/^MAKE BREAKFAST:/i.test(await label()));
    await p.clock.setSystemTime(new Date());const response=p.waitForResponse(r=>r.url().endsWith('/v1/my-timber/boot'));await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await response;await p.locator('[data-v7-action-card] h2').filter({hasText:/MAKE LUNCH:/i}).waitFor();check('Resuming the app applies the current prepared meal',true);count=requests.length;await move('11:00');
    await move('11:01');check('11:01 changes to lunch',/^MAKE LUNCH:/i.test(await label()));await shot('lunch');
    await p.getByRole('link',{name:'Grub',exact:true}).click();await p.locator('.mt-grub').waitFor();
    const grubTitle=await p.locator('.mt-grub .mt-v7-cream h2').innerText();check('Today and Grub share the same lunch',grubTitle===boot.v7.mealOffers.lunch.action.name.split(' — ')[0].toUpperCase(),grubTitle);await shot('grub-lunch');
    await move('15:00');check('15:00 Grub still shows lunch',(await p.locator('.mt-grub .mt-v7-cream .mt-v7-eyebrow').innerText())==='LUNCH');
    await move('15:01');check('15:01 Grub changes to tea',(await p.locator('.mt-grub .mt-v7-cream .mt-v7-eyebrow').innerText())==='TEA');
    check('Clock changes and visited tab use no extra API requests',requests.length===count,{requests:requests.slice(count)});
    check('Shared frame never remounts',await p.evaluate(()=>window.__mealFrame===document.querySelector('#mtShopChrome')));
    await p.clock.setSystemTime(new Date());await p.goto(origin+'/member/dashboard?mt-rollback=1#today');
    await p.locator('[data-v7-action-card]').waitFor();await p.clock.runFor(100);
   }else{
    await p.goto(origin+'/member/dashboard?mt-rollback=1#today');await p.locator('[data-v7-action-card]').waitFor();
    check('Completed action remains saved',await p.locator('[data-v7=done]').isDisabled());
   }
   const current=await(await c.request.get(origin+'/v1/my-timber/boot')).json();
   for(const[period,offer]of Object.entries(current.v7.mealOffers)){
    check(period+': three safe sourced swaps',offer.alternatives.length===3&&offer.alternatives.every(x=>Math.abs(x.proteinG-offer.action.proteinG)<=5&&x.nutrition.source.name===offer.action.nutrition.source.name));
   }
   if(!current.v7.completedToday&&(!live||name==='webkit')){
    await p.locator('[data-v7=swap]').click();await p.locator('dialog[open]').waitFor();check('Swap shows three prepared alternatives',await p.locator('dialog [data-v7=pick]').count()===3);await shot('swap');
    await p.locator('dialog [data-v7=pick]').first().click();await p.locator('dialog[open]').waitFor({state:'hidden'});
    const picked=await(await c.request.get(origin+'/v1/my-timber/boot')).json();check('Pick saves without adding food or a pile log',picked.v7.count===current.v7.count&&JSON.stringify(picked.nutritionDay)===JSON.stringify(current.nutritionDay));
    const on=picked.v7.today;await p.clock.setSystemTime(new Date(on+'T23:00:00Z'));await p.clock.runFor(16000);check('Picked meal is not replaced by clock',(await p.locator('[data-v7-action-card] h2').innerText()).includes(picked.v7.action.name.split(' — ')[0].toUpperCase()));
    await p.clock.setSystemTime(new Date());await p.clock.runFor(100);
    const op={action:'v7-complete',expectedAccount:account.id,actionId:picked.v7.action.id,operationId:crypto.randomUUID()};
    // Independent API client represents a second device racing the UI Done.
    const second=c.request.post(origin+'/v1/life-back',{headers:{Origin:origin},data:op});
    await p.locator('[data-v7=done]').click();const secondResult=await second;check('Second device completion accepted',secondResult.ok());
    await p.locator('dialog[open]').waitFor();await p.locator('[data-v7=feedback][data-outcome=not-helped]').click();await p.locator('dialog[open]').waitFor({state:'hidden'});
    const after=await(await c.request.get(origin+'/v1/my-timber/boot')).json();check('Two devices and Done award exactly one pile log',after.v7.count===current.v7.count+1,{before:current.v7.count,after:after.v7.count});
    check('Done and negative feedback do not add food',JSON.stringify(after.nutritionDay)===JSON.stringify(current.nutritionDay));check('Completed action stays pinned',after.v7.actionPinned&&after.v7.action.id===picked.v7.action.id);
   }
   await shot('saved');check('No browser errors',!e.errors.length,e.errors);
  }
 }catch(x){e.errors.push(x.stack||x.message);await shot('failure').catch(()=>{})}
 const video=p.video();await c.close();await video.saveAs(dir+'/'+name+'-journey.webm');await b.close();fs.writeFileSync(dir+'/results.json',JSON.stringify(report,null,2));console.log(JSON.stringify({name,passed:e.checks.filter(x=>x.pass).length,errors:e.errors}));
 // Reset only the owned isolated fixture, never production members.
 if(!live&&!before&&name==='chromium'){const{execFileSync}=await import('node:child_process');execFileSync(process.execPath,['member-experience/tools/meal-windows-seed.mjs'],{stdio:'ignore'});}
}
if(report.engines.some(e=>e.errors.length||e.checks.some(c=>!c.pass)))process.exitCode=1;
