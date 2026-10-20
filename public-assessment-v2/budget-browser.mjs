import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
const root=process.env.ASSESSMENT_RELEASE_DIR,origin=process.env.ASSESSMENT_BROWSER_ORIGIN,out=process.env.ASSESSMENT_BROWSER_EVIDENCE;await fs.mkdir(out,{recursive:true});
const prices=JSON.parse(await fs.readFile(root+'/source/budget-price-snapshot.json','utf8'));
const result=process.env.BUDGET_RESUME==='true'?JSON.parse(await fs.readFile(out+'/partial.json','utf8')):{origin,cases:[],newScriptErrors:[],inheritedErrors:[],clinicalOrPaymentRequests:0};assert.equal(result.origin,origin);
for(const[engine,width,matrix]of[[chromium,390,true],[chromium,1440,false],[webkit,390,false]]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>{if(e.message.includes('/service-worker-v3a.js?v=cos-live-recovery-20260909-r2 due to access control checks.'))result.inheritedErrors.push(e.message);else result.newScriptErrors.push(e.message);});
 page.on('request',r=>{if(/\/v1\/(?:commerce\/medicine-checkout|commerce\/medicine-clinical|pharmacy\/|clinical\/)/.test(r.url()))result.clinicalOrPaymentRequests++;});
 const choose=async(selector)=>{const b=page.locator(selector);if(await b.getAttribute('aria-pressed')!=='true')await b.click();};
 const prefs=matrix?['Jabs','Tablets','Either','No medication']:['Jabs'];
 const bands=matrix?['nhs','under100','band150','band200','over200']:['band150'];
 async function check(pref,band,access){
  const panel=page.locator('[data-budget-potential-route]');await panel.waitFor();assert.equal(await panel.count(),1);
  assert(await page.locator('[data-result-money]').evaluate(el=>el.nextElementSibling?.hasAttribute('data-budget-potential-route')));
  assert.equal(await panel.locator('a,button,input,select').count(),0);assert.match(await panel.innerText(),/Your potential route/);
  const count=await panel.locator('[data-route-medicine]').count(),paid=pref!=='No medication'&&band!=='nhs'&&access!=='NHS';assert.equal(count,paid?6:0);
  if(paid){for(const p of prices){const row=panel.locator('[data-route-medicine="'+p.name+'"]');assert.match(await row.innerText(),new RegExp('£'+p.low/100+'–£'+p.high/100+' per listed pack'));}assert.match(await panel.innerText(),/not calendar-month costs/);assert.match(await panel.innerText(),/Orders and payments are currently closed/);assert.doesNotMatch(await panel.innerText(),/within your budget|affordable|best match/i);assert((await panel.locator('[data-route-medicine]').first().innerText()).includes(pref==='Tablets'?'tablet':'injection'));}
  else assert.match(await panel.innerText(),/free My Timber|Free My Timber/);
  if(pref==='No medication')assert.match(await panel.innerText(),/support without medication/);
  if(pref!=='No medication'&&(access==='NHS'||band==='nhs'))assert.match(await panel.innerText(),/NHS/);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(new URL(page.url()).pathname,'/start-here');
  result.cases.push({engine:engine.name(),width,preference:pref,band,access,routeDirectlyBelowBudget:true,noExtraClick:true,priceRows:count});await fs.writeFile(out+'/partial.json',JSON.stringify(result,null,2));
  if(pref==='Jabs'&&band==='band150'&&access==='Both')await panel.screenshot({path:out+'/'+engine.name()+'-'+width+'-route.png'});
 }
 async function run(pref,band,access){
  if(result.cases.some(c=>c.engine===engine.name()&&c.width===width&&c.preference===pref&&c.band===band&&c.access===access))return;
  await page.goto(origin+'/start-here',{waitUntil:'commit'});await page.locator('[data-multi="why"] button[aria-pressed="false"]').first().waitFor();
  const necessary=page.getByRole('button',{name:'Necessary only',exact:true});if(await necessary.isVisible())await necessary.click();
  await page.locator('[data-multi="why"] button').first().click();await page.locator('[data-quick-next]').click();
  await choose('[data-one="med"] button:has(strong:text-is("'+pref+'"))');await choose('[data-one="access"] button:text-is("'+access+'")');await page.locator('[data-quick-next]').click();
  await choose('[data-budget-band="'+band+'"]');await page.locator('[data-quick-next]').click();await check(pref,band,access);
 }
 for(const pref of prefs)for(const band of bands)await run(pref,band,'Both');
 if(matrix)await run('Jabs','band150','NHS');
 await page.locator('[data-result-money]').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+engine.name()+'-'+width+'.png',fullPage:true});await browser.close();
}
assert.equal(result.cases.length,23);assert.deepEqual(result.newScriptErrors,[]);assert.equal(result.clinicalOrPaymentRequests,0);await fs.writeFile(out+'/receipt.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({origin,cases:result.cases.length,newScriptErrors:result.newScriptErrors,clinicalOrPaymentRequests:result.clinicalOrPaymentRequests,inheritedErrors:result.inheritedErrors}));
