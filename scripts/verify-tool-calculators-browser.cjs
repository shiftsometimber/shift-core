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
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true});const checks=[];
try{
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

