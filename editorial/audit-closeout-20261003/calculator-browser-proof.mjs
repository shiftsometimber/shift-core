import {chromium} from '/tmp/shift-audit-tools/node_modules/playwright/index.mjs';import{readFileSync,writeFileSync}from'node:fs';import assert from'node:assert/strict';
const dir='/private/tmp/shift-tools-audit-20261003',origin=process.env.PROOF_ORIGIN||'https://tools-audit-20261003.projectshift.pages.dev',build=JSON.parse(readFileSync(dir+'/build.json'));assert.equal((await fetch(origin+'/DEPLOYMENT-FINGERPRINT.json').then(r=>r.json())).aggregate_sha256,build.candidate);
const cases=[
['bmi','bmiR',{'#bmiHeightCm':'180','#bmiWeightKg':'90'},/BMI: 27.8/],
['calories','calR',{'#calHeightCm':'180','#calWeightKg':'90','#calAge':'40','[name=activity]':'1.2'},/2,?196 kcal/],
['healthy-weight','rangeR',{'#rangeHeightCm':'155'},/7 st 0 lb/],
['protein','proteinR',{'#proteinWeightKg':'90','[name=level]':'1.2'},/108/],
['waist-height','whR',{'#whHeightCm':'180','#waistCm':'90'},/0.50/],
['walking','walkR',{'#walkWeightKg':'90','[name=minutes]':'30','[name=pace]':'3.5'},/165 kcal/],
['water','waterR',{'#waterWeightKg':'90'},/2.7 L/],
['steps','stepsR',{'[name=n]':'10000'},/7.5 km/],
['sleep','sleepR',{'[name=wake]':'06:30','[name=hrs]':'8'},/22:30/],
['alcohol','alcR',{'[name=ml]':'250','[name=abv]':'12','[name=n]':'4'},/12.0 units/]
];const b=await chromium.launch(),rows=[];
for(const width of[390,1440])for(const[name,result,fields,expected]of cases){
const p=await b.newPage({viewport:{width,height:900}});const response=await p.goto(origin+'/tools/'+name,{waitUntil:'networkidle'});assert.equal(response.status(),200);const f=p.locator('form.toolbox');if(await f.locator('[data-unit=metric]').count())await f.locator('[data-unit=metric]').click();
for(const[selector,value]of Object.entries(fields)){const el=f.locator(selector);if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(value);else await el.fill(value)}
await f.locator('button:not([type=button])').click();await p.locator('#'+result).waitFor({state:'visible'});const text=await p.locator('#'+result).innerText();assert.match(text,expected,name);assert(!/NaN|Infinity| st 14 lb/.test(text));
if(name==='alcohol'){assert(text.includes('not an assessment of your drinking over a week'));assert(!text.includes('That sits within'));for(const[sel,bad]of[['[name=abv]','101'],['[name=ml]','-1'],['[name=n]','-1']]){const el=f.locator(sel),old=await el.inputValue();await el.fill(bad);assert.equal(await f.evaluate(e=>e.checkValidity()),false);await el.fill(old)}await f.locator('[name=abv]').fill('0');await f.locator('button:not([type=button])').click();assert.match(await p.locator('#alcR').innerText(),/0.0 units/)}
if(name==='walking'){assert.equal(await f.locator('[name=minutes] option').evaluateAll(es=>es.filter(e=>!e.textContent.trim()).length),0);assert((await p.locator('body').textContent()).includes('150 minutes of moderate-intensity'))}
if(name==='sleep')assert(!(await p.locator('body').textContent()).includes('20–to fall asleep'));
if(name==='steps'){await f.locator('[name=n]').fill('-1');assert.equal(await f.evaluate(e=>e.checkValidity()),false)}
const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert(overflow<=1,name+' overflow '+overflow);rows.push({path:'/tools/'+name,width,status:200,resultCorrect:true,overflow});await p.close()}
await b.close();writeFileSync(dir+'/proof.json',JSON.stringify({at:new Date().toISOString(),origin,fingerprint:build.candidate,rows},null,2));console.log(JSON.stringify({passed:true,checks:rows.length}));
