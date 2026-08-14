// Shift Me premium creator — extends the existing member dashboard; does not create a second shell.
(function(){
  'use strict';
  if(!/^\/member\/dashboard(?:\.html)?$/.test(location.pathname))return;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const controls={
    build:['Slim','Average','Stocky','Bigger bloke','Broad','Tall','Shorter'],
    bodyShape:['Straight','Round middle','Broad shoulders','Narrow shoulders','Long torso','Short torso'],
    face:['Round','Oval','Square','Longer','Fuller','Angular'],
    hair:['Short','Shaved','Receding','Buzz cut','Curly','Longer','Bald'],
    hairline:['Full','Mature','Receding','High','Shaved','Bald'],
    facial:['Clean shaven','Stubble','Short beard','Full beard','Moustache','Goatee'],
    skin:['Light','Light-medium','Medium','Olive','Brown','Deep'],
    eyes:['Brown','Blue','Green','Hazel','Grey'],
    glasses:['Keep source glasses','No glasses','Black rectangular','Black round','Thin metal'],
    top:['Black tee','Olive tee','White tee','Grey marl vest','Black polo','Black hoodie','Olive hoodie','Black quarter zip'],
    bottom:['Black shorts','Olive joggers','Black joggers'],
    accessory:['None','Black cap']
  };
  const labels={build:'Build',bodyShape:'Body shape',face:'Face shape',hair:'Hair',hairline:'Hairline',facial:'Facial hair',skin:'Skin tone',eyes:'Eye colour',glasses:'Glasses',top:'Top',bottom:'Bottoms',accessory:'Accessory'};
  function optionSelect(key){return `<label class="sm-field"><span>${labels[key]}</span><select data-shift-me-control="${key}"><option value="">Keep it natural</option>${controls[key].map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>`}
  function ensureUi(){
    if($('[data-shift-me-premium]'))return true;
    const tabs=$('.mp-tabs'), existing=$('.mp-panel'); if(!tabs||!existing)return false;
    const tab=document.createElement('button');tab.type='button';tab.className='mp-tab';tab.dataset.panel='shiftme';tab.textContent='Shift Me';tabs.appendChild(tab);
    const panel=document.createElement('section');panel.id='panel-shiftme';panel.className='mp-panel';panel.dataset.shiftMePremium='v1';
    panel.innerHTML=`<div class="sm-hero"><div><p class="sm-kicker">YOUR SHIFT ME</p><h2>Make it look like you. Then make it yours.</h2><p class="sm-lead">Start with one clear photo. Shift keeps the bloke recognisably you while you change the bits you actually choose.</p></div><div class="sm-privacy">Your source photo is used for the render and is not retained by Shift. Your generated Shift Me is private to your account.</div></div><div class="sm-layout"><div class="sm-stage"><div class="sm-image-shell"><img data-shift-me-image alt="Your saved Shift Me" hidden><div data-shift-me-empty class="sm-empty"><strong>No fake mannequin.</strong><span>Add a clear front-facing photo to create your own Shift Me.</span></div><div data-shift-me-busy class="sm-busy" hidden><span class="sm-spinner" aria-hidden="true"></span><strong>Building your Shift Me…</strong><span>Keeping the face and identity anchored while the render is made.</span></div></div><p data-shift-me-status class="sm-status" role="status" aria-live="polite"></p></div><div class="sm-creator"><div class="sm-photo"><p class="sm-step">01 · START WITH YOU</p><label class="sm-upload"><span>Choose a photo</span><input data-shift-me-file type="file" accept="image/jpeg,image/png,image/webp"></label><p>JPG, PNG or WebP · maximum 3MB · clear face, decent light, one adult.</p></div><div class="sm-controls"><p class="sm-step">02 · TUNE THE LOOK</p><div class="sm-control-grid">${Object.keys(controls).map(optionSelect).join('')}</div></div><div class="sm-actions"><button type="button" class="btn btn-primary" data-shift-me-create>Create my Shift Me</button><button type="button" class="btn" data-shift-me-rerender disabled>Apply changes</button><button type="button" class="sm-delete" data-shift-me-delete disabled>Delete my Shift Me</button></div><p class="sm-fine">Shift Me is an AI-generated visual likeness for Shift experiences. It is not identity verification, not a body scan, not a health assessment, not a fit guarantee and not a prediction of future appearance.</p></div></div>`;
    existing.parentNode.insertBefore(panel,existing.parentNode.lastChild?.nextSibling||null);
    tab.onclick=()=>activate();
    bind(panel); if(location.hash==='#shiftme')activate(); load(panel); return true;
  }
  function activate(){
    $$('.mp-tab').forEach(x=>x.classList.toggle('active',x.dataset.panel==='shiftme'));
    $$('.mp-panel').forEach(x=>x.classList.toggle('active',x.id==='panel-shiftme'));
    history.replaceState(null,'','#shiftme');
  }
  function appearance(panel){return Object.fromEntries($$('[data-shift-me-control]',panel).map(s=>[s.dataset.shiftMeControl,s.value]).filter(([,v])=>v));}
  function setAppearance(panel,data){for(const s of $$('[data-shift-me-control]',panel))if(data?.[s.dataset.shiftMeControl]&&[...s.options].some(o=>o.value===data[s.dataset.shiftMeControl]))s.value=data[s.dataset.shiftMeControl];}
  function status(panel,msg,bad=false){const e=$('[data-shift-me-status]',panel);e.textContent=msg||'';e.classList.toggle('bad',bad);}
  function busy(panel,on){$('[data-shift-me-busy]',panel).hidden=!on;for(const b of $$('button,input,select',panel))b.disabled=on||(b.matches('[data-shift-me-rerender],[data-shift-me-delete]')&&!panel.dataset.hasShiftMe);}
  function showSaved(panel,record){
    panel.dataset.hasShiftMe=record?'1':'';const img=$('[data-shift-me-image]',panel),empty=$('[data-shift-me-empty]',panel);img.hidden=!record;empty.hidden=!!record;
    if(record){img.src=(window.SST_SHIFT_ME?.shiftMeImageUrl?.()||'/v1/shift-me/image?ts='+Date.now());setAppearance(panel,record.appearance||{});status(panel,'Saved to your Shift account. Change a control and apply it whenever you want.');}
    $('[data-shift-me-rerender]',panel).disabled=!record;$('[data-shift-me-delete]',panel).disabled=!record;
  }
  async function load(panel){try{const r=await window.SST_SHIFT_ME.getShiftMe();showSaved(panel,r.shiftMe||null)}catch(e){status(panel,e.message||'Could not load your Shift Me.',true)}}
  function bind(panel){
    $('[data-shift-me-create]',panel).onclick=async()=>{const file=$('[data-shift-me-file]',panel).files?.[0];if(!file){status(panel,'Choose a clear photo first.',true);return}if(file.size>3_000_000){status(panel,'That photo is over 3MB. Choose a smaller one.',true);return}busy(panel,true);status(panel,'');try{const r=await window.SST_SHIFT_ME.renderShiftMe(file,appearance(panel));showSaved(panel,r.shiftMe);$('[data-shift-me-file]',panel).value=''}catch(e){status(panel,e.message||'Shift Me could not render that photo.',true)}finally{busy(panel,false)}};
    $('[data-shift-me-rerender]',panel).onclick=async()=>{busy(panel,true);status(panel,'');try{const r=await window.SST_SHIFT_ME.rerenderShiftMe(appearance(panel));showSaved(panel,r.shiftMe)}catch(e){status(panel,e.message||'Could not apply those changes.',true)}finally{busy(panel,false)}};
    $('[data-shift-me-delete]',panel).onclick=async()=>{if(!confirm('Delete your saved Shift Me?'))return;busy(panel,true);try{await window.SST_SHIFT_ME.deleteShiftMe();showSaved(panel,null);status(panel,'Your Shift Me has been deleted.')}catch(e){status(panel,e.message||'Could not delete your Shift Me.',true)}finally{busy(panel,false)}};
  }
  function boot(){if(!window.SST_SHIFT_ME)return setTimeout(boot,50);if(ensureUi())return;setTimeout(boot,100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
