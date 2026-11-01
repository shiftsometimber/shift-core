export function firstSixWeeksClient(weeks, programmeURL) {
  'use strict';
  const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chevron='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  const sample=new URLSearchParams(location.search).get('sample')==='1';
  const programme=new URLSearchParams(location.search).get('view')==='first-six-weeks'&&location.pathname==='/member/life-back/journey';
  const ready=()=>document.body.dataset.memberSession==='ready'&&document.body.dataset.accountDeleted!=='1';
  const sampleSuffix=sample?'&sample=1':'';
  const href=n=>programmeURL+'&week='+n+sampleSuffix;
  const sampleBanner=()=>sample?'<aside class="six-touchpoint"><p class="six-kicker">SAMPLE PROGRAMME · EXAMPLE DATA</p><h2>Have a look around.</h2><p>These examples are made up. They are never added to your check-ins, health records or progress.</p><label for="sixSampleScenario">Choose an example week</label><select id="sixSampleScenario"><option value="family">Busy family week</option><option value="late">Working late</option><option value="gentle">Making movement manageable</option></select><div id="sixSampleEntries" aria-live="polite"></div><a href="'+programmeURL+'">Leave the sample</a></aside>':'';
  function sampleEntries(){const select=$('#sixSampleScenario'),out=$('#sixSampleEntries');if(!select||!out)return;const examples={family:['Make tea easier on a school night','Picked a familiar meal in Grub and made the shopping list','Having the ingredients ready took one decision off my plate.'],late:['Have a plan for a late finish','Chose a simple meal before work rather than deciding when tired','The plan helped on Tuesday. Thursday needed something even simpler.'],gentle:['Find movement that fits my day','Looked at the available options in Fit and chose something manageable','A smaller step felt easier to return to.']};const e=examples[select.value]||examples.family;out.innerHTML='<p class="six-kicker">ILLUSTRATIVE ENTRIES</p><p><strong>My reset:</strong> '+esc(e[0])+'</p><p><strong>What I tried:</strong> '+esc(e[1])+'</p><p><strong>My reflection:</strong> '+esc(e[2])+'</p>';}
  let queued=false,lastView='';
  function invite(){
    const box=document.createElement('section');box.className='mt-six mt-six-invite';box.id='mtFirstSixWeeksToday';box.setAttribute('aria-labelledby','mtFirstSixWeeksTitle');
    box.innerHTML='<img class="six-photo" src="/assets/member-experience/programme-first-six-weeks.webp" width="960" height="640" alt="A dad and his son taking a walk together in a leafy park" loading="lazy" decoding="async"><div class="six-copy"><p class="six-kicker">A good place to begin</p><h2 id="mtFirstSixWeeksTitle">Your first<br>six weeks.</h2><p class="six-tagline">Small shifts. Real life. Your pace.</p><div class="six-segments" aria-hidden="true">'+Array(6).fill('<span></span>').join('')+'</div><p class="six-small">Six weeks, one manageable step at a time.</p><a class="six-action" href="'+programmeURL+'">See your six weeks</a><a class="six-back" href="'+programmeURL+'&sample=1">Sample programme</a><p class="six-free">Free in My Timber.</p></div>';
    return box;
  }
  function overview(){
    return '<a class="six-back" href="/member/life-back/journey">‹ Journey</a><h1 tabindex="-1">Your first<br>six weeks.</h1><p>Start where you are. Come back when you’re ready.</p><ol class="six-list">'+weeks.map((w,i)=>'<li class="six-row"><span class="six-number" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span><a class="six-week-link" href="'+href(i+1)+'">'+(i===0?'<div><p class="six-kicker">Week 1</p>':'<div>')+'<strong>'+esc(w.title)+'</strong><small>'+esc(w.summary)+'</small></div>'+chevron+'</a>'+(i===0?'<div class="six-chips" aria-label="Inside each week"><span>Reset</span><span>Try one thing</span><span>Reflect</span></div><a class="six-action" href="'+href(1)+'">Open week one</a>':'')+'</li>').join('')+'</ol><p class="six-reassurance">No catching up. No falling behind.</p><p class="six-note">All six weeks are open. These are optional prompts, not a completion score. Your private check-ins stay in your existing My Timber records.</p>';
  }
  function weekView(n){
    const w=weeks[n-1],touchpoints=[['MON · YOUR RESET','One small shift',w.reset,null],['WED · SOMETHING USEFUL','Try one thing',w.read,[w.action,w.href]],['FRI · GOOD TO TALK','A thought for the week',w.prompt,null],['SUN · YOUR REFLECTION','What helped?',w.reflect,['Open my private check-in','/member/check-in']]];
    return '<a class="six-back" href="'+programmeURL+sampleSuffix+'">‹ Your six weeks</a><header class="six-week-head"><p class="six-kicker">Week '+n+' · Your first six weeks</p><h1 tabindex="-1">'+esc(w.title)+'</h1><p>'+esc(w.intro)+'</p></header><nav class="six-week-picker" aria-label="Choose a programme week">'+weeks.map((_,i)=>'<a href="'+href(i+1)+'" aria-label="Week '+(i+1)+'"'+(i+1===n?' aria-current="step"':'')+'>'+(i+1)+'</a>').join('')+'</nav><div class="six-touchpoints">'+touchpoints.map(([day,title,copy,action])=>'<section class="six-touchpoint"><p class="six-kicker">'+day+'</p><h2>'+title+'</h2><p>'+esc(copy)+'</p>'+(action?'<a class="six-action" href="'+esc(action[1])+'">'+esc(action[0])+'</a>':'')+'</section>').join('')+'</div><p class="six-reassurance">No catching up. No falling behind.</p><p class="six-note">Use as much or as little as helps. Opening a week does not mark it complete. Treatment questions go to your own prescriber.</p>';
  }
  function renderProgramme(){
    const root=$('#timberJourney');if(!root)return;
    root.classList.add('mt-six','mt-six-programme');
    if(!ready()){if(lastView||root.querySelector('.six-list,.six-week-head'))root.replaceChildren();lastView='';return;}
    const raw=new URLSearchParams(location.search).get('week'),n=/^[1-6]$/.test(raw||'')?Number(raw):0,key=String(n);
    if(lastView===key&&root.firstElementChild)return;
    root.innerHTML=sampleBanner()+(n?weekView(n):overview());sampleEntries();lastView=key;document.title=(n?'Week '+n+' · ':'')+'Your first six weeks · My Timber';
  }
  function refresh(){
    if(programme){renderProgramme();return;}
    if(!ready()){$('#mtFirstSixWeeksToday')?.remove();$('#mtFirstSixWeeksJourney')?.remove();return;}
    if(/^\/member\/dashboard(?:\.html)?$/.test(location.pathname)){
      const q=new URLSearchParams(location.search),section=q.get('timber'),tool=q.get('tool')||document.body.dataset.appTool,hash=location.hash||'#today';
      const today=hash==='#today'&&(!section||['today','home'].includes(section))&&(!tool||tool==='today');
      if(!today){$('#mtFirstSixWeeksToday')?.remove();return;}
      const root=$('#todayActions')||$('#panel-today')||$('main');if(!root||root.closest('[hidden]'))return;
      if(!$('#mtFirstSixWeeksToday')){
        const card=invite(),next=root.querySelector('.mtm-next,.mt-next-shift,[data-next-shift]');
        if(next)next.after(card);else root.prepend(card);
      }
    }
    if(location.pathname==='/member/life-back/journey'){
      const root=$('#timberJourney');if(!root||root.querySelector('#mtFirstSixWeeksJourney'))return;
      const card=document.createElement('a');card.id='mtFirstSixWeeksJourney';card.className='mt-six mt-six-journey-entry';card.href=programmeURL;card.innerHTML='<span><strong>Your first six weeks</strong><small>Small shifts. Real life. Your pace.</small></span>'+chevron;root.prepend(card);
    }
  }
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;refresh();});}};
  function boot(){refresh();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-member-session','data-account-deleted','data-app-tool','hidden']});}
  document.addEventListener('change',event=>{if(event.target.id==='sixSampleScenario')sampleEntries();});
  if(programme)document.addEventListener('click',event=>{
    const a=event.target.closest?.('.mt-six a');if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const u=new URL(a.href);if(u.origin!==location.origin||u.pathname!=='/member/life-back/journey'||u.searchParams.get('view')!=='first-six-weeks')return;
    if((u.searchParams.get('sample')==='1')!==sample)return;
    event.preventDefault();history.pushState(null,'',u.pathname+u.search);lastView='';refresh();$('#timberJourney h1')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  });
  addEventListener('popstate',()=>{lastView='';schedule();});addEventListener('hashchange',schedule);document.addEventListener('sst:today-rendered',schedule);document.addEventListener('visibilitychange',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
