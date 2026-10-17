import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {chromium,webkit} from 'playwright';
const fixture=process.env.GRUB_EASE_ORIGIN?null:await import('./grub-ease-fixture.mjs');
const origin=process.env.GRUB_EASE_ORIGIN||fixture.origin;
const out=process.env.GRUB_EASE_OUT||'/tmp/grub-ease-proof';
mkdirSync(out,{recursive:true});
const report={scope:'Actual Worker and Grub UI against the existing isolated synthetic-member fixture',productionWrites:0,physicalDevice:false,cases:[]};
const browsers=[];let activePage;
async function api(context,body){
 const r=await context.request.fetch(origin+'/v1/grub/workspace',{method:body?'POST':'GET',headers:{Origin:origin},...(body?{data:body}:{})});
 assert.equal(r.status(),200,await r.text());return r.json();
}
async function change(context,action){const s=await api(context);return api(context,{...action,revision:s.revision,operationId:randomUUID()});}
try{
 for(const [engine,width] of [[chromium,320],[chromium,390],[chromium,1440],[webkit,390]]){
  const browser=await engine.launch({headless:true});browsers.push(browser);
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',...(engine===webkit?{isMobile:true,hasTouch:true}:{})});
  await ctx.addInitScript(()=>{window.SST_API_BASE=location.origin});
  await ctx.addCookies([{name:'sst_session',value:'fixture-token-1',url:origin,httpOnly:true}]);
  await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:404,body:'External browser traffic blocked in this fixture'}));
  const other=await browser.newContext();await other.addCookies([{name:'sst_session',value:'fixture-token-2',url:origin,httpOnly:true}]);
  const otherBefore=await api(other);
  let initial=await api(ctx);
  if(initial.today?.recipeId===initial.recommendation?.recipe?.id)
   initial=await change(ctx,{action:'recommendation-next',recipeId:initial.recommendation.recipe.id});
  const page=await ctx.newPage(),errors=[];activePage=page;page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
  const row={engine:engine.name(),width,checks:[]};report.cases.push(row);
  await page.goto(origin+'/member/grub?view=app',{waitUntil:'domcontentloaded'});
  await page.locator('#grubRecommendation [data-food-pick]').waitFor();
  const consent=page.locator('[data-consent="necessary"]');if(await consent.isVisible())await consent.click();
  assert.equal(await page.locator('#grubRecommendation .grub-pick-primary button').count(),2);
  assert.equal(await page.locator('.grub-pick-options').evaluate(n=>n.open),false);
  assert.equal(await page.locator('.grub-pick-adjust button:visible').count(),0);
  assert.equal(await page.locator('.grub-favourite-feedback button:visible').count(),0);
  row.checks.push('One suitable meal, two main actions; advanced controls available but collapsed');
  const before=await api(ctx),id=before.recommendation.recipe.id;
  await page.locator('[data-food-next]').click();
  await page.waitForFunction(id=>document.querySelector('[data-food-next]')?.dataset.foodNext!==id,id);
  let swapped=await api(ctx);
  assert.notEqual(swapped.recommendation.recipe.id,id);
  assert.equal(swapped.recommendation.learned.nay,before.recommendation.learned.nay);
  assert.deepEqual(swapped.week,before.week);assert.deepEqual(swapped.shopping,before.shopping);assert.deepEqual(swapped.today,before.today);
  row.checks.push('Something else changes only the suggestion, keeps permanent preferences and saved meals intact');
  await page.locator('.grub-pick-options>summary').click();
  await page.locator('#grubPickServings').selectOption('2');
  await page.locator('.grub-pick-options>summary').click();
  const chosenId=await page.locator('[data-food-pick]').getAttribute('data-food-pick');
  if(engine===chromium&&width===390){
   let failedBody;
   const failOnce=async route=>{
    const req=route.request();
    if(req.method()==='POST'&&req.postDataJSON()?.action==='choose-and-shop'&&!failedBody){
     failedBody=req.postDataJSON();
     return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Synthetic save failure'})});
    }
    return route.continue();
   };
   await page.route('**/v1/grub/workspace',failOnce);
   await page.locator('[data-food-pick]').click();
   await page.getByText(/Synthetic save failure.*not been marked as saved/).first().waitFor();
   const failed=await api(ctx);assert.deepEqual(failed.today,swapped.today);assert.deepEqual(failed.shopping,swapped.shopping);
   const retry=page.waitForRequest(req=>req.url().endsWith('/v1/grub/workspace')&&req.method()==='POST'&&req.postDataJSON()?.action==='choose-and-shop');
   await page.locator('[data-food-pick]').click();
   assert.equal((await retry).postDataJSON().operationId,failedBody.operationId);
   row.checks.push('Failed save retains the meal and portions, marks nothing saved and retries with the same operation identity');
  }else await page.locator('[data-food-pick]').click();
  await page.locator('.grub-pick-shopping').waitFor();
  const chosen=await api(ctx);assert.equal(chosen.today.recipeId,chosenId);assert.equal(chosen.today.servings,2);
  assert.equal(chosen.options.servings,2);assert(chosen.shopping.length>0);assert.deepEqual(chosen.week,swapped.week);
  row.checks.push('One acceptance saves Today and a scaled shopping list in a single authenticated revision without replacing the week');
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.grub-pick-shopping').waitFor();
  await page.locator('.grub-pick-options>summary').click();assert.equal(await page.locator('#grubPickServings').inputValue(),'2');
  await page.locator('.grub-pick-options>summary').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width===320){
   await page.locator('.grub-pick-options>summary').focus();
   await page.locator('.grub-pick-options>summary').press('Enter');
   assert.equal(await page.locator('.grub-pick-options').evaluate(n=>n.open),true);
   await page.locator('.grub-pick-options>summary').press('Enter');
   await page.evaluate(()=>document.body.style.zoom='2');
   assert(await page.locator('#grubRecommendation').evaluate(n=>n.getBoundingClientRect().right<=innerWidth+1));
   const zoom=await page.evaluate(()=>({root:document.documentElement.scrollWidth,viewport:innerWidth}));
   if(zoom.root>zoom.viewport+1)(report.limitations??=[]).push({engine:engine.name(),width,zoom:'200%',...zoom,note:'Inherited install/Ask Timber utility overflow outside the recommendation; no root clipping or shared utility change introduced.'});
   await page.evaluate(()=>document.body.style.zoom='');
   row.checks.push('Small-screen reflow and keyboard disclosure work; the recommendation stays within the viewport at 200% zoom');
  }
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:out+'/'+engine.name()+'-'+width+'-meal.png',fullPage:false});
  await page.locator('.grub-pick-shopping').click();
  await page.locator('[data-grub-panel="shoplist"]').waitFor({state:'visible'});
  await page.locator('#shoppingList input').first().waitFor();
  const item=page.locator('#shoppingList input').first(),key=await item.getAttribute('data-food-check');
  const current=(await api(ctx)).shopping.find(x=>x.key===key);
  await item.setChecked(!current.done);
  await page.waitForFunction(()=>!document.querySelector('#grubAccountStatus').textContent.includes('Saving'));
  assert.equal((await api(ctx)).shopping.find(x=>x.key===key).done,!current.done);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#shoppingList input').first().waitFor();
  assert.equal(await page.locator('#shoppingList input').first().isChecked(),!current.done);
  row.checks.push('Shopping opens directly; bought/needed state survives reload');
  await page.goto(origin+'/member/dashboard#today',{waitUntil:'domcontentloaded'});
  await page.locator('.today-meal[data-meal-state="chosen"]').waitFor();
  assert.equal(await page.locator('.today-meal').getAttribute('data-recipe-id'),chosenId);
  assert.deepEqual(await api(other),otherBefore);
  assert.deepEqual(errors,[]);
  row.checks.push('Today shows the actual saved meal; the second account remains unchanged; no browser errors');
  await ctx.close();await other.close();
  console.log('PASS',engine.name(),width,row.checks.length);
 }
 report.pass=true;
}catch(e){report.pass=false;report.error=e.stack;if(activePage)await activePage.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}
finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));for(const b of browsers)await b.close();if(fixture)await new Promise(r=>fixture.server.close(r));}
