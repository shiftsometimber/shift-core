(()=>{
 'use strict';
 const {SECTIONS,QUESTIONS,QUESTIONNAIRE_VERSION,isActive,validateAssessment}=window.SHIFT_ASSESSMENT;
 const host=document.getElementById('expandedAssessment');if(!host)return;
 const demo=document.body.dataset.assessmentDemo==='true';
 const form=document.getElementById('assessment');
 const controls=new Map(),cards=[];
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const intro=make('p','Prescription-only medicine. Your selection is a preference. The prescribing clinician must assess you and approve the medicine and dose. They may suggest an alternative, request more information or decide that treatment is unsuitable. Completing this form or making a payment does not guarantee a prescription.','prescribing-notice');host.append(intro);
 intro.hidden=demo;
 const progress=make('p','','assessment-progress');progress.setAttribute('aria-live','polite');host.append(progress);
 const meter=make('progress');meter.className='assessment-meter';meter.setAttribute('aria-label','Questionnaire completion');host.append(meter);
 const mobileProgress=make('p','','mobile-progress'),mobileMeter=make('progress');mobileProgress.setAttribute('aria-live','polite');mobileMeter.className='mobile-meter';mobileMeter.setAttribute('aria-label','Questionnaire completion');const mobileBand=make('div','','mobile-progress-band');mobileBand.append(mobileProgress,mobileMeter);host.append(mobileBand);
 let step=0;
 const workspace=make('div','','assessment-workspace');const sectionNav=make('nav','','section-nav');sectionNav.setAttribute('aria-label','Questionnaire sections');const panel=make('div','','question-panel');workspace.append(sectionNav,panel);
 const railIntro=make('div','','rail-intro');railIntro.append(make('p','YOUR QUESTIONNAIRE','section-kicker'),make('h2','The full picture.'));sectionNav.append(railIntro,progress,meter);
 const railLinks=make('div','','rail-links');sectionNav.append(railLinks);
 const railFoot=make('p','Your answers help the prescribing team understand your health.','rail-foot');sectionNav.append(railFoot);
 const sectionButtons=[];
 const sectionHints=['A few essentials before we get into your health.','Your recent treatment, all in one place.','Select all that apply to you.','Read the list, then choose the answer that fits.','Read the list, then tell us about your medicines.','A few more medicines to check.','Help the team understand any allergies.','A few relevant checks for your safety.','Tell us about any symptoms you have now.','Your sharing preference and final confirmations.'];
 const requestIcons=['M4 12h16m-6-6 6 6-6 6','M3 7h18l-4-4m4 14H3l4 4','M4 11a8 8 0 1 1 2 7M4 4v7h7','M4 4h11v11H4zM9 20h11V9'];
 function choiceIcon(index){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','choice-icon');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',requestIcons[index]);svg.append(path);return svg;}
 function answerChoices(input,q,wrapper){
  const group=make('div','','answer-choices'+(q.id==='requestPath'?' request-choices':q.options.some(o=>o.length>24)?' long-choices':''));group.setAttribute('role','radiogroup');group.setAttribute('aria-label',q.label);
  const choices=[];input.hidden=true;input.tabIndex=-1;input.classList.add('choice-source');
  q.options.forEach((option,i)=>{const row=make('label','','answer-choice'),radio=make('input');radio.type='radio';radio.name='choice_'+q.id;radio.value=option;radio.dataset.choiceFor=q.id;radio.className='choice-input';radio.setAttribute('aria-label',option);row.append(radio);if(q.id==='requestPath')row.append(choiceIcon(i));row.append(make('span',option,'choice-title'),make('span','','choice-indicator'));radio.onchange=()=>{if(radio.checked){input.value=radio.value;input.dispatchEvent(new Event('change',{bubbles:true}));}};radio.oninput=radio.onchange;group.append(row);choices.push(radio);});wrapper.append(group);return choices;
 }
 function selectedTextNote(select,label){const note=make('p','','selection-note');note.id=select.id+'-selection';select.setAttribute('aria-describedby',note.id);const update=()=>{note.textContent=select.selectedOptions[0]?.textContent||'';note.hidden=note.textContent.length<25;};select.addEventListener('change',update);form.addEventListener('reset',()=>queueMicrotask(update));label.append(note);update();return update;}
 const demoMedicines={mounjaro:'Mounjaro injection',wegovy:'Wegovy injection','wegovy-tablet':'Wegovy tablets',foundayo:'Foundayo tablets',orlistat:'Orlistat capsules',liraglutide:'Liraglutide injection'};
 let demoMedicine,demonstrationDose='';
 function applyDemonstrationPreference(){
  // Treatment preference is carried by the selected variant, not another clinical essay.
 }
 if(demo){
  const label=make('label','Medicine preference to explore','assessment-preference');demoMedicine=make('select');demoMedicine.id='demoMedicine';
  const none=make('option','No preference — discuss the options');none.value='';demoMedicine.append(none);
  for(const [id,name]of Object.entries(demoMedicines)){const option=make('option',name+' · out of stock');option.value=id;demoMedicine.append(option);}
  const fragment=new URLSearchParams(location.hash.slice(1));if(Object.hasOwn(demoMedicines,fragment.get('medicine')))demoMedicine.value=fragment.get('medicine');
  demonstrationDose=(fragment.get('dose')||'').slice(0,80);
  demoMedicine.onchange=()=>{demonstrationDose='';applyDemonstrationPreference();refresh();};demoMedicine.setAttribute('aria-label','Medicine preference to explore');label.append(demoMedicine);selectedTextNote(demoMedicine,label);const preferenceTools=make('details','','preference-tools');preferenceTools.append(make('summary','Explore a medicine preference'),label);host.append(preferenceTools);
 }
 if(demo){const label=make('label','Go to a section','assessment-section-picker');const jump=make('select');SECTIONS.forEach((s,i)=>{const o=make('option',(i+1)+'. '+s.title);o.value=String(i);jump.append(o);});jump.id='sectionJump';jump.onchange=()=>{step=Number(jump.value);refresh();};label.append(jump);host.append(label);}
 host.append(workspace);
 SECTIONS.forEach((section,index)=>{
  const box=make('fieldset','','question-card');const legend=make('legend',section.title,'sr-only');box.append(legend);
  const heading=make('div','','question-card-heading'),number=make('span',String(index+1).padStart(2,'0'),'section-number'),titles=make('div');number.setAttribute('aria-hidden','true');titles.append(make('p','YOUR ASSESSMENT','section-kicker'),make('h2',section.title));titles.append(make('p',sectionHints[index],'section-hint'));heading.append(titles,number);box.append(heading);
  const item=make('button');item.type='button';item.dataset.sectionIndex=String(index);const indexLabel=make('span',String(index+1).padStart(2,'0'),'nav-number');indexLabel.setAttribute('aria-hidden','true');item.append(indexLabel,make('span',section.title));item.onclick=()=>{step=index;refresh();cards[step].scrollIntoView({block:'start',behavior:'smooth'});};railLinks.append(item);sectionButtons.push(item);
  section.questions.forEach(q=>{
   const label=make('div','','clinical-question');label.dataset.questionId=q.id;const prompt=make(q.type==='multi'?'div':'label',q.label+(q.optional?' (optional)':''),'question-prompt');prompt.htmlFor='clinical_'+q.id;label.append(prompt);
   const input=make(q.type==='select'?'select':q.type==='textarea'?'textarea':'input');
   input.id='clinical_'+q.id;input.dataset.clinicalQuestion=q.id;if(q.type!=='multi')input.setAttribute('aria-label',q.label+(q.optional?' (optional)':''));
   if(q.items){const list=make('ul','','clinical-item-list');for(const item of q.items)list.append(make('li',item));prompt.append(list);}
   if(q.type==='multi'){input.type='hidden';const choices=make('div','','choice-grid');choices.setAttribute('role','group');choices.setAttribute('aria-label',q.label);for(const option of q.options){const row=make('label'),check=make('input');check.type='checkbox';check.value=option;check.dataset.multiFor=q.id;row.append(check,document.createTextNode(option));choices.append(row);check.onchange=()=>{if(check.checked){for(const other of choices.querySelectorAll('input'))if(other!==check&&(option==='None of the above'||other.value==='None of the above'))other.checked=false;}input.value=JSON.stringify([...choices.querySelectorAll('input:checked')].map(c=>c.value));};check.oninput=check.onchange;}label.append(choices);}
   else if(q.type==='select'){const empty=make('option','Choose one');empty.value='';input.append(empty);for(const option of q.options){const o=make('option',option);o.value=option;input.append(o);}}
   else if(q.type==='date'){input.type='date';input.min='1900-01-01';if(!q.allowFuture)input.max=new Date().toISOString().slice(0,10);}
   else if(q.type==='textarea'){input.rows=3;}else{input.type='text';}
   prompt.append(input);
   const choiceInputs=q.type==='select'&&q.options.length<=4?answerChoices(input,q,label):[];
   let selectionNote;if(q.type==='select'&&!choiceInputs.length){selectionNote=make('p','','selection-note');selectionNote.id=input.id+'-selection';input.setAttribute('aria-describedby',selectionNote.id);selectionNote.hidden=true;label.append(selectionNote);}
   box.append(label);controls.set(q.id,{input,label,q,selectionNote,choiceInputs});
  });
  panel.append(box);cards.push(box);
 });
 const urgency=make('p','If you have severe persistent stomach pain or sudden loss of vision, seek urgent medical help now. For a severe allergic reaction or another life-threatening emergency call 999. Do not wait for an online assessment. If you are unsure about symptoms, contact NHS 111.','prescribing-notice');urgency.hidden=true;host.append(urgency);
 const consent=make('label');consent.className='clinical-consent';
 const acknowledge=make('input');acknowledge.type='checkbox';acknowledge.required=true;acknowledge.id='prescribingAcknowledged';consent.append(acknowledge,document.createTextNode(' I understand that this is a request for assessment. A prescribing clinician must approve any medicine and dose; a prescription is not guaranteed.'));panel.append(consent);
 const raw=()=>Object.fromEntries([...controls].map(([id,{input}])=>[id,input.value]));
 const payload=()=>({version:QUESTIONNAIRE_VERSION,answers:Object.fromEntries([...controls].filter(([,c])=>isActive(c.q,raw())).map(([id,c])=>[id,c.input.value])),prescribingAcknowledged:acknowledge.checked});
 const hidden=make('input');hidden.type='hidden';hidden.name='expandedAssessment';form.append(hidden);
 const summary=make('section');summary.id='clinicalSummary';summary.hidden=true;host.append(summary);
 function refresh(){
  const a=raw();let answered=0,total=0;
  for(const {input,label,q,selectionNote,choiceInputs}of controls.values()){const active=isActive(q,a);for(const choice of choiceInputs){choice.checked=choice.value===input.value;choice.disabled=!active;}if(selectionNote){selectionNote.textContent=input.value;selectionNote.hidden=!active||input.value.length<25;}label.hidden=!active;input.disabled=!active;input.required=active&&!q.optional;if(q.type==='multi'){let values=[];try{values=JSON.parse(input.value||'[]');}catch{}for(const check of label.querySelectorAll('input[type=checkbox]')){check.checked=values.includes(check.value);check.disabled=!active;}}if(active&&!q.optional){total++;if(q.type==='multi'){try{if(JSON.parse(input.value).length)answered++;}catch{}}else if(input.value.trim())answered++;}}
  urgency.hidden=!['Yes','Not sure'].includes(a.urgentSymptoms);
  const activeSections=SECTIONS.map(s=>s.questions.some(q=>isActive(q,a)));if(!activeSections[step])step=activeSections.findIndex(Boolean);
  progress.textContent=answered+' of '+total+' required clinical questions answered'+(demo?' · section '+(activeSections.slice(0,step+1).filter(Boolean).length)+' of '+activeSections.filter(Boolean).length:'');
  meter.max=mobileMeter.max=total||1;meter.value=mobileMeter.value=answered;mobileProgress.textContent=answered+' of '+total+' required questions answered';
  sectionButtons.forEach((button,i)=>{const number=String(activeSections.slice(0,i+1).filter(Boolean).length).padStart(2,'0');button.querySelector('.nav-number').textContent=number;cards[i].querySelector('.section-number').textContent=number;button.hidden=!activeSections[i];button.classList.toggle('is-current',i===step);if(i===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  const navBack=host.querySelector('.section-actions button:first-child'),navNext=host.querySelector('.section-actions button:last-child');const activeIndices=activeSections.map((v,i)=>v?i:-1).filter(i=>i>=0);if(navBack)navBack.disabled=step===activeIndices[0];if(navNext)navNext.disabled=step===activeIndices.at(-1);
  hidden.value=JSON.stringify(payload());summary.hidden=true;

  if(demo){cards.forEach((c,i)=>{c.hidden=i!==step;});const jump=document.getElementById('sectionJump');jump.value=String(step);for(const option of jump.options){const i=Number(option.value);option.disabled=option.hidden=!activeSections[i];if(activeSections[i])option.textContent=activeSections.slice(0,i+1).filter(Boolean).length+'. '+SECTIONS[i].title;}}
 }
 function review(){
  const p=payload();summary.replaceChildren(make('h2',demo?'Prescriber handover · fictional demonstration':'Your information for the prescriber'));
  summary.append(make('p','Questionnaire '+QUESTIONNAIRE_VERSION+' · prescribing approval: pending. Member-reported information requires clinical review and independent verification.'));
  if(demoMedicine?.value)summary.append(make('p','Medicine preference: '+demoMedicines[demoMedicine.value]+(demonstrationDose?' · '+demonstrationDose:'')+' — pending prescriber approval.'));
  summary.append(make('h3','Identity, contact and evidence'));
  if(demo){
   summary.append(make('p','Fictional Alex Example · born 12 May 1984 · alex@example.invalid · 1 Example Street, Example Town · height 180 cm · weight 107 kg · reported BMI 33.0. Fictional GP: Example Practice. Contact, identity, GP permissions, measurement and image checks are demonstration placeholders; nothing is verified or submitted.'));
  }else{
   const dl=make('dl');
   for(const el of form.querySelectorAll('input[name],select[name],textarea[name]')){
    if(el.disabled||el.dataset.choiceFor||['hidden','submit'].includes(el.type)||el.name==='submissionId')continue;
    const label=el.closest('label')?.childNodes[0]?.textContent?.trim()||el.name;
    const answer=el.type==='checkbox'?(el.checked?'Confirmed':'Not confirmed'):el.type==='file'?(el.files?.length?'File selected — requires independent verification':'No file selected'):el.value;
    dl.append(make('dt',label),make('dd',answer||'Not provided'));
   }
   summary.append(dl);
  }
  if(demo)summary.append(make('p','Identity, measurement and previous-dispensing evidence are not verified in this demonstration. No patient record has been created.'));
  const missing=QUESTIONS.filter(q=>isActive(q,p.answers)&&!q.optional&&!p.answers[q.id]);
  summary.append(make('p',missing.length?missing.length+' required questions are unanswered.':'All required clinical questions have an answer. This does not establish eligibility or prescribing approval.'));
  for(const section of SECTIONS){const qs=section.questions.filter(q=>isActive(q,p.answers));if(!qs.length)continue;summary.append(make('h3',section.title));const dl=make('dl');for(const q of qs){const term=make('dt',q.label);if(q.items){const list=make('ul','','clinical-item-list');for(const item of q.items)list.append(make('li',item));term.append(list);}let answer=p.answers[q.id]||'Not provided';if(q.type==='multi'&&p.answers[q.id]){try{answer=JSON.parse(p.answers[q.id]).join('; ');}catch{}}dl.append(term,make('dd',answer));}summary.append(dl);}
  summary.hidden=false;summary.scrollIntoView({behavior:'smooth',block:'start'});
 }
 const reviewButton=make('button','Review clinical answers');reviewButton.className='review-answers';reviewButton.type='button';reviewButton.onclick=review;panel.append(reviewButton);
 host.addEventListener('input',refresh);host.addEventListener('change',refresh);
 form.addEventListener('submit',event=>{
  hidden.value=JSON.stringify(payload());const result=validateAssessment(payload());
  if(result.error){event.preventDefault();event.stopImmediatePropagation();const c=controls.get(result.field);if(demo&&c){step=cards.indexOf(c.label.parentElement);refresh();}document.getElementById('status').textContent=result.message;(c?.choiceInputs.find(el=>!el.disabled)||c?.input||acknowledge).focus();}
  if(demo){event.preventDefault();event.stopImmediatePropagation();if(!result.error){review();document.getElementById('status').textContent='Demonstration complete. No information sent, no payment taken and no prescription approved.';}}
 },true);
 form.addEventListener('reset',()=>{for(const {q,input}of controls.values())if(q.type==='multi')input.value='';queueMicrotask(()=>{summary.hidden=true;refresh();});});
 if(demo){
  const nav=make('div','','assessment-navigation section-actions');
  const back=make('button','Previous section'),next=make('button','Next section');for(const b of[back,next])b.type='button';
  const updateNav=()=>{const active=SECTIONS.map((s,i)=>s.questions.some(q=>isActive(q,raw()))?i:-1).filter(i=>i>=0);back.disabled=step===active[0];next.disabled=step===active.at(-1);};host.addEventListener('input',()=>queueMicrotask(updateNav));host.addEventListener('change',()=>queueMicrotask(updateNav));
  back.onclick=()=>{const active=SECTIONS.map((s,i)=>s.questions.some(q=>isActive(q,raw()))?i:-1).filter(i=>i>=0);step=active[Math.max(0,active.indexOf(step)-1)];refresh();cards[step].scrollIntoView({block:'start'});};next.onclick=()=>{const active=SECTIONS.map((s,i)=>s.questions.some(q=>isActive(q,raw()))?i:-1).filter(i=>i>=0);step=active[Math.min(active.length-1,active.indexOf(step)+1)];refresh();cards[step].scrollIntoView({block:'start'});};nav.append(back,next);panel.insertBefore(nav,reviewButton);updateNav();
  const samples=document.getElementById('demoSamples');
  for(const [name,path]of [['Starting','Starting treatment'],['Switching','Switching provider or medicine'],['Restarting','Restarting after a break'],['Repeat','Repeat treatment']]){
   const b=make('button',name==='Starting'?'Starting treatment':name==='Repeat'?'Repeat treatment':name);b.setAttribute('aria-label','Show fictional '+name.toLowerCase()+' case');b.type='button';
   b.onclick=()=>{const chosen=demoMedicine.value;form.reset();demoMedicine.value=chosen;for(const {q,input}of controls.values())input.value=q.type==='multi'?JSON.stringify(['None of the above']):q.type==='select'?(q.options.includes('No')?'No':q.options.includes('None of the above')?'None of the above':q.options[0]):q.type==='date'?'2026-10-19':'None reported in this fictional example.';controls.get('startingWeight').input.value='122.5 kg';controls.get('requestPath').input.value=path;controls.get('forMyself').input.value='Yes';controls.get('inUK').input.value='Yes';if(path!=='Starting treatment'){controls.get('previousProvider').input.value='Example Clinic — fictional provider';controls.get('timeOnDose').input.value='Four weeks — fictional example';}applyDemonstrationPreference();acknowledge.checked=true;step=0;refresh();document.getElementById('status').textContent='Fictional '+name.toLowerCase()+' case loaded. Edit answers to explore the follow-up questions.';};samples.append(b);
  }
  document.getElementById('demoReset').onclick=()=>{form.reset();step=0;refresh();document.getElementById('status').textContent='Demonstration reset. No information has been sent.';};
  form.noValidate=true;
 }
 window.SHIFT_EXPANDED_ASSESSMENT={payload,refresh,review,version:QUESTIONNAIRE_VERSION};if(demo)applyDemonstrationPreference();refresh();
})();
