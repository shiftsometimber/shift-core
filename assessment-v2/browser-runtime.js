(()=>{
 'use strict';
 const {SECTIONS,QUESTIONS,QUESTIONNAIRE_VERSION,isActive,validateAssessment}=window.SHIFT_ASSESSMENT;
 const host=document.getElementById('expandedAssessment');if(!host)return;
 const demo=document.body.dataset.assessmentDemo==='true';
 const form=document.getElementById('assessment');
 const controls=new Map(),cards=[];
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const intro=make('p','Prescription-only medicine. Your selection is a preference. The prescribing clinician must assess you and approve the medicine and dose. They may suggest an alternative, request more information or decide that treatment is unsuitable. Completing this form or making a payment does not guarantee a prescription.','prescribing-notice');host.append(intro);
 const progress=make('p','','assessment-progress');progress.setAttribute('aria-live','polite');host.append(progress);
 let step=0;
 const demoMedicines={mounjaro:'Mounjaro injection',wegovy:'Wegovy injection','wegovy-tablet':'Wegovy tablets',foundayo:'Foundayo tablets',orlistat:'Orlistat capsules',liraglutide:'Liraglutide injection'};
 let demoMedicine,demonstrationDose='';
 function applyDemonstrationPreference(){
  if(!demoMedicine)return;
  const name=demoMedicines[demoMedicine.value];
  controls.get('preference').input.value=name?'I have a preference to discuss':'I would like to discuss the options';
  controls.get('preferenceDetails').input.value=name?name+(demonstrationDose?' · '+demonstrationDose:'')+' — preference for clinical review.':' ';
 }
 if(demo){
  const label=make('label','Medicine preference to explore');demoMedicine=make('select');demoMedicine.id='demoMedicine';
  const none=make('option','No preference — discuss the options');none.value='';demoMedicine.append(none);
  for(const [id,name]of Object.entries(demoMedicines)){const option=make('option',name+' · out of stock');option.value=id;demoMedicine.append(option);}
  const fragment=new URLSearchParams(location.hash.slice(1));if(Object.hasOwn(demoMedicines,fragment.get('medicine')))demoMedicine.value=fragment.get('medicine');
  demonstrationDose=(fragment.get('dose')||'').slice(0,80);
  demoMedicine.onchange=()=>{demonstrationDose='';applyDemonstrationPreference();refresh();};label.append(demoMedicine);host.append(label);
 }
 if(demo){const label=make('label','Go to a section');const jump=make('select');SECTIONS.forEach((s,i)=>{const o=make('option',(i+1)+'. '+s.title);o.value=String(i);jump.append(o);});jump.id='sectionJump';jump.onchange=()=>{step=Number(jump.value);refresh();};label.append(jump);host.append(label);}
 SECTIONS.forEach((section,index)=>{
  const box=make('fieldset');box.append(make('legend',(index+1)+'. '+section.title));
  section.questions.forEach(q=>{
   const label=make('label',q.label+(q.optional?' (optional)':''));label.htmlFor='clinical_'+q.id;
   const input=make(q.type==='select'?'select':q.type==='textarea'?'textarea':'input');
   input.id='clinical_'+q.id;input.dataset.clinicalQuestion=q.id;
   if(q.type==='select'){const empty=make('option','Choose one');empty.value='';input.append(empty);for(const option of q.options){const o=make('option',option);o.value=option;input.append(o);}}
   else if(q.type==='date'){input.type='date';input.min='1900-01-01';input.max=new Date().toISOString().slice(0,10);}
   else {input.rows=3;}
   label.append(input);box.append(label);controls.set(q.id,{input,label,q});
  });
  host.append(box);cards.push(box);
 });
 const urgency=make('p','If you have severe persistent stomach pain or sudden loss of vision, seek urgent medical help now. For a severe allergic reaction or another life-threatening emergency call 999. Do not wait for an online assessment. If you are unsure about symptoms, contact NHS 111.','prescribing-notice');urgency.hidden=true;host.append(urgency);
 const consent=make('label');consent.className='clinical-consent';
 const acknowledge=make('input');acknowledge.type='checkbox';acknowledge.required=true;acknowledge.id='prescribingAcknowledged';consent.append(acknowledge,document.createTextNode(' I understand that this is a request for assessment. A prescribing clinician must approve any medicine and dose; a prescription is not guaranteed.'));host.append(consent);
 const raw=()=>Object.fromEntries([...controls].map(([id,{input}])=>[id,input.value]));
 const payload=()=>({version:QUESTIONNAIRE_VERSION,answers:Object.fromEntries([...controls].filter(([,c])=>isActive(c.q,raw())).map(([id,c])=>[id,c.input.value])),prescribingAcknowledged:acknowledge.checked});
 const hidden=make('input');hidden.type='hidden';hidden.name='expandedAssessment';form.append(hidden);
 const summary=make('section');summary.id='clinicalSummary';summary.hidden=true;host.append(summary);
 function refresh(){
  const a=raw();let answered=0,total=0;
  for(const {input,label,q}of controls.values()){const active=isActive(q,a);label.hidden=!active;input.disabled=!active;input.required=active&&!q.optional;if(active&&!q.optional){total++;if(input.value.trim())answered++;}}
  urgency.hidden=!['Yes','Not sure'].includes(a.urgentSymptoms);
  progress.textContent=answered+' of '+total+' required clinical questions answered'+(demo?' · section '+(step+1)+' of '+cards.length:'');
  hidden.value=JSON.stringify(payload());summary.hidden=true;
  if(demo){cards.forEach((c,i)=>{c.hidden=i!==step;});document.getElementById('sectionJump').value=String(step);}
 }
 function review(){
  const p=payload();summary.replaceChildren(make('h2',demo?'Prescriber handover · fictional demonstration':'Your information for the prescriber'));
  summary.append(make('p','Questionnaire '+QUESTIONNAIRE_VERSION+' · prescribing approval: pending. Member-reported information requires clinical review and independent verification.'));
  summary.append(make('h3','Identity, contact and evidence'));
  if(demo){
   summary.append(make('p','Fictional Alex Example · born 12 May 1984 · alex@example.invalid · 1 Example Street, Example Town · height 180 cm · weight 107 kg · reported BMI 33.0. Fictional GP: Example Practice. Contact, identity, GP permissions, measurement and image checks are demonstration placeholders; nothing is verified or submitted.'));
  }else{
   const dl=make('dl');
   for(const el of form.querySelectorAll('input[name],select[name],textarea[name]')){
    if(el.disabled||['hidden','submit'].includes(el.type)||el.name==='submissionId')continue;
    const label=el.closest('label')?.childNodes[0]?.textContent?.trim()||el.name;
    const answer=el.type==='checkbox'?(el.checked?'Confirmed':'Not confirmed'):el.type==='file'?(el.files?.length?'File selected — requires independent verification':'No file selected'):el.value;
    dl.append(make('dt',label),make('dd',answer||'Not provided'));
   }
   summary.append(dl);
  }
  if(demo)summary.append(make('p','Identity, measurement and previous-dispensing evidence are not verified in this demonstration. No patient record has been created.'));
  const missing=QUESTIONS.filter(q=>isActive(q,p.answers)&&!q.optional&&!p.answers[q.id]);
  summary.append(make('p',missing.length?missing.length+' required questions are unanswered.':'All required clinical questions have an answer. This does not establish eligibility or prescribing approval.'));
  for(const section of SECTIONS){const qs=section.questions.filter(q=>isActive(q,p.answers));if(!qs.length)continue;summary.append(make('h3',section.title));const dl=make('dl');for(const q of qs)dl.append(make('dt',q.label),make('dd',p.answers[q.id]||'Not provided'));summary.append(dl);}
  summary.hidden=false;summary.scrollIntoView({behavior:'smooth',block:'start'});
 }
 const reviewButton=make('button','Review clinical answers');reviewButton.type='button';reviewButton.onclick=review;host.append(reviewButton);
 host.addEventListener('input',refresh);host.addEventListener('change',refresh);
 form.addEventListener('submit',event=>{
  hidden.value=JSON.stringify(payload());const result=validateAssessment(payload());
  if(result.error){event.preventDefault();event.stopImmediatePropagation();const c=controls.get(result.field);if(demo&&c){step=cards.indexOf(c.label.parentElement);refresh();}document.getElementById('status').textContent=result.message;(c?.input||acknowledge).focus();}
  if(demo){event.preventDefault();event.stopImmediatePropagation();if(!result.error){review();document.getElementById('status').textContent='Demonstration complete. No information sent, no payment taken and no prescription approved.';}}
 },true);
 form.addEventListener('reset',()=>queueMicrotask(()=>{summary.hidden=true;refresh();}));
 if(demo){
  const nav=make('div','','assessment-navigation');
  const back=make('button','Previous section'),next=make('button','Next section');for(const b of[back,next])b.type='button';
  back.onclick=()=>{step=Math.max(0,step-1);refresh();cards[step].scrollIntoView({block:'start'});};next.onclick=()=>{step=Math.min(cards.length-1,step+1);refresh();cards[step].scrollIntoView({block:'start'});};nav.append(back,next);host.insertBefore(nav,summary);
  const samples=document.getElementById('demoSamples');
  for(const [name,path]of [['Starting','Starting treatment'],['Switching','Switching provider or medicine'],['Restarting','Restarting after a break'],['Repeat','Repeat treatment']]){
   const b=make('button','Show fictional '+name.toLowerCase()+' case');b.type='button';
   b.onclick=()=>{const chosen=demoMedicine.value;form.reset();demoMedicine.value=chosen;for(const {q,input}of controls.values())input.value=q.type==='select'?(q.options.includes('No')?'No':q.options[0]):q.type==='date'?'2026-10-19':'None reported in this fictional example.';controls.get('requestPath').input.value=path;controls.get('forMyself').input.value='Yes';controls.get('inUK').input.value='Yes';controls.get('goals').input.value='Fictional Alex Example would like support with weight management and energy.';controls.get('measurementMethod').input.value='Fictional home measurements. Independent clinician verification still required.';controls.get('medicineList').input.value='No medicines declared in this fictional case.';if(path!=='Starting treatment'){controls.get('previousProvider').input.value='Example Clinic — fictional provider';controls.get('doseHistory').input.value='Fictional history for demonstration. Prescriber must confirm medicine, exact dose, dates and any breaks from dispensing evidence.';}applyDemonstrationPreference();acknowledge.checked=true;step=0;refresh();document.getElementById('status').textContent='Fictional '+name.toLowerCase()+' case loaded. Edit answers to explore the follow-up questions.';};samples.append(b);
  }
  document.getElementById('demoReset').onclick=()=>{form.reset();step=0;refresh();document.getElementById('status').textContent='Demonstration reset. No information has been sent.';};
  form.noValidate=true;
 }
 window.SHIFT_EXPANDED_ASSESSMENT={payload,refresh,review,version:QUESTIONNAIRE_VERSION};if(demo)applyDemonstrationPreference();refresh();
})();
