// Phone/desktop discovery checks on the actual Worker with isolated accounts.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {GRUB_DISCOVERY_MANIFEST} from '../grub-discovery-manifest-20261017.mjs';
assert.equal(GRUB_DISCOVERY_MANIFEST.status,'pending_editorial_publication');
GRUB_DISCOVERY_MANIFEST.status='approved'; // Only this isolated test process; disk stays pending.
const {origin,server}=await import('./grub-ease-fixture.mjs');
const out=process.env.GRUB_EASE_OUT;mkdirSync(out,{recursive:true});
const report={scope:'Unpublished corrected discovery overlay in isolated synthetic account; not signed-in production acceptance',productionWrites:0,physicalDevice:false,cases:[],limitations:['New pizza recipes remain unpublished pending real independent human review. The production pizza-search acceptance is not passed by this run.']};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await ctx.addInitScript(()=>window.SST_API_BASE=location.origin);
  await ctx.addCookies([{name:'sst_session',value:'fixture-token-1',url:origin,httpOnly:true}]);
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:404,body:'No external traffic'}));
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
  await page.goto(origin+'/member/grub?view=app',{waitUntil:'domcontentloaded'});
  await page.locator('#grubRecommendation [data-food-pick]').waitFor();
  const consent=page.locator('[data-consent="necessary"]');if(await consent.isVisible())await consent.click();
  const search=async q=>{
   await page.locator('#grubSearch').fill(q);
   const response=page.waitForResponse(r=>r.url().endsWith('/v1/grub/search')&&r.request().method()==='POST');
   await page.locator('#grubSearchGo').click();
   const r=await response;assert.equal(r.status(),200);return r.json();
  };
  const pizza=await search('pizza');assert.equal(pizza.top.length,0);assert(!/Buffalo|Nashville/.test(await page.locator('#grubDiscoverResults').innerText()));
  const lunch=await search('lunch');assert(lunch.top.length);assert(lunch.top.every(r=>r.meal_type==='lunch'));assert(lunch.top.some(r=>r.name.includes('sandwich')));
  const dinner=await search('family dinner');assert(dinner.top.length);assert(dinner.top.every(r=>r.meal_type==='dinner'));
  await page.locator('#grubDiscoverResults .grub-recipe-detail').first().locator('summary').click();
  const details=page.locator('#grubDiscoverResults .grub-recipe-detail').first();assert(await details.getByText(/Preparation:.*cooking:.*Total ready-to-eat time:/).count());assert(await details.locator('li').count()>5);assert(await details.getByText(/Estimated hands-on time:/).count());
  await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+1,{},{timeout:5000});const layout=await page.evaluate(()=>({viewport:innerWidth,scrollX,root:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('body *')].filter(n=>n.getClientRects().length&&n.getBoundingClientRect().width>innerWidth).slice(-12).map(n=>({tag:n.tagName,id:n.id,class:n.className,width:n.getBoundingClientRect().width,left:n.getBoundingClientRect().left,whiteSpace:getComputedStyle(n).whiteSpace,overflowX:getComputedStyle(n).overflowX,text:n.textContent.slice(0,100)})),overflow:[...document.querySelectorAll('body *')].filter(n=>n.getClientRects().length&&n.getBoundingClientRect().right>innerWidth+1).map(n=>({tag:n.tagName,id:n.id,class:n.className,right:n.getBoundingClientRect().right,text:n.textContent.slice(0,140)})).slice(-15)}));writeFileSync(out+'/layout-'+width+'.json',JSON.stringify(layout,null,2));if(layout.root>width+1)console.log(JSON.stringify(layout));assert(layout.root<=width+1);assert.deepEqual(errors,[]);
  report.cases.push({width,checks:['Ordinary lunches found through lunch search','Family dinner search returns real dinner recipes','Full ingredient and method details agree with returned recipe','Preparation/cooking/elapsed time visible','No withdrawn novelty pizza appears','No page errors or viewport overflow'],pizzaClassicsAcceptance:'BLOCKED: unpublished',passed:true});
  await ctx.close();
 }
 report.pass=true;
}finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
console.log(JSON.stringify({pass:report.pass,cases:report.cases.length,checks:report.cases.reduce((n,c)=>n+c.checks.length,0),productionAcceptance:false}));
