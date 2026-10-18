import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {randomUUID} from 'node:crypto';
import {origin,server} from './grub-ease-fixture.mjs';
const out=process.env.GRUB_EASE_OUT||'/tmp/grub-everyday-next';mkdirSync(out,{recursive:true});
const report={source:'Grub effort and repeats',productionWrites:0,physicalDevice:false,cases:[]};
async function api(ctx,body){const r=await ctx.request.fetch(origin+'/v1/grub/workspace',{method:body?'POST':'GET',headers:{Origin:origin},...(body?{data:body}:{})});assert.equal(r.status(),200,await r.text());return r.json()}
async function change(ctx,body){const state=await api(ctx);return api(ctx,{...body,revision:state.revision,operationId:randomUUID()})}
async function chooseEffort(page,id){if(!await page.locator('.grub-effort-picker').evaluate(n=>n.open))await page.locator('.grub-effort-picker>summary').click();await page.locator('[data-food-effort="'+id+'"]').click()}
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce',...(engine===webkit?{isMobile:true,hasTouch:true}:{})});
   await ctx.addCookies([{name:'sst_session',value:'fixture-token-1',url:origin,httpOnly:true}]);
   await ctx.addInitScript(()=>{window.SST_API_BASE=location.origin});
   await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:404,body:'External traffic blocked'}));
   const other=await browser.newContext();await other.addCookies([{name:'sst_session',value:'fixture-token-2',url:origin,httpOnly:true}]);const otherBefore=await api(other);
   await change(ctx,{action:'set-effort',effort:'cook'});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/member/grub?view=app');await page.locator('#grubRecommendation .grub-pick-primary').waitFor();
   for(const selector of ['[data-consent="necessary"]','#pwaInstallDismiss']){const el=page.locator(selector);if(await el.isVisible())await el.click()}
   const before=await api(ctx);
   await chooseEffort(page,'no-cook');
   await page.waitForFunction(()=>document.querySelector('[data-food-effort="no-cook"]')?.getAttribute('aria-pressed')==='true');
   let s=await api(ctx);assert.equal(s.options.effort,'no-cook');assert.equal(s.recommendation.recipe.cook_minutes,0);
   assert.deepEqual(s.today,before.today);assert.deepEqual(s.week,before.week);assert.deepEqual(s.shopping,before.shopping);
   await page.reload();await page.locator('#grubRecommendation .grub-pick-primary').waitFor();assert.equal(await page.locator('[data-food-effort="no-cook"]').getAttribute('aria-pressed'),'true');
   const fav=(await api(ctx)).recommendation.recipe.id;
   if(!await page.locator('.grub-pick-options').evaluate(n=>n.open))await page.locator('.grub-pick-options>summary').click();
   await page.locator('[data-grub-feedback="yay"]').click({timeout:10000});
   await page.locator('[data-food-repeat="'+fav+'"]').waitFor({state:'attached'});
   if(!await page.locator('#grubPickServings').isVisible())await page.locator('.grub-pick-options>summary').click();
   await page.locator('#grubPickServings').selectOption('2');
   await page.locator('[data-food-next]').click();await page.waitForFunction(id=>document.querySelector('[data-food-next]')?.dataset.foodNext!==id,fav);
   await page.locator('.grub-repeat>summary').click();
   await page.locator('[data-food-repeat="'+fav+'"]').click();
   await page.locator('.grub-pick-shopping').waitFor();
   s=await api(ctx);assert.equal(s.today.recipeId,fav);assert.equal(s.today.servings,2);assert(s.shopping.length>0);
   await page.reload();await page.locator('.grub-pick-shopping').waitFor();assert.equal((await api(ctx)).today.recipeId,fav);
   await chooseEffort(page,'five');
   await page.waitForFunction(()=>document.querySelector('[data-food-effort="five"]')?.getAttribute('aria-pressed')==='true');
   s=await api(ctx);assert(!s.recommendation.recipe||s.recommendation.recipe.minutes<=5);
   assert.equal(await page.locator('[data-food-effort]').count(),3);
   await chooseEffort(page,'no-cook');await page.locator('[data-food-next]').waitFor();
   assert.deepEqual(await api(other),otherBefore);
   if(!await page.locator('.grub-repeat').evaluate(n=>n.open))await page.locator('.grub-repeat>summary').click();
   const screenshot=out+'/'+engine.name()+'-everyday-next.png';
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:screenshot});
   assert.equal(await page.locator('#grubRecommendation .grub-food-image:visible').count(),0);
   assert.deepEqual(errors,[]);
   report.cases.push({engine:engine.name(),checks:['remembered effort; saved plan unchanged','explicit like supplies repeat','one repeat saves Today plus scaled shopping','reload keeps repeat and preference','five-minute empty state remains recoverable','other account unchanged; no browser errors'],screenshot});
   console.log('PASS',engine.name(),6);
  }finally{await browser.close()}
 }
}finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await new Promise(r=>server.close(r))}
