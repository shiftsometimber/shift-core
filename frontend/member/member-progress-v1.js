// Shift Some Timber — G2-011 whole-person Progress productisation.
// Reuses the canonical /v1/progress/summary contract and the existing Progress Picture surface.
(function(){
  'use strict';
  if(location.pathname!=='/member/dashboard'&&location.pathname!=='/member/dashboard.html')return;
  // The current master loads its reviewed weekly check-in itself. Its restored
  // Progress tool must not add a second copy with duplicate event handlers.
  if(document.body.dataset.memberTools!=='v1'){
    if(!document.querySelector('link[data-journey-checkin]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/member-my-journey-checkin-v1.css?v=1';l.dataset.journeyCheckin='v1';document.head.appendChild(l)}
    if(!document.querySelector('script[data-journey-checkin]')){const s=document.createElement('script');s.src='/member-my-journey-checkin-v1.js?v=1';s.dataset.journeyCheckin='v1';document.head.appendChild(s)}
  }

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let weightUnits='stone_lb';
  const weightValue=kg=>{if(weightUnits==='kg')return `${kg.toFixed(1)}kg`;const tenths=Math.round(kg*2.2046226218*10);return weightUnits==='lb'?`${(tenths/10).toFixed(1)} lb`:`${Math.floor(tenths/140)} st ${((tenths%140)/10).toFixed(1)} lb`;};
  const cleanNumber=v=>Number.isFinite(Number(v))?Number(v):null;
  const formatValue=m=>{
    if(m.latest==null)return '—';
    const value=Number(m.latest);
    if(m.key==='steps')return Math.round(value).toLocaleString('en-GB');
    if(m.key==='sleep')return `${value.toFixed(1)}h`;
    if(m.key==='weight')return weightValue(value);
    if(m.key==='waist')return `${value.toFixed(1)}cm`;
    if(m.key==='mood')return `${value}/10`;
    return `${Math.round(value)}${m.unit==='mmHg'?'':''}`;
  };
  const deltaCopy=m=>{
    if(m.delta==null)return 'Add another check-in to see the direction.';
    if(Math.abs(Number(m.delta))<0.05)return 'Holding steady since your first log.';
    const n=Number(m.delta),abs=Math.abs(n);
    if(m.key==='weight')return `${weightUnits==='kg'?abs.toFixed(1)+' kg':(abs*2.2046226218).toFixed(1)+' lb'} ${n>0?'up':'down'} since your first logged weight.`;
    const amount=m.key==='steps'?Math.round(abs).toLocaleString('en-GB'):Number(abs.toFixed(1)).toLocaleString('en-GB');
    const suffix=m.unit&&m.unit!=='/10'?` ${m.unit}`:'';
    if(m.direction==='improving')return `${amount}${suffix} moving the right way.`;
    return `${amount}${suffix} ${n>0?'up':'down'} since your first log.`;
  };
  const metricCard=m=>`<article class="shift-progress-metric ${m.direction==='improving'?'is-improving':''}">
    <span class="shift-progress-label">${esc(m.label)}</span>
    <strong>${esc(formatValue(m))}</strong>
    <small>${esc(deltaCopy(m))}</small>
  </article>`;

  function ensureHost(){
    const panel=document.querySelector('#panel-visualise');
    if(!panel)return null;
    let host=document.getElementById('shiftProgressStory');
    if(!host){
      host=document.createElement('section');host.id='shiftProgressStory';host.className='shift-progress-story';host.setAttribute('aria-live','polite');host.setAttribute('aria-busy','true');
      const heading=panel.querySelector(':scope > h2');
      const sub=panel.querySelector(':scope > .mp-muted');
      const anchor=sub||heading,direct=anchor?.parentElement===panel?anchor:[...panel.children].find(child=>anchor&&child.contains(anchor));
      if(direct)direct.after(host);else panel.prepend(host);
    }
    const tab=document.querySelector('.mp-tab[data-panel="visualise"]');
    if(tab&&/progress picture/i.test(tab.textContent||'')){tab.textContent='Progress';tab.setAttribute('aria-label','Progress')}
    return host;
  }

  async function render(){
    const host=ensureHost();if(!host||!window.SST_API?.getProgressSummary)return;
    host.setAttribute('aria-busy','true');
    try{
      const r=await SST_API.getProgressSummary();const p=r.progress||r;
      weightUnits=['stone_lb','kg','lb'].includes(p.units)?p.units:'stone_lb';
      if(!p||p.state==='empty'){
        host.innerHTML=`<div class="shift-progress-intro"><div><span class="eyebrow">YOUR PROGRESS</span><h3>Your progress story starts with the first check-in.</h3><p>Weight is one signal, not the scoreboard. Shift will bring waist, blood pressure, movement, sleep and mood together here as you log them.</p></div><div class="shift-progress-nudge"><strong>Keep it useful.</strong><span>Add what you know. Leave the rest blank.</span></div></div>`;
        return;
      }
      const metrics=Array.isArray(p.metrics)?p.metrics.filter(m=>m&&m.latest!=null):[];
      const improving=metrics.filter(m=>m.direction==='improving').length;
      const entryCount=cleanNumber(p.entries)||0;
      const milestones=Array.isArray(p.milestones)?p.milestones.map(x=>x.key==='weight'?{...x,detail:deltaCopy(metrics.find(m=>m.key==='weight'))}:x):[];
      host.innerHTML=`<div class="shift-progress-intro">
        <div><span class="eyebrow">YOUR PROGRESS</span><h3>${esc(p.headline||'Since you started')}</h3><p>${esc(p.message||'Progress is bigger than weight.')}</p></div>
        <div class="shift-progress-score"><strong>${improving}</strong><span>signal${improving===1?'':'s'} moving the right way</span><small>${entryCount} check-in${entryCount===1?'':'s'} retained</small></div>
      </div>
      ${metrics.length?`<div class="shift-progress-grid">${metrics.map(metricCard).join('')}</div>`:''}
      ${milestones.length?`<div class="shift-progress-milestones"><span class="eyebrow">WINS WORTH NOTICING</span>${milestones.map(x=>`<div><strong>${esc(x.label)}</strong>${x.detail?`<span>${esc(x.detail)}</span>`:''}</div>`).join('')}</div>`:''}
      <p class="shift-progress-foot">This is your trend, not a judgement. One rough day does not erase the direction of travel.</p>`;
    }catch(err){
      host.innerHTML='<div class="shift-progress-intro"><div><span class="eyebrow">YOUR PROGRESS</span><h3>Your progress is still saved.</h3><p>We could not draw the summary just now. Your retained check-ins and Progress Pictures have not been removed.</p></div></div>';
    }finally{host.setAttribute('aria-busy','false')}
  }

  function boot(){render();window.addEventListener('hashchange',()=>{if(location.hash==='#visualise')render()});document.addEventListener('click',e=>{if(e.target.closest('.mp-tab[data-panel="visualise"]'))setTimeout(render,120);if(e.target.closest('#saveOriginal,[data-photo-delete]'))setTimeout(render,1800)});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
