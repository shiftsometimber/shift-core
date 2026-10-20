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

const budgetPriceSnapshot=[{"name":"Mounjaro","format":"Weekly injection","oral":false,"low":16900,"high":31900},{"name":"Wegovy","format":"Weekly injection","oral":false,"low":9900,"high":19900},{"name":"Liraglutide","format":"Daily injection","oral":false,"low":19900,"high":32900},{"name":"Wegovy tablets","format":"Daily tablet","oral":true,"low":12900,"high":22900},{"name":"Foundayo","format":"Daily tablet","oral":true,"low":12900,"high":22900},{"name":"Orlistat","format":"Capsules taken with meals","oral":true,"low":5900,"high":12900}];
function showPotentialRoute({band,preference,access}){
  const money=document.querySelector('[data-result-money]');
  document.querySelector('[data-budget-potential-route]')?.remove();
  const section=document.createElement('section');section.dataset.budgetPotentialRoute='2026-10-20';section.setAttribute('aria-label','Your potential route');
  section.style.cssText='margin-top:20px;padding-top:18px;border-top:1px solid #707762;overflow-wrap:anywhere';
  const add=(tag,text,parent=section)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
  const heading=add('h4','Your potential route');heading.style.cssText='margin:0 0 12px;font-size:22px;line-height:1.2;color:inherit';
  const noMedicine=preference==='No medication';
  const freeFirst=band==='nhs'||access==='NHS';
  if(noMedicine){
    add('p','Start with free My Timber support: plan meals in Grub, find manageable movement in Fit, and use check-ins to review your progress. You do not need to buy medicine to use these tools.');
    add('p','Your preference is support without medication. If you need more help, your GP or a local weight-management service can discuss non-medicine support with you.');
  }else if(freeFirst){
    add('p','Start with free My Timber support for meals, movement and check-ins, alongside a conversation with your GP or local weight-management service about NHS support.');
    add('p','You can discuss your '+(preference==='Jabs'?'injection':preference==='Tablets'?'oral treatment':'treatment format')+' preference at that assessment. NHS eligibility, treatment choices and local availability are decided by the clinical service.');
  }else{
    const chosen=preference==='Jabs'?'your preference for an injection':preference==='Tablets'?'your preference for an oral treatment':'the choice between oral treatment and injections';
    add('p','One potential route is a clinical assessment to discuss '+chosen+', alongside free My Timber support for meals, movement and progress.');
    add('p',preference==='Jabs'?'If you would consider an oral option too, tablets or capsules can be discussed at the same assessment.':preference==='Tablets'?'If you would also consider an injection, that can be discussed at the same assessment.':'Daily tablets, meal-linked capsules and injections have different routines. Your preferences are part of the clinical discussion.');
    const title=add('h5','Catalogue pack prices');title.style.cssText='font-size:16px;margin:18px 0 8px;color:inherit';
    const list=add('dl','');list.dataset.budgetRoutePrices='';list.style.cssText='margin:0;display:grid;gap:10px';
    const rows=[...budgetPriceSnapshot].sort((a,b)=>preference==='Tablets'?Number(b.oral)-Number(a.oral):Number(a.oral)-Number(b.oral));
    const pounds=p=>'£'+(p/100).toFixed(0);
    for(const row of rows){
      const wrap=add('div','',list);wrap.dataset.routeMedicine=row.name;wrap.style.cssText='padding:10px 0;border-bottom:1px solid #707762';
      const name=add('dt',row.name+' · '+row.format,wrap);name.style.cssText='font-weight:800;font-size:14px';
      const price=add('dd',pounds(row.low)+'–'+pounds(row.high)+' per listed pack',wrap);price.style.cssText='margin:4px 0 0;font-size:14px';
    }
    add('p','Prices checked 20 October 2026. Pack quantities, supply periods and dose prices vary. These are pack prices, not calendar-month costs; the ongoing cost depends on the treatment and dose agreed with the prescriber.');
    add('p','A prescribing clinician must assess whether any medicine is appropriate and agree the medicine and dose with you. Your answers here do not select or approve a medicine.');
    const stock=add('p','No stock available today. Orders and payments are currently closed.');stock.style.fontWeight='800';
  }
  money.after(section);
}

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
  $('[data-result-copy]').textContent='Your potential route is shown below your budget. It brings together your preferences, practical support and the role of clinical assessment.';
  $('[data-result-money]').textContent=band==='nhs'?'You have chosen the £0 / NHS budget. Free My Timber support is available.':'Your stated budget is '+budget.label+' per calendar month.';
  showPotentialRoute({band,preference,access});
  $('[data-next-step-title]').textContent='Understand your options. Know what support stays with you.';
  $('[data-next-step-copy]').textContent='Practical food, movement, check-ins and progress tools remain available in My Timber whether you use medicine, change treatment or choose another route.';
  $('[data-medication-next-steps]').hidden=preference==='No medication';
  $('[data-medication-next-steps]').style.display=preference==='No medication'?'none':'flex';
  $('[data-lifestyle-next-steps]').hidden=preference!=='No medication';
  $('[data-lifestyle-next-steps]').style.display=preference==='No medication'?'flex':'none';
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
