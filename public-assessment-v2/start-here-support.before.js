(()=>{'use strict';
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const steps=$$('[data-quick-step]'), answers={why:[],med:[],access:[],budget:[]}; let step=0;
const validation=$('[data-quick-validation]');

try{sessionStorage.removeItem('sstMedicineMatch')}catch(_){}
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
  $('[data-quick-next]').innerHTML=step===2?'Show my next steps <span>→</span>':'Continue <span>→</span>';
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
    validation.textContent=step===0?'Choose at least one reason to continue.':step===1?'Choose a treatment preference and an access route to continue.':'Choose a budget range to see your next steps.';
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
  const result=$('#quickResult');result.hidden=false;
  document.title='Your Start Here result | Shift Some Timber';
  const goal=answers.why.slice(0,2).join(', ')||'Your goals';
  const preference=answers.med[0]||'No preference';
  const access=answers.access[0]||'Both';
  const choice=$('[data-one="budget"] .selected');
  const band=choice?.dataset.budgetBand||'nhs';
  const budgets={nhs:{max:0,label:'£0 / NHS'},under100:{max:99.99,label:'Under £100'},band150:{max:150,label:'£100–£150'},band200:{max:200,label:'£150–£200'},over200:{max:null,label:'£200+'}};
  const budget=budgets[band];
  if(!budget)throw Error('Unknown budget band');
  result.dataset.budgetBand=band;
  $('[data-summary-goal]').textContent=goal;
  $('[data-summary-med]').textContent=preference;
  $('[data-summary-access]').textContent=access;
  $('[data-result-budget]').textContent=budget.label+' per calendar month';
  $('[data-result-human]').textContent='Your answers are a starting point for understanding support. They do not select a medicine or establish clinical suitability.';
  $('[data-result-title]').textContent='Useful routes to explore.';
  $('[data-result-copy]').textContent='These routes stay in the same order for everyone. You can use free practical support, read about NHS access and understand what a clinical assessment involves.';
  $('[data-result-money]').textContent=band==='nhs'?'Free My Timber tools are available. NHS treatment depends on eligibility and local availability.':'Your stated budget is '+budget.label+' per calendar month. No treatment has been selected or described as affordable from this answer. Check the exact supply period, ongoing price and any additional fees before requesting treatment.';
  $('[data-next-step-title]').textContent='Understand your options. Know what support stays with you.';
  $('[data-next-step-copy]').textContent='Practical food, movement, check-ins and progress tools remain available in My Timber whether you use medicine, change treatment or choose another route.';
  $('[data-medication-next-steps]').hidden=false;
  $('[data-medication-next-steps]').style.display='flex';
  $('[data-lifestyle-next-steps]').hidden=true;
  $('[data-lifestyle-next-steps]').style.display='none';
  try{sessionStorage.removeItem('sstMedicineMatch')}catch(_){}
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
})();
