// G2-001-TODAY-PREMIUM — presentation-only layer over the canonical /v1/shift/today contract.
// G4-008-PROACTIVE-TODAY — privacy/cooldown-governed proactive feed joins the daily orchestration without owning member state.
(function(){
  'use strict';
  if(!/^\/member\/dashboard(?:\.html)?$/.test(location.pathname))return;
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PANEL_TARGET={hydration:'water',grub:'grub',fit:'fit',progress:'visualise'};
  let rendering=false,timer=null,lastToday=null,lastProactive=[];

  function waterGuide(today){
    const direct=Number(today?.summary?.water_guide_ml||0);
    if(direct>0)return direct;
    const hydration=(today?.actions||[]).find(a=>String(a?.domain||'').toLowerCase()==='hydration');
    const match=String(hydration?.title||'').match(/\b([\d,]+)\s*ml\b/i);
    return match?Number(match[1].replace(/,/g,''))||0:0;
  }
  function settleMetrics(today){
    const metrics=[
      ['#metricCalories',today?.summary?.calories_left,v=>String(v)],
      ['#metricProtein',today?.summary?.protein_left,v=>`${v}g`],
      ['#metricSteps',today?.summary?.step_gap,v=>String(v)],
      ['#metricWater',waterGuide(today),v=>`${Math.round(Number(v)/100)/10}L`]
    ];
    for(const [selector,value,format] of metrics){
      const el=q(selector);if(!el)continue;
      const card=el.closest('.mp-card')||el.parentElement;
      const valid=value!==null&&value!==undefined&&value!==''&&Number(value)!==0&&Number.isFinite(Number(value));
      if(!valid){if(card)card.hidden=true;continue}
      el.textContent=format(value);if(card)card.hidden=false;
    }
    const visible=metrics.map(([selector])=>q(selector)?.closest('.mp-card')).filter(x=>x&&!x.hidden);
    const metricWrap=visible[0]?.parentElement;
    if(metricWrap)metricWrap.dataset.todayMetricCount=String(visible.length);
  }
  function actionCard(action,index){
    const target=String(action?.cta?.target||'').toLowerCase();
    const canRoute=Boolean(PANEL_TARGET[target])||target==='today';
    const label=String(action?.cta?.label||'').trim();
    const button=label&&canRoute?`<button type="button" class="mp-btn mp-today-action-cta" data-today-target="${esc(target)}"${target==='today'?' aria-pressed="false"':''}>${esc(label)}</button>`:'';
    const proactive=action?.proactive?' is-proactive':'';
    return `<article class="mp-today-action-card${index===0?' is-lead':''}${proactive}" data-today-action-card="${esc(action?.domain||index)}"${action?.proactive?' data-today-proactive="true"':''}>
      <div class="mp-today-action-top"><span class="eyebrow">${esc(action?.eyebrow||action?.domain||'TODAY')}</span><span class="mp-today-priority">${action?.proactive?'Shift noticed':index===0?'First up':`Then ${index+1}`}</span></div>
      <h3>${esc(action?.title||'Your next useful thing')}</h3>
      ${action?.detail||action?.text?`<p>${esc(action.detail||action.text)}</p>`:''}
      ${button}<span class="mp-today-action-status" aria-live="polite"></span>
    </article>`;
  }
  function proactiveActions(insights){
    return (Array.isArray(insights)?insights:[]).slice(0,1).filter(x=>x&&x.title&&x.body).map(x=>({domain:'shift',eyebrow:'SHIFT NOTICED',title:x.title,detail:x.body,proactive:true}));
  }
  function markup(today,proactive=[]){
    const actions=[...(Array.isArray(today?.actions)?today.actions:[]),...proactiveActions(proactive)];
    if(!actions.length)return '<section class="mp-today-premium" data-today-premium-v1="true"><div class="mp-today-empty"><span class="eyebrow">TODAY</span><strong>Nothing urgent to chase.</strong><p>Shift will put the useful next thing here when there is one.</p></div></section>';
    return `<section class="mp-today-premium" data-today-premium-v1="true">
      <div class="mp-today-priority-intro"><div><span class="eyebrow">WHAT MATTERS TODAY</span><strong>${actions.length===1?'One useful thing':`${actions.length} useful things`}</strong></div><p>Small, specific and linked to the part of Shift that can help.</p></div>
      <div class="mp-today-action-grid">${actions.map(actionCard).join('')}</div>
    </section>`;
  }
  async function fetchProactive(){
    try{
      const root=String(window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
      const response=await fetch(root+'/v1/shift-ai/proactive/feed',{credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
      if(!response.ok)return [];
      const body=await response.json();
      return Array.isArray(body?.insights)?body.insights:[];
    }catch{return []}
  }
  function renderToday(today,proactive=[]){
    const box=q('#todayActions'),panel=q('#panel-today');
    if(!box||!panel)return false;
    lastToday=today||{};lastProactive=Array.isArray(proactive)?proactive:[];
    const h=panel.querySelector(':scope > h2'),sub=panel.querySelector(':scope > .mp-muted');
    if(h&&lastToday.headline)h.textContent=lastToday.headline;
    if(sub&&lastToday.subhead)sub.textContent=lastToday.subhead;
    settleMetrics(lastToday);
    box.innerHTML=markup(lastToday,lastProactive);
    panel.dataset.todayPremiumReady='true';
    panel.dataset.todayActionCount=String((Array.isArray(lastToday.actions)?lastToday.actions.length:0)+proactiveActions(lastProactive).length);
    panel.dataset.todayProactiveCount=String(proactiveActions(lastProactive).length);
    return true;
  }
  async function render(){
    const box=q('#todayActions'),panel=q('#panel-today');
    if(!box||!panel||!window.SST_API?.getShiftToday||rendering)return;
    rendering=true;
    try{
      const [response,proactive]=await Promise.all([SST_API.getShiftToday(),fetchProactive()]);
      renderToday(response?.today||response||{},proactive);
    }catch(error){
      if(!box.querySelector('[data-today-premium-v1]'))box.innerHTML='<section class="mp-today-premium" data-today-premium-v1="true"><div class="mp-today-empty"><strong>Today could not refresh just now.</strong><p>Your saved Shift state has not been changed. Try again in a moment.</p></div></section>';
      panel.dataset.todayPremiumReady='error';
    }finally{rendering=false}
  }
  function schedule(){
    clearTimeout(timer);
    const box=q('#todayActions'),panel=q('#panel-today');
    if(!box||!panel||box.querySelector('[data-today-premium-v1]'))return;
    if(lastToday){renderToday(lastToday,lastProactive);return}
    timer=setTimeout(()=>{
      const retryBox=q('#todayActions'),retryPanel=q('#panel-today');
      if(!retryBox||!retryPanel||retryBox.querySelector('[data-today-premium-v1]'))return;
      render();
    },35);
  }
  function handleTarget(button){
    const target=String(button.dataset.todayTarget||'').toLowerCase();
    if(target==='today'){
      button.setAttribute('aria-pressed','true');button.disabled=true;button.textContent='✓ Kept simple';
      const status=button.parentElement?.querySelector('.mp-today-action-status');if(status)status.textContent='Nothing else to do here.';
      return;
    }
    const panel=PANEL_TARGET[target];if(!panel)return;
    const tab=q(`.mp-tab[data-panel="${CSS.escape(panel)}"]`);if(tab){tab.click();tab.focus({preventScroll:true})}
  }
  function boot(){
    const box=q('#todayActions'),panel=q('#panel-today');
    if(!box||!panel||!window.SST_API?.getShiftToday){setTimeout(boot,100);return}
    render();
    new MutationObserver(schedule).observe(panel,{childList:true,subtree:true});
    document.addEventListener('click',event=>{const button=event.target.closest('[data-today-target]');if(button)handleTarget(button)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
