// Runs the shipped HTML, generated question runtime and actual intake client offline.
// DOM behaviour is verified; this is not browser layout, device or provider acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_MODULE||'jsdom');
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [memberHtml,client,expanded,demoHtml]=await Promise.all(['frontend/member/treatment-assessment.html','frontend/member/treatment-assessment.js','frontend/member/assessment-questions-v2.js','frontend/member/assessment-walkthrough.html'].map(read));
async function open({demo=false,emailVerified=true}={}){
 const errors=[],requests=[];const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(demo?demoHtml:memberHtml,{url:'https://intake.test/treatment-assessment?variant=102',runScripts:demo?'dangerously':'outside-only',pretendToBeVisual:true,virtualConsole,beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 const w=dom.window,doc=w.document;
 if(!demo){
  w.AbortSignal=AbortSignal;w.crypto.randomUUID=()=> '00000000-0000-4000-8000-000000000042';
  w.fetch=async(url,options={})=>{
   requests.push({path:new URL(url,'https://intake.test').pathname,method:options.method||'GET'});
   const path=new URL(url,'https://intake.test').pathname;
   if(path.endsWith('/medicine-clinical-context'))return Response.json({accountReference:'fictional-42',emailVerified,patientFirstName:'Fictional',patientLastName:'Example',patientEmail:'fictional@example.invalid',assessmentAvailable:true});
   if(path.endsWith('/medicine-clinical-intake-status'))return Response.json({error:'intake_not_found'},{status:404});
   if(path==='/v1/catalogue/medicines')return Response.json({products:[{name:'Mounjaro',variants:[{id:102,strengthLabel:'5 mg',status:'available'}]}]});
   throw Error('Unexpected test request: '+path);
  };
  w.eval(expanded);w.eval(client);
  for(let i=0;i<50&&doc.querySelector('#assessment').hidden;i++)await new Promise(r=>setTimeout(r,1));
  assert.equal(doc.querySelector('#assessment').hidden,false,'fictional authenticated context should open the assessment');
 }
 return {dom,w,doc,errors,requests,close:()=>dom.window.close()};
}
function change(c,element,value){element.value=value;element.dispatchEvent(new c.w.Event('change',{bubbles:true}));}
function select(c,label,value){change(c,c.doc.querySelector('select[aria-label="'+label+'"]'),value);}
function fill(c,path='Starting treatment'){
 const {doc,w}=c,form=doc.querySelector('#assessment');
 if(doc.body.dataset.assessmentDemo==='true'){
  const name=path.startsWith('Switching')?'switching':path.startsWith('Restarting')?'restarting':path.startsWith('Repeat')?'repeat':'starting';
  [...doc.querySelectorAll('#demoSamples button')].find(b=>b.getAttribute('aria-label')==='Show fictional '+name+' case').click();return;
 }
 for(const [name,value]of Object.entries({patientFirstName:'Fictional',patientLastName:'Example',patientPhone:'01610000000',patientAddress1:'1 Example Street',patientTown:'Example Town',patientPostcode:'SK10 1AA',dateOfBirth:'1984-05-12',weightRelatedCondition:'no',conditions:'None',medicines:'None',insulinUse:'no',previousTreatment:'no'}))change(c,form.elements[name],value);
 select(c,'Centimetres','180');select(c,'Whole kilograms','107');
 for(const q of w.SHIFT_ASSESSMENT.QUESTIONS){doc.getElementById('clinical_'+q.id).value=q.type==='multi'?JSON.stringify(['None of the above']):q.options?(q.options.includes('No')?'No':q.options.includes('None of the above')?'None of the above':q.options[0]):q.type==='date'?'2026-10-19':'Fictional detail';}
 doc.getElementById('clinical_requestPath').value=path;doc.getElementById('clinical_forMyself').value='Yes';doc.getElementById('clinical_inUK').value='Yes';doc.getElementById('clinical_gpSharingChoice').value='Yes';doc.getElementById('prescribingAcknowledged').checked=true;
 w.SHIFT_EXPANDED_ASSESSMENT.refresh();
}
const review=c=>[...c.doc.querySelectorAll('#expandedAssessment button')].find(b=>b.textContent==='Review clinical answers').click();
test('each request path requires every active answer before the GP/evidence step',async()=>{
 for(const path of ['Starting treatment','Switching provider or medicine','Restarting after a break','Repeat treatment']){
  const c=await open();try{
   fill(c,path);const checks=c.doc.getElementById('verificationChecks'),submit=c.doc.querySelector('button[type=submit]');
   assert(checks.hidden&&checks.disabled);assert(submit.disabled);
   const id=path==='Starting treatment'?'medicines1':'timeOnDose';change(c,c.doc.getElementById('clinical_'+id),'');review(c);
   assert(checks.hidden&&checks.disabled);assert(submit.disabled);assert.match(c.doc.getElementById('status').textContent,/Please answer/);
   change(c,c.doc.getElementById('clinical_'+id),id==='medicines1'?'None of the above':'Fictional complete detail');review(c);
   assert.equal(c.doc.getElementById('clinicalSummary').hidden,false);assert(checks.disabled);
   c.doc.getElementById('continueToVerification').click();assert.equal(checks.hidden,false);assert.equal(checks.disabled,false);assert.equal(submit.disabled,false);
   assert.match(c.doc.getElementById('purchaseReadiness').textContent,/still require clinical checks/);
   assert.equal(c.doc.querySelector('#purchaseReadiness button').disabled,true);
   // The real required GP, files and permissions are still outstanding: a native click cannot submit.
   submit.click();assert.equal(c.requests.filter(r=>r.method==='POST').length,0);
   assert.equal(c.doc.querySelector('[name=gpContactConsent]').checked,false);assert.equal(c.doc.querySelector('[name=imageConsent]').checked,false);
   assert.deepEqual(c.errors,[]);
  }finally{c.close();}
 }
});
test('editing an answer or patient measurement invalidates the review and locks the next step',async()=>{
 const c=await open();try{fill(c);review(c);c.doc.getElementById('continueToVerification').click();
  change(c,c.doc.getElementById('clinical_medicalHistory'),'Not sure');change(c,c.doc.getElementById('clinical_medicalHistoryDetails'),'Awaiting records');assert(c.doc.getElementById('verificationChecks').disabled);assert(c.doc.querySelector('button[type=submit]').disabled);
  review(c);c.doc.getElementById('continueToVerification').click();select(c,'Whole kilograms','106');assert(c.doc.getElementById('verificationChecks').disabled);
 }finally{c.close();}
});
test('unknown answers and urgent symptoms require detail; pregnancy questions stay conditional',async()=>{
 const c=await open();try{fill(c);change(c,c.doc.getElementById('clinical_medicalHistory'),'Not sure');change(c,c.doc.getElementById('clinical_medicalHistoryDetails'),'');review(c);assert.match(c.doc.getElementById('status').textContent,/Please give details/);
  change(c,c.doc.getElementById('clinical_medicalHistoryDetails'),'Awaiting clinical records');change(c,c.doc.getElementById('clinical_urgentSymptoms'),'Yes');change(c,c.doc.getElementById('clinical_urgentSymptomsDetails'),'');review(c);assert.match(c.doc.getElementById('status').textContent,/[Dd]escribe your symptoms/);
  assert.match(c.doc.getElementById('expandedAssessment').textContent,/Do not wait for an online assessment/);
  assert(c.doc.getElementById('clinical_contraception').disabled);
 }finally{c.close();}
});
test('an unverified account cannot unlock submission after questionnaire completion',async()=>{
 const c=await open({emailVerified:false});try{fill(c);review(c);c.doc.getElementById('continueToVerification').click();assert(c.doc.querySelector('button[type=submit]').disabled);assert.equal(c.requests.filter(r=>r.method==='POST').length,0);}finally{c.close();}
});
test('metric and imperial selectors preserve the canonical transport without typed measurements',async()=>{
 const c=await open();try{fill(c);select(c,'Height units','imperial');select(c,'Feet','5');select(c,'Inches','8');assert.equal(c.doc.querySelector('[name=heightCm]').value,'172.7');
  select(c,'Weight units','imperial');select(c,'Stone','14');select(c,'Pounds','12');assert.equal(c.doc.querySelector('[name=weightKg]').value,'94.3');
  const data=new c.w.FormData(c.doc.querySelector('#assessment'));assert.equal(data.get('heightCm'),'172.7');assert.equal(data.get('weightKg'),'94.3');
 }finally{c.close();}
});
test('starting weight uses structured units and preserves uncertainty for clinical review',async()=>{
 const c=await open();try{fill(c,'Switching provider or medicine');change(c,c.doc.getElementById('clinical_requestPath'),'Switching provider or medicine');
  select(c,'Do you know your starting weight?','known');select(c,'Starting weight units','imperial');select(c,'Starting stone','19');select(c,'Starting pounds','4');
  assert.match(c.w.SHIFT_EXPANDED_ASSESSMENT.payload().answers.startingWeight,/^122\.5 kg/);
  select(c,'Do you know your starting weight?','unknown');assert.match(c.w.SHIFT_EXPANDED_ASSESSMENT.payload().answers.startingWeight,/Not sure/);
  review(c);assert.equal(c.doc.getElementById('clinicalSummary').hidden,false);
 }finally{c.close();}
});
test('all fictional cases can reach the purchase review, while payment, files and storage remain closed',async()=>{
 const c=await open({demo:true});try{
  for(const path of ['Starting treatment','Switching provider or medicine','Restarting after a break','Repeat treatment']){fill(c,path);review(c);c.doc.getElementById('continueToVerification').click();assert.equal(c.doc.getElementById('purchaseReadiness').hidden,false);assert(c.doc.querySelector('#purchaseReadiness button').disabled);assert(c.doc.querySelector('button[type=submit]').disabled);}
  c.doc.getElementById('demoReset').click();await Promise.resolve();assert(c.doc.getElementById('verificationChecks').disabled);assert(c.doc.getElementById('purchaseReadiness').hidden);assert.equal(c.doc.querySelector('.assessment-meter').value,0);assert.equal(c.doc.querySelectorAll('[data-multi-for]:checked').length,0);
  assert.equal(c.w.localStorage.length+c.w.sessionStorage.length,0);assert.equal(c.doc.querySelectorAll('input[type=file]').length,0);assert.deepEqual(c.errors,[]);
 }finally{c.close();}
});
test('generated member, front-door and public walkthroughs carry the same clinical runtime',async()=>{
 assert.equal(expanded,await read('frontend/medicine-front-door/assessment-questions-v2.js'));assert.equal(demoHtml,await read('public-assessment-v2/assessment-walkthrough.html'));
});
test('section navigation keeps visible cards, headings and route numbering in sync',async()=>{
 const c=await open({demo:true});try{
  const nav=c.doc.querySelector('.section-nav');
  const conditions=[...nav.querySelectorAll('button')].find(b=>b.textContent.includes('Medical conditions'));
  conditions.click();
  const visible=[...c.doc.querySelectorAll('.question-card')].filter(e=>!e.hidden);
  assert.equal(visible.length,1);assert.equal(visible[0].querySelector('h2').textContent,'Medical conditions');
  assert.equal(visible[0].querySelector('legend').className,'sr-only');
  assert.equal(visible[0].querySelector('.section-number').textContent,'02');
  assert.equal(conditions.getAttribute('aria-current'),'step');
  change(c,c.doc.getElementById('clinical_requestPath'),'Switching provider or medicine');
  assert.equal(visible[0].querySelector('.section-number').textContent,'03');
  const select=c.doc.getElementById('clinical_requestPath');
  assert.equal(select.hidden,true);assert.equal(c.doc.querySelector('[data-choice-for=requestPath]:checked').value,'Switching provider or medicine');
  assert.equal(select.getAttribute('aria-label'),'Which best describes your request?');
  assert.deepEqual(c.errors,[]);
 }finally{c.close();}
});
test('answer cards write canonical answers and preserve uncertainty, conditional details and clean reset',async()=>{
 const c=await open({demo:true});try{
  const choose=(id,value)=>[...c.doc.querySelectorAll('[data-choice-for="'+id+'"]')].find(r=>r.value===value).click();
  choose('requestPath','Switching provider or medicine');
  assert.equal(c.w.SHIFT_EXPANDED_ASSESSMENT.payload().answers.requestPath,'Switching provider or medicine');
  assert.equal(c.doc.querySelectorAll('[data-choice-for=requestPath]:checked').length,1);
  assert.equal(c.doc.getElementById('clinical_timeOnDose').disabled,false);
  choose('requestPath','Starting treatment');assert.equal(c.doc.getElementById('clinical_timeOnDose').disabled,true);
  choose('allergies','Not sure');assert.equal(c.doc.getElementById('clinical_allergiesDetails').disabled,false);
  assert.equal(c.w.SHIFT_EXPANDED_ASSESSMENT.payload().answers.allergies,'Not sure');
  choose('allergies','No');assert.equal(c.doc.getElementById('clinical_allergiesDetails').disabled,true);
  c.doc.getElementById('demoReset').click();await Promise.resolve();
  assert.equal(c.doc.querySelectorAll('[data-choice-for]:checked').length,0);
  assert.equal(c.doc.querySelector('.mobile-meter').value,0);
  assert.equal(c.w.SHIFT_EXPANDED_ASSESSMENT.payload().answers.requestPath,'');assert.deepEqual(c.errors,[]);
 }finally{c.close();}
});
test('agreed grouped lists render together, with one shared follow-up and exclusive None',async()=>{
 const c=await open();try{fill(c);
  assert.equal(c.doc.getElementById('clinical_heightMeasuredAt'),null);assert.equal(c.doc.getElementById('clinical_weightMeasuredAt'),null);assert.equal(c.doc.getElementById('clinical_measurementMethod'),null);
  for(const id of ['hypertension','cholesterol','pancreas','gallbladder','kidney','liver'])assert.equal(c.doc.getElementById('clinical_'+id),null);
  const prediabetes=c.doc.querySelector('[data-multi-for=conditionList][value=Prediabetes]');prediabetes.click();
  assert.deepEqual(JSON.parse(c.w.SHIFT_EXPANDED_ASSESSMENT.payload().answers.conditionList),['Prediabetes']);
  const none=c.doc.querySelector('[data-multi-for=conditionList][value="None of the above"]');assert.equal(none.checked,false);none.click();assert.equal(prediabetes.checked,false);
  change(c,c.doc.getElementById('clinical_medicalHistory'),'Not sure');assert.equal(c.doc.getElementById('clinical_medicalHistoryDetails').disabled,false);
  assert.equal(c.doc.querySelectorAll('#clinical_medicalHistoryDetails').length,1);
  change(c,c.doc.getElementById('clinical_medicalHistory'),'None of the above');assert.equal(c.doc.getElementById('clinical_medicalHistoryDetails').disabled,true);
  for(const id of ['medicalHistory','medicines1','medicines2','treatmentConfirmation']){const q=c.w.SHIFT_ASSESSMENT.QUESTIONS.find(q=>q.id===id),label=c.doc.getElementById('clinical_'+id).closest('label');for(const item of q.items)assert(label.textContent.includes(item),item);}
  assert.equal(c.doc.querySelectorAll('input[aria-label*="measurement date"]').length,0);assert.deepEqual(c.errors,[]);
 }finally{c.close();}
});
test('declined or uncertain GP sharing is retained without ticking consent or submitting',async()=>{
 const c=await open();try{fill(c);change(c,c.doc.getElementById('clinical_gpSharingChoice'),'Not sure');change(c,c.doc.getElementById('clinical_gpSharingDetails'),'Please explain what will be shared');review(c);c.doc.getElementById('continueToVerification').click();
  assert.equal(c.doc.querySelector('[name=gpContactConsent]').checked,false);assert(c.doc.querySelector('[name=gpContactConsent]').disabled);assert(c.doc.querySelector('button[type=submit]').disabled);assert.match(c.doc.getElementById('status').textContent,/clinical discussion/);assert.equal(c.requests.filter(r=>r.method==='POST').length,0);
 }finally{c.close();}
});
