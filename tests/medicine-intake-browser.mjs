// Synthetic rendering/behaviour proof. Not a partner, live-account or device test.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {gpFormRuntime} from '../member-experience/gp-form.mjs';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.INTAKE_BROWSER_EVIDENCE||'/tmp/shift-intake-browser';await mkdir(out,{recursive:true});
const html=await readFile(new URL('../frontend/member/treatment-assessment.html',import.meta.url),'utf8');
const js=await readFile(new URL('../frontend/member/treatment-assessment.js',import.meta.url),'utf8');
const expanded=await readFile(new URL('../frontend/member/assessment-questions-v2.js',import.meta.url),'utf8');
const css=await readFile(new URL('../frontend/member/clinical-intake-v1.css',import.meta.url),'utf8');
const reference='SCI-00000000-0000-4000-8000-000000000042';
const report={cases:[],limits:['Synthetic local routes and responses only','No real clinical, member, payment, email or provider requests','Desktop WebKit is not physical iPhone acceptance']};
for(const [engine,width]of [[chromium,380],[chromium,1440],[webkit,380]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let signedIn=true,pending=false,more=false,available=true,submissions=0,lastBody='',profileReads=0,account='synthetic-account-42',holdProfile=false,releaseProfile=null;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url()),path=u.pathname;
  const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data),headers:{'Access-Control-Allow-Origin':'https://intake.test','Access-Control-Allow-Credentials':'true'}});
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'https://intake.test','Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'content-type'}});
  if(path==='/v1/commerce/medicine-clinical-context')return signedIn?json({ok:true,accountReference:account,emailVerified:true,patientFirstName:account.endsWith('43')?'Second':'Synthetic',patientLastName:'Member',patientEmail:'synthetic@example.test',assessmentAvailable:true}):json({error:'account_required'},401);
  if(path==='/v1/member/details'){profileReads++;if(holdProfile)await new Promise(resolve=>releaseProfile=resolve);return json({ok:true,details:{phone:'01610000000',address1:'1 Synthetic Street',town:'Test town',postcode:'SK10 1AA',gpPractice:'Synthetic Practice',gpAddress:'1 Test Road',gpPostcode:'SK10 1AA'}});}
  if(path==='/v1/member/details/gp-search')return json({ok:true,practices:[{code:'SYN001',name:'Synthetic Directory Practice',postcode:'SK10 1AA',address:['1 Directory Street','Test town']}],hasMore:false});
  if(path==='/v1/catalogue/medicines')return json({products:[{name:'Mounjaro',variants:[{id:102,strengthLabel:'5 mg',status:available?'available':'out_of_stock'}]}]});
  if(path==='/v1/commerce/medicine-clinical-intake-status')return pending?json({ok:true,intakeReference:reference,variantId:102,status:more?'more_information_required':'submitted',verified:false,canResume:true}):json({error:'intake_not_found'},404);
  if(path==='/v1/commerce/medicine-clinical-intake'){submissions++;lastBody=route.request().postData()||'';pending=true;return json({ok:true,intakeReference:reference,variantId:102,status:'submitted',verified:false,canResume:true},202);}
  if(path==='/v1/commerce/medicine-clinical-intake-resume')return json({ok:true,resumeUrl:'https://portal.example.test/questions?session=opaque',expiresAt:new Date(Date.now()+60000).toISOString()});
  if(u.hostname==='portal.example.test')return route.fulfill({status:200,contentType:'text/html',body:'<h1>Secure pharmacy questions for the same assessment</h1>'});
  if(path==='/treatment-assessment')return route.fulfill({status:200,contentType:'text/html',body:html});
  if(path==='/assessment-questions-v2.js')return route.fulfill({contentType:'application/javascript',body:expanded});
  if(path==='/treatment-assessment.js')return route.fulfill({status:200,contentType:'text/javascript',body:js});
  if(path==='/clinical-intake-v1.css')return route.fulfill({status:200,contentType:'text/css',body:css});
  if(path==='/assets/member-experience/gp-form.mjs')return route.fulfill({status:200,contentType:'text/javascript',body:gpFormRuntime});
  return route.fulfill({status:404,body:'Unavailable local fixture route'});
 });
 const url='https://intake.test/treatment-assessment?variant=102&returnTo=%2Fmounjaro%3Fvariant%3D102';
 await page.goto(url);await page.locator('form#assessment').waitFor({state:'visible'}).catch(async error=>{throw Error(error.message+'; page status: '+await page.locator('#status').textContent()+'; script errors: '+JSON.stringify(errors));});
 assert.equal(profileReads,0);assert.equal(await page.locator('[name=patientPhone]').inputValue(),'');assert.equal(await page.locator('[name=gpPractice]').inputValue(),'');
 await page.getByRole('button',{name:'Use contact details saved in My Timber'}).click();await page.waitForFunction(()=>document.querySelector('[name=patientPhone]').value==='01610000000');
 assert.equal(profileReads,1);assert.equal(await page.locator('[name=gpPractice]').inputValue(),'');
 async function reviewQuestionnaire(){
  await page.evaluate(()=>{
   const form=document.getElementById('assessment');
   for(const [name,value]of Object.entries({dateOfBirth:'1981-08-03',weightRelatedCondition:'no',conditions:'None declared — synthetic',medicines:'None declared — synthetic',insulinUse:'no',previousTreatment:'no'})){form.elements[name].value=value;form.elements[name].dispatchEvent(new Event('change',{bubbles:true}));}
   for(const [label,value]of [['Centimetres','180'],['Whole kilograms','100']]){const select=document.querySelector('select[aria-label="'+label+'"]');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));}
   for(const {id,type,options}of window.SHIFT_ASSESSMENT.QUESTIONS){document.getElementById('clinical_'+id).value=type==='multi'?JSON.stringify(['None of the above']):options?(options.includes('No')?'No':options.includes('None of the above')?'None of the above':options[0]):type==='date'?'2026-10-19':'Synthetic detail';}
   document.getElementById('clinical_forMyself').value='Yes';document.getElementById('clinical_inUK').value='Yes';document.getElementById('clinical_gpSharingChoice').value='Yes';document.getElementById('prescribingAcknowledged').checked=true;window.SHIFT_EXPANDED_ASSESSMENT.refresh();
  });
  await page.getByRole('button',{name:'Review clinical answers',exact:true}).click();
  await page.getByRole('button',{name:'Continue to GP and evidence checks',exact:true}).click();
 }
 await reviewQuestionnaire();
 await page.getByRole('button',{name:'Use GP details saved in My Timber',exact:true}).click();await page.getByRole('button',{name:'Use these GP details',exact:true}).waitFor();assert.equal(await page.locator('[name=gpPractice]').inputValue(),'');
 await page.getByRole('button',{name:'Use these GP details',exact:true}).click();assert.equal(await page.locator('[name=gpPractice]').inputValue(),'Synthetic Practice');assert.equal(profileReads,2);
 assert.equal(await page.locator('[name=gpContactConsent]').isChecked(),false);assert.equal(await page.locator('[name=imageConsent]').isChecked(),false);
 assert.match(await page.locator('#selectionStatus').textContent(),/Mounjaro · 5 mg/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 report.cases.push({engine:engine.name(),width,case:'contact reuse and saved GP details require explicit requests and GP confirmation; consents unticked; exact dose/no overflow',passed:true});
 await page.locator('[name=gpPractice]').fill('Synthetic Directory');await page.locator('#assessmentGpSelect').waitFor({state:'visible'});await page.locator('#assessmentGpSelect').selectOption('0');
 assert.equal(await page.locator('[name=gpAddress]').inputValue(),'1 Directory Street, Test town');
 await page.locator('[name=gpAddress]').fill('Manual corrected GP address');assert.equal(await page.locator('[name=gpAddress]').inputValue(),'Manual corrected GP address');assert.equal(await page.locator('[name=gpContactConsent]').isChecked(),false);
 report.cases.push({engine:engine.name(),width,case:'actual GP component directory selection and manual override retain member control and separate consent',passed:true});
 await page.locator('[name=dateOfBirth]').fill('1981-08-03');await page.getByLabel('Centimetres',{exact:true}).selectOption('180');await page.getByLabel('Whole kilograms',{exact:true}).selectOption('100');
 await page.locator('[name=weightRelatedCondition]').selectOption('no');await page.locator('[name=conditions]').fill('None declared — synthetic');await page.locator('[name=medicines]').fill('None declared — synthetic');await page.locator('[name=insulinUse]').selectOption('no');
 await page.locator('#previousTreatment').selectOption('yes');assert.equal(await page.locator('[name=previousDose]').isDisabled(),false);
 await page.locator('[name=previousMedicine]').fill('Stale medicine');await page.locator('#previousTreatment').selectOption('no');assert.equal(await page.locator('[name=previousDose]').isDisabled(),true);
 await reviewQuestionnaire();
 await page.locator('[name=gpName]').fill('Dr Synthetic');
 for(const name of ['photoId','bodyFront','bodySide'])await page.locator('[name='+name+']').setInputFiles({name:name+'.jpg',mimeType:'image/jpeg',buffer:Buffer.from([255,216,255,217])});
 await page.evaluate(()=>{
  for(const {id,type,options}of window.SHIFT_ASSESSMENT.QUESTIONS){const el=document.getElementById('clinical_'+id);el.value=type==='multi'?JSON.stringify(['None of the above']):options?(options.includes('No')?'No':options.includes('None of the above')?'None of the above':options[0]):type==='date'?'2026-10-19':'Synthetic detail';}
  document.getElementById('clinical_forMyself').value='Yes';document.getElementById('clinical_inUK').value='Yes';document.getElementById('clinical_gpSharingChoice').value='Yes';document.getElementById('prescribingAcknowledged').checked=true;window.SHIFT_EXPANDED_ASSESSMENT.refresh();
 });
 for(const name of ['gpContactConsent','imageConsent','answersConfirmed'])await page.locator('[name='+name+']').check();
 const stored=await page.evaluate(()=>JSON.stringify(Object.entries(sessionStorage)));
 assert.equal(stored.includes('None declared'),false);assert.equal(stored.includes('01610000000'),false);
 await page.locator('button[type=submit]').click();await page.locator('#assessmentActions').waitFor({state:'visible'});
 assert.equal(submissions,1);assert.equal(lastBody.includes('Stale medicine'),false);assert.equal(lastBody.includes('None declared'),true);
 assert.equal(await page.locator('form#assessment').isVisible(),false);
 report.cases.push({engine:engine.name(),width,case:'conditional inputs, attachments, no health browser storage, one pending submission',passed:true});
 page.once('dialog',d=>d.accept());await page.reload();await page.locator('#assessmentActions').waitFor({state:'visible'});assert.equal(submissions,1);
 more=true;await page.locator('#checkAssessment').click();await page.locator('#resumeAssessment').waitFor({state:'visible'});
 assert.match(await page.locator('#status').textContent(),/same assessment/);
 await page.locator('#resumeAssessment').click();await page.waitForURL('https://portal.example.test/**');
 assert.equal(submissions,1);report.cases.push({engine:engine.name(),width,case:'refresh and clarification continue same assessment without re-entry or payment',passed:true});
 await page.goBack();await page.locator('#assessmentActions').waitFor({state:'visible'});assert.equal(submissions,1);assert.equal(await page.locator('form#assessment').isVisible(),false);
 report.cases.push({engine:engine.name(),width,case:'real browser Back reopens the existing case without another submission',passed:true});
 signedIn=false;await page.goto(url);await page.getByRole('link',{name:'Sign in or create an account'}).waitFor();
 assert.equal(await page.locator('[name=patientPhone]').inputValue(),'');assert.equal(await page.locator('form#assessment').isVisible(),false);
 assert.match(await page.getByRole('link',{name:'Sign in or create an account'}).getAttribute('href'),/returnTo=/);
 report.cases.push({engine:engine.name(),width,case:'session denial clears private view and retains safe sign-in return',passed:true});
 signedIn=true;pending=false;available=false;await page.goto(url);await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('not open'));
 assert.equal(await page.locator('form#assessment').isVisible(),false);assert.equal(submissions,1);
 report.cases.push({engine:engine.name(),width,case:'unavailable stock blocks new intake with clear next state',passed:true});
 available=true;await page.goto(url);await page.locator('form#assessment').waitFor({state:'visible'});holdProfile=true;
 await page.getByRole('button',{name:'Use contact details saved in My Timber'}).click();const holdDeadline=Date.now()+30000;while(!releaseProfile&&Date.now()<holdDeadline)await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof releaseProfile,'function','Saved profile request must start within the original browser wait budget');
 account='synthetic-account-43';await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
 await page.waitForFunction(()=>document.querySelector('[name=patientFirstName]').value==='Second');
 const oldResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/member/details');releaseProfile();await(await oldResponse).finished();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await page.locator('[name=patientPhone]').inputValue(),'');assert.equal(await page.locator('[name=patientFirstName]').inputValue(),'Second');
 report.cases.push({engine:engine.name(),width,case:'late saved-contact response cannot repopulate a reopened view belonging to another account; lifecycle events synthetic',passed:true});
 assert.deepEqual(errors,[]);await page.screenshot({path:out+'/'+engine.name()+'-'+width+'.png',fullPage:true});
 await browser.close();
}
report.finishedAt=new Date().toISOString();await writeFile(out+'/receipt.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
