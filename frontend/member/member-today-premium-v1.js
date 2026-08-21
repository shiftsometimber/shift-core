(function(){
  'use strict';
  if(!/^\/member\/dashboard(?:\.html)?$/.test(location.pathname))return;
  const q=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let today=null,busy=false;

  function setupMarkup(missing){
    if(!missing?.length)return'';
    return `<form class="mp-today-setup" data-shift-setup><span class="eyebrow">MAKE THIS YOURS</span><h3>Four quick choices. Better suggestions from tomorrow.</h3><div class="mp-setup-grid">
      ${select('activity_level','Most days I move…',[['low','Not much'],['some','A bit'],['regular','Regularly']])}
      ${select('meal_pattern','Food is usually…',[['structured','Planned'],['mixed','A mixed bag'],['chaotic','Last minute']])}
      ${select('movement_preference','I would rather…',[['walking','Walk'],['strength','Do strength work'],['mixed','Mix it up'],['unsure','Not sure yet']])}
      ${select('life_priority','I most want back…',[['energy','Energy'],['confidence','Confidence'],['sleep','Better sleep'],['family','Family time'],['headspace','Headspace']])}
      </div><button class="mp-btn" type="submit">Build my Shift</button><p class="mp-today-action-status" aria-live="polite"></p></form>`;
  }
  function select(name,label,options){return`<label><span>${esc(label)}</span><select name="${name}" required><option value="">Choose one</option>${options.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`}
  function actionMarkup(action,index){const done=action.status==='completed',skipped=action.status==='skipped';return`<article class="mp-today-action-card ${done?'is-done':''} ${skipped?'is-skipped':''}" data-action-id="${esc(action.id)}">
    <div class="mp-today-action-top"><span class="eyebrow">${esc(action.eyebrow)}</span><span>${done?'DONE':skipped?'NOT TODAY':`${index+1} OF 3`}</span></div>
    <h3>${esc(action.title)}</h3><p>${esc(action.detail)}</p>
    <details class="mp-today-why"><summary>Why this?</summary><strong>${esc(action.why?.headline||'Why this today?')}</strong><p>${esc(action.why?.reason||'Built from your current Shift context.')}</p>${action.why?.learned?`<p>${esc(action.why.learned)}</p>`:''}</details>
    <div class="mp-today-controls">
      <button type="button" data-decision="complete" ${done?'disabled':''}>${done?'✓ Done':'Done'}</button>
      <button type="button" data-decision="swap" ${done?'disabled':''}>Swap</button>
      <button type="button" data-decision="skip" ${done||skipped?'disabled':''}>Not today</button>
    </div><p class="mp-today-action-status" aria-live="polite"></p></article>`}
  function render(){const box=q('#todayActions'),panel=q('#panel-today');if(!box||!today)return;const actions=today.actions||[],complete=actions.filter(a=>a.status==='completed').length;box.innerHTML=`<section class="mp-today-premium" data-today-premium-v2>
    ${setupMarkup(today.setup?.missing)}
    <div class="mp-today-priority-intro"><div><span class="eyebrow">TODAY</span><strong>${complete===3?'Nice one. Today is yours.':'Three things that count.'}</strong></div><p>${complete} of 3 done · Swap or skip without guilt.</p></div>
    <div class="mp-today-action-grid">${actions.map(actionMarkup).join('')}</div></section>`;panel.dataset.todayPremiumReady='true'}
  async function load(){if(busy||!window.SST_API?.getShiftToday)return;busy=true;try{const body=await SST_API.getShiftToday();today=body.today||body;render()}catch{const box=q('#todayActions');if(box)box.innerHTML='<div class="mp-today-empty"><strong>Today could not refresh.</strong><p>Nothing has been lost. Try again in a moment.</p><button type="button" data-retry-today>Try again</button></div>'}finally{busy=false}}
  async function decide(button){const card=button.closest('[data-action-id]'),id=card?.dataset.actionId,decision=button.dataset.decision;if(!id||!decision||busy)return;busy=true;card.classList.add('is-working');const status=card.querySelector('.mp-today-action-status');status.textContent='Saving…';try{const body=await SST_API.decideShiftTodayAction(id,{decision,idempotencyKey:crypto.randomUUID()});const index=today.actions.findIndex(a=>a.id===id);if(index>=0)today.actions[index]=body.action;render();const updated=q(`[data-action-id="${CSS.escape(id)}"] .mp-today-action-status`);if(updated)updated.textContent=body.message||'Saved.'}catch{status.textContent='That did not save. Nothing changed—please try again.';card.classList.remove('is-working')}finally{busy=false}}
  async function saveSetup(form){if(busy)return;busy=true;const status=form.querySelector('.mp-today-action-status');status.textContent='Building your Shift…';try{const data=Object.fromEntries(new FormData(form));await SST_API.saveShiftSetup(data);busy=false;await load()}catch{status.textContent='That did not save. Please try once more.'}finally{busy=false}}
  function boot(){const box=q('#todayActions');if(!box||!window.SST_API?.getShiftToday){setTimeout(boot,100);return}load();document.addEventListener('click',event=>{const button=event.target.closest('[data-decision]');if(button)decide(button);if(event.target.closest('[data-retry-today]'))load()});document.addEventListener('submit',event=>{if(event.target.matches('[data-shift-setup]')){event.preventDefault();saveSetup(event.target)}})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
