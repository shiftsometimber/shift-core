// G2-014-PREMIUM-PROGRESS-PICTURE — presentation only; persistence remains owned by member-product-v33d.js.
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const panel=()=>$('#panel-visualise');

  function addIntro(p){
    if(p.querySelector('[data-g2014-intro]'))return;
    const firstHeading=p.querySelector(':scope > h2, h2');
    const intro=document.createElement('section');
    intro.className='mp-picture-intro';
    intro.dataset.g2014Intro='v1';
    intro.setAttribute('aria-label','Progress Picture introduction');
    intro.innerHTML='<div class="mp-picture-intro-copy"><span class="eyebrow">PRIVATE PROGRESS</span><h3>See the change, not just the number.</h3><p>Keep a real photo alongside the measurements that matter to you. Shift keeps the original in your private member account so you can come back to it later.</p></div><div class="mp-picture-trust"><strong>Your photo. Your account.</strong><span>Private to your Shift account · delete it whenever you want.</span></div>';
    if(firstHeading)firstHeading.insertAdjacentElement('afterend',intro);else p.prepend(intro);
  }

  function markControls(p){
    p.dataset.progressPicturePremium='v1';
    p.classList.add('mp-progress-picture-premium');
    const input=$('#photoInput');
    if(input){input.classList.add('mp-premium-file');input.closest('label')?.classList.add('mp-picture-field')}
    const preview=$('#photoPreview');if(preview)preview.classList.add('mp-picture-preview');
    for(const id of ['photoWeightUnit','photoWeightStone','photoWeightPounds','photoWeightKg','photoWeightLbOnly','photoWaistUnit','photoWaist']){
      const el=$('#'+id);if(el){el.classList.add('mp-picture-control');el.closest('label')?.classList.add('mp-picture-field')}
    }
    for(const id of ['visualConsent','savePhotoConsent']){
      const el=$('#'+id);if(el){el.classList.add('mp-picture-consent');el.closest('label')?.classList.add('mp-picture-consent-row')}
    }
    $('#saveOriginal')?.classList.add('mp-picture-primary-action');
    $('#visualStatus')?.classList.add('mp-picture-status');
    p.querySelectorAll('.visual-gen').forEach(b=>b.classList.add('mp-picture-visual-action'));
    p.querySelectorAll('details').forEach(d=>d.classList.add('mp-picture-disclosure'));
    const saved=$('#savedPhotos');if(saved)saved.classList.add('mp-progress-photo-history');
  }

  function decorateHistory(){
    const saved=$('#savedPhotos');if(!saved)return;
    saved.querySelectorAll('[data-photo-id]').forEach(card=>{
      card.classList.add('mp-progress-photo');
      const img=card.querySelector('img[alt="Saved real progress photo"]');
      if(img){img.classList.add('mp-progress-photo-image');img.removeAttribute('style');img.parentElement?.classList.add('mp-progress-photo-media')}
      card.querySelector('[data-photo-delete]')?.classList.add('mp-progress-photo-delete');
      if(!card.querySelector('.mp-progress-photo-kicker')){
        const kicker=document.createElement('div');
        kicker.className='mp-progress-photo-kicker';
        kicker.innerHTML='<span class="eyebrow">SAVED PRIVATELY</span><span>Real progress photo</span>';
        card.prepend(kicker);
      }
    });
    const empty=saved.querySelector(':scope > .mp-muted');if(empty)empty.classList.add('mp-progress-photo-empty');
  }

  function install(){
    const p=panel();if(!p)return false;
    addIntro(p);markControls(p);decorateHistory();
    const saved=$('#savedPhotos');
    if(saved&&!saved.dataset.g2014Observed){
      saved.dataset.g2014Observed='true';
      new MutationObserver(decorateHistory).observe(saved,{childList:true,subtree:true});
    }
    return true;
  }

  function boot(){
    if(install())return;
    const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),20000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
