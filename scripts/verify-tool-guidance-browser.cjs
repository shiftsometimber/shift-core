// Run against live after guarded deployment; optional local response fixtures are for paused-publication proof only.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=process.argv[2];assert(dir,'Evidence directory required');
const fields={
 '/tools/alcohol':{'[name="ml"]':'568','[name="abv"]':'4','[name="n"]':'2'},
 '/tools/bmi':{'#bmiHeightCm':'180','#bmiWeightKg':'80'},
 '/tools/calories':{'#calHeightCm':'180','#calWeightKg':'80','#calAge':'40','[name="activity"]':'1.2'},
 '/tools/healthy-weight':{'#rangeHeightCm':'180'},
 '/tools/protein':{'#proteinWeightKg':'80','[name="level"]':'1.6'},
 '/tools/waist-height':{'#whHeightCm':'180','#waistCm':'90'},
 '/tools/walking':{'#walkWeightKg':'80','[name="minutes"]':'30','[name="pace"]':'3.5'},
 '/tools/water':{'#waterWeightKg':'80'}
};
const expected={'/tools/alcohol':'4.5 units total','/tools/bmi':'BMI: 24.7','/tools/calories':'2076 kcal/day','/tools/healthy-weight':'59.9–80.7 kg','/tools/protein':'128 g protein/day','/tools/waist-height':'0.50','/tools/walking':'147 kcal','/tools/water':'2.4 L'};
(async()=>{
 const {TOOL_GUIDANCE,improveToolGuidance}=await import('../public-tool-guidance.mjs');const browser=await chromium.launch({headless:true}),checks=[];
 fs.mkdirSync(dir,{recursive:true});const fixture=process.env.TOOL_GUIDANCE_FIXTURE_DIR;
 try{for(const [label,viewport] of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:1000}]]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  if(fixture)await context.route('https://shiftsometimber.co.uk/**',async route=>{const path=new URL(route.request().url()).pathname;if(TOOL_GUIDANCE[path]||path==='/decision-centre'){const file=fixture+'/'+path.slice(1).replaceAll('/','-')+'.html';assert(fs.existsSync(file));await route.fulfill({status:200,contentType:'text/html',body:improveToolGuidance(fs.readFileSync(file,'utf8'),path)});}else await route.continue();});
  const page=await context.newPage();
  for(const [path,g] of Object.entries(TOOL_GUIDANCE)){
   const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
   try{
    assert.equal((await page.goto('https://shiftsometimber.co.uk'+path,{waitUntil:'load'})).status(),200);
    const form=page.locator('#'+g.form),result=page.locator('#'+g.result);await page.waitForFunction(id=>typeof document.getElementById(id)?.onsubmit==='function',g.form);
    assert.equal(await result.isVisible(),false,'Default number shown as a personal result');assert(await form.locator('[data-tool-input-prompt]').isVisible());
    const guide=page.locator('[data-tool-guidance="20261009"]');assert.equal(await guide.locator('li').count(),3);assert((await guide.innerText()).includes(g.method));
    if(g.form!=='alcForm')await form.getByRole('button',{name:'Metric',exact:true}).click();
    for(const [selector,value] of Object.entries(fields[path])){const element=form.locator(selector);if(await element.evaluate(e=>e.tagName)==='SELECT')await element.selectOption(value);else await element.fill(value);}
    await form.locator('button').filter({hasNotText:/Metric|UK \/ Imperial/}).last().click();await result.waitFor({state:'visible'});
    await page.waitForFunction(({id,text})=>document.getElementById(id)?.innerText.includes(text),{id:g.result,text:expected[path]});
    const actual=await result.innerText();assert(actual.includes(g.action),'Result lacks concrete guidance');assert(!/NaN|Infinity/.test(actual));
    assert.equal(await form.locator('[data-tool-input-prompt]').isVisible(),false);
    const next=result.locator('.whats-next .nextlinks a');if(await next.count()){assert.equal(await next.getAttribute('href'),g.href);assert.equal(await next.innerText(),g.label+' →');}
    const field=form.locator(Object.keys(fields[path])[0]);await field.dispatchEvent('input');assert.equal(await result.isVisible(),false,'Stale result visible after input changes');
    if(g.form==='alcForm'){await form.locator('[name="n"]').fill('-1');await form.getByRole('button',{name:'Calculate',exact:true}).click();assert.equal(await form.evaluate(f=>f.checkValidity()),false);assert.equal(await result.isVisible(),false,'Invalid input displayed a result');}
    assert.equal(errors.length,0,'Browser script errors');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'Horizontal overflow');
    checks.push({viewport:label,path,passed:true,defaultResultHidden:true,threeSpecificSteps:true,calculation:expected[path],action:g.action,destination:g.href,changedInputHidesStaleResult:true,invalidInputRejected:g.form==='alcForm'});
   }catch(error){checks.push({viewport:label,path,passed:false,error:error.message,pageErrors:errors});}
   page.off('pageerror',onError);
  }
  try{
   await page.goto('https://shiftsometimber.co.uk/decision-centre',{waitUntil:'load'});
   const guide=page.locator('[data-tool-guidance="20261009"]');assert((await guide.innerText()).includes('does not create one'));
   for(const key of ['nhs','scenarios','gp'])assert.equal(await page.locator(`[data-tab="${key}"]`).isDisabled(),true,'Empty-profile feature remains enabled');
   assert.equal(await page.locator('#tab-gp button[onclick="window.print()"] ').isDisabled(),true);
   await guide.getByRole('link',{name:'Enter your preferences in Treatment Finder →',exact:true}).click();await page.waitForURL('**/treatment-finder');assert(await page.locator('#treatmentFinderForm').isVisible());assert((await page.locator('main').innerText()).includes('What are you primarily trying to achieve?'));
   checks.push({viewport:label,path:'/decision-centre',passed:true,noProfileControlsDisabled:true,emptyPersonalReportDisabled:true,nextStepReachesEditableTreatmentFinder:true});
  }catch(error){checks.push({viewport:label,path:'/decision-centre',passed:false,error:error.message});}
  await context.close();
 }}finally{await browser.close();}
 const receipt={checkedAt:new Date().toISOString(),scope:fixture?'Prepared nine-page responses served only in an isolated browser, using current live assets; not a production deployment.':'Live nine-page content and calculator journey',checks};fs.writeFileSync(dir+'/tool-guidance-browser.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({checkedAt:receipt.checkedAt,scope:receipt.scope,checks:checks.length,passed:checks.filter(c=>c.passed).length,failures:checks.filter(c=>!c.passed)}));if(checks.some(c=>!c.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
