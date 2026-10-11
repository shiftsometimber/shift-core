const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=process.argv[2];assert(dir,'Evidence directory required');
const cases=[
 {path:'/tools/alcohol',form:'alcForm',fields:{'[name="ml"]':'568','[name="abv"]':'4','[name="n"]':'2'},result:'alcR',expected:'4.5 units total'},
 {path:'/tools/bmi',form:'bmiForm',fields:{'#bmiHeightCm':'180','#bmiWeightKg':'80'},result:'bmiR',expected:'BMI: 24.7'},
 {path:'/tools/calories',form:'calForm',fields:{'#calHeightCm':'180','#calWeightKg':'80','#calAge':'40','[name="activity"]':'1.2'},result:'calR',expected:'2076 kcal/day'},
 {path:'/tools/healthy-weight',form:'rangeForm',fields:{'#rangeHeightCm':'180'},result:'rangeR',expected:'59.9–80.7 kg'},
 {path:'/tools/protein',form:'proteinForm',fields:{'#proteinWeightKg':'80','[name="level"]':'1.6'},result:'proteinR',expected:'128 g protein/day'},
 {path:'/tools/waist-height',form:'whForm',fields:{'#whHeightCm':'180','#waistCm':'90'},result:'whR',expected:'0.50'},
 {path:'/tools/walking',form:'walkForm',fields:{'#walkWeightKg':'80','[name="minutes"]':'30','[name="pace"]':'3.5'},result:'walkR',expected:'147 kcal'},
 {path:'/tools/water',form:'waterForm',fields:{'#waterWeightKg':'80'},result:'waterR',expected:'2.4 L'}
];
// Affected acceptance only: exact approved strip, keyboard and recovery at380/1440.
async function verifyWaistReadingStripJourney(browser,checks){
 const origin='https://shiftsometimber.co.uk';
 const expected=[['BMI calculator','/tools/bmi'],['Understand obesity and choose one step','/male-obesity'],['Start Here','/start-here']];
 for(const width of [380,1440]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();
  try{
   const response=await page.goto(origin+'/tools/waist-height',{waitUntil:'commit',timeout:60000});assert.equal(response.status(),200);
   await page.locator('#sstCookieSettings').waitFor({state:'visible',timeout:60000});
   if(!await page.getByRole('dialog',{name:'Cookie choices',exact:true}).isVisible())await page.getByRole('button',{name:'Cookie choices',exact:true}).click();
   await page.getByRole('button',{name:'Necessary only',exact:true}).click();
   const checkStrip=async()=>{
    const strip=page.locator('#seo-authority-links');await strip.waitFor({state:'visible'});
    assert.deepEqual(await strip.locator('a').evaluateAll(es=>es.map(e=>[e.textContent,e.getAttribute('href')])),expected);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Waist tool sideways scroll');
   };
   const calculate=async()=>{
    await page.waitForFunction(()=>typeof document.getElementById('whForm')?.onsubmit==='function');
    await page.locator('#whForm').getByRole('button',{name:'Metric',exact:true}).press('Enter');
    // The existing flow updates visible unit classes on its next task; wait before native Tab.
    await page.locator('#whHeightCm').waitFor({state:'visible'});
    await page.locator('#whHeightFt').waitFor({state:'hidden'});
    const keyboardSelect=async(id,value)=>{
     await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.id),id,'Metric inputs must be reachable in keyboard order');
     const values=await page.locator('#'+id).evaluate(e=>Array.from(e.options,o=>o.value)),index=values.indexOf(value);assert(index>=0);
     const fromEnd=values.length-1-index<index;await page.keyboard.press(fromEnd?'End':'Home');
     for(let i=0;i<(fromEnd?values.length-1-index:index);i++)await page.keyboard.press(fromEnd?'ArrowUp':'ArrowDown');
     assert.equal(await page.locator('#'+id).inputValue(),value,'Native select keyboard choice');
    };
    await keyboardSelect('whHeightCm','180');await keyboardSelect('waistCm','90');
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.textContent.trim()),'Calculate ratio');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.getElementById('whR')?.textContent.includes('0.50'));
    const actual=await page.locator('#whR').innerText();assert(actual.includes('0.50 is in the increased band.')&&actual.includes('increased central adiposity.')&&/not a diagnosis/i.test(actual)&&/35/.test(actual),'Correct result and screening limitation required');return actual;
   };
   await checkStrip();const initialResult=await calculate();
   await page.locator('#seo-authority-links a').first().focus();
   for(const [,path]of expected){assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('href')),path,'Reading-strip Tab order');if(path!==expected.at(-1)[1])await page.keyboard.press('Tab');}
   await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('href')),expected[1][1],'Reverse keyboard recovery');
   await page.locator('#whR').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/waist-result-'+width+'.png'});
   await page.locator('#seo-authority-links').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/waist-strip-'+width+'.png'});
   const onward=[];
   for(const [name,path] of expected){
    const link=page.locator('#seo-authority-links').getByRole('link',{name,exact:true});await link.focus();assert(await link.evaluate(e=>e===document.activeElement));
    const [r]=await Promise.all([page.waitForNavigation({waitUntil:'commit',timeout:60000}),page.keyboard.press('Enter')]);assert.equal(r.status(),200);assert.equal(new URL(page.url()).pathname,path);await page.locator('main h1').waitFor({state:'visible',timeout:60000});
    onward.push({name,path,status:r.status(),h1:await page.locator('main h1').innerText(),keyboard:'Tab/native selection/Enter; Shift+Tab recovery'});
    await page.goBack({waitUntil:'commit',timeout:60000});assert.equal(new URL(page.url()).pathname,'/tools/waist-height');await page.locator('#whForm').waitFor({state:'visible'});await checkStrip();
   }
   await page.reload({waitUntil:'commit',timeout:60000});await page.locator('#whForm').waitFor({state:'visible'});await checkStrip();const refreshedResult=await calculate();
   checks.push({viewportWidth:width,path:'/tools/waist-height',case:'approved reading-strip keyboard/onward/Back/refresh acceptance',passed:true,strip:expected,onward,initialResult,refreshedResult,analyticsChoice:'Necessary only',noAccountCreated:true,classification:'Controlled public Chromium QA; not physical-device or customer-outcome evidence'});
  }catch(error){checks.push({viewportWidth:width,path:'/tools/waist-height',case:'approved reading-strip keyboard/onward/Back/refresh acceptance',passed:false,error:error.message});}
  finally{await context.close();}
 }
}

(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true});const checks=[];
try{
 await verifyWaistReadingStripJourney(browser,checks);
 for(const [label,viewport] of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:1000}]]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'});const page=await context.newPage();
  for(const c of cases){
   const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
   try{
    const response=await page.goto('https://shiftsometimber.co.uk'+c.path,{waitUntil:'load',timeout:30000});assert.equal(response.status(),200);
    const form=page.locator('#'+c.form);await page.waitForFunction(id=>typeof document.getElementById(id)?.onsubmit==='function',c.form);
    if(c.form!=='alcForm')await form.getByRole('button',{name:'Metric',exact:true}).click();
    for(const [selector,value] of Object.entries(c.fields)){const element=form.locator(selector);if(await element.evaluate(e=>e.tagName)==='SELECT')await element.selectOption(value);else await element.fill(value);}
    await form.locator('button').filter({hasNotText:/Metric|UK \/ Imperial/}).last().click();
    const result=page.locator('#'+c.result);await result.waitFor({state:'visible'});await page.waitForFunction(({id,text})=>document.getElementById(id)?.innerText.includes(text),{id:c.result,text:c.expected});
    const actual=await result.innerText();assert(actual.includes(c.expected));assert(!/NaN|Infinity/.test(actual));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
    checks.push({viewport:label,path:c.path,inputs:c.fields,expected:c.expected,result:actual.slice(0,220),passed:true,horizontalOverflow:overflow,pageErrors:errors});
    if(label==='mobile'&&c.form==='alcForm'){
     await form.locator('[name="n"]').fill('-1');
     assert.equal(await form.evaluate(e=>e.checkValidity()),false,'Negative quantity accepted by browser');
     checks.push({viewport:label,path:c.path,case:'negative quantity rejected by native form validation',passed:true});
     await form.locator('[name="n"]').fill('1');await form.getByRole('button',{name:'Calculate',exact:true}).click();await page.waitForFunction(()=>document.getElementById('alcR').innerText.includes('2.3 units total'));
     checks.push({viewport:label,path:c.path,case:'recalculation updates result to 2.3 units',passed:true});
    }
   }catch(error){checks.push({viewport:label,path:c.path,passed:false,error:error.message,pageErrors:errors});}
   page.off('pageerror',listener);
  }
  await page.goto('https://shiftsometimber.co.uk/decision-centre',{waitUntil:'load'});
  for(const name of ['Treatment routes','NHS pathway checker','Weight-loss scenarios','GP report']){
   try{const button=page.getByRole('button',{name,exact:true});if(await button.isDisabled()){assert(await page.locator('[data-tool-guidance="20261009"]').count(),'Unavailable tab has no explanation');checks.push({viewport:label,path:'/decision-centre',case:'unavailable without a saved profile: '+name,passed:true});continue;}await button.click();checks.push({viewport:label,path:'/decision-centre',case:'tab '+name,passed:true,tab:await button.evaluate(e=>({active:e.className,selected:e.getAttribute('aria-selected'),target:e.dataset.tab||e.dataset.dcTab||null})),mainText:(await page.locator('main').innerText()).slice(0,250)});}
   catch(error){checks.push({viewport:label,path:'/decision-centre',case:name,passed:false,error:error.message});}
  }
  await context.close();
 }
}finally{await browser.close();}
const receipt={verifiedAt:new Date().toISOString(),scope:'Live Chromium desktop/mobile calculator interactions and Decision Centre tab clicks; no member accounts, purchases or submissions',checks};
fs.writeFileSync(dir+'/browser-verification-20261009.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));if(checks.some(c=>!c.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});

