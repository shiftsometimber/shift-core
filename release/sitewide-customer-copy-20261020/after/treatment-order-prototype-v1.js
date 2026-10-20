(()=>{
  'use strict';
  // Release remains closed: no client-side capture or payment simulation.
  const orderingOpen=false;
  const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
  const catalogue=window.SHIFT_TREATMENT_CATALOGUE,steps=$$('[data-op-step]'),dots=$$('.op-progress b');
  const medicationSelect=$('[data-medication-select]'),doseSelect=$('[data-dose-select]');
  const requestedMedicine=new URLSearchParams(location.search).get('medicine');
  const requestedView=new URLSearchParams(location.search).get('view');
  const storageKey='sst-treatment-order-v1';
  let step=0,bmiUnit='imperial',bmiCanContinue=false,currentBmi=null,monthlySummary='Not completed yet',orderReference='Not placed',restoredDose=null;
  const evidence=new Set();
  const priorities=new Set(),lifeAreas=['Energy','Sleep','Confidence','Movement','Playing with the kids','Social life','Sex & intimacy','Clothes','Hobbies','Mental wellbeing'];
  const money=value=>value!==null&&value!==''&&Number.isFinite(Number(value))?`£${Number(value).toFixed(2)}`:'Price unavailable';
  const product=()=>catalogue[medicationSelect.value];
  const selection=()=>{const option=doseSelect.options[doseSelect.selectedIndex];return {label:option.dataset.label,price:Number(option.dataset.price)}};
  function saveProgress(){
    const fields={};$$('input[data-bmi-ft],input[data-bmi-in],input[data-bmi-st],input[data-bmi-lb],input[data-bmi-cm],input[data-bmi-kg],[data-current-medicines],[data-previous-treatment],[data-last-taken],[data-last-medicine],[data-last-dose]').forEach((el,index)=>fields[el.dataset.bmiFt!==undefined?'bmiFt':el.dataset.bmiIn!==undefined?'bmiIn':el.dataset.bmiSt!==undefined?'bmiSt':el.dataset.bmiLb!==undefined?'bmiLb':el.dataset.bmiCm!==undefined?'bmiCm':el.dataset.bmiKg!==undefined?'bmiKg':el.dataset.currentMedicines!==undefined?'currentMedicines':el.dataset.previousTreatment!==undefined?'previousTreatment':el.dataset.lastTaken!==undefined?'lastTaken':el.dataset.lastMedicine!==undefined?'lastMedicine':el.dataset.lastDose!==undefined?'lastDose':index]=el.value);
    const state={step:Math.min(step,1),bmiUnit,medicine:medicationSelect.value,dose:doseSelect.value,stage:$('input[name="treatment-stage"]:checked')?.value,condition:$('input[name="bmi-condition"]:checked')?.value,priorities:[...priorities],evidence:[...evidence],terms:$('[data-order-confirm]').checked,orderReference,fields};
    try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(_error){}
  }
  function restoreProgress(){
    let state;try{state=JSON.parse(localStorage.getItem(storageKey)||'null')}catch(_error){}if(!state)return 0;
    if(catalogue[requestedMedicine])medicationSelect.value=requestedMedicine;else if(catalogue[state.medicine])medicationSelect.value=state.medicine;restoredDose=state.medicine===medicationSelect.value?(state.dose||null):null;bmiUnit=state.bmiUnit==='metric'?'metric':'imperial';
    (state.priorities||[]).slice(0,3).forEach(value=>priorities.add(value));// Stored prototype evidence and order references are not verification.
    evidence.clear();
    const map={bmiFt:'[data-bmi-ft]',bmiIn:'[data-bmi-in]',bmiSt:'[data-bmi-st]',bmiLb:'[data-bmi-lb]',bmiCm:'[data-bmi-cm]',bmiKg:'[data-bmi-kg]',currentMedicines:'[data-current-medicines]',previousTreatment:'[data-previous-treatment]',lastTaken:'[data-last-taken]',lastMedicine:'[data-last-medicine]',lastDose:'[data-last-dose]'};Object.entries(state.fields||{}).forEach(([key,value])=>{const el=$(map[key]);if(el)el.value=value});
    const stage=$(`input[name="treatment-stage"][value="${state.stage}"]`);if(stage)stage.checked=true;const condition=$(`input[name="bmi-condition"][value="${state.condition}"]`);if(condition)condition.checked=true;$('[data-order-confirm]').checked=Boolean(state.terms);if(requestedView==='spec')return 0;return Number.isInteger(state.step)?Math.max(0,Math.min(1,state.step)):0;
  }
  function populateOptions(){const item=product();doseSelect.innerHTML=item.options.map(([value,label,price])=>`<option value="${value}" data-label="${label}" data-price="${price}">${label} — ${money(price)}</option>`).join('');doseSelect.value=item.start}
  function setProduct(){
    const item=product();
    $('[data-product-name]').textContent=item.name;$('[data-product-active]').textContent=item.active;$('[data-product-form]').textContent=item.form.toUpperCase();$('[data-product-frequency]').textContent=item.formatNote;$('[data-product-course]').textContent=item.course;
    $('[data-summary-product]').textContent=item.name;$('[data-product-source]').href=item.source;$('[data-eligibility-title]').textContent=item.eligibility;$('[data-bmi-copy]').textContent=item.bmi;$('[data-review-copy]').textContent=item.review;$('[data-eligibility-source]').href=item.source;
    $('[data-dose-label]').textContent=item.fixedDose?'Selected pack size':'Selected dose';$('.op-product').dataset.product=medicationSelect.value;
    $('[data-recommendation-reason]').textContent=item.fixedDose?'Needle-free option · pack size confirmed after assessment':`${item.form} · starting route shown · final dose clinically confirmed`;
    $('[data-receipt-list]').innerHTML=`<li><strong>${item.form}</strong> matches the format selected for comparison.</li><li><strong>${item.options.find(option=>option[0]===item.start)[1]}</strong> is shown as the new-treatment starting point.</li><li>The price for the displayed supply is visible before clinical assessment.</li>`;
    populateOptions();updateSelection();
  }
  function renderOutlook(){
    const item=product();
    $('[data-evidence-headline]').textContent=item.evidenceHeadline;$('[data-evidence-context]').textContent=item.evidenceContext;
    $('[data-positive-wins]').innerHTML=item.positiveWins.map((win,index)=>`<article><b>${index+1}</b><p>${win}</p></article>`).join('');
    $('[data-milestone-grid]').innerHTML=item.milestones.map(([amount,label])=>`<article><strong>${amount}</strong><span>${label}</span></article>`).join('');
  }
  function renderAlternatives(){
    const item=product();$('[data-current-fit]').innerHTML=`<strong>Why ${item.name} is currently suggested:</strong> ${item.fit} <span>The compromise: ${item.tradeoff}</span>`;
    $('[data-treatment-browser]').innerHTML=Object.entries(catalogue).filter(([,other])=>other.hero!==false).map(([key,other])=>{const selected=key===medicationSelect.value;return `<article class="${selected?'selected':''}" data-browser-card="${key}"><div class="op-browser-card-head"><small>${other.form.toUpperCase()}</small>${selected?'<b>SUGGESTED FROM YOUR ANSWERS</b>':''}</div><h3>${other.name}</h3><p class="op-browser-active">${other.active}</p><dl><div><dt>Format</dt><dd>${other.form}</dd></div><div><dt>Starting point</dt><dd>${other.options.find(option=>option[0]===other.start)[1]}</dd></div><div><dt>Usual BMI route</dt><dd>${other.bmi}</dd></div><div><dt>Live supply price</dt><dd>Checking live HQ price…</dd></div></dl><p><strong>Why consider it:</strong> ${other.fit}</p><p><strong>Compromise:</strong> ${other.tradeoff}</p><button type="button" data-compare-switch="${key}" ${selected?'disabled':''}>${selected?'Your current choice':'Choose this treatment'}</button></article>`}).join('');
  }
  function updateContinue(){
    const next=$('[data-op-next]'),ready=bmiCanContinue;next.disabled=!ready;
    const bmiItem=$('[data-ready-bmi]'),priorityItem=$('[data-ready-priorities]');
    bmiItem.classList.toggle('done',bmiCanContinue);bmiItem.textContent=bmiCanContinue?'BMI check complete':'Enter your height and weight';
    priorityItem.classList.add('done');priorityItem.textContent='Journey preferences happen after approval';
    next.firstChild.textContent=ready?'Continue to verification ':'Complete the steps above ';saveProgress();
  }
  function renderPriorities(){
    $('[data-priority-grid]').innerHTML=lifeAreas.map(area=>`<button type="button" data-priority="${area}" aria-pressed="false"><b>+</b><span>${area}</span></button>`).join('');
    $$('[data-priority]').forEach(button=>button.onclick=()=>{const area=button.dataset.priority;if(priorities.has(area))priorities.delete(area);else if(priorities.size<3)priorities.add(area);button.classList.toggle('selected',priorities.has(area));button.setAttribute('aria-pressed',String(priorities.has(area)));button.querySelector('b').textContent=priorities.has(area)?'✓':'+';$('[data-priority-status]').textContent=priorities.size===3?`Your three: ${[...priorities].join(' · ')}`:`Choose ${3-priorities.size} more ${3-priorities.size===1?'priority':'priorities'} to continue.`;updateContinue()});
  }
  function bmiMeasurement(){
    if(bmiUnit==='metric'){
      const cm=Number($('[data-bmi-cm]').value),kg=Number($('[data-bmi-kg]').value);
      return cm>=120&&cm<=230&&kg>=35&&kg<=320?kg/((cm/100)**2):null;
    }
    const ft=Number($('[data-bmi-ft]').value),inch=Number($('[data-bmi-in]').value),stone=Number($('[data-bmi-st]').value),lb=Number($('[data-bmi-lb]').value||0);
    const totalInches=ft*12+inch,totalPounds=stone*14+lb;
    return ft>=4&&ft<=7&&inch>=0&&inch<=11&&stone>=6&&stone<=50&&lb>=0&&lb<=13?703*totalPounds/(totalInches**2):null;
  }
  function updateBmi(){
    const item=product(),bmi=bmiMeasurement(),stage=$('input[name="treatment-stage"]:checked').value,condition=$('input[name="bmi-condition"]:checked')?.value;
    const result=$('[data-bmi-result]'),conditionBox=$('[data-condition-check]'),alternative=$('[data-alternative-route]');
    bmiCanContinue=false;currentBmi=bmi;conditionBox.hidden=true;alternative.hidden=true;result.className='op-bmi-result';
    if(!bmi){$('[data-bmi-value]').textContent='—';$('[data-bmi-status]').textContent='Enter your height and weight to see where you stand.';$('[data-bmi-rule]').textContent=`For ${item.name}, the usual starting point is BMI ${item.bmiStandard}+, or ${item.bmiConditional}+ with a qualifying condition.`;result.style.setProperty('--bmi-progress','0deg')}
    else{
      const shown=bmi.toFixed(1);$('[data-bmi-value]').textContent=shown;result.style.setProperty('--bmi-progress',`${Math.max(20,Math.min(340,(bmi/45)*340))}deg`);
      if(stage==='continuing'){
        bmiCanContinue=true;result.classList.add('is-review');$('[data-bmi-status]').textContent='Continue to clinical verification.';$('[data-bmi-rule]').textContent='Because you selected continuing treatment, an appropriately regulated prescribing service must verify your treatment history and starting BMI. Your current BMI is not used alone.';
      }else if(bmi>=item.bmiStandard){
        bmiCanContinue=true;result.classList.add('is-eligible');$('[data-bmi-status]').textContent='You appear to meet the usual BMI starting point.';$('[data-bmi-rule]').textContent='This opens the clinical assessment—it does not guarantee prescribing.';
      }else if(bmi>=item.bmiConditional){
        conditionBox.hidden=false;
        if(condition==='yes'){bmiCanContinue=true;result.classList.add('is-eligible');$('[data-bmi-status]').textContent='You may meet the usual starting point.';$('[data-bmi-rule]').textContent=`BMI ${shown} can meet the usual ${item.name} threshold when a qualifying weight-related condition is confirmed.`}
        else if(condition==='no'){result.classList.add('is-blocked');alternative.hidden=false;$('[data-bmi-status]').textContent='This route does not appear to fit the usual criteria.';$('[data-bmi-rule]').textContent='You cannot continue to payment for this treatment. Explore another useful route instead.'}
        else{$('[data-bmi-status]').textContent='One quick health question will complete the check.';$('[data-bmi-rule]').textContent=`At BMI ${shown}, a diagnosed weight-related condition normally matters for this treatment.`}
      }else{
        result.classList.add('is-blocked');alternative.hidden=false;$('[data-bmi-status]').textContent='This route does not appear to fit the usual criteria.';$('[data-bmi-rule]').textContent=`The usual ${item.name} threshold starts at BMI ${item.bmiConditional} with a qualifying condition. You cannot continue to payment for this treatment.`;
      }
    }
    updateContinue();
  }
  function updateSelection(){
    const item=product(),stage=$('input[name="treatment-stage"]:checked').value;
    if(stage==='new'&&!item.fixedDose)doseSelect.value=item.start;
    const {label,price}=selection();
    $('[data-op-price]').textContent=money(price);$('[data-summary-dose]').textContent=label;$('[data-summary-price]').textContent=money(price);$('[data-summary-total]').textContent=money(price);$('[data-stock-mail]').href=`mailto:hello@shiftsometimber.co.uk?subject=${encodeURIComponent(`${item.name} ${label} stock alert`)}&body=${encodeURIComponent(`Please tell me when ${item.name} ${label} is available. My prepared order is saved on this device.`)}`;
    $('[data-dose-guidance]').innerHTML=`<strong>${stage==='new'?'Suggested starting point':'Continuing-treatment preference'}: ${label}.</strong> ${stage==='new'?item.newGuidance:item.continuingGuidance}`;
    doseSelect.disabled=stage==='new'&&!item.fixedDose;
    renderOutlook();renderAlternatives();updateBmi();
  }
  function show(n){step=Math.max(0,Math.min(orderingOpen?3:1,n));steps.forEach((x,i)=>x.hidden=i!==step);dots.forEach((x,i)=>x.classList.toggle('active',i<=step));saveProgress();scrollTo({top:0,behavior:'smooth'})}
  function valid(){const box=$('.op-step:not([hidden])'),status=$('.op-validation',box);if(step===2&&!$('[data-order-confirm]').checked){status.textContent='Please confirm you have read and agree to the Terms of Sale to continue.';return false}if(status)status.textContent='';return true}
  medicationSelect.addEventListener('change',setProduct);$('[data-show-all-treatments]').onclick=()=>{const panel=$('[data-treatment-browser-panel]'),open=panel.hidden;panel.hidden=!open;$('[data-show-all-treatments]').setAttribute('aria-expanded',String(open));$('[data-show-all-treatments]').innerHTML=open?'Hide treatment options <span>↑</span>':'Explore every treatment option <span>↓</span>';if(open)panel.scrollIntoView({behavior:'smooth',block:'start'})};$('[data-treatment-browser]').addEventListener('click',event=>{const button=event.target.closest('[data-compare-switch]');if(!button||button.disabled)return;medicationSelect.value=button.dataset.compareSwitch;medicationSelect.dispatchEvent(new Event('change',{bubbles:true}));$('[data-treatment-browser-panel]').hidden=false;$('[data-show-all-treatments]').setAttribute('aria-expanded','true');$('[data-show-all-treatments]').innerHTML='Hide treatment options <span>↑</span>';$('.op-product').scrollIntoView({behavior:'smooth',block:'start'})});$$('input[name="treatment-stage"]').forEach(input=>input.addEventListener('change',updateSelection));doseSelect.addEventListener('change',updateSelection);
  $$('[data-bmi-unit]').forEach(button=>button.addEventListener('click',()=>{bmiUnit=button.dataset.bmiUnit;$$('[data-bmi-unit]').forEach(x=>x.classList.toggle('active',x===button));$$('[data-bmi-fields]').forEach(x=>x.hidden=x.dataset.bmiFields!==bmiUnit);updateBmi()}));
  $$('[data-bmi-ft],[data-bmi-in],[data-bmi-st],[data-bmi-lb],[data-bmi-cm],[data-bmi-kg],input[name="bmi-condition"]').forEach(input=>input.addEventListener('input',updateBmi));
  $$('[data-op-next]').forEach(button=>button.onclick=()=>{if(valid())show(step+1)});$$('[data-op-back]').forEach(button=>button.onclick=()=>show(step-1));
  $('[data-op-pay]').onclick=()=>{const message=$('[data-op-step="2"] .op-validation');if(message)message.textContent='Ordering is currently unavailable. No payment has been taken.';};
  function updateEvidence(){
    $('[data-evidence-state="id"]').textContent=evidence.has('id')?'Ready for the prescribing service':'Not completed';
    $('[data-evidence-state="body"]').textContent=evidence.has('front')&&evidence.has('side')?'Front and side ready':evidence.has('front')?'Front ready · side required':evidence.has('side')?'Side ready · front required':'Front and side required';
    $('[data-evidence-state="proof"]').textContent=evidence.has('proof')?'Treatment evidence ready':'Pen/box label photo or previous order email';
    const previous=$('[data-previous-treatment]').value,historyReady=Boolean($('[data-current-medicines]').value&&previous&&(previous==='no'||($('[data-last-taken]').value&&$('[data-last-medicine]').value&&$('[data-last-dose]').value.trim()&&evidence.has('proof'))));const ready={id:evidence.has('id'),body:evidence.has('front')&&evidence.has('side'),history:historyReady};$$('[data-clinical-ready]').forEach(item=>{const done=ready[item.dataset.clinicalReady];item.classList.toggle('done',done);item.textContent=(done?'✓ ':'○ ')+({id:'Photo ID',body:'Front and side images',history:'Medicine history'}[item.dataset.clinicalReady])});
  }
  $$('[data-demo-evidence]').forEach(button=>button.onclick=()=>{if(!orderingOpen)return;const key=button.dataset.demoEvidence;evidence.add(key);button.classList.add('done');button.innerHTML='✓ Capture ready';updateEvidence();saveProgress()});
  $('[data-previous-treatment]').onchange=event=>{const previous=event.target.value==='yes';$('[data-previous-treatment-details]').hidden=!previous;if(!previous){evidence.delete('proof');$('[data-last-taken]').value='';$('[data-last-medicine]').value='';$('[data-last-dose]').value='';const proof=$('[data-demo-evidence="proof"]');proof.classList.remove('done');proof.innerHTML='Add label or order-email evidence <span>→</span>'}updateEvidence();saveProgress()};
  $('[data-op-evidence-later]').onclick=()=>{if(!orderingOpen)return;saveProgress();$('[data-evidence-validation]').textContent='Progress saved on this device. Return on this device to continue where you left off.'};
  $('[data-op-clinical]').onclick=()=>{
    if(!orderingOpen){$('[data-evidence-validation]').textContent='Secure verification is currently unavailable. No details have been submitted and no payment has been taken.';return;}
    const previousTreatment=$('[data-previous-treatment]').value,lastTaken=$('[data-last-taken]').value;
    const historyComplete=$('[data-current-medicines]').value&&previousTreatment&&(previousTreatment==='no'||(lastTaken&&evidence.has('proof')&&$('[data-last-medicine]').value&&$('[data-last-dose]').value.trim()));
    const complete=evidence.has('id')&&evidence.has('front')&&evidence.has('side')&&historyComplete;
    if(!complete){$('[data-evidence-validation]').textContent='Complete the outstanding identity, body and medicine-history details to continue.';return}
    $('[data-evidence-validation]').textContent='';show(2);
  };
  function renderMonthly(){const signals=['Appetite control','Side effects manageable','Energy','Strength & movement','Life Back progress'];$('[data-monthly-grid]').innerHTML=signals.map(signal=>`<label><span>${signal}</span><input data-monthly-value data-signal="${signal}" type="range" min="0" max="10" value="5"/><output>5/10</output></label>`).join('');$$('[data-monthly-value]').forEach(input=>input.oninput=()=>input.nextElementSibling.textContent=`${input.value}/10`)}
  $$('[data-outcome]').forEach(button=>button.onclick=()=>{if(!orderingOpen)return;const panel=$('[data-outcome-panel]'),status=$('[data-order-status-copy]'),system=$('[data-approved-system]'),item=product(),{price}=selection();panel.hidden=false;system.hidden=true;if(button.dataset.outcome==='approved'){status.textContent='Approved for dispensing';panel.innerHTML=`<h2>The qualified prescriber approved treatment</h2><p>In an operational service, the regulated prescribing and dispensing teams would move the ${money(price)} paid ${item.name} order into dispensing and delivery.</p>`;system.hidden=false;system.scrollIntoView({behavior:'smooth',block:'start'})}else if(button.dataset.outcome==='information'){status.textContent='Information required';panel.innerHTML='<h2>The prescribing service needs more information</h2><p>You receive one secure request and can resume the assessment without starting again.</p>'}else{status.textContent='Treatment not approved';panel.innerHTML='<h2>Treatment was not approved</h2><p>You receive a clear explanation, payment is handled under the Terms of Sale, and Shift keeps the alternative support route open.</p>'}});
  $('[data-check-summary]').onclick=()=>{const values=$$('[data-monthly-value]').map(input=>({name:input.dataset.signal,value:Number(input.value)})),score=values.reduce((sum,x)=>sum+x.value,0),low=values.filter(x=>x.value<=3).map(x=>x.name);monthlySummary=`${score}/50 overall${low.length?`; discuss ${low.join(' and ')}`:'; signals look steady'}`;const output=$('[data-check-output]');output.hidden=false;output.innerHTML=`<strong>${score}/50 treatment-worthwhile signal</strong><p>${low.length?`Bring ${low.join(' and ')} into the next clinician conversation. Holding or changing treatment may make more sense than automatic escalation.`:'No obvious low signal here. The clinician still reviews efficacy, tolerability and whether the current dose remains appropriate.'}</p>`};
  $('[data-passport-build]').onclick=()=>{const {label}=selection(),card=$('[data-passport-card]');card.hidden=false;$('[data-passport-ref]').textContent=$('[data-order-ref]').textContent;$('[data-passport-treatment]').textContent=`${product().name} · ${label}`;$('[data-passport-bmi]').textContent=currentBmi?`${currentBmi.toFixed(1)} · initial route check completed`:'Not recorded';$('[data-passport-priorities]').textContent=[...priorities].join(' · ');$('[data-passport-check]').textContent=monthlySummary};
  $('[data-passport-download]').onclick=()=>{const {label}=selection(),body=[`SHIFT PASSPORT — ${$('[data-order-ref]').textContent}`,`Suggested route: ${product().name} · ${label}`,`BMI check: ${currentBmi?currentBmi.toFixed(1):'Not recorded'}`,`Life Back priorities: ${[...priorities].join(', ')}`,`Monthly signal: ${monthlySummary}`,'','Your prescribing service assesses whether treatment is appropriate for you.'].join('\n');const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([body],{type:'text/plain'}));link.download='shift-passport.txt';link.click();URL.revokeObjectURL(link.href)};
  $$('[data-order-confirm],[data-current-medicines],[data-last-taken],[data-last-medicine],[data-last-dose]').forEach(field=>field.addEventListener('change',()=>{updateEvidence();saveProgress()}));
  $('[data-op-restart]').onclick=()=>{localStorage.removeItem(storageKey);location.href='/treatment-order'};renderPriorities();renderMonthly();if(catalogue[requestedMedicine])medicationSelect.value=requestedMedicine;const restoredStep=restoreProgress();setProduct();
  $$('[data-bmi-unit]').forEach(button=>button.classList.toggle('active',button.dataset.bmiUnit===bmiUnit));$$('[data-bmi-fields]').forEach(group=>group.hidden=group.dataset.bmiFields!==bmiUnit);
  $$('[data-priority]').forEach(button=>{const selected=priorities.has(button.dataset.priority);button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));button.querySelector('b').textContent=selected?'✓':'+'});
  $('[data-priority-status]').textContent=priorities.size===3?`Your three: ${[...priorities].join(' · ')}`:`Choose ${3-priorities.size} more ${3-priorities.size===1?'priority':'priorities'} to continue.`;
  if(restoredDose&&doseSelect.querySelector(`option[value="${CSS.escape(restoredDose)}"]`))doseSelect.value=restoredDose;updateSelection();updateEvidence();$('[data-previous-treatment-details]').hidden=$('[data-previous-treatment]').value!=='yes';$('[data-order-ref]').textContent=orderReference;$('[data-order-ref-copy]').textContent=orderReference;show(restoredStep);
})();
