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
  const summary=document.querySelector('.sh-result-route-v72');
  document.querySelector('[data-budget-potential-route]')?.remove();
  if(!document.getElementById('start-here-result-layout')){
    const style=document.createElement('style');style.id='start-here-result-layout';
    style.textContent=`
body.v6 #quickResult .sh-result-route-v72{align-items:start;margin-bottom:0;padding-bottom:20px}
body.v6 #quickResult .sh-result-route-v72 aside{align-self:start}
body.v6 #quickResult .sst-potential-route{width:100%;margin:0 0 28px;padding:26px 0 0;border-top:1px solid #43483b;color:#e7e3da}
body.v6 #quickResult .sst-route-intro{max-width:880px;margin-bottom:24px}
body.v6 #quickResult .sst-route-intro h3{margin:0 0 10px!important;font-size:clamp(25px,3vw,34px)!important;line-height:1.12!important;letter-spacing:-.035em;color:#e7e3da!important}
body.v6 #quickResult .sst-route-intro p{margin:8px 0!important;font-size:15px!important;line-height:1.55!important;color:#c5c5bb!important}
body.v6 #quickResult .sst-options-head{display:flex;align-items:center;justify-content:space-between;gap:22px;margin:26px 0 18px}
body.v6 #quickResult .sst-options-head small{display:block;margin-bottom:5px;font-size:10px!important;font-weight:800;letter-spacing:.13em;color:#a5ad95!important}
body.v6 #quickResult .sst-options-head h4{margin:0!important;font-size:clamp(23px,2.5vw,30px)!important;line-height:1.15!important;letter-spacing:-.035em;color:#e7e3da!important}
body.v6 #quickResult .sst-format-switch{--slot:0;position:relative;isolation:isolate;display:grid;grid-template-columns:repeat(3,1fr);flex:0 0 358px;padding:5px;border:1px solid #707762;border-radius:999px;background:#11130f;box-shadow:inset 0 1px 5px #0008}
body.v6 #quickResult .sst-format-switch:before{content:'';position:absolute;z-index:-1;left:5px;top:5px;bottom:5px;width:calc((100% - 10px)/3);border-radius:999px;background:#a5ad95;box-shadow:0 2px 8px #0004;transform:translateX(calc(var(--slot)*100%));transition:transform .22s ease}
body.v6 #quickResult .sst-format-switch button{display:flex;align-items:center;justify-content:center;gap:7px;min-width:0;min-height:44px;margin:0;padding:10px 9px;border:0;border-radius:999px;background:transparent;color:#c9cebe!important;font-size:14px!important;line-height:1!important;font-weight:800;cursor:pointer;box-shadow:none}
body.v6 #quickResult .sst-format-switch button[aria-pressed=true]{color:#10120d!important}
body.v6 #quickResult .sst-format-switch button:hover{color:#fff!important}
body.v6 #quickResult .sst-format-switch button[aria-pressed=true]:hover{color:#050505!important}
body.v6 #quickResult .sst-format-switch svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 18px}
body.v6 #quickResult .sst-options-status{margin:0 0 14px!important;font-size:13px!important;line-height:1.4!important;color:#bfc5b2!important}
body.v6 #quickResult .sst-options-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
body.v6 #quickResult .sst-option-card{min-width:0;display:flex;flex-direction:column;padding:18px;border:1px solid #4a503f;border-radius:18px;background:linear-gradient(145deg,#151812,#0d0f0b);box-shadow:0 12px 30px #0002}
body.v6 #quickResult .sst-option-card[hidden]{display:none!important}
body.v6 #quickResult .sst-option-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:22px}
body.v6 #quickResult .sst-option-kind{font-size:10px!important;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#b5bea4!important}
body.v6 #quickResult .sst-option-stock{flex:0 0 auto;padding:5px 7px;border:1px solid #5c624f;border-radius:999px;font-size:9px!important;font-weight:800;letter-spacing:.05em;color:#d5d7cc!important}
body.v6 #quickResult .sst-option-visual{display:block;width:100%;height:140px;object-fit:cover;margin:14px 0 18px;border-radius:10px;background:#e7e3da}
body.v6 #quickResult .sst-option-card h5{margin:0 0 7px!important;font-size:25px!important;line-height:1.1!important;letter-spacing:-.035em;color:#e7e3da!important}
body.v6 #quickResult .sst-option-format{min-height:21px;margin:0 0 18px!important;font-size:14px!important;line-height:1.45!important;color:#bbc2ae!important}
body.v6 #quickResult .sst-option-price{margin:auto 0 0;padding-top:15px;border-top:1px solid #3d4433}
body.v6 #quickResult .sst-option-price strong{display:block;font-size:25px!important;line-height:1.1!important;font-weight:800;letter-spacing:-.03em;color:#e7e3da!important}
body.v6 #quickResult .sst-option-price span{display:block;margin-top:5px;font-size:12px!important;color:#b6bca9!important}
body.v6 #quickResult .sst-route-notes{margin-top:20px;padding:18px 20px;border:1px solid #414738;border-radius:14px;background:#10130e}
body.v6 #quickResult .sst-route-notes p{margin:0 0 9px!important;font-size:13px!important;line-height:1.5!important;color:#c0c6b5!important}
body.v6 #quickResult .sst-route-notes p:last-child{margin-bottom:0!important}
body.v6 #quickResult .sst-route-notes strong{color:#e7e3da!important}
body.v6 #quickResult .sst-route-support{margin:18px 0 0!important;font-size:14px!important;line-height:1.5!important;color:#bbc2ae!important}
body.v6 #quickResult .sst-route-support a{color:#e7e3da!important;text-underline-offset:4px;font-weight:800}
@media(max-width:900px){body.v6 #quickResult .sst-options-head{align-items:start;flex-direction:column;gap:16px}body.v6 #quickResult .sst-format-switch{flex:0 0 auto;width:min(100%,420px)}body.v6 #quickResult .sst-options-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){body.v6 #quickResult .sh-summary-v72{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0 12px}body.v6 #quickResult .sh-summary-v72>div{padding:9px 2px!important}body.v6 #quickResult .sh-summary-v72>div:nth-last-child(-n+2){border-bottom:0!important}body.v6 #quickResult .sh-summary-v72 strong{font-size:13px!important}body.v6 #quickResult .sst-potential-route{padding-top:23px}body.v6 #quickResult .sst-route-intro{margin-bottom:20px}body.v6 #quickResult .sst-format-switch{width:100%}body.v6 #quickResult .sst-options-grid{grid-template-columns:1fr;gap:14px}body.v6 #quickResult .sst-option-card{padding:18px}body.v6 #quickResult .sst-option-visual{height:155px}body.v6 #quickResult .sst-route-notes{padding:16px}body.v6 #quickResult .sst-options-head{margin-top:22px}}
@media(prefers-reduced-motion:reduce){body.v6 #quickResult .sst-format-switch:before{transition:none}}
`;
    document.head.append(style);
  }
  const section=document.createElement('section');section.dataset.budgetPotentialRoute='2026-10-20-switch';section.className='sst-potential-route';section.setAttribute('aria-labelledby','potential-route-title');
  const add=(tag,text,parent=section,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;parent.append(el);return el;};
  const intro=add('div','',section,'sst-route-intro');
  const heading=add('h3','Your potential route',intro);heading.id='potential-route-title';
  const noMedicine=preference==='No medication',freeFirst=band==='nhs'||access==='NHS';
  if(noMedicine){
    add('p','Start with free My Timber support: plan meals in Grub, find manageable movement in Fit, and use check-ins to review your progress. You do not need to buy medicine to use these tools.',intro);
    add('p','Your preference is support without medication. If you need more help, your GP or a local weight-management service can discuss non-medicine support with you.',intro);
  }else if(freeFirst){
    add('p','Start with free My Timber support for meals, movement and check-ins, alongside a conversation with your GP or local weight-management service about NHS support.',intro);
    add('p','You can discuss your '+(preference==='Jabs'?'injection':preference==='Tablets'?'oral treatment':'treatment format')+' preference at that assessment. NHS eligibility, treatment choices and local availability are decided by the clinical service.',intro);
  }else{
    const chosen=preference==='Jabs'?'your preference for an injection':preference==='Tablets'?'your preference for tablets or capsules':'oral treatment and injection options';
    add('p','A clinical assessment could help you explore '+chosen+', alongside free My Timber support for meals, movement and progress.',intro);
    add('p',preference==='Jabs'?'If you would consider tablets or capsules too, you can compare the oral formats below.':preference==='Tablets'?'If you would consider a jab too, you can compare the injection formats below.':'Daily tablets, capsules taken with meals and injections involve different routines. You can explore both formats below.',intro);
    const head=add('div','',section,'sst-options-head');
    const titles=add('div','',head);add('small','TREATMENT FORMATS',titles);add('h4','Medicine information',titles);
    const toggle=add('div','',head,'sst-format-switch');toggle.setAttribute('role','group');toggle.setAttribute('aria-label','Show medicine formats');
    const icons={both:'<path d="M4 7h15l-4-4M20 17H5l4 4"/>',tablet:'<path d="M8 4a6 6 0 0 1 8 8l-4 4a6 6 0 0 1-8-8l4-4Z"/><path d="m6 6 8 8"/>',jab:'<path d="m5 16 9-9 4 4-9 9H5v-4ZM12 5l3-3 7 7-3 3M2 22l3-3M8 13l3 3"/>'};
    const buttons=[];
    for(const[value,text]of[['both','Both'],['tablet','Tablets'],['jab','Jabs']]){
      const button=add('button','',toggle);button.type='button';button.dataset.formatFilter=value;button.setAttribute('aria-controls','potential-route-options');button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24">'+icons[value]+'</svg><span>'+text+'</span>';buttons.push(button);
    }
    const status=add('p','',section,'sst-options-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const grid=add('div','',section,'sst-options-grid');grid.id='potential-route-options';
    const images={'Mounjaro':'mounjaro-pen-studio-v1.png','Wegovy':'wegovy-pen-studio-v1.png','Liraglutide':'liraglutide-pen-studio-v1.png','Wegovy tablets':'wegovy-tablets-studio-v1.png','Foundayo':'wegovy-tablets-studio-v1.png','Orlistat':'orlistat-capsules-studio-v1.png'};
    const pounds=p=>'£'+(p/100).toFixed(0);
    for(const row of budgetPriceSnapshot){
      const card=add('article','',grid,'sst-option-card');card.dataset.routeMedicine=row.name;card.dataset.medicineFormat=row.oral?'tablet':'jab';
      const meta=add('div','',card,'sst-option-meta');add('span',row.oral?(row.name==='Orlistat'?'Capsule':'Tablet'):'Injection',meta,'sst-option-kind');add('span','OUT OF STOCK',meta,'sst-option-stock');
      const image=add('img','',card,'sst-option-visual');image.src='/assets/medicine/'+images[row.name];image.alt='';image.width=600;image.height=400;
      add('h5',row.name==='Wegovy'?'Wegovy injection':row.name==='Foundayo'?'Foundayo tablets':row.name,card);
      add('p',row.format,card,'sst-option-format');
      const price=add('div','',card,'sst-option-price');add('strong',pounds(row.low)+'–'+pounds(row.high),price);add('span','per listed pack · varies by strength or quantity',price);
    }
    function setView(view){
      toggle.style.setProperty('--slot',String(['both','tablet','jab'].indexOf(view)));
      for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.formatFilter===view));
      for(const card of grid.children)card.hidden=view!=='both'&&card.dataset.medicineFormat!==view;
      status.textContent=view==='both'?'Showing all 6 options · all out of stock':view==='tablet'?'Showing 3 oral options · tablets and capsules · all out of stock':'Showing 3 injection options · all out of stock';
    }
    buttons.forEach(button=>{button.onclick=()=>setView(button.dataset.formatFilter);button.onkeydown=event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const i=buttons.indexOf(button),next=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;buttons[next].focus();setView(buttons[next].dataset.formatFilter);
    };});
    setView(preference==='Tablets'?'tablet':preference==='Jabs'?'jab':'both');
    const notes=add('div','',section,'sst-route-notes');
    const clinical=add('p','',notes);add('strong','A prescription is a clinical decision. ',clinical);clinical.append('A prescribing clinician must assess whether any medicine is appropriate and agree the medicine and dose with you. Recording a preference does not guarantee a prescription.');
    add('p','Prices checked 20 October 2026. Pack quantities, supply periods and dose prices vary. These are pack prices, not calendar-month costs; ongoing costs depend on the treatment and dose agreed with the prescriber.',notes);
    add('p','Illustrations show medicine formats, not supplied packaging. No stock is available today. Orders and payments are currently closed.',notes);
  }
  const support=add('p','Free My Timber support is available whichever route you take. ',section,'sst-route-support');const link=add('a','Explore My Timber',support);link.href='/member/dashboard';
  summary.after(section);
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
  $('[data-result-title]').textContent='A starting point for your next step.';
  $('[data-result-copy]').textContent='Explore practical support and treatment formats below. Your budget and preferences are part of the conversation with a prescriber.';
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
