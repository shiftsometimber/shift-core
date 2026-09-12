(()=>{'use strict';
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const steps=$$('[data-quick-step]'), answers={why:[],med:[],access:[],budget:[]}; let step=0;
const validation=$('[data-quick-validation]');

function label(btn){
  return btn.querySelector('strong')?.textContent.trim() || btn.querySelector('span')?.textContent.trim() || btn.textContent.trim();
}
$$('[data-multi], [data-one]').forEach(group=>{
  const key=group.dataset.multi||group.dataset.one, one=!!group.dataset.one;
  $$('button',group).forEach(btn=>{
    btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click',()=>{
    if(one) $$('button',group).forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false');});
    btn.classList.toggle('selected');
    btn.setAttribute('aria-pressed',String(btn.classList.contains('selected')));
    answers[key]=$$('.selected',group).map(label);
    validation.textContent='';
  });});
});

function syncProgress(){
  const pct=((step+1)/3)*100;
  $('[data-quick-bar]').style.width=pct+'%';
  $('[data-quick-count]').textContent=`QUESTION ${step+1} OF 3`;
  $$('.sh-progress-nodes-v72 b').forEach((n,i)=>n.classList.toggle('active',i===step));
  $('[data-quick-back]').hidden=step===0;
  $('[data-quick-next]').innerHTML=step===2?'Show me my plan <span>→</span>':'Continue <span>→</span>';
}
function show(n){
  step=Math.max(0,Math.min(2,n));
  steps.forEach((x,i)=>{x.hidden=i!==step;x.classList.remove('entering');if(i===step) requestAnimationFrame(()=>x.classList.add('entering'));});
  syncProgress();
  validation.textContent='';
  document.querySelector('.sh-quiz-v72').scrollIntoView({behavior:'smooth',block:'center'});
  steps[step].querySelector('h2')?.setAttribute('tabindex','-1');
  steps[step].querySelector('h2')?.focus({preventScroll:true});
}
function valid(){
  if(step===0) return answers.why.length>0;
  if(step===1) return answers.med.length>0 && answers.access.length>0;
  return answers.budget.length>0;
}
$('[data-quick-back]').onclick=()=>show(step-1);
$('[data-ready-go]').onclick=()=>{
  $('#quickStart').scrollIntoView({behavior:'smooth',block:'start'});
  steps[0].querySelector('button')?.focus({preventScroll:true});
};
$('[data-quick-next]').onclick=()=>{
  if(!valid()){
    validation.textContent=step===0?'Choose at least one reason to continue.':step===1?'Choose a treatment preference and an access route to continue.':'Choose a realistic monthly budget to see your result.';
    steps[step].classList.add('nudge');
    setTimeout(()=>steps[step].classList.remove('nudge'),380);
    return;
  }
  if(step<2) return show(step+1);
  render();
};
function includes(k,needle){return (answers[k]||[]).some(v=>v.toLowerCase().includes(needle));}
function render(){
  document.querySelector('.sh-official-v72').hidden=true;
  const result=$('#quickResult'); result.hidden=false;
  document.title='Your Start Here result | Shift Some Timber';

  const goal=answers.why.slice(0,2).join(', ')||'Your goals';
  const med=answers.med[0]||'Open minded';
  const access=answers.access[0]||'Both';
  const budget=answers.budget[0]||'—';

  $('[data-summary-goal]').textContent=goal;
  $('[data-summary-med]').textContent=med;
  $('[data-summary-access]').textContent=access;
  $('[data-result-budget]').textContent=budget;

  const weight=includes('why','weight'), health=includes('why','health'), noMed=includes('med','no medication'), tablet=includes('med','tablet');

  const nextTitle=$('[data-next-step-title]'),nextCopy=$('[data-next-step-copy]'),medicationNext=$('[data-medication-next-steps]'),lifestyleNext=$('[data-lifestyle-next-steps]');
  if(noMed){
    nextTitle.textContent='Build a plan you can actually use.';
    nextCopy.innerHTML='<strong>No medicine required.</strong> Start with ordinary food, realistic movement, useful health numbers and support that fits your life. My Timber keeps those parts together once you sign in.';
    medicationNext.hidden=true;medicationNext.style.display='none';lifestyleNext.hidden=false;lifestyleNext.style.display='flex';
  }else{
    nextTitle.textContent='Choose the medicine. Know what stays with you.';
    nextCopy.innerHTML='<strong>When the clinic goes quiet, SHIFT stays on.</strong> Side-effect guidance, coming-off support, Good to Talk and your practical My Timber tools remain available whether treatment changes, pauses or stops.';
    medicationNext.hidden=false;medicationNext.style.display='flex';lifestyleNext.hidden=true;lifestyleNext.style.display='none';
  }

  if(!noMed){
    const budgetText=budget.toLowerCase();
    const recommended=tablet?(budgetText.includes('under')?'orlistat':'wegovy-tablets'):(budgetText.includes('under')?'orlistat':'mounjaro');
    const alternative=recommended==='mounjaro'?'wegovy-injection':recommended==='wegovy-tablets'?'orlistat':'wegovy-tablets';
    try{sessionStorage.setItem('sstMedicineMatch',JSON.stringify({recommended,alternative,answers}))}catch(_error){}
  }

  $('[data-result-human]').textContent=`Based on what you’ve told us, these are the routes that make the most sense to look at first.`;

  let title='Get the useful health picture first.';
  let copy='Start with the free numbers and use them to decide which route deserves more attention.';
  if(weight && !noMed){
    title=tablet?'Compare the tablet routes first.':'Understand the licensed medication routes properly.';
    copy=tablet
      ? 'You’d rather avoid injections, so start with the oral options — while keeping the main injection choices visible so you know what you’re comparing against.'
      : 'Medication is worth understanding alongside NHS and non-medication routes. Suitability still belongs with an appropriate prescriber.';
  } else if(health){
    title='Start with your wider health picture.';
    copy='Because health worries are part of why you’re here, get the useful numbers together first and keep the NHS route firmly in the conversation.';
  }
  $('[data-result-title]').textContent=title;
  $('[data-result-copy]').textContent=copy;

  let money='Keep the route sustainable. The cheapest headline price is not always the true ongoing cost.';
  if(budget.includes('£0')) money='Put NHS and free routes first. You can still understand private options without being pushed to buy them.';
  else if(budget.includes('Under')) money='Treat cost as a hard filter. Do not let a treatment advert pull you beyond it.';
  else if(budget.includes('100–150')) money='Some private routes may fit. Compare the real ongoing cost, not just an introductory price.';
  else if(budget.includes('150–200')||budget.includes('200+')) money='You have more private choice, but price alone is not a reason to favour one treatment.';
  $('[data-result-money]').textContent=money;

  const meds=$('[data-result-meds]'); meds.hidden=noMed;meds.dataset.view='all';
  $$('[data-rx]').forEach(btn=>btn.onclick=()=>{
    $$('[data-rx]').forEach(x=>x.classList.toggle('selected',x===btn));
    $$('[data-med-info-panel]').forEach(panel=>panel.hidden=true);
    $$('[data-med-info]').forEach(control=>{control.setAttribute('aria-expanded','false');control.textContent='Understand';});
    const v=btn.dataset.rx;
    meds.dataset.view=v;
    $$('[data-kind]').forEach(card=>card.hidden=v!=='all' && card.dataset.kind!==v);
  });
  if(tablet && !noMed) $('[data-rx="tablet"]').click();

  if(!noMed){
    const budgetText=budget.toLowerCase(),recommended=tablet?(budgetText.includes('under')?'orlistat':'wegovy-tablets'):(budgetText.includes('under')?'orlistat':'mounjaro');
    const alternative=recommended==='mounjaro'?'wegovy-injection':recommended==='wegovy-tablets'?'orlistat':'wegovy-tablets';
    const keys={'Mounjaro':'mounjaro','Wegovy injection':'wegovy-injection','Wegovy tablet':'wegovy-tablets','Orlistat':'orlistat','Foundayo':'foundayo'};
    const cards=$$('.sh-med-card-v74',meds);
    cards.forEach(card=>{
      const name=$('h4',card)?.textContent.trim(),key=keys[name];card.dataset.medicineKey=key||'';
      const link=$('a',card);if(link&&key){link.href=`/treatment-order?medicine=${encodeURIComponent(key)}&view=spec&from=start-here`;link.textContent='See full spec →'}
      card.querySelector('.sh-match-badge-v1')?.remove();
      if(key===recommended||key===alternative){const badge=document.createElement('b');badge.className='sh-match-badge-v1';badge.textContent=key===recommended?'MATCHES YOUR PREFERENCES':'ALSO WORTH COMPARING';card.prepend(badge)}
    });
    const grid=$('.sh-med-grid-v74',meds),byKey=key=>cards.find(card=>card.dataset.medicineKey===key);[recommended,alternative,...cards.map(card=>card.dataset.medicineKey).filter(key=>key!==recommended&&key!==alternative)].forEach(key=>{const card=byKey(key);if(card)grid.appendChild(card)});
    $('[data-result-title]').textContent=`${catalogueName(recommended)} and ${catalogueName(alternative)} match your selected preferences.`;
    $('[data-result-copy]').textContent='Based on your answers, these options match the medicine format, access route and budget you selected. This is preference matching—not a clinical recommendation or confirmation that treatment is suitable for you.';
    try{sessionStorage.setItem('sstMedicineMatch',JSON.stringify({recommended,alternative,answers}))}catch(_error){}
    location.href=`/treatment-order?medicine=${encodeURIComponent(recommended)}&view=spec&from=start-here`;
    return;
    const aftercare=$('.sh-on-pen-enclosure'),actions=$('.sh-result-actions-v72');if(aftercare&&actions)actions.insertAdjacentElement('afterend',aftercare);
  }

  result.scrollIntoView({behavior:'smooth',block:'start'});
  result.querySelector('h2')?.setAttribute('tabindex','-1');
  result.querySelector('h2')?.focus({preventScroll:true});
}
const knowledgeParams=new URLSearchParams(location.search);
if(knowledgeParams.get('from')==='knowledge'){
  const focus=knowledgeParams.get('focus');
  const focusLabels={medicine:'Understand medication',weight:'Lose weight',energy:'Sleep and feel better'};
  if(focusLabels[focus]){
    const handoffCss=document.createElement('link');handoffCss.rel='stylesheet';handoffCss.href='/assets/start-here-knowledge-handoff-v1.css?v=1';document.head.append(handoffCss);
    const banner=document.createElement('aside');banner.className='sh-knowledge-handoff';banner.setAttribute('aria-label','Knowledge Hub starting point');banner.innerHTML='<p><small>STARTING POINT SAVED</small><strong></strong></p><a href="/explore-knowledge">Change this</a>';banner.querySelector('strong').textContent=focusLabels[focus];$('#quickStart').before(banner);
    try{sessionStorage.setItem('sstKnowledgeFocus',focus)}catch(e){}
  }
}
syncProgress();
function catalogueName(key){return ({mounjaro:'Mounjaro','wegovy-injection':'Wegovy injection','wegovy-tablets':'Wegovy tablet',orlistat:'Orlistat',foundayo:'Foundayo'})[key]||'a treatment route'}
})();
