// Shift Me premium creator V2 — approved adult character builder on the existing member dashboard.
(function(){
  'use strict';
  if(!/^\/member\/dashboard(?:\.html)?$/.test(location.pathname))return;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const controls={
    build:['Slim','Average','Stocky','Bigger bloke','Broad','Tall','Shorter'],
    face:['Round','Oval','Square','Longer','Fuller','Angular'],
    hair:['Short','Shaved','Receding','Buzz cut','Curly','Longer','Bald'],
    facial:['Clean shaven','Stubble','Short beard','Full beard','Moustache','Goatee'],
    skin:['Light','Light-medium','Medium','Olive','Brown','Deep'],
    eyes:['Brown','Blue','Green','Hazel','Grey'],
    top:['Black tee','Olive tee','White tee','Grey marl vest','Black polo','Black hoodie','Olive hoodie','Black quarter zip'],
    bottom:['Black shorts','Olive joggers','Black joggers'],
    accessory:['None','Black cap'],
    view:['Front','Left side','Back','Right side']
  };
  const labels={build:'Build',face:'Face',hair:'Hair',facial:'Facial hair',skin:'Skin',eyes:'Eyes',top:'Top',bottom:'Bottoms',accessory:'Extras',view:'View'};
  const defaults={build:'Average',face:'Oval',hair:'Short',facial:'Clean shaven',skin:'Medium',eyes:'Brown',top:'Black tee',bottom:'Black shorts',accessory:'None',view:'Front'};
  const state={...defaults};
  function categoryButton(key){return `<button type="button" class="sm-category${key==='build'?' active':''}" data-shift-me-category="${key}">${esc(labels[key])}</button>`}
  function optionButtons(key){return `<div class="sm-option-set${key==='build'?' active':''}" data-shift-me-options="${key}"><p class="sm-step">${esc(labels[key])}</p><div class="sm-option-grid">${controls[key].map(v=>`<button type="button" class="sm-option${state[key]===v?' selected':''}" data-shift-me-control="${key}" data-value="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`}
  function ensureNavLink(){const nav=$('.member-sidebar nav')||$('main aside nav')||$('main aside');if(!nav||$('[data-shift-me-nav]',nav))return;const link=document.createElement('a');link.href='/member/dashboard#shiftme';link.dataset.shiftMeNav='v2';link.textContent='Shift Me';link.onclick=e=>{e.preventDefault();activate()};const settings=[...nav.querySelectorAll('a')].find(a=>/settings/i.test(a.textContent));settings?.parentElement===nav?settings.before(link):nav.appendChild(link)}
  function ensureUi(){
    if($('[data-shift-me-premium]')){ensureNavLink();return true}
    const tabs=$('.mp-tabs'),existing=$('.mp-panel');if(!tabs||!existing)return false;
    const tab=document.createElement('button');tab.type='button';tab.className='mp-tab';tab.dataset.panel='shiftme';tab.textContent='Shift Me';tabs.appendChild(tab);
    const panel=document.createElement('section');panel.id='panel-shiftme';panel.className='mp-panel';panel.dataset.shiftMePremium='v2';
    panel.innerHTML=`
      <div class="sm-hero">
        <div><p class="sm-kicker">SHIFT ME</p><h2>Make him yours.</h2><p class="sm-lead">Build your bloke, change the details and save him to your Shift.</p></div>
        <div class="sm-summary" aria-live="polite"><p class="sm-step">Live summary</p><dl data-shift-me-summary></dl></div>
      </div>
      <div class="sm-layout">
        <div class="sm-stage">
          <div class="sm-image-shell">
            <img data-shift-me-image alt="Your saved Shift Me" hidden>
            <div data-shift-me-empty class="sm-empty"><span class="sm-empty-mark" aria-hidden="true">S</span><strong>Your bloke starts here.</strong><span>Choose the details, then build the first version.</span></div>
            <div data-shift-me-busy class="sm-busy" hidden><span class="sm-spinner" aria-hidden="true"></span><strong>Sorting your bloke…</strong><span>Holding his identity steady while Shift changes only what you asked for.</span></div>
          </div>
          <div class="sm-view-switch" aria-label="Choose avatar view">${controls.view.map(v=>`<button type="button" class="${v==='Front'?'active':''}" data-shift-me-view="${v}">${v}</button>`).join('')}</div>
          <p data-shift-me-status class="sm-status" role="status" aria-live="polite"></p>
        </div>
        <div class="sm-creator">
          <div class="sm-builder">
            <div class="sm-categories" aria-label="Character categories">${Object.keys(controls).filter(k=>k!=='view').map(categoryButton).join('')}</div>
            <div class="sm-options">${Object.keys(controls).filter(k=>k!=='view').map(optionButtons).join('')}</div>
          </div>
          <details class="sm-photo"><summary>Want him closer to you?</summary><p>Add one clear photo. It is used for the render and is not retained.</p><label class="sm-upload"><span>Choose a photo</span><input data-shift-me-file type="file" accept="image/jpeg,image/png,image/webp"></label><p>JPG, PNG or WebP · maximum 3MB · one adult · decent light.</p></details>
          <div class="sm-actions">
            <button type="button" class="btn sm-rerender" data-shift-me-rerender disabled>Rerender my Shift Me</button>
            <button type="button" class="btn btn-primary sm-save" data-shift-me-create>Save to my Shift</button>
            <button type="button" class="sm-delete" data-shift-me-delete disabled>Delete my Shift Me</button>
          </div>
          <p class="sm-fine">Your Shift Me is a character for your member journey—not a body scan, health assessment, fit guarantee or prediction of future appearance.</p>
        </div>
      </div>`;
    existing.parentNode.append(panel);tab.onclick=()=>activate();const portalTab=$('[data-portal-panel="shiftme"]');if(portalTab)portalTab.onclick=e=>{e.preventDefault();activate()};bind(panel);renderState(panel);ensureNavLink();if(location.hash==='#shiftme'||sessionStorage.getItem('sst-open-shiftme')==='1'){sessionStorage.removeItem('sst-open-shiftme');activate()}load(panel);return true;
  }
  function activate(){$$('.mp-tab').forEach(x=>x.classList.toggle('active',x.dataset.panel==='shiftme'));$$('[data-portal-panel]').forEach(x=>{const on=x.dataset.portalPanel==='shiftme';on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});$$('.mp-panel').forEach(x=>x.classList.toggle('active',x.id==='panel-shiftme'));history.replaceState(null,'','#shiftme')}
  function appearance(){return {...state}}
  function setAppearance(panel,data){for(const key of Object.keys(state))if(controls[key]?.includes(data?.[key]))state[key]=data[key];renderState(panel)}
  function renderState(panel){
    $$('[data-shift-me-control]',panel).forEach(b=>b.classList.toggle('selected',state[b.dataset.shiftMeControl]===b.dataset.value));
    $$('[data-shift-me-view]',panel).forEach(b=>b.classList.toggle('active',state.view===b.dataset.shiftMeView));
    const summary=$('[data-shift-me-summary]',panel);summary.innerHTML=['build','hair','facial','skin','eyes','top'].map(k=>`<div><dt>${esc(labels[k])}</dt><dd>${esc(state[k])}</dd></div>`).join('');
    if(panel.dataset.hasShiftMe)status(panel,'Changes ready. Rerender to see them, then they are saved automatically.');
  }
  function status(panel,msg,bad=false){const e=$('[data-shift-me-status]',panel);e.textContent=msg||'';e.classList.toggle('bad',bad)}
  function busy(panel,on){$('[data-shift-me-busy]',panel).hidden=!on;for(const b of $$('button,input',panel))b.disabled=on||(b.matches('[data-shift-me-rerender],[data-shift-me-delete]')&&!panel.dataset.hasShiftMe)}
  function showSaved(panel,record){
    panel.dataset.hasShiftMe=record?'1':'';const img=$('[data-shift-me-image]',panel),empty=$('[data-shift-me-empty]',panel);img.hidden=!record;empty.hidden=!!record;
    if(record){img.src=(window.SST_SHIFT_ME?.shiftMeImageUrl?.()||'/v1/shift-me/image?ts='+Date.now());setAppearance(panel,record.appearance||{});status(panel,'Your Shift Me is saved. Change a detail or view and rerender whenever you fancy.')}else status(panel,'Choose the details, then save your first Shift Me.');
    $('[data-shift-me-rerender]',panel).disabled=!record;$('[data-shift-me-delete]',panel).disabled=!record;
  }
  async function load(panel){try{const r=await window.SST_SHIFT_ME.getShiftMe();showSaved(panel,r.shiftMe||null)}catch(e){status(panel,e.message||'Could not load your Shift Me.',true)}}
  async function create(panel){
    const file=$('[data-shift-me-file]',panel).files?.[0];if(file?.size>3_000_000){status(panel,'That photo is over 3MB. Choose a smaller one.',true);return}
    busy(panel,true);status(panel,'');try{const r=file?await window.SST_SHIFT_ME.renderShiftMe(file,appearance()):await window.SST_SHIFT_ME.createShiftMe(appearance());showSaved(panel,r.shiftMe);$('[data-shift-me-file]',panel).value=''}catch(e){status(panel,e.message||'Shift Me could not build that version.',true)}finally{busy(panel,false)}
  }
  async function rerender(panel){busy(panel,true);status(panel,'');try{const r=await window.SST_SHIFT_ME.rerenderShiftMe(appearance());showSaved(panel,r.shiftMe)}catch(e){status(panel,e.message||'Could not apply those changes.',true)}finally{busy(panel,false)}}
  function bind(panel){
    $$('[data-shift-me-category]',panel).forEach(b=>b.onclick=()=>{$$('[data-shift-me-category]',panel).forEach(x=>x.classList.toggle('active',x===b));$$('[data-shift-me-options]',panel).forEach(x=>x.classList.toggle('active',x.dataset.shiftMeOptions===b.dataset.shiftMeCategory))});
    $$('[data-shift-me-control]',panel).forEach(b=>b.onclick=()=>{state[b.dataset.shiftMeControl]=b.dataset.value;renderState(panel)});
    $$('[data-shift-me-view]',panel).forEach(b=>b.onclick=()=>{state.view=b.dataset.shiftMeView;renderState(panel)});
    $('[data-shift-me-create]',panel).onclick=()=>create(panel);$('[data-shift-me-rerender]',panel).onclick=()=>rerender(panel);
    $('[data-shift-me-delete]',panel).onclick=async()=>{if(!confirm('Delete your saved Shift Me?'))return;busy(panel,true);try{await window.SST_SHIFT_ME.deleteShiftMe();showSaved(panel,null);status(panel,'Your Shift Me has been deleted.')}catch(e){status(panel,e.message||'Could not delete your Shift Me.',true)}finally{busy(panel,false)}};
  }
  function boot(){if(!window.SST_SHIFT_ME)return setTimeout(boot,50);if(ensureUi())return;setTimeout(boot,100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
