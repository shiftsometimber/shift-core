import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const html=await readFile(new URL('../frontend/member/assessment-walkthrough.html',import.meta.url),'utf8');
const out=process.env.ASSESSMENT_BROWSER_EVIDENCE||'/tmp/assessment-v2-browser';await mkdir(out,{recursive:true});
const report={cases:[],limits:['Synthetic browser walkthrough; no real patient or provider acceptance','No medicines, payments or prescribing enabled','Desktop WebKit does not prove a physical iPhone']};
for(const [engine,width]of [[chromium,390],[chromium,1440],[webkit,390]]){
 const browser=await engine.launch({headless:true});const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{network.push(route.request().url());return new URL(route.request().url()).hostname==='assessment.test'?route.fulfill({contentType:'text/html',body:html}):route.abort();});
 await page.goto('https://assessment.test/assessment-walkthrough');
 assert.match(await page.locator('#expandedAssessment .prescribing-notice').first().textContent(),/prescribing clinician must/);
 for(const name of ['starting','switching','restarting','repeat']){
  await page.getByRole('button',{name:'Show fictional '+name+' case'}).click();
  const p=await page.evaluate(()=>window.SHIFT_EXPANDED_ASSESSMENT.payload());
  assert.equal(p.prescribingAcknowledged,true);assert.equal(p.answers.forMyself,'Yes');
  assert.equal('timeOnDose'in p.answers,name!=='starting');assert.equal('heightMeasuredAt'in p.answers,false);
  await page.getByRole('button',{name:'Review clinical answers'}).click();
  assert.match(await page.locator('#clinicalSummary').textContent(),/prescribing approval: pending/);
  assert.match(await page.locator('#clinicalSummary').textContent(),/Fictional Alex Example/);
  report.cases.push({engine:engine.name(),width,case:name+' case and complete pending handover',passed:true});
 }
 await page.getByText('Explore a medicine preference',{exact:true}).click();
 for(const [key,name]of [['wegovy-tablet','Wegovy tablets'],['foundayo','Foundayo tablets'],['orlistat','Orlistat capsules']]){
  await page.locator('#demoMedicine').selectOption(key);await page.getByRole('button',{name:'Review clinical answers'}).click();
  assert.match(await page.locator('#clinicalSummary').textContent(),new RegExp(name));
  assert.match(await page.locator('#clinicalSummary').textContent(),/Medicine preference:/);
  report.cases.push({engine:engine.name(),width,case:name+' preference reaches the pending prescriber summary',passed:true});
 }
 await page.evaluate(()=>{document.getElementById('clinical_medicalHistory').value='Not sure';document.getElementById('clinical_medicalHistoryDetails').value='<img src=x onerror=alert(1)>';document.getElementById('clinical_pregnancyPossible').value='Yes';document.getElementById('clinical_urgentSymptoms').value='Not sure';window.SHIFT_EXPANDED_ASSESSMENT.refresh();});
 let payload=await page.evaluate(()=>window.SHIFT_EXPANDED_ASSESSMENT.payload());assert.equal(payload.answers.medicalHistoryDetails,'<img src=x onerror=alert(1)>');assert.equal(payload.answers.contraception,'None reported in this fictional example.');
 await page.getByRole('button',{name:'Review clinical answers'}).click();assert.equal(await page.locator('#clinicalSummary img').count(),0);
 assert.match(await page.locator('#expandedAssessment').textContent(),/Do not wait for an online assessment/);
 await page.evaluate(()=>{document.getElementById('clinical_medicalHistory').value='None of the above';document.getElementById('clinical_pregnancyPossible').value='No';window.SHIFT_EXPANDED_ASSESSMENT.refresh();});
 payload=await page.evaluate(()=>window.SHIFT_EXPANDED_ASSESSMENT.payload());assert.equal(payload.answers.medicalHistoryDetails,undefined);assert.equal(payload.answers.contraception,undefined);
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 assert.deepEqual(network,['https://assessment.test/assessment-walkthrough']);assert.deepEqual(errors,[]);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:out+'/'+engine.name()+'-'+width+'.png',fullPage:true});
 await page.getByRole('button',{name:'Reset demonstration'}).click();assert.equal((await page.evaluate(()=>window.SHIFT_EXPANDED_ASSESSMENT.payload())).prescribingAcknowledged,false);
 report.cases.push({engine:engine.name(),width,case:'conditional follow-ups, urgent message, plain-text review, zero storage/network and reset',passed:true});
 await browser.close();
}
await writeFile(out+'/receipt.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
