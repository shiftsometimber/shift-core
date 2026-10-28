// Presentation of the existing assessment contract. Never opens payment or prescribes.
(()=>{
 'use strict';
 const api=window.SHIFT_EXPANDED_ASSESSMENT, schema=window.SHIFT_ASSESSMENT;
 if(!api||!schema)return;
 const form=document.getElementById('assessment'), host=document.getElementById('expandedAssessment');
 const demo=document.body.dataset.assessmentDemo==='true';
 const status=document.getElementById('status');
 const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
 // Use the agreed compact lists; no explanatory essays or per-condition questions are inserted.
 for(const box of form.querySelectorAll('fieldset:not(.question-card)')){
  const legend=box.querySelector(':scope > legend');if(!legend)continue;legend.classList.add('sr-only');const heading=make('h2',legend.textContent);heading.className='support-card-heading';legend.after(heading);
 }
 let reviewed=null,accountReady=false;
 const fingerprint=()=>{syncCompatibilitySummaries();return JSON.stringify({assessment:api.payload(),details:[...form.querySelectorAll('[data-questionnaire-details] input[name],[data-questionnaire-details] select[name],[data-questionnaire-details] textarea[name]')].map(el=>[el.name,el.value])});};
 function syncCompatibilitySummaries(){
  if(demo)return;const a=api.payload().answers;
  if(form.elements.conditions)form.elements.conditions.value='Grouped conditions: '+(a.conditionList||'Not answered')+'; medical history: '+(a.medicalHistory||'Not answered')+'. See complete versioned clinical answers for details.';
  if(form.elements.medicines)form.elements.medicines.value='Grouped medicines: '+(a.medicines1||'Not answered')+'; '+(a.medicines2||'Not answered')+'. See complete versioned clinical answers for all medicine names and doses.';
 }
 const verification=document.getElementById('verificationChecks');
 const submit=form.querySelector('button[type="submit"]');
 const summary=document.getElementById('clinicalSummary');
 const reviewButton=[...host.querySelectorAll('button')].find(b=>b.textContent==='Review clinical answers');
 const next=make('button','Continue to GP and evidence checks');next.type='button';next.id='continueToVerification';
 const gpConsent=form.elements.gpContactConsent;
 function syncGpConsent(){if(!gpConsent)return;const agreed=api.payload().answers.gpSharingChoice==='Yes';gpConsent.disabled=!agreed;if(!agreed)gpConsent.checked=false;}
 form.addEventListener('change',syncGpConsent);
 const phase=make('p','Step 1 of 3 · Complete your questionnaire');phase.className='assessment-progress';phase.id='purchaseJourneyStatus';phase.setAttribute('aria-live','polite');host.prepend(phase);
 const finalReview=make('section');finalReview.id='purchaseReadiness';finalReview.hidden=true;form.append(finalReview);
 function showStage(number){for(let i=1;i<=3;i++){const stage=document.getElementById('journeyStage'+i);if(!stage)continue;stage.classList.toggle('is-active',i===number);if(i===number)stage.setAttribute('aria-current','step');else stage.removeAttribute('aria-current');}}
 function closeVerification(){
  reviewed=null;if(verification){verification.hidden=true;verification.disabled=true;}
  if(submit)submit.disabled=true;next.hidden=true;finalReview.hidden=true;
  phase.textContent='01 / YOUR QUESTIONNAIRE';
  showStage(1);
 }
 function firstQuestionError(){
  const result=schema.validateAssessment(api.payload());
  if(!result.error)return null;
  const input=document.getElementById(result.field?'clinical_'+result.field:'prescribingAcknowledged');
  const section=input?.closest('fieldset');
  const jump=document.getElementById('sectionJump');
  if(jump&&section){jump.value=String([...host.querySelectorAll('.question-card')].indexOf(section));jump.dispatchEvent(new Event('change'));}
  status.textContent=result.message;
  (result.field==='startingWeight'?document.querySelector('#startingWeightControls select'):input?.classList.contains('choice-source')?document.querySelector('[data-choice-for="'+result.field+'"]'):input?.type==='hidden'?document.querySelector('[data-multi-for="'+result.field+'"]'):input)?.focus();return result;
 }
 function completeQuestionnaire(){
  if(firstQuestionError())return false;
  const invalid=[...form.querySelectorAll('[data-questionnaire-details] input,[data-questionnaire-details] select,[data-questionnaire-details] textarea')].find(el=>!el.checkValidity());
  if(invalid){status.textContent='Please complete your contact details and measurements before reviewing your questionnaire.';invalid.reportValidity();return false;}
  return true;
 }
 reviewButton.onclick=()=>{
  closeVerification();if(!completeQuestionnaire())return;
  api.review();
  if(!demo)summary.prepend(make('p','Your current measurements: '+form.elements.heightCm.value+' cm; '+form.elements.weightKg.value+' kg. These are member-reported and still require independent verification.'));
  reviewed=fingerprint();next.hidden=false;summary.append(next);
  phase.textContent='01 / REVIEW YOUR ANSWERS';
  status.textContent='Check your answers below. Next are your GP details and evidence checks. Your answers still need clinical review; no prescription is approved.';
 };
 next.onclick=()=>{
  if(!reviewed||reviewed!==fingerprint()||!completeQuestionnaire()){closeVerification();status.textContent='Your answers have changed. Review the complete questionnaire again before continuing.';return;}
  if(verification){verification.hidden=false;verification.disabled=false;syncGpConsent();verification.scrollIntoView({block:'start'});}
  if(submit)submit.disabled=demo||!accountReady||api.payload().answers.gpSharingChoice!=='Yes';
  phase.textContent='02 / GP AND EVIDENCE CHECKS';
  showStage(2);
  finalReview.replaceChildren(make('h2','Step 3 · Review your treatment request'));
  finalReview.append(make('p','Questionnaire complete. GP, identity, measurement and any previous-treatment evidence still require clinical checks. The prescriber may ask further questions and decides whether to prescribe and at what dose.'));
  finalReview.append(make('p','Before any payment, review your requested medicine and dose, the full price and supply period, delivery and included services, and what happens if treatment is declined. A payment does not guarantee a prescription.'));
  const locked=make('button','Treatment orders and payments are closed');locked.type='button';locked.disabled=true;finalReview.append(locked);finalReview.hidden=false;
  if(!demo&&api.payload().answers.gpSharingChoice!=='Yes'){status.textContent='Your GP sharing preference needs clinical discussion before this request can proceed. No consent has been assumed.';return;}
  status.textContent=demo?'Fictional walkthrough only. GP and evidence checks have not been performed. No information sent, payment taken or prescription approved.':'Complete the GP and evidence checks below. Your questionnaire is ready for clinical review; no payment has been taken.';
 };
 form.addEventListener('input',event=>{if(!event.target.closest('#verificationChecks'))closeVerification();});
 form.addEventListener('change',event=>{if(!event.target.closest('#verificationChecks'))closeVerification();});
 form.addEventListener('reset',()=>queueMicrotask(closeVerification));
 form.addEventListener('submit',event=>{
  if(demo||!reviewed||reviewed!==fingerprint()||!completeQuestionnaire()||api.payload().answers.gpSharingChoice!=='Yes'){
   event.preventDefault();event.stopImmediatePropagation();
   if(!demo)status.textContent='Review your complete questionnaire before continuing to clinical verification. No information has been sent and no payment has been taken.';
  }
 },true);
 // Measurement selectors preserve the existing canonical centimetre/kilogram transport.
 function selector(label,values){const wrap=make('label',label),select=make('select');select.setAttribute('aria-label',label);const empty=make('option','Choose');empty.value='';select.append(empty);for(const [value,text]of values){const option=make('option',text);option.value=String(value);select.append(option);}wrap.append(select);const note=make('p');note.className='selection-note';note.hidden=true;const describe=()=>{note.textContent=select.selectedOptions[0]?.textContent||'';note.hidden=note.textContent.length<25;};select.addEventListener('change',describe);form.addEventListener('reset',()=>queueMicrotask(describe));wrap.append(note);return {wrap,select};}
 function measurements(name,kind){
  const original=form.elements[name];if(!original)return;
  const label=original.closest('label');original.type='hidden';original.required=false;
  const group=make('div');group.className='measurement-selectors';label.after(group);
  const unit=selector(kind==='height'?'Height units':'Weight units',kind==='height'?[['metric','Centimetres'],['imperial','Feet and inches']]:[['metric','Kilograms'],['imperial','Stone and pounds']]);unit.select.value='metric';
  const a=selector(kind==='height'?'Centimetres':'Whole kilograms',Array.from({length:kind==='height'?151:371},(_,i)=>{const n=i+(kind==='height'?100:30);return[n,String(n)];}));
  const b=selector(kind==='height'?'Feet':'Stone',Array.from({length:kind==='height'?6:60},(_,i)=>{const n=i+(kind==='height'?3:4);return[n,String(n)];}));
  const c=selector(kind==='height'?'Inches':'Pounds',Array.from({length:kind==='height'?12:14},(_,i)=>[i,String(i)]));
  const d=kind==='weight'?selector('Tenths of a kilogram',Array.from({length:10},(_,i)=>[i,'.'+i])):null;if(d)d.select.value='0';
  group.append(unit.wrap,a.wrap);if(d)group.append(d.wrap);group.append(b.wrap,c.wrap);
  const update=()=>{
   const imperial=unit.select.value==='imperial';a.wrap.hidden=imperial;if(d)d.wrap.hidden=imperial;b.wrap.hidden=!imperial;c.wrap.hidden=!imperial;
   const ready=imperial?(b.select.value!==''&&c.select.value!==''):(a.select.value!==''&&(!d||d.select.value!==''));
   let number=ready?(imperial?(kind==='height'?(Number(b.select.value)*12+Number(c.select.value))*2.54:(Number(b.select.value)*14+Number(c.select.value))*0.45359237):Number(a.select.value)+(d?Number(d.select.value)/10:0)):null;
   const inRange=number!==null&&number>=(kind==='height'?100:30)&&number<=(kind==='height'?250:400);
   original.value=inRange?String(Math.round(number*10)/10):'';
   for(const el of [a.select,b.select,c.select,d?.select].filter(Boolean)){const active=el===b.select||el===c.select?imperial:!imperial;el.required=active;el.disabled=!active;el.setCustomValidity(ready&&!inRange?'Check this measurement.':'');}
  };
  group.addEventListener('change',update);form.addEventListener('reset',()=>queueMicrotask(update));update();
 }
 if(!demo){measurements('heightCm','height');measurements('weightKg','weight');}
 // Keep the original startingWeight question and string contract, using structured units.
 const starting=document.getElementById('clinical_startingWeight');
 if(starting){
  starting.hidden=true;const group=make('div');group.id='startingWeightControls';group.className='measurement-selectors';starting.closest('label').after(group);
  const known=selector('Do you know your starting weight?',[['known','Yes — enter my starting weight'],['unknown','Not sure — discuss with the prescriber']]);
  const unit=selector('Starting weight units',[['metric','Kilograms'],['imperial','Stone and pounds']]);unit.select.value='metric';
  const kg=selector('Starting whole kilograms',Array.from({length:371},(_,i)=>[i+30,String(i+30)]));
  const tenth=selector('Starting tenths of a kilogram',Array.from({length:10},(_,i)=>[i,'.'+i]));tenth.select.value='0';
  const stone=selector('Starting stone',Array.from({length:60},(_,i)=>[i+4,String(i+4)]));
  const lb=selector('Starting pounds',Array.from({length:14},(_,i)=>[i,String(i)]));
  group.append(known.wrap,unit.wrap,kg.wrap,tenth.wrap,stone.wrap,lb.wrap);
  let written='';
  function visibility(){
   group.hidden=starting.disabled;const active=!starting.disabled&&known.select.value==='known',imperial=unit.select.value==='imperial';
   unit.wrap.hidden=!active;kg.wrap.hidden=tenth.wrap.hidden=!active||imperial;stone.wrap.hidden=lb.wrap.hidden=!active||!imperial;
   known.select.disabled=starting.disabled;known.select.required=!starting.disabled;
   for(const el of[unit.select,kg.select,tenth.select,stone.select,lb.select])el.disabled=!active||((el===kg.select||el===tenth.select)?imperial:(el===stone.select||el===lb.select)?!imperial:false);
  }
  function update(){
   visibility();const imperial=unit.select.value==='imperial';
   const ready=imperial?stone.select.value!==''&&lb.select.value!=='':kg.select.value!==''&&tenth.select.value!=='';
   const value=ready?(imperial?(Number(stone.select.value)*14+Number(lb.select.value))*0.45359237:Number(kg.select.value)+Number(tenth.select.value)/10):null;
   starting.value=known.select.value==='unknown'?'Not sure — discuss starting weight and previous treatment with the prescriber':known.select.value==='known'&&value>=30&&value<=400?String(Math.round(value*10)/10)+' kg':'';
   written=starting.value;
  }
  function sync(){
   if(starting.value!==written){const match=starting.value.match(/^(\d+(?:\.\d+)?) kg/);if(match){known.select.value='known';unit.select.value='metric';const n=Number(match[1]);kg.select.value=String(Math.floor(n));tenth.select.value=String(Math.round((n%1)*10));}else if(!starting.value){known.select.value='';kg.select.value='';stone.select.value='';lb.select.value='';}written=starting.value;}
   visibility();
  }
  group.addEventListener('input',update);group.addEventListener('change',update);form.addEventListener('change',sync);form.addEventListener('reset',()=>queueMicrotask(sync));document.getElementById('demoSamples')?.addEventListener('click',sync);sync();
 }
 window.SHIFT_PURCHASE_JOURNEY={
  setAccountReady(value){accountReady=value===true;this.refreshAccess();},
  refreshAccess(){if(submit)submit.disabled=demo||!accountReady||!reviewed||reviewed!==fingerprint()||!verification||verification.disabled||api.payload().answers.gpSharingChoice!=='Yes';}
 };
 closeVerification();
})();
