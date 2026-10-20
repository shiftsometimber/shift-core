import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
const root=process.env.ASSESSMENT_RELEASE_DIR,origin=process.env.ASSESSMENT_BROWSER_ORIGIN,out=process.env.ASSESSMENT_BROWSER_EVIDENCE;
await fs.mkdir(out,{recursive:true});
const prices=JSON.parse(await fs.readFile(root+'/source/budget-price-snapshot.json','utf8'));
const result={origin,mainContrastGuardSimulated:!!process.env.LAYOUT_MAIN_CONTRAST_GUARD,cases:[],newScriptErrors:[],inheritedErrors:[],clinicalOrPaymentRequests:0};
for(const[engine,width,matrix]of[[chromium,390,true],[chromium,1440,false],[webkit,390,false]]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
 if(process.env.LAYOUT_MAIN_CONTRAST_GUARD){const guard=await fs.readFile(process.env.LAYOUT_MAIN_CONTRAST_GUARD,'utf8');await context.addInitScript({content:"document.addEventListener('DOMContentLoaded',()=>{"+guard+";document.documentElement.dataset.layoutQaContrastReady='1';},{once:true});"});}
 const page=await context.newPage();
 page.on('pageerror',e=>{if(e.message.includes('/service-worker-v3a.js?v=cos-live-recovery-20260909-r2 due to access control checks.'))result.inheritedErrors.push(e.message);else result.newScriptErrors.push(e.message);});
 page.on('request',r=>{if(/\/v1\/(?:commerce\/medicine-checkout|commerce\/medicine-clinical|pharmacy\/|clinical\/)/.test(r.url()))result.clinicalOrPaymentRequests++;});
 const choose=async selector=>{const b=page.locator(selector);if(await b.getAttribute('aria-pressed')!=='true')await b.click();};
 async function screenshots(label){
  await page.locator('.sst-option-visual').evaluateAll(async images=>{await Promise.all(images.map(img=>img.decode()));});
  const box=await page.locator('#quickResult').boundingBox();
  await page.evaluate(y=>scrollTo(0,y),await page.evaluate(()=>document.querySelector('#quickResult').getBoundingClientRect().top+scrollY)-110);
  await page.screenshot({path:out+'/'+label+'-top.png'});
  await page.locator('[data-budget-potential-route]').screenshot({path:out+'/'+label+'-options.png'});
  await page.locator('#quickResult').screenshot({path:out+'/'+label+'-whole-result.png'});
  assert(box.width<=width);
 }
 async function check(pref,band,access){
  const panel=page.locator('[data-budget-potential-route]');await panel.waitFor();assert.equal(await panel.count(),1);
  const measured=await panel.evaluate(el=>{const summary=document.querySelector('.sh-result-route-v72'),r=el.getBoundingClientRect(),s=summary.getBoundingClientRect(),aside=summary.querySelector('aside').getBoundingClientRect();return{isSibling:el.previousElementSibling===summary,panelWidth:r.width,summaryWidth:s.width,below:r.top>=s.bottom-1,summaryHeight:s.height,asideHeight:aside.height};});
  assert(measured.isSibling&&measured.below,'Potential route must follow the complete compact budget summary');
  assert(measured.panelWidth>=measured.summaryWidth*.98,'Potential route must use the full result width');
  assert(measured.asideHeight<180,'Budget aside must remain compact');
  assert.match(await panel.innerText(),/Your potential route/);
  const paid=pref!=='No medication'&&band!=='nhs'&&access!=='NHS',cards=panel.locator('[data-route-medicine]');
  assert.equal(await cards.count(),paid?6:0);
  if(paid){
   const toggle=panel.getByRole('group',{name:'Show medicine formats'});await toggle.waitFor();
   const expected=pref==='Tablets'?'Tablets':pref==='Jabs'?'Jabs':'Both';
   assert.equal(await toggle.getByRole('button',{name:expected,exact:true}).getAttribute('aria-pressed'),'true');
   assert.equal(await panel.locator('[data-route-medicine]:visible').count(),pref==='Either'?6:3);
   for(const[label,count,format]of[['Both',6,null],['Tablets',3,'tablet'],['Jabs',3,'jab']]){
    await toggle.getByRole('button',{name:label,exact:true}).click();
    assert.equal(await panel.locator('[data-route-medicine]:visible').count(),count);
    assert.equal(await toggle.locator('[aria-pressed=true]').count(),1);
    const contrast=await toggle.evaluate(el=>{const lum=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;},active=el.querySelector('[aria-pressed=true]'),bg=lum(getComputedStyle(active).backgroundColor),ratio=color=>{const fg=lum(color);return(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05);};return{text:ratio(getComputedStyle(active.querySelector('span')).color),paint:ratio(getComputedStyle(active.querySelector('span')).webkitTextFillColor),icon:ratio(getComputedStyle(active.querySelector('svg')).color)};});
    assert(contrast.text>=4.5&&contrast.paint>=4.5&&contrast.icon>=4.5,'Selected switch text and icon require 4.5:1 contrast: '+JSON.stringify(contrast));
    if(format)assert((await panel.locator('[data-route-medicine]:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.medicineFormat))).every(f=>f===format));
   }
   await toggle.getByRole('button',{name:'Both',exact:true}).click();
   for(const row of prices){const card=panel.locator('[data-route-medicine="'+row.name+'"]');assert.match(await card.innerText(),new RegExp('£'+row.low/100+'–£'+row.high/100));assert.match(await card.innerText(),/per listed pack/);assert.match(await card.innerText(),/OUT OF STOCK/);}
   const boxes=await cards.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{w:r.width,h:r.height};}));assert(Math.max(...boxes.map(x=>x.w))-Math.min(...boxes.map(x=>x.w))<2);assert(Math.max(...boxes.map(x=>x.h))-Math.min(...boxes.map(x=>x.h))<2);
   assert.match(await panel.innerText(),/not calendar-month costs/);assert.match(await panel.innerText(),/prescribing clinician must assess/);assert.match(await panel.innerText(),/Orders and payments are currently closed/);assert.doesNotMatch(await panel.innerText(),/within your budget|affordable|best match|matches your preferences/i);
   const jabs=toggle.getByRole('button',{name:'Jabs',exact:true});await jabs.focus();await page.keyboard.press('ArrowRight');assert.equal(await toggle.getByRole('button',{name:'Both',exact:true}).getAttribute('aria-pressed'),'true');
   await toggle.getByRole('button',{name:expected,exact:true}).click();
   assert.equal(await page.locator('[data-summary-med]').innerText(),pref,'Display filter must not change the recorded preference');
   if(pref==='Either'&&band==='band150')await screenshots(engine.name()+'-'+width);
  }else{
   assert.equal(await panel.locator('[data-format-filter]').count(),0);assert.match(await panel.innerText(),/free My Timber|Free My Timber/);
   if(pref==='No medication')assert.match(await panel.innerText(),/support without medication/);
   else assert.match(await panel.innerText(),/NHS/);
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(new URL(page.url()).pathname,'/start-here');
  result.cases.push({engine:engine.name(),width,preference:pref,band,access,fullWidthBelowBudget:true,noExtraClick:true,switchVerified:true,medicineCards:paid?6:0,measured});
  await fs.writeFile(out+'/partial.json',JSON.stringify(result,null,2));
 }
 async function run(pref,band,access){
  await page.goto(origin+'/start-here',{waitUntil:'commit'});await page.locator('[data-multi="why"] button[aria-pressed="false"]').first().waitFor();if(process.env.LAYOUT_MAIN_CONTRAST_GUARD)await page.waitForFunction(()=>document.documentElement.dataset.layoutQaContrastReady==='1');
  const necessary=page.getByRole('button',{name:'Necessary only',exact:true});if(await necessary.isVisible())await necessary.click();
  await page.locator('[data-multi="why"] button').first().click();await page.locator('[data-quick-next]').click();
  await choose('[data-one="med"] button:has(strong:text-is("'+pref+'"))');await choose('[data-one="access"] button:text-is("'+access+'")');await page.locator('[data-quick-next]').click();
  await choose('[data-budget-band="'+band+'"]');await page.locator('[data-quick-next]').click();await check(pref,band,access);
 }
 if(matrix){for(const pref of ['Jabs','Tablets','Either','No medication'])for(const band of ['nhs','under100','band150','band200','over200'])await run(pref,band,'Both');await run('Jabs','band150','NHS');}
 else await run('Either','band150','Both');
 await browser.close();
}
assert.equal(result.cases.length,23);assert.deepEqual(result.newScriptErrors,[]);assert.equal(result.clinicalOrPaymentRequests,0);
await fs.writeFile(out+'/receipt.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({origin,cases:result.cases.length,newScriptErrors:result.newScriptErrors,clinicalOrPaymentRequests:result.clinicalOrPaymentRequests,inheritedErrors:result.inheritedErrors}));
